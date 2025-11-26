import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useThemedStyles, useTheme } from "../hooks/useTheme";
import type { Theme } from "../theme";

export enum PatientStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ARCHIVED = "ARCHIVED",
}

export enum GoalsFilter {
  WITH_GOALS = "with_goals",
  WITHOUT_GOALS = "without_goals",
  OVERDUE_GOALS = "overdue_goals",
}

export enum ActivityPeriod {
  LAST_WEEK = "last_week",
  LAST_MONTH = "last_month",
  LAST_3_MONTHS = "last_3_months",
  OLDER = "older",
}

export interface FilterValues {
  status?: PatientStatus;
  goalsFilter?: GoalsFilter;
  activityPeriod?: ActivityPeriod;
  adherenceMin?: number;
  adherenceMax?: number;
}

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterValues;
  onApply: (filters: FilterValues) => void;
}

/**
 * FilterSheet Component
 *
 * Bottom sheet modal com todos os filtros disponíveis para pacientes
 *
 * Filtros:
 * - Status (Ativo/Inativo/Arquivado)
 * - Metas (Com metas/Sem metas/Metas atrasadas)
 * - Período de Atividade (Última semana/mês/3 meses/Mais antigo)
 * - Score de Adesão (slider de 0-100)
 */
export const FilterSheet: React.FC<FilterSheetProps> = ({
  visible,
  onClose,
  filters,
  onApply,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();

  // Estado local dos filtros
  const [localFilters, setLocalFilters] = useState<FilterValues>(filters);

  // Animação do backdrop
  const [backdropOpacity] = useState(new Animated.Value(0));

  // Sincroniza filtros externos com estado local quando o modal abre
  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, filters, backdropOpacity]);

  /**
   * Aplica os filtros e fecha o modal
   */
  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  /**
   * Limpa todos os filtros
   */
  const handleClear = () => {
    setLocalFilters({});
  };

  /**
   * Verifica se há filtros ativos
   */
  const hasActiveFilters = Object.keys(localFilters).length > 0;

  /**
   * Conta quantos filtros estão ativos
   */
  const activeFiltersCount = Object.keys(localFilters).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[styles.backdropOverlay, { opacity: backdropOpacity }]}
        />
      </Pressable>

      <View style={styles.sheetContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Filtros</Text>
            {activeFiltersCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Status Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Status do Paciente</Text>
            <View style={styles.optionsRow}>
              <FilterOption
                label="Ativo"
                selected={localFilters.status === PatientStatus.ACTIVE}
                onPress={() =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    status:
                      prev.status === PatientStatus.ACTIVE
                        ? undefined
                        : PatientStatus.ACTIVE,
                  }))
                }
                icon="checkmark-circle"
              />
              <FilterOption
                label="Inativo"
                selected={localFilters.status === PatientStatus.INACTIVE}
                onPress={() =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    status:
                      prev.status === PatientStatus.INACTIVE
                        ? undefined
                        : PatientStatus.INACTIVE,
                  }))
                }
                icon="pause-circle"
              />
              <FilterOption
                label="Arquivado"
                selected={localFilters.status === PatientStatus.ARCHIVED}
                onPress={() =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    status:
                      prev.status === PatientStatus.ARCHIVED
                        ? undefined
                        : PatientStatus.ARCHIVED,
                  }))
                }
                icon="archive"
              />
            </View>
          </View>

          {/* Goals Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Metas</Text>
            <View style={styles.optionsColumn}>
              <FilterOption
                label="Com metas ativas"
                selected={localFilters.goalsFilter === GoalsFilter.WITH_GOALS}
                onPress={() =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    goalsFilter:
                      prev.goalsFilter === GoalsFilter.WITH_GOALS
                        ? undefined
                        : GoalsFilter.WITH_GOALS,
                  }))
                }
                icon="flag"
                fullWidth
              />
              <FilterOption
                label="Sem metas ativas"
                selected={
                  localFilters.goalsFilter === GoalsFilter.WITHOUT_GOALS
                }
                onPress={() =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    goalsFilter:
                      prev.goalsFilter === GoalsFilter.WITHOUT_GOALS
                        ? undefined
                        : GoalsFilter.WITHOUT_GOALS,
                  }))
                }
                icon="flag-outline"
                fullWidth
              />
              <FilterOption
                label="Metas atrasadas"
                selected={
                  localFilters.goalsFilter === GoalsFilter.OVERDUE_GOALS
                }
                onPress={() =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    goalsFilter:
                      prev.goalsFilter === GoalsFilter.OVERDUE_GOALS
                        ? undefined
                        : GoalsFilter.OVERDUE_GOALS,
                  }))
                }
                icon="alert-circle"
                fullWidth
              />
            </View>
          </View>

          {/* Activity Period Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Período de Atividade</Text>
            <View style={styles.optionsColumn}>
              <FilterOption
                label="Última semana"
                selected={
                  localFilters.activityPeriod === ActivityPeriod.LAST_WEEK
                }
                onPress={() =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    activityPeriod:
                      prev.activityPeriod === ActivityPeriod.LAST_WEEK
                        ? undefined
                        : ActivityPeriod.LAST_WEEK,
                  }))
                }
                icon="calendar"
                fullWidth
              />
              <FilterOption
                label="Último mês"
                selected={
                  localFilters.activityPeriod === ActivityPeriod.LAST_MONTH
                }
                onPress={() =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    activityPeriod:
                      prev.activityPeriod === ActivityPeriod.LAST_MONTH
                        ? undefined
                        : ActivityPeriod.LAST_MONTH,
                  }))
                }
                icon="calendar"
                fullWidth
              />
              <FilterOption
                label="Últimos 3 meses"
                selected={
                  localFilters.activityPeriod === ActivityPeriod.LAST_3_MONTHS
                }
                onPress={() =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    activityPeriod:
                      prev.activityPeriod === ActivityPeriod.LAST_3_MONTHS
                        ? undefined
                        : ActivityPeriod.LAST_3_MONTHS,
                  }))
                }
                icon="calendar"
                fullWidth
              />
              <FilterOption
                label="Mais antigo"
                selected={localFilters.activityPeriod === ActivityPeriod.OLDER}
                onPress={() =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    activityPeriod:
                      prev.activityPeriod === ActivityPeriod.OLDER
                        ? undefined
                        : ActivityPeriod.OLDER,
                  }))
                }
                icon="time"
                fullWidth
              />
            </View>
          </View>

          {/* Adherence Score Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Score de Adesão</Text>
            <View style={styles.sliderContainer}>
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderValue}>
                  {localFilters.adherenceMin ?? 0}%
                </Text>
                <Text style={styles.sliderValue}>
                  {localFilters.adherenceMax ?? 100}%
                </Text>
              </View>

              <View style={styles.sliderRow}>
                <Text style={styles.sliderLabel}>Mínimo</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  step={5}
                  value={localFilters.adherenceMin ?? 0}
                  onValueChange={(value: number) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      adherenceMin: value,
                    }))
                  }
                  minimumTrackTintColor={theme.colors.primary}
                  maximumTrackTintColor={theme.colors.border}
                  thumbTintColor={theme.colors.primary}
                />
              </View>

              <View style={styles.sliderRow}>
                <Text style={styles.sliderLabel}>Máximo</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  step={5}
                  value={localFilters.adherenceMax ?? 100}
                  onValueChange={(value: number) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      adherenceMax: value,
                    }))
                  }
                  minimumTrackTintColor={theme.colors.primary}
                  maximumTrackTintColor={theme.colors.border}
                  thumbTintColor={theme.colors.primary}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClear}
            disabled={!hasActiveFilters}
          >
            <Text
              style={[
                styles.clearButtonText,
                !hasActiveFilters && styles.disabledText,
              ]}
            >
              Limpar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.applyButton]}
            onPress={handleApply}
          >
            <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/**
 * FilterOption Component
 *
 * Chip/botão para selecionar uma opção de filtro
 */
interface FilterOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
}

