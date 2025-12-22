import { api } from "./api.service";
import type {
  BodyMeasurement,
  CreateBodyMeasurementDto,
  UpdateBodyMeasurementDto,
  PaginatedMeasurementsResponse,
  CompareMeasurementsResponse,
  EvolutionResponse,
  HealthInfo,
  UpdateHealthInfoDto,
  UpdateHealthInfoSectionDto,
  Goal,
  CreateGoalDto,
  UpdateGoalDto,
  AchieveGoalDto,
  GoalsProgressResponse,
} from "../types/patient-details.types";

// ============================================
// BODY MEASUREMENTS
// ============================================

export const bodyMeasurementsService = {
  /**
   * Criar nova medição corporal
   */
  create: (
    patientId: string,
    data: CreateBodyMeasurementDto
  ): Promise<BodyMeasurement> => {
    return api.post(`/patients/${patientId}/body-measurements`, data);
  },

  /**
   * Listar todas as medições (paginado)
   */
  findAll: (
    patientId: string,
    options?: {
      page?: number;
      limit?: number;
      sortOrder?: "asc" | "desc";
    }
  ): Promise<PaginatedMeasurementsResponse> => {
    const params = new URLSearchParams();
    if (options?.page) params.append("page", options.page.toString());
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.sortOrder) params.append("sortOrder", options.sortOrder);

    const query = params.toString() ? `?${params.toString()}` : "";
    return api.get(`/patients/${patientId}/body-measurements${query}`);
  },

  /**
   * Buscar medição mais recente
   */
  findLatest: (patientId: string): Promise<BodyMeasurement> => {
    return api.get(`/patients/${patientId}/body-measurements/latest`);
  },

  /**
   * Buscar medição específica por ID
   */
  findOne: (
    patientId: string,
    measurementId: string
  ): Promise<BodyMeasurement> => {
    return api.get(`/patients/${patientId}/body-measurements/${measurementId}`);
  },

  /**
   * Atualizar medição
   */
  update: (
    patientId: string,
    measurementId: string,
    data: UpdateBodyMeasurementDto
  ): Promise<BodyMeasurement> => {
    return api.patch(
      `/patients/${patientId}/body-measurements/${measurementId}`,
      data
    );
  },

  /**
   * Remover medição
   */
  remove: (
    patientId: string,
    measurementId: string
  ): Promise<{ message: string }> => {
    return api.delete(
      `/patients/${patientId}/body-measurements/${measurementId}`
    );
  },

  /**
   * Comparar medições entre duas datas
   */
  compare: (
    patientId: string,
    options?: {
      from?: string;
      to?: string;
    }
  ): Promise<CompareMeasurementsResponse> => {
    const params = new URLSearchParams();
    if (options?.from) params.append("from", options.from);
    if (options?.to) params.append("to", options.to);

    const query = params.toString() ? `?${params.toString()}` : "";
    return api.get(`/patients/${patientId}/body-measurements/compare${query}`);
  },

  /**
   * Obter dados de evolução para gráficos
   */
  getEvolution: (
    patientId: string,
    options: {
      metric:
        | "weight"
        | "bmi"
        | "bodyFatPercent"
        | "muscleMass"
        | "waistCirc"
        | "hipCirc";
      period?: "1m" | "3m" | "6m" | "1y" | "all";
    }
  ): Promise<EvolutionResponse> => {
    const params = new URLSearchParams();
    params.append("metric", options.metric);
    if (options.period) params.append("period", options.period);

    return api.get(
      `/patients/${patientId}/body-measurements/evolution?${params.toString()}`
    );
  },
};

// ============================================
// HEALTH INFO
// ============================================

export const healthInfoService = {
  /**
   * Buscar informações de saúde do paciente
   */
  findOne: (patientId: string): Promise<HealthInfo> => {
    return api.get(`/patients/${patientId}/health-info`);
  },

  /**
   * Atualizar informações de saúde completas
   */
  update: (
    patientId: string,
    data: UpdateHealthInfoDto
  ): Promise<HealthInfo> => {
    return api.put(`/patients/${patientId}/health-info`, data);
  },

  /**
   * Atualizar apenas uma seção específica
   */
  updateSection: (
    patientId: string,
    data: UpdateHealthInfoSectionDto
  ): Promise<HealthInfo> => {
    return api.patch(`/patients/${patientId}/health-info/section`, data);
  },
};

