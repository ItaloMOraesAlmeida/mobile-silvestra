/**
 * Tipos e interfaces para o sistema de relatórios PDF
 */

/**
 * Tipos de relatórios disponíveis
 */
export enum ReportType {
  /** Relatório de evolução de medidas corporais */
  EVOLUTION = "EVOLUTION",
  /** Relatório de progresso de metas */
  GOALS = "GOALS",
  /** Relatório completo (medidas + metas) */
  FULL = "FULL",
  /** Relatório de comparação de fotos antes/depois */
  PHOTO_COMPARISON = "PHOTO_COMPARISON",
  /** Relatório médico formal para profissionais de saúde */
  MEDICAL = "MEDICAL",
}

/**
 * Formatos de saída do relatório
 */
export enum ReportFormat {
  /** Formato PDF */
  PDF = "PDF",
  /** Formato HTML (para preview) */
  HTML = "HTML",
}

/**
 * Períodos predefinidos para relatórios
 */
export enum ReportPeriod {
  /** Última semana (7 dias) */
  WEEK = "WEEK",
  /** Último mês (30 dias) */
  MONTH = "MONTH",
  /** Últimos 3 meses (90 dias) */
  THREE_MONTHS = "THREE_MONTHS",
  /** Últimos 6 meses (180 dias) */
  SIX_MONTHS = "SIX_MONTHS",
  /** Último ano (365 dias) */
  YEAR = "YEAR",
  /** Período customizado (com datas específicas) */
  CUSTOM = "CUSTOM",
  /** Todos os dados disponíveis */
  ALL = "ALL",
}

/**
 * Orientação da página do PDF
 */
export enum PageOrientation {
  /** Retrato (vertical) */
  PORTRAIT = "PORTRAIT",
  /** Paisagem (horizontal) */
  LANDSCAPE = "LANDSCAPE",
}

/**
 * Tamanho da página do PDF
 */
export enum PageSize {
  /** A4 (210 x 297 mm) */
  A4 = "A4",
  /** Letter (216 x 279 mm) */
  LETTER = "LETTER",
}

/**
 * Status da geração do relatório
 */
export enum ReportStatus {
  /** Aguardando geração */
  PENDING = "PENDING",
  /** Gerando relatório */
  GENERATING = "GENERATING",
  /** Relatório gerado com sucesso */
  COMPLETED = "COMPLETED",
  /** Erro na geração */
  FAILED = "FAILED",
}

/**
 * Configuração para geração de relatório
 */
export interface ReportConfig {
  /** Tipo de relatório a gerar */
  type: ReportType;
  /** Período dos dados */
  period: ReportPeriod;
  /** Data inicial (obrigatório se period = CUSTOM) */
  startDate?: Date;
  /** Data final (obrigatório se period = CUSTOM) */
  endDate?: Date;
  /** Formato de saída */
  format: ReportFormat;
  /** Orientação da página */
  orientation: PageOrientation;
  /** Tamanho da página */
  pageSize: PageSize;
  /** Incluir gráficos no relatório */
  includeCharts: boolean;
  /** Incluir fotos de progresso */
  includePhotos: boolean;
  /** Incluir resumo executivo */
  includeSummary: boolean;
  /** Incluir recomendações (opcional) */
  includeRecommendations: boolean;
}

/**
 * Dados de um paciente para o relatório
 */
export interface ReportPatientData {
  /** ID do paciente */
  id: string;
  /** Nome completo */
  name: string;
  /** Email */
  email?: string;
  /** Data de nascimento */
  birthDate: string;
  /** Idade calculada */
  age: number;
  /** Objetivo do tratamento */
  goal?: string;
  /** Nome do nutricionista */
  nutritionistName?: string;
}

/**
 * Estatísticas de medidas para o relatório
 */
export interface MeasurementStatistics {
  /** Peso inicial */
  initialWeight: number;
  /** Peso atual */
  currentWeight: number;
  /** Peso mínimo no período */
  minWeight: number;
  /** Peso máximo no período */
  maxWeight: number;
  /** Peso médio */
  avgWeight: number;
  /** Variação de peso (kg) */
  weightChange: number;
  /** Variação percentual */
  weightChangePercent: number;
  /** IMC inicial */
  initialBMI: number;
  /** IMC atual */
  currentBMI: number;
  /** IMC médio */
  avgBMI: number;
  /** Variação de IMC */
  bmiChange: number;
  /** Tendência (increasing/decreasing/stable) */
  trend: "increasing" | "decreasing" | "stable";
}

