import React from "react";
import { View, StyleSheet } from "react-native";
import { useThemedStyles } from "../hooks/useTheme";
import type { Theme } from "../theme";

/**
 * Skeleton para ActivityItem durante carregamento
 *
 * Mostra placeholder animado enquanto atividades estão sendo carregadas
 */
export const ActivityItemSkeleton: React.FC = () => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      {/* Ícone skeleton */}
      <View style={styles.iconSkeleton} />

      {/* Conteúdo skeleton */}
      <View style={styles.content}>
        <View style={styles.titleSkeleton} />
        <View style={styles.descriptionSkeleton} />
        <View style={styles.timeSkeleton} />
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: theme.spacing.md,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
      ...theme.shadows.sm,
    },
    iconSkeleton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.border,
      marginRight: theme.spacing.md,
      opacity: 0.3,
    },
    content: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    titleSkeleton: {
      width: "40%",
      height: 16,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.border,
      opacity: 0.3,
    },
    descriptionSkeleton: {
      width: "80%",
      height: 14,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.border,
      opacity: 0.3,
    },
    timeSkeleton: {
      width: "30%",
      height: 12,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.border,
      opacity: 0.3,
    },
  });
