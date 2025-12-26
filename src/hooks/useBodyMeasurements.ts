import { useState } from "react";
import { api } from "../services/api";

export interface BodyMeasurement {
  id: string;
  patientId: string;

  // Dados básicos
  weight: number;
  height: number;
  bmi?: number;

  // Protocolo de composição corporal
  protocol?:
    | "POLLOCK_7"
    | "POLLOCK_3_MALE"
    | "POLLOCK_3_FEMALE"
    | "GUEDES_3"
    | "FAULKNER_4";

  // Circunferências (cm)
  neckCirc?: number;
  shoulderCirc?: number;
  chestCirc?: number;
  armCirc?: number;
  armCircRelaxedRight?: number;
  armCircRelaxedLeft?: number;
  armCircContractedRight?: number;
  armCircContractedLeft?: number;
  forearmCirc?: number;
  waistCirc?: number;
  abdomenCirc?: number;
  hipCirc?: number;
  thighCirc?: number;
  thighCircRight?: number;
  thighCircLeft?: number;
  calfCirc?: number;
  calfCircRight?: number;
  calfCircLeft?: number;
  wristCirc?: number;

  // Dobras Cutâneas (mm)
  tricepsFold?: number;
  bicepsFold?: number;
  subscapularFold?: number;
  pectoralFold?: number;
  axillarFold?: number;
  suprailiacFold?: number;
  abdominalFold?: number;
  thighFold?: number;
  calfMedialFold?: number;

  // Diâmetros Ósseos (cm)
  wristDiameter?: number;
  femurDiameter?: number;
  humerusDiameter?: number;

  // Composição Corporal
  bodyFatPercent?: number;
  muscleMass?: number;
  fatMass?: number;

  // Fotos
  photoFront?: string;
  photoSide?: string;
  photoBack?: string;

  // Metadados
  notes?: string;
  measuredBy?: string;
  registeredBy?: "NUTRITIONIST" | "PATIENT";
  createdAt: string;
}

export interface CreateBodyMeasurementDto {
  weight: number;
  height: number;
  bmi?: number;
  neckCirc?: number;
  shoulderCirc?: number;
  chestCirc?: number;
  armCirc?: number;
  forearmCirc?: number;
  waistCirc?: number;
  abdomenCirc?: number;
  hipCirc?: number;
  thighCirc?: number;
  calfCirc?: number;
  wristCirc?: number;
  tricepsFold?: number;
  subscapularFold?: number;
  pectoralFold?: number;
  axillarFold?: number;
  suprailiacFold?: number;
  abdominalFold?: number;
  thighFold?: number;
  bodyFatPercent?: number;
  muscleMass?: number;
  fatMass?: number;
  photoFront?: string;
  photoSide?: string;
  photoBack?: string;
  notes?: string;
  measuredBy?: string;
  registeredBy?: "NUTRITIONIST" | "PATIENT";
}

export interface EvolutionData {
  date: string;
  value: number;
}

export interface EvolutionResponse {
  metric: string;
  period: string;
  data: EvolutionData[];
}

