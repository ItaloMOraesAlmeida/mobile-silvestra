/**
 * Constantes para Criação de Plano Alimentar
 */

export const GOAL_TYPES = [
  {
    id: "basic",
    label: "Básico",
    description: "Manutenção de peso e saúde",
    icon: "fitness-outline" as const,
    multipliers: { protein: 1.2, carbs: 3, fat: 0.8 },
  },
  {
    id: "beginner",
    label: "Iniciante",
    description: "Início de mudança de hábitos",
    icon: "walk-outline" as const,
    multipliers: { protein: 1.4, carbs: 3.5, fat: 0.9 },
  },
  {
    id: "light",
    label: "Leve",
    description: "Perda de peso moderada",
    icon: "leaf-outline" as const,
    multipliers: { protein: 1.6, carbs: 2.5, fat: 0.7 },
  },
  {
    id: "intermediate",
    label: "Intermediário",
    description: "Ganho muscular moderado",
    icon: "barbell-outline" as const,
    multipliers: { protein: 2.0, carbs: 4, fat: 1.0 },
  },
  {
    id: "advanced",
    label: "Avançado",
    description: "Alta performance e definição",
    icon: "trending-up-outline" as const,
    multipliers: { protein: 2.5, carbs: 4.5, fat: 0.8 },
  },
  {
    id: "custom",
    label: "Personalizado",
    description: "Defina suas próprias metas",
    icon: "create-outline" as const,
    multipliers: { protein: 0, carbs: 0, fat: 0 },
  },
] as const;

export type GoalTypeId = (typeof GOAL_TYPES)[number]["id"];
