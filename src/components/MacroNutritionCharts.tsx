/**
 * Componente de Gráfico de Macronutrientes
 * Sprint 8-9 - Meal Plans Module (Melhorias Finais)
 *
 * Visualização gráfica da distribuição de macronutrientes:
 * - Gráfico de Pizza: Distribuição percentual de Proteínas, Carboidratos e Gorduras
 * - Gráfico de Barras: Comparação de valores reais vs metas
 */

import React from "react";
import { View, Text, Dimensions, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PieChart, BarChart } from "react-native-chart-kit";
import type { PlanNutritionSummary } from "../types/meal-plan.types";
import { formatGrams, formatPercentage } from "../utils/meal-plan.utils";
import { lightTheme } from "../theme";

interface MacroNutritionChartsProps {
  nutrition: PlanNutritionSummary;
  showTargets?: boolean;
}

export default function MacroNutritionCharts({
  nutrition,
  showTargets = true,
}: MacroNutritionChartsProps) {
  const screenWidth = Dimensions.get("window").width - 32; // padding

  // ===== GRÁFICO DE PIZZA - Distribuição de Macros =====
  const pieData = [
    {
      name: "Proteínas",
      population: nutrition.totalProtein,
      color: "#3B82F6", // blue-600
      legendFontColor: "#374151",
      legendFontSize: 12,
    },
    {
      name: "Carboidratos",
      population: nutrition.totalCarbs,
      color: "#10B981", // green-600
      legendFontColor: "#374151",
      legendFontSize: 12,
    },
    {
      name: "Gorduras",
      population: nutrition.totalFat,
      color: "#F59E0B", // amber-500
      legendFontColor: "#374151",
      legendFontSize: 12,
    },
  ];

  // ===== GRÁFICO DE BARRAS - Real vs Meta =====
  const hasTargets =
    nutrition.targetProtein ||
    nutrition.targetCarbs ||
    nutrition.targetFat ||
    nutrition.targetFiber;

  const barData = {
    labels: ["Prot.", "Carb.", "Gord.", "Fibra"],
    datasets: [
      {
        data: [
          nutrition.totalProtein,
          nutrition.totalCarbs,
          nutrition.totalFat,
          nutrition.totalFiber,
        ],
        color: () => "#3B82F6", // blue
      },
      ...(hasTargets && showTargets
        ? [
            {
              data: [
                nutrition.targetProtein || 0,
                nutrition.targetCarbs || 0,
                nutrition.targetFat || 0,
                nutrition.targetFiber || 0,
              ],
              color: () => "#9CA3AF", // gray (meta)
            },
          ]
        : []),
    ],
    legend: hasTargets && showTargets ? ["Atual", "Meta"] : ["Atual"],
  };

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForBackgroundLines: {
      strokeDasharray: "", // solid lines
      stroke: "#E5E7EB",
      strokeWidth: 1,
    },
  };

  return (
    <View>
      {/* Gráfico de Pizza - Distribuição */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons
            name="pie-chart"
            size={18}
            color={lightTheme.colors.primary}
          />
          <Text style={styles.sectionTitle}>
            Distribuição de Macronutrientes
          </Text>
        </View>
        <View style={styles.chartCard}>
          <PieChart
            data={pieData}
            width={screenWidth - 32}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute={false} // Mostra percentuais
          />

          {/* Legenda Customizada com Percentuais */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={styles.legendRow}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#3B82F6" }]}
                />
                <Text style={styles.legendLabel}>Proteínas</Text>
              </View>
              <Text style={styles.legendValue}>
                {formatGrams(nutrition.totalProtein)} (
                {formatPercentage(nutrition.proteinPercentage)})
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View style={styles.legendRow}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#10B981" }]}
                />
                <Text style={styles.legendLabel}>Carboidratos</Text>
              </View>
              <Text style={styles.legendValue}>
                {formatGrams(nutrition.totalCarbs)} (
                {formatPercentage(nutrition.carbsPercentage)})
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View style={styles.legendRow}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#F59E0B" }]}
                />
                <Text style={styles.legendLabel}>Gorduras</Text>
              </View>
              <Text style={styles.legendValue}>
                {formatGrams(nutrition.totalFat)} (
                {formatPercentage(nutrition.fatPercentage)})
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Gráfico de Barras - Comparação com Metas */}
      {hasTargets && showTargets && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="bar-chart"
              size={18}
              color={lightTheme.colors.success}
            />
            <Text style={styles.sectionTitle}>Progresso vs Metas</Text>
          </View>
          <View style={styles.chartCard}>
            <BarChart
              data={barData}
              width={screenWidth - 32}
              height={220}
              chartConfig={chartConfig}
              yAxisSuffix="g"
              yAxisLabel=""
              fromZero
              showBarTops
              showValuesOnTopOfBars
              withInnerLines
              style={{
                borderRadius: 16,
              }}
            />

            {/* Legenda de Progresso */}
            <View style={styles.progressLegend}>
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>Proteínas</Text>
                <Text style={styles.progressValue}>
                  {nutrition.proteinProgress
                    ? `${Math.round(nutrition.proteinProgress)}%`
                    : "-"}
                </Text>
              </View>
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>Carboidratos</Text>
                <Text style={styles.progressValue}>
                  {nutrition.carbsProgress
                    ? `${Math.round(nutrition.carbsProgress)}%`
                    : "-"}
                </Text>
              </View>
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>Gorduras</Text>
                <Text style={styles.progressValue}>
                  {nutrition.fatProgress
                    ? `${Math.round(nutrition.fatProgress)}%`
                    : "-"}
                </Text>
              </View>
              <View style={[styles.progressItem, styles.progressItemLast]}>
                <Text style={styles.progressLabel}>Fibras</Text>
                <Text style={styles.progressValue}>
                  {nutrition.fiberProgress
                    ? `${Math.round(nutrition.fiberProgress)}%`
                    : "-"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: lightTheme.spacing[6],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: lightTheme.spacing[3],
    paddingHorizontal: lightTheme.spacing[1],
  },
  sectionTitle: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
    marginLeft: lightTheme.spacing[2],
  },
  chartCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.xl,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[100],
    padding: lightTheme.spacing[4],
    ...lightTheme.shadows.sm,
  },
  legend: {
    marginTop: lightTheme.spacing[4],
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: lightTheme.spacing[2],
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: lightTheme.borderRadius.sm,
    marginRight: lightTheme.spacing[2],
  },
  legendLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[700],
  },
  legendValue: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
  },
  progressLegend: {
    marginTop: lightTheme.spacing[4],
    backgroundColor: lightTheme.colors.primary + "10",
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing[3],
  },
  progressItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: lightTheme.spacing[2],
  },
  progressItemLast: {
    marginBottom: 0,
  },
  progressLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
  },
  progressValue: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
  },
});
