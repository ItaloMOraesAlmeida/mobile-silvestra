import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useThemedStyles } from "../../hooks/useTheme";

export interface MetricOption {
  id: string;
  label: string;
  color: string;
  unit?: string;
}

export interface MetricSelectorProps {
  metrics: MetricOption[];
  selectedMetrics: string[];
  onToggleMetric: (metricId: string) => void;
  maxSelections?: number;
}

export function MetricSelector({
  metrics,
  selectedMetrics,
  onToggleMetric,
  maxSelections = 3,
}: MetricSelectorProps) {
  const styles = useThemedStyles(createStyles);

  const handlePress = (metricId: string) => {
    const isSelected = selectedMetrics.includes(metricId);

    // Se já está selecionado, pode desmarcar
    if (isSelected) {
      onToggleMetric(metricId);
      return;
    }

    // Se atingiu o limite, não permite adicionar mais
    if (selectedMetrics.length >= maxSelections) {
      return;
    }

    onToggleMetric(metricId);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Métricas a exibir (máx. {maxSelections})</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {metrics.map((metric) => {
          const isSelected = selectedMetrics.includes(metric.id);
          const isDisabled =
            !isSelected && selectedMetrics.length >= maxSelections;

          return (
            <TouchableOpacity
              key={metric.id}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                isDisabled && styles.chipDisabled,
              ]}
              onPress={() => handlePress(metric.id)}
              activeOpacity={0.7}
              disabled={isDisabled}
            >
              <View
                style={[styles.colorDot, { backgroundColor: metric.color }]}
              />
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                  isDisabled && styles.chipTextDisabled,
                ]}
              >
                {metric.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.gray[700],
      marginBottom: theme.spacing.sm,
    },
    scrollContent: {
      gap: theme.spacing.sm,
      paddingRight: theme.spacing.md,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.gray[100],
      borderWidth: 1.5,
      borderColor: theme.colors.gray[200],
    },
    chipSelected: {
      backgroundColor: theme.colors.primary + "15", // 15 = 8.5% opacity
      borderColor: theme.colors.primary,
    },
    chipDisabled: {
      opacity: 0.4,
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    chipText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.gray[700],
    },
    chipTextSelected: {
      color: theme.colors.primary,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    chipTextDisabled: {
      color: theme.colors.gray[400],
    },
  });
