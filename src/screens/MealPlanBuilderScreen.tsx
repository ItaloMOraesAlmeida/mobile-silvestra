/**
 * Tela de Construção de Plano Alimentar - Step 2
 * Sprint 8-9 - Meal Plans Module
 *
 * Construtor visual para adicionar refeições e alimentos:
 * - Adicionar/editar/remover refeições
 * - Selecionar alimentos da base TACO
 * - Cálculos nutricionais em tempo real
 * - Gráfico de distribuição de macros
 * - Preview do plano antes de salvar
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../theme";
import { useMealPlansStore } from "../stores/meal-plans.store";
import { useFoodsStore } from "../stores/foods.store";
import type { MealType, FoodBuilderItem } from "../types/meal-plan.types";
import {
  MEAL_TYPES_INFO,
  getMealTypeIcon,
  getMealTypeColor,
  formatGrams,
  formatCalories,
  formatMacro,
  getMacroColor,
  calculateMacroDistribution,
} from "../utils/meal-plan.utils";

interface Props {
  navigation: any;
  route?: {
    params?: {
      planId?: string;
      patientId?: string;
      initialTab?: "overview" | "assessments" | "plans" | "workouts";
    };
  };
}

export default function MealPlanBuilderScreen({ navigation, route }: Props) {
  const {
    builderState,
    addMealToBuilder,
    removeMealFromBuilder,
    addItemToMeal,
    removeItemFromMeal,
    savePlanFromBuilder,
    clearBuilder,
    loading,
  } = useMealPlansStore();

  const { foods, searchFoods } = useFoodsStore();

  // Modals
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [showFoodSearchModal, setShowFoodSearchModal] = useState(false);
  const [selectedMealIndex, setSelectedMealIndex] = useState<number | null>(
    null
  );

  // Meal form
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState<
    | "BREAKFAST"
    | "MORNING_SNACK"
    | "LUNCH"
    | "AFTERNOON_SNACK"
    | "DINNER"
    | "EVENING_SNACK"
    | "PRE_WORKOUT"
    | "POST_WORKOUT"
    | "OTHER"
  >("BREAKFAST");
  const [mealTime, setMealTime] = useState("08:00");
  const [mealObservation, setMealObservation] = useState("");

  // Food search
  const [foodSearchQuery, setFoodSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [foodQuantity, setFoodQuantity] = useState("100");

  useEffect(() => {
    searchFoods();
  }, [searchFoods]);

  // Calcular nutrição total do plano
  const planNutrition = useMemo(() => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    builderState?.meals.forEach((meal) => {
      meal.items.forEach((item) => {
        // Valores já estão calculados com base na quantidade
        totalCalories += item.calories || 0;
        totalProtein += item.protein || 0;
        totalCarbs += item.carbs || 0;
        totalFat += item.fat || 0;
        totalFiber += item.fiber || 0;
      });
    });

    return {
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalFiber,
    };
  }, [builderState?.meals]);

  // Comparar com metas
  const targets = builderState;
  const progress = useMemo(() => {
    if (!targets?.targetCalories) return null;

    return {
      calories: targets.targetCalories
        ? (planNutrition.totalCalories / targets.targetCalories) * 100
        : 0,
      protein: targets.targetProtein
        ? (planNutrition.totalProtein / targets.targetProtein) * 100
        : 0,
      carbs: targets.targetCarbs
        ? (planNutrition.totalCarbs / targets.targetCarbs) * 100
        : 0,
      fat: targets.targetFat
        ? (planNutrition.totalFat / targets.targetFat) * 100
        : 0,
      fiber: targets.targetFiber
        ? (planNutrition.totalFiber / targets.targetFiber) * 100
        : 0,
    };
  }, [planNutrition, targets]);

  // Distribuição de macros
  const macroDistribution = useMemo(() => {
    const dist = calculateMacroDistribution(
      planNutrition.totalProtein,
      planNutrition.totalCarbs,
      planNutrition.totalFat
    );
    return {
      proteinPercentage: dist.protein,
      carbsPercentage: dist.carbs,
      fatPercentage: dist.fat,
    };
  }, [planNutrition]);

  const handleAddMeal = () => {
    if (!mealName.trim()) {
      Alert.alert("Erro", "Digite um nome para a refeição");
      return;
    }

    addMealToBuilder({
      name: mealName,
      type: mealType,
      time: mealTime,
      observation: mealObservation,
      items: [],
    });

    // Reset form
    setMealName("");
    setMealType("BREAKFAST");
    setMealTime("08:00");
    setMealObservation("");
    setShowAddMealModal(false);
  };

  const handleRemoveMeal = (index: number) => {
    Alert.alert(
      "Remover Refeição",
      "Tem certeza que deseja remover esta refeição?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => removeMealFromBuilder(index),
        },
      ]
    );
  };

  const handleAddFoodToMeal = () => {
    if (!selectedFood || selectedMealIndex === null) return;

    const quantity = parseFloat(foodQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert("Erro", "Digite uma quantidade válida");
      return;
    }

    const factor = quantity / 100;
    const foodItem: FoodBuilderItem = {
      id: `temp_${Date.now()}`,
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      category: selectedFood.category?.name || "Outros",
      quantity,
      observation: "",
      calories: (selectedFood.energyKcal || 0) * factor,
      protein: (selectedFood.protein || 0) * factor,
      carbs: (selectedFood.carbohydrate || 0) * factor,
      fat: (selectedFood.lipids || 0) * factor,
      fiber: (selectedFood.fiber || 0) * factor,
    };

    addItemToMeal(selectedMealIndex, foodItem);

    // Reset
    setSelectedFood(null);
    setFoodQuantity("100");
    setShowFoodSearchModal(false);
  };

  const handleRemoveFoodItem = (mealIndex: number, itemIndex: number) => {
    removeItemFromMeal(mealIndex, itemIndex);
  };

  const handleSavePlan = async () => {
    if (!builderState?.meals || builderState.meals.length === 0) {
      Alert.alert("Erro", "Adicione pelo menos uma refeição ao plano");
      return;
    }

    const isEditMode = !!builderState?.planId;

    try {
      await savePlanFromBuilder();
      Alert.alert(
        "Sucesso",
        isEditMode
          ? "Plano alimentar atualizado com sucesso!"
          : "Plano alimentar criado com sucesso!",
        [
          {
            text: "OK",
            onPress: () => {
              clearBuilder();
              console.log(
                "✅ MealPlanBuilder: Plano salvo, voltando para tela anterior"
              );
              navigation.goBack();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao salvar plano");
    }
  };

  const filteredFoods = useMemo(() => {
    if (!foodSearchQuery.trim()) return foods.slice(0, 50);

    const query = foodSearchQuery.toLowerCase();
    return foods
      .filter((food) => food.name.toLowerCase().includes(query))
      .slice(0, 50);
  }, [foods, foodSearchQuery]);

  const getProgressColor = (value: number) => {
    if (value < 80) return "#EF4444"; // red
    if (value < 95) return "#F59E0B"; // orange
    if (value <= 105) return "#10B981"; // green
    return "#EF4444"; // red (over target)
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Subtítulo do Passo */}
      <View style={styles.stepHeader}>
        <Text style={styles.stepHeaderText}>
          Passo 2 de 2 - Construir Refeições
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step Progress Bar */}
        <View style={styles.stepIndicator}>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarActive} />
            <View style={styles.progressBarActive} />
          </View>
        </View>
        {/* Nutrition Summary Card */}
        <View style={styles.nutritionCard}>
          <Text style={styles.nutritionCardTitle}>
            Resumo Nutricional Total
          </Text>

          {/* Calories */}
          <View style={styles.nutritionSection}>
            <View style={styles.nutritionLabelRow}>
              <Text style={styles.nutritionLabel}>Calorias</Text>
              <View style={styles.nutritionValueRow}>
                <Text style={styles.nutritionValue}>
                  {formatCalories(planNutrition.totalCalories)}
                </Text>
                {targets?.targetCalories && (
                  <Text style={styles.nutritionTarget}>
                    / {formatCalories(targets.targetCalories)}
                  </Text>
                )}
              </View>
            </View>
            {progress && (
              <View style={styles.nutritionProgressBar}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(progress.calories, 100)}%`,
                      backgroundColor: getProgressColor(progress.calories),
                    },
                  ]}
                />
              </View>
            )}
          </View>

          {/* Macros Grid */}
          <View style={styles.macrosGrid}>
            {/* Proteínas */}
            <View style={styles.macroCard}>
              <View style={styles.macroHeader}>
                <View
                  style={[
                    styles.macroDot,
                    { backgroundColor: getMacroColor("protein") },
                  ]}
                />
                <Text style={styles.macroLabel}>Proteínas</Text>
              </View>
              <Text style={styles.macroValue}>
                {formatMacro(planNutrition.totalProtein)}
              </Text>
              <Text style={styles.macroPercentage}>
                {macroDistribution.proteinPercentage.toFixed(0)}%
              </Text>
            </View>

            {/* Carboidratos */}
            <View style={styles.macroCard}>
              <View style={styles.macroHeader}>
                <View
                  style={[
                    styles.macroDot,
                    { backgroundColor: getMacroColor("carbs") },
                  ]}
                />
                <Text style={styles.macroLabel}>Carboidratos</Text>
              </View>
              <Text style={styles.macroValue}>
                {formatMacro(planNutrition.totalCarbs)}
              </Text>
              <Text style={styles.macroPercentage}>
                {macroDistribution.carbsPercentage.toFixed(0)}%
              </Text>
            </View>

            {/* Gorduras */}
            <View style={styles.macroCard}>
              <View style={styles.macroHeader}>
                <View
                  style={[
                    styles.macroDot,
                    { backgroundColor: getMacroColor("fat") },
                  ]}
                />
                <Text style={styles.macroLabel}>Gorduras</Text>
              </View>
              <Text style={styles.macroValue}>
                {formatMacro(planNutrition.totalFat)}
              </Text>
              <Text style={styles.macroPercentage}>
                {macroDistribution.fatPercentage.toFixed(0)}%
              </Text>
            </View>

            {/* Fibras */}
            <View style={styles.macroCard}>
              <View style={styles.macroHeader}>
                <Ionicons name="leaf-outline" size={12} color="#10B981" />
                <Text style={[styles.macroLabel, { marginLeft: 4 }]}>
                  Fibras
                </Text>
              </View>
              <Text style={styles.macroValue}>
                {formatMacro(planNutrition.totalFiber)}
              </Text>
            </View>
          </View>
        </View>

        {/* Meals List */}
        <View style={styles.mealsSection}>
          <View style={styles.mealsSectionHeader}>
            <Text style={styles.mealsSectionTitle}>
              Refeições ({builderState?.meals.length || 0})
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddMealModal(true)}
              style={styles.addMealButton}
            >
              <Ionicons name="add" size={18} color="white" />
              <Text style={styles.addMealButtonText}>Adicionar</Text>
            </TouchableOpacity>
          </View>

          {builderState?.meals && builderState.meals.length > 0 ? (
            builderState.meals.map((meal, mealIndex) => {
              // Calculate meal nutrition (valores já calculados)
              let mealCalories = 0;

              meal.items.forEach((item) => {
                mealCalories += item.calories || 0;
              });

              return (
                <View key={mealIndex} style={styles.mealCard}>
                  {/* Meal Header */}
                  <View
                    style={[
                      styles.mealHeader,
                      {
                        backgroundColor: getMealTypeColor(meal.type) + "15",
                      },
                    ]}
                  >
                    <View style={styles.mealHeaderContent}>
                      <View style={styles.mealHeaderTitleRow}>
                        <Text style={styles.mealEmoji}>
                          {getMealTypeIcon(meal.type)}
                        </Text>
                        <Text style={styles.mealName}>{meal.name}</Text>
                      </View>
                      <Text style={styles.mealInfo}>
                        {meal.time} • {meal.items.length} alimento(s) •{" "}
                        {formatCalories(mealCalories)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveMeal(mealIndex)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Meal Items */}
                  {meal.items.length > 0 ? (
                    <View style={styles.mealItemsContainer}>
                      {meal.items.map((item, itemIndex) => {
                        return (
                          <View key={itemIndex} style={styles.mealItemRow}>
                            <View style={styles.mealItemContent}>
                              <Text style={styles.mealItemName}>
                                {item.foodName}
                              </Text>
                              <Text style={styles.mealItemInfo}>
                                {formatGrams(item.quantity)} •{" "}
                                {formatCalories(item.calories)}
                              </Text>
                              <Text style={styles.mealItemMacros}>
                                P: {formatMacro(item.protein)} • C:{" "}
                                {formatMacro(item.carbs)} • G:{" "}
                                {formatMacro(item.fat)}
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() =>
                                handleRemoveFoodItem(mealIndex, itemIndex)
                              }
                            >
                              <Ionicons
                                name="close-circle"
                                size={20}
                                color="#EF4444"
                              />
                            </TouchableOpacity>
                          </View>
                        );
                      })}

                      {/* Add Food Button */}
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedMealIndex(mealIndex);
                          setShowFoodSearchModal(true);
                        }}
                        style={styles.addFoodButton}
                      >
                        <Ionicons
                          name="add-circle-outline"
                          size={20}
                          color="#3B82F6"
                        />
                        <Text style={styles.addFoodButtonText}>
                          Adicionar Alimento
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedMealIndex(mealIndex);
                        setShowFoodSearchModal(true);
                      }}
                      style={styles.emptyMealState}
                    >
                      <Ionicons
                        name="restaurant-outline"
                        size={32}
                        color="#9CA3AF"
                      />
                      <Text style={styles.emptyMealText}>
                        Nenhum alimento adicionado
                      </Text>
                      <Text style={styles.emptyMealHint}>
                        Toque para adicionar
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>
                Nenhuma refeição adicionada
              </Text>
              <Text style={styles.emptyStateDescription}>
                Comece criando uma refeição e adicionando alimentos da base TACO
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Save Button Footer */}
      {builderState?.meals && builderState.meals.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleSavePlan}
            disabled={loading}
            style={styles.saveButton}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.saveButtonText}>
                  Salvar Plano Alimentar
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Add Meal Modal */}
      <Modal
        visible={showAddMealModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddMealModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Refeição</Text>
              <TouchableOpacity onPress={() => setShowAddMealModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* Meal Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nome *</Text>
                <TextInput
                  placeholder="Ex: Café da Manhã"
                  value={mealName}
                  onChangeText={setMealName}
                  style={styles.formInput}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Meal Type */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tipo *</Text>
                <View style={styles.mealTypesGrid}>
                  {Object.values(MEAL_TYPES_INFO).map((typeInfo) => {
                    const isSelected = mealType === typeInfo.type;
                    return (
                      <TouchableOpacity
                        key={typeInfo.type}
                        onPress={() => setMealType(typeInfo.type as MealType)}
                        style={[
                          styles.mealTypeChip,
                          isSelected && styles.mealTypeChipSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.mealTypeChipText,
                            isSelected && styles.mealTypeChipTextSelected,
                          ]}
                        >
                          {typeInfo.icon} {typeInfo.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Time */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Horário</Text>
                <TextInput
                  placeholder="Ex: 08:00"
                  value={mealTime}
                  onChangeText={setMealTime}
                  style={styles.formInput}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Observation */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Observação</Text>
                <TextInput
                  placeholder="Observações opcionais"
                  value={mealObservation}
                  onChangeText={setMealObservation}
                  multiline
                  numberOfLines={2}
                  style={[styles.formInput, styles.formTextArea]}
                  placeholderTextColor="#9CA3AF"
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                onPress={handleAddMeal}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Adicionar Refeição</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Food Search Modal */}
      <Modal
        visible={showFoodSearchModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFoodSearchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buscar Alimento TACO</Text>
              <TouchableOpacity onPress={() => setShowFoodSearchModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Buscar por nome..."
                value={foodSearchQuery}
                onChangeText={setFoodSearchQuery}
                style={styles.searchInput}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Selected Food & Quantity */}
            {selectedFood && (
              <View style={styles.selectedFoodCard}>
                <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
                <Text style={styles.selectedFoodInfo}>
                  {selectedFood.category?.name || "Outros"} •{" "}
                  {formatCalories(selectedFood.energyKcal || 0)}/100g
                </Text>
                <View style={styles.quantityRow}>
                  <Text style={styles.quantityLabel}>Quantidade (g):</Text>
                  <TextInput
                    value={foodQuantity}
                    onChangeText={setFoodQuantity}
                    keyboardType="decimal-pad"
                    style={styles.quantityInput}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleAddFoodToMeal}
                  style={styles.addToMealButton}
                >
                  <Text style={styles.addToMealButtonText}>
                    Adicionar à Refeição
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Foods List */}
            <FlatList
              data={filteredFoods}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setSelectedFood(item)}
                  style={[
                    styles.foodListItem,
                    selectedFood?.id === item.id && styles.foodListItemSelected,
                  ]}
                >
                  <Text style={styles.foodListItemName}>{item.name}</Text>
                  <Text style={styles.foodListItemCategory}>
                    {item.category?.name || "Outros"}
                  </Text>
                  <Text style={styles.foodListItemMacros}>
                    {formatCalories(item.energyKcal || 0)} • P:{" "}
                    {formatMacro(item.protein || 0)} • C:{" "}
                    {formatMacro(item.carbohydrate || 0)} • G:{" "}
                    {formatMacro(item.lipids || 0)}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyFoodsState}>
                  <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyFoodsText}>
                    Nenhum alimento encontrado
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Base Container
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },

  // Main Header
  mainHeader: {
    backgroundColor: lightTheme.colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: lightTheme.spacing[2],
  },
  headerTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[900],
  },
  headerSubtitle: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginTop: 2,
  },

  // Step Header (removido - não é mais necessário)
  stepHeader: {
    backgroundColor: lightTheme.colors.white,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  stepHeaderText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    fontWeight: lightTheme.typography.fontWeight.medium as any,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: lightTheme.spacing[4],
    paddingBottom: 32,
  },

  // Step Indicator
  stepIndicator: {
    marginBottom: lightTheme.spacing[6],
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBarActive: {
    backgroundColor: "#3B82F6",
    width: "50%",
    height: 4,
    borderRadius: lightTheme.borderRadius.full,
  },
  progressBarInactive: {
    backgroundColor: lightTheme.colors.gray[200],
    width: "50%",
    height: 4,
    borderRadius: lightTheme.borderRadius.full,
    marginLeft: lightTheme.spacing[2],
  },

  // Nutrition Summary Card
  nutritionCard: {
    backgroundColor: lightTheme.colors.primaryBackground,
    marginHorizontal: lightTheme.spacing[4],
    marginTop: lightTheme.spacing[4],
    padding: lightTheme.spacing[4],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: lightTheme.colors.primaryLight,
  },
  nutritionCardTitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing[3],
  },
  nutritionSection: {
    marginBottom: lightTheme.spacing[3],
  },
  nutritionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
  },
  nutritionValueRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  nutritionValue: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[900],
  },
  nutritionTarget: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginLeft: 4,
  },
  nutritionProgressBar: {
    backgroundColor: lightTheme.colors.gray[200],
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 999,
  },

  // Macros Grid
  macrosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  macroCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: lightTheme.colors.white,
    borderRadius: 12,
    padding: lightTheme.spacing[3],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[100],
  },
  macroHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginRight: 8,
  },
  macroLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
  },
  macroValue: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[900],
  },
  macroPercentage: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
  },

  // Meals Section
  mealsSection: {
    paddingHorizontal: lightTheme.spacing[4],
    marginTop: lightTheme.spacing[6],
  },
  mealsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: lightTheme.spacing[3],
  },
  mealsSectionTitle: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[900],
  },
  addMealButton: {
    backgroundColor: lightTheme.colors.primary,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[2],
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
  },
  addMealButtonText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    marginLeft: 4,
  },

  // Meal Card
  mealCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    marginBottom: lightTheme.spacing[3],
    overflow: "hidden",
  },
  mealHeader: {
    padding: lightTheme.spacing[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mealHeaderContent: {
    flex: 1,
  },
  mealHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  mealEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  mealName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[900],
  },
  mealInfo: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
  },

  // Meal Items
  mealItemsContainer: {
    padding: lightTheme.spacing[4],
    paddingTop: lightTheme.spacing[2],
  },
  mealItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: lightTheme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  mealItemContent: {
    flex: 1,
    marginRight: lightTheme.spacing[3],
  },
  mealItemName: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[900],
    marginBottom: 4,
  },
  mealItemInfo: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginBottom: 4,
  },
  mealItemMacros: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[400],
  },

  // Add Food Button
  addFoodButton: {
    marginTop: lightTheme.spacing[3],
    paddingVertical: lightTheme.spacing[2],
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: lightTheme.colors.gray[300],
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  addFoodButtonText: {
    color: lightTheme.colors.primary,
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    marginLeft: 8,
  },

  // Empty Meal State
  emptyMealState: {
    padding: lightTheme.spacing[4],
    alignItems: "center",
  },
  emptyMealText: {
    color: lightTheme.colors.gray[400],
    fontSize: lightTheme.typography.fontSize.sm,
    marginTop: 8,
  },
  emptyMealHint: {
    color: lightTheme.colors.primary,
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    marginTop: 4,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyStateTitle: {
    color: lightTheme.colors.gray[400],
    fontSize: lightTheme.typography.fontSize.base,
    marginTop: lightTheme.spacing[4],
  },
  emptyStateDescription: {
    color: lightTheme.colors.gray[400],
    fontSize: lightTheme.typography.fontSize.sm,
    textAlign: "center",
    marginTop: lightTheme.spacing[2],
    paddingHorizontal: 32,
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 96,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: lightTheme.spacing[4],
    backgroundColor: lightTheme.colors.white,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[100],
  },
  saveButton: {
    backgroundColor: lightTheme.colors.primary,
    paddingVertical: lightTheme.spacing[4],
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: lightTheme.colors.white,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    fontSize: lightTheme.typography.fontSize.base,
    marginLeft: 8,
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: lightTheme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: lightTheme.spacing[6],
    maxHeight: "80%",
  },
  modalContentLarge: {
    backgroundColor: lightTheme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: lightTheme.spacing[6],
    height: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: lightTheme.spacing[4],
  },
  modalTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[900],
  },

  // Form Elements
  formGroup: {
    marginBottom: lightTheme.spacing[4],
  },
  formLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[700],
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: lightTheme.colors.gray[50],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
    color: lightTheme.colors.gray[900],
  },
  formTextArea: {
    height: 80,
    textAlignVertical: "top",
  },

  // Meal Type Chips
  mealTypesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mealTypeChip: {
    paddingHorizontal: lightTheme.spacing[3],
    paddingVertical: lightTheme.spacing[2],
    borderRadius: 999,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    backgroundColor: lightTheme.colors.white,
  },
  mealTypeChipSelected: {
    borderColor: lightTheme.colors.primary,
    backgroundColor: lightTheme.colors.primaryBackground,
  },
  mealTypeChipText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[700],
  },
  mealTypeChipTextSelected: {
    color: lightTheme.colors.primary,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
  },

  // Modal Button
  modalButton: {
    backgroundColor: lightTheme.colors.primary,
    paddingVertical: lightTheme.spacing[4],
    borderRadius: 12,
  },
  modalButtonText: {
    color: lightTheme.colors.white,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    textAlign: "center",
  },

  // Search Input
  searchInputContainer: {
    backgroundColor: lightTheme.colors.gray[50],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
    flexDirection: "row",
    alignItems: "center",
    marginBottom: lightTheme.spacing[4],
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: lightTheme.colors.gray[900],
  },

  // Selected Food Card
  selectedFoodCard: {
    backgroundColor: lightTheme.colors.primaryBackground,
    borderWidth: 1,
    borderColor: lightTheme.colors.primaryLight,
    borderRadius: 12,
    padding: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[4],
  },
  selectedFoodName: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[900],
    marginBottom: 8,
  },
  selectedFoodInfo: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginBottom: lightTheme.spacing[3],
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[700],
    marginRight: lightTheme.spacing[3],
  },
  quantityInput: {
    flex: 1,
    backgroundColor: lightTheme.colors.white,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    borderRadius: 8,
    paddingHorizontal: lightTheme.spacing[3],
    paddingVertical: lightTheme.spacing[2],
    color: lightTheme.colors.gray[900],
  },
  addToMealButton: {
    backgroundColor: lightTheme.colors.primary,
    paddingVertical: lightTheme.spacing[3],
    borderRadius: 8,
    marginTop: lightTheme.spacing[3],
  },
  addToMealButtonText: {
    color: lightTheme.colors.white,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    textAlign: "center",
  },

  // Food List
  foodListItem: {
    padding: lightTheme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  foodListItemSelected: {
    backgroundColor: lightTheme.colors.primaryBackground,
  },
  foodListItemName: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[900],
    marginBottom: 4,
  },
  foodListItemCategory: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginBottom: 4,
  },
  foodListItemMacros: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[400],
  },

  // Empty Foods State
  emptyFoodsState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyFoodsText: {
    color: lightTheme.colors.gray[400],
    fontSize: lightTheme.typography.fontSize.sm,
    marginTop: lightTheme.spacing[4],
  },
});
