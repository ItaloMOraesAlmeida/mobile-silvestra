/**
 * Service para comunicação com API de Planos Alimentares
 * Sprint 8-9 - Meal Plans Module
 */

import { api } from "./api";
import type {
  MealPlan,
  CreateMealPlanDto,
  UpdateMealPlanDto,
  FilterMealPlanDto,
  CreateMealDto,
  UpdateMealDto,
  Meal,
  CreateMealItemDto,
  UpdateMealItemDto,
  FoodNutrition,
  ShoppingList,
  ShoppingListItem,
} from "../types/meal-plan.types";

// ===== MEAL PLAN ENDPOINTS =====

/**
 * Criar um novo plano alimentar
 */
export const createMealPlan = async (
  data: CreateMealPlanDto
): Promise<MealPlan> => {
  const response = await api.post("/meal-plans", data);
  return response.data;
};

/**
 * Listar planos alimentares com filtros
 */
export const getMealPlans = async (
  filters?: FilterMealPlanDto
): Promise<MealPlan[]> => {
  let url = "/meal-plans";
  if (filters) {
    const queryParams = new URLSearchParams();
    if (filters.patientId) queryParams.append("patientId", filters.patientId);
    if (filters.status) queryParams.append("status", filters.status);
    if (filters.search) queryParams.append("search", filters.search);
    if (filters.isTemplate !== undefined)
      queryParams.append("isTemplate", String(filters.isTemplate));
    const queryString = queryParams.toString();
    if (queryString) url += `?${queryString}`;
  }
  const response = await api.get(url);
  return response.data;
};

/**
 * Buscar um plano por ID
 */
export const getMealPlanById = async (id: string): Promise<MealPlan> => {
  const response = await api.get(`/meal-plans/${id}`);
  return response.data;
};

/**
 * Atualizar um plano alimentar
 */
export const updateMealPlan = async (
  id: string,
  data: UpdateMealPlanDto
): Promise<MealPlan> => {
  const response = await api.put(`/meal-plans/${id}`, data);
  return response.data;
};

/**
 * Deletar um plano alimentar
 */
export const deleteMealPlan = async (id: string): Promise<void> => {
  await api.delete(`/meal-plans/${id}`);
};

/**
 * Clonar um plano alimentar
 */
export const cloneMealPlan = async (
  id: string,
  newPatientId?: string
): Promise<MealPlan> => {
  const response = await api.post(`/meal-plans/${id}/clone`, { newPatientId });
  return response.data;
};

/**
 * Exportar plano alimentar como PDF
 * Retorna URL do arquivo salvo localmente
 */
export const exportMealPlanPdf = async (planId: string): Promise<string> => {
  const response = await api.get(`/meal-plans/${planId}/export-pdf`, {
    responseType: "blob",
  });

  return response.data;
};

// ===== MEAL ENDPOINTS =====

/**
 * Adicionar uma refeição a um plano
 */
export const addMeal = async (
  planId: string,
  data: CreateMealDto
): Promise<Meal> => {
  const response = await api.post(`/meal-plans/${planId}/meals`, data);
  return response.data;
};

/**
 * Atualizar uma refeição
 */
export const updateMeal = async (
  mealId: string,
  data: UpdateMealDto
): Promise<Meal> => {
  const response = await api.put(`/meal-plans/meals/${mealId}`, data);
  return response.data;
};

/**
 * Deletar uma refeição
 */
export const deleteMeal = async (mealId: string): Promise<void> => {
  await api.delete(`/meal-plans/meals/${mealId}`);
};

// ===== MEAL ITEM ENDPOINTS =====

/**
 * Adicionar um alimento a uma refeição
 */
export const addMealItem = async (
  mealId: string,
  data: CreateMealItemDto
): Promise<FoodNutrition> => {
  const response = await api.post(`/meal-plans/meals/${mealId}/items`, data);
  return response.data;
};

/**
 * Atualizar um item de refeição
 */
export const updateMealItem = async (
  itemId: string,
  data: UpdateMealItemDto
): Promise<FoodNutrition> => {
  const response = await api.put(`/meal-plans/meal-items/${itemId}`, data);
  return response.data;
};

/**
 * Deletar um item de refeição
 */
export const deleteMealItem = async (itemId: string): Promise<void> => {
  await api.delete(`/meal-plans/meal-items/${itemId}`);
};

// ===== SHOPPING LIST ENDPOINTS =====

/**
 * Gerar ou atualizar lista de compras
 */
export const generateShoppingList = async (
  planId: string
): Promise<ShoppingList> => {
  const response = await api.post(`/meal-plans/${planId}/shopping-list`);
  return response.data;
};

/**
 * Marcar/desmarcar item como comprado
 */
export const toggleShoppingItem = async (
  itemId: string
): Promise<ShoppingListItem> => {
  const response = await api.put(`/meal-plans/shopping-items/${itemId}/toggle`);
  return response.data;
};
