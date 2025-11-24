/**
 * Utilitários para Planos Alimentares
 * Sprint 8-9 - Meal Plans Module
 */

import {
  PlanStatus,
  MealType,
  type PlanStatusInfo,
  type MealTypeInfo,
  type MealNutritionSummary,
} from "../types/meal-plan.types";

// ===== MEAL TYPE INFO =====

export const MEAL_TYPES_INFO: Record<MealType, MealTypeInfo> = {
  BREAKFAST: {
    type: MealType.BREAKFAST,
    label: "Café da Manhã",
    icon: "☀️",
    color: "#FFA726",
  },
  MORNING_SNACK: {
    type: MealType.MORNING_SNACK,
    label: "Lanche da Manhã",
    icon: "🍎",
    color: "#66BB6A",
  },
  LUNCH: {
    type: MealType.LUNCH,
    label: "Almoço",
    icon: "🍽️",
    color: "#EF5350",
  },
  AFTERNOON_SNACK: {
    type: MealType.AFTERNOON_SNACK,
    label: "Lanche da Tarde",
    icon: "🥤",
    color: "#42A5F5",
  },
  DINNER: {
    type: MealType.DINNER,
    label: "Jantar",
    icon: "🌙",
    color: "#5C6BC0",
  },
  EVENING_SNACK: {
    type: MealType.EVENING_SNACK,
    label: "Ceia",
    icon: "🌃",
    color: "#7E57C2",
  },
  PRE_WORKOUT: {
    type: MealType.PRE_WORKOUT,
    label: "Pré-Treino",
    icon: "💪",
    color: "#FF7043",
  },
  POST_WORKOUT: {
    type: MealType.POST_WORKOUT,
    label: "Pós-Treino",
    icon: "🏋️",
    color: "#26A69A",
  },
  OTHER: {
    type: MealType.OTHER,
    label: "Outra",
    icon: "🍴",
    color: "#78909C",
  },
};

export const getMealTypeInfo = (type: MealType): MealTypeInfo => {
  return MEAL_TYPES_INFO[type];
};

export const getMealTypeLabel = (type: MealType): string => {
  return MEAL_TYPES_INFO[type].label;
};

export const getMealTypeIcon = (type: MealType): string => {
  return MEAL_TYPES_INFO[type].icon;
};

export const getMealTypeColor = (type: MealType): string => {
  return MEAL_TYPES_INFO[type].color;
};

// ===== PLAN STATUS INFO =====

export const PLAN_STATUS_INFO: Record<PlanStatus, PlanStatusInfo> = {
  DRAFT: {
    status: PlanStatus.DRAFT,
    label: "Rascunho",
    color: "#FF9800", // Laranja vibrante - destaque para trabalho em andamento
    icon: "create-outline",
  },
  ACTIVE: {
    status: PlanStatus.ACTIVE,
    label: "Ativo",
    color: "#10B981", // Verde vibrante - plano em vigor
    icon: "checkmark-circle",
  },
  COMPLETED: {
    status: PlanStatus.COMPLETED,
    label: "Concluído",
    color: "#3B82F6", // Azul vibrante - plano finalizado
    icon: "checkmark-done-circle",
  },
  ARCHIVED: {
    status: PlanStatus.ARCHIVED,
    label: "Arquivado",
    color: "#6B7280", // Cinza mais escuro - arquivado
    icon: "archive",
  },
};

export const getPlanStatusInfo = (status: PlanStatus): PlanStatusInfo => {
  return PLAN_STATUS_INFO[status];
};

export const getPlanStatusLabel = (status: PlanStatus): string => {
  return PLAN_STATUS_INFO[status].label;
};

export const getPlanStatusColor = (status: PlanStatus): string => {
  return PLAN_STATUS_INFO[status].color;
};

export const getPlanStatusIcon = (status: PlanStatus): string => {
  return PLAN_STATUS_INFO[status].icon;
};

// ===== FORMATTERS =====

/**
 * Formatar gramas para exibição
 */
