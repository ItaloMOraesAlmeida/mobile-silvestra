/**
 * Food Service - Serviço de comunicação com API de Alimentos
 * Sprint 7 - Banco de Alimentos TACO
 */

import { api } from "./api.service";
import {
  Food,
  FoodListResponse,
  FoodSearchParams,
  FoodFilterParams,
  FoodCategory,
} from "../types/food.types";

/**
 * Buscar alimentos com paginação e filtros
 */
export async function searchFoods(
  params: FoodSearchParams = {}
): Promise<FoodListResponse> {
  const queryParams = new URLSearchParams();

  if (params.search) queryParams.append("search", params.search);
  if (params.categoryId) queryParams.append("categoryId", params.categoryId);
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.orderBy) queryParams.append("orderBy", params.orderBy);
  if (params.order) queryParams.append("order", params.order);

  const url = `/foods?${queryParams.toString()}`;

  // Support optional abort signal passed via params.signal
  const response = await api.get<{ success: boolean; data: FoodListResponse }>(
    url,
    {
      signal: params.signal,
    }
  );

  // API retorna { success: true, data: {...} } por causa do TransformInterceptor
  return response.data || response;
}

/**
 * Buscar alimento por ID
 */
export async function getFoodById(id: string): Promise<Food> {
  const response = await api.get<{ success: boolean; data: Food }>(
    `/foods/${id}`
  );
  return response.data || response;
}

/**
 * Buscar alimentos com filtros nutricionais avançados
 */
export async function filterFoods(
  filters: FoodFilterParams,
  signal?: AbortSignal
): Promise<Food[]> {
  const response = await api.post<{ success: boolean; data: Food[] }>(
    "/foods/filter",
    filters,
    undefined,
    signal
  );
  return response.data || response;
}

/**
 * Buscar todas as categorias
 */
export async function getCategories(): Promise<FoodCategory[]> {
  try {
    const response = await api.get<{ success: boolean; data: FoodCategory[] }>(
      "/foods/categories"
    );

    // Validação: garante que a resposta seja sempre um array
    if (!response) {
      return [];
    }

    // API retorna { success: true, data: [...] } por causa do TransformInterceptor
    const data = response.data || response;

    if (Array.isArray(data)) {
      return data;
    }

    return [];
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return []; // Retorna array vazio em caso de erro
  }
}

/**
 * Comparar múltiplos alimentos
 */
export async function compareFoods(ids: string[]): Promise<Food[]> {
  const idsParam = ids.join(",");
  const response = await api.get<{ success: boolean; data: Food[] }>(
    `/foods/compare?ids=${idsParam}`
  );
  return response.data || response;
}

/**
 * Buscar alimentos favoritos (com cache local)
 */
export async function getFavorites(favoriteIds: string[]): Promise<Food[]> {
  if (favoriteIds.length === 0) return [];

  // Buscar em lotes de 10 para não sobrecarregar a API
  const batches: string[][] = [];
  for (let i = 0; i < favoriteIds.length; i += 10) {
    batches.push(favoriteIds.slice(i, i + 10));
  }

  const results = await Promise.all(
    batches.map((batch) => compareFoods(batch))
  );

  return results.flat();
}

export const foodService = {
  searchFoods,
  getFoodById,
  filterFoods,
  getCategories,
  compareFoods,
  getFavorites,
};
