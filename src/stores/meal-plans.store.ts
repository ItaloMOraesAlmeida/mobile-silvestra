/**
 * Zustand Store para Planos Alimentares
 * Sprint 8-9 - Meal Plans Module
 *
 * Gerencia estado de planos alimentares, refeições e lista de compras
 */

import { create } from "zustand";
import type {
  MealPlan,
  CreateMealPlanDto,
  UpdateMealPlanDto,
  FilterMealPlanDto,
  PlanStatus,
  Meal,
  CreateMealDto,
  UpdateMealDto,
  CreateMealItemDto,
  UpdateMealItemDto,
  FoodNutrition,
  ShoppingList,
  MealBuilderState,
} from "../types/meal-plan.types";
import { DayOfWeek } from "../types/meal-plan.types";
import * as mealPlanService from "../services/meal-plan.service";

interface MealPlansState {
  // ===== STATE =====
  plans: MealPlan[];
  selectedPlan: MealPlan | null;
  selectedMeal: Meal | null;
  shoppingList: ShoppingList | null;

  // Builder state (para construtor visual)
  builderState: MealBuilderState | null;

  // UI state
  loading: boolean;
  error: string | null;

  // Filtros
  activeFilters: FilterMealPlanDto;

  // Cache
  cache: Map<string, { data: MealPlan; timestamp: number }>;
  cacheTTL: number; // 5 minutos

  // ===== ACTIONS - MEAL PLANS =====
  loadPlans: (filters?: FilterMealPlanDto) => Promise<void>;
  loadPlanById: (id: string, forceRefresh?: boolean) => Promise<void>;
  createPlan: (data: CreateMealPlanDto) => Promise<MealPlan>;
  updatePlan: (id: string, data: UpdateMealPlanDto) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  clonePlan: (id: string, newPatientId?: string) => Promise<MealPlan>;
  exportPlanPdf: (id: string) => Promise<string>;
  setSelectedPlan: (plan: MealPlan | null) => void;
  setActiveFilters: (filters: FilterMealPlanDto) => void;
  clearFilters: () => void;

  // ===== ACTIONS - MEALS =====
  addMeal: (planId: string, data: CreateMealDto) => Promise<void>;
  updateMeal: (mealId: string, data: UpdateMealDto) => Promise<void>;
  deleteMeal: (mealId: string) => Promise<void>;
  setSelectedMeal: (meal: Meal | null) => void;

  // ===== ACTIONS - MEAL ITEMS =====
  addMealItem: (mealId: string, data: CreateMealItemDto) => Promise<void>;
  updateMealItem: (itemId: string, data: UpdateMealItemDto) => Promise<void>;
  deleteMealItem: (itemId: string) => Promise<void>;

  // ===== ACTIONS - MEAL ITEM SUBSTITUTIONS =====
  addSubstitutionToItem: (
    mealIndex: number,
    itemIndex: number,
    substitution: any
  ) => void;
  removeSubstitutionFromItem: (
    mealIndex: number,
    itemIndex: number,
    substitutionIndex: number
  ) => void;
  updateSubstitutionInItem: (
    mealIndex: number,
    itemIndex: number,
    substitutionIndex: number,
    substitution: any
  ) => void;

  // ===== ACTIONS - SHOPPING LIST =====
  generateShoppingList: (planId: string) => Promise<void>;
  toggleShoppingItem: (itemId: string) => Promise<void>;
  clearShoppingList: () => void;

  // ===== ACTIONS - BUILDER =====
  initBuilder: (patientId: string, planId?: string) => Promise<void>;
  initBuilderForEdit: (planId: string) => Promise<void>;
  updateBuilderField: <K extends keyof MealBuilderState>(
    field: K,
    value: MealBuilderState[K]
  ) => void;
  addMealToBuilder: (meal: any) => void;
  updateMealInBuilder: (mealIndex: number, meal: any) => void;
  removeMealFromBuilder: (mealIndex: number) => void;
  addItemToMeal: (mealIndex: number, item: any) => void;
  updateItemInMeal: (mealIndex: number, itemIndex: number, item: any) => void;
  removeItemFromMeal: (mealIndex: number, itemIndex: number) => void;
  savePlanFromBuilder: () => Promise<MealPlan>;
  clearBuilder: () => void;

