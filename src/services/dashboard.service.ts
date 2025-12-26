/**
 * Dashboard API Service
 * Serviço para consumir endpoints do dashboard do nutricionista
 */

import { api } from "./api";
import {
  DashboardOverview,
  DashboardAlerts,
  PerformanceData,
  TopPerformers,
  DashboardStatistics,
  GoalsProgress,
  DashboardInsights,
  ActivePatientsList,
  DashboardPeriod,
} from "../types/dashboard";

/**
 * Obter resumo executivo do dashboard
 */
export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  const response = await api.get<{ data: DashboardOverview }>(
    "/patients/dashboard/overview"
  );
  return response.data;
};

/**
 * Obter alertas que requerem atenção
 */
export const getDashboardAlerts = async (): Promise<DashboardAlerts> => {
  const response = await api.get<{ data: DashboardAlerts }>(
    "/patients/dashboard/alerts"
  );

  return response.data;
};

/**
 * Obter dados de performance para gráficos
 */
export const getDashboardPerformance = async (
  period: DashboardPeriod = DashboardPeriod.WEEK
): Promise<PerformanceData> => {
  const response = await api.get<{ data: PerformanceData }>(
    "/patients/dashboard/performance",
    {
      params: { period },
    }
  );

  return response.data;
};

/**
 * Obter top performers e pacientes que precisam de apoio
 */
export const getDashboardTopPerformers = async (
  limit: number = 5
): Promise<TopPerformers> => {
  const response = await api.get<{
    data: {
      topPerformers: {
        id: string;
        name: string;
        avatarUrl?: string;
        adherence: number;
        totalGoals: number;
        achievedGoals: number;
        progress?: {
          goalType: string;
          current: number;
          target: number;
          change: number;
          unit: string;
        };
        lastCheckIn?: string;
        needsAttention: boolean;
      }[];
      needsSupport: {
        id: string;
        name: string;
        avatarUrl?: string;
        adherence: number;
        totalGoals: number;
        achievedGoals: number;
        progress?: {
          goalType: string;
          current: number;
          target: number;
          change: number;
          unit: string;
        };
        lastCheckIn?: string;
        needsAttention: boolean;
      }[];
    };
  }>("/patients/dashboard/top-performers", {
    params: { limit },
  });

  // Mapear dados do backend para formato do frontend
  const mapPerformers = (performers: typeof response.data.topPerformers) =>
    performers.map((p) => ({
      patientId: p.id,
      patientName: p.name,
      avatarUrl: p.avatarUrl,
      adherenceRate: p.adherence,
      goalsAchieved: p.achievedGoals,
      totalGoals: p.totalGoals,
    }));

  return {
    topPerformers: mapPerformers(response.data.topPerformers),
    needsSupport: mapPerformers(response.data.needsSupport),
  };
};

/**
 * Obter estatísticas gerais
 */
export const getDashboardStatistics =
  async (): Promise<DashboardStatistics> => {
    const response = await api.get<{ data: DashboardStatistics }>(
      "/patients/dashboard/statistics"
    );
    return response.data;
  };

/**
 * Obter progresso de metas por tipo
 */
export const getDashboardGoalsProgress = async (): Promise<GoalsProgress> => {
  const response = await api.get<{ data: GoalsProgress }>(
    "/patients/dashboard/goals-progress"
  );
  return response.data;
};

/**
 * Obter insights automáticos
 */
export const getDashboardInsights = async (): Promise<DashboardInsights> => {
  const response = await api.get<{ data: DashboardInsights }>(
    "/patients/dashboard/insights"
  );

  return response.data;
};

/**
 * Obter lista de pacientes ativos (paginada)
 */
export const getDashboardActivePatients = async (
  page: number = 1,
  limit: number = 10
): Promise<ActivePatientsList> => {
  const response = await api.get<{ data: ActivePatientsList }>(
    "/patients/dashboard/active-patients",
    {
      params: { page, limit },
    }
  );
  return response.data;
};
