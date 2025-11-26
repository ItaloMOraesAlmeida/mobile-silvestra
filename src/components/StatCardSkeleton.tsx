import React from "react";
import { View, StyleSheet } from "react-native";
import { useThemedStyles } from "../hooks/useTheme";
import type { Theme } from "../theme";

/**
 * Skeleton para StatCard durante carregamento
 *
 * Mostra placeholder animado enquanto dados estão sendo carregados
 */
export const StatCardSkeleton: React.FC = () => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      {/* Ícone skeleton */}
      <View style={styles.iconSkeleton} />

      {/* Valor skeleton */}
      <View style={styles.valueSkeleton} />

      {/* Label skeleton */}
      <View style={styles.labelSkeleton} />
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 120,
      ...theme.shadows.sm,
    },
    iconSkeleton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.border,
      marginBottom: theme.spacing.sm,
      opacity: 0.3,
    },
    valueSkeleton: {
      width: 60,
      height: 32,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.border,
      marginBottom: theme.spacing.xs,
      opacity: 0.3,
    },
    labelSkeleton: {
      width: 80,
      height: 16,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.border,
      opacity: 0.3,
    },
  });
