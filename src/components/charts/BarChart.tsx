import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect, Text as SvgText, Line } from "react-native-svg";
import * as d3 from "d3";
import { lightTheme } from "../../theme";

export interface BarDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartProps {
  data: BarDataPoint[];
  width?: number;
  height?: number;
  defaultColor?: string;
  showValues?: boolean;
  showGrid?: boolean;
  formatValue?: (value: number) => string;
}

export function BarChart({
  data,
  width = 350,
  height = 200,
  defaultColor = lightTheme.colors.primary,
  showValues = true,
  showGrid = true,
  formatValue = (v) => v.toFixed(0),
}: BarChartProps) {
  const { bars, yTicks } = useMemo(() => {
    if (!data || data.length === 0) {
      return { bars: [], yTicks: [] };
    }

    // Margens
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 50;
    const marginLeft = 50;

    const innerWidth = width - marginLeft - marginRight;
    const innerHeight = height - marginTop - marginBottom;

    // Escalas
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.3);

    const maxValue = Math.max(...data.map((d) => d.value));
    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([innerHeight, 0]);

    // Barras
    const bars = data.map((d) => ({
      x: (xScale(d.label) || 0) + marginLeft,
      y: yScale(d.value) + marginTop,
      width: xScale.bandwidth(),
      height: innerHeight - yScale(d.value),
      label: d.label,
      value: d.value,
      color: d.color || defaultColor,
    }));

    // Y-axis ticks
    const yTicks = yScale.ticks(5).map((tick) => ({
      value: tick,
      y: yScale(tick) + marginTop,
    }));

    return { bars, yTicks };
  }, [data, width, height, defaultColor]);

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.emptyText}>Sem dados para exibir</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        {yTicks.map((tick, index) => (
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

        {/* Barras */}
        {bars.map((bar, index) => (
          <React.Fragment key={`bar-${index}`}>
            <Rect
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              fill={bar.color}
              rx={4}
            />

            {/* Labels de valor */}
            {showValues && (
              <SvgText
                x={bar.x + bar.width / 2}
                y={bar.y - 5}
                fontSize="12"
                fontWeight="600"
                fill={lightTheme.colors.gray[700]}
                textAnchor="middle"
              >
                {formatValue(bar.value)}
              </SvgText>
            )}

            {/* Labels do eixo X */}
            <SvgText
              x={bar.x + bar.width / 2}
              y={height - 20}
              fontSize="11"
              fill={lightTheme.colors.gray[600]}
              textAnchor="middle"
            >
              {bar.label}
            </SvgText>
          </React.Fragment>
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
});
