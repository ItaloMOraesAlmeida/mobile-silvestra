import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { G, Path, Circle, Line, Text as SvgText } from "react-native-svg";
import { scaleLinear, scalePoint } from "d3-scale";
import { line, curveMonotoneX } from "d3-shape";
import { max, min } from "d3-array";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import type { Theme } from "../../theme";

const screenWidth = Dimensions.get("window").width;

export interface WeightDataPoint {
  date: string; // ISO date string
  weight: number;
  goal?: number;
  bmi?: number;
}

interface WeightEvolutionChartProps {
  data: WeightDataPoint[];
  showGoal?: boolean;
  showBMI?: boolean;
}

/**
 * WeightEvolutionChart Component
 *
 * Gráfico de linha mostrando a evolução do peso ao longo do tempo
 *
 * Features:
 * - Linha principal: peso atual
 * - Linha tracejada: peso meta (opcional)
 * - Segunda série: IMC (opcional)
 * - Suporte a zoom/scroll para muitos pontos
 * - Formatação de datas inteligente
 */
export const WeightEvolutionChart: React.FC<WeightEvolutionChartProps> = ({
  data,
  showGoal = true,
  showBMI = false,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();

  // Se não há dados
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Nenhum dado de peso registrado ainda
        </Text>
      </View>
    );
  }

  // Formatar labels de data (mostrar só alguns para evitar congestionamento)
  const formatDateLabel = (dateStr: string, index: number) => {
    const date = new Date(dateStr);
    const totalPoints = data.length;

    // Mostrar menos labels se houver muitos pontos
    if (totalPoints > 12) {
      // Mostrar apenas a cada 3 pontos
      if (index % 3 !== 0 && index !== totalPoints - 1) {
        return "";
      }
    }

    const month = date.toLocaleDateString("pt-BR", { month: "short" });
    const day = date.getDate();
    return `${day} ${month}`;
  };

  // Preparar dados para o gráfico
  const labels = data.map((point, index) => formatDateLabel(point.date, index));
  const weights = data.map((point) => point.weight);
  const goals = showGoal ? data.map((point) => point.goal || 0) : [];
  const bmis = showBMI ? data.map((point) => point.bmi || 0) : [];

  // Calcular valores min/max para melhor visualização
  const allValues = [...weights];
  if (showGoal && goals.length > 0)
    allValues.push(...goals.filter((g) => g > 0));
  if (showBMI && bmis.length > 0) allValues.push(...bmis.filter((b) => b > 0));

  const minValue = min(allValues) || 0;
  const maxValue = max(allValues) || 100;
  const padding = (maxValue - minValue) * 0.1;

  // Configurar gráfico D3
  const chartWidth = screenWidth - 32;
  const chartHeight = 220;
  const chartPadding = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  // Escalas
  const xScale = scalePoint()
    .domain(labels.map((_, i) => i.toString()))
    .range([0, innerWidth]);

  const yScale = scaleLinear()
    .domain([minValue - padding, maxValue + padding])
    .range([innerHeight, 0])
    .nice();

  const yTicks = yScale.ticks(4);

  // Geradores de linha D3
  const lineGenerator = line<number>()
    .x((_, i) => xScale(i.toString()) || 0)
    .y((d) => yScale(d))
    .curve(curveMonotoneX);

  const weightPath = lineGenerator(weights);
  const goalPath =
    showGoal && goals.some((g) => g > 0)
      ? lineGenerator(
          goals.filter((g) => g > 0).length === goals.length
            ? goals
            : weights.map((_, i) => goals[i] || 0)
        )
      : null;
  const bmiPath =
    showBMI && bmis.some((b) => b > 0)
      ? lineGenerator(
          bmis.filter((b) => b > 0).length === bmis.length
            ? bmis
            : weights.map((_, i) => bmis[i] || 0)
        )
      : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Evolução de Peso</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: theme.colors.primary },
              ]}
            />
            <Text style={styles.legendText}>Peso Atual</Text>
          </View>
          {showGoal && goals.some((g) => g > 0) && (
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: theme.colors.success },
                ]}
              />
              <Text style={styles.legendText}>Meta</Text>
            </View>
          )}
          {showBMI && bmis.some((b) => b > 0) && (
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: theme.colors.warning },
                ]}
              />
              <Text style={styles.legendText}>IMC</Text>
            </View>
          )}
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          <G x={chartPadding.left} y={chartPadding.top}>
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

            {/* Linha de peso atual */}
            {weightPath && (
              <Path
                d={weightPath}
                stroke={theme.colors.primary}
                strokeWidth={3}
                fill="none"
              />
            )}

            {/* Linha de meta (tracejada) */}
            {goalPath && (
              <Path
                d={goalPath}
                stroke={theme.colors.success}
                strokeWidth={2}
                fill="none"
                strokeDasharray="5,5"
              />
            )}

            {/* Linha de IMC */}
            {bmiPath && (
              <Path
                d={bmiPath}
                stroke={theme.colors.warning}
                strokeWidth={2}
                fill="none"
              />
            )}

            {/* Pontos do peso atual */}
            {weights.map((weight, index) => {
              const x = xScale(index.toString()) || 0;
              const y = yScale(weight);
              return (
                <Circle
                  key={`dot-${index}`}
                  cx={x}
                  cy={y}
                  r={4}
                  fill={theme.colors.primary}
                  stroke={theme.colors.card}
                  strokeWidth={2}
                />
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
              if (!label) return null;
              const x = xScale(index.toString()) || 0;
              return (
                <SvgText
                  key={`label-x-${index}`}
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

      {/* Stats Summary */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Inicial</Text>
          <Text style={styles.statValue}>{weights[0].toFixed(1)} kg</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Atual</Text>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {weights[weights.length - 1].toFixed(1)} kg
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Variação</Text>
          <Text
            style={[
              styles.statValue,
              {
                color:
                  weights[weights.length - 1] < weights[0]
                    ? theme.colors.success
                    : theme.colors.error,
              },
            ]}
          >
            {(weights[weights.length - 1] - weights[0]).toFixed(1)} kg
          </Text>
        </View>
        {showGoal && goals.some((g) => g > 0) && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Meta</Text>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>
              {goals.find((g) => g > 0)?.toFixed(1)} kg
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
    stats: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    statItem: {
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    statLabel: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textSecondary,
      textTransform: "uppercase",
    },
    statValue: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text,
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
