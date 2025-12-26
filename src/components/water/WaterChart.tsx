import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Rect, Line, Text as SvgText, G } from "react-native-svg";
import { scaleLinear, scaleBand } from "d3-scale";
import { max } from "d3-array";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { HistoryItem } from "../../types/water";
import { useTheme } from "../../theme/ThemeContext";

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 40;
const CHART_HEIGHT = 250;
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };

interface WaterChartProps {
  data: HistoryItem[];
  type: "bar" | "line";
}

export default function WaterChart({ data, type }: WaterChartProps) {
  const { theme } = useTheme();

  if (data.length === 0) {
    return (
      <View
        style={[styles.emptyContainer, { backgroundColor: theme.colors.card }]}
      >
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          Sem dados para exibir
        </Text>
      </View>
    );
  }

  // Preparar dados para o gráfico
  const chartData = data.map((item) => ({
    label: format(new Date(item.date), "dd/MM", { locale: ptBR }),
    value: item.consumed,
    achieved: item.achieved,
  }));

  // Configurar escalas D3
  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const xScale = scaleBand()
    .domain(chartData.map((d) => d.label))
    .range([0, innerWidth])
    .padding(0.3);

  const yScale = scaleLinear()
    .domain([0, max(chartData, (d) => d.value) || 0])
    .range([innerHeight, 0])
    .nice();

  const yTicks = yScale.ticks(5);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Consumo Diário
      </Text>

      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <G x={PADDING.left} y={PADDING.top}>
          {/* Grid lines */}
          {yTicks.map((tick) => (
            <Line
              key={`grid-${tick}`}
              x1={0}
              y1={yScale(tick)}
              x2={innerWidth}
              y2={yScale(tick)}
              stroke={theme.colors.background}
              strokeWidth={1}
            />
          ))}

          {/* Y Axis */}
          <Line
            x1={0}
            y1={0}
            x2={0}
            y2={innerHeight}
            stroke={theme.colors.textSecondary}
            strokeWidth={1}
          />

          {/* X Axis */}
          <Line
            x1={0}
            y1={innerHeight}
            x2={innerWidth}
            y2={innerHeight}
            stroke={theme.colors.textSecondary}
            strokeWidth={1}
          />

          {/* Y Axis Labels */}
          {yTicks.map((tick) => (
            <SvgText
              key={`y-label-${tick}`}
              x={-8}
              y={yScale(tick)}
              fontSize={10}
              fill={theme.colors.textSecondary}
              textAnchor="end"
              alignmentBaseline="middle"
            >
              {tick}
            </SvgText>
          ))}

          {/* Bars */}
          {chartData.map((item) => {
            const barHeight = innerHeight - yScale(item.value);
            const barWidth = xScale.bandwidth();
            const x = xScale(item.label) || 0;
            const y = yScale(item.value);

            return (
              <G key={item.label}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={item.achieved ? "#4CAF50" : theme.colors.primary}
                  rx={4}
                  ry={4}
                />
                {/* X Axis Labels */}
                <SvgText
                  x={x + barWidth / 2}
                  y={innerHeight + 15}
                  fontSize={10}
                  fill={theme.colors.textSecondary}
                  textAnchor="middle"
                >
                  {item.label}
                </SvgText>
              </G>
            );
          })}
        </G>
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: theme.colors.primary },
            ]}
          />
          <Text
            style={[styles.legendText, { color: theme.colors.textSecondary }]}
          >
            Abaixo da meta
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#4CAF50" }]} />
          <Text
            style={[styles.legendText, { color: theme.colors.textSecondary }]}
          >
            Meta alcançada
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
  },
  emptyContainer: {
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
  },
});
