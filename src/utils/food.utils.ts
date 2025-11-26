/**
 * Food Utils - Utilitários para formatação e cálculos nutricionais
 * Sprint 7 - Banco de Alimentos TACO
 */

import { Food, NutrientGroup } from "../types/food.types";

/**
 * Formatar valor nutricional com unidade
 */
export function formatNutrient(
  value: number | null | undefined,
  unit: string = "g",
  decimals: number = 1
): string {
  if (value === null || value === undefined) return "N/D";
  if (value === 0) return `0 ${unit}`;

  // Se for menor que 0.1, mostrar "Tr" (traços)
  if (value < 0.1 && value > 0) return `Tr`;

  return `${value.toFixed(decimals)} ${unit}`;
}

/**
 * Formatar calorias
 */
export function formatCalories(kcal: number | null | undefined): string {
  if (kcal === null || kcal === undefined) return "N/D";
  return `${Math.round(kcal)} kcal`;
}

/**
 * Formatar porcentagem
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return "N/D";
  return `${value.toFixed(1)}%`;
}

/**
 * Obter cor por categoria
 */
export function getCategoryColor(categoryName: string): string {
  const colorMap: Record<string, string> = {
    "Cereais e Derivados": "#F59E0B",
    Leguminosas: "#10B981",
    "Carnes e Derivados": "#EF4444",
    "Laticínios e Ovos": "#3B82F6",
    "Frutas e Derivados": "#EC4899",
    "Hortaliças e Verduras": "#22C55E",
    "Óleos e Gorduras": "#FBBF24",
    Bebidas: "#14B8A6",
    "Açúcares e Doces": "#A855F7",
    "Oleaginosas e Sementes": "#F97316",
    Outros: "#6B7280",
  };

  return colorMap[categoryName] || "#6B7280";
}

/**
 * Obter ícone por categoria
 */
export function getCategoryIcon(categoryName: string): string {
  const iconMap: Record<string, string> = {
    "Cereais e Derivados": "grain",
    Leguminosas: "spa",
    "Carnes e Derivados": "restaurant",
    "Laticínios e Ovos": "egg",
    "Frutas e Derivados": "apple",
    "Hortaliças e Verduras": "eco",
    "Óleos e Gorduras": "opacity",
    Bebidas: "local-cafe",
    "Açúcares e Doces": "cake",
    "Oleaginosas e Sementes": "nature",
    Outros: "more-horiz",
  };

  return iconMap[categoryName] || "food-apple";
}

/**
 * Calcular % do valor diário (VD) baseado em dieta de 2000 kcal
 */
export function calculateDailyValue(
  nutrient: string,
  value: number | null | undefined
): number | null {
  if (value === null || value === undefined) return null;

  const dailyValues: Record<string, number> = {
    // Macronutrientes (g)
    protein: 50,
    carbohydrate: 300,
    lipids: 55,
    fiber: 25,

    // Minerais (mg)
    calcium: 1000,
    iron: 14,
    sodium: 2400,
    magnesium: 260,
    phosphorus: 700,
    potassium: 3500,
    zinc: 7,
    copper: 0.9,
    manganese: 2.3,

    // Vitaminas
    vitaminC: 45, // mg
    thiamin: 1.2, // mg
    riboflavin: 1.3, // mg
    niacin: 16, // mg
    pyridoxine: 1.3, // mg
    retinol: 600, // mcg
    rae: 600, // mcg
  };

  const dv = dailyValues[nutrient];
  if (!dv) return null;

  return (value / dv) * 100;
}

/**
 * Agrupar nutrientes por categoria para exibição
 */
