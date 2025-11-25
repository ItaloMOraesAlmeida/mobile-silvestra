/**
 * Serviço para geração de PDFs a partir de templates HTML
 */

import * as Print from "expo-print";
import {
  ReportConfig,
  ReportData,
  PageOrientation,
  PageSize,
} from "../types/report.types";
import { generateHeaderTemplate } from "../templates/report-header.template";
import { generateEvolutionTemplate } from "../templates/report-evolution.template";
import { generateGoalsTemplate } from "../templates/report-goals.template";
import { generateSummaryTemplate } from "../templates/report-summary.template";
import { generatePhotoComparisonTemplate } from "../templates/report-photo-comparison.template";
import { generateMedicalReportTemplate } from "../templates/report-medical.template";
import { reportStyles } from "../templates/report-styles.css";

/**
 * Resultado da geração de PDF
 */
interface PDFGenerationResult {
  /** Sucesso na geração */
  success: boolean;
  /** URI do arquivo PDF gerado */
  uri?: string;
  /** Número de páginas estimado */
  pageCount?: number;
  /** Mensagem de erro (se falhou) */
  error?: string;
}

class PDFGeneratorService {
  /**
   * Gera um PDF a partir dos dados do relatório
   */
  async generatePDF(
    data: ReportData,
    config: ReportConfig
  ): Promise<PDFGenerationResult> {
    try {
      console.log("🔨 Gerando PDF...");

      // 1. Gerar HTML completo
      const html = this.generateHTML(data, config);

      // 2. Configurar opções do PDF
      const printOptions: Print.PrintOptions = {
        html,
        width: this.getPageWidth(config.pageSize),
        height: this.getPageHeight(config.pageSize, config.orientation),
        orientation:
          config.orientation === PageOrientation.LANDSCAPE
            ? "landscape"
            : "portrait",
      };

      // 3. Gerar PDF
      const { uri } = await Print.printToFileAsync(printOptions);

      console.log("✅ PDF gerado:", uri);

      return {
        success: true,
        uri,
        pageCount: this.estimatePageCount(data),
      };
    } catch (error) {
      console.error("❌ Erro ao gerar PDF:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  /**
   * Gera HTML completo do relatório
   */
  private generateHTML(data: ReportData, config: ReportConfig): string {
    const styles = this.getStyles(config);
    const body = this.generateBody(data, config);

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório ${data.patient.name}</title>
  <style>${styles}</style>
</head>
<body>
  ${body}
</body>
</html>
    `;
  }

  /**
   * Gera o corpo do relatório
   */
  private generateBody(data: ReportData, config: ReportConfig): string {
    const sections: string[] = [];

    // Cabeçalho
    sections.push(this.generateHeader(data));

    // Resumo executivo
    if (config.includeSummary) {
      sections.push(this.generateSummary(data));
    }

    // Seções baseadas no tipo de relatório
    switch (config.type) {
      case "EVOLUTION":
        sections.push(this.generateEvolutionSection(data, config));
        break;
      case "GOALS":
        sections.push(this.generateGoalsSection(data));
        break;
      case "FULL":
        sections.push(this.generateEvolutionSection(data, config));
        sections.push(this.generateGoalsSection(data));
        break;
      case "PHOTO_COMPARISON":
        sections.push(this.generatePhotoComparisonSection(data));
        break;
      case "MEDICAL":
        return this.generateMedicalReport(data); // Relatório médico é diferente
    }

    // Recomendações
    if (config.includeRecommendations) {
      sections.push(this.generateRecommendations(data));
    }

    // Rodapé
    sections.push(this.generateFooter(data));

    return sections.join("\n");
  }

  /**
   * Gera cabeçalho do relatório (usando template modular)
   */
  private generateHeader(data: ReportData): string {
    return generateHeaderTemplate({
      patientName: data.patient.name,
      nutritionistName: data.patient.nutritionistName,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Gera resumo executivo (usando template modular)
   */
  private generateSummary(data: ReportData): string {
    return generateSummaryTemplate({
      patientName: data.patient.name,
      totalMeasurements: data.totalMeasurements,
      totalGoals: data.totalGoals,
      achievedGoals: data.achievedGoals,
      statistics: data.statistics,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
    });
  }

  /**
   * Gera seção de evolução (usando template modular)
   */
  private generateEvolutionSection(
    data: ReportData,
    config: ReportConfig
  ): string {
    return generateEvolutionTemplate({
      measurements: data.measurements,
      statistics: data.statistics,
      includeCharts: config.includeCharts,
      includePhotos: config.includePhotos,
    });
  }

  /**
   * Gera seção de metas (usando template modular)
   */
  private generateGoalsSection(data: ReportData): string {
    const totalGoals = data.goals?.length || 0;
    const achievedGoals = data.goals?.filter((g) => g.achieved).length || 0;

    return generateGoalsTemplate({
      goals: data.goals || [],
      totalGoals,
      achievedGoals,
    });
  }

  /**
   * Gera seção de comparação de fotos
   */
  private generatePhotoComparisonSection(data: ReportData): string {
    // TODO: Implementar busca de fotos do paciente
    // Por enquanto retorna template com dados mock
    return generatePhotoComparisonTemplate({
      patientName: data.patient.name,
      photos: [],
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      totalDays: Math.floor(
        (new Date(data.periodEnd).getTime() -
          new Date(data.periodStart).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      totalWeightLoss: data.statistics.weightChange,
    });
  }

  /**
   * Gera relatório médico completo (estrutura diferente)
   */
  private generateMedicalReport(data: ReportData): string {
    // Relatório médico tem estrutura própria
    const html = generateMedicalReportTemplate({
      patient: {
        name: data.patient.name,
        birthDate: data.patient.birthDate || "",
        age: data.patient.age || 0,
      },
      nutritionist: {
        name: data.patient.nutritionistName || "Nutricionista",
        crn: "CRN XXXXX",
      },
      currentMeasurements: {
        date: data.periodEnd,
        weight: data.statistics.currentWeight,
        height: data.measurements[0]?.height || 1.7,
        bmi: data.statistics.currentBMI,
      },
      nutritionalAssessment: {
        eatingHabits: [],
      },
      diagnosis: {
        anthropometric: `IMC ${data.statistics.currentBMI.toFixed(1)} kg/m²`,
      },
      intervention: {
        objectives: ["Acompanhamento nutricional regular"],
      },
      createdAt: new Date().toISOString(),
    });

    return html;
  }

  /**
   * Gera recomendações
   */
  private generateRecommendations(data: ReportData): string {
    const recommendations: string[] = [];

    // Recomendações baseadas em estatísticas
    if (data.statistics.weightChange < -5) {
      recommendations.push(
        "Excelente progresso na perda de peso! Continue seguindo o plano alimentar."
      );
    } else if (data.statistics.weightChange > 5) {
      recommendations.push(
        "Atenção ao ganho de peso. Revisar o plano alimentar e nível de atividades."
      );
    } else {
      recommendations.push(
        "Peso estável. Manter acompanhamento regular das medições."
      );
    }

    if (data.statistics.currentBMI < 18.5) {
      recommendations.push(
        "IMC abaixo do ideal. Considerar estratégias para ganho de peso saudável."
      );
    } else if (data.statistics.currentBMI > 25) {
      recommendations.push(
        "IMC acima do ideal. Focar em déficit calórico e exercícios regulares."
      );
    }

    if (data.achievedGoals === data.totalGoals && data.totalGoals > 0) {
      recommendations.push(
        "Parabéns! Todas as metas foram alcançadas. Considerar definir novos objetivos."
      );
    }

    return `
<div class="section recommendations">
  <h3>Recomendações</h3>
  <ul class="recommendations-list">
    ${recommendations.map((r) => `<li>${r}</li>`).join("")}
    <li>Manter consultas regulares com o nutricionista.</li>
    <li>Continuar monitoramento semanal das medidas corporais.</li>
    <li>Hidratação adequada (mínimo 2 litros de água por dia).</li>
  </ul>
</div>
    `;
  }

  /**
   * Gera rodapé
   */
  private generateFooter(data: ReportData): string {
    return `
<div class="footer">
  <p>Relatório gerado em ${new Date().toLocaleDateString(
    "pt-BR"
  )} às ${new Date().toLocaleTimeString("pt-BR")}</p>
  <p>SILVESTRA - Sistema de Acompanhamento Nutricional</p>
  <p class="disclaimer">Este relatório é confidencial e destinado exclusivamente ao paciente ${
    data.patient.name
  }.</p>
</div>
    `;
  }

  /**
   * Retorna os estilos CSS (usando template modular)
   */
  private getStyles(_config: ReportConfig): string {
    return reportStyles;
  }

  /**
   * Helpers
   */

  private getPageWidth(pageSize: PageSize): number {
    return pageSize === PageSize.A4 ? 595 : 612; // Pontos (A4: 210mm, Letter: 8.5in)
  }

  private getPageHeight(
    pageSize: PageSize,
    orientation: PageOrientation
  ): number {
    const baseHeight = pageSize === PageSize.A4 ? 842 : 792; // Pontos (A4: 297mm, Letter: 11in)
    return orientation === PageOrientation.LANDSCAPE
      ? this.getPageWidth(pageSize)
      : baseHeight;
  }

  private estimatePageCount(data: ReportData): number {
    // Estimativa simples baseada na quantidade de conteúdo
    let pages = 1; // Cabeçalho + resumo

    if (data.measurements.length > 10) {
      pages += Math.ceil(data.measurements.length / 20);
    }

    if (data.goals.length > 5) {
      pages += Math.ceil(data.goals.length / 6);
    }

    return pages;
  }
}

export const pdfGeneratorService = new PDFGeneratorService();
