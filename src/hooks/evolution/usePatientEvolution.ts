/**
 * usePatientEvolution Hook
 *
 * Hook customizado para buscar e gerenciar dados completos de evolução do paciente.
 * Integra com o endpoint /patients/:id/evolution/complete
 *
 * Features:
 * - Auto-fetch ao montar o componente
 * - Estados de loading, error e success
 * - Refetch manual
 * - Cache simples (pode ser expandido com react-query)
 * - Filtragem por período
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../../services/api";

// Tipos baseados nos DTOs do backend
interface Assessment {
  id: string;
  date: string;
  weight: number;
  height: number;
  bodyFatPercent?: number;
  muscleMass?: number;
  leanMass?: number;
  waterPercent?: number;
  bmr?: number;
  visceralFat?: number;
  neck?: number;
  shoulder?: number;
  chest?: number;
  waist?: number;
  abdomen?: number;
  hip?: number;
  rightThigh?: number;
  leftThigh?: number;
  rightCalf?: number;
  leftCalf?: number;
  rightArm?: number;
  leftArm?: number;
  rightForearm?: number;
  leftForearm?: number;
  tricepsFold?: number;
  bicepsFold?: number;
  subscapularFold?: number;
  suprailiacFold?: number;
  abdominalFold?: number;
  thighFold?: number;
  calfFold?: number;
  frontPhoto?: string;
  sidePhoto?: string;
  backPhoto?: string;
  notes?: string;
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  type: string;
  initialValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline?: string;
  startDate: string;
  status: "in_progress" | "completed" | "exceeded" | "paused";
  progress?: {
    date: string;
    value: number;
    notes?: string;
  }[];
}

interface MealPlanSummary {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  adherenceRate: number;
  isActive: boolean;
}

interface EvolutionData {
  patient: {
    id: string;
    name: string;
    gender: string;
    birthDate: string;
    age: number;
  };
  assessments: Assessment[];
  goals: Goal[];
  mealPlans: MealPlanSummary[];
  latestMetrics: {
    weight?: number;
    height?: number;
    bmi?: number;
    bodyFat?: number;
    muscleMass?: number;
    assessmentDate?: string;
  };
}

export type Period = "7d" | "30d" | "3m" | "6m" | "1y" | "all";

interface UsePatientEvolutionOptions {
  patientId: string;
  period?: Period;
  autoFetch?: boolean;
  apiBaseUrl?: string;
}

interface UsePatientEvolutionReturn {
  data: EvolutionData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isRefetching: boolean;
  filteredAssessments: Assessment[];
  latestAssessment: Assessment | null;
  previousAssessment: Assessment | null;
}

/**
 * Hook para buscar dados de evolução do paciente
 *
 * @example
 * const { data, loading, error, refetch } = usePatientEvolution({
 *   patientId: "123",
 *   period: "30d"
 * });
 */
