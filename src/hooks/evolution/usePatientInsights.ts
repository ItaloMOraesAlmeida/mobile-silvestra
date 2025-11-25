/**
 * usePatientInsights Hook
 *
 * Hook customizado para buscar insights inteligentes sobre a evolução do paciente.
 * Integra com o endpoint /patients/:id/insights
 *
 * Features:
 * - Auto-refresh configurável
 * - Gerenciamento de insights dismissados
 * - Filtragem por severidade
 * - Cache local
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../../services/api";

export type InsightType =
  | "WARNING"
  | "SUCCESS"
  | "INFO"
  | "SUGGESTION"
  | "ACHIEVEMENT";
export type InsightSeverity = 1 | 2 | 3 | 4 | 5;

interface Insight {
  id: string;
  type: InsightType;
  title: string;
  message: string;
  severity: InsightSeverity;
  category: string;
  actionLabel?: string;
  actionRoute?: string;
  createdAt: string;
  isDismissed: boolean;
}

interface InsightsData {
  insights: Insight[];
  summary: {
    total: number;
    warnings: number;
    successes: number;
    suggestions: number;
    achievements: number;
  };
}

interface UsePatientInsightsOptions {
  patientId: string;
  autoFetch?: boolean;
  refreshInterval?: number; // em milissegundos
  minSeverity?: InsightSeverity;
  excludeDismissed?: boolean;
  apiBaseUrl?: string;
}

interface UsePatientInsightsReturn {
  data: InsightsData | null;
  insights: Insight[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  dismissInsight: (insightId: string) => Promise<void>;
  dismissing: boolean;
}

/**
 * Hook para buscar insights do paciente
 *
 * @example
 * const { insights, dismissInsight } = usePatientInsights({
 *   patientId: "123",
 *   refreshInterval: 60000, // 1 minuto
 *   minSeverity: 2
 * });
 */
export const usePatientInsights = ({
  patientId,
  autoFetch = true,
  refreshInterval,
  minSeverity = 1,
  excludeDismissed = true,
  apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
}: UsePatientInsightsOptions): UsePatientInsightsReturn => {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [dismissing, setDismissing] = useState<boolean>(false);

  // Filtrar insights
  const insights = useMemo(() => {
    if (!data || !data.insights) return [];

    let filtered = data.insights;

    // Filtrar por severidade mínima
    if (minSeverity > 1) {
      filtered = filtered.filter((insight) => insight.severity >= minSeverity);
    }

    // Filtrar dismissados
    if (excludeDismissed) {
      filtered = filtered.filter((insight) => !insight.isDismissed);
    }

    // Ordenar por severidade (maior primeiro) e data (mais recente primeiro)
    return filtered.sort((a, b) => {
      if (a.severity !== b.severity) {
        return b.severity - a.severity;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [data, minSeverity, excludeDismissed]);

  // Função para buscar dados
  const fetchData = useCallback(async () => {
    if (!patientId) {
      setError(new Error("Patient ID is required"));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get<{ data: Insight[] }>(
        `/patients/${patientId}/insights`
      );

      // Backend retorna array de insights diretamente
      // Adaptar para o formato esperado pelo hook
      const insightsArray = response.data || [];

      // Calcular summary
      const summary = {
        total: insightsArray.length,
        warnings: insightsArray.filter((i) => i.type === "WARNING").length,
        successes: insightsArray.filter((i) => i.type === "SUCCESS").length,
        suggestions: insightsArray.filter((i) => i.type === "SUGGESTION")
          .length,
        achievements: insightsArray.filter((i) => i.type === "ACHIEVEMENT")
          .length,
      };

      setData({
        insights: insightsArray,
        summary,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err : new Error("Failed to fetch insights");
      setError(errorMessage);
      console.error("Error fetching insights:", err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  // Função de refetch exposta
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Função para dismissar insight
  const dismissInsight = useCallback(
    async (insightId: string) => {
      if (!patientId) {
        throw new Error("Patient ID is required");
      }

      try {
        setDismissing(true);

        await api.patch(`/patients/${patientId}/insights/${insightId}/dismiss`);

        // Atualizar estado local
        setData((prevData) => {
          if (!prevData) return prevData;

          return {
            ...prevData,
            insights: prevData.insights.map((insight) =>
              insight.id === insightId
                ? { ...insight, isDismissed: true }
                : insight
            ),
          };
        });
      } catch (err) {
        console.error("Error dismissing insight:", err);
        throw err instanceof Error
          ? err
          : new Error("Failed to dismiss insight");
      } finally {
        setDismissing(false);
      }
    },
    [patientId]
  );

  // Auto-fetch ao montar
  useEffect(() => {
    if (autoFetch && patientId) {
      fetchData();
    }
  }, [autoFetch, patientId, fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!refreshInterval || !patientId) return;

    const intervalId = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, patientId, fetchData]);

  return {
    data,
    insights,
    loading,
    error,
    refetch,
    dismissInsight,
    dismissing,
  };
};
