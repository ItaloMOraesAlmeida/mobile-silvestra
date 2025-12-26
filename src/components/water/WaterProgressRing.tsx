import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { lightTheme } from "../../theme";

interface WaterProgressRingProps {
  consumed: number;
  goal: number;
  size?: number;
}

export default function WaterProgressRing({
  consumed,
  goal,
  size = 180,
}: WaterProgressRingProps) {
  const percent = Math.min(100, (consumed / goal) * 100);

  // Configuração do anel - linha mais fina
  const radius = size / 2;
  const strokeWidth = 12; // Largura fixa e fina

  // Coordenadas do arco
  const circumference = 2 * Math.PI * (radius - strokeWidth / 2);
  const strokeDashoffset = circumference - (circumference * percent) / 100;

  const progressColor =
    consumed >= goal ? lightTheme.colors.success : lightTheme.colors.primary;

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${radius}, ${radius}`}>
            {/* Background circle */}
            <Circle
              cx={radius}
              cy={radius}
              r={radius - strokeWidth / 2}
              stroke={`${lightTheme.colors.primary}15`}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <Circle
              cx={radius}
              cy={radius}
              r={radius - strokeWidth / 2}
              stroke={progressColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </G>
        </Svg>

        {/* Center Content */}
        <View style={[styles.centerContent, { width: size, height: size }]}>
          <Text style={[styles.percentText, { color: progressColor }]}>
            {Math.round(percent)}%
          </Text>
          <Text style={[styles.consumedText, { color: "#FFF" }]}>
            {consumed.toLocaleString("pt-BR")}ml
          </Text>
          <Text style={[styles.goalText, { color: "rgba(255,255,255,0.8)" }]}>
            de {goal.toLocaleString("pt-BR")}ml
          </Text>
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
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  percentText: {
    fontSize: 42,
    fontWeight: "bold",
  },
  consumedText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 4,
  },
  goalText: {
    fontSize: 14,
    marginTop: 2,
  },
});
