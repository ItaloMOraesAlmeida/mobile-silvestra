/**
 * Utilitários de Conversão de Unidades
 *
 * Sistema Métrico vs Imperial:
 * - Peso: kg ↔ lb (libras)
 * - Altura: cm ↔ in (polegadas) / ft (pés)
 * - Distância: m ↔ ft (pés)
 */

/**
 * === PESO / WEIGHT ===
 */

/**
 * Converte quilogramas para libras
 * @param kg Peso em quilogramas
 * @returns Peso em libras
 */
export function kgToLbs(kg: number): number {
  return kg * 2.20462;
}

/**
 * Converte libras para quilogramas
 * @param lbs Peso em libras
 * @returns Peso em quilogramas
 */
export function lbsToKg(lbs: number): number {
  return lbs / 2.20462;
}

/**
 * Formata peso de acordo com o sistema de unidades
 * @param kg Peso em quilogramas
 * @param system Sistema de unidades ('metric' ou 'imperial')
 * @param decimals Casas decimais (padrão: 1)
 * @returns Peso formatado com unidade
 */
export function formatWeight(
  kg: number,
  system: "metric" | "imperial" = "metric",
  decimals: number = 1
): string {
  if (system === "imperial") {
    const lbs = kgToLbs(kg);
    return `${lbs.toFixed(decimals)} lb`;
  }
  return `${kg.toFixed(decimals)} kg`;
}

/**
 * === ALTURA / HEIGHT ===
 */

/**
 * Converte centímetros para polegadas
 * @param cm Altura em centímetros
 * @returns Altura em polegadas
 */
export function cmToInches(cm: number): number {
  return cm / 2.54;
}

/**
 * Converte polegadas para centímetros
 * @param inches Altura em polegadas
 * @returns Altura em centímetros
 */
export function inchesToCm(inches: number): number {
  return inches * 2.54;
}

/**
 * Converte centímetros para pés e polegadas
 * @param cm Altura em centímetros
 * @returns Objeto com pés e polegadas
 */
