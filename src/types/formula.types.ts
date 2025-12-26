/**
 * Types para o módulo de Fórmulas Customizadas
 * Sincronizado com o backend NestJS
 */

// ========== ENUMS ==========

export enum FormulaVariableType {
  WEIGHT = "WEIGHT",
  HEIGHT = "HEIGHT",
  AGE = "AGE",
  WAIST = "WAIST",
  HIP = "HIP",
  CHEST = "CHEST",
  ARM = "ARM",
  THIGH = "THIGH",
  CALF = "CALF",
  NECK = "NECK",
  ABDOMINAL = "ABDOMINAL",
  BICEPS_SKINFOLD = "BICEPS_SKINFOLD",
  TRICEPS_SKINFOLD = "TRICEPS_SKINFOLD",
  SUBSCAPULAR_SKINFOLD = "SUBSCAPULAR_SKINFOLD",
  SUPRAILIAC_SKINFOLD = "SUPRAILIAC_SKINFOLD",
  THIGH_SKINFOLD = "THIGH_SKINFOLD",
  CALF_SKINFOLD = "CALF_SKINFOLD",
  PECTORAL_SKINFOLD = "PECTORAL_SKINFOLD",
  ABDOMINAL_SKINFOLD = "ABDOMINAL_SKINFOLD",
  BMI = "BMI",
  GENDER = "GENDER",
}

export enum FormulaOutputType {
  BODY_FAT_PERCENTAGE = "BODY_FAT_PERCENTAGE",
  LEAN_MASS = "LEAN_MASS",
  FAT_MASS = "FAT_MASS",
  BMR = "BMR",
  TDEE = "TDEE",
  IDEAL_WEIGHT = "IDEAL_WEIGHT",
  BODY_DENSITY = "BODY_DENSITY",
  CUSTOM = "CUSTOM",
}

// ========== INTERFACES ==========

export interface CustomFormula {
  id: string;
  nutritionistId: string;
  name: string;
  description?: string;
  formula: string;
  outputType: FormulaOutputType;
  outputUnit?: string;
  variables: FormulaVariableType[];
  validationRules?: Record<string, any>;
  isActive: boolean;
  isPublic: boolean;
  usageCount: number;
  category?: string;
  reference?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    results: number;
  };
}

export interface FormulaResult {
  id: string;
  formulaId: string;
  patientId: string;
  bodyMeasurementId?: string;
  inputValues: Record<string, number>;
  result: number;
  notes?: string;
  calculatedAt: Date;
  formula?: CustomFormula;
}

export interface VariableInfo {
  type: FormulaVariableType;
  aliases: string[];
  description: string;
}

// ========== DTOs ==========

export interface CreateFormulaDto {
  name: string;
  description?: string;
  formula: string;
  outputType: FormulaOutputType;
  outputUnit?: string;
  variables: FormulaVariableType[];
  validationRules?: Record<string, any>;
  category?: string;
  reference?: string;
  isActive?: boolean;
  isPublic?: boolean;
}

export interface UpdateFormulaDto {
  name?: string;
  description?: string;
  formula?: string;
  outputType?: FormulaOutputType;
  outputUnit?: string;
  variables?: FormulaVariableType[];
  validationRules?: Record<string, any>;
  category?: string;
  reference?: string;
  isActive?: boolean;
  isPublic?: boolean;
}

export interface CalculateFormulaDto {
  formulaId: string;
  patientId: string;
  bodyMeasurementId?: string;
  inputValues: Record<string, number>;
  notes?: string;
}

export interface TestFormulaDto {
  formula: string;
  testValues: Record<string, number>;
}

export interface TestFormulaResponse {
  success: boolean;
  result?: number;
  error?: string;
}

// ========== DISPLAY HELPERS ==========

export const FormulaOutputTypeLabels: Record<FormulaOutputType, string> = {
  [FormulaOutputType.BODY_FAT_PERCENTAGE]: "% de Gordura Corporal",
  [FormulaOutputType.LEAN_MASS]: "Massa Magra",
  [FormulaOutputType.FAT_MASS]: "Massa Gorda",
  [FormulaOutputType.BMR]: "Taxa Metabólica Basal",
  [FormulaOutputType.TDEE]: "Gasto Energético Total",
  [FormulaOutputType.IDEAL_WEIGHT]: "Peso Ideal",
  [FormulaOutputType.BODY_DENSITY]: "Densidade Corporal",
  [FormulaOutputType.CUSTOM]: "Personalizado",
};

export const FormulaVariableTypeLabels: Record<FormulaVariableType, string> = {
  [FormulaVariableType.WEIGHT]: "Peso (kg)",
  [FormulaVariableType.HEIGHT]: "Altura (cm)",
  [FormulaVariableType.AGE]: "Idade (anos)",
  [FormulaVariableType.WAIST]: "Circunf. Cintura (cm)",
  [FormulaVariableType.HIP]: "Circunf. Quadril (cm)",
  [FormulaVariableType.CHEST]: "Circunf. Peitoral (cm)",
  [FormulaVariableType.ARM]: "Circunf. Braço (cm)",
  [FormulaVariableType.THIGH]: "Circunf. Coxa (cm)",
  [FormulaVariableType.CALF]: "Circunf. Panturrilha (cm)",
  [FormulaVariableType.NECK]: "Circunf. Pescoço (cm)",
  [FormulaVariableType.ABDOMINAL]: "Circunf. Abdominal (cm)",
  [FormulaVariableType.BICEPS_SKINFOLD]: "DC Bíceps (mm)",
  [FormulaVariableType.TRICEPS_SKINFOLD]: "DC Tríceps (mm)",
  [FormulaVariableType.SUBSCAPULAR_SKINFOLD]: "DC Subescapular (mm)",
  [FormulaVariableType.SUPRAILIAC_SKINFOLD]: "DC Supra-ilíaca (mm)",
  [FormulaVariableType.THIGH_SKINFOLD]: "DC Coxa (mm)",
  [FormulaVariableType.CALF_SKINFOLD]: "DC Panturrilha (mm)",
  [FormulaVariableType.PECTORAL_SKINFOLD]: "DC Peitoral (mm)",
  [FormulaVariableType.ABDOMINAL_SKINFOLD]: "DC Abdominal (mm)",
  [FormulaVariableType.BMI]: "IMC",
  [FormulaVariableType.GENDER]: "Gênero",
};

export const FormulaCategories = [
  "Composição Corporal",
  "Gasto Energético",
  "Peso Ideal",
  "Antropometria",
  "Somatotipo",
  "Outros",
];