const FilterOption: React.FC<FilterOptionProps> = ({
  label,
  selected,
  onPress,
  icon,
  fullWidth = false,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.filterOption,
        selected && styles.filterOptionSelected,
        fullWidth && styles.filterOptionFull,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={selected ? theme.colors.primary : "#666666"}
          style={styles.optionIcon}
        />
      )}
      <Text
        style={[
          styles.filterOptionText,
          selected && styles.filterOptionTextSelected,
        ]}
      >
        {label}
      </Text>
      {selected && (
        <Ionicons
          name="checkmark-circle"
          size={18}
          color={theme.colors.primary}
        />
      )}
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    backdropOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    sheetContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "#FFFFFF", // Sempre branco
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      maxHeight: "85%",
      ...theme.shadows.lg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: "#E0E0E0", // Sempre cinza claro
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    title: {
      fontSize: theme.typography.fontSize.xl,
      fontFamily: theme.typography.fontFamily.bold,
      color: "#1A1A1A", // Sempre texto escuro
    },
    badge: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      minWidth: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.bold,
      color: "#FFFFFF",
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
    },
    filterSection: {
      paddingVertical: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: "#E0E0E0", // Sempre cinza claro
    },
    filterLabel: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.semibold,
      color: "#1A1A1A", // Sempre texto escuro
      marginBottom: theme.spacing.md,
    },
    optionsRow: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      flexWrap: "wrap",
    },
    optionsColumn: {
      gap: theme.spacing.sm,
    },
    filterOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: "#E0E0E0", // Sempre cinza claro
      backgroundColor: "#FFFFFF", // Sempre branco
      gap: theme.spacing.xs,
    },
    filterOptionFull: {
      width: "100%",
    },
    filterOptionSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + "10",
    },
    optionIcon: {
      marginRight: theme.spacing.xs,
    },
    filterOptionText: {
      flex: 1,
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.medium,
      color: "#666666", // Sempre cinza médio
    },
    filterOptionTextSelected: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamily.semibold,
    },
    sliderContainer: {
      gap: theme.spacing.md,
    },
    sliderLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    sliderValue: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.primary,
    },
    sliderRow: {
      gap: theme.spacing.sm,
    },
    sliderLabel: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.medium,
      color: "#666666", // Sempre cinza médio
    },
    slider: {
      width: "100%",
      height: 40,
    },
    footer: {
      flexDirection: "row",
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: "#E0E0E0", // Sempre cinza claro
    },
    button: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    clearButton: {
      backgroundColor: "#FFFFFF", // Sempre branco
      borderWidth: 1,
      borderColor: "#E0E0E0", // Sempre cinza claro
    },
    clearButtonText: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.semibold,
      color: "#666666", // Sempre cinza médio
    },
    disabledText: {
      opacity: 0.5,
    },
    applyButton: {
      backgroundColor: theme.colors.primary,
      ...theme.shadows.sm,
    },
    applyButtonText: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.bold,
      color: "#FFFFFF",
    },
  });
