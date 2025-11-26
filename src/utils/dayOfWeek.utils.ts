/**
 * Helpers e constantes para dias da semana
 */

import { DayOfWeek } from "../types/meal-plan.types";

/**
 * Labels em português para os dias da semana
 */
export const DAY_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: "Segunda",
  [DayOfWeek.TUESDAY]: "Terça",
  [DayOfWeek.WEDNESDAY]: "Quarta",
  [DayOfWeek.THURSDAY]: "Quinta",
  [DayOfWeek.FRIDAY]: "Sexta",
  [DayOfWeek.SATURDAY]: "Sábado",
  [DayOfWeek.SUNDAY]: "Domingo",
};

/**
 * Labels completos em português
 */
export const DAY_FULL_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: "Segunda-feira",
  [DayOfWeek.TUESDAY]: "Terça-feira",
  [DayOfWeek.WEDNESDAY]: "Quarta-feira",
  [DayOfWeek.THURSDAY]: "Quinta-feira",
  [DayOfWeek.FRIDAY]: "Sexta-feira",
  [DayOfWeek.SATURDAY]: "Sábado",
  [DayOfWeek.SUNDAY]: "Domingo",
};

/**
 * Ordem dos dias da semana
 */
export const DAYS_ORDER: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

/**
 * Obter o próximo dia da semana
 */
export function getNextDay(currentDay: DayOfWeek): DayOfWeek | null {
  const currentIndex = DAYS_ORDER.indexOf(currentDay);
  if (currentIndex === -1 || currentIndex === DAYS_ORDER.length - 1) {
    return null;
  }
  return DAYS_ORDER[currentIndex + 1];
}

/**
 * Obter o dia anterior
 */
export function getPreviousDay(currentDay: DayOfWeek): DayOfWeek | null {
  const currentIndex = DAYS_ORDER.indexOf(currentDay);
  if (currentIndex <= 0) {
    return null;
  }
  return DAYS_ORDER[currentIndex - 1];
}

/**
 * Verificar se é o primeiro dia (Segunda)
 */
export function isFirstDay(day: DayOfWeek): boolean {
  return day === DayOfWeek.MONDAY;
}

/**
 * Verificar se é o último dia (Domingo)
 */
export function isLastDay(day: DayOfWeek): boolean {
  return day === DayOfWeek.SUNDAY;
}
