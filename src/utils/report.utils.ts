/**
 * Utilitários para relatórios
 * Funções auxiliares para formatação, validação e cálculos
 */

import {
  ReportPeriod,
  ReportType,
  ReportConfig,
  ReportMetadata,
  ReportData,
} from "../types/report.types";

/**
 * Formata o período do relatório para exibição
 */
export function formatReportPeriod(
  period: ReportPeriod,
  startDate?: Date,
  endDate?: Date
): string {
  switch (period) {
    case ReportPeriod.WEEK:
      return "Última semana";
    case ReportPeriod.MONTH:
      return "Último mês";
    case ReportPeriod.THREE_MONTHS:
      return "Últimos 3 meses";
    case ReportPeriod.SIX_MONTHS:
      return "Últimos 6 meses";
    case ReportPeriod.YEAR:
      return "Último ano";
    case ReportPeriod.ALL:
      return "Todos os dados";
    case ReportPeriod.CUSTOM:
      if (startDate && endDate) {
        return `${startDate.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        })} - ${endDate.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}`;
      }
      return "Período customizado";
    default:
      return "Período não especificado";
  }
}

/**
 * Calcula a tendência de uma série de medidas
 */
export function calculateTrend(
  measurements: { date: string; weight: number }[]
): "increasing" | "decreasing" | "stable" {
  if (measurements.length < 2) return "stable";

  // Ordena por data
  const sorted = [...measurements].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calcula regressão linear simples
  const n = sorted.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  sorted.forEach((m, index) => {
    const x = index;
    const y = m.weight;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  // Coeficiente angular (slope)
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  // Threshold de 0.05kg por medição
  if (slope > 0.05) return "increasing";
  if (slope < -0.05) return "decreasing";
  return "stable";
}

/**
 * Calcula a variação percentual entre dois valores
 */
export function calculatePercentChange(
  initial: number,
  current: number
): number {
  if (initial === 0) return 0;
  return ((current - initial) / initial) * 100;
}

/**
 * Gera um nome de arquivo para o relatório
 */
export function generateReportFilename(metadata: ReportMetadata): string {
  const date = new Date(metadata.createdAt);
  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD

  const patientSlug = metadata.patientName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]+/g, "-") // Substitui caracteres especiais por hífens
    .replace(/^-+|-+$/g, ""); // Remove hífens no início/fim

  const typeSlug = metadata.type.toLowerCase();

  return `silvestra_${typeSlug}_${patientSlug}_${dateStr}.pdf`;
}

/**
 * Valida configuração de relatório
 */
