import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles } from "../../hooks/useTheme";
import type { Theme } from "../../theme";

interface KpiCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  style?: ViewStyle;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  icon,
  label,
  value,
  unit,
  trend,
  trendValue,
  style,
}) => {
  const styles = useThemedStyles(createStyles);

  const getTrendIcon = () => {
    if (!trend) return null;

    const iconName =
      trend === "up"
        ? "trending-up"
        : trend === "down"
        ? "trending-down"
        : "remove";
    const iconColor =
      trend === "up"
        ? styles.trendUp.color
        : trend === "down"
        ? styles.trendDown.color
        : styles.trendNeutral.color;

    return (
      <View style={styles.trendContainer}>
        <Ionicons name={iconName} size={16} color={iconColor} />
        {trendValue && (
          <Text style={[styles.trendText, { color: iconColor }]}>
            {trendValue}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color={styles.icon.color} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>

        <View style={styles.valueRow}>
          <Text style={styles.value}>
            {value}
            {unit && <Text style={styles.unit}> {unit}</Text>}
          </Text>
          {getTrendIcon()}
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      alignItems: "center",
      ...theme.shadows.sm,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.primaryBackground,
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.md,
    },
    icon: {
      color: theme.colors.primary,
    },
    content: {
      flex: 1,
    },
    label: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    valueRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    value: {
      fontSize: theme.typography.fontSize["2xl"],
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
    },
    unit: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.regular,
      color: theme.colors.textSecondary,
    },
    trendContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    trendText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
    },
    trendUp: {
      color: theme.colors.success,
    },
    trendDown: {
      color: theme.colors.error,
    },
    trendNeutral: {
      color: theme.colors.textSecondary,
    },
  });
