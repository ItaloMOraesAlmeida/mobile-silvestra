/**
 * NutrientChart - Gráfico Circular de Macronutrientes
 * Sprint 7 - Silvestra App
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { FoodNutrientPercentages } from "../types/food.types";
import { lightTheme } from "../theme";

interface NutrientChartProps {
  percentages: FoodNutrientPercentages;
  size?: number;
  strokeWidth?: number;
}

interface CircularProgressProps {
  percentage: number;
  color: string;
  offset: number;
  size: number;
  strokeWidth: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  color,
  offset,
  size,
  strokeWidth,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Circle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      stroke={color}
      strokeWidth={strokeWidth}
      fill="transparent"
      strokeDasharray={strokeDasharray}
      strokeDashoffset={strokeDashoffset}
      strokeLinecap="round"
      rotation={-90 + offset}
      origin={`${size / 2}, ${size / 2}`}
    />
  );
};

export default function NutrientChart({
  percentages,
  size = 200,
  strokeWidth = 20,
}: NutrientChartProps) {
  const { proteinPercent, carbsPercent, lipidsPercent, fiberPercent } =
    percentages;

  // Cores dos macronutrientes
  const colors = {
    protein: "#10B981", // Green
    carbs: "#3B82F6", // Blue
    lipids: "#F59E0B", // Orange
    fiber: "#8B5CF6", // Purple
  };

  // Calcular offsets acumulados para empilhar os círculos
  let currentOffset = 0;
  const proteinOffset = currentOffset;
  currentOffset += (proteinPercent / 100) * 360;

  const carbsOffset = currentOffset;
  currentOffset += (carbsPercent / 100) * 360;

  const lipidsOffset = currentOffset;
  currentOffset += (lipidsPercent / 100) * 360;

  const fiberOffset = currentOffset;

  // Calcular total e garantir que seja 100% (arredondamento)
  const rawTotal = proteinPercent + carbsPercent + lipidsPercent + fiberPercent;
  const total = Math.min(Math.round(rawTotal * 10) / 10, 100);

  return (
    <View style={styles.container}>
      {/* Gráfico Circular */}
      <View style={[styles.chartContainer, { width: size, height: size }]}>
        {/* Background Circle */}
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={(size - strokeWidth) / 2}
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Proteínas */}
          {proteinPercent > 0 && (
            <CircularProgress
              percentage={proteinPercent}
              color={colors.protein}
              offset={proteinOffset}
              size={size}
              strokeWidth={strokeWidth}
            />
          )}

          {/* Carboidratos */}
          {carbsPercent > 0 && (
            <CircularProgress
              percentage={carbsPercent}
              color={colors.carbs}
              offset={carbsOffset}
              size={size}
              strokeWidth={strokeWidth}
            />
          )}

          {/* Lipídeos */}
          {lipidsPercent > 0 && (
            <CircularProgress
              percentage={lipidsPercent}
              color={colors.lipids}
              offset={lipidsOffset}
              size={size}
              strokeWidth={strokeWidth}
            />
          )}

          {/* Fibras */}
          {fiberPercent > 0 && (
            <CircularProgress
              percentage={fiberPercent}
              color={colors.fiber}
              offset={fiberOffset}
              size={size}
              strokeWidth={strokeWidth}
            />
          )}
        </Svg>

        {/* Total no Centro */}
        <View style={styles.centerContainer}>
          <Text style={styles.totalValue}>
            {total === 100 ? "100%" : `${total.toFixed(1)}%`}
          </Text>
          <Text style={styles.totalLabel}>Total</Text>
        </View>
      </View>

      {/* Legenda */}
      <View style={styles.legendContainer}>
        <View style={styles.legendRow}>
          {/* Proteínas */}
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: colors.protein }]}
            />
            <Text style={styles.legendText}>
              Proteínas {proteinPercent.toFixed(1)}%
            </Text>
          </View>

          {/* Carboidratos */}
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: colors.carbs }]}
            />
            <Text style={styles.legendText}>
              Carbos {carbsPercent.toFixed(1)}%
            </Text>
          </View>

          {/* Lipídeos */}
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: colors.lipids }]}
            />
            <Text style={styles.legendText}>
              Gorduras {lipidsPercent.toFixed(1)}%
            </Text>
          </View>

          {/* Fibras */}
          {fiberPercent > 0 && (
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: colors.fiber }]}
              />
              <Text style={styles.legendText}>
                Fibras {fiberPercent.toFixed(1)}%
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  chartContainer: {
    position: "relative",
  },
  centerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  totalValue: {
    fontSize: lightTheme.typography.fontSize["3xl"],
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
  },
  totalLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginTop: lightTheme.spacing[1],
  },
  legendContainer: {
    marginTop: lightTheme.spacing[6],
    width: "100%",
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[2],
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: lightTheme.spacing[2],
  },
  legendText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[700],
  },
});
