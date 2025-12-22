import { useState, useCallback } from "react";
import { api } from "../services/api";
import { PatientStatus } from "../types/patient";

// Tipos baseados nos DTOs do backend
export interface PatientMetrics {
  totalAppointments: number;
  totalMealPlans: number;
  totalEvaluations: number;
  currentWeight?: number;
  goalWeight?: number;
  weightProgress?: number;
  averageAdherence?: number;
  lastUpdated: Date;
}

export interface PatientProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  cpf?: string;
  gender?: string;
  birthDate?: Date;
  age?: number;
  avatarUrl?: string;
  phone?: string;
  biologicalSex?: string;
}

export interface Patient {
  id: string;
  nutritionistId: string;
  patientId: string;
  status: PatientStatus;
  notes?: string;
  lastContactDate?: Date;
  lastEvaluationDate?: Date;
  adherenceScore?: number;
  accessCode?: string;
  accessCodeUsedAt?: Date;
  accessCodeExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  patient: PatientProfile;
  metrics?: PatientMetrics;
}

export interface PatientFilters {
  status?: PatientStatus;
  lastContactBefore?: string;
  lastContactAfter?: string;
  adherenceMin?: number;
  adherenceMax?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PatientsResponse {
  data: Patient[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const usePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PatientsResponse["meta"] | null>(null);

  /**
   * Busca lista de pacientes com filtros opcionais
   * @param filters - Filtros opcionais
   * @param append - Se true, adiciona ao array existente (para paginação). Se false, substitui
   */
  const getPatients = useCallback(
    async (filters?: PatientFilters, append: boolean = false) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        if (filters?.status) params.append("status", filters.status);
        if (filters?.lastContactBefore)
          params.append("lastContactBefore", filters.lastContactBefore);
        if (filters?.lastContactAfter)
          params.append("lastContactAfter", filters.lastContactAfter);
        if (filters?.adherenceMin !== undefined)
          params.append("adherenceMin", filters.adherenceMin.toString());
        if (filters?.adherenceMax !== undefined)
          params.append("adherenceMax", filters.adherenceMax.toString());
        if (filters?.search) params.append("search", filters.search);
        if (filters?.page) params.append("page", filters.page.toString());
        if (filters?.limit) params.append("limit", filters.limit.toString());

        const url = `/patients?${params.toString()}`;

        const response = await api.get<PatientsResponse>(url);

        // O api.service retorna o corpo já parseado. Algumas rotas retornam
        // diretamente o array de pacientes, outras retornam um objeto { data, meta }.
        // Normalizamos ambos os formatos aqui para evitar que `patients` vire undefined.
        const resAny: any = response;

        // A API retorna { success: true, data: { data: [...], meta: {...} } }
        // Então precisamos acessar resAny.data primeiro
        const apiData = resAny.data || resAny;

        if (apiData && apiData.data && Array.isArray(apiData.data)) {
          const newPatients = apiData.data as Patient[];
          setPatients((prev) =>
            append ? [...prev, ...newPatients] : newPatients
          );
          setMeta(apiData.meta || null);
        } else if (Array.isArray(apiData)) {
          const newPatients = apiData as Patient[];
          setPatients((prev) =>
            append ? [...prev, ...newPatients] : newPatients
          );
          setMeta(null);
        } else {
          // Caso inesperado: fallback para array vazio
          console.warn(
            "⚠️ [usePatients] Formato de resposta inesperado:",
            apiData
          );
          if (!append) {
            setPatients([]);
            setMeta(null);
          }
        }

        return response;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Erro ao buscar pacientes";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Busca um paciente específico por ID
   */
  const getPatientById = useCallback(async (patientId: string) => {
    setLoading(true);
    setError(null);

    try {
      const url = `/patients/${patientId}`;
      console.log("=== API CALL ===");
      console.log("URL:", url);
      const response = await api.get<Patient>(url);
      console.log("=== RESPONSE RECEIVED ===");
      console.log("Response:", JSON.stringify(response, null, 2));
      return response;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Erro ao buscar paciente";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atualiza informações de um paciente
   */
  const updatePatient = useCallback(
    async (
      patientId: string,
      data: {
        status?: PatientStatus;
        notes?: string;
        lastContactDate?: Date;
        lastEvaluationDate?: Date;
        adherenceScore?: number;
      }
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.patch<Patient>(
          `/patients/${patientId}`,
          data
        );

        // Atualiza o paciente na lista local
        // response pode ser o objeto paciente direto
        const updatedPatient: any = response;
        setPatients((prev) =>
          prev.map((p) => (p.id === patientId ? updatedPatient : p))
        );

        return response;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Erro ao atualizar paciente";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Busca dashboard individual de um paciente
   */
  const getPatientDashboard = useCallback(async (patientId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<{
        patient: Patient;
        charts: {
          weightEvolution: any[];
          adherenceTrend: any[];
          bodyComposition: any[];
        };
      }>(`/patients/${patientId}/dashboard`);

      return response;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Erro ao buscar dashboard do paciente";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca pacientes com busca por nome
   */
  const searchPatients = useCallback(
    async (query: string) => {
      return getPatients({ search: query, page: 1, limit: 20 });
    },
    [getPatients]
  );

  /**
   * Filtra pacientes por status
   */
  const filterByStatus = useCallback(
    async (status: PatientStatus) => {
      return getPatients({ status, page: 1, limit: 20 });
    },
    [getPatients]
  );

  /**
   * Recarrega a lista de pacientes
   */
  const refreshPatients = useCallback(async () => {
    try {
      const result = await getPatients({ page: 1, limit: 20 });
      return result;
    } catch (error: any) {
      console.error("❌ refreshPatients error:", {
        error,
        message: error?.message,
        stack: error?.stack,
        response: error?.response,
      });
      throw error;
    }
  }, [getPatients]);

  /**
   * Regenera o código de acesso de um paciente
   */
  const regenerateAccessCode = useCallback(async (patientId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.patch<Patient>(
        `/patients/${patientId}/regenerate-access-code`
      );

      // Atualiza a lista de pacientes localmente
      setPatients((prev) =>
        prev.map((p) =>
          p.id === patientId ? (response as any).data || response : p
        )
      );

      return response;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Erro ao regenerar código de acesso";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    patients,
    loading,
    error,
    meta,
    getPatients,
    getPatientById,
    updatePatient,
    getPatientDashboard,
    searchPatients,
    filterByStatus,
    refreshPatients,
    regenerateAccessCode,
  };
};
