/**
 * Medidas Caseiras Padrão
 * Sprint 7 - Silvestra App
 *
 * Referências baseadas em padrões brasileiros de nutrição
 */

import { HouseholdMeasure } from "../types/meal-plan.types";

export const HOUSEHOLD_MEASURES: HouseholdMeasure[] = [
  // Colheres
  {
    id: "colher-sopa",
    name: "Colher de sopa",
    abbreviation: "col. sopa",
    gramsEquivalent: 15,
  },
  {
    id: "colher-sobremesa",
    name: "Colher de sobremesa",
    abbreviation: "col. sobremesa",
    gramsEquivalent: 10,
  },
  {
    id: "colher-cha",
    name: "Colher de chá",
    abbreviation: "col. chá",
    gramsEquivalent: 5,
  },
  {
    id: "colher-cafe",
    name: "Colher de café",
    abbreviation: "col. café",
    gramsEquivalent: 2,
  },

  // Xícaras e copos
  {
    id: "xicara-cha",
    name: "Xícara de chá",
    abbreviation: "xíc. chá",
    gramsEquivalent: 150,
  },
  {
    id: "xicara-cafe",
    name: "Xícara de café",
    abbreviation: "xíc. café",
    gramsEquivalent: 50,
  },
  {
    id: "copo-americano",
    name: "Copo americano",
    abbreviation: "copo",
    gramsEquivalent: 200,
  },
  {
    id: "copo-requeijao",
    name: "Copo de requeijão",
    abbreviation: "copo req.",
    gramsEquivalent: 250,
  },

  // Unidades
  {
    id: "unidade",
    name: "Unidade",
    abbreviation: "un",
    gramsEquivalent: 100, // valor padrão, pode variar por alimento
  },
  {
    id: "fatia",
    name: "Fatia",
    abbreviation: "fatia",
    gramsEquivalent: 30,
  },
  {
    id: "fatia-fina",
    name: "Fatia fina",
    abbreviation: "fatia fina",
    gramsEquivalent: 15,
  },
  {
    id: "fatia-grossa",
    name: "Fatia grossa",
    abbreviation: "fatia grossa",
    gramsEquivalent: 50,
  },

  // Porções
  {
    id: "porcao-pequena",
    name: "Porção pequena",
    abbreviation: "porção peq.",
    gramsEquivalent: 80,
  },
  {
    id: "porcao-media",
    name: "Porção média",
    abbreviation: "porção média",
    gramsEquivalent: 120,
  },
  {
    id: "porcao-grande",
    name: "Porção grande",
    abbreviation: "porção grande",
    gramsEquivalent: 180,
  },

  // Concha e escumadeira
  {
    id: "concha",
    name: "Concha",
    abbreviation: "concha",
    gramsEquivalent: 100,
  },
  {
    id: "escumadeira",
    name: "Escumadeira",
    abbreviation: "escumadeira",
    gramsEquivalent: 80,
  },

  // Prato
  {
    id: "prato-raso",
    name: "Prato raso",
    abbreviation: "prato raso",
    gramsEquivalent: 200,
  },
  {
    id: "prato-fundo",
    name: "Prato fundo",
    abbreviation: "prato fundo",
    gramsEquivalent: 250,
  },

  // Tigela
  {
    id: "tigela-pequena",
    name: "Tigela pequena",
    abbreviation: "tigela peq.",
    gramsEquivalent: 100,
  },
  {
    id: "tigela-media",
    name: "Tigela média",
    abbreviation: "tigela média",
    gramsEquivalent: 150,
  },
  {
    id: "tigela-grande",
    name: "Tigela grande",
    abbreviation: "tigela grande",
    gramsEquivalent: 250,
  },
];

/**
 * Retorna a medida caseira pelo ID
 */
export const getHouseholdMeasureById = (
  id: string
): HouseholdMeasure | undefined => {
  return HOUSEHOLD_MEASURES.find((measure) => measure.id === id);
};

/**
 * Converte quantidade em medida caseira para gramas
 */
export const convertToGrams = (
  quantity: number,
  measurementType: "gramas" | "caseira",
  householdMeasure?: HouseholdMeasure
): number => {
  if (measurementType === "gramas") {
    return quantity;
  }

  if (measurementType === "caseira" && householdMeasure) {
    return quantity * householdMeasure.gramsEquivalent;
  }

  return 0;
};

/**
 * Formata a quantidade com a medida para exibição
 */
export const formatQuantityWithMeasure = (
  quantity: number,
  measurementType: "gramas" | "caseira",
  householdMeasure?: HouseholdMeasure
): string => {
  if (measurementType === "gramas") {
    return `${quantity}g`;
  }

  if (measurementType === "caseira" && householdMeasure) {
    const quantityStr =
      quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(1);
    return `${quantityStr} ${householdMeasure.abbreviation}`;
  }

  return `${quantity}g`;
};
