/**
 * PeriodSelector Component
 *
 * Seletor de período para filtrar dados de evolução.
 * Exibe chips/pills horizontais com opções de período.
 *
 * Períodos suportados:
 * - 7d: Últimos 7 dias
 * - 30d: Últimos 30 dias
 * - 3m: Últimos 3 meses
 * - 6m: Últimos 6 meses
 * - 1y: Último ano
 * - all: Todos os dados
 *
 * Features:
 * - Scroll horizontal para muitas opções
 * - Seleção visual clara
 * - Callback ao selecionar
 * - Customizável
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { lightTheme } from "../../theme";

export type EvolutionPeriod = "7d" | "30d" | "3m" | "6m" | "1y" | "all";

interface PeriodOption {
  value: EvolutionPeriod;
  label: string;
  shortLabel?: string;
}

const DEFAULT_PERIODS: PeriodOption[] = [
  { value: "7d", label: "7 dias", shortLabel: "7d" },
  { value: "30d", label: "30 dias", shortLabel: "30d" },
  { value: "3m", label: "3 meses", shortLabel: "3m" },
  { value: "6m", label: "6 meses", shortLabel: "6m" },
  { value: "1y", label: "1 ano", shortLabel: "1a" },
  { value: "all", label: "Tudo", shortLabel: "Tudo" },
];

export interface PeriodSelectorProps {
  selectedPeriod: EvolutionPeriod;
  onSelectPeriod: (period: EvolutionPeriod) => void;
  periods?: PeriodOption[];
  disabled?: boolean;
  showLabels?: "full" | "short";
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onSelectPeriod,
  periods = DEFAULT_PERIODS,
  disabled = false,
  showLabels = "full",
}) => {
  const styles = createStyles(lightTheme);

  const handleSelect = (period: EvolutionPeriod) => {
    if (!disabled && period !== selectedPeriod) {
      onSelectPeriod(period);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {periods.map((period) => {
          const isSelected = period.value === selectedPeriod;
          const label =
            showLabels === "short" && period.shortLabel
              ? period.shortLabel
              : period.label;

          return (
            <TouchableOpacity
              key={period.value}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                disabled && styles.chipDisabled,
              ]}
              onPress={() => handleSelect(period.value)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                  disabled && styles.chipTextDisabled,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: typeof lightTheme) =>
  StyleSheet.create({
    container: {
      marginVertical: 8,
    },

    scrollContent: {
      paddingHorizontal: 16,
      paddingVertical: 4,
    },

    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      minWidth: 60,
      alignItems: "center",
      justifyContent: "center",
    },

    chipSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },

    chipDisabled: {
      opacity: 0.5,
      backgroundColor: theme.colors.surface,
    },

    chipText: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.colors.text,
    },

    chipTextSelected: {
      color: "#FFFFFF",
      fontWeight: "600",
    },

    chipTextDisabled: {
      color: theme.colors.textSecondary,
    },
  });
