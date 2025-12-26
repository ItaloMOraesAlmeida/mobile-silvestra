import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, {
  Path,
  Line,
  Text as SvgText,
  G,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import { scaleLinear } from "d3-scale";
import { max } from "d3-array";
import { line, area, curveMonotoneX } from "d3-shape";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { HistoryItem } from "../../types/water";
import { useTheme } from "../../theme/ThemeContext";

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 40;
const CHART_HEIGHT = 250;
const PADDING = { top: 20, right: 20, bottom: 60, left: 50 };

interface WaterTrendChartProps {
  data: HistoryItem[];
}

export default function WaterTrendChart({ data }: WaterTrendChartProps) {
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
  const chartData = data.map((item, index) => ({
    x: index,
    y: item.consumed,
    label: format(new Date(item.date), "dd/MM", { locale: ptBR }),
  }));

  // Calcular média
  const average = Math.round(
    data.reduce((sum, item) => sum + item.consumed, 0) / data.length
  );

  // Linha de meta (pegar a meta mais recente)
  const goalLine = data.length > 0 ? data[data.length - 1].goal : 2000;

  // Configurar escalas D3
  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const xScale = scaleLinear()
    .domain([0, chartData.length - 1])
    .range([0, innerWidth]);

  const maxValue = max(chartData, (d) => d.y) || 0;

  const yScale = scaleLinear()
    .domain([0, Math.max(maxValue, goalLine)])
    .range([innerHeight, 0])
    .nice();

  const yTicks = yScale.ticks(5);

  // Criar linha D3
  const lineGenerator = line<(typeof chartData)[0]>()
    .x((d) => xScale(d.x))
    .y((d) => yScale(d.y))
    .curve(curveMonotoneX);

  // Criar área D3
  const areaGenerator = area<(typeof chartData)[0]>()
    .x((d) => xScale(d.x))
    .y0(innerHeight)
    .y1((d) => yScale(d.y))
    .curve(curveMonotoneX);

  const linePath = lineGenerator(chartData) || "";
  const areaPath = areaGenerator(chartData) || "";

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Tendência de Consumo
        </Text>
        <View style={styles.stats}>
          <Text
            style={[styles.statLabel, { color: theme.colors.textSecondary }]}
          >
            Média:{" "}
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {average.toLocaleString("pt-BR")}ml
          </Text>
        </View>
      </View>

      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0%"
              stopColor={theme.colors.primary}
              stopOpacity="0.3"
            />
            <Stop
              offset="100%"
              stopColor={theme.colors.primary}
              stopOpacity="0.05"
            />
          </LinearGradient>
        </Defs>

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

          {/* X Axis Labels */}
          {chartData.map((item, index) => {
            // Mostrar apenas alguns labels para evitar sobreposição
            const shouldShowLabel =
              chartData.length <= 7 ||
              index % Math.ceil(chartData.length / 7) === 0;
            if (!shouldShowLabel) return null;

            return (
              <SvgText
                key={`x-label-${index}`}
                x={xScale(item.x)}
                y={innerHeight + 15}
                fontSize={10}
                fill={theme.colors.textSecondary}
                textAnchor="middle"
                rotation="-45"
                origin={`${xScale(item.x)}, ${innerHeight + 15}`}
              >
                {item.label}
              </SvgText>
            );
          })}

          {/* Goal line (dashed) */}
          <Line
            x1={0}
            y1={yScale(goalLine)}
            x2={innerWidth}
            y2={yScale(goalLine)}
            stroke="#4CAF50"
            strokeWidth={2}
            strokeDasharray="5,5"
          />

          {/* Area under curve */}
          <Path d={areaPath} fill="url(#areaGradient)" />

          {/* Line */}
          <Path
            d={linePath}
            stroke={theme.colors.primary}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendLine,
              { backgroundColor: theme.colors.primary },
            ]}
          />
          <Text
            style={[styles.legendText, { color: theme.colors.textSecondary }]}
          >
            Consumo diário
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendLine,
              { backgroundColor: "#4CAF50" },
              styles.legendLineDashed,
            ]}
          />
          <Text
            style={[styles.legendText, { color: theme.colors.textSecondary }]}
          >
            Meta diária
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "bold",
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
  legendLine: {
    width: 24,
    height: 3,
    borderRadius: 2,
  },
  legendLineDashed: {
    opacity: 0.6,
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
