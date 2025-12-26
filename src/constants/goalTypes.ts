/**
 * Traduções e metadados dos tipos de metas
 */

export const GOAL_TYPE_TRANSLATIONS: Record<string, string> = {
  WEIGHT: "Peso",
  BODY_FAT: "Gordura Corporal",
  MUSCLE_MASS: "Massa Muscular",
  WAIST_CIRC: "Circunferência da Cintura",
  HIP_CIRC: "Circunferência do Quadril",
  CHEST_CIRC: "Circunferência do Peitoral",
  ARM_CIRC: "Circunferência do Braço",
  THIGH_CIRC: "Circunferência da Coxa",
  BMI: "IMC",
  HYDRATION: "Hidratação",
  OTHER: "Outro",
};

/**
 * Retorna a tradução do tipo de meta
 * @param type Tipo da meta (ex: "WEIGHT", "WAIST_CIRC")
 * @returns Nome traduzido do tipo de meta
 */
export const getGoalTypeLabel = (type: string): string => {
  return GOAL_TYPE_TRANSLATIONS[type] || type;
};

/**
 * Retorna a unidade padrão para cada tipo de meta
 */
export const GOAL_TYPE_UNITS: Record<string, string> = {
  WEIGHT: "kg",
  BODY_FAT: "%",
  MUSCLE_MASS: "kg",
  WAIST_CIRC: "cm",
  HIP_CIRC: "cm",
  CHEST_CIRC: "cm",
  ARM_CIRC: "cm",
  THIGH_CIRC: "cm",
  BMI: "kg/m²",
  HYDRATION: "%",
  OTHER: "",
};

/**
 * Retorna a unidade padrão para um tipo de meta
 */
export const getGoalTypeUnit = (type: string): string => {
  return GOAL_TYPE_UNITS[type] || "";
};