  // ===== ACTIONS - WEEK DAYS =====
  setCurrentDay: (day: DayOfWeek) => void;
  canAccessDay: (day: DayOfWeek) => boolean;
  getFilledDays: () => DayOfWeek[];
  getMealCountByDay: () => Record<DayOfWeek, number>;
  copyMealsToDay: (sourceDay: DayOfWeek, targetDay: DayOfWeek) => void;

  // ===== UTILS =====
  clearCache: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useMealPlansStore = create<MealPlansState>((set, get) => ({
  // ===== INITIAL STATE =====
  plans: [],
  selectedPlan: null,
  selectedMeal: null,
  shoppingList: null,
  builderState: null,
  loading: false,
  error: null,
  activeFilters: {},
  cache: new Map(),
  cacheTTL: 5 * 60 * 1000, // 5 minutos

  // ===== MEAL PLANS ACTIONS =====

  loadPlans: async (filters?: FilterMealPlanDto) => {
    set({ loading: true, error: null });
    try {
      const plans = await mealPlanService.getMealPlans(filters);
      set({ plans, loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao carregar planos",
        loading: false,
      });
    }
  },

  loadPlanById: async (id: string, forceRefresh = false) => {
    const { cache, cacheTTL } = get();

    // Verificar cache
    if (!forceRefresh) {
      const cached = cache.get(id);
      if (cached && Date.now() - cached.timestamp < cacheTTL) {
        set({ selectedPlan: cached.data });
        return;
      }
    }

    set({ loading: true, error: null });
    try {
      const plan = await mealPlanService.getMealPlanById(id);

      // Atualizar cache
      cache.set(id, { data: plan, timestamp: Date.now() });

      set({ selectedPlan: plan, cache, loading: false });
    } catch (error: any) {
      set({ error: error.message || "Erro ao carregar plano", loading: false });
    }
  },

  createPlan: async (data: CreateMealPlanDto) => {
    set({ loading: true, error: null });
    try {
      const plan = await mealPlanService.createMealPlan(data);
      const { plans } = get();
      set({
        plans: [plan, ...plans],
        selectedPlan: plan,
        loading: false,
      });
      return plan;
    } catch (error: any) {
      set({ error: error.message || "Erro ao criar plano", loading: false });
      throw error;
    }
  },

  updatePlan: async (id: string, data: UpdateMealPlanDto) => {
    set({ loading: true, error: null });
    try {
      const updated = await mealPlanService.updateMealPlan(id, data);
      const { plans, cache } = get();

      // Atualizar lista
      const updatedPlans = plans.map((p) => (p.id === id ? updated : p));

      // Atualizar cache
      cache.set(id, { data: updated, timestamp: Date.now() });

      set({
        plans: updatedPlans,
        selectedPlan: updated,
        cache,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao atualizar plano",
        loading: false,
      });
    }
  },

  deletePlan: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await mealPlanService.deleteMealPlan(id);
      const { plans, cache } = get();

      // Remover da lista
      const filteredPlans = plans.filter((p) => p.id !== id);

      // Remover do cache
      cache.delete(id);

      set({
        plans: filteredPlans,
        selectedPlan: null,
        cache,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message || "Erro ao deletar plano", loading: false });
    }
  },

  clonePlan: async (id: string, newPatientId?: string) => {
    set({ loading: true, error: null });
    try {
      const cloned = await mealPlanService.cloneMealPlan(id, newPatientId);
      const { plans } = get();
      set({
        plans: [cloned, ...plans],
        selectedPlan: cloned,
        loading: false,
      });
      return cloned;
    } catch (error: any) {
      set({ error: error.message || "Erro ao clonar plano", loading: false });
      throw error;
    }
  },

  exportPlanPdf: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const fileUri = await mealPlanService.exportMealPlanPdf(id);
      set({ loading: false });
      return fileUri;
    } catch (error: any) {
      set({ error: error.message || "Erro ao exportar PDF", loading: false });
      throw error;
    }
  },

  setSelectedPlan: (plan) => set({ selectedPlan: plan }),

  setActiveFilters: (filters) => set({ activeFilters: filters }),

  clearFilters: () => set({ activeFilters: {} }),

  // ===== MEALS ACTIONS =====

  addMeal: async (planId: string, data: CreateMealDto) => {
    set({ loading: true, error: null });
    try {
      await mealPlanService.addMeal(planId, data);
      // Recarregar plano
      await get().loadPlanById(planId, true);
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao adicionar refeição",
        loading: false,
      });
    }
  },

  updateMeal: async (mealId: string, data: UpdateMealDto) => {
    set({ loading: true, error: null });
    try {
      await mealPlanService.updateMeal(mealId, data);
      // Recarregar plano selecionado
      const { selectedPlan } = get();
      if (selectedPlan) {
        await get().loadPlanById(selectedPlan.id, true);
      }
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao atualizar refeição",
        loading: false,
      });
    }
  },

  deleteMeal: async (mealId: string) => {
    set({ loading: true, error: null });
    try {
      await mealPlanService.deleteMeal(mealId);
      // Recarregar plano selecionado
      const { selectedPlan } = get();
      if (selectedPlan) {
        await get().loadPlanById(selectedPlan.id, true);
      }
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao deletar refeição",
        loading: false,
      });
    }
  },

  setSelectedMeal: (meal) => set({ selectedMeal: meal }),

  // ===== MEAL ITEMS ACTIONS =====

  addMealItem: async (mealId: string, data: CreateMealItemDto) => {
    set({ loading: true, error: null });
    try {
      await mealPlanService.addMealItem(mealId, data);
      // Recarregar plano selecionado
      const { selectedPlan } = get();
      if (selectedPlan) {
        await get().loadPlanById(selectedPlan.id, true);
      }
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao adicionar alimento",
        loading: false,
      });
    }
  },

  updateMealItem: async (itemId: string, data: UpdateMealItemDto) => {
    set({ loading: true, error: null });
    try {
      await mealPlanService.updateMealItem(itemId, data);
      // Recarregar plano selecionado
      const { selectedPlan } = get();
      if (selectedPlan) {
        await get().loadPlanById(selectedPlan.id, true);
      }
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao atualizar alimento",
        loading: false,
      });
    }
  },

  deleteMealItem: async (itemId: string) => {
    set({ loading: true, error: null });
    try {
      await mealPlanService.deleteMealItem(itemId);
      // Recarregar plano selecionado
      const { selectedPlan } = get();
      if (selectedPlan) {
        await get().loadPlanById(selectedPlan.id, true);
      }
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao deletar alimento",
        loading: false,
      });
    }
  },

  // ===== SHOPPING LIST ACTIONS =====

  generateShoppingList: async (planId: string) => {
    set({ loading: true, error: null });
    try {
      const shoppingList = await mealPlanService.generateShoppingList(planId);
      set({ shoppingList, loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao gerar lista de compras",
        loading: false,
      });
    }
  },

  toggleShoppingItem: async (itemId: string) => {
    try {
      const updatedItem = await mealPlanService.toggleShoppingItem(itemId);
      const { shoppingList } = get();

      if (shoppingList) {
        // Atualizar item na lista
        const updatedCategories = shoppingList.categories.map((category) => ({
          ...category,
          items: category.items.map((item) =>
            item.id === itemId ? updatedItem : item
          ),
        }));

        // Recalcular checked items
        const checkedCount = updatedCategories.reduce(
          (acc, cat) => acc + cat.items.filter((i) => i.checked).length,
          0
        );

        set({
          shoppingList: {
            ...shoppingList,
            categories: updatedCategories,
            checkedItems: checkedCount,
          },
        });
      }
    } catch (error: any) {
      set({ error: error.message || "Erro ao atualizar item" });
    }
  },

  clearShoppingList: () => set({ shoppingList: null }),

  // ===== BUILDER ACTIONS =====

  initBuilder: async (patientId: string, planId?: string) => {
    set({ loading: true, error: null });
    try {
      if (planId) {
        // Editar plano existente - usar initBuilderForEdit
        await get().initBuilderForEdit(planId);
      } else {
        // Criar novo plano - inicializar com estrutura de dias
        const emptyMealsByDay = {
          [DayOfWeek.MONDAY]: [],
          [DayOfWeek.TUESDAY]: [],
          [DayOfWeek.WEDNESDAY]: [],
          [DayOfWeek.THURSDAY]: [],
          [DayOfWeek.FRIDAY]: [],
          [DayOfWeek.SATURDAY]: [],
          [DayOfWeek.SUNDAY]: [],
        } as Record<DayOfWeek, any[]>;

        set({
          builderState: {
            planName: "",
            patientId,
            startDate: new Date(),
            status: "DRAFT" as PlanStatus,
            mealsByDay: emptyMealsByDay,
            currentDay: DayOfWeek.MONDAY,
            meals: [], // Aponta para mealsByDay[MONDAY] (vazio no início)
            isTemplate: false,
          },
          loading: false,
        });
      }
    } catch (error: any) {
      set({
        error: error.message || "Erro ao iniciar builder",
        loading: false,
      });
    }
  },

  initBuilderForEdit: async (planId: string) => {
    set({ loading: true, error: null });
    try {
      // Buscar plano completo com todas as refeições e itens
      const plan = await mealPlanService.getMealPlanById(planId);

      // Converter meals do backend para formato do builder
      const builderMeals =
        plan.meals?.map((meal: any) => ({
          id: meal.id,
          name: meal.name,
          type: meal.type,
          dayOfWeek: meal.dayOfWeek || ("MONDAY" as DayOfWeek), // Adicionar dayOfWeek
          time: meal.time,
          order: meal.order,
          observation: meal.observation,
          items:
            meal.items?.map((item: FoodNutrition) => ({
              id: item.id,
              foodId: item.id, // FoodNutrition tem id, não foodId
              foodName: item.name,
              category: item.category,
              quantity: item.quantity,
              measurementType: (item as any).measurementType || "gramas",
              measurementUnit: (item as any).measurementUnit,
              observation: item.observation,
              // Valores nutricionais
              calories: item.calories,
              protein: item.protein,
              carbs: item.carbs,
              fat: item.fat,
              fiber: item.fiber,
            })) || [],
        })) || [];

      // Organizar meals por dia da semana
      const mealsByDay: Record<DayOfWeek, any[]> = {
        [DayOfWeek.MONDAY]: [],
        [DayOfWeek.TUESDAY]: [],
        [DayOfWeek.WEDNESDAY]: [],
        [DayOfWeek.THURSDAY]: [],
        [DayOfWeek.FRIDAY]: [],
        [DayOfWeek.SATURDAY]: [],
        [DayOfWeek.SUNDAY]: [],
      };

      builderMeals.forEach((meal: any) => {
        const day = meal.dayOfWeek || "MONDAY";
        mealsByDay[day as DayOfWeek].push(meal);
      });

      const currentDay: DayOfWeek = DayOfWeek.MONDAY;

      set({
        builderState: {
          planId: plan.id,
          planName: plan.name,
          description: plan.description,
          patientId: plan.patientId,
          startDate: new Date(plan.startDate),
          endDate: plan.endDate ? new Date(plan.endDate) : undefined,
          status: plan.status,
          targetCalories: plan.nutrition.targetCalories,
          targetProtein: plan.nutrition.targetProtein,
          targetCarbs: plan.nutrition.targetCarbs,
          targetFat: plan.nutrition.targetFat,
          targetFiber: plan.nutrition.targetFiber,
          mealsByDay,
          currentDay,
          meals: mealsByDay[currentDay], // Aponta para segunda-feira inicialmente
          notes: plan.notes,
          isTemplate: plan.isTemplate,
        },
        selectedPlan: plan,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao carregar plano para edição",
        loading: false,
      });
      throw error;
    }
  },

  updateBuilderField: (field, value) => {
    const { builderState } = get();
    if (builderState) {
      set({
        builderState: {
          ...builderState,
          [field]: value,
        },
      });
    }
  },

  addMealToBuilder: (meal) => {
    const { builderState } = get();
    if (builderState) {
      const currentDayMeals = builderState.mealsByDay[builderState.currentDay];

      // Calcular order baseado no número de refeições do dia
      const nextOrder = currentDayMeals.length + 1;

      // Adicionar dayOfWeek e order à refeição
      const mealWithDay = {
        ...meal,
        dayOfWeek: builderState.currentDay,
        order: nextOrder,
        type: meal.type.toUpperCase(), // Converter para maiúscula (BREAKFAST, LUNCH, etc)
      };

      // Atualizar mealsByDay e meals
      const updatedMealsByDay = {
        ...builderState.mealsByDay,
        [builderState.currentDay]: [...currentDayMeals, mealWithDay],
      };

      set({
        builderState: {
          ...builderState,
          mealsByDay: updatedMealsByDay,
          meals: updatedMealsByDay[builderState.currentDay],
        },
      });
    }
  },

  updateMealInBuilder: (mealIndex, meal) => {
    const { builderState } = get();
    if (builderState) {
      const currentDay = builderState.currentDay;
      const updatedMeals = [...builderState.mealsByDay[currentDay]];

      // Manter order existente e garantir type em maiúscula
      updatedMeals[mealIndex] = {
        ...meal,
        dayOfWeek: currentDay,
        order: updatedMeals[mealIndex].order, // Manter order existente
        type: meal.type.toUpperCase(), // Garantir maiúscula
      };

      const updatedMealsByDay = {
        ...builderState.mealsByDay,
        [currentDay]: updatedMeals,
      };

      set({
        builderState: {
          ...builderState,
          mealsByDay: updatedMealsByDay,
          meals: updatedMeals,
        },
      });
    }
  },

  removeMealFromBuilder: (mealIndex) => {
    const { builderState } = get();
    if (builderState) {
      const currentDay = builderState.currentDay;
      const updatedMeals = builderState.mealsByDay[currentDay]
        .filter((_, i) => i !== mealIndex)
        // Recalcular orders após remoção
        .map((meal, index) => ({
          ...meal,
          order: index + 1,
        }));

      const updatedMealsByDay = {
        ...builderState.mealsByDay,
        [currentDay]: updatedMeals,
      };

      set({
        builderState: {
          ...builderState,
          mealsByDay: updatedMealsByDay,
          meals: updatedMeals,
        },
      });
    }
  },

  addItemToMeal: (mealIndex, item) => {
    const { builderState } = get();
    if (builderState) {
      const currentDay = builderState.currentDay;
      const updatedMeals = [...builderState.mealsByDay[currentDay]];
      updatedMeals[mealIndex].items.push(item);

      set({
        builderState: {
          ...builderState,
          mealsByDay: {
            ...builderState.mealsByDay,
            [currentDay]: updatedMeals,
          },
          meals: updatedMeals, // Atualiza atalho também
        },
      });
    }
  },

  updateItemInMeal: (mealIndex, itemIndex, item) => {
    const { builderState } = get();
    if (builderState) {
      const currentDay = builderState.currentDay;
      const updatedMeals = [...builderState.mealsByDay[currentDay]];
      updatedMeals[mealIndex].items[itemIndex] = item;

      set({
        builderState: {
          ...builderState,
          mealsByDay: {
            ...builderState.mealsByDay,
            [currentDay]: updatedMeals,
          },
          meals: updatedMeals, // Atualiza atalho também
        },
      });
    }
  },

  removeItemFromMeal: (mealIndex, itemIndex) => {
    const { builderState } = get();
    if (builderState) {
      const currentDay = builderState.currentDay;
      const updatedMeals = [...builderState.mealsByDay[currentDay]];
      updatedMeals[mealIndex].items = updatedMeals[mealIndex].items.filter(
        (_, i) => i !== itemIndex
      );

      set({
        builderState: {
          ...builderState,
          mealsByDay: {
            ...builderState.mealsByDay,
            [currentDay]: updatedMeals,
          },
          meals: updatedMeals, // Atualiza atalho também
        },
      });
    }
  },

  // ===== SUBSTITUTIONS ACTIONS =====

  addSubstitutionToItem: (mealIndex, itemIndex, substitution) => {
    const { builderState } = get();
    if (builderState) {
      const currentDay = builderState.currentDay;
      const updatedMeals = [...builderState.mealsByDay[currentDay]];
      const item = updatedMeals[mealIndex].items[itemIndex];

      // Inicializa array de substituições se não existir
      if (!item.substitutions) {
        item.substitutions = [];
      }

      item.substitutions.push(substitution);

      set({
        builderState: {
          ...builderState,
          mealsByDay: {
            ...builderState.mealsByDay,
            [currentDay]: updatedMeals,
          },
          meals: updatedMeals,
        },
      });
    }
  },

  removeSubstitutionFromItem: (mealIndex, itemIndex, substitutionIndex) => {
    const { builderState } = get();
    if (builderState) {
      const currentDay = builderState.currentDay;
      const updatedMeals = [...builderState.mealsByDay[currentDay]];
      const item = updatedMeals[mealIndex].items[itemIndex];

      if (item.substitutions) {
        item.substitutions = item.substitutions.filter(
          (_, i) => i !== substitutionIndex
        );
      }

      set({
        builderState: {
          ...builderState,
          mealsByDay: {
            ...builderState.mealsByDay,
            [currentDay]: updatedMeals,
          },
          meals: updatedMeals,
        },
      });
    }
  },

  updateSubstitutionInItem: (
    mealIndex,
    itemIndex,
    substitutionIndex,
    substitution
  ) => {
    const { builderState } = get();
    if (builderState) {
      const currentDay = builderState.currentDay;
      const updatedMeals = [...builderState.mealsByDay[currentDay]];
      const item = updatedMeals[mealIndex].items[itemIndex];

      if (item.substitutions && item.substitutions[substitutionIndex]) {
        item.substitutions[substitutionIndex] = substitution;
      }

      set({
        builderState: {
          ...builderState,
          mealsByDay: {
            ...builderState.mealsByDay,
            [currentDay]: updatedMeals,
          },
          meals: updatedMeals,
        },
      });
    }
  },

  savePlanFromBuilder: async () => {
    const { builderState } = get();
    if (!builderState) {
      throw new Error("Builder state não inicializado");
    }

    set({ loading: true, error: null });
    try {
      // Consolidar todas as refeições de todos os dias
      const allMeals: any[] = [];
      const daysOrder: DayOfWeek[] = [
        DayOfWeek.MONDAY,
        DayOfWeek.TUESDAY,
        DayOfWeek.WEDNESDAY,
        DayOfWeek.THURSDAY,
        DayOfWeek.FRIDAY,
        DayOfWeek.SATURDAY,
        DayOfWeek.SUNDAY,
      ];

      daysOrder.forEach((day) => {
        const dayMeals = builderState.mealsByDay[day] || [];
        allMeals.push(...dayMeals);
      });

      const planDto: CreateMealPlanDto = {
        name: builderState.planName,
        description: builderState.description,
        patientId: builderState.patientId,
        startDate: builderState.startDate.toISOString(),
        endDate: builderState.endDate?.toISOString(),
        status: builderState.status,
        targetCalories: builderState.targetCalories,
        targetProtein: builderState.targetProtein,
        targetCarbs: builderState.targetCarbs,
        targetFat: builderState.targetFat,
        targetFiber: builderState.targetFiber,
        isTemplate: builderState.isTemplate,
        notes: builderState.notes,
        meals: allMeals.map((meal: any) => ({
          name: meal.name,
          type: meal.type,
          dayOfWeek: meal.dayOfWeek, // ✅ Incluir dayOfWeek
          time: meal.time,
          order: meal.order,
          observation: meal.observation,
          items: meal.items.map((item: any) => ({
            foodId: item.foodId,
            quantity: item.quantity,
            // Converter measurementType para formato da API (GRAMAS ou CASEIRA)
            measurementType:
              item.measurementType === "gramas" ? "GRAMAS" : "CASEIRA",
            // Só envia measurementUnit se for medida caseira
            measurementUnit:
              item.measurementType !== "gramas"
                ? item.measurementUnit
                : undefined,
            observation: item.observation,
          })),
        })),
      };

      let plan: MealPlan;

      // Se tem planId, é edição; caso contrário, é criação
      if (builderState.planId) {
        await get().updatePlan(builderState.planId, planDto);
        plan = await mealPlanService.getMealPlanById(builderState.planId);
      } else {
        plan = await get().createPlan(planDto);
      }

      set({ builderState: null, selectedPlan: plan, loading: false });
      return plan;
    } catch (error: any) {
      set({ error: error.message || "Erro ao salvar plano", loading: false });
      throw error;
    }
  },

  clearBuilder: () => set({ builderState: null }),

  // ===== WEEK DAYS ACTIONS =====

  setCurrentDay: (day) => {
    const { builderState } = get();
    if (builderState) {
      set({
        builderState: {
          ...builderState,
          currentDay: day,
          meals: builderState.mealsByDay[day] || [],
        },
      });
    }
  },

  canAccessDay: (day) => {
    const { builderState } = get();
    if (!builderState) return false;

    // Segunda sempre liberada
    if (day === DayOfWeek.MONDAY) return true;

    // Verificar se a segunda-feira tem pelo menos 1 refeição com 1 alimento
    // Se sim, libera TODOS os outros dias
    const mondayMeals = builderState.mealsByDay[DayOfWeek.MONDAY] || [];
    const mondayHasMeals = mondayMeals.some(
      (meal: any) => meal.items && meal.items.length > 0
    );

    return mondayHasMeals;
  },

  getFilledDays: () => {
    const { builderState } = get();
    if (!builderState) return [];

    const daysOrder: DayOfWeek[] = [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
      DayOfWeek.SUNDAY,
    ];

    return daysOrder.filter((day) => {
      const meals = builderState.mealsByDay[day] || [];
      return meals.some((meal: any) => meal.items && meal.items.length > 0);
    });
  },

  getMealCountByDay: () => {
    const { builderState } = get();
    if (!builderState) return {} as Record<DayOfWeek, number>;

    const daysOrder: DayOfWeek[] = [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
      DayOfWeek.SUNDAY,
    ];

    const counts: Record<DayOfWeek, number> = {} as Record<DayOfWeek, number>;
    daysOrder.forEach((day) => {
      counts[day] = (builderState.mealsByDay[day] || []).length;
    });
    return counts;
  },

  copyMealsToDay: (sourceDay, targetDay) => {
    const { builderState } = get();
    if (!builderState) return;

    const sourceMeals = builderState.mealsByDay[sourceDay] || [];
    const copiedMeals = sourceMeals.map((meal: any) => ({
      ...meal,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dayOfWeek: targetDay,
    }));

    const newMealsByDay = {
      ...builderState.mealsByDay,
      [targetDay]: copiedMeals,
    };

    set({
      builderState: {
        ...builderState,
        mealsByDay: newMealsByDay,
        meals:
          builderState.currentDay === targetDay
            ? copiedMeals
            : builderState.meals,
      },
    });
  },

  // ===== UTILS =====

  clearCache: () => set({ cache: new Map() }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),
}));
