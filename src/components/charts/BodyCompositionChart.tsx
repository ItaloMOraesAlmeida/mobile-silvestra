import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { G, Rect, Line, Text as SvgText } from "react-native-svg";
import { scaleLinear, scaleBand } from "d3-scale";
import { max } from "d3-array";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import type { Theme } from "../../theme";

const screenWidth = Dimensions.get("window").width;

export interface BodyCompositionData {
  date: string; // ISO date string
  leanMass: number; // Massa magra (kg)
  fatMass: number; // Massa gorda (kg)
  waterPercentage?: number; // % de água
}

interface BodyCompositionChartProps {
  data: BodyCompositionData[];
}

/**
 * BodyCompositionChart Component
 *
 * Gráfico de barras empilhadas mostrando composição corporal
 *
 * Features:
 * - Massa magra (azul)
 * - Massa gorda (vermelho/laranja)
 * - % de água (opcional, azul claro)
 * - Comparação temporal
 * - Percentuais calculados
 */
export const BodyCompositionChart: React.FC<BodyCompositionChartProps> = ({
  data,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();

  // Se não há dados
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Nenhum dado de composição corporal registrado
        </Text>
      </View>
    );
  }

  // Pegar apenas últimas 6 medições para não congestionar
  const recentData = data.slice(-6);

  // Formatar labels de data
  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.toLocaleDateString("pt-BR", { month: "short" });
    const day = date.getDate();
    return `${day}/${month}`;
  };

  // Preparar dados para o gráfico
  const labels = recentData.map((point) => formatDateLabel(point.date));
  const leanMassData = recentData.map((point) => point.leanMass);
  const fatMassData = recentData.map((point) => point.fatMass);

  // Dados da medição mais recente
  const latestData = recentData[recentData.length - 1];
  const totalMass = latestData.leanMass + latestData.fatMass;
  const leanPercentage = ((latestData.leanMass / totalMass) * 100).toFixed(1);
  const fatPercentage = ((latestData.fatMass / totalMass) * 100).toFixed(1);

  // Comparação com medição anterior (se existir)
  let leanMassChange = 0;
  let fatMassChange = 0;
  if (recentData.length > 1) {
    const previousData = recentData[recentData.length - 2];
    leanMassChange = latestData.leanMass - previousData.leanMass;
    fatMassChange = latestData.fatMass - previousData.fatMass;
  }

  // Configurar gráfico D3
  const chartWidth = screenWidth - 32;
  const chartHeight = 220;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Escalas
  const xScale = scaleBand().domain(labels).range([0, innerWidth]).padding(0.3);

  const maxValue = Math.max(
    max(leanMassData.map((l, i) => l + fatMassData[i])) || 0
  );

  const yScale = scaleLinear()
    .domain([0, maxValue])
    .range([innerHeight, 0])
    .nice();

  const yTicks = yScale.ticks(5);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Composição Corporal</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: theme.colors.primary },
              ]}
            />
            <Text style={styles.legendText}>Massa Magra</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: theme.colors.warning },
              ]}
            />
            <Text style={styles.legendText}>Massa Gorda</Text>
          </View>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          <G x={padding.left} y={padding.top}>
            {/* Grid horizontal */}
            {yTicks.map((tick) => (
              <Line
                key={`grid-${tick}`}
                x1={0}
                y1={yScale(tick)}
                x2={innerWidth}
                y2={yScale(tick)}
                stroke={theme.colors.border}
                strokeWidth={1}
                opacity={0.2}
              />
            ))}

            {/* Barras empilhadas */}
            {labels.map((label, index) => {
              const x = xScale(label) || 0;
              const barWidth = xScale.bandwidth();
              const leanMassValue = leanMassData[index];
              const fatMassValue = fatMassData[index];
              const totalValue = leanMassValue + fatMassValue;

              const leanHeight = innerHeight - yScale(leanMassValue);
              const fatHeight = innerHeight - yScale(fatMassValue);
              const leanY = yScale(leanMassValue);
              const fatY = yScale(totalValue);

              return (
                <G key={label}>
                  {/* Barra massa magra (base) */}
                  <Rect
                    x={x}
                    y={leanY}
                    width={barWidth}
                    height={leanHeight}
                    fill={theme.colors.primary}
                    opacity={0.8}
                  />
                  {/* Barra massa gorda (empilhada em cima) */}
                  <Rect
                    x={x}
                    y={fatY}
                    width={barWidth}
                    height={fatHeight}
                    fill={theme.colors.warning}
                    opacity={0.8}
                  />
                </G>
              );
            })}

            {/* Eixo Y */}
            <Line
              x1={0}
              y1={0}
              x2={0}
              y2={innerHeight}
              stroke={theme.colors.border}
              strokeWidth={1}
            />

            {/* Labels do eixo Y */}
            {yTicks.map((tick) => (
              <SvgText
                key={`label-y-${tick}`}
                x={-10}
                y={yScale(tick)}
                fontSize={10}
                fill={theme.colors.text}
                textAnchor="end"
                alignmentBaseline="middle"
              >
                {tick.toFixed(1)} kg
              </SvgText>
            ))}

            {/* Eixo X */}
            <Line
              x1={0}
              y1={innerHeight}
              x2={innerWidth}
              y2={innerHeight}
              stroke={theme.colors.border}
              strokeWidth={1}
            />

            {/* Labels do eixo X */}
            {labels.map((label, index) => {
              const x = (xScale(label) || 0) + xScale.bandwidth() / 2;
              return (
                <SvgText
                  key={`label-x-${label}`}
                  x={x}
                  y={innerHeight + 15}
                  fontSize={10}
                  fill={theme.colors.text}
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
              );
            })}
          </G>
        </Svg>
      </View>

      {/* Current Composition Stats */}
      <View style={styles.currentStats}>
        <Text style={styles.sectionTitle}>Composição Atual</Text>
        <View style={styles.statsGrid}>
          {/* Massa Magra */}
          <View style={styles.statBox}>
            <View style={styles.statHeader}>
              <View
                style={[
                  styles.statIndicator,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
              <Text style={styles.statLabel}>Massa Magra</Text>
            </View>
            <Text style={styles.statValue}>
              {latestData.leanMass.toFixed(1)} kg
            </Text>
            <Text style={styles.statPercentage}>{leanPercentage}%</Text>
            {leanMassChange !== 0 && (
              <View style={styles.changeContainer}>
                <Text
                  style={[
                    styles.changeText,
                    {
                      color:
                        leanMassChange > 0
                          ? theme.colors.success
                          : theme.colors.error,
                    },
                  ]}
                >
                  {leanMassChange > 0 ? "+" : ""}
                  {leanMassChange.toFixed(1)} kg
                </Text>
              </View>
            )}
          </View>

          {/* Massa Gorda */}
          <View style={styles.statBox}>
            <View style={styles.statHeader}>
              <View
                style={[
                  styles.statIndicator,
                  { backgroundColor: theme.colors.warning },
                ]}
              />
              <Text style={styles.statLabel}>Massa Gorda</Text>
            </View>
            <Text style={styles.statValue}>
              {latestData.fatMass.toFixed(1)} kg
            </Text>
            <Text style={styles.statPercentage}>{fatPercentage}%</Text>
            {fatMassChange !== 0 && (
              <View style={styles.changeContainer}>
                <Text
                  style={[
                    styles.changeText,
                    {
                      color:
                        fatMassChange < 0
                          ? theme.colors.success
                          : theme.colors.error,
                    },
                  ]}
                >
                  {fatMassChange > 0 ? "+" : ""}
                  {fatMassChange.toFixed(1)} kg
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Water Percentage (if available) */}
        {latestData.waterPercentage && (
          <View style={styles.waterStat}>
            <Text style={styles.waterLabel}>💧 Percentual de Água</Text>
            <Text style={styles.waterValue}>
              {latestData.waterPercentage.toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      ...theme.shadows.md,
      marginBottom: theme.spacing.lg,
    },
    header: {
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    legend: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.md,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    legendText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textSecondary,
    },
    chartContainer: {
      marginVertical: theme.spacing.md,
    },
    currentStats: {
      marginTop: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    statsGrid: {
      flexDirection: "row",
      gap: theme.spacing.md,
    },
    statBox: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
    },
    statHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    statIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statLabel: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textSecondary,
    },
    statValue: {
      fontSize: theme.typography.fontSize.xl,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    statPercentage: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.semibold,
      color: theme.colors.textSecondary,
    },
    changeContainer: {
      marginTop: theme.spacing.xs,
    },
    changeText: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.semibold,
    },
    waterStat: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.info + "10",
      borderRadius: theme.borderRadius.lg,
    },
    waterLabel: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.semibold,
      color: theme.colors.info,
    },
    waterValue: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.info,
    },
    emptyContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing["2xl"],
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.lg,
      ...theme.shadows.sm,
    },
    emptyText: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
  });
