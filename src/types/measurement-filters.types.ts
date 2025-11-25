/**
 * Tipos para o sistema de filtros de medições
 */

export type SortField = "date" | "weight" | "bmi";
export type SortOrder = "asc" | "desc";
export type PhotoFilter = "all" | "with" | "without";

/**
 * Período de filtro
 */
export interface FilterPeriod {
  label: string;
  value: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Filtros de medições
 */
export interface MeasurementFilters {
  // Período
  period: string; // "week" | "month" | "3months" | "6months" | "year" | "all" | "custom"
  startDate?: Date;
  endDate?: Date;

  // Faixa de IMC
  minBMI?: number;
  maxBMI?: number;

  // Filtro de fotos
  photos: PhotoFilter;

  // Ordenação
  sortField: SortField;
  sortOrder: SortOrder;
}

/**
 * Filtros padrão
 */
export const DEFAULT_FILTERS: MeasurementFilters = {
  period: "all",
  photos: "all",
  sortField: "date",
  sortOrder: "desc",
};

/**
 * Opções de período pré-definidas
 */
export const PERIOD_OPTIONS: FilterPeriod[] = [
  { label: "Última semana", value: "week" },
  { label: "Último mês", value: "month" },
  { label: "Últimos 3 meses", value: "3months" },
  { label: "Últimos 6 meses", value: "6months" },
  { label: "Último ano", value: "year" },
  { label: "Todas", value: "all" },
  { label: "Personalizado", value: "custom" },
];

/**
 * Opções de filtro de fotos
 */
export const PHOTO_OPTIONS = [
  { label: "Todas", value: "all" as PhotoFilter },
  { label: "Com fotos", value: "with" as PhotoFilter },
  { label: "Sem fotos", value: "without" as PhotoFilter },
];

/**
 * Opções de ordenação
 */
export const SORT_OPTIONS = [
  {
    label: "Data (mais recente)",
    field: "date" as SortField,
    order: "desc" as SortOrder,
  },
  {
    label: "Data (mais antiga)",
    field: "date" as SortField,
    order: "asc" as SortOrder,
  },
  {
    label: "Peso (maior)",
    field: "weight" as SortField,
    order: "desc" as SortOrder,
  },
  {
    label: "Peso (menor)",
    field: "weight" as SortField,
    order: "asc" as SortOrder,
  },
  {
    label: "IMC (maior)",
    field: "bmi" as SortField,
    order: "desc" as SortOrder,
  },
  {
    label: "IMC (menor)",
    field: "bmi" as SortField,
    order: "asc" as SortOrder,
  },
];

/**
 * Calcula as datas de início e fim baseado no período
 */
export const getPeriodDates = (
  period: string
): { startDate?: Date; endDate?: Date } => {
  const now = new Date();
  const endDate = new Date();
  let startDate: Date | undefined;

  switch (period) {
    case "week":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "month":
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case "3months":
      startDate = new Date(now.setMonth(now.getMonth() - 3));
      break;
    case "6months":
      startDate = new Date(now.setMonth(now.getMonth() - 6));
      break;
    case "year":
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    case "all":
      startDate = undefined;
      break;
    default:
      startDate = undefined;
  }

  return period === "all" ? {} : { startDate, endDate };
};

/**
 * Conta quantos filtros estão ativos
 */
export const countActiveFilters = (filters: MeasurementFilters): number => {
  let count = 0;

  // Período
  if (filters.period !== "all") count++;

  // IMC
  if (filters.minBMI !== undefined || filters.maxBMI !== undefined) count++;

  // Fotos
  if (filters.photos !== "all") count++;

  // Ordenação (não conta como filtro ativo)

  return count;
};