export function cmToFeetAndInches(cm: number): {
  feet: number;
  inches: number;
} {
  const totalInches = cmToInches(cm);
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

/**
 * Converte pés e polegadas para centímetros
 * @param feet Pés
 * @param inches Polegadas
 * @returns Altura em centímetros
 */
export function feetAndInchesToCm(feet: number, inches: number): number {
  const totalInches = feet * 12 + inches;
  return inchesToCm(totalInches);
}

/**
 * Formata altura de acordo com o sistema de unidades
 * @param cm Altura em centímetros
 * @param system Sistema de unidades ('metric' ou 'imperial')
 * @returns Altura formatada com unidade
 */
export function formatHeight(
  cm: number,
  system: "metric" | "imperial" = "metric"
): string {
  if (system === "imperial") {
    const { feet, inches } = cmToFeetAndInches(cm);
    return `${feet}' ${inches}"`;
  }
  return `${cm.toFixed(0)} cm`;
}

/**
 * === CIRCUNFERÊNCIAS / CIRCUMFERENCES ===
 */

/**
 * Formata medida de circunferência
 * @param cm Medida em centímetros
 * @param system Sistema de unidades
 * @param decimals Casas decimais (padrão: 1)
 * @returns Medida formatada
 */
export function formatCircumference(
  cm: number,
  system: "metric" | "imperial" = "metric",
  decimals: number = 1
): string {
  if (system === "imperial") {
    const inches = cmToInches(cm);
    return `${inches.toFixed(decimals)} in`;
  }
  return `${cm.toFixed(decimals)} cm`;
}

/**
 * === DISTÂNCIA / DISTANCE ===
 */

/**
 * Converte metros para pés
 * @param meters Distância em metros
 * @returns Distância em pés
 */
export function metersToFeet(meters: number): number {
  return meters * 3.28084;
}

/**
 * Converte pés para metros
 * @param feet Distância em pés
 * @returns Distância em metros
 */
export function feetToMeters(feet: number): number {
  return feet / 3.28084;
}

/**
 * Formata distância de acordo com o sistema de unidades
 * @param meters Distância em metros
 * @param system Sistema de unidades
 * @param decimals Casas decimais (padrão: 0)
 * @returns Distância formatada
 */
export function formatDistance(
  meters: number,
  system: "metric" | "imperial" = "metric",
  decimals: number = 0
): string {
  if (system === "imperial") {
    const feet = metersToFeet(meters);
    return `${feet.toFixed(decimals)} ft`;
  }
  return `${meters.toFixed(decimals)} m`;
}

/**
 * === IMC / BMI ===
 */

/**
 * Calcula IMC (Índice de Massa Corporal)
 * @param weightKg Peso em kg
 * @param heightCm Altura em cm
 * @returns IMC calculado
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightMeters = heightCm / 100;
  return weightKg / (heightMeters * heightMeters);
}

/**
 * Calcula IMC a partir de unidades imperiais
 * @param weightLbs Peso em libras
 * @param heightInches Altura em polegadas
 * @returns IMC calculado
 */
export function calculateBMIImperial(
  weightLbs: number,
  heightInches: number
): number {
  const weightKg = lbsToKg(weightLbs);
  const heightCm = inchesToCm(heightInches);
  return calculateBMI(weightKg, heightCm);
}

/**
 * Formata IMC com descrição
 * @param bmi Valor do IMC
 * @returns IMC formatado com classificação
 */
export function formatBMI(bmi: number): string {
  let classification = "";

  if (bmi < 18.5) {
    classification = "Abaixo do peso";
  } else if (bmi < 25) {
    classification = "Peso normal";
  } else if (bmi < 30) {
    classification = "Sobrepeso";
  } else if (bmi < 35) {
    classification = "Obesidade Grau I";
  } else if (bmi < 40) {
    classification = "Obesidade Grau II";
  } else {
    classification = "Obesidade Grau III";
  }

  return `${bmi.toFixed(1)} - ${classification}`;
}

/**
 * === UTILITÁRIOS GERAIS ===
 */

/**
 * Converte qualquer medida baseado no tipo e sistema
 * @param value Valor a ser convertido
 * @param type Tipo de medida ('weight', 'height', 'circumference', 'distance')
 * @param fromSystem Sistema de origem
 * @param toSystem Sistema de destino
 * @returns Valor convertido
 */
export function convertUnit(
  value: number,
  type: "weight" | "height" | "circumference" | "distance",
  fromSystem: "metric" | "imperial",
  toSystem: "metric" | "imperial"
): number {
  // Se os sistemas são iguais, retorna o valor original
  if (fromSystem === toSystem) {
    return value;
  }

  switch (type) {
    case "weight":
      return fromSystem === "metric" ? kgToLbs(value) : lbsToKg(value);

    case "height":
    case "circumference":
      return fromSystem === "metric" ? cmToInches(value) : inchesToCm(value);

    case "distance":
      return fromSystem === "metric"
        ? metersToFeet(value)
        : feetToMeters(value);

    default:
      return value;
  }
}

/**
 * Hook personalizado para conversão de unidades (para uso em componentes React)
 */
export const useUnitConversion = (system: "metric" | "imperial") => {
  return {
    formatWeight: (kg: number, decimals?: number) =>
      formatWeight(kg, system, decimals),
    formatHeight: (cm: number) => formatHeight(cm, system),
    formatCircumference: (cm: number, decimals?: number) =>
      formatCircumference(cm, system, decimals),
    formatDistance: (meters: number, decimals?: number) =>
      formatDistance(meters, system, decimals),
    formatBMI,
    convertUnit: (
      value: number,
      type: "weight" | "height" | "circumference" | "distance"
    ) => convertUnit(value, type, "metric", system),
  };
};