export const usePatientEvolution = ({
  patientId,
  period = "all",
  autoFetch = true,
  apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
}: UsePatientEvolutionOptions): UsePatientEvolutionReturn => {
  const [data, setData] = useState<EvolutionData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Calcular data de início baseado no período
  const getStartDate = useCallback((selectedPeriod: Period): Date | null => {
    if (selectedPeriod === "all") return null;

    const now = new Date();
    switch (selectedPeriod) {
      case "7d":
        return new Date(now.setDate(now.getDate() - 7));
      case "30d":
        return new Date(now.setDate(now.getDate() - 30));
      case "3m":
        return new Date(now.setMonth(now.getMonth() - 3));
      case "6m":
        return new Date(now.setMonth(now.getMonth() - 6));
      case "1y":
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return null;
    }
  }, []);

  // Filtrar avaliações pelo período
  const filteredAssessments = useMemo(() => {
    if (!data || period === "all") {
      return data?.assessments || [];
    }

    const startDate = getStartDate(period);
    if (!startDate) return data.assessments;

    return data.assessments.filter((assessment) => {
      const assessmentDate = new Date(assessment.date);
      return assessmentDate >= startDate;
    });
  }, [data, period, getStartDate]);

  // Pegar última e penúltima avaliação
  const latestAssessment = useMemo(() => {
    if (!filteredAssessments.length) return null;
    return filteredAssessments[0];
  }, [filteredAssessments]);

  const previousAssessment = useMemo(() => {
    if (filteredAssessments.length < 2) return null;
    return filteredAssessments[1];
  }, [filteredAssessments]);

  // Função para buscar dados
  const fetchData = useCallback(
    async (isRefetch = false) => {
      if (!patientId) {
        setError(new Error("Patient ID is required"));
        return;
      }

      try {
        if (isRefetch) {
          setIsRefetching(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const response = await api.get(
          `/patients/${patientId}/evolution/complete`
        );

        // Transformar resposta do backend para o formato esperado
        const backendData = response.data;

        // Buscar todas as avaliações detalhadas do paciente (sem paginação - limite alto)
        const assessmentsResponse = await api.get(
          `/patients/${patientId}/body-measurements?limit=1000&sortOrder=desc`
        );

        // O backend agora retorna { data: [], meta: {} }
        const measurementsData =
          assessmentsResponse.data?.data || assessmentsResponse.data || [];

        const transformedData: EvolutionData = {
          patient: backendData.patient,
          assessments: measurementsData
            .map((measurement: any) => ({
              id: measurement.id,
              date: measurement.createdAt,
              weight: measurement.weight,
              height: measurement.height,
              bodyFatPercent: measurement.bodyFatPercent,
              muscleMass: measurement.muscleMass,
              leanMass: measurement.leanMass,
              waterPercent: measurement.waterPercent,
              bmr: measurement.bmr,
              visceralFat: measurement.visceralFat,
              neck: measurement.neck,
              shoulder: measurement.shoulder,
              chest: measurement.chest,
              waist: measurement.waist,
              abdomen: measurement.abdomen,
              hip: measurement.hip,
              rightThigh: measurement.rightThigh,
              leftThigh: measurement.leftThigh,
              rightCalf: measurement.rightCalf,
              leftCalf: measurement.leftCalf,
              rightArm: measurement.rightArm,
              leftArm: measurement.leftArm,
              rightForearm: measurement.rightForearm,
              leftForearm: measurement.leftForearm,
              tricepsFold: measurement.tricepsFold,
              bicepsFold: measurement.bicepsFold,
              subscapularFold: measurement.subscapularFold,
              suprailiacFold: measurement.suprailiacFold,
              abdominalFold: measurement.abdominalFold,
              thighFold: measurement.thighFold,
              calfFold: measurement.calfFold,
              frontPhoto: measurement.photoFront,
              sidePhoto: measurement.photoSide,
              backPhoto: measurement.photoBack,
              notes: measurement.notes,
            }))
            .sort(
              (a: Assessment, b: Assessment) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            ),
          goals: backendData.goals || [],
          mealPlans: backendData.mealPlans || [],
          latestMetrics: {
            weight: backendData.metrics?.weight?.current,
            height: measurementsData[0]?.height,
            bmi: backendData.metrics?.bmi?.current,
            bodyFat: backendData.metrics?.bodyFat?.current,
            muscleMass: backendData.metrics?.muscleMass?.current,
            assessmentDate: measurementsData[0]?.createdAt,
          },
        };

        setData(transformedData);
      } catch (err: any) {
        console.error("❌ Erro ao buscar evolução:", err);
        console.error("❌ Detalhes do erro:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          url: err.config?.url,
        });

        const errorMessage =
          err instanceof Error ? err : new Error("Erro ao buscar evolução");
        setError(errorMessage);
      } finally {
        setLoading(false);
        setIsRefetching(false);
      }
    },
    [patientId]
  );

  // Função de refetch exposta
  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Auto-fetch ao montar
  useEffect(() => {
    if (autoFetch && patientId) {
      fetchData();
    }
  }, [autoFetch, patientId, fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    isRefetching,
    filteredAssessments,
    latestAssessment,
    previousAssessment,
  };
};
