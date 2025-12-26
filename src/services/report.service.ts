/**
 * Serviço principal para geração e gerenciamento de relatórios PDF
 */

import { Paths, Directory, File } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { reportStore } from "../stores/report.store";
import { useAuthStore } from "../stores/auth.store";
import { pdfGeneratorService } from "./pdf-generator.service";
import {
  API_CONFIG,
  API_ENDPOINTS,
  INTEGRATION_STATUS,
  getHeaders,
} from "../config/api.config";
import {
  ReportConfig,
  ReportData,
  ReportMetadata,
  ReportGenerationResult,
  ReportType,
  ReportPeriod,
  ReportStatus,
  MeasurementStatistics,
  GoalProgress,
  ReportPatientData,
} from "../types/report.types";

/**
 * Constantes
 */
const TEMPLATE_VERSION = "1.0.0";
const MAX_REPORT_AGE_DAYS = 90;

class ReportService {
  private reportDirectory: Directory;

  constructor() {
    // Criar instância do diretório de relatórios
    this.reportDirectory = new Directory(Paths.document, "reports");
  }

  /**
   * Inicializa o serviço (cria diretório de relatórios)
   */
  async initialize(): Promise<void> {
    try {
      // Criar diretório se não existir
      await this.reportDirectory.create();
    } catch (error) {
      console.error("Erro ao inicializar ReportService:", error);
      throw error;
    }
  }