export function getNutrientGroups(food: Food): NutrientGroup[] {
  return [
    {
      title: "Informações Básicas",
      icon: "information-circle",
      color: "#3B82F6",
      nutrients: [
        {
          name: "Energia",
          value: food.energyKcal,
          unit: "kcal",
          dailyValue: food.energyKcal
            ? (food.energyKcal / 2000) * 100
            : undefined,
        },
        {
          name: "Umidade",
          value: food.moisture,
          unit: "g",
        },
      ],
    },
    {
      title: "Macronutrientes",
      icon: "nutrition",
      color: "#10B981",
      nutrients: [
        {
          name: "Proteínas",
          value: food.protein,
          unit: "g",
          dailyValue: calculateDailyValue("protein", food.protein) ?? undefined,
        },
        {
          name: "Carboidratos",
          value: food.carbohydrate,
          unit: "g",
          dailyValue:
            calculateDailyValue("carbohydrate", food.carbohydrate) ?? undefined,
        },
        {
          name: "Lipídeos",
          value: food.lipids,
          unit: "g",
          dailyValue: calculateDailyValue("lipids", food.lipids) ?? undefined,
        },
        {
          name: "Fibras",
          value: food.fiber,
          unit: "g",
          dailyValue: calculateDailyValue("fiber", food.fiber) ?? undefined,
        },
        {
          name: "Colesterol",
          value: food.cholesterol,
          unit: "mg",
        },
        {
          name: "Cinzas",
          value: food.ash,
          unit: "g",
        },
      ],
    },
    {
      title: "Minerais",
      icon: "sparkles",
      color: "#F59E0B",
      nutrients: [
        {
          name: "Cálcio",
          value: food.calcium,
          unit: "mg",
          dailyValue: calculateDailyValue("calcium", food.calcium) ?? undefined,
        },
        {
          name: "Ferro",
          value: food.iron,
          unit: "mg",
          dailyValue: calculateDailyValue("iron", food.iron) ?? undefined,
        },
        {
          name: "Sódio",
          value: food.sodium,
          unit: "mg",
          dailyValue: calculateDailyValue("sodium", food.sodium) ?? undefined,
        },
        {
          name: "Magnésio",
          value: food.magnesium,
          unit: "mg",
          dailyValue:
            calculateDailyValue("magnesium", food.magnesium) ?? undefined,
        },
        {
          name: "Fósforo",
          value: food.phosphorus,
          unit: "mg",
          dailyValue:
            calculateDailyValue("phosphorus", food.phosphorus) ?? undefined,
        },
        {
          name: "Potássio",
          value: food.potassium,
          unit: "mg",
          dailyValue:
            calculateDailyValue("potassium", food.potassium) ?? undefined,
        },
        {
          name: "Zinco",
          value: food.zinc,
          unit: "mg",
          dailyValue: calculateDailyValue("zinc", food.zinc) ?? undefined,
        },
        {
          name: "Cobre",
          value: food.copper,
          unit: "mg",
          dailyValue: calculateDailyValue("copper", food.copper) ?? undefined,
        },
        {
          name: "Manganês",
          value: food.manganese,
          unit: "mg",
          dailyValue:
            calculateDailyValue("manganese", food.manganese) ?? undefined,
        },
      ],
    },
    {
      title: "Vitaminas",
      icon: "fitness",
      color: "#EC4899",
      nutrients: [
        {
          name: "Vitamina C",
          value: food.vitaminC,
          unit: "mg",
          dailyValue:
            calculateDailyValue("vitaminC", food.vitaminC) ?? undefined,
        },
        {
          name: "Tiamina (B1)",
          value: food.thiamin,
          unit: "mg",
          dailyValue: calculateDailyValue("thiamin", food.thiamin) ?? undefined,
        },
        {
          name: "Riboflavina (B2)",
          value: food.riboflavin,
          unit: "mg",
          dailyValue:
            calculateDailyValue("riboflavin", food.riboflavin) ?? undefined,
        },
        {
          name: "Niacina (B3)",
          value: food.niacin,
          unit: "mg",
          dailyValue: calculateDailyValue("niacin", food.niacin) ?? undefined,
        },
        {
          name: "Piridoxina (B6)",
          value: food.pyridoxine,
          unit: "mg",
          dailyValue:
            calculateDailyValue("pyridoxine", food.pyridoxine) ?? undefined,
        },
        {
          name: "Retinol",
          value: food.retinol,
          unit: "mcg",
          dailyValue: calculateDailyValue("retinol", food.retinol) ?? undefined,
        },
        {
          name: "RE",
          value: food.re,
          unit: "mcg",
        },
        {
          name: "RAE",
          value: food.rae,
          unit: "mcg",
          dailyValue: calculateDailyValue("rae", food.rae) ?? undefined,
        },
      ],
    },
    {
      title: "Ácidos Graxos",
      icon: "water",
      color: "#8B5CF6",
      nutrients: [
        {
          name: "Saturados",
          value: food.saturatedFattyAcids,
          unit: "g",
        },
        {
          name: "Monoinsaturados",
          value: food.monounsaturatedFattyAcids,
          unit: "g",
        },
        {
          name: "Poliinsaturados",
          value: food.polyunsaturatedFattyAcids,
          unit: "g",
        },
        {
          name: "12:0 (Láurico)",
          value: food.fattyAcid_12_0,
          unit: "g",
        },
        {
          name: "14:0 (Mirístico)",
          value: food.fattyAcid_14_0,
          unit: "g",
        },
        {
          name: "16:0 (Palmítico)",
          value: food.fattyAcid_16_0,
          unit: "g",
        },
        {
          name: "18:0 (Esteárico)",
          value: food.fattyAcid_18_0,
          unit: "g",
        },
        {
          name: "18:1 (Oleico)",
          value: food.fattyAcid_18_1,
          unit: "g",
        },
        {
          name: "18:2 (Linoleico)",
          value: food.fattyAcid_18_2,
          unit: "g",
        },
        {
          name: "18:3 (Linolênico)",
          value: food.fattyAcid_18_3,
          unit: "g",
        },
      ],
    },
  ];
}

