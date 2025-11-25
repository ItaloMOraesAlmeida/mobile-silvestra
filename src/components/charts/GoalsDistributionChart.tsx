import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import type { Theme } from "../../theme";

const screenWidth = Dimensions.get("window").width;

export interface GoalsDistribution {
  achieved: number; // Metas alcançadas
  inProgress: number; // Em progresso (dentro do prazo)
  overdue: number; // Atrasadas
  notStarted: number; // Não iniciadas
}

interface GoalsDistributionChartProps {
  data: GoalsDistribution;
}

/**
 * GoalsDistributionChart Component
 *
 * Gráfico de pizza mostrando distribuição de metas
 *
 * Cores:
 * - Verde: Metas alcançadas
 * - Azul: Em progresso
 * - Vermelho: Atrasadas
 * - Cinza: Não iniciadas
 */
export const GoalsDistributionChart: React.FC<GoalsDistributionChartProps> = ({
  data,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();

  const total =
    data.achieved + data.inProgress + data.overdue + data.notStarted;

  // Se não há dados
  if (total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhuma meta registrada ainda</Text>
      </View>
    );
  }

  // Preparar dados para o gráfico
  const chartData = [
    {
      name: "Alcançadas",
      population: data.achieved,
      color: theme.colors.success,
      legendFontColor: theme.colors.textSecondary,
      legendFontSize: 14,
    },
    {
      name: "Em progresso",
      population: data.inProgress,
      color: theme.colors.primary,
      legendFontColor: theme.colors.textSecondary,
      legendFontSize: 14,
    },
    {
      name: "Atrasadas",
      population: data.overdue,
      color: theme.colors.error,
      legendFontColor: theme.colors.textSecondary,
      legendFontSize: 14,
    },
    {
      name: "Não iniciadas",
      population: data.notStarted,
      color: theme.colors.textSecondary,
      legendFontColor: theme.colors.textSecondary,
      legendFontSize: 14,
    },
  ].filter((item) => item.population > 0); // Remover categorias com 0

  // Calcular percentuais
  const calculatePercentage = (value: number) => {
    return ((value / total) * 100).toFixed(1);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Distribuição de Metas</Text>
        <Text style={styles.subtitle}>Total: {total} metas</Text>
      </View>

      {/* Chart */}
      <PieChart
        data={chartData}
        width={screenWidth - 32}
        height={220}
        chartConfig={{
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute // Mostrar valores absolutos ao invés de percentuais
        hasLegend={false} // Vamos criar nossa própria legenda
      />

      {/* Custom Legend with Stats */}
      <View style={styles.statsContainer}>
        {data.achieved > 0 && (
          <View style={styles.statItem}>
            <View style={styles.statHeader}>
              <View
                style={[
                  styles.statIndicator,
                  { backgroundColor: theme.colors.success },
                ]}
              />
              <Text style={styles.statLabel}>Alcançadas</Text>
            </View>
            <View style={styles.statValues}>
              <Text style={styles.statCount}>{data.achieved}</Text>
              <Text style={styles.statPercentage}>
                {calculatePercentage(data.achieved)}%
              </Text>
            </View>
          </View>
        )}

        {data.inProgress > 0 && (
          <View style={styles.statItem}>
            <View style={styles.statHeader}>
              <View
                style={[
                  styles.statIndicator,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
              <Text style={styles.statLabel}>Em progresso</Text>
            </View>
            <View style={styles.statValues}>
              <Text style={styles.statCount}>{data.inProgress}</Text>
              <Text style={styles.statPercentage}>
                {calculatePercentage(data.inProgress)}%
              </Text>
            </View>
          </View>
        )}

        {data.overdue > 0 && (
          <View style={styles.statItem}>
            <View style={styles.statHeader}>
              <View
                style={[
                  styles.statIndicator,
                  { backgroundColor: theme.colors.error },
                ]}
              />
              <Text style={styles.statLabel}>Atrasadas</Text>
            </View>
            <View style={styles.statValues}>
              <Text style={styles.statCount}>{data.overdue}</Text>
              <Text style={styles.statPercentage}>
                {calculatePercentage(data.overdue)}%
              </Text>
            </View>
          </View>
        )}

        {data.notStarted > 0 && (
          <View style={styles.statItem}>
            <View style={styles.statHeader}>
              <View
                style={[
                  styles.statIndicator,
                  { backgroundColor: theme.colors.textSecondary },
                ]}
              />
              <Text style={styles.statLabel}>Não iniciadas</Text>
            </View>
            <View style={styles.statValues}>
              <Text style={styles.statCount}>{data.notStarted}</Text>
              <Text style={styles.statPercentage}>
                {calculatePercentage(data.notStarted)}%
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Success Rate */}
      {total > 0 && (
        <View style={styles.successRate}>
          <Text style={styles.successRateLabel}>Taxa de Sucesso</Text>
          <Text
            style={[
              styles.successRateValue,
              {
                color:
                  calculatePercentage(data.achieved) >= "50"
                    ? theme.colors.success
                    : calculatePercentage(data.achieved) >= "30"
                    ? theme.colors.warning
                    : theme.colors.error,
              },
            ]}
          >
            {calculatePercentage(data.achieved)}%
          </Text>
        </View>
      )}
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
    },
    subtitle: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    statsContainer: {
      marginTop: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    statItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: theme.spacing.sm,
    },
    statHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      flex: 1,
    },
    statIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    statLabel: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.text,
    },
    statValues: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    statCount: {
      fontSize: theme.typography.fontSize.xl,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text,
      minWidth: 40,
      textAlign: "right",
    },
    statPercentage: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.semibold,
      color: theme.colors.textSecondary,
      minWidth: 50,
      textAlign: "right",
    },
    successRate: {
      marginTop: theme.spacing.xl,
      paddingTop: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    successRateLabel: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.semibold,
      color: theme.colors.text,
    },
    successRateValue: {
      fontSize: theme.typography.fontSize["2xl"],
      fontFamily: theme.typography.fontFamily.bold,
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
