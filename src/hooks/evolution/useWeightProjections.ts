/**
 * useWeightProjections Hook
 *
 * Hook customizado para buscar projeções de perda/ganho de peso.
 * Integra com o endpoint /patients/:id/projections
 *
 * Features:
 * - Validação de inputs (peso alvo)
 * - Cálculo de datas estimadas
 * - Múltiplos cenários (otimista, realista, conservador)
 * - Validação de metas saudáveis
 */

import { useState, useCallback } from "react";
import { api } from "../../services/api";

interface Projection {
  scenario: "optimistic" | "realistic" | "conservative";
  targetDate: string;
  daysToGoal: number;
  weeklyChange: number;
  monthlyChange: number;
  confidence: number;
}

interface ProjectionsResponse {
  patientId: string;
  currentWeight: number;
  targetWeight: number;
  projections: Projection[];
  recommendations: string[];
  healthWarnings: string[];
  calculatedAt: string;
}

interface UseWeightProjectionsOptions {
  patientId: string;
  apiBaseUrl?: string;
}

interface UseWeightProjectionsReturn {
  data: ProjectionsResponse | null;
  loading: boolean;
  error: Error | null;
  fetchProjections: (targetWeight: number) => Promise<void>;
  isValidTarget: (
    targetWeight: number,
    currentWeight: number
  ) => {
    valid: boolean;
    message?: string;
  };
}

/**
 * Hook para buscar projeções de peso
 *
 * @example
 * const { data, fetchProjections, isValidTarget } = useWeightProjections({
 *   patientId: "123"
 * });
 *
 * // Validar peso alvo
 * const validation = isValidTarget(70, 80);
 * if (validation.valid) {
 *   await fetchProjections(70);
 * }
 */
export const useWeightProjections = ({
  patientId,
  apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
}: UseWeightProjectionsOptions): UseWeightProjectionsReturn => {
  const [data, setData] = useState<ProjectionsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Validar peso alvo
  const isValidTarget = useCallback(
    (
      targetWeight: number,
      currentWeight: number
    ): { valid: boolean; message?: string } => {
      if (!targetWeight || targetWeight <= 0) {
        return { valid: false, message: "Peso alvo deve ser maior que zero" };
      }

      if (targetWeight === currentWeight) {
        return {
          valid: false,
          message: "Peso alvo deve ser diferente do peso atual",
        };
      }

      // Validar mudanças extremas (mais de 30% do peso corporal)
      const percentChange = Math.abs(
        ((targetWeight - currentWeight) / currentWeight) * 100
      );
      if (percentChange > 30) {
        return {
          valid: false,
          message: "Mudança de peso muito extrema (máximo 30% do peso atual)",
        };
      }

      // Validar peso mínimo saudável (40kg)
      if (targetWeight < 40) {
        return {
          valid: false,
          message: "Peso alvo muito baixo (mínimo 40kg por segurança)",
        };
      }

      // Validar peso máximo (300kg - limite do sistema)
      if (targetWeight > 300) {
        return {
          valid: false,
          message: "Peso alvo muito alto (máximo 300kg)",
        };
      }

      return { valid: true };
    },
    []
  );

  // Função para buscar projeções
  const fetchProjections = useCallback(
    async (targetWeight: number) => {
      if (!patientId) {
        setError(new Error("Patient ID is required"));
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await api.get<{ data: ProjectionsResponse }>(
          `/patients/${patientId}/projections?targetWeight=${targetWeight}`
        );

        setData(response.data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err : new Error("Failed to fetch projections");
        setError(errorMessage);
        console.error("Error fetching weight projections:", err);
        throw errorMessage;
      } finally {
        setLoading(false);
      }
    },
    [patientId]
  );

  return {
    data,
    loading,
    error,
    fetchProjections,
    isValidTarget,
  };
};
