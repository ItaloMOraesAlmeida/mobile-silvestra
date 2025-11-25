/**
 * useMealPlanAdherence Hook
 *
 * Hook customizado para buscar e calcular estatísticas de aderência ao plano alimentar.
 * Integra com o endpoint /patients/:id/meal-plans/adherence
 *
 * Features:
 * - Cálculo de estatísticas agregadas
 * - Filtragem por período
 * - Breakdown por refeição e dia da semana
 * - Cálculo de sequências (streaks)
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../../services/api";

interface MealAdherence {
  mealName: string;
  completed: number;
  total: number;
  percentage: number;
}

interface WeekdayAdherence {
  day: string;
  adherence: number;
}

interface DailyAdherence {
  date: string;
  completed: boolean;
  mealsCompleted: number;
  mealsTotal: number;
  adherenceRate: number;
}

interface AdherenceResponse {
  patientId: string;
  mealPlanId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  overallAdherence: number;
  totalMeals: number;
  completedMeals: number;
  byMeal: MealAdherence[];
  byWeekday: WeekdayAdherence[];
  dailyRecords: DailyAdherence[];
}

interface AdherenceStats {
  period: string;
  overallAdherence: number;
  mealsCompleted: number;
  mealsTotal: number;
  consistencyScore: number;
  byMeal: MealAdherence[];
  byWeekday: WeekdayAdherence[];
  bestStreak: number;
  currentStreak: number;
  lastUpdated: string;
}

interface UseMealPlanAdherenceOptions {
  patientId: string;
  mealPlanId?: string;
  startDate?: string;
  endDate?: string;
  autoFetch?: boolean;
  apiBaseUrl?: string;
}

interface UseMealPlanAdherenceReturn {
  data: AdherenceResponse | null;
  stats: AdherenceStats | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar aderência ao plano alimentar
 *
 * @example
 * const { stats, loading } = useMealPlanAdherence({
 *   patientId: "123",
 *   mealPlanId: "456",
 *   startDate: "2024-01-01",
 *   endDate: "2024-01-31"
 * });
 */
export const useMealPlanAdherence = ({
  patientId,
  mealPlanId,
  startDate,
  endDate,
  autoFetch = true,
  apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
}: UseMealPlanAdherenceOptions): UseMealPlanAdherenceReturn => {
  const [data, setData] = useState<AdherenceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Calcular sequências (streaks)
  const calculateStreaks = useCallback(
    (
      dailyRecords: DailyAdherence[]
    ): {
      bestStreak: number;
      currentStreak: number;
    } => {
      if (
        !dailyRecords ||
        !Array.isArray(dailyRecords) ||
        dailyRecords.length === 0
      ) {
        return { bestStreak: 0, currentStreak: 0 };
      }

      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;

      // Ordenar por data (mais recente primeiro)
      const sorted = [...dailyRecords].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Calcular streak atual
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].completed) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calcular melhor streak
      for (const record of sorted) {
        if (record.completed) {
          tempStreak++;
          if (tempStreak > bestStreak) {
            bestStreak = tempStreak;
          }
        } else {
          tempStreak = 0;
        }
      }

      return { bestStreak, currentStreak };
    },
    []
  );

  // Calcular score de consistência
  const calculateConsistencyScore = useCallback(
    (dailyRecords: DailyAdherence[]): number => {
      if (
        !dailyRecords ||
        !Array.isArray(dailyRecords) ||
        dailyRecords.length === 0
      )
        return 0;

      // Consistência baseada em variação das taxas de aderência
      const rates = dailyRecords.map((record) => record.adherenceRate);
      const avg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
      const variance =
        rates.reduce((sum, rate) => sum + Math.pow(rate - avg, 2), 0) /
        rates.length;
      const stdDev = Math.sqrt(variance);

      // Score: 100% - desvio padrão normalizado
      // Quanto menor o desvio, maior a consistência
      return Math.max(0, 100 - stdDev);
    },
    []
  );

  // Processar dados em estatísticas
  const stats = useMemo((): AdherenceStats | null => {
    if (!data || !data.dailyRecords) return null;

    const { bestStreak, currentStreak } = calculateStreaks(
      data.dailyRecords || []
    );
    const consistencyScore = calculateConsistencyScore(data.dailyRecords || []);

    const periodLabel = `${new Date(data.period.startDate).toLocaleDateString(
      "pt-BR"
    )} - ${new Date(data.period.endDate).toLocaleDateString("pt-BR")}`;

    return {
      period: periodLabel,
      overallAdherence: data.overallAdherence,
      mealsCompleted: data.completedMeals,
      mealsTotal: data.totalMeals,
      consistencyScore,
      byMeal: data.byMeal,
      byWeekday: data.byWeekday,
      bestStreak,
      currentStreak,
      lastUpdated: new Date().toISOString(),
    };
  }, [data, calculateStreaks, calculateConsistencyScore]);

  // Função para buscar dados
  const fetchData = useCallback(async () => {
    if (!patientId) {
      setError(new Error("Patient ID is required"));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Construir query params
      const params = new URLSearchParams();
      if (mealPlanId) params.append("mealPlanId", mealPlanId);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const queryString = params.toString();
      const url = `/patients/${patientId}/meal-plans/adherence${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await api.get<{ data: AdherenceResponse }>(url);

      setData(response.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err
          : new Error("Failed to fetch adherence data");
      setError(errorMessage);
      console.error("Error fetching meal plan adherence:", err);
    } finally {
      setLoading(false);
    }
  }, [patientId, mealPlanId, startDate, endDate]);

  // Função de refetch exposta
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Auto-fetch ao montar
  useEffect(() => {
    if (autoFetch && patientId) {
      fetchData();
    }
  }, [autoFetch, patientId, fetchData]);

  return {
    data,
    stats,
    loading,
    error,
    refetch,
  };
};