export function validateReportConfig(config: ReportConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Valida período customizado
  if (config.period === ReportPeriod.CUSTOM) {
    if (!config.startDate) {
      errors.push("Data inicial é obrigatória para período customizado");
    }
    if (!config.endDate) {
      errors.push("Data final é obrigatória para período customizado");
    }
    if (
      config.startDate &&
      config.endDate &&
      config.startDate > config.endDate
    ) {
      errors.push("Data inicial deve ser anterior à data final");
    }
  }

  // Valida tipo de relatório
  if (!Object.values(ReportType).includes(config.type)) {
    errors.push("Tipo de relatório inválido");
  }

  // Valida período
  if (!Object.values(ReportPeriod).includes(config.period)) {
    errors.push("Período inválido");
  }

  // Aviso se todas as opções visuais estiverem desabilitadas
  if (
    config.type === ReportType.EVOLUTION &&
    !config.includeCharts &&
    !config.includePhotos
  ) {
    errors.push(
      "Relatório de evolução precisa incluir gráficos ou fotos para ser útil"
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Estima o tamanho do relatório em bytes (aproximado)
 */
export function estimateReportSize(
  data: ReportData,
  config: ReportConfig
): number {
  let size = 50000; // Base: 50KB (HTML + CSS + estrutura básica)

  // Por medição (tabela + dados)
  size += data.measurements.length * 200; // ~200 bytes por medição

  // Por meta
  size += data.goals.length * 300; // ~300 bytes por meta

  // Gráficos (SVG)
  if (config.includeCharts) {
    size += 15000; // ~15KB por gráfico SVG
  }

  // Fotos (placeholders ou reais)
  if (config.includePhotos) {
    size += 100000; // ~100KB por foto (estimativa conservadora)
  }

  // Resumo executivo
  if (config.includeSummary) {
    size += 5000; // ~5KB
  }

  // Recomendações
  if (config.includeRecommendations) {
    size += 3000; // ~3KB
  }

  // Páginas adicionais
  const estimatedPages = Math.ceil(
    (data.measurements.length + data.goals.length) / 15
  );
  size += estimatedPages * 10000; // ~10KB por página extra

  return size;
}

/**
 * Formata tamanho de arquivo em formato legível
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Retorna ícone apropriado para tipo de relatório
 */
export function getReportTypeIcon(type: ReportType): string {
  switch (type) {
    case ReportType.EVOLUTION:
      return "trending-up";
    case ReportType.GOALS:
      return "trophy";
    case ReportType.FULL:
      return "documents";
    default:
      return "document-text";
  }
}

/**
 * Retorna label amigável para tipo de relatório
 */
export function getReportTypeLabel(type: ReportType): string {
  switch (type) {
    case ReportType.EVOLUTION:
      return "Evolução";
    case ReportType.GOALS:
      return "Metas";
    case ReportType.FULL:
      return "Completo";
    default:
      return "Relatório";
  }
}

/**
 * Retorna cor para tipo de relatório
 */
export function getReportTypeColor(type: ReportType): string {
  switch (type) {
    case ReportType.EVOLUTION:
      return "#3b82f6"; // blue
    case ReportType.GOALS:
      return "#f59e0b"; // amber
    case ReportType.FULL:
      return "#8b5cf6"; // purple
    default:
      return "#6b7280"; // gray
  }
}

/**
 * Calcula datas de início e fim baseado no período
 */
export function calculatePeriodDates(period: ReportPeriod): {
  startDate: Date;
  endDate: Date;
} {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case ReportPeriod.WEEK:
      startDate.setDate(endDate.getDate() - 7);
      break;
    case ReportPeriod.MONTH:
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case ReportPeriod.THREE_MONTHS:
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case ReportPeriod.SIX_MONTHS:
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case ReportPeriod.YEAR:
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case ReportPeriod.ALL:
      startDate.setFullYear(2000); // Data muito antiga para pegar tudo
      break;
    default:
      // Para CUSTOM, retorna data atual (será sobrescrito)
      break;
  }

  return { startDate, endDate };
}

/**
 * Verifica se um relatório está expirado (>90 dias)
 */
export function isReportExpired(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 90;
}

/**
 * Calcula consistência do paciente (% de dias com medição)
 */
export function calculateConsistency(
  measurements: { date: string }[],
  periodDays: number
): number {
  if (periodDays === 0 || measurements.length === 0) return 0;

  // Conta dias únicos com medição
  const uniqueDays = new Set(
    measurements.map((m) => new Date(m.date).toDateString())
  );

  return Math.min((uniqueDays.size / periodDays) * 100, 100);
}

/**
 * Classifica IMC
 */
export function classifyBMI(bmi: number): {
  classification: string;
  color: string;
} {
  if (bmi < 18.5) {
    return { classification: "Abaixo do peso", color: "#fbbf24" };
  } else if (bmi < 25) {
    return { classification: "Peso normal", color: "#16a34a" };
  } else if (bmi < 30) {
    return { classification: "Sobrepeso", color: "#f59e0b" };
  } else if (bmi < 35) {
    return { classification: "Obesidade Grau I", color: "#f97316" };
  } else if (bmi < 40) {
    return { classification: "Obesidade Grau II", color: "#ef4444" };
  } else {
    return { classification: "Obesidade Grau III", color: "#dc2626" };
  }
}
