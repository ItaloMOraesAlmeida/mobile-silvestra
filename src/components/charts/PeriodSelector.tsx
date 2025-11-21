import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useThemedStyles } from "../../hooks/useTheme";

export type PeriodOption = "1M" | "3M" | "6M" | "1Y" | "ALL";

export interface PeriodSelectorProps {
  selectedPeriod: PeriodOption;
  onPeriodChange: (period: PeriodOption) => void;
}

const PERIODS: { value: PeriodOption; label: string }[] = [
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "6M", label: "6M" },
  { value: "1Y", label: "1A" },
  { value: "ALL", label: "Tudo" },
];

export function PeriodSelector({
  selectedPeriod,
  onPeriodChange,
}: PeriodSelectorProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      {PERIODS.map((period) => {
        const isSelected = selectedPeriod === period.value;
        return (
          <TouchableOpacity
            key={period.value}
            style={[styles.button, isSelected && styles.buttonActive]}
            onPress={() => onPeriodChange(period.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.buttonText, isSelected && styles.buttonTextActive]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.md,
    },
    button: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xs,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.gray[100],
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
    },
    buttonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    buttonText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.gray[600],
    },
    buttonTextActive: {
      color: theme.colors.white,
      fontWeight: theme.typography.fontWeight.semibold,
    },
  });
