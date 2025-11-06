import { useState, useCallback } from "react";
import { api } from "../services/api";

// Tipos baseados nos DTOs do backend
export interface UpcomingBirthday {
  id: string;
  name: string;
  birthDate: Date;
  age: number;
}

export interface RecentActivity {
  id: string;
  type: "evaluation" | "appointment" | "message" | "other";
  patientName: string;
  description: string;
  date: Date;
}

export interface DashboardMetrics {
  totalPatients: number;
  activePatients: number;
  inactivePatients: number;
  archivedPatients: number;
  pendingEvaluations: number;
  averageAdherence: number;
  upcomingBirthdays: UpcomingBirthday[];
  recentActivities: RecentActivity[];
}

export const useDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Busca métricas do dashboard do nutricionista
   */
  const getMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<DashboardMetrics>("/patients/metrics");

      // Normalizar resposta: garantir que arrays e numbers existam
      // A API retorna { success: true, data: {...} }, então precisamos acessar .data
      const resAny: any = response;
      const data = resAny.data || resAny; // Suporta ambos os formatos

      const normalized: DashboardMetrics = {
        totalPatients: data.totalPatients ?? data.total ?? 0,
        activePatients: data.activePatients ?? 0,
        inactivePatients: data.inactivePatients ?? 0,
        archivedPatients: data.archivedPatients ?? 0,
        pendingEvaluations: data.pendingEvaluations ?? 0,
        averageAdherence: data.averageAdherence ?? 0,
        upcomingBirthdays: Array.isArray(data.upcomingBirthdays)
          ? data.upcomingBirthdays
          : [],
        recentActivities: Array.isArray(data.recentActivities)
          ? data.recentActivities
          : [],
      };

      setMetrics(normalized);
      return normalized;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Erro ao buscar métricas do dashboard";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Recarrega as métricas
   */
  const refreshMetrics = useCallback(() => {
    return getMetrics();
  }, [getMetrics]);

  /**
   * Calcula progresso de meta (auxiliar)
   */
  const calculateProgress = useCallback(
    (current: number, total: number): number => {
      if (total === 0) return 0;
      return Math.round((current / total) * 100);
    },
    []
  );

  /**
   * Retorna pacientes ativos em percentual
   */
  const getActivePercentage = useCallback((): number => {
    if (!metrics || metrics.totalPatients === 0) return 0;
    return Math.round((metrics.activePatients / metrics.totalPatients) * 100);
  }, [metrics]);

  /**
   * Retorna se há avaliações pendentes
   */
  const hasPendingEvaluations = useCallback((): boolean => {
    return metrics ? metrics.pendingEvaluations > 0 : false;
  }, [metrics]);

  /**
   * Retorna status de adesão (bom, regular, ruim)
   */
  const getAdherenceStatus = useCallback((): "good" | "regular" | "poor" => {
    if (!metrics) return "regular";

    const adherence = metrics.averageAdherence;

    if (adherence >= 80) return "good";
    if (adherence >= 60) return "regular";
    return "poor";
  }, [metrics]);

  return {
    metrics,
    loading,
    error,
    getMetrics,
    refreshMetrics,
    calculateProgress,
    getActivePercentage,
    hasPendingEvaluations,
    getAdherenceStatus,
  };
};
