/**
 * Service para comunicação com API de Consumo de Refeições
 * Feature #4 - App do Paciente
 */

import { api } from "./api";

// ===== TYPES =====

export interface MealConsumption {
  id: string;
  mealId: string;
  patientId: string;
  consumedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  meal?: {
    id: string;
    name: string;
    type: string;
    description?: string;
  };
}

export interface CreateMealConsumptionDto {
  mealId: string;
  patientId: string;
  consumedAt?: string;
  notes?: string;
}

export interface UpdateMealConsumptionDto {
  consumedAt?: string;
  notes?: string;
}

export interface FilterMealConsumptionDto {
  patientId?: string;
  mealId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}

export interface PatientMealPlan {
  id: string;
  name: string;
  objective?: string;
  startDate: string;
  endDate?: string;
  status: string;
  totalMeals: number;
  consumedMeals: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

// Interface da API
interface GoalFromApi {
  id: string;
  name: string | null;
  type: string; // WEIGHT, WAIST_CIRC, etc.
  target: number;
  current: number;
  initialValue?: number; // Valor inicial (do histórico de progresso)
  unit: string;
  deadline: string | null;
  notes: string | null;
  achieved: boolean;
  achievedAt: string | null;
  patientId: string;
  createdAt: string;
  updatedAt: string;
}

// Interface usada no app (compatível com tela)
export interface PatientGoal {
  id: string;
  name: string;
  targetValue: number;
  currentValue: number;
  initialValue: number;
  unit: string;
  deadline?: string;
  status: string;
  progress: number;
  type: string;
  notes: string | null;
  achieved: boolean;
  achievedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoalProgressHistory {
  id: string;
  goalId: string;
  event: "CREATED" | "UPDATED" | "ACHIEVED" | "EXPIRED";
  value: number;
  notes: string | null;
  createdAt: string;
}

export interface UpdateGoalProgressDto {
  current: number;
  notes?: string;
}

// ===== MEAL CONSUMPTION ENDPOINTS =====

/**
 * Criar um novo registro de consumo de refeição
 */
export const createMealConsumption = async (
  data: CreateMealConsumptionDto
): Promise<MealConsumption> => {
  const response = await api.post("/meal-consumptions", data);
  return response.data;
};

/**
 * Listar consumos com filtros
 */
export const getMealConsumptions = async (
  filters?: FilterMealConsumptionDto
): Promise<MealConsumption[]> => {
  let url = "/meal-consumptions";

  if (filters) {
    const queryParams = new URLSearchParams();
    if (filters.patientId) queryParams.append("patientId", filters.patientId);
    if (filters.mealId) queryParams.append("mealId", filters.mealId);
    if (filters.startDate) queryParams.append("startDate", filters.startDate);
    if (filters.endDate) queryParams.append("endDate", filters.endDate);

    const queryString = queryParams.toString();
    if (queryString) url += `?${queryString}`;
  }

  const response = await api.get(url);
  return response.data;
};

/**
 * Buscar um consumo por ID
 */
export const getMealConsumptionById = async (
  id: string
): Promise<MealConsumption> => {
  const response = await api.get(`/meal-consumptions/${id}`);
  return response.data;
};

/**
 * Atualizar um registro de consumo
 */
export const updateMealConsumption = async (
  id: string,
  data: UpdateMealConsumptionDto
): Promise<MealConsumption> => {
  const response = await api.patch(`/meal-consumptions/${id}`, data);
  return response.data;
};

/**
 * Deletar um registro de consumo
 */
export const deleteMealConsumption = async (id: string): Promise<void> => {
  await api.delete(`/meal-consumptions/${id}`);
};

// ===== PATIENT ENDPOINTS =====

// Função auxiliar para calcular progresso
const calculateProgress = (
  current: number,
  target: number,
  initial?: number
): number => {
  // Se não temos valor inicial, assumimos que começou do current
  const start = initial ?? current;

  // Se target é maior que start (objetivo é aumentar)
  if (target > start) {
    const totalChange = target - start;
    const currentChange = current - start;
    return Math.min(
      100,
      Math.max(0, Math.round((currentChange / totalChange) * 100))
    );
  }

  // Se target é menor que start (objetivo é diminuir)
  if (target < start) {
    const totalChange = start - target;
    const currentChange = start - current;
    return Math.min(
      100,
      Math.max(0, Math.round((currentChange / totalChange) * 100))
    );
  }

  // Se são iguais, meta já alcançada
  return 100;
};

// Função para transformar dados da API para formato do app
const transformGoal = (apiGoal: GoalFromApi): PatientGoal => {
  // Calcular progresso baseado em current e target
  const progress = calculateProgress(apiGoal.current, apiGoal.target);

  // Traduzir tipo para nome legível
  const typeNames: Record<string, string> = {
    WEIGHT: "Peso",
    WAIST_CIRC: "Circunferência da Cintura",
    BODY_FAT: "Gordura Corporal",
    MUSCLE_MASS: "Massa Muscular",
  };

  return {
    id: apiGoal.id,
    name: apiGoal.name || typeNames[apiGoal.type] || apiGoal.type,
    targetValue: apiGoal.target,
    currentValue: apiGoal.current,
    initialValue: apiGoal.initialValue ?? apiGoal.current, // Usa initialValue da API ou current como fallback
    unit: apiGoal.unit,
    deadline: apiGoal.deadline || undefined,
    status: apiGoal.achieved ? "ACHIEVED" : "ACTIVE",
    progress,
    type: apiGoal.type,
    notes: apiGoal.notes,
    achieved: apiGoal.achieved,
    achievedAt: apiGoal.achievedAt || undefined,
    createdAt: apiGoal.createdAt,
    updatedAt: apiGoal.updatedAt,
  };
};

/**
 * Buscar planos alimentares do paciente com progresso
 */
export const getPatientMealPlans = async (
  patientId: string
): Promise<{ plans: PatientMealPlan[] }> => {
  const response = await api.get(`/patients/${patientId}/meal-plans`);
  return response.data;
};

/**
 * Buscar metas do paciente com progresso
 */
export const getPatientGoals = async (
  patientId: string
): Promise<{ goals: PatientGoal[] }> => {
  const response = await api.get(`/patients/${patientId}/goals`);

  let rawGoals: GoalFromApi[] = [];

  // Handle { success, data: [...] } structure
  if (
    response.data &&
    response.data.data &&
    Array.isArray(response.data.data)
  ) {
    rawGoals = response.data.data;
  }
  // Handle [...] direct array
  else if (Array.isArray(response.data)) {
    rawGoals = response.data;
  }
  // Handle { goals: [...] } structure
  else if (response.data && response.data.goals) {
    rawGoals = response.data.goals;
  } else {
    return { goals: [] };
  }

  // Transformar dados da API para formato do app
  const transformedGoals = rawGoals.map(transformGoal);

  return { goals: transformedGoals };
};

/**
 * Buscar meta específica por ID (paciente)
 */
export const getPatientGoalById = async (
  patientId: string,
  goalId: string
): Promise<PatientGoal> => {
  const response = await api.get(`/patients/${patientId}/goals/${goalId}`);
  const rawGoal = response.data.data || response.data;

  const transformed = transformGoal(rawGoal);

  return transformed;
};

/**
 * Atualizar progresso de uma meta (paciente)
 */
export const updateGoalProgress = async (
  patientId: string,
  goalId: string,
  data: UpdateGoalProgressDto
): Promise<PatientGoal> => {
  const response = await api.patch(
    `/patients/${patientId}/goals/${goalId}/progress`,
    data
  );

  const rawGoal = response.data.data || response.data;

  const transformed = transformGoal(rawGoal);

  return transformed;
};

/**
 * Concluir meta (paciente)
 */
export const completeGoal = async (
  patientId: string,
  goalId: string,
  currentValue: number
): Promise<PatientGoal> => {
  const response = await api.patch(
    `/patients/${patientId}/goals/${goalId}/achieve`,
    { achieved: true, current: currentValue }
  );

  const rawGoal = response.data.data || response.data;
  return transformGoal(rawGoal);
};

/**
 * Buscar histórico de progresso de uma meta
 */
export const getGoalHistory = async (
  patientId: string,
  goalId: string
): Promise<GoalProgressHistory[]> => {
  const response = await api.get(
    `/patients/${patientId}/goals/${goalId}/history`
  );

  return response.data.data || response.data || [];
};