export const formatGrams = (grams: number): string => {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(1)} kg`;
  }
  return `${Math.round(grams)} g`;
};

/**
 * Formatar calorias
 */
export const formatCalories = (calories: number): string => {
  return `${Math.round(calories)} kcal`;
};

/**
 * Formatar macros (g)
 */
export const formatMacro = (value: number): string => {
  return `${value.toFixed(1)} g`;
};

/**
 * Formatar porcentagem
 */
export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

/**
 * Formatar data
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Formatar data curta (sem ano)
 */
export const formatShortDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
};

/**
 * Formatar período do plano
 */
export const formatPlanPeriod = (
  startDate: Date | string,
  endDate?: Date | string
): string => {
  const start = formatShortDate(startDate);
  if (!endDate) {
    return `A partir de ${start}`;
  }
  const end = formatShortDate(endDate);
  return `${start} - ${end}`;
};

// ===== CALCULATORS =====

/**
 * Calcular cor baseada no progresso (0-100%)
 */
export const getProgressColor = (progress: number): string => {
  if (progress < 80) return "#F44336"; // Vermelho (baixo)
  if (progress < 95) return "#FF9800"; // Laranja (moderado)
  if (progress > 110) return "#FF5722"; // Vermelho escuro (excesso)
  return "#4CAF50"; // Verde (ideal)
};

/**
 * Obter label de progresso
 */
export const getProgressLabel = (progress: number): string => {
  if (progress < 80) return "Abaixo da meta";
  if (progress < 95) return "Próximo da meta";
  if (progress > 110) return "Acima da meta";
  return "Na meta";
};

/**
 * Calcular total de calorias dos macros
 */
export const calculateMacroCalories = (
  protein: number,
  carbs: number,
  fat: number
): number => {
  return protein * 4 + carbs * 4 + fat * 9;
};

/**
 * Calcular distribuição percentual dos macros
 */
export const calculateMacroDistribution = (
  protein: number,
  carbs: number,
  fat: number
): { protein: number; carbs: number; fat: number } => {
  const totalCalories = calculateMacroCalories(protein, carbs, fat);

  if (totalCalories === 0) {
    return { protein: 0, carbs: 0, fat: 0 };
  }

  return {
    protein: ((protein * 4) / totalCalories) * 100,
    carbs: ((carbs * 4) / totalCalories) * 100,
    fat: ((fat * 9) / totalCalories) * 100,
  };
};

/**
 * Obter cor do macro
 */
export const getMacroColor = (
  macro: "protein" | "carbs" | "fat" | "fiber"
): string => {
  const colors = {
    protein: "#E91E63", // Rosa
    carbs: "#2196F3", // Azul
    fat: "#FF9800", // Laranja
    fiber: "#9C27B0", // Roxo
  };
  return colors[macro];
};

/**
 * Obter label do macro
 */
export const getMacroLabel = (
  macro: "protein" | "carbs" | "fat" | "fiber"
): string => {
  const labels = {
    protein: "Proteínas",
    carbs: "Carboidratos",
    fat: "Gorduras",
    fiber: "Fibras",
  };
  return labels[macro];
};

/**
 * Calcular quantos dias faltam para o plano terminar
 */
export const getDaysRemaining = (endDate?: Date | string): number | null => {
  if (!endDate) return null;

  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return days;
};

/**
 * Verificar se o plano está ativo (dentro do período)
 */
export const isPlanActive = (
  startDate: Date | string,
  endDate?: Date | string
): boolean => {
  const now = new Date();
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;

  if (now < start) return false; // Ainda não começou

  if (!endDate) return true; // Sem data final = sempre ativo

  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  return now <= end;
};

/**
 * Resumo rápido de nutrição (para cards)
 */
export const getNutritionSummaryText = (
  nutrition: MealNutritionSummary
): string => {
  return `${Math.round(
    nutrition.totalCalories
  )} kcal · P: ${nutrition.totalProtein.toFixed(
    0
  )}g · C: ${nutrition.totalCarbs.toFixed(
    0
  )}g · G: ${nutrition.totalFat.toFixed(0)}g`;
};

/**
 * Validar se o plano tem dados suficientes
 */
export const validatePlanData = (data: {
  name: string;
  patientId: string;
  startDate: Date | string;
  meals?: any[];
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push("Nome do plano é obrigatório");
  }

  if (!data.patientId) {
    errors.push("Paciente é obrigatório");
  }

  if (!data.startDate) {
    errors.push("Data de início é obrigatória");
  }

  if (data.meals && data.meals.length === 0) {
    errors.push("Adicione pelo menos uma refeição");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Gerar UUID simples (para IDs temporários no builder)
 */
export const generateTempId = (): string => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Converter minutos para string de horário (ex: 420 -> "07:00")
 */
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
};

/**
 * Converter string de horário para minutos (ex: "07:00" -> 420)
 */
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

/**
 * Ordenar refeições por horário
 */
export const sortMealsByTime = (meals: any[]): any[] => {
  return [...meals].sort((a, b) => {
    if (!a.time && !b.time) return a.order - b.order;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return timeToMinutes(a.time) - timeToMinutes(b.time);
  });
};

/**
 * Calcular score de adesão ao plano (mock - será implementado futuramente)
 */
export const calculateAdherenceScore = (
  completedMeals: number,
  totalMeals: number
): number => {
  if (totalMeals === 0) return 0;
  return Math.round((completedMeals / totalMeals) * 100);
};

/**
 * Obter cor do score de adesão
 */
export const getAdherenceColor = (score: number): string => {
  if (score >= 80) return "#4CAF50"; // Verde
  if (score >= 60) return "#FF9800"; // Laranja
  return "#F44336"; // Vermelho
};

/**
 * Obter label do score de adesão
 */
export const getAdherenceLabel = (score: number): string => {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Bom";
  if (score >= 40) return "Regular";
  return "Baixo";
};

/**
 * Formatar quantidade de alimento com unidade de medida
 */
export const formatFoodQuantity = (item: any): string => {
  if (item.measurementType === "CASEIRA" && item.measurementUnit) {
    const totalGrams = item.quantity || 0;
    const measureName =
      item.measurementUnit.name ||
      item.measurementUnit.abbreviation ||
      "medida";

    // Usar originalQuantity se disponível (mais preciso)
    if (item.originalQuantity !== undefined) {
      return `${item.originalQuantity} ${measureName} (${totalGrams.toFixed(
        0
      )}g)`;
    }

    // Fallback: calcular dividindo gramas
    const gramsPerUnit =
      item.measurementUnit.grams || item.measurementUnit.gramsEquivalent || 0;
    const quantityInUnits = gramsPerUnit > 0 ? totalGrams / gramsPerUnit : 0;
    return `${quantityInUnits.toFixed(1)} ${measureName} (${totalGrams.toFixed(
      0
    )}g)`;
  }
  // Gramas: mostrar apenas gramas
  return `${(item.quantity || 0).toFixed(0)}g`;
};
