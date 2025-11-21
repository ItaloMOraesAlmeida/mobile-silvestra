/**
 * Types para o módulo de Planos Alimentares (Sprint 8-9)
 * Sincronizado com o backend NestJS
 */

// ========== ENUMS ==========

export enum PlanStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED",
}

export enum MealType {
  BREAKFAST = "BREAKFAST",
  MORNING_SNACK = "MORNING_SNACK",
  LUNCH = "LUNCH",
  AFTERNOON_SNACK = "AFTERNOON_SNACK",
  DINNER = "DINNER",
  EVENING_SNACK = "EVENING_SNACK",
  PRE_WORKOUT = "PRE_WORKOUT",
  POST_WORKOUT = "POST_WORKOUT",
  OTHER = "OTHER",
}

export enum DayOfWeek {
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
  SUNDAY = "SUNDAY",
}

// ========== CORE TYPES ==========

export interface FoodNutrition {
  id: string;
  name: string;
  category: string;
  quantity: number; // quantidade (em gramas ou na unidade caseira)
  measurementType?: MeasurementType;
  measurementUnit?: HouseholdMeasure;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  observation?: string;
}

export interface MealNutritionSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  proteinPercentage: number;
  carbsPercentage: number;
  fatPercentage: number;
}

export interface Meal {
  id: string;
  name: string;
  type: MealType;
  dayOfWeek: DayOfWeek;
  time?: string;
  order: number;
  observation?: string;
  items: FoodNutrition[];
  nutrition: MealNutritionSummary;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanNutritionSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  proteinPercentage: number;
  carbsPercentage: number;
  fatPercentage: number;
  // Metas
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  targetFiber?: number;
  // Progresso em relação às metas
  caloriesProgress?: number;
  proteinProgress?: number;
  carbsProgress?: number;
  fatProgress?: number;
  fiberProgress?: number;
}

export interface MealPlan {
  id: string;
  name: string;
  description?: string;
  patientId: string;
  nutritionistId: string;
  startDate: Date;
  endDate?: Date;
  status: PlanStatus;
  isTemplate: boolean;
  notes?: string;
  meals: Meal[];
  nutrition: PlanNutritionSummary;
  createdAt: Date;
  updatedAt: Date;
}

// ========== SHOPPING LIST ==========

export interface ShoppingListItem {
  id: string;
  foodName: string;
  category: string;
  totalQuantity: number;
  unit: string;
  checked: boolean;
}

export interface ShoppingListCategory {
  category: string;
  items: ShoppingListItem[];
  totalItems: number;
}

export interface ShoppingList {
  id: string;
  planId: string;
  planName: string;
  categories: ShoppingListCategory[];
  totalItems: number;
  checkedItems: number;
  generatedAt: Date;
  updatedAt: Date;
}

// ========== DTOs PARA API ==========

export interface CreateMealItemDto {
  foodId: string;
  quantity: number;
  measurementType?: MeasurementType;
  measurementUnit?: HouseholdMeasure;
  observation?: string;
}

export interface CreateMealDto {
  name: string;
  type: MealType;
  time?: string;
  order: number;
  observation?: string;
  items?: CreateMealItemDto[];
}

export interface CreateMealPlanDto {
  name: string;
  description?: string;
  patientId: string;
  startDate: string;
  endDate?: string;
  status?: PlanStatus;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  targetFiber?: number;
  isTemplate?: boolean;
  notes?: string;
  meals?: CreateMealDto[];
}

export interface UpdateMealPlanDto {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: PlanStatus;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  targetFiber?: number;
  isTemplate?: boolean;
  notes?: string;
}

export interface UpdateMealDto {
  name?: string;
  type?: MealType;
  time?: string;
  order?: number;
  observation?: string;
}

export interface UpdateMealItemDto {
  foodId?: string;
  quantity?: number;
  observation?: string;
}

export interface FilterMealPlanDto {
  patientId?: string;
  status?: PlanStatus;
  search?: string;
  isTemplate?: boolean;
}

// ========== UI HELPERS ==========

export interface MealTypeInfo {
  type: MealType;
  label: string;
  icon: string;
  color: string;
}

export interface PlanStatusInfo {
  status: PlanStatus;
  label: string;
  color: string;
  icon: string;
}

// ========== BUILDER STATE (para construtor visual) ==========

export interface MealBuilderState {
  planId?: string;
  planName: string;
  description?: string;
  patientId: string;
  startDate: Date;
  endDate?: Date;
  status: PlanStatus;
  // Metas
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  targetFiber?: number;
  // Refeições em construção por dia da semana
  mealsByDay: {
    [key in DayOfWeek]: MealBuilderItem[];
  };
  currentDay: DayOfWeek; // Dia atualmente selecionado
  notes?: string;
  isTemplate: boolean;
  // Metas consolidadas (goals) - mantém compatibilidade
  goals?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  // Atalho para refeições do dia atual (retrocompatibilidade)
  meals: MealBuilderItem[];
}

export interface MealBuilderItem {
  id: string; // ID temporário (UUID) para o builder
  name: string;
  type: MealType;
  dayOfWeek: DayOfWeek; // Dia da semana da refeição
  time?: string;
  order: number;
  observation?: string;
  items: FoodBuilderItem[];
}

export type MeasurementType = "gramas" | "caseira";

export interface HouseholdMeasure {
  id: string;
  name: string; // ex: "Colher de sopa", "Xícara", "Unidade"
  abbreviation: string; // ex: "col. sopa", "xíc", "un"
  gramsEquivalent: number; // equivalência em gramas
}

export interface FoodBuilderItem {
  id: string; // ID temporário para o builder
  foodId: string;
  foodName: string;
  category: string;
  quantity: number;
  measurementType: MeasurementType; // 'gramas' ou 'caseira'
  measurementUnit?: HouseholdMeasure; // opcional, usado quando measurementType é 'caseira'
  observation?: string;
  // Valores nutricionais calculados
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}