/**
 * Calcular score nutricional (0-100)
 */
export function calculateNutritionalScore(food: Food): number {
  let score = 0;
  let factors = 0;

  // Proteína (0-30 pontos)
  if (food.protein !== null && food.protein !== undefined) {
    score += Math.min((food.protein / 30) * 30, 30);
    factors++;
  }

  // Fibras (0-25 pontos)
  if (food.fiber !== null && food.fiber !== undefined) {
    score += Math.min((food.fiber / 10) * 25, 25);
    factors++;
  }

  // Baixo sódio (0-20 pontos)
  if (food.sodium !== null && food.sodium !== undefined) {
    score += Math.max(20 - (food.sodium / 500) * 20, 0);
    factors++;
  }

  // Vitaminas (0-15 pontos)
  const vitamins = [
    food.vitaminC,
    food.thiamin,
    food.riboflavin,
    food.niacin,
  ].filter((v) => v !== null && v !== undefined);
  if (vitamins.length > 0) {
    score += Math.min((vitamins.length / 4) * 15, 15);
    factors++;
  }

  // Minerais (0-10 pontos)
  const minerals = [food.calcium, food.iron, food.magnesium].filter(
    (m) => m !== null && m !== undefined
  );
  if (minerals.length > 0) {
    score += Math.min((minerals.length / 3) * 10, 10);
    factors++;
  }

  if (factors === 0) return 0;

  return Math.round(score);
}

/**
 * Obter descrição do score nutricional
 */
export function getScoreDescription(score: number): {
  label: string;
  color: string;
} {
  if (score >= 80) return { label: "Excelente", color: "#10B981" };
  if (score >= 60) return { label: "Bom", color: "#3B82F6" };
  if (score >= 40) return { label: "Regular", color: "#F59E0B" };
  return { label: "Básico", color: "#EF4444" };
}

/**
 * Highlighter de busca
 */
export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm || searchTerm.length < 2) return text;

  const regex = new RegExp(`(${searchTerm})`, "gi");
  return text.replace(regex, "**$1**");
}