// ============================================
// GOALS
// ============================================

export const goalsService = {
  /**
   * Criar nova meta
   */
  create: (patientId: string, data: CreateGoalDto): Promise<Goal> => {
    console.log("🎯 [goalsService.create] Enviando requisição:", {
      patientId,
      data,
      dataKeys: Object.keys(data),
      type: data.type,
      target: data.target,
      current: data.current,
      unit: data.unit,
      deadline: data.deadline,
      notes: data.notes,
    });
    return api.post(`/patients/${patientId}/goals`, data);
  },

  /**
   * Listar todas as metas do paciente
   */
  findAll: async (patientId: string, achieved?: boolean): Promise<Goal[]> => {
    const params = new URLSearchParams();
    if (achieved !== undefined) params.append("achieved", achieved.toString());

    const query = params.toString() ? `?${params.toString()}` : "";
    console.log("🎯 [goalsService.findAll] Fazendo requisição:", {
      url: `/patients/${patientId}/goals${query}`,
      patientId,
      achieved,
    });

    const response = await api.get(`/patients/${patientId}/goals${query}`);

    console.log("🎯 [goalsService.findAll] Resposta recebida:", {
      response,
      responseType: typeof response,
      isArray: Array.isArray(response),
      responseKeys: response ? Object.keys(response) : [],
      responseData: response?.data,
      responseDataType: typeof response?.data,
      isDataArray: Array.isArray(response?.data),
      hasGoalsProperty: response?.data?.goals !== undefined,
    });

    // IMPORTANTE: O GoalsController retorna diretamente um array de goals
    // Após o TransformInterceptor: {success: true, data: [goal1, goal2, ...]}
    // A rota antiga do PatientsController retornava: {success: true, data: {goals: [...]}}
    const goals = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.data?.goals)
      ? response.data.goals
      : Array.isArray(response)
      ? response
      : [];

    console.log("🎯 [goalsService.findAll] Goals extraídos:", {
      count: goals.length,
      firstGoal: goals[0],
      allGoals: goals,
    });

    return goals;
  },

  /**
   * Obter progresso geral das metas
   */
  getProgress: (patientId: string): Promise<GoalsProgressResponse> => {
    return api.get(`/patients/${patientId}/goals/progress`);
  },

  /**
   * Buscar meta específica por ID
   */
  findOne: (patientId: string, goalId: string): Promise<Goal> => {
    return api.get(`/patients/${patientId}/goals/${goalId}`);
  },

  /**
   * Atualizar meta
   */
  update: (
    patientId: string,
    goalId: string,
    data: UpdateGoalDto
  ): Promise<Goal> => {
    return api.patch(`/patients/${patientId}/goals/${goalId}`, data);
  },

  /**
   * Atualizar progresso da meta (altera current sem modificar initial)
   */
  updateProgress: (
    patientId: string,
    goalId: string,
    data: { current: number; notes?: string }
  ): Promise<Goal> => {
    return api.patch(`/patients/${patientId}/goals/${goalId}/progress`, data);
  },

  /**
   * Marcar meta como alcançada
   */
  achieve: (
    patientId: string,
    goalId: string,
    data: AchieveGoalDto
  ): Promise<Goal> => {
    return api.patch(`/patients/${patientId}/goals/${goalId}/achieve`, data);
  },

  /**
   * Remover meta
   */
  remove: (patientId: string, goalId: string): Promise<{ message: string }> => {
    return api.delete(`/patients/${patientId}/goals/${goalId}`);
  },

  /**
   * Excluir meta (wrapper para remove com tratamento de resposta)
   */
  deleteGoal: async (
    patientId: string,
    goalId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.delete(`/patients/${patientId}/goals/${goalId}`);
      return { success: true };
    } catch (error) {
      console.error("Error deleting goal:", error);
      return { success: false, message: "Erro ao excluir meta" };
    }
  },

  /**
   * Marcar meta como concluída (wrapper para achieve)
   */
  achieveGoal: async (
    patientId: string,
    goalId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.patch(`/patients/${patientId}/goals/${goalId}/achieve`, {
        achievedAt: new Date().toISOString(),
      });
      return { success: true };
    } catch (error) {
      console.error("Error achieving goal:", error);
      return { success: false, message: "Erro ao atualizar meta" };
    }
  },
};
