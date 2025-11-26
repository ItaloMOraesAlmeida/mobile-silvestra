import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ProgressChart } from "react-native-chart-kit";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import type { Theme } from "../../theme";

export interface ProgressGaugeData {
  overall: number; // Progresso geral (0-100)
  goalsCompleted: number; // Percentual de metas concluídas (0-100)
  adherence: number; // Aderência ao plano (0-100)
  consistency: number; // Consistência de registros (0-100)
}

interface ProgressGaugeProps {
  data: ProgressGaugeData;
}

/**
 * ProgressGauge Component
 *
 * Medidor circular de progresso do paciente
 * - Progresso geral (grande no centro)
 * - Sub-indicadores: metas, aderência, consistência
 */
export const ProgressGauge: React.FC<ProgressGaugeProps> = ({ data }) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();

  // Determinar cor baseada no progresso
  const getProgressColor = (value: number) => {
    if (value >= 80) return theme.colors.success;
    if (value >= 60) return theme.colors.primary;
    if (value >= 40) return theme.colors.warning;
    return theme.colors.error;
  };

  // Determinar mensagem baseada no progresso
  const getProgressMessage = (value: number) => {
    if (value >= 90) return "Excelente!";
    if (value >= 75) return "Muito Bom!";
    if (value >= 60) return "Bom!";
    if (value >= 40) return "Regular";
    if (value >= 20) return "Precisa melhorar";
    return "Crítico";
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Progresso Geral</Text>
        <Text style={styles.subtitle}>Score consolidado</Text>
      </View>

      {/* Main Progress Circle */}
      <View style={styles.mainProgress}>
        <View style={styles.circleContainer}>
          {/* Usando ProgressChart como gauge */}
          <ProgressChart
            data={{ data: [data.overall / 100] }}
            width={200}
            height={200}
            strokeWidth={20}
            radius={80}
            chartConfig={{
              backgroundGradientFrom: theme.colors.card,
              backgroundGradientTo: theme.colors.card,
              color: (opacity = 1) =>
                `${getProgressColor(data.overall)}${Math.round(
                  opacity * 255
                ).toString(16)}`,
              strokeWidth: 2,
            }}
            hideLegend={true}
            style={{
              borderRadius: 16,
            }}
          />
          {/* Overlay com valor */}
          <View style={styles.circleOverlay}>
            <Text
              style={[
                styles.mainValue,
                { color: getProgressColor(data.overall) },
              ]}
            >
              {Math.round(data.overall)}%
            </Text>
            <Text style={styles.mainLabel}>
              {getProgressMessage(data.overall)}
            </Text>
          </View>
        </View>
      </View>

      {/* Sub-indicators */}
      <View style={styles.indicatorsContainer}>
        <View style={styles.indicator}>
          <View style={styles.indicatorHeader}>
            <Text style={styles.indicatorLabel}>Metas</Text>
            <Text
              style={[
                styles.indicatorValue,
                { color: getProgressColor(data.goalsCompleted) },
              ]}
            >
              {Math.round(data.goalsCompleted)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${data.goalsCompleted}%`,
                  backgroundColor: getProgressColor(data.goalsCompleted),
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.indicator}>
          <View style={styles.indicatorHeader}>
            <Text style={styles.indicatorLabel}>Aderência</Text>
            <Text
              style={[
                styles.indicatorValue,
                { color: getProgressColor(data.adherence) },
              ]}
            >
              {Math.round(data.adherence)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${data.adherence}%`,
                  backgroundColor: getProgressColor(data.adherence),
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.indicator}>
          <View style={styles.indicatorHeader}>
            <Text style={styles.indicatorLabel}>Consistência</Text>
            <Text
              style={[
                styles.indicatorValue,
                { color: getProgressColor(data.consistency) },
              ]}
            >
              {Math.round(data.consistency)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${data.consistency}%`,
                  backgroundColor: getProgressColor(data.consistency),
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Como o score é calculado?</Text>
        <Text style={styles.infoText}>
          O progresso geral é uma média ponderada de três fatores:{"\n"}•{" "}
          <Text style={styles.infoBold}>Metas</Text>: Percentual de metas
          concluídas{"\n"}• <Text style={styles.infoBold}>Aderência</Text>:
          Cumprimento do plano alimentar{"\n"}•{" "}
          <Text style={styles.infoBold}>Consistência</Text>: Regularidade nos
          registros
        </Text>
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
      marginBottom: theme.spacing.lg,
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
    mainProgress: {
      alignItems: "center",
      marginVertical: theme.spacing.lg,
    },
    circleContainer: {
      position: "relative",
      width: 200,
      height: 200,
      justifyContent: "center",
      alignItems: "center",
    },
    circleOverlay: {
      position: "absolute",
      justifyContent: "center",
      alignItems: "center",
    },
    mainValue: {
      fontSize: 48,
      fontFamily: theme.typography.fontFamily.bold,
      lineHeight: 56,
    },
    mainLabel: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.semibold,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    indicatorsContainer: {
      marginTop: theme.spacing.xl,
      gap: theme.spacing.lg,
    },
    indicator: {
      gap: theme.spacing.sm,
    },
    indicatorHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    indicatorLabel: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.semibold,
      color: theme.colors.text,
    },
    indicatorValue: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.bold,
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: 4,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 4,
    },
    infoCard: {
      marginTop: theme.spacing.xl,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.lg,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    infoTitle: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    infoText: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    infoBold: {
      fontFamily: theme.typography.fontFamily.semibold,
      color: theme.colors.text,
    },
  });
