/**
 * AddSubstitutionModal Component
 *
 * Modal para adicionar substituições de alimentos aos itens de refeição
 * Permite buscar alimento, definir quantidade, medida e observação
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lightTheme } from "../theme";
import { useFoodsStore } from "../stores/foods.store";
import type { HouseholdMeasure } from "../types/meal-plan.types";
import { HOUSEHOLD_MEASURES } from "../constants/householdMeasures";

interface AddSubstitutionModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (
    food: any,
    quantity: number,
    measurementType: "gramas" | "caseira",
    measurementUnit: HouseholdMeasure | undefined,
    observation: string
  ) => void;
}

export default function AddSubstitutionModal({
  visible,
  onClose,
  onAdd,
}: AddSubstitutionModalProps) {
  const { foods, searchFoods, loading } = useFoodsStore();
  const insets = useSafeAreaInsets();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [quantity, setQuantity] = useState("100");
  const [measurementType, setMeasurementType] = useState<"gramas" | "caseira">(
    "gramas"
  );
  const [selectedMeasure, setSelectedMeasure] = useState<
    HouseholdMeasure | undefined
  >();
  const [observation, setObservation] = useState("");
  const [step, setStep] = useState<"search" | "configure">("search");
  const [showMeasuresModal, setShowMeasuresModal] = useState(false);

  // Load foods on mount
  useEffect(() => {
    if (visible) {
      // Fazer busca com parâmetros explícitos
      searchFoods({
        search: "",
        page: 1,
        limit: 50,
        orderBy: "name",
        order: "asc",
      })
        .then()
        .catch((error) => {
          console.error("❌ Erro na busca:", error);
        });
    }
  }, [visible, searchFoods, foods.length]);

  // Reset on close
  useEffect(() => {
    if (!visible) {
      resetModal();
    }
  }, [visible]);

  const resetModal = () => {
    setSearchQuery("");
    setSelectedFood(null);
    setQuantity("100");
    setMeasurementType("gramas");
    setSelectedMeasure(undefined);
    setObservation("");
    setStep("search");
  };

  const handleSelectFood = (food: any) => {
    setSelectedFood(food);
    setStep("configure");
  };

  const handleBack = () => {
    if (step === "configure") {
      setStep("search");
      setSelectedFood(null);
    } else {
      onClose();
    }
  };

  const handleAdd = () => {
    if (!selectedFood || !quantity || parseFloat(quantity) <= 0) {
      return;
    }

    const quantityNum = parseFloat(quantity);
    onAdd(
      selectedFood,
      quantityNum,
      measurementType,
      selectedMeasure,
      observation
    );
    resetModal();
    onClose();
  };

  // Filter foods based on search
  const filteredFoods = foods.filter((food) =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate nutrition for preview
  const calculateNutrition = () => {
    if (!selectedFood) return null;

    let gramsAmount = parseFloat(quantity) || 0;

    // Se caseira, converter para gramas
    if (measurementType === "caseira" && selectedMeasure) {
      const gramsPerUnit = selectedMeasure.gramsEquivalent || 0;
      gramsAmount = gramsAmount * gramsPerUnit;
    }

    const factor = gramsAmount / 100;

    return {
      calories: Math.round((selectedFood.energyKcal || 0) * factor),
      protein: parseFloat(((selectedFood.protein || 0) * factor).toFixed(1)),
      carbs: parseFloat(((selectedFood.carbohydrate || 0) * factor).toFixed(1)),
      fat: parseFloat(((selectedFood.lipids || 0) * factor).toFixed(1)),
      fiber: parseFloat(((selectedFood.fiber || 0) * factor).toFixed(1)),
    };
  };

  const nutrition = calculateNutrition();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleBack}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={lightTheme.colors.gray[700]}
                />
              </TouchableOpacity>
              <Text style={styles.title}>
                {step === "search"
                  ? "Selecionar Substituto"
                  : "Configurar Substituição"}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons
                  name="close"
                  size={24}
                  color={lightTheme.colors.gray[700]}
                />
              </TouchableOpacity>
            </View>

            {/* Content */}
            {step === "search" ? (
              // Step 1: Search Food
              <>
                {/* Search Input */}
                <View style={styles.searchContainer}>
                  <Ionicons
                    name="search"
                    size={20}
                    color={lightTheme.colors.gray[400]}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar alimento substituto..."
                    placeholderTextColor={lightTheme.colors.gray[400]}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color={lightTheme.colors.gray[400]}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Food List */}
                <FlatList
                  data={filteredFoods}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.foodSearchItem}
                      onPress={() => handleSelectFood(item)}
                    >
                      <Text style={styles.foodSearchName}>{item.name}</Text>
                      <Text style={styles.foodSearchInfo}>
                        {Math.round((item as any).energyKcal || 0)} kcal/100g
                      </Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    loading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator
                          size="large"
                          color={lightTheme.colors.primary}
                        />
                        <Text style={styles.loadingText}>
                          Carregando alimentos...
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.emptyContainer}>
                        <Ionicons
                          name="search-outline"
                          size={48}
                          color={lightTheme.colors.gray[400]}
                        />
                        <Text style={styles.emptyText}>
                          {searchQuery
                            ? "Nenhum alimento encontrado"
                            : "Nenhum alimento disponível"}
                        </Text>
                      </View>
                    )
                  }
                  contentContainerStyle={
                    filteredFoods.length === 0
                      ? styles.emptyListContainer
                      : undefined
                  }
                />
              </>
            ) : (
              // Step 2: Configure Substitution
              <>
                <ScrollView
                  style={styles.configContainer}
                  contentContainerStyle={styles.configScrollContent}
                >
                  {/* Selected Food */}
                  <View style={styles.selectedFoodCard}>
                    <View style={styles.selectedFoodHeader}>
                      <Ionicons
                        name="swap-horizontal"
                        size={24}
                        color="#8B5CF6"
                      />
                      <View style={styles.selectedFoodInfo}>
                        <Text style={styles.selectedFoodName}>
                          {selectedFood?.name}
                        </Text>
                        <Text style={styles.selectedFoodCategory}>
                          {selectedFood?.category?.name || "Sem categoria"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Quantity Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Quantidade *</Text>
                    <View style={styles.quantityRow}>
                      <TextInput
                        style={styles.quantityInput}
                        value={quantity}
                        onChangeText={setQuantity}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                      <View style={styles.measurementToggle}>
                        <TouchableOpacity
                          style={[
                            styles.measurementButton,
                            measurementType === "gramas" &&
                              styles.measurementButtonActive,
                          ]}
                          onPress={() => {
                            setMeasurementType("gramas");
                            setSelectedMeasure(undefined);
                          }}
                        >
                          <Text
                            style={[
                              styles.measurementButtonText,
                              measurementType === "gramas" &&
                                styles.measurementButtonTextActive,
                            ]}
                          >
                            Gramas
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.measurementButton,
                            measurementType === "caseira" &&
                              styles.measurementButtonActive,
                          ]}
                          onPress={() => setMeasurementType("caseira")}
                        >
                          <Text
                            style={[
                              styles.measurementButtonText,
                              measurementType === "caseira" &&
                                styles.measurementButtonTextActive,
                            ]}
                          >
                            Caseira
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Household Measures (if caseira) */}
                  {measurementType === "caseira" && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Medida Caseira *</Text>
                      <TouchableOpacity
                        style={styles.measurementSelector}
                        onPress={() => setShowMeasuresModal(true)}
                      >
                        <View style={styles.measurementSelectorContent}>
                          <Text
                            style={[
                              styles.measurementSelectorText,
                              !selectedMeasure &&
                                styles.measurementSelectorPlaceholder,
                            ]}
                          >
                            {selectedMeasure
                              ? `${selectedMeasure.name} (${selectedMeasure.gramsEquivalent}g)`
                              : "Selecione uma medida"}
                          </Text>
                          <Ionicons
                            name="chevron-down"
                            size={20}
                            color={lightTheme.colors.gray[500]}
                          />
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Observation */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Observação (Opcional)</Text>
                    <TextInput
                      style={styles.observationInput}
                      value={observation}
                      onChangeText={setObservation}
                      placeholder="Ex: Substituir em caso de intolerância"
                      placeholderTextColor={lightTheme.colors.gray[400]}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  {/* Nutrition Preview */}
                  {nutrition && (
                    <View style={styles.nutritionPreview}>
                      <Text style={styles.nutritionPreviewTitle}>
                        Valores Nutricionais
                      </Text>
                      <View style={styles.nutritionGrid}>
                        <View style={styles.nutritionItem}>
                          <Ionicons
                            name="flame"
                            size={16}
                            color={lightTheme.colors.primary}
                          />
                          <Text style={styles.nutritionValue}>
                            {nutrition.calories}
                          </Text>
                          <Text style={styles.nutritionLabel}>kcal</Text>
                        </View>
                        <View style={styles.nutritionItem}>
                          <Text style={styles.nutritionValue}>
                            {nutrition.protein}g
                          </Text>
                          <Text style={styles.nutritionLabel}>Proteínas</Text>
                        </View>
                        <View style={styles.nutritionItem}>
                          <Text style={styles.nutritionValue}>
                            {nutrition.carbs}g
                          </Text>
                          <Text style={styles.nutritionLabel}>Carbos</Text>
                        </View>
                        <View style={styles.nutritionItem}>
                          <Text style={styles.nutritionValue}>
                            {nutrition.fat}g
                          </Text>
                          <Text style={styles.nutritionLabel}>Gorduras</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </ScrollView>

                {/* Action Buttons */}
                <View
                  style={[
                    styles.actions,
                    { paddingBottom: insets.bottom || lightTheme.spacing[2] },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleBack}
                  >
                    <Text style={styles.cancelButtonText}>Voltar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      (!quantity ||
                        parseFloat(quantity) <= 0 ||
                        (measurementType === "caseira" && !selectedMeasure)) &&
                        styles.addButtonDisabled,
                    ]}
                    onPress={handleAdd}
                    disabled={
                      !quantity ||
                      parseFloat(quantity) <= 0 ||
                      (measurementType === "caseira" && !selectedMeasure)
                    }
                  >
                    <Ionicons
                      name="add-circle"
                      size={20}
                      color={lightTheme.colors.white}
                    />
                    <Text style={styles.addButtonText}>
                      Adicionar Substituição
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal de Seleção de Medidas Caseiras */}
      <Modal
        visible={showMeasuresModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMeasuresModal(false)}
      >
        <TouchableOpacity
          style={styles.measuresModalOverlay}
          activeOpacity={1}
          onPress={() => setShowMeasuresModal(false)}
        >
          <View
            style={[
              styles.measuresModalContent,
              { paddingBottom: Math.max(insets.bottom, lightTheme.spacing[4]) },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View style={styles.measuresModalHeader}>
              <Text style={styles.measuresModalTitle}>Selecionar Medida</Text>
              <TouchableOpacity
                onPress={() => setShowMeasuresModal(false)}
                style={styles.measuresModalCloseButton}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={lightTheme.colors.gray[700]}
                />
              </TouchableOpacity>
            </View>

            {/* Lista de Medidas */}
            <FlatList
              data={HOUSEHOLD_MEASURES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.measureItem,
                    selectedMeasure?.id === item.id &&
                      styles.measureItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedMeasure(item);
                    setShowMeasuresModal(false);
                  }}
                >
                  <View style={styles.measureItemContent}>
                    <Text
                      style={[
                        styles.measureItemName,
                        selectedMeasure?.id === item.id &&
                          styles.measureItemNameSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text style={styles.measureItemGrams}>
                      {item.gramsEquivalent}g
                    </Text>
                  </View>
                  {selectedMeasure?.id === item.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={lightTheme.colors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.measuresListContent}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: lightTheme.colors.white,
    borderTopLeftRadius: lightTheme.borderRadius["2xl"],
    borderTopRightRadius: lightTheme.borderRadius["2xl"],
    height: "90%",
    maxHeight: "90%",
    // paddingBottom aplicado dinamicamente com insets
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
  backButton: {
    padding: lightTheme.spacing[2],
  },
  title: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
    flex: 1,
    textAlign: "center",
  },
  closeButton: {
    padding: lightTheme.spacing[2],
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.gray[100],
    marginHorizontal: lightTheme.spacing[4],
    marginTop: lightTheme.spacing[4],
    paddingHorizontal: lightTheme.spacing[3],
    borderRadius: lightTheme.borderRadius.lg,
  },
  searchInput: {
    flex: 1,
    paddingVertical: lightTheme.spacing[3],
    paddingHorizontal: lightTheme.spacing[2],
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[900],
  },
  foodList: {
    flex: 1,
    paddingHorizontal: lightTheme.spacing[4],
  },
  loadingContainer: {
    paddingVertical: lightTheme.spacing[8],
    alignItems: "center",
  },
  loadingText: {
    marginTop: lightTheme.spacing[3],
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
  },
  emptyContainer: {
    paddingVertical: lightTheme.spacing[8],
    alignItems: "center",
  },
  emptyText: {
    marginTop: lightTheme.spacing[3],
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
  },
  foodItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: lightTheme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[900],
    marginBottom: 2,
  },
  foodCategory: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
  },
  foodNutrition: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[2],
  },
  foodCalories: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[700],
  },
  // Estilos para FlatList (igual ao modal de adicionar alimento)
  foodSearchItem: {
    padding: lightTheme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  foodSearchName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing[1],
  },
  foodSearchInfo: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  configContainer: {
    flex: 1,
  },
  configScrollContent: {
    paddingHorizontal: lightTheme.spacing[4],
    paddingTop: lightTheme.spacing[4],
    paddingBottom: lightTheme.spacing[4],
  },
  selectedFoodCard: {
    backgroundColor: "#F5F3FF", // Lilás claro (cor de substituição)
    borderWidth: 1,
    borderColor: "#DDD6FE", // Lilás borda
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing[3],
    marginBottom: lightTheme.spacing[4],
  },
  selectedFoodHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedFoodInfo: {
    marginLeft: lightTheme.spacing[3],
    flex: 1,
  },
  selectedFoodName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: "#5B21B6", // Roxo escuro
    marginBottom: 2,
  },
  selectedFoodCategory: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: "#7C3AED", // Roxo médio
  },
  inputGroup: {
    marginBottom: lightTheme.spacing[4],
  },
  label: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[700],
    marginBottom: lightTheme.spacing[2],
  },
  quantityRow: {
    flexDirection: "row",
    gap: lightTheme.spacing[3],
    alignItems: "center",
  },
  quantityInput: {
    width: 100,
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.lg,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[2],
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
    textAlign: "center",
  },
  measurementToggle: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing[1],
    gap: lightTheme.spacing[1],
  },
  measurementButton: {
    flex: 1,
    paddingHorizontal: lightTheme.spacing[3],
    paddingVertical: lightTheme.spacing[2],
    borderRadius: lightTheme.borderRadius.md,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  measurementButtonActive: {
    backgroundColor: lightTheme.colors.primary,
  },
  measurementButtonText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
  },
  measurementButtonTextActive: {
    color: lightTheme.colors.white,
  },
  measurementSelector: {
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    padding: lightTheme.spacing[4],
  },
  measurementSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  measurementSelectorText: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[900],
    fontWeight: lightTheme.typography.fontWeight.medium,
    flex: 1,
  },
  measurementSelectorPlaceholder: {
    color: lightTheme.colors.gray[400],
    fontWeight: lightTheme.typography.fontWeight.regular,
  },
  measuresRow: {
    flexDirection: "row",
    gap: lightTheme.spacing[2],
  },
  measureChip: {
    backgroundColor: lightTheme.colors.gray[100],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    borderRadius: lightTheme.borderRadius.lg,
    paddingHorizontal: lightTheme.spacing[3],
    paddingVertical: lightTheme.spacing[2],
  },
  measureChipActive: {
    backgroundColor: lightTheme.colors.primary,
    borderColor: lightTheme.colors.primary,
  },
  measureChipText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[700],
  },
  measureChipTextActive: {
    color: lightTheme.colors.white,
  },
  measureChipGrams: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginTop: 2,
  },
  observationInput: {
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.lg,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[900],
    minHeight: 80,
    textAlignVertical: "top",
  },
  nutritionPreview: {
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[4],
  },
  nutritionPreviewTitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[700],
    marginBottom: lightTheme.spacing[3],
  },
  nutritionGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  nutritionItem: {
    alignItems: "center",
  },
  nutritionValue: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
    marginTop: 4,
  },
  nutritionLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: lightTheme.spacing[3],
    paddingHorizontal: lightTheme.spacing[4],
    paddingTop: lightTheme.spacing[4],
    // paddingBottom aplicado dinamicamente com insets
    backgroundColor: lightTheme.colors.white,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[200],
  },
  cancelButton: {
    flex: 1,
    backgroundColor: lightTheme.colors.white,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    borderRadius: lightTheme.borderRadius.lg,
    paddingVertical: lightTheme.spacing[3],
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[700],
  },
  addButton: {
    flex: 2,
    backgroundColor: lightTheme.colors.primary,
    borderRadius: lightTheme.borderRadius.lg,
    paddingVertical: lightTheme.spacing[3],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: lightTheme.spacing[2],
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.white,
  },
  // Estilos do Modal de Medidas
  measuresModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  measuresModalContent: {
    backgroundColor: lightTheme.colors.white,
    borderTopLeftRadius: lightTheme.borderRadius["2xl"],
    borderTopRightRadius: lightTheme.borderRadius["2xl"],
    maxHeight: "70%",
    paddingTop: lightTheme.spacing[4],
  },
  measuresModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: lightTheme.spacing[6],
    paddingBottom: lightTheme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  measuresModalTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
  },
  measuresModalCloseButton: {
    padding: lightTheme.spacing[1],
  },
  measuresListContent: {
    paddingHorizontal: lightTheme.spacing[6],
    paddingVertical: lightTheme.spacing[2],
  },
  measureItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: lightTheme.spacing[4],
    paddingHorizontal: lightTheme.spacing[4],
    borderRadius: lightTheme.borderRadius.lg,
    marginVertical: lightTheme.spacing[1],
    backgroundColor: lightTheme.colors.white,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
  },
  measureItemSelected: {
    backgroundColor: "#F5F3FF",
    borderColor: lightTheme.colors.primary,
  },
  measureItemContent: {
    flex: 1,
  },
  measureItemName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[900],
    marginBottom: 2,
  },
  measureItemNameSelected: {
    color: lightTheme.colors.primary,
    fontWeight: lightTheme.typography.fontWeight.semibold,
  },
  measureItemGrams: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
  },
});
