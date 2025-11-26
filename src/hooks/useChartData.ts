import { useMemo } from "react";
import { PeriodOption } from "../components/charts/PeriodSelector";

export interface DataPoint {
  date: Date;
  [key: string]: any;
}

/**
 * Hook para filtrar dados por período selecionado
 */
export function useFilteredDataByPeriod<T extends DataPoint>(
  data: T[],
  period: PeriodOption
): T[] {
  return useMemo(() => {
    if (!data || data.length === 0) return [];
    if (period === "ALL") return data;

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "1M":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "3M":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "6M":
        startDate.setMonth(now.getMonth() - 6);
        break;
      case "1Y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return data;
    }

    return data.filter((item) => item.date >= startDate);
  }, [data, period]);
}

/**
 * Hook para calcular período recomendado baseado na quantidade de dados
 */
export function useRecommendedPeriod<T extends DataPoint>(
  data: T[]
): PeriodOption {
  return useMemo(() => {
    if (!data || data.length === 0) return "ALL";

    const dates = data
      .map((d) => d.date)
      .sort((a, b) => a.getTime() - b.getTime());
    const oldestDate = dates[0];
    const now = new Date();

    const monthsDiff =
      (now.getFullYear() - oldestDate.getFullYear()) * 12 +
      (now.getMonth() - oldestDate.getMonth());

    // Recomendar período baseado no alcance de dados
    if (monthsDiff <= 1) return "1M";
    if (monthsDiff <= 3) return "3M";
    if (monthsDiff <= 6) return "6M";
    if (monthsDiff <= 12) return "1Y";
    return "ALL";
  }, [data]);
}