  /**
   * Gera um relatório completo
   */
  async generateReport(
    patientId: string,
    config: ReportConfig,
    userId: string
  ): Promise<ReportGenerationResult> {
    const startTime = Date.now();

    try {
      // 1. Criar metadados iniciais
      const metadata = await this.createReportMetadata(
        patientId,
        config,
        userId
      );

      // 2. Atualizar store com status "generating"
      reportStore.getState().setGenerating(true, metadata.id);

      // 3. Buscar dados do paciente e medições
      const reportData = await this.prepareReportData(patientId, config);

      // 4. Gerar PDF
      const pdfResult = await pdfGeneratorService.generatePDF(
        reportData,
        config
      );

      if (!pdfResult.success || !pdfResult.uri) {
        throw new Error(pdfResult.error || "Falha ao gerar PDF");
      }

      // 5. Salvar arquivo
      const fileUri = await this.saveReportFile(pdfResult.uri, metadata.id);

      // 6. Obter tamanho do arquivo
      const file = new File(fileUri);
      const fileSize = await file.size;

      // 7. Atualizar metadados
      const finalMetadata: ReportMetadata = {
        ...metadata,
        status: ReportStatus.COMPLETED,
        fileUri,
        fileSize,
        pageCount: pdfResult.pageCount || 1,
      };

      // 8. Salvar no store
      reportStore.getState().addReport(finalMetadata);
      reportStore.getState().setGenerating(false);

      const generationTime = Date.now() - startTime;

      return {
        success: true,
        fileUri,
        metadata: finalMetadata,
        fileSize,
        generationTime,
      };
    } catch (error) {
      console.error("❌ Erro ao gerar relatório:", error);

      reportStore.getState().setGenerating(false);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        generationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Prepara dados para o relatório
   */
  private async prepareReportData(
    patientId: string,
    config: ReportConfig
  ): Promise<ReportData> {
    const { startDate, endDate } = this.calculatePeriodDates(
      config.period,
      config.startDate,
      config.endDate
    );

    // ============================================================================
    // INTEGRAÇÃO COM API REAL
    // ============================================================================

    if (INTEGRATION_STATUS.AVAILABLE_MODULES.REPORTS) {
      try {
        const token = useAuthStore.getState().tokens?.accessToken;

        if (!token) {
          throw new Error("Token de autenticação não encontrado");
        }

        // 1. Buscar dados do paciente
        const patientResponse = await fetch(
          API_CONFIG.BASE_URL + API_ENDPOINTS.REPORTS.PATIENT_DATA(patientId),
          {
            headers: getHeaders(token),
            signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
          }
        );

        if (!patientResponse.ok) {
          throw new Error(
            `Erro ao buscar dados do paciente: ${patientResponse.status}`
          );
        }

        const patient = await patientResponse.json();

        // 2. Buscar medições no período
        const measurementsResponse = await fetch(
          API_CONFIG.BASE_URL +
            API_ENDPOINTS.REPORTS.MEASUREMENTS(patientId, {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            }),
          {
            headers: getHeaders(token),
            signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
          }
        );

        if (!measurementsResponse.ok) {
          throw new Error(
            `Erro ao buscar medições: ${measurementsResponse.status}`
          );
        }

        const measurements = await measurementsResponse.json();

        // 3. Buscar metas no período
        const goalsResponse = await fetch(
          API_CONFIG.BASE_URL +
            API_ENDPOINTS.REPORTS.GOALS(patientId, {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            }),
          {
            headers: getHeaders(token),
            signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
          }
        );

        if (!goalsResponse.ok) {
          throw new Error(`Erro ao buscar metas: ${goalsResponse.status}`);
        }

        const goals = await goalsResponse.json();

        // 4. Calcular estatísticas
        const statistics = this.calculateStatistics(measurements);

        const achievedGoals = goals.filter((g: any) => g.achieved).length;

        return {
          config,
          patient,
          measurements,
          statistics,
          goals,
          periodStart: startDate.toISOString(),
          periodEnd: endDate.toISOString(),
          totalMeasurements: measurements.length,
          totalGoals: goals.length,
          achievedGoals,
        };
      } catch (error) {
        console.error("Erro ao buscar dados da API, usando mock:", error);
        // Fallback para mock em caso de erro
      }
    }

    // ============================================================================
    // MOCK DATA (Fallback)
    // ============================================================================

    // Mock: Dados do paciente
    const patient: ReportPatientData = {
      id: patientId,
      name: "João da Silva",
      email: "joao@example.com",
      birthDate: "1990-05-15",
      age: 34,
      goal: "Perder 10kg",
      nutritionistName: "Dra. Maria Santos",
    };

    // Mock: Medidas corporais
    const measurements = this.generateMockMeasurements(startDate, endDate);

    // Calcular estatísticas
    const statistics = this.calculateStatistics(measurements);

    // Mock: Metas
    const goals = this.generateMockGoals();

    const achievedGoals = goals.filter((g) => g.achieved).length;

    return {
      config,
      patient,
      measurements,
      statistics,
      goals,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      totalMeasurements: measurements.length,
      totalGoals: goals.length,
      achievedGoals,
    };
  }

  /**
   * Calcula as datas do período
   */
  private calculatePeriodDates(
    period: ReportPeriod,
    customStart?: Date,
    customEnd?: Date
  ): { startDate: Date; endDate: Date } {
    const endDate = customEnd || new Date();
    let startDate: Date;

    switch (period) {
      case ReportPeriod.WEEK:
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case ReportPeriod.MONTH:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case ReportPeriod.THREE_MONTHS:
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case ReportPeriod.SIX_MONTHS:
        startDate = new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case ReportPeriod.YEAR:
        startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case ReportPeriod.CUSTOM:
        if (!customStart) {
          throw new Error("Data inicial obrigatória para período customizado");
        }
        startDate = customStart;
        break;
      case ReportPeriod.ALL:
        startDate = new Date(2020, 0, 1); // Data arbitrária no passado
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
  }

  /**
   * Calcula estatísticas das medidas
   */
  private calculateStatistics(measurements: any[]): MeasurementStatistics {
    if (measurements.length === 0) {
      return {
        initialWeight: 0,
        currentWeight: 0,
        minWeight: 0,
        maxWeight: 0,
        avgWeight: 0,
        weightChange: 0,
        weightChangePercent: 0,
        initialBMI: 0,
        currentBMI: 0,
        avgBMI: 0,
        bmiChange: 0,
        trend: "stable",
      };
    }

    const weights = measurements.map((m) => m.weight);
    const bmis = measurements.map((m) => m.bmi);

    const initialWeight = weights[0];
    const currentWeight = weights[weights.length - 1];
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;

    const weightChange = currentWeight - initialWeight;
    const weightChangePercent =
      initialWeight > 0 ? (weightChange / initialWeight) * 100 : 0;

    const initialBMI = bmis[0];
    const currentBMI = bmis[bmis.length - 1];
    const avgBMI = bmis.reduce((a, b) => a + b, 0) / bmis.length;
    const bmiChange = currentBMI - initialBMI;

    // Determinar tendência
    let trend: "increasing" | "decreasing" | "stable" = "stable";
    if (Math.abs(weightChange) > 0.5) {
      trend = weightChange > 0 ? "increasing" : "decreasing";
    }

    return {
      initialWeight,
      currentWeight,
      minWeight,
      maxWeight,
      avgWeight,
      weightChange,
      weightChangePercent,
      initialBMI,
      currentBMI,
      avgBMI,
      bmiChange,
      trend,
    };
  }

  /**
   * Cria metadados iniciais do relatório
   */
  private async createReportMetadata(
    patientId: string,
    config: ReportConfig,
    userId: string
  ): Promise<ReportMetadata> {
    const { startDate, endDate } = this.calculatePeriodDates(
      config.period,
      config.startDate,
      config.endDate
    );

    const metadata: ReportMetadata = {
      id: this.generateReportId(),
      patientId,
      patientName: "Carregando...", // TODO: buscar da API
      type: config.type,
      period: config.period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: userId,
      status: ReportStatus.GENERATING,
      templateVersion: TEMPLATE_VERSION,
    };

    return metadata;
  }

  /**
   * Salva arquivo do relatório
   */
  private async saveReportFile(
    tempUri: string,
    reportId: string
  ): Promise<string> {
    const filename = `report_${reportId}.pdf`;
    const targetFile = new File(this.reportDirectory, filename);

    // Copiar arquivo temporário para diretório de relatórios
    const tempFile = new File(tempUri);
    await tempFile.copy(targetFile);

    // Deletar arquivo temporário
    await tempFile.delete();

    return targetFile.uri;
  }

  /**
   * Compartilha um relatório
   */
  async shareReport(reportId: string): Promise<boolean> {
    try {
      const report = reportStore.getState().getReportById(reportId);

      if (!report || !report.fileUri) {
        throw new Error("Relatório não encontrado");
      }

      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        throw new Error("Compartilhamento não disponível neste dispositivo");
      }

      await Sharing.shareAsync(report.fileUri, {
        dialogTitle: `Compartilhar ${
          report.patientName
        } - ${this.formatReportType(report.type)}`,
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
      });

      return true;
    } catch (error) {
      console.error("❌ Erro ao compartilhar relatório:", error);
      return false;
    }
  }

  /**
   * Deleta um relatório
   */
  async deleteReport(reportId: string): Promise<boolean> {
    try {
      const report = reportStore.getState().getReportById(reportId);

      if (!report) {
        throw new Error("Relatório não encontrado");
      }

      // Deletar arquivo físico
      if (report.fileUri) {
        const file = new File(report.fileUri);
        if (file.exists) {
          await file.delete();
        }
      }

      // Remover do store
      reportStore.getState().removeReport(reportId);

      return true;
    } catch (error) {
      console.error("❌ Erro ao deletar relatório:", error);
      return false;
    }
  }

  /**
   * Lista todos os relatórios
   */
  async getReports(patientId?: string): Promise<ReportMetadata[]> {
    const allReports = reportStore.getState().reports;

    if (patientId) {
      return allReports.filter(
        (r: ReportMetadata) => r.patientId === patientId
      );
    }

    return allReports;
  }

  /**
   * Limpa relatórios antigos
   */
  async cleanupOldReports(): Promise<number> {
    try {
      const reports = reportStore.getState().reports;
      const now = new Date();
      let deletedCount = 0;

      for (const report of reports) {
        const age = now.getTime() - new Date(report.createdAt).getTime();
        const ageDays = age / (1000 * 60 * 60 * 24);

        if (ageDays > MAX_REPORT_AGE_DAYS) {
          await this.deleteReport(report.id);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error("❌ Erro ao limpar relatórios:", error);
      return 0;
    }
  }

  /**
   * Helpers
   */

  private generateReportId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatReportType(type: ReportType): string {
    const labels: Record<ReportType, string> = {
      [ReportType.EVOLUTION]: "Evolução",
      [ReportType.GOALS]: "Metas",
      [ReportType.FULL]: "Completo",
      [ReportType.PHOTO_COMPARISON]: "Comparação de Fotos",
      [ReportType.MEDICAL]: "Relatório Médico",
    };
    return labels[type];
  }

  /**
   * Métodos mock para desenvolvimento
   */

  private generateMockMeasurements(startDate: Date, endDate: Date): any[] {
    const measurements: any[] = [];
    const daysDiff = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const numMeasurements = Math.min(daysDiff, 30); // Max 30 medições

    let weight = 85; // Peso inicial
    const height = 1.75; // Altura fixa

    for (let i = 0; i < numMeasurements; i++) {
      const date = new Date(
        startDate.getTime() +
          (i * daysDiff * 24 * 60 * 60 * 1000) / numMeasurements
      );

      // Simular perda de peso gradual
      weight -= Math.random() * 0.5;

      const bmi = weight / (height * height);

      measurements.push({
        id: `measurement_${i}`,
        date: date.toISOString(),
        weight: parseFloat(weight.toFixed(1)),
        height,
        bmi: parseFloat(bmi.toFixed(1)),
        bodyFat: parseFloat((20 + Math.random() * 5).toFixed(1)),
        muscleMass: parseFloat((30 + Math.random() * 3).toFixed(1)),
      });
    }

    return measurements;
  }

  private generateMockGoals(): GoalProgress[] {
    return [
      {
        id: "goal_1",
        type: "Peso",
        target: 75,
        current: 80.5,
        unit: "kg",
        progress: 54,
        achieved: false,
        createdAt: new Date(
          Date.now() - 60 * 24 * 60 * 60 * 1000
        ).toISOString(),
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "goal_2",
        type: "IMC",
        target: 24,
        current: 26.2,
        unit: "",
        progress: 75,
        achieved: false,
        createdAt: new Date(
          Date.now() - 60 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        id: "goal_3",
        type: "Gordura Corporal",
        target: 15,
        current: 15,
        unit: "%",
        progress: 100,
        achieved: true,
        createdAt: new Date(
          Date.now() - 90 * 24 * 60 * 60 * 1000
        ).toISOString(),
        achievedAt: new Date(
          Date.now() - 10 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    ];
  }
}

export const reportService = new ReportService();
