import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle, Line, Text as SvgText } from "react-native-svg";
import * as d3 from "d3";
import { lightTheme } from "../../theme";

export interface DataPoint {
  date: Date;
  value: number;
  label?: string;
}

export interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
  showGrid?: boolean;
  showLabels?: boolean;
  yAxisLabel?: string;
  formatValue?: (value: number) => string;
}

export function LineChart({
  data,
  width = 350,
  height = 200,
  color = lightTheme.colors.primary,
  showDots = true,
  showGrid = true,
  showLabels = true,
  yAxisLabel,
  formatValue = (v) => v.toFixed(1),
}: LineChartProps) {
  const { path, points, yTicks } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        path: "",
        points: [],
        yTicks: [],
      };
    }

    // Margens
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 30;
    const marginLeft = 50;

    const innerWidth = width - marginLeft - marginRight;
    const innerHeight = height - marginTop - marginBottom;

    // Escalas
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([
        Math.min(...data.map((d) => d.value)) * 0.9,
        Math.max(...data.map((d) => d.value)) * 1.1,
      ])
      .range([innerHeight, 0]);

    // Gerar linha
    const line = d3
      .line<DataPoint>()
      .x((d) => xScale(d.date) + marginLeft)
      .y((d) => yScale(d.value) + marginTop)
      .curve(d3.curveMonotoneX);

    const pathData = line(data) || "";

    // Pontos
    const points = data.map((d) => ({
      x: xScale(d.date) + marginLeft,
      y: yScale(d.value) + marginTop,
      value: d.value,
      label: d.label,
    }));

    // Y-axis ticks
    const yTicks = yScale.ticks(5).map((tick) => ({
      value: tick,
      y: yScale(tick) + marginTop,
    }));

    return {
      path: pathData,
      points,
      xScale,
      yScale,
      yTicks,
    };
  }, [data, width, height]);

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.emptyText}>Sem dados para exibir</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {yAxisLabel && <Text style={styles.yAxisLabel}>{yAxisLabel}</Text>}
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {showGrid &&
          yTicks.map((tick, index) => (
            <Line
              key={`grid-${index}`}
              x1={50}
              y1={tick.y}
              x2={width - 20}
              y2={tick.y}
              stroke={lightTheme.colors.gray[200]}
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          ))}

        {/* Y-axis labels */}
        {showLabels &&
          yTicks.map((tick, index) => (
            <SvgText
              key={`label-${index}`}
              x={45}
              y={tick.y + 4}
              fontSize="10"
              fill={lightTheme.colors.gray[500]}
              textAnchor="end"
            >
              {formatValue(tick.value)}
            </SvgText>
          ))}

        {/* Linha principal */}
        <Path
          d={path}
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pontos */}
        {showDots &&
          points.map((point, index) => (
            <Circle
              key={`point-${index}`}
              cx={point.x}
              cy={point.y}
              r="5"
              fill={color}
              stroke={lightTheme.colors.white}
              strokeWidth="2"
            />
          ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.md,
  },
  emptyText: {
    textAlign: "center",
    color: lightTheme.colors.gray[400],
    fontSize: lightTheme.typography.fontSize.sm,
  },
  yAxisLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
  },
});
