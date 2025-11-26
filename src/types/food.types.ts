/**
 * Types para o módulo de Banco de Alimentos TACO
 * Sprint 7 - Silvestra App
 */

export interface FoodCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FoodNutrientPercentages {
  proteinPercent: number;
  carbsPercent: number;
  lipidsPercent: number;
  fiberPercent: number;
}

export interface Food {
  id: string;
  tacoId: string;
  name: string;
  nameNormalized?: string;
  categoryId?: string;
  category?: FoodCategory;

  // Base (3 campos)
  moisture?: number;
  energyKcal?: number;
  energyKj?: number;

  // Centesimal (6 campos)
  protein?: number;
  lipids?: number;
  cholesterol?: number;
  carbohydrate?: number;
  fiber?: number;
  ash?: number;

  // Minerais (9 campos)
  calcium?: number;
  magnesium?: number;
  manganese?: number;
  phosphorus?: number;
  iron?: number;
  sodium?: number;
  potassium?: number;
  copper?: number;
  zinc?: number;

  // Vitaminas (8 campos)
  retinol?: number;
  re?: number;
  rae?: number;
  thiamin?: number;
  riboflavin?: number;
  pyridoxine?: number;
  niacin?: number;
  vitaminC?: number;

  // Ácidos Graxos (18 campos)
  saturatedFattyAcids?: number;
  monounsaturatedFattyAcids?: number;
  polyunsaturatedFattyAcids?: number;
  fattyAcid_12_0?: number;
  fattyAcid_14_0?: number;
  fattyAcid_16_0?: number;
  fattyAcid_18_0?: number;
  fattyAcid_20_0?: number;
  fattyAcid_22_0?: number;
  fattyAcid_24_0?: number;
  fattyAcid_14_1?: number;
  fattyAcid_16_1?: number;
  fattyAcid_18_1?: number;
  fattyAcid_20_1?: number;
  fattyAcid_18_2?: number;
  fattyAcid_18_3?: number;
  fattyAcid_20_4?: number;
  fattyAcid_20_5?: number;
  fattyAcid_22_5?: number;
  fattyAcid_22_6?: number;
  fattyAcid_18_1t?: number;
  fattyAcid_18_2t?: number;

  // Metadata
  createdAt: string;
  updatedAt: string;

  // Percentagens calculadas
  percentages?: FoodNutrientPercentages;
}

export interface FoodListResponse {
  items: Food[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FoodSearchParams {
  search?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
  orderBy?: "name" | "energyKcal" | "protein" | "carbohydrate";
  order?: "asc" | "desc";
  // Opcional: sinal de cancelamento para requisições fetch (AbortController)
  signal?: AbortSignal;
}

export interface FoodFilterParams {
  minProtein?: number;
  maxProtein?: number;
  minCarbs?: number;
  maxCarbs?: number;
  minLipids?: number;
  maxLipids?: number;
  minCalories?: number;
  maxCalories?: number;
  minFiber?: number;
  categories?: string[];
}

export interface NutrientInfo {
  name: string;
  value: number | null | undefined;
  unit: string;
  dailyValue?: number; // % do valor diário recomendado
}

export interface NutrientGroup {
  title: string;
  icon: string;
  color: string;
  nutrients: NutrientInfo[];
}
