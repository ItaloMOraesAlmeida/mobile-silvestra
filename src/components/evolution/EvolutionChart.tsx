/**
 * EvolutionChart Component
 *
 * Gráfico de linha genérico para exibir evolução de métricas ao longo do tempo.
 * Baseado no WeightEvolutionChart mas mais flexível e reutilizável.
 *
 * Features:
 * - Suporta múltiplas séries de dados
 * - Formatação customizável de valores e datas
 * - Cores temáticas
 * - Estados de loading e empty
 * - Scroll horizontal para muitos pontos
 * - Tooltips nos pontos
 *
 * Usado para: Peso, IMC, Gordura, Massa Magra, Circunferências, etc.
 */

import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import Svg, { G, Path, Circle, Line, Text as SvgText } from "react-native-svg";
import { scaleLinear, scalePoint } from "d3-scale";
import { line, curveMonotoneX } from "d3-shape";
import { max, min } from "d3-array";
import { lightTheme } from "../../theme";

const screenWidth = Dimensions.get("window").width;

export interface ChartDataPoint {
  date: string; // ISO date string
  value: number;
}

export interface EvolutionChartProps {
  // Dados
  data: ChartDataPoint[];
  label: string;
  unit: string;

  // Customização visual
  color?: string;
  height?: number;
  showDots?: boolean;
  bezier?: boolean;

  // Formatação
  formatValue?: (value: number) => string;
  formatDate?: (date: string) => string;
  decimals?: number;

  // Estados
  loading?: boolean;
  error?: string | null;
}

export const EvolutionChart: React.FC<EvolutionChartProps> = ({
  data,
  label,
  unit,
  color,
  height = 220,
  showDots = true,
  bezier = true,
  formatValue,
  formatDate,
  decimals = 1,
  loading = false,
  error = null,
}) => {
  const styles = createStyles(lightTheme);

  const chartColor = color || lightTheme.colors.primary;

  // Processar dados para o gráfico
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Ordenar por data
    const sortedData = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Extrair valores
    const values = sortedData.map((point) => point.value);

    // Formatar labels (datas)
    const labels = sortedData.map((point) => {
      if (formatDate) {
        return formatDate(point.date);
      }
      // Formatação padrão: dia/mês
      const date = new Date(point.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    return {
      labels,
      datasets: [
        {
          data: values,
          color: () => chartColor,
          strokeWidth: 2,
        },
      ],
    };
  }, [data, formatDate, chartColor]);

  // Estado de loading
  if (loading) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={lightTheme.colors.primary} />
          <Text style={styles.loadingText}>Carregando gráfico...</Text>
        </View>
      </View>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  // Sem dados
  if (!chartData || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Nenhum dado disponível para este período
          </Text>
        </View>
      </View>
    );
  }

  // Poucos dados (menos de 2 pontos)
  if (data.length < 2) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Pelo menos 2 medições são necessárias para gerar o gráfico
          </Text>
          <Text style={styles.currentValue}>
            Valor atual: {data[0].value.toFixed(decimals)} {unit}
          </Text>
        </View>
      </View>
    );
  }

  // Configurar gráfico D3
  const chartWidth = screenWidth - 32;
  const chartHeight = height - 60;
  const chartPadding = { top: 20, right: 20, bottom: 30, left: 50 };
  const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  const values = chartData.datasets[0].data;
  const labels = chartData.labels;

  // Escalas
  const xScale = scalePoint()
    .domain(labels.map((_, i) => i.toString()))
    .range([0, innerWidth]);

  const minValue = min(values) || 0;
  const maxValue = max(values) || 100;
  const padding = (maxValue - minValue) * 0.1;

  const yScale = scaleLinear()
    .domain([minValue - padding, maxValue + padding])
    .range([innerHeight, 0])
    .nice();

  const yTicks = yScale.ticks(4);

  // Gerador de linha D3
  const lineGenerator = line<number>()
    .x((_, i) => xScale(i.toString()) || 0)
    .y((d) => yScale(d));

  if (bezier) {
    lineGenerator.curve(curveMonotoneX);
  }

  const linePath = lineGenerator(values);

  return (
    <View style={styles.container}>
      {/* Header com label */}
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.dataPoints}>
          {data.length} {data.length === 1 ? "medição" : "medições"}
        </Text>
      </View>

      {/* Gráfico */}
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
                stroke={lightTheme.colors.border}
                strokeWidth={1}
                opacity={0.2}
              />
            ))}

            {/* Linha de evolução */}
            {linePath && (
              <Path
                d={linePath}
                stroke={chartColor}
                strokeWidth={2}
                fill="none"
              />
            )}

            {/* Pontos */}
            {showDots &&
              values.map((value, index) => {
                const x = xScale(index.toString()) || 0;
                const y = yScale(value);
                return (
                  <Circle
                    key={`dot-${index}`}
                    cx={x}
                    cy={y}
                    r={4}
                    fill={chartColor}
                    stroke={lightTheme.colors.card}
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
              stroke={lightTheme.colors.border}
              strokeWidth={1}
            />

            {/* Labels do eixo Y */}
            {yTicks.map((tick) => {
              const formattedValue = formatValue
                ? formatValue(tick)
                : tick.toFixed(decimals);
              return (
                <SvgText
                  key={`label-y-${tick}`}
                  x={-10}
                  y={yScale(tick)}
                  fontSize={10}
                  fill={lightTheme.colors.text}
                  textAnchor="end"
                  alignmentBaseline="middle"
                >
                  {formattedValue} {unit}
                </SvgText>
              );
            })}

            {/* Eixo X */}
            <Line
              x1={0}
              y1={innerHeight}
              x2={innerWidth}
              y2={innerHeight}
              stroke={lightTheme.colors.border}
              strokeWidth={1}
            />

            {/* Labels do eixo X */}
            {labels.map((label, index) => {
              const x = xScale(index.toString()) || 0;
              return (
                <SvgText
                  key={`label-x-${index}`}
                  x={x}
                  y={innerHeight + 15}
                  fontSize={10}
                  fill={lightTheme.colors.text}
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
              );
            })}
          </G>
        </Svg>
      </View>

      {/* Estatísticas rápidas */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Mínimo</Text>
          <Text style={styles.statValue}>
            {Math.min(...chartData.datasets[0].data).toFixed(decimals)} {unit}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Máximo</Text>
          <Text style={styles.statValue}>
            {Math.max(...chartData.datasets[0].data).toFixed(decimals)} {unit}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Variação</Text>
          <Text style={styles.statValue}>
            {(
              Math.max(...chartData.datasets[0].data) -
              Math.min(...chartData.datasets[0].data)
            ).toFixed(decimals)}{" "}
            {unit}
          </Text>
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: typeof lightTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      // Sombra
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },

    label: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
    },

    dataPoints: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },

    chartContainer: {
      marginVertical: 8,
    },

    stats: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },

    statItem: {
      alignItems: "center",
      flex: 1,
    },

    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },

    statValue: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
    },

    statDivider: {
      width: 1,
      backgroundColor: theme.colors.border,
      marginHorizontal: 8,
    },

    // Estados
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 150,
    },

    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },

    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 150,
    },

    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      textAlign: "center",
    },

    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 150,
    },

    emptyText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: "center",
      marginBottom: 8,
    },

    currentValue: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
      marginTop: 8,
    },
  });
