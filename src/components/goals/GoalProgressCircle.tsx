import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import type { Theme } from "../../theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  target?: number;
  current?: number;
  unit?: string;
  showValues?: boolean;
}

/**
 * Componente de progresso circular animado para metas
 */
export const GoalProgressCircle: React.FC<Props> = ({
  progress,
  size = 200,
  strokeWidth = 12,
  target,
  current,
  unit = "kg",
  showValues = true,
}) => {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressValue = useSharedValue(0);

  // Animar progresso quando mudar
  useEffect(() => {
    progressValue.value = withTiming(Math.min(progress, 100), {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, progressValue]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset =
      circumference - (progressValue.value / 100) * circumference;
    return {
      strokeDashoffset,
    };
  });

  // Cor do progresso baseada na porcentagem
  const getProgressColor = () => {
    if (progress >= 100) return theme.colors.success;
    if (progress >= 75) return theme.colors.primary;
    if (progress >= 50) return theme.colors.info;
    if (progress >= 25) return theme.colors.warning;
    return theme.colors.error;
  };

  const progressColor = getProgressColor();

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.border}
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Progress Circle */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
          />
        </G>
      </Svg>

      {/* Center Content */}
      <View style={styles.centerContent}>
        <Text style={[styles.progressText, { color: progressColor }]}>
          {Math.round(progress)}%
        </Text>
        {showValues && current !== undefined && target !== undefined && (
          <View style={styles.valuesContainer}>
            <Text style={styles.currentValue}>
              {current} {unit}
            </Text>
            <Text style={styles.separator}>de</Text>
            <Text style={styles.targetValue}>
              {target} {unit}
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
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },
    centerContent: {
      position: "absolute",
      alignItems: "center",
      justifyContent: "center",
    },
    progressText: {
      fontSize: 40,
      fontWeight: "700",
      marginBottom: theme.spacing.xs,
    },
    valuesContainer: {
      alignItems: "center",
    },
    currentValue: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.text,
    },
    separator: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginVertical: 2,
    },
    targetValue: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.colors.textSecondary,
    },
  });
