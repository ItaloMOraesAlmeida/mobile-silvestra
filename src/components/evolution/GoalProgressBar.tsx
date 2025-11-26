/**
 * GoalProgressBar Component
 *
 * Barra de progresso horizontal com marcadores visuais para metas.
 * Ideal para visualizar progressão de peso, medidas, etc.
 *
 * Features:
 * - Barra preenchida com gradiente
 * - Marcadores de início, atual e meta
 * - Labels customizáveis
 * - Indicador de direção (ganho/perda)
 * - Cores por status (em progresso, atingida, ultrapassada)
 * - Animação suave
 *
 * Visual:
 * [Início]========●=========[Meta]
 *                 ↑
 *              Atual
 */

import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";

export interface GoalProgressBarProps {
  // Valores
  initialValue: number;
  currentValue: number;
  targetValue: number;
  unit: string;

  // Labels
  label?: string;
  showLabels?: boolean;
  showValues?: boolean;

  // Visual
  height?: number;
  color?: string;
  animated?: boolean;

  // Formatação
  decimals?: number;
  formatValue?: (value: number) => string;
}

export const GoalProgressBar: React.FC<GoalProgressBarProps> = ({
  initialValue,
  currentValue,
  targetValue,
  unit,
  label,
  showLabels = true,
  showValues = true,
  height = 12,
  color,
  animated = true,
  decimals = 1,
  formatValue,
}) => {
  const styles = createStyles(lightTheme, height, color);

  // Calcular progresso (0-100%)
  const totalRange = Math.abs(targetValue - initialValue);
  const currentProgress = Math.abs(currentValue - initialValue);
  const progressPercent =
    totalRange > 0 ? (currentProgress / totalRange) * 100 : 0;

  // Limitar entre 0 e 100
  const clampedProgress = Math.max(0, Math.min(100, progressPercent));

  // Determinar status
  const status = getProgressStatus(initialValue, currentValue, targetValue);

  // Cor baseada no status
  const barColor =
    color ||
    (status === "completed"
      ? lightTheme.colors.success
      : status === "exceeded"
      ? lightTheme.colors.warning
      : lightTheme.colors.primary);

  // Animação
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: clampedProgress,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(clampedProgress);
    }
  }, [clampedProgress, animated, animatedWidth]);

  // Interpolação para largura
  const progressWidth = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  // Formatação de valores
  const formatVal = (value: number) => {
    if (formatValue) return formatValue(value);
    return value.toFixed(decimals);
  };

  // Direção da meta (ganho ou perda)
  const isGainGoal = targetValue > initialValue;
  const directionIcon = isGainGoal ? "arrow-up" : "arrow-down";

  return (
    <View style={styles.container}>
      {/* Label superior */}
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Valores superiores */}
      {showValues && (
        <View style={styles.valuesContainer}>
          <View style={styles.valueItem}>
            <Text style={styles.valueLabel}>Inicial</Text>
            <Text style={styles.valueText}>
              {formatVal(initialValue)} {unit}
            </Text>
          </View>

          <View style={[styles.valueItem, styles.currentValue]}>
            <Ionicons
              name={directionIcon}
              size={14}
              color={barColor}
              style={styles.directionIcon}
            />
            <View>
              <Text style={styles.valueLabel}>Atual</Text>
              <Text style={[styles.valueText, { color: barColor }]}>
                {formatVal(currentValue)} {unit}
              </Text>
            </View>
          </View>

          <View style={[styles.valueItem, styles.alignRight]}>
            <Text style={styles.valueLabel}>Meta</Text>
            <Text style={styles.valueText}>
              {formatVal(targetValue)} {unit}
            </Text>
          </View>
        </View>
      )}

      {/* Barra de progresso */}
      <View style={styles.barContainer}>
        {/* Background da barra */}
        <View style={styles.barBackground}>
          {/* Preenchimento animado */}
          <Animated.View
            style={[
              styles.barFill,
              {
                width: progressWidth,
                backgroundColor: barColor,
              },
            ]}
          />
        </View>

        {/* Marcador de posição atual */}
        <View
          style={[
            styles.currentMarker,
            {
              left: `${clampedProgress}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>

      {/* Labels inferiores (se showLabels) */}
      {showLabels && (
        <View style={styles.labelsContainer}>
          <Text style={styles.labelText}>Início</Text>
          <Text style={styles.labelText}>
            {Math.round(clampedProgress)}% concluído
          </Text>
          <Text style={styles.labelText}>Meta</Text>
        </View>
      )}

      {/* Status */}
      {status === "completed" && (
        <View style={styles.statusContainer}>
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={lightTheme.colors.success}
          />
          <Text
            style={[styles.statusText, { color: lightTheme.colors.success }]}
          >
            Meta atingida!
          </Text>
        </View>
      )}
      {status === "exceeded" && (
        <View style={styles.statusContainer}>
          <Ionicons
            name="alert-circle"
            size={16}
            color={lightTheme.colors.warning}
          />
          <Text
            style={[styles.statusText, { color: lightTheme.colors.warning }]}
          >
            Meta ultrapassada
          </Text>
        </View>
      )}
    </View>
  );
};

// Determinar status do progresso
const getProgressStatus = (
  initial: number,
  current: number,
  target: number
): "in-progress" | "completed" | "exceeded" => {
  const isGainGoal = target > initial;

  if (isGainGoal) {
    if (current >= target) return "completed";
    if (current > target) return "exceeded";
  } else {
    if (current <= target) return "completed";
    if (current < target) return "exceeded";
  }

  return "in-progress";
};

const createStyles = (
  theme: typeof lightTheme,
  height: number,
  color?: string
) =>
  StyleSheet.create({
    container: {
      paddingVertical: 12,
    },

    label: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 12,
    },

    valuesContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
    },

    valueItem: {
      flex: 1,
      alignItems: "flex-start",
    },

    currentValue: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
    },

    alignRight: {
      alignItems: "flex-end",
    },

    directionIcon: {
      marginRight: 4,
    },

    valueLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },

    valueText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
    },

    barContainer: {
      position: "relative",
      height: height + 8,
      justifyContent: "center",
      marginVertical: 8,
    },

    barBackground: {
      height,
      backgroundColor: theme.colors.surface,
      borderRadius: height / 2,
      overflow: "hidden",
    },

    barFill: {
      height: "100%",
      borderRadius: height / 2,
    },

    currentMarker: {
      position: "absolute",
      width: height + 8,
      height: height + 8,
      borderRadius: (height + 8) / 2,
      marginLeft: -(height + 8) / 2,
      borderWidth: 3,
      borderColor: theme.colors.card,
      // Sombra
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 4,
    },

    labelsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
    },

    labelText: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },

    statusContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 12,
    },

    statusText: {
      fontSize: 13,
      fontWeight: "600",
      marginLeft: 6,
    },
  });
