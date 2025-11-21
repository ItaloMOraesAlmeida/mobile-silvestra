/**
 * Componente de Gráfico: Progresso vs Metas
 * Mostra gráfico de linha comparando valores planejados com metas
 * Eixo X: Nutrientes (Calorias, Proteínas, Carboidratos, Gorduras)
 * Eixo Y: Valores (0 até máximo)
 * 2 Linhas: Meta e Planejado
 */

import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AdvancedLineChart, DataSeries } from "./charts/AdvancedLineChart";
import { lightTheme } from "../theme";
import { DayOfWeek } from "../types/meal-plan.types";

interface MealNutrition {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

interface Meal {
  dayOfWeek: DayOfWeek | string | number;
  nutrition: MealNutrition;
}

interface NutritionTargets {
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
}

interface ProgressVsGoalsChartProps {
  meals: Meal[];
  targets: NutritionTargets;
  mealsByDay: Record<DayOfWeek, Meal[]>;
}

type ViewMode = "daily" | "weekly";

const NUTRIENTS = [
  {
    key: "calories",
    label: "Calorias",
    shortLabel: "Cal",
    targetKey: "targetCalories" as const,
    valueKey: "totalCalories" as const,
    // Normalização: calorias são maiores, vamos dividir por 100 para visualização
    normalize: (val: number) => val / 100,
    denormalize: (val: number) => val * 100,
    unit: "kcal",
  },
  {
    key: "protein",
    label: "Proteínas",
    shortLabel: "Prot",
    targetKey: "targetProtein" as const,
    valueKey: "totalProtein" as const,
    normalize: (val: number) => val,
    denormalize: (val: number) => val,
    unit: "g",
  },
  {
    key: "carbs",
    label: "Carboidratos",
    shortLabel: "Carbo",
    targetKey: "targetCarbs" as const,
    valueKey: "totalCarbs" as const,
    normalize: (val: number) => val,
    denormalize: (val: number) => val,
    unit: "g",
  },
  {
    key: "fat",
    label: "Gorduras",
    shortLabel: "Gord",
    targetKey: "targetFat" as const,
    valueKey: "totalFat" as const,
    normalize: (val: number) => val,
    denormalize: (val: number) => val,
    unit: "g",
  },
];

const DAY_ORDER: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

export function ProgressVsGoalsChart({
  meals,
  targets,
  mealsByDay,
}: ProgressVsGoalsChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("daily");

  // Preparar dados do gráfico
  const chartData = useMemo(() => {
    // Verificar se há pelo menos uma meta definida
    const hasAnyTarget = NUTRIENTS.some((n) => targets[n.targetKey]);
    if (!hasAnyTarget) {
      return null;
    }

    // Calcular valores totais por nutriente
    const activeDays = DAY_ORDER.filter((day) => mealsByDay[day]?.length > 0);
    const numDays = activeDays.length || 1;

    const plannedData: any[] = [];
    const targetData: any[] = [];

    NUTRIENTS.forEach((nutrient, index) => {
      const targetValue = targets[nutrient.targetKey];

      // Pular se não tiver meta para este nutriente
      if (!targetValue) return;

      // Calcular total planejado
      let totalPlanned = 0;
      activeDays.forEach((day) => {
        const dayMeals = mealsByDay[day] || [];
        const dayTotal = dayMeals.reduce(
          (sum, meal) => sum + (meal.nutrition[nutrient.valueKey] || 0),
          0
        );
        totalPlanned += dayTotal;
      });

      // Valores finais dependendo do modo
      let finalPlannedValue: number;
      let finalTargetValue: number;

      if (viewMode === "daily") {
        // Modo Diário: média por dia
        finalPlannedValue = totalPlanned / numDays;
        finalTargetValue = targetValue;
      } else {
        // Modo Semanal: total acumulado
        finalPlannedValue = totalPlanned;
        finalTargetValue = targetValue * numDays;
      }

      // Usar data incremental para posicionar no eixo X
      const date = new Date(2025, 0, index + 1);

      plannedData.push({
        date,
        value: parseFloat(finalPlannedValue.toFixed(2)),
        label: nutrient.shortLabel,
      });

      targetData.push({
        date,
        value: parseFloat(finalTargetValue.toFixed(2)),
        label: nutrient.shortLabel,
      });
    });

    return {
      planned: {
        id: "planned",
        label: "Planejado",
        data: plannedData,
        color: "#4ECDC4", // Azul/verde
        unit: "",
      },
      target: {
        id: "target",
        label: "Meta",
        data: targetData,
        color: "#FF6B6B", // Vermelho/coral
        unit: "",
      },
    };
  }, [viewMode, mealsByDay, targets]);

  if (!chartData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Progresso vs Metas</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Configure metas nutricionais para visualizar o gráfico
          </Text>
        </View>
      </View>
    );
  }

  const series: DataSeries[] = [chartData.target, chartData.planned];

  return (
    <View style={styles.container}>
      {/* Título e Toggle */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 Progresso vs Metas</Text>

        {/* Toggle Diário/Semanal */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === "daily" && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode("daily")}
          >
            <Text
              style={[
                styles.toggleText,
                viewMode === "daily" && styles.toggleTextActive,
              ]}
            >
              Diário
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === "weekly" && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode("weekly")}
          >
            <Text
              style={[
                styles.toggleText,
                viewMode === "weekly" && styles.toggleTextActive,
              ]}
            >
              Semanal
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Descrição */}
      <Text style={styles.description}>
        {viewMode === "daily"
          ? "Comparação de valores médios diários"
          : "Comparação de valores totais semanais"}
      </Text>

      {/* Gráfico */}
      <View style={styles.chartContainer}>
        <AdvancedLineChart
          series={series}
          width={320}
          height={240}
          showDots={true}
          showGrid={true}
          showLabels={true}
          showLegend={false}
          formatValue={(value) => `${value.toFixed(2)}`}
        />
      </View>

      {/* Legenda */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#FF6B6B" }]} />
          <Text style={styles.legendText}>Meta</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#4ECDC4" }]} />
          <Text style={styles.legendText}>Planejado</Text>
        </View>
      </View>

      {/* Nota sobre unidades */}
      <Text style={styles.note}>
        * Calorias divididas por 100 para melhor visualização
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing[4],
    ...lightTheme.shadows.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: lightTheme.spacing[2],
  },
  title: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
  },
  description: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing[4],
  },
  emptyState: {
    paddingVertical: lightTheme.spacing[8],
    alignItems: "center",
  },
  emptyText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
    textAlign: "center",
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.lg,
    padding: 4,
  },
  toggleButton: {
    paddingVertical: lightTheme.spacing[1] + 2,
    paddingHorizontal: lightTheme.spacing[3],
    borderRadius: lightTheme.borderRadius.md,
    alignItems: "center",
    minWidth: 70,
  },
  toggleButtonActive: {
    backgroundColor: lightTheme.colors.white,
    ...lightTheme.shadows.sm,
  },
  toggleText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[600],
  },
  toggleTextActive: {
    color: lightTheme.colors.primary,
    fontWeight: lightTheme.typography.fontWeight.semibold,
  },
  chartContainer: {
    marginVertical: lightTheme.spacing[3],
    alignItems: "center",
    overflow: "hidden",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: lightTheme.spacing[4],
    marginTop: lightTheme.spacing[4],
    paddingTop: lightTheme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[100],
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[2],
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[700],
  },
  note: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    fontStyle: "italic",
    textAlign: "center",
    marginTop: lightTheme.spacing[2],
  },
});
