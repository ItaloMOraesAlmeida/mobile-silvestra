import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle, Text as SvgText } from "react-native-svg";
import * as d3 from "d3";
import { lightTheme } from "../../theme";

export interface PieDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  data: PieDataPoint[];
  width?: number;
  height?: number;
  showLabels?: boolean;
  showPercentages?: boolean;
  innerRadius?: number; // Para donut chart
  colors?: string[];
}

export function PieChart({
  data,
  width = 200,
  height = 200,
  showLabels = true,
  showPercentages = true,
  innerRadius = 0,
  colors = [
    lightTheme.colors.primary,
    lightTheme.colors.success,
    lightTheme.colors.warning,
    lightTheme.colors.error,
    lightTheme.colors.info,
  ],
}: PieChartProps) {
  const { slices } = useMemo(() => {
    if (!data || data.length === 0) {
      return { slices: [] };
    }

    const total = data.reduce((sum, d) => sum + d.value, 0);
    const radius = Math.min(width, height) / 2 - 40;
    const centerX = width / 2;
    const centerY = height / 2;

    const pie = d3
      .pie<PieDataPoint>()
      .value((d) => d.value)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<PieDataPoint>>()
      .innerRadius(innerRadius)
      .outerRadius(radius);

    const labelArc = d3
      .arc<d3.PieArcDatum<PieDataPoint>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius * 0.6);

    const slices = pie(data).map((d, index) => {
      const pathData = arc(d) || "";
      const [labelX, labelY] = labelArc.centroid(d);
      const percentage = ((d.value / total) * 100).toFixed(1);

      return {
        path: pathData,
        color: d.data.color || colors[index % colors.length],
        label: d.data.label,
        value: d.value,
        percentage,
        labelX: centerX + labelX,
        labelY: centerY + labelY,
      };
    });

    return { slices };
  }, [data, width, height, innerRadius, colors]);

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.emptyText}>Sem dados para exibir</Text>
      </View>
    );
  }

  const centerX = width / 2;
  const centerY = height / 2;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        <Circle
          cx={centerX}
          cy={centerY}
          r={Math.min(width, height) / 2 - 40}
          fill="transparent"
        />

        {slices.map((slice, index) => (
          <React.Fragment key={`slice-${index}`}>
            {/* Slice */}
            <Path
              d={slice.path}
              fill={slice.color}
              transform={`translate(${centerX}, ${centerY})`}
            />

            {/* Percentage labels */}
            {showPercentages && parseFloat(slice.percentage) > 5 && (
              <SvgText
                x={slice.labelX}
                y={slice.labelY}
                fontSize="14"
                fontWeight="600"
                fill={lightTheme.colors.white}
                textAnchor="middle"
              >
                {slice.percentage}%
              </SvgText>
            )}
          </React.Fragment>
        ))}
      </Svg>

      {/* Legend */}
      {showLabels && (
        <View style={styles.legend}>
          {slices.map((slice, index) => (
            <View key={`legend-${index}`} style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: slice.color }]}
              />
              <Text style={styles.legendLabel}>
                {slice.label} ({slice.percentage}%)
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.md,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: lightTheme.colors.gray[400],
    fontSize: lightTheme.typography.fontSize.sm,
  },
  legend: {
    marginTop: lightTheme.spacing.lg,
    gap: lightTheme.spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.sm,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: lightTheme.borderRadius.xs,
  },
  legendLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[700],
  },
});
