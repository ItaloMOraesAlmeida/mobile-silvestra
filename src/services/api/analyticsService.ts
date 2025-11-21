import { api } from "../api.service";
import type {
  WeightDataPoint,
  BodyCompositionData,
  GoalsDistribution,
  ActivityData,
  ProgressGaugeData,
} from "../../components/charts";

/**
 * Analytics API Response Types
 */
interface WeightEvolutionResponse {
  data: WeightDataPoint[];
}

interface BodyCompositionResponse {
  data: BodyCompositionData[];
}

interface GoalsStatsResponse {
  distribution: GoalsDistribution;
  total: number;
  successRate: number;
}

interface ActivityHeatmapResponse {
  data: ActivityData[];
  months: number;
  activeDays: number;
  totalActivities: number;
  averagePerDay: number;
}

interface ProgressScoreResponse {
  score: ProgressGaugeData;
  message: string;
  calculatedAt: string;
}

/**
 * Analytics Service
 *
 * Serviço para buscar dados de analytics do backend
 */
export const analyticsService = {
  /**
   * Obter evolução de peso do paciente
   */
  async getWeightEvolution(
    patientId: string,
    months: number = 6
  ): Promise<WeightEvolutionResponse> {
    return api.get<WeightEvolutionResponse>(
      `/analytics/weight-evolution/${patientId}?months=${months}`
    );
  },

  /**
   * Obter composição corporal do paciente
   */
  async getBodyComposition(
    patientId: string,
    months: number = 6
  ): Promise<BodyCompositionResponse> {
    return api.get<BodyCompositionResponse>(
      `/analytics/body-composition/${patientId}?months=${months}`
    );
  },

  /**
   * Obter estatísticas de metas do paciente
   */
  async getGoalsStats(patientId: string): Promise<GoalsStatsResponse> {
    return api.get<GoalsStatsResponse>(`/analytics/goals-stats/${patientId}`);
  },

  /**
   * Obter heatmap de atividades do paciente
   */
  async getActivityHeatmap(
    patientId: string,
    months: number = 6
  ): Promise<ActivityHeatmapResponse> {
    return api.get<ActivityHeatmapResponse>(
      `/analytics/activity-heatmap/${patientId}?months=${months}`
    );
  },

  /**
   * Obter score de progresso geral do paciente
   */
  async getProgressScore(patientId: string): Promise<ProgressScoreResponse> {
    return api.get<ProgressScoreResponse>(
      `/analytics/progress-score/${patientId}`
    );
  },
};
