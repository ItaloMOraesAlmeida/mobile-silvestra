import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import type { Theme } from "../../theme";
import type { BodyMeasurement } from "../../types/patient-details.types";

interface CircumferencesGridProps {
  measurement: BodyMeasurement;
}

interface CircumferenceItem {
  label: string;
  value: number | null | undefined;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

/**
 * Grid visual de circunferências corporais
 */
export const CircumferencesGrid: React.FC<CircumferencesGridProps> = ({
  measurement,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();

  const formatValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "—";
    return value.toFixed(1);
  };

  const circumferences: CircumferenceItem[] = [
    {
      label: "Pescoço",
      value: measurement.neckCirc,
      icon: "body-outline" as const,
      color: theme.colors.primary,
    },
    {
      label: "Ombros",
      value: measurement.shoulderCirc,
      icon: "resize-outline" as const,
      color: theme.colors.secondary,
    },
    {
      label: "Braço D",
      value: measurement.rightArmCirc,
      icon: "fitness-outline" as const,
      color: theme.colors.success,
    },
    {
      label: "Braço E",
      value: measurement.leftArmCirc,
      icon: "fitness-outline" as const,
      color: theme.colors.success,
    },
    {
      label: "Antebraço",
      value: measurement.forearmCirc,
      icon: "hand-right-outline" as const,
      color: theme.colors.info,
    },
    {
      label: "Tórax",
      value: measurement.chestCirc,
      icon: "shirt-outline" as const,
      color: theme.colors.warning,
    },
    {
      label: "Cintura",
      value: measurement.waistCirc,
      icon: "contract-outline" as const,
      color: theme.colors.error,
    },
    {
      label: "Abdômen",
      value: measurement.abdomenCirc,
      icon: "ellipse-outline" as const,
      color: theme.colors.primary,
    },
    {
      label: "Quadril",
      value: measurement.hipCirc,
      icon: "ellipse-outline" as const,
      color: theme.colors.secondary,
    },
    {
      label: "Coxa",
      value: measurement.thighCirc,
      icon: "walk-outline" as const,
      color: theme.colors.success,
    },
    {
      label: "Panturrilha",
      value: measurement.calfCirc,
      icon: "footsteps-outline" as const,
      color: theme.colors.info,
    },
  ];

  // Filtra apenas as medidas que foram preenchidas
  const filledCircumferences = circumferences.filter(
    (item) => item.value !== null && item.value !== undefined
  );

  if (filledCircumferences.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="resize-outline"
          size={48}
          color={theme.colors.textSecondary}
        />
        <Text style={styles.emptyText}>Nenhuma circunferência registrada</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {filledCircumferences.map((item, index) => (
        <View key={`${item.label}-${index}`} style={styles.gridItem}>
          {/* Icon Container */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${item.color}15` },
            ]}
          >
            <Ionicons name={item.icon} size={28} color={item.color} />
          </View>

          {/* Label */}
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>

          {/* Value */}
          <View style={styles.valueContainer}>
            <Text style={[styles.value, { color: item.color }]}>
              {formatValue(item.value)}
            </Text>
            <Text style={styles.unit}>cm</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.md,
    },
    gridItem: {
      flex: 1,
      minWidth: "45%",
      maxWidth: "48%",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      alignItems: "center",
      gap: theme.spacing.sm,
      ...theme.shadows.sm,
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.xs,
    },
    label: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
    valueContainer: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: theme.spacing.xs,
    },
    value: {
      fontSize: theme.typography.fontSize["2xl"],
      fontWeight: theme.typography.fontWeight.bold,
      lineHeight: theme.typography.fontSize["2xl"] * 1.2,
    },
    unit: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.textSecondary,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    emptyText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
  });
