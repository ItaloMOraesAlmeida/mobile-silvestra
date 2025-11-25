/**
 * ProgressIndicator Component
 *
 * Indicador de progresso circular animado com porcentagem.
 * Usado para mostrar progresso em relação a metas.
 *
 * Features:
 * - Círculo de progresso animado
 * - Porcentagem central
 * - Label e descrição
 * - Cores customizáveis
 * - Tamanhos (small, medium, large)
 * - Indicador de meta atingida
 *
 * Baseado em SVG para melhor performance e precisão.
 */

import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";

type IndicatorSize = "small" | "medium" | "large";

export interface ProgressIndicatorProps {
  // Dados
  progress: number; // 0-100
  label?: string;
  description?: string;

  // Visual
  size?: IndicatorSize;
  color?: string;
  backgroundColor?: string;
  strokeWidth?: number;

  // Estados
  showPercentage?: boolean;
  showGoalReached?: boolean;
  animated?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  label,
  description,
  size = "medium",
  color,
  backgroundColor,
  strokeWidth,
  showPercentage = true,
  showGoalReached = true,
  animated = true,
}) => {
  const styles = createStyles(lightTheme, size);

  // Dimensões baseadas no tamanho
  const dimensions = getDimensions(size);
  const radius =
    (dimensions.size - (strokeWidth || dimensions.strokeWidth)) / 2;
  const circumference = 2 * Math.PI * radius;

  // Cor do progresso
  const progressColor = color || lightTheme.colors.primary;
  const bgColor = backgroundColor || lightTheme.colors.surface;

  // Animação
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedProgress, {
        toValue: progress,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      animatedProgress.setValue(progress);
    }
  }, [progress, animated, animatedProgress]);

  // Calcular stroke dash offset
  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  // Meta atingida?
  const goalReached = progress >= 100;

  return (
    <View style={styles.container}>
      {/* Label superior */}
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Círculo de progresso */}
      <View style={styles.circleContainer}>
        <Svg width={dimensions.size} height={dimensions.size}>
          {/* Círculo de fundo */}
          <Circle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={radius}
            stroke={bgColor}
            strokeWidth={strokeWidth || dimensions.strokeWidth}
            fill="transparent"
          />

          {/* Círculo de progresso */}
          <AnimatedCircle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth || dimensions.strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${dimensions.size / 2}, ${dimensions.size / 2}`}
          />
        </Svg>

        {/* Conteúdo central */}
        <View style={styles.centerContent}>
          {showGoalReached && goalReached ? (
            <Ionicons
              name="checkmark-circle"
              size={dimensions.iconSize}
              color={lightTheme.colors.success}
            />
          ) : showPercentage ? (
            <>
              <Text style={styles.percentage}>
                {Math.round(Math.min(progress, 100))}
              </Text>
              <Text style={styles.percentageSymbol}>%</Text>
            </>
          ) : null}
        </View>
      </View>

      {/* Descrição inferior */}
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
};

// Configurações de dimensões por tamanho
const getDimensions = (size: IndicatorSize) => {
  switch (size) {
    case "small":
      return {
        size: 80,
        strokeWidth: 6,
        fontSize: 20,
        iconSize: 32,
      };
    case "large":
      return {
        size: 160,
        strokeWidth: 12,
        fontSize: 48,
        iconSize: 64,
      };
    case "medium":
    default:
      return {
        size: 120,
        strokeWidth: 10,
        fontSize: 32,
        iconSize: 48,
      };
  }
};

const createStyles = (theme: typeof lightTheme, size: IndicatorSize) => {
  const dimensions = getDimensions(size);

  return StyleSheet.create({
    container: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
    },

    label: {
      fontSize: size === "small" ? 12 : size === "large" ? 16 : 14,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 12,
      textAlign: "center",
    },

    circleContainer: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },

    centerContent: {
      position: "absolute",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },

    percentage: {
      fontSize: dimensions.fontSize,
      fontWeight: "700",
      color: theme.colors.text,
      letterSpacing: -1,
    },

    percentageSymbol: {
      fontSize: dimensions.fontSize * 0.5,
      fontWeight: "600",
      color: theme.colors.textSecondary,
      marginLeft: 2,
    },

    description: {
      fontSize: size === "small" ? 11 : size === "large" ? 14 : 12,
      color: theme.colors.textSecondary,
      marginTop: 8,
      textAlign: "center",
      paddingHorizontal: 8,
    },
  });
};
