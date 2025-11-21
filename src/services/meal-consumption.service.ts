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
  createdAt: string;
  updatedAt: string;
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
  return response.data;
};
