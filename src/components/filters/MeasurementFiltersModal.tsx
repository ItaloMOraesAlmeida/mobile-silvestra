import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, useThemedStyles } from "../../hooks/useTheme";
import type { Theme } from "../../theme";
import type {
  MeasurementFilters,
  PhotoFilter,
  SortField,
  SortOrder,
} from "../../types/measurement-filters.types";
import {
  DEFAULT_FILTERS,
  PERIOD_OPTIONS,
  PHOTO_OPTIONS,
  SORT_OPTIONS,
  getPeriodDates,
  countActiveFilters,
} from "../../types/measurement-filters.types";

interface Props {
  visible: boolean;
  filters: MeasurementFilters;
  onClose: () => void;
  onApply: (filters: MeasurementFilters) => void;
  onReset: () => void;
}

/**
 * Componente de filtros para medições
 */
export const MeasurementFiltersModal: React.FC<Props> = ({
  visible,
  filters: initialFilters,
  onClose,
  onApply,
  onReset,
}) => {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const [filters, setFilters] = useState<MeasurementFilters>(initialFilters);
  const [showPeriodOptions, setShowPeriodOptions] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setFilters(initialFilters);
    }
  }, [visible, initialFilters]);

  /**
   * Atualiza período
   */
  const handlePeriodChange = (period: string) => {
    const dates = getPeriodDates(period);
    setFilters((prev) => ({
      ...prev,
      period,
      startDate: dates.startDate,
      endDate: dates.endDate,
    }));
    setShowPeriodOptions(false);
  };

  /**
   * Atualiza filtro de fotos
   */
  const handlePhotoFilterChange = (photos: PhotoFilter) => {
    setFilters((prev) => ({ ...prev, photos }));
    setShowPhotoOptions(false);
  };

  /**
   * Atualiza ordenação
   */
  const handleSortChange = (sortField: SortField, sortOrder: SortOrder) => {
    setFilters((prev) => ({ ...prev, sortField, sortOrder }));
    setShowSortOptions(false);
  };

  /**
   * Atualiza IMC mínimo
   */
  const handleMinBMIChange = (value: string) => {
    const numValue = parseFloat(value);
    setFilters((prev) => ({
      ...prev,
      minBMI: isNaN(numValue) ? undefined : numValue,
    }));
  };

  /**
   * Atualiza IMC máximo
   */
  const handleMaxBMIChange = (value: string) => {
    const numValue = parseFloat(value);
    setFilters((prev) => ({
      ...prev,
      maxBMI: isNaN(numValue) ? undefined : numValue,
    }));
  };

  /**
   * Aplica filtros
   */
  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  /**
   * Reseta filtros
   */
  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    onReset();
  };

  /**
   * Obtém label do período selecionado
   */
  const getPeriodLabel = () => {
    const option = PERIOD_OPTIONS.find((opt) => opt.value === filters.period);
    return option?.label || "Selecione";
  };

  /**
   * Obtém label do filtro de fotos
   */
  const getPhotoLabel = () => {
    const option = PHOTO_OPTIONS.find((opt) => opt.value === filters.photos);
    return option?.label || "Todas";
  };

  /**
   * Obtém label da ordenação
   */
  const getSortLabel = () => {
    const option = SORT_OPTIONS.find(
      (opt) =>
        opt.field === filters.sortField && opt.order === filters.sortOrder
    );
    return option?.label || "Data (mais recente)";
  };

  const activeFiltersCount = countActiveFilters(filters);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="filter" size={24} color={theme.colors.text} />
              <Text style={styles.headerTitle}>Filtros</Text>
              {activeFiltersCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{activeFiltersCount}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons
                name="close"
                size={24}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Período */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📅 Período</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => setShowPeriodOptions(!showPeriodOptions)}
              >
                <Text style={styles.selectorText}>{getPeriodLabel()}</Text>
                <Ionicons
                  name={showPeriodOptions ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {showPeriodOptions && (
                <View style={styles.optionsList}>
                  {PERIOD_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={styles.option}
                      onPress={() => handlePeriodChange(option.value)}
                    >
                      <Ionicons
                        name={
                          filters.period === option.value
                            ? "radio-button-on"
                            : "radio-button-off"
                        }
                        size={20}
                        color={
                          filters.period === option.value
                            ? theme.colors.primary
                            : theme.colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.optionText,
                          filters.period === option.value &&
                            styles.optionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Faixa de IMC */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Faixa de IMC</Text>
              <View style={styles.rangeContainer}>
                <View style={styles.rangeInput}>
                  <Text style={styles.rangeLabel}>Mínimo</Text>
                  <TextInput
                    style={styles.input}
                    value={filters.minBMI?.toString() || ""}
                    onChangeText={handleMinBMIChange}
                    placeholder="Ex: 18"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="decimal-pad"
                  />
                </View>
                <Text style={styles.rangeSeparator}>até</Text>
                <View style={styles.rangeInput}>
                  <Text style={styles.rangeLabel}>Máximo</Text>
                  <TextInput
                    style={styles.input}
                    value={filters.maxBMI?.toString() || ""}
                    onChangeText={handleMaxBMIChange}
                    placeholder="Ex: 25"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            {/* Filtro de Fotos */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📷 Fotos</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => setShowPhotoOptions(!showPhotoOptions)}
              >
                <Text style={styles.selectorText}>{getPhotoLabel()}</Text>
                <Ionicons
                  name={showPhotoOptions ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {showPhotoOptions && (
                <View style={styles.optionsList}>
                  {PHOTO_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={styles.option}
                      onPress={() => handlePhotoFilterChange(option.value)}
                    >
                      <Ionicons
                        name={
                          filters.photos === option.value
                            ? "radio-button-on"
                            : "radio-button-off"
                        }
                        size={20}
                        color={
                          filters.photos === option.value
                            ? theme.colors.primary
                            : theme.colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.optionText,
                          filters.photos === option.value &&
                            styles.optionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Ordenação */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>↕️ Ordenar por</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => setShowSortOptions(!showSortOptions)}
              >
                <Text style={styles.selectorText}>{getSortLabel()}</Text>
                <Ionicons
                  name={showSortOptions ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {showSortOptions && (
                <View style={styles.optionsList}>
                  {SORT_OPTIONS.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.option}
                      onPress={() =>
                        handleSortChange(option.field, option.order)
                      }
                    >
                      <Ionicons
                        name={
                          filters.sortField === option.field &&
                          filters.sortOrder === option.order
                            ? "radio-button-on"
                            : "radio-button-off"
                        }
                        size={20}
                        color={
                          filters.sortField === option.field &&
                          filters.sortOrder === option.order
                            ? theme.colors.primary
                            : theme.colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.optionText,
                          filters.sortField === option.field &&
                            filters.sortOrder === option.order &&
                            styles.optionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Limpar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: "85%",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.colors.text,
    },
    badge: {
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    badgeText: {
      color: theme.colors.white,
      fontSize: 12,
      fontWeight: "600",
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
    },
    section: {
      paddingVertical: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    selector: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    selectorText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    optionsList: {
      marginTop: theme.spacing.sm,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: theme.spacing.xs,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    optionText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    optionTextActive: {
      color: theme.colors.primary,
      fontWeight: "500",
    },
    rangeContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    rangeInput: {
      flex: 1,
    },
    rangeLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    rangeSeparator: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 20,
    },
    input: {
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      fontSize: 14,
      color: theme.colors.text,
    },
    footer: {
      flexDirection: "row",
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    resetButton: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    resetButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.textSecondary,
    },
    applyButton: {
      flex: 2,
      paddingVertical: theme.spacing.md,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      backgroundColor: theme.colors.primary,
    },
    applyButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.white,
    },
  });