/**
 * Dados de progresso de metas para o relatório
 */
export interface GoalProgress {
  /** ID da meta */
  id: string;
  /** Tipo da meta */
  type: string;
  /** Valor alvo */
  target: number;
  /** Valor atual */
  current: number;
  /** Unidade */
  unit: string;
  /** Progresso em percentual (0-100) */
  progress: number;
  /** Meta alcançada */
  achieved: boolean;
  /** Data de criação */
  createdAt: string;
  /** Data de conquista (se alcançada) */
  achievedAt?: string;
  /** Deadline */
  deadline?: string;
}

/**
 * Dados completos para geração do relatório
 */
export interface ReportData {
  /** Configuração utilizada */
  config: ReportConfig;
  /** Dados do paciente */
  patient: ReportPatientData;
  /** Medidas corporais no período */
  measurements: any[]; // TODO: usar tipo BodyMeasurement
  /** Estatísticas calculadas */
  statistics: MeasurementStatistics;
  /** Metas no período */
  goals: GoalProgress[];
  /** Data inicial efetiva */
  periodStart: string;
  /** Data final efetiva */
  periodEnd: string;
  /** Total de medições */
  totalMeasurements: number;
  /** Total de metas */
  totalGoals: number;
  /** Metas alcançadas */
  achievedGoals: number;
}

/**
 * Metadados de um relatório salvo
 */
export interface ReportMetadata {
  /** ID único do relatório */
  id: string;
  /** ID do paciente */
  patientId: string;
  /** Nome do paciente */
  patientName: string;
  /** Tipo de relatório */
  type: ReportType;
  /** Período */
  period: ReportPeriod;
  /** Data inicial */
  startDate: string;
  /** Data final */
  endDate: string;
  /** Data de criação do relatório */
  createdAt: string;
  /** Criado por (ID do usuário) */
  createdBy: string;
  /** Status */
  status: ReportStatus;
  /** URI do arquivo PDF */
  fileUri?: string;
  /** Tamanho do arquivo (bytes) */
  fileSize?: number;
  /** Número de páginas */
  pageCount?: number;
  /** Versão do template */
  templateVersion: string;
}

/**
 * Resultado da geração de relatório
 */
export interface ReportGenerationResult {
  /** Sucesso na geração */
  success: boolean;
  /** URI do arquivo gerado */
  fileUri?: string;
  /** Metadados do relatório */
  metadata?: ReportMetadata;
  /** Mensagem de erro (se falhou) */
  error?: string;
  /** Tamanho do arquivo */
  fileSize?: number;
  /** Tempo de geração (ms) */
  generationTime?: number;
}

/**
 * Opções para compartilhamento de relatório
 */
export interface ShareOptions {
  /** Título do compartilhamento */
  dialogTitle?: string;
  /** URI do arquivo */
  uri: string;
  /** Tipo MIME */
  mimeType?: string;
  /** UTI (iOS) */
  UTI?: string;
}

/**
 * Labels amigáveis para tipos de relatório
 */
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  [ReportType.EVOLUTION]: "Evolução de Medidas",
  [ReportType.GOALS]: "Progresso de Metas",
  [ReportType.FULL]: "Relatório Completo",
  [ReportType.PHOTO_COMPARISON]: "Comparação de Fotos",
  [ReportType.MEDICAL]: "Relatório Médico",
};

/**
 * Labels amigáveis para períodos
 */
export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  [ReportPeriod.WEEK]: "Última Semana",
  [ReportPeriod.MONTH]: "Último Mês",
  [ReportPeriod.THREE_MONTHS]: "Últimos 3 Meses",
  [ReportPeriod.SIX_MONTHS]: "Últimos 6 Meses",
  [ReportPeriod.YEAR]: "Último Ano",
  [ReportPeriod.CUSTOM]: "Período Personalizado",
  [ReportPeriod.ALL]: "Todos os Dados",
};

/**
 * Configuração padrão de relatório
 */
export const DEFAULT_REPORT_CONFIG: Partial<ReportConfig> = {
  type: ReportType.FULL,
  period: ReportPeriod.MONTH,
  format: ReportFormat.PDF,
  orientation: PageOrientation.PORTRAIT,
  pageSize: PageSize.A4,
  includeCharts: true,
  includePhotos: true,
  includeSummary: true,
  includeRecommendations: false,
};
