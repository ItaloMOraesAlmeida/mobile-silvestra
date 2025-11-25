/**
 * useEvolutionCharts Hook
 *
 * Hook customizado para transformar dados da API em formato de gráficos.
 * Processa dados de avaliações e gera datasets para diferentes métricas.
 *
 * Features:
 * - Transformação memoizada (performance)
 * - Múltiplos charts simultâneos
 * - Formatação de datas e valores
 * - Cálculo de estatísticas (min, max, média, variação)
 * - Suporte a diferentes períodos
 */

import { useMemo } from "react";

interface Assessment {
  id: string;
  date: string;
  weight?: number;
  height?: number;
  bodyFatPercent?: number;
  muscleMass?: number;
  leanMass?: number;
  waterPercent?: number;
  bmr?: number;
  visceralFat?: number;
  // Circunferências
  neck?: number;
  waist?: number;
  hip?: number;
  rightArm?: number;
  leftArm?: number;
  rightThigh?: number;
  leftThigh?: number;
  // Dobras
  tricepsFold?: number;
  subscapularFold?: number;
  suprailiacFold?: number;
  abdominalFold?: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label: string;
}

export interface ChartStats {
  min: number;
  max: number;
  average: number;
  variation: number;
  variationPercent: number;
  trend: "up" | "down" | "stable";
}

export interface ChartData {
  data: ChartDataPoint[];
  stats: ChartStats;
}

type MetricType =
  | "weight"
  | "bodyFat"
  | "muscleMass"
  | "leanMass"
  | "waterPercent"
  | "bmr"
  | "visceralFat"
  | "bmi"
  | "waist"
  | "hip"
  | "waistHipRatio"
  | "neck"
  | "arm"
  | "thigh"
  | "skinfoldSum";

interface UseEvolutionChartsOptions {
  assessments: Assessment[];
  metrics?: MetricType[];
}

interface UseEvolutionChartsReturn {
  weightChart: ChartData | null;
  bodyFatChart: ChartData | null;
  muscleMassChart: ChartData | null;
  bmiChart: ChartData | null;
  waistHipRatioChart: ChartData | null;
  getChartData: (metric: MetricType) => ChartData | null;
  hasData: boolean;
}

/**
 * Hook para processar dados em formato de gráficos
 *
 * @example
 * const { weightChart, bodyFatChart, getChartData } = useEvolutionCharts({
 *   assessments: data.assessments,
 *   metrics: ["weight", "bodyFat", "muscleMass"]
 * });
 */
export const useEvolutionCharts = ({
  assessments,
  metrics = ["weight", "bodyFat", "muscleMass", "bmi"],
}: UseEvolutionChartsOptions): UseEvolutionChartsReturn => {
  // Processar dados genérico
  const processMetric = useMemo(
    () =>
      (metric: MetricType): ChartData | null => {
        if (!assessments || assessments.length === 0) return null;

        // Extrair valores baseado na métrica
        const dataPoints: ChartDataPoint[] = [];

        assessments.forEach((assessment) => {
          let value: number | undefined;

          switch (metric) {
            case "weight":
              value = assessment.weight;
              break;
            case "bodyFat":
              value = assessment.bodyFatPercent;
              break;
            case "muscleMass":
              value = assessment.muscleMass;
              break;
            case "leanMass":
              value = assessment.leanMass;
              break;
            case "waterPercent":
              value = assessment.waterPercent;
              break;
            case "bmr":
              value = assessment.bmr;
              break;
            case "visceralFat":
              value = assessment.visceralFat;
              break;
            case "bmi":
              if (assessment.weight && assessment.height) {
                value =
                  assessment.weight / Math.pow(assessment.height / 100, 2);
              }
              break;
            case "waist":
              value = assessment.waist;
              break;
            case "hip":
              value = assessment.hip;
              break;
            case "waistHipRatio":
              if (assessment.waist && assessment.hip) {
                value = assessment.waist / assessment.hip;
              }
              break;
            case "neck":
              value = assessment.neck;
              break;
            case "arm":
              // Média dos braços
              if (assessment.rightArm && assessment.leftArm) {
                value = (assessment.rightArm + assessment.leftArm) / 2;
              } else if (assessment.rightArm) {
                value = assessment.rightArm;
              } else if (assessment.leftArm) {
                value = assessment.leftArm;
              }
              break;
            case "thigh":
              // Média das coxas
              if (assessment.rightThigh && assessment.leftThigh) {
                value = (assessment.rightThigh + assessment.leftThigh) / 2;
              } else if (assessment.rightThigh) {
                value = assessment.rightThigh;
              } else if (assessment.leftThigh) {
                value = assessment.leftThigh;
              }
              break;
            case "skinfoldSum":
              const folds = [
                assessment.tricepsFold,
                assessment.subscapularFold,
                assessment.suprailiacFold,
                assessment.abdominalFold,
              ].filter((f) => f !== undefined && f !== null) as number[];
              if (folds.length > 0) {
                value = folds.reduce((sum, f) => sum + f, 0);
              }
              break;
          }

          if (value !== undefined && value !== null) {
            dataPoints.push({
              date: assessment.date,
              value,
              label: new Date(assessment.date).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              }),
            });
          }
        });

        if (dataPoints.length === 0) return null;

        // Ordenar por data (mais antiga primeiro)
        dataPoints.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Calcular estatísticas
        const values = dataPoints.map((p) => p.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const average = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variation = values[values.length - 1] - values[0];
        const variationPercent = (variation / values[0]) * 100;

        // Determinar tendência
        let trend: "up" | "down" | "stable" = "stable";
        if (Math.abs(variationPercent) > 2) {
          trend = variationPercent > 0 ? "up" : "down";
        }

        return {
          data: dataPoints,
          stats: {
            min,
            max,
            average,
            variation,
            variationPercent,
            trend,
          },
        };
      },
    [assessments]
  );

  // Gerar charts específicos
  const weightChart = useMemo(() => processMetric("weight"), [processMetric]);
  const bodyFatChart = useMemo(() => processMetric("bodyFat"), [processMetric]);
  const muscleMassChart = useMemo(
    () => processMetric("muscleMass"),
    [processMetric]
  );
  const bmiChart = useMemo(() => processMetric("bmi"), [processMetric]);
  const waistHipRatioChart = useMemo(
    () => processMetric("waistHipRatio"),
    [processMetric]
  );

  // Função exposta para qualquer métrica
  const getChartData = useMemo(
    () => (metric: MetricType) => processMetric(metric),
    [processMetric]
  );

  const hasData = useMemo(() => {
    return assessments && assessments.length > 0;
  }, [assessments]);

  return {
    weightChart,
    bodyFatChart,
    muscleMassChart,
    bmiChart,
    waistHipRatioChart,
    getChartData,
    hasData,
  };
};
