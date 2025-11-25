import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import type { Theme } from "../../theme";

const screenWidth = Dimensions.get("window").width;

export interface WeightDataPoint {
  date: string; // ISO date string
  weight: number;
  goal?: number;
  bmi?: number;
}

interface WeightEvolutionChartProps {
  data: WeightDataPoint[];
  showGoal?: boolean;
  showBMI?: boolean;
}

/**
 * WeightEvolutionChart Component
 *
 * Gráfico de linha mostrando a evolução do peso ao longo do tempo
 *
 * Features:
 * - Linha principal: peso atual
 * - Linha tracejada: peso meta (opcional)
 * - Segunda série: IMC (opcional)
 * - Suporte a zoom/scroll para muitos pontos
 * - Formatação de datas inteligente
 */
export const WeightEvolutionChart: React.FC<WeightEvolutionChartProps> = ({
  data,
  showGoal = true,
  showBMI = false,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();

  // Se não há dados
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Nenhum dado de peso registrado ainda
        </Text>
      </View>
    );
  }

  // Formatar labels de data (mostrar só alguns para evitar congestionamento)
  const formatDateLabel = (dateStr: string, index: number) => {
    const date = new Date(dateStr);
    const totalPoints = data.length;

    // Mostrar menos labels se houver muitos pontos
    if (totalPoints > 12) {
      // Mostrar apenas a cada 3 pontos
      if (index % 3 !== 0 && index !== totalPoints - 1) {
        return "";
      }
    }

    const month = date.toLocaleDateString("pt-BR", { month: "short" });
    const day = date.getDate();
    return `${day} ${month}`;
  };

  // Preparar dados para o gráfico
  const labels = data.map((point, index) => formatDateLabel(point.date, index));
  const weights = data.map((point) => point.weight);
  const goals = showGoal ? data.map((point) => point.goal || 0) : [];
  const bmis = showBMI ? data.map((point) => point.bmi || 0) : [];

  // Calcular valores min/max para melhor visualização
  // Datasets
  const datasets: any[] = [
    {
      data: weights,
      color: () => theme.colors.primary,
      strokeWidth: 3,
    },
  ];

  if (showGoal && goals.some((g) => g > 0)) {
    datasets.push({
      data: goals,
      color: () => theme.colors.success,
      strokeWidth: 2,
      strokeDasharray: [5, 5], // Linha tracejada
    });
  }

  if (showBMI && bmis.some((b) => b > 0)) {
    datasets.push({
      data: bmis,
      color: () => theme.colors.warning,
      strokeWidth: 2,
    });
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Evolução de Peso</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: theme.colors.primary },
              ]}
            />
            <Text style={styles.legendText}>Peso Atual</Text>
          </View>
          {showGoal && goals.some((g) => g > 0) && (
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: theme.colors.success },
                ]}
              />
              <Text style={styles.legendText}>Meta</Text>
            </View>
          )}
          {showBMI && bmis.some((b) => b > 0) && (
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: theme.colors.warning },
                ]}
              />
              <Text style={styles.legendText}>IMC</Text>
            </View>
          )}
        </View>
      </View>

      {/* Chart */}
      <LineChart
        data={{
          labels,
          datasets,
        }}
        width={screenWidth - 32}
        height={220}
        chartConfig={{
          backgroundColor: theme.colors.card,
          backgroundGradientFrom: theme.colors.card,
          backgroundGradientTo: theme.colors.card,
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.2})`,
          labelColor: () => theme.colors.textSecondary,
          style: {
            borderRadius: theme.borderRadius.lg,
          },
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: theme.colors.card,
          },
          propsForBackgroundLines: {
            strokeDasharray: "", // Linha sólida
            stroke: theme.colors.border,
            strokeWidth: 1,
          },
        }}
        bezier // Curva suave
        style={styles.chart}
        fromZero={false}
        yAxisSuffix=" kg"
        yAxisInterval={1}
        segments={4}
      />

      {/* Stats Summary */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Inicial</Text>
          <Text style={styles.statValue}>{weights[0].toFixed(1)} kg</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Atual</Text>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {weights[weights.length - 1].toFixed(1)} kg
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Variação</Text>
          <Text
            style={[
              styles.statValue,
              {
                color:
                  weights[weights.length - 1] < weights[0]
                    ? theme.colors.success
                    : theme.colors.error,
              },
            ]}
          >
            {(weights[weights.length - 1] - weights[0]).toFixed(1)} kg
          </Text>
        </View>
        {showGoal && goals.some((g) => g > 0) && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Meta</Text>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>
              {goals.find((g) => g > 0)?.toFixed(1)} kg
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
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      ...theme.shadows.md,
      marginBottom: theme.spacing.lg,
    },
    header: {
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    legend: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.md,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    legendText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textSecondary,
    },
    chart: {
      marginVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
    },
    stats: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    statItem: {
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    statLabel: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textSecondary,
      textTransform: "uppercase",
    },
    statValue: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text,
    },
    emptyContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing["2xl"],
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.lg,
      ...theme.shadows.sm,
    },
    emptyText: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
  });
