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
import Svg, { G, Path, Rect, Line, Text as SvgText } from "react-native-svg";
import { pie, arc } from "d3-shape";
import { scaleLinear, scaleBand } from "d3-scale";
import { max } from "d3-array";
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
  const screenWidth = Dimensions.get("window").width - 32;
  const chartWidth = screenWidth - 32;
  const chartHeight = 220;

  // ===== GRÁFICO DE PIZZA - Distribuição de Macros =====
  const pieData = [
    {
      name: "Proteínas",
      value: nutrition.totalProtein,
      color: "#3B82F6",
    },
    {
      name: "Carboidratos",
      value: nutrition.totalCarbs,
      color: "#10B981",
    },
    {
      name: "Gorduras",
      value: nutrition.totalFat,
      color: "#F59E0B",
    },
  ];

  // Criar gerador de arcos para o gráfico de pizza
  const pieRadius = 80;
  const pieGenerator = pie<(typeof pieData)[0]>()
    .value((d) => d.value)
    .sort(null);

  const arcGenerator = arc<ReturnType<typeof pieGenerator>[0]>()
    .innerRadius(0)
    .outerRadius(pieRadius);

  const arcs = pieGenerator(pieData);

  // ===== GRÁFICO DE BARRAS - Real vs Meta =====
  const hasTargets =
    nutrition.targetProtein ||
    nutrition.targetCarbs ||
    nutrition.targetFat ||
    nutrition.targetFiber;

  const barLabels = ["Prot.", "Carb.", "Gord.", "Fibra"];
  const currentValues = [
    nutrition.totalProtein,
    nutrition.totalCarbs,
    nutrition.totalFat,
    nutrition.totalFiber,
  ];
  const targetValues = [
    nutrition.targetProtein || 0,
    nutrition.targetCarbs || 0,
    nutrition.targetFat || 0,
    nutrition.targetFiber || 0,
  ];

  // Configurar escalas D3 para o gráfico de barras
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const xScale = scaleBand()
    .domain(barLabels)
    .range([0, innerWidth])
    .padding(0.3);

  const maxValue = Math.max(max(currentValues) || 0, max(targetValues) || 0);

  const yScale = scaleLinear()
    .domain([0, maxValue])
    .range([innerHeight, 0])
    .nice();

  const yTicks = yScale.ticks(5);

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
          {/* Gráfico de Pizza com D3 */}
          <View style={{ alignItems: "center", marginVertical: 16 }}>
            <Svg width={pieRadius * 2 + 20} height={pieRadius * 2 + 20}>
              <G x={pieRadius + 10} y={pieRadius + 10}>
                {arcs.map((arc, index) => (
                  <Path
                    key={index}
                    d={arcGenerator(arc) || ""}
                    fill={pieData[index].color}
                  />
                ))}
              </G>
            </Svg>
          </View>

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
            {/* Gráfico de Barras com D3 */}
            <Svg width={chartWidth} height={chartHeight}>
              <G x={padding.left} y={padding.top}>
                {/* Grid lines */}
                {yTicks.map((tick) => (
                  <Line
                    key={`grid-${tick}`}
                    x1={0}
                    y1={yScale(tick)}
                    x2={innerWidth}
                    y2={yScale(tick)}
                    stroke="#E5E7EB"
                    strokeWidth={1}
                  />
                ))}

                {/* Y Axis */}
                <Line
                  x1={0}
                  y1={0}
                  x2={0}
                  y2={innerHeight}
                  stroke="#374151"
                  strokeWidth={1}
                />

                {/* X Axis */}
                <Line
                  x1={0}
                  y1={innerHeight}
                  x2={innerWidth}
                  y2={innerHeight}
                  stroke="#374151"
                  strokeWidth={1}
                />

                {/* Y Axis Labels */}
                {yTicks.map((tick) => (
                  <SvgText
                    key={`y-label-${tick}`}
                    x={-8}
                    y={yScale(tick)}
                    fontSize={10}
                    fill="#6B7280"
                    textAnchor="end"
                    alignmentBaseline="middle"
                  >
                    {tick}g
                  </SvgText>
                ))}

                {/* Bars */}
                {barLabels.map((label, index) => {
                  const barWidth = xScale.bandwidth() / (hasTargets ? 2.2 : 1);
                  const x = xScale(label) || 0;
                  const currentHeight =
                    innerHeight - yScale(currentValues[index]);
                  const targetHeight =
                    innerHeight - yScale(targetValues[index]);

                  return (
                    <G key={label}>
                      {/* Current Value Bar */}
                      <Rect
                        x={x}
                        y={yScale(currentValues[index])}
                        width={barWidth}
                        height={currentHeight}
                        fill="#3B82F6"
                        rx={4}
                      />
                      {/* Value on top */}
                      <SvgText
                        x={x + barWidth / 2}
                        y={yScale(currentValues[index]) - 5}
                        fontSize={10}
                        fill="#374151"
                        textAnchor="middle"
                        fontWeight="600"
                      >
                        {currentValues[index].toFixed(0)}
                      </SvgText>

                      {/* Target Value Bar */}
                      {hasTargets && targetValues[index] > 0 && (
                        <>
                          <Rect
                            x={x + barWidth + 4}
                            y={yScale(targetValues[index])}
                            width={barWidth}
                            height={targetHeight}
                            fill="#9CA3AF"
                            rx={4}
                          />
                          <SvgText
                            x={x + barWidth * 1.5 + 4}
                            y={yScale(targetValues[index]) - 5}
                            fontSize={10}
                            fill="#374151"
                            textAnchor="middle"
                            fontWeight="600"
                          >
                            {targetValues[index].toFixed(0)}
                          </SvgText>
                        </>
                      )}

                      {/* X Axis Label */}
                      <SvgText
                        x={x + (hasTargets ? barWidth + 2 : barWidth / 2)}
                        y={innerHeight + 20}
                        fontSize={12}
                        fill="#374151"
                        textAnchor="middle"
                      >
                        {label}
                      </SvgText>
                    </G>
                  );
                })}
              </G>
            </Svg>

            {/* Legend */}
            {hasTargets && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  marginTop: 12,
                  gap: 16,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      backgroundColor: "#3B82F6",
                      borderRadius: 4,
                      marginRight: 6,
                    }}
                  />
                  <Text style={{ fontSize: 12, color: "#6B7280" }}>Atual</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      backgroundColor: "#9CA3AF",
                      borderRadius: 4,
                      marginRight: 6,
                    }}
                  />
                  <Text style={{ fontSize: 12, color: "#6B7280" }}>Meta</Text>
                </View>
              </View>
            )}

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