export function useBodyMeasurements() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Criar nova medição corporal
   */
  const createMeasurement = async (
    patientId: string,
    data: CreateBodyMeasurementDto
  ): Promise<BodyMeasurement | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post(
        `/patients/${patientId}/body-measurements`,
        data
      );

      // Backend retorna o objeto diretamente, sem campo success
      if (response.data && response.data.id) {
        return response.data;
      }

      throw new Error(response.data.message || "Erro ao criar medição");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Erro ao criar medição";
      setError(errorMessage);
      console.error("Erro ao criar medição:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Listar todas as medições do paciente
   */
  const listMeasurements = async (
    patientId: string,
    options?: {
      page?: number;
      limit?: number;
      sortOrder?: "asc" | "desc";
    }
  ): Promise<{
    measurements: BodyMeasurement[];
    total: number;
    page: number;
    limit: number;
  } | null> => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options?.page) params.append("page", options.page.toString());
      if (options?.limit) params.append("limit", options.limit.toString());
      if (options?.sortOrder) params.append("sortOrder", options.sortOrder);

      const url = `/patients/${patientId}/body-measurements?${params.toString()}`;

      const response = await api.get(url);

      // Backend retorna { data: [], meta: {...} } diretamente, sem campo success
      if (response.data.data !== undefined && response.data.meta) {
        return {
          measurements: response.data.data,
          total: response.data.meta.total,
          page: response.data.meta.page,
          limit: response.data.meta.limit,
        };
      }

      throw new Error(response.data.message || "Erro ao listar medições");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Erro ao listar medições";
      setError(errorMessage);
      console.error("Erro ao listar medições:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Buscar medição mais recente
   */
  const getLatestMeasurement = async (
    patientId: string
  ): Promise<BodyMeasurement | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(
        `/patients/${patientId}/body-measurements/latest`
      );

      // Backend retorna com wrapper {success: true, data: {...}}
      if (response.data?.data) {
        return response.data.data;
      }

      // Fallback caso não tenha wrapper
      if (response.data) {
        return response.data;
      }

      return null;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Erro ao buscar última medição";
      setError(errorMessage);
      console.error("Erro ao buscar última medição:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Buscar medição específica por ID
   */
  const getMeasurementById = async (
    patientId: string,
    measurementId: string
  ): Promise<BodyMeasurement | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(
        `/patients/${patientId}/body-measurements/${measurementId}`
      );

      // Verificar se a resposta tem o formato esperado
      if (response.data) {
        // Se vier com wrapper success
        if (response.data.success && response.data.data) {
          return response.data.data;
        }
        // Se vier direto (sem wrapper)
        if (response.data.id) {
          return response.data;
        }
      }

      throw new Error("Formato de resposta inválido");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Erro ao buscar medição";
      setError(errorMessage);
      console.error("❌ Erro ao buscar medição:", {
        message: errorMessage,
        status: err.response?.status,
        data: err.response?.data,
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Buscar dados de evolução para gráficos
   */
  const getEvolution = async (
    patientId: string,
    metric: "weight" | "bmi" | "bodyFat" | "muscleMass",
    period: "7d" | "30d" | "3m" | "6m" | "1y" = "30d"
  ): Promise<EvolutionResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(
        `/patients/${patientId}/body-measurements/evolution?metric=${metric}&period=${period}`
      );

      if (response.data.success) {
        return {
          metric,
          period,
          data: response.data.data,
        };
      }

      throw new Error(response.data.message || "Erro ao buscar evolução");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Erro ao buscar evolução";
      setError(errorMessage);
      console.error("Erro ao buscar evolução:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Comparar duas medições
   */
  const compareMeasurements = async (
    patientId: string,
    startDate: string,
    endDate: string
  ): Promise<any | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(
        `/patients/${patientId}/body-measurements/compare?startDate=${startDate}&endDate=${endDate}`
      );

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error(response.data.message || "Erro ao comparar medições");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Erro ao comparar medições";
      setError(errorMessage);
      console.error("Erro ao comparar medições:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Atualizar medição
   */
  const updateMeasurement = async (
    patientId: string,
    measurementId: string,
    data: Partial<CreateBodyMeasurementDto>
  ): Promise<BodyMeasurement | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.patch(
        `/patients/${patientId}/body-measurements/${measurementId}`,
        data
      );

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error(response.data.message || "Erro ao atualizar medição");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Erro ao atualizar medição";
      setError(errorMessage);
      console.error("Erro ao atualizar medição:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deletar medição
   */
  const deleteMeasurement = async (
    patientId: string,
    measurementId: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.delete(
        `/patients/${patientId}/body-measurements/${measurementId}`
      );

      if (response.data.success) {
        return true;
      }

      throw new Error(response.data.message || "Erro ao deletar medição");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Erro ao deletar medição";
      setError(errorMessage);
      console.error("Erro ao deletar medição:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createMeasurement,
    listMeasurements,
    getLatestMeasurement,
    getMeasurementById,
    getEvolution,
    compareMeasurements,
    updateMeasurement,
    deleteMeasurement,
  };
}
