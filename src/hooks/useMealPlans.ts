/**
 * Hook customizado para gerenciar planos alimentares
 * Integração simplificada com a API de meal-plans
 */

import { useState, useCallback } from "react";
import { api } from "../services/api";

export interface MealPlan {
  id: string;
  name: string;
  description?: string;
  patientId: string;
  startDate: string;
  endDate?: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  isTemplate: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Informações resumidas
  totalMeals?: number;
  totalCalories?: number;
}

export interface CreateMealPlanDto {
  name: string;
  description?: string;
  patientId: string;
  startDate: string;
  endDate?: string;
  status?: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  notes?: string;
}

export interface UpdateMealPlanDto {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  notes?: string;
}

export function useMealPlans() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Listar planos alimentares de um paciente
   */
  const listMealPlans = useCallback(
    async (patientId: string): Promise<MealPlan[]> => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/meal-plans?patientId=${patientId}`);
        return response.data;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Erro ao listar planos alimentares";
        setError(errorMessage);
        console.error("Erro ao listar planos:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Buscar um plano alimentar por ID
   */
  const getMealPlanById = useCallback(async (id: string): Promise<MealPlan> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/meal-plans/${id}`);
      return response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Erro ao buscar plano alimentar";
      setError(errorMessage);
      console.error("Erro ao buscar plano:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Criar um novo plano alimentar
   */
  const createMealPlan = useCallback(
    async (data: CreateMealPlanDto): Promise<MealPlan> => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.post("/meal-plans", data);
        return response.data;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Erro ao criar plano alimentar";
        setError(errorMessage);
        console.error("Erro ao criar plano:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Atualizar um plano alimentar
   */
  const updateMealPlan = useCallback(
    async (id: string, data: UpdateMealPlanDto): Promise<MealPlan> => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.put(`/meal-plans/${id}`, data);
        return response.data;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Erro ao atualizar plano alimentar";
        setError(errorMessage);
        console.error("Erro ao atualizar plano:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Deletar um plano alimentar
   */
  const deleteMealPlan = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await api.delete(`/meal-plans/${id}`);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Erro ao deletar plano alimentar";
      setError(errorMessage);
      console.error("Erro ao deletar plano:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obter lista de compras de um plano
   */
  const getShoppingList = useCallback(async (planId: string): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/meal-plans/${planId}/shopping-list`);
      return response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Erro ao buscar lista de compras";
      setError(errorMessage);
      console.error("Erro ao buscar lista de compras:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Listar templates (planos marcados como isTemplate = true)
   */
  const listTemplates = useCallback(async (): Promise<MealPlan[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/meal-plans?isTemplate=true");
      return response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Erro ao listar templates";
      setError(errorMessage);
      console.error("Erro ao listar templates:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    listMealPlans,
    getMealPlanById,
    createMealPlan,
    updateMealPlan,
    deleteMealPlan,
    getShoppingList,
    listTemplates,
  };
}
