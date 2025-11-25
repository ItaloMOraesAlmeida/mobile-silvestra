/**
 * Evolution Hooks - Index
 *
 * Centralized exports for all evolution hooks
 */

export { usePatientEvolution } from "./usePatientEvolution";
export type { Period } from "./usePatientEvolution";

export { usePatientInsights } from "./usePatientInsights";
export type { InsightType, InsightSeverity } from "./usePatientInsights";

export { useMealPlanAdherence } from "./useMealPlanAdherence";

export { useWeightProjections } from "./useWeightProjections";

export { useEvolutionCharts } from "./useEvolutionCharts";
export type {
  ChartDataPoint,
  ChartStats,
  ChartData,
} from "./useEvolutionCharts";
