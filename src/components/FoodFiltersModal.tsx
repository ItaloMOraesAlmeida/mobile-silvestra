/**
 * FoodFiltersModal - Modal de Filtros Avançados
 * Sprint 7 - Silvestra App
 */

import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lightTheme } from "../theme";
import { FoodFilterParams } from "../types/food.types";

interface FoodFiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FoodFilterParams) => void;
  initialFilters?: FoodFilterParams;
}

export default function FoodFiltersModal({
  visible,
  onClose,
  onApply,
  initialFilters = {},
}: FoodFiltersModalProps) {
  const [filters, setFilters] = useState<FoodFilterParams>(initialFilters);
  const insets = useSafeAreaInsets();

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters({});
  };

  const updateFilter = (key: keyof FoodFilterParams, value: string) => {
    const numValue = value === "" ? undefined : parseFloat(value);
    setFilters({ ...filters, [key]: numValue });
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Filtros Avançados</Text>
              <Text style={styles.subtitle}>
                Refine sua busca por nutrientes
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Proteínas */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Proteínas (g/100g)</Text>
              <View style={styles.row}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Mínimo</Text>
                  <TextInput
                    value={filters.minProtein?.toString() || ""}
                    onChangeText={(value) => updateFilter("minProtein", value)}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    placeholderTextColor={lightTheme.colors.gray[400]}
                    style={styles.input}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Máximo</Text>
                  <TextInput
                    value={filters.maxProtein?.toString() || ""}
                    onChangeText={(value) => updateFilter("maxProtein", value)}
                    placeholder="100"
                    keyboardType="decimal-pad"
                    placeholderTextColor={lightTheme.colors.gray[400]}
                    style={styles.input}
                  />
                </View>
              </View>
            </View>

            {/* Carboidratos */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Carboidratos (g/100g)</Text>
              <View style={styles.row}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Mínimo</Text>
                  <TextInput
                    value={filters.minCarbs?.toString() || ""}
                    onChangeText={(value) => updateFilter("minCarbs", value)}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    placeholderTextColor={lightTheme.colors.gray[400]}
                    style={styles.input}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Máximo</Text>
                  <TextInput
                    value={filters.maxCarbs?.toString() || ""}
                    onChangeText={(value) => updateFilter("maxCarbs", value)}
                    placeholder="100"
                    keyboardType="decimal-pad"
                    placeholderTextColor={lightTheme.colors.gray[400]}
                    style={styles.input}
                  />
                </View>
              </View>
            </View>

            {/* Gorduras */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Gorduras (g/100g)</Text>
              <View style={styles.row}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Mínimo</Text>
                  <TextInput
                    value={filters.minLipids?.toString() || ""}
                    onChangeText={(value) => updateFilter("minLipids", value)}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    placeholderTextColor={lightTheme.colors.gray[400]}
                    style={styles.input}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Máximo</Text>
                  <TextInput
                    value={filters.maxLipids?.toString() || ""}
                    onChangeText={(value) => updateFilter("maxLipids", value)}
                    placeholder="100"
                    keyboardType="decimal-pad"
                    placeholderTextColor={lightTheme.colors.gray[400]}
                    style={styles.input}
                  />
                </View>
              </View>
            </View>

            {/* Calorias */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Calorias (kcal/100g)</Text>
              <View style={styles.row}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Mínimo</Text>
                  <TextInput
                    value={filters.minCalories?.toString() || ""}
                    onChangeText={(value) => updateFilter("minCalories", value)}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    placeholderTextColor={lightTheme.colors.gray[400]}
                    style={styles.input}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Máximo</Text>
                  <TextInput
                    value={filters.maxCalories?.toString() || ""}
                    onChangeText={(value) => updateFilter("maxCalories", value)}
                    placeholder="1000"
                    keyboardType="decimal-pad"
                    placeholderTextColor={lightTheme.colors.gray[400]}
                    style={styles.input}
                  />
                </View>
              </View>
            </View>

            {/* Fibras */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Fibras Mínimas (g/100g)</Text>
              <TextInput
                value={filters.minFiber?.toString() || ""}
                onChangeText={(value) => updateFilter("minFiber", value)}
                placeholder="0"
                keyboardType="decimal-pad"
                placeholderTextColor={lightTheme.colors.gray[400]}
                style={styles.input}
              />
            </View>

            {/* Exemplos */}
            <View style={styles.examplesBox}>
              <View style={styles.examplesHeader}>
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text style={styles.examplesTitle}>Exemplos de Filtros</Text>
              </View>
              <Text style={styles.examplesText}>
                • Alto proteína: Min 20g{"\n"}• Baixo carbo: Max 10g{"\n"}•
                Baixa caloria: Max 100 kcal{"\n"}• Rico em fibras: Min 5g
              </Text>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={handleClear}
                disabled={!hasActiveFilters}
                style={[
                  styles.clearButton,
                  !hasActiveFilters && styles.clearButtonDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.clearButtonText,
                    !hasActiveFilters && styles.clearButtonTextDisabled,
                  ]}
                >
                  Limpar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleApply}
                style={styles.applyButton}
              >
                <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: lightTheme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  title: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
  },
  subtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginTop: lightTheme.spacing[1],
  },
  closeButton: {
    padding: lightTheme.spacing[2],
  },
  scrollView: {
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[4],
  },
  filterGroup: {
    marginBottom: lightTheme.spacing[6],
  },
  filterLabel: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing[3],
  },
  row: {
    flexDirection: "row",
    gap: lightTheme.spacing[3],
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing[2],
  },
  input: {
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.xl,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[900],
  },
  examplesBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[4],
  },
  examplesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: lightTheme.spacing[2],
  },
  examplesTitle: {
    marginLeft: lightTheme.spacing[2],
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: "#1E3A8A",
  },
  examplesText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: "#1E40AF",
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: lightTheme.spacing[4],
    paddingTop: lightTheme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[200],
  },
  actionsRow: {
    flexDirection: "row",
    gap: lightTheme.spacing[3],
  },
  clearButton: {
    flex: 1,
    paddingVertical: lightTheme.spacing[3],
    borderRadius: lightTheme.borderRadius.xl,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    backgroundColor: lightTheme.colors.white,
  },
  clearButtonDisabled: {
    borderColor: lightTheme.colors.gray[200],
    backgroundColor: lightTheme.colors.gray[100],
  },
  clearButtonText: {
    textAlign: "center",
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
  },
  clearButtonTextDisabled: {
    color: lightTheme.colors.gray[400],
  },
  applyButton: {
    flex: 1,
    paddingVertical: lightTheme.spacing[3],
    borderRadius: lightTheme.borderRadius.xl,
    backgroundColor: "#3B82F6",
  },
  applyButtonText: {
    textAlign: "center",
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.white,
  },
});
