/**
 * Step2MealBuilder - Construtor de Refeições
 *
 * Gerencia criação de refeições com:
 * - Adição de múltiplas refeições (café, almoço, jantar, etc.)
 * - Busca e seleção de alimentos do banco de dados
 * - Medidas caseiras (23 opções) e gramas
 * - Tracking de macros vs metas do Step1
 * - Validação antes de salvar
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { lightTheme } from "../../../../theme";
import { useMealPlansStore } from "../../../../stores/meal-plans.store";
import { useFoodsStore } from "../../../../stores/foods.store";
import { StepHeader } from "../components/StepHeader";
import { DayOfWeek } from "../../../../types/meal-plan.types";
import WeekDayTabs from "../components/WeekDayTabs";
import CopyMealModal from "../components/CopyMealModal";
import AddSubstitutionModal from "../../../../components/AddSubstitutionModal";
import SubstitutionItem from "../../../../components/SubstitutionItem";
import { HOUSEHOLD_MEASURES } from "../../../../constants/householdMeasures";

// Types
type MealType =
  | "breakfast"
  | "morning_snack"
  | "lunch"
  | "afternoon_snack"
  | "dinner"
  | "evening_snack"
  | "other";

type HouseholdMeasure =
  | "colher_sopa"
  | "colher_cha"
  | "colher_cafe"
  | "colher_sobremesa"
  | "xicara_cha"
  | "copo_americano"
  | "copo_200ml"
  | "copo_300ml"
  | "prato_raso"
  | "prato_fundo"
  | "prato_sobremesa"
  | "concha"
  | "concha_pequena"
  | "escumadeira"
  | "fatia"
  | "fatia_fina"
  | "fatia_grossa"
  | "unidade"
  | "unidade_pequena"
  | "unidade_media"
  | "unidade_grande"
  | "punhado"
  | "porcao";

interface Props {
  onPrevious: () => void;
  navigation: any;
}

const MEAL_TYPES = [
  { id: "breakfast", label: "Café da Manhã", icon: "sunny-outline" },
  { id: "morning_snack", label: "Lanche da Manhã", icon: "fast-food-outline" },
  { id: "lunch", label: "Almoço", icon: "restaurant-outline" },
  { id: "afternoon_snack", label: "Lanche da Tarde", icon: "cafe-outline" },
  { id: "dinner", label: "Jantar", icon: "moon-outline" },
  { id: "evening_snack", label: "Ceia", icon: "bed-outline" },
  { id: "other", label: "Outro", icon: "ellipsis-horizontal-outline" },
];

export default function Step2MealBuilder({ onPrevious, navigation }: Props) {
  const insets = useSafeAreaInsets();

  // Store hooks
  const {
    builderState,
    addMealToBuilder,
    removeMealFromBuilder,
    addItemToMeal,
    updateItemInMeal,
    removeItemFromMeal,
    savePlanFromBuilder,
    setCurrentDay,
    canAccessDay,
    getFilledDays,
    getMealCountByDay,
    copyMealsToDay,
  } = useMealPlansStore();
  const {
    foods,
    searchFoods,
    setSearchTerm,
    loading: loadingFoods,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  } = useFoodsStore();

  // Modal states
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [showFoodSearchModal, setShowFoodSearchModal] = useState(false);
  const [showConfirmRemoveMeal, setShowConfirmRemoveMeal] = useState(false);
  const [showConfirmRemoveFood, setShowConfirmRemoveFood] = useState(false);
  const [showCopyMealModal, setShowCopyMealModal] = useState(false);
  const [showAddSubstitutionModal, setShowAddSubstitutionModal] =
    useState(false);
  const [substitutionTarget, setSubstitutionTarget] = useState<{
    mealIndex: number;
    foodIndex: number;
  } | null>(null);
  const [expandedSubstitutions, setExpandedSubstitutions] = useState<
    Set<string>
  >(new Set());

  // Form states
  const [currentMealId, setCurrentMealId] = useState<string | null>(null);
  const [mealForm, setMealForm] = useState({
    name: "",
    type: "breakfast" as MealType,
    time: "",
    observation: "",
  });

  // Food selection states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [foodQuantity, setFoodQuantity] = useState("");
  const [selectedMeasurement, setSelectedMeasurement] = useState<
    "gramas" | HouseholdMeasure
  >("gramas");
  const [foodModalStep, setFoodModalStep] = useState<"search" | "configure">(
    "search"
  );
  const [showMeasuresModal, setShowMeasuresModal] = useState(false);
  const [foodsPage, setFoodsPage] = useState(1);
  const [hasMoreFoods, setHasMoreFoods] = useState(true);

  // Confirm states
  const [mealToRemove, setMealToRemove] = useState<number | null>(null);
  const [foodToRemove, setFoodToRemove] = useState<{
    mealIndex: number;
    foodIndex: number;
  } | null>(null);

  // Food selection modal for substitutions
  const [showFoodSelectionModal, setShowFoodSelectionModal] = useState(false);
  const [foodsForSubstitution, setFoodsForSubstitution] = useState<{
    mealIndex: number;
    items: any[];
  } | null>(null);

  // Loading states
  const [saving, setSaving] = useState(false);

  // Load foods on mount
  useEffect(() => {
    if (foods.length === 0 && searchFoods) {
      searchFoods();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search with AbortController (Feature 2)
  useEffect(() => {
    const controller = new AbortController();
    const handler = setTimeout(() => {
      if (setSearchTerm) {
        setSearchTerm(searchQuery);
      }
      if (searchFoods) {
        searchFoods({
          search: searchQuery || undefined,
          page: 1,
          limit: 50,
          signal: controller.signal,
        }).catch((err: any) => {
          if (err?.name === "AbortError") return;
          console.error("Erro ao buscar alimentos:", err);
        });
      }
    }, 300); // debounce 300ms

    return () => {
      clearTimeout(handler);
      controller.abort();
    };
  }, [searchQuery, searchFoods, setSearchTerm]);

  // Filtered foods based on search
  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return foods;
    const query = searchQuery.toLowerCase();
    return foods.filter(
      (food: any) =>
        food.name?.toLowerCase().includes(query) ||
        food.category?.name?.toLowerCase().includes(query)
    );
  }, [foods, searchQuery]);

  // Calculate total nutrition from current day's meals only
  const planNutrition = useMemo(() => {
    // Pega as refeições do dia atual selecionado
    const currentDay = builderState?.currentDay || DayOfWeek.MONDAY;
    const meals = builderState?.mealsByDay?.[currentDay] || [];

    return meals.reduce(
      (totals: any, meal: any) => {
        const items = meal.items || [];
        items.forEach((item: any) => {
          totals.calories += item.calories || 0;
          totals.protein += item.protein || 0;
          totals.carbs += item.carbs || 0;
          totals.fat += item.fat || 0;
          totals.fiber += item.fiber || 0;
        });
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  }, [builderState?.mealsByDay, builderState?.currentDay]);

  // Progress vs targets (using targetCalories, targetProtein, etc.)
  const progress = useMemo(() => {
    const targetCalories = builderState?.targetCalories || 0;
    const targetProtein = builderState?.targetProtein || 0;
    const targetCarbs = builderState?.targetCarbs || 0;
    const targetFat = builderState?.targetFat || 0;

    return {
      calories: targetCalories
        ? (planNutrition.calories / targetCalories) * 100
        : 0,
      protein: targetProtein
        ? (planNutrition.protein / targetProtein) * 100
        : 0,
      carbs: targetCarbs ? (planNutrition.carbs / targetCarbs) * 100 : 0,
      fat: targetFat ? (planNutrition.fat / targetFat) * 100 : 0,
    };
  }, [
    planNutrition,
    builderState?.targetCalories,
    builderState?.targetProtein,
    builderState?.targetCarbs,
    builderState?.targetFat,
  ]);

  // Time mask helper
  const formatTimeInput = (text: string): string => {
    // Remove tudo que não é número e dois pontos
    let numbers = text.replace(/[^\d:]/g, "");

    // Remove dois pontos duplicados
    numbers = numbers.replace(/:+/g, ":");

    // Se está apagando e tem : no final, remove
    if (numbers.endsWith(":") && numbers.length < text.length) {
      numbers = numbers.slice(0, -1);
    }

    // Split por :
    const parts = numbers.split(":");

    // Se não tem partes, retorna vazio
    if (parts.length === 0 || !parts[0]) return "";

    // Pega horas (máximo 2 dígitos)
    let hours = parts[0].slice(0, 2);

    // Valida horas (00-23)
    if (hours.length === 2) {
      const hoursNum = parseInt(hours);
      if (hoursNum > 23) {
        hours = "23";
      }
    }

    // Se digitou mais de 2 caracteres na hora, move para minutos
    if (parts[0].length > 2 && parts.length === 1) {
      hours = parts[0].slice(0, 2);
      // Revalida após slice
      if (parseInt(hours) > 23) {
        hours = "23";
      }

      let remainingDigits = parts[0].slice(2, 4);
      if (remainingDigits) {
        // Valida minutos (00-59)
        if (remainingDigits.length === 2) {
          const minutesNum = parseInt(remainingDigits);
          if (minutesNum > 59) {
            remainingDigits = "59";
          }
        }
        return `${hours}:${remainingDigits}`;
      }
    }

    // Se só tem horas
    if (parts.length === 1) {
      return hours;
    }

    // Se tem minutos
    let minutes = parts[1].slice(0, 2);

    // Valida minutos (00-59)
    if (minutes.length === 2) {
      const minutesNum = parseInt(minutes);
      if (minutesNum > 59) {
        minutes = "59";
      }
    }

    return hours + (minutes ? `:${minutes}` : ":");
  };

  // Handlers
  const handleAddMeal = () => {
    if (!mealForm.name.trim()) {
      Alert.alert("Atenção", "Digite o nome da refeição");
      return;
    }

    const newMeal = {
      name: mealForm.name,
      type: mealForm.type,
      time: mealForm.time,
      observation: mealForm.observation,
      items: [],
    };

    addMealToBuilder(newMeal);

    Toast.show({
      type: "success",
      text1: "Refeição criada!",
      text2: `${mealForm.name} foi adicionada ao plano`,
      position: "top",
      visibilityTime: 2000,
    });

    setShowAddMealModal(false);
    setMealForm({ name: "", type: "breakfast", time: "", observation: "" });
  };

  // Helper para resetar estados do modal de alimentos
  const resetFoodModal = () => {
    setSelectedFood(null);
    setFoodQuantity("");
    setSelectedMeasurement("gramas");
    setFoodModalStep("search");
    setSearchQuery("");
  };

  const handleOpenFoodSearch = (mealIndex: number) => {
    setCurrentMealId(mealIndex.toString());
    resetFoodModal();
    setShowFoodSearchModal(true);
  };

  const handleSelectFood = (food: any) => {
    setSelectedFood(food);
    setFoodQuantity("");
    setSelectedMeasurement("gramas");
    setFoodModalStep("configure"); // Muda para tela de configuração
  };

  const handleCloseFoodModal = () => {
    setShowFoodSearchModal(false);
    setCurrentMealId(null);
    resetFoodModal();
  };

  const convertToGrams = (
    quantity: number,
    measurement: "gramas" | HouseholdMeasure
  ): number => {
    if (measurement === "gramas") return quantity;
    const measure = HOUSEHOLD_MEASURES.find((m) => m.id === measurement);
    return measure ? quantity * measure.gramsEquivalent : quantity;
  };

  const calculateFoodNutrition = (food: any, quantityInGrams: number) => {
    const ratio = quantityInGrams / 100; // Nutrition values are per 100g
    return {
      calories: (food.energyKcal || 0) * ratio,
      protein: (food.protein || 0) * ratio,
      carbs: (food.carbohydrate || 0) * ratio,
      fat: (food.lipids || 0) * ratio,
      fiber: (food.fiber || 0) * ratio,
    };
  };

  // Calcular preview de nutrição em tempo real
  const nutritionPreview = useMemo(() => {
    if (!selectedFood || !foodQuantity) return null;

    const quantity = parseFloat(foodQuantity);
    if (isNaN(quantity) || quantity <= 0) return null;

    const quantityInGrams = convertToGrams(quantity, selectedMeasurement);
    return calculateFoodNutrition(selectedFood, quantityInGrams);
  }, [selectedFood, foodQuantity, selectedMeasurement]);

  const handleAddFood = () => {
    if (!selectedFood || currentMealId === null) return;

    const quantity = parseFloat(foodQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert("Atenção", "Digite uma quantidade válida");
      return;
    }

    const quantityInGrams = convertToGrams(quantity, selectedMeasurement);
    const nutrition = calculateFoodNutrition(selectedFood, quantityInGrams);

    // Converter measurementType para formato correto
    const measureType = selectedMeasurement === "gramas" ? "gramas" : "caseira";
    const measureUnit =
      selectedMeasurement !== "gramas"
        ? HOUSEHOLD_MEASURES.find((m) => m.id === selectedMeasurement)
        : undefined;

    const newItem = {
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      category: selectedFood.category?.name || "Outros",
      quantity: quantityInGrams,
      originalQuantity: quantity, // Quantidade original digitada (ex: 12)
      measurementType: measureType, // "gramas" ou "caseira"
      measurementUnit: measureUnit, // Objeto completo da medida caseira
      ...nutrition,
    };

    addItemToMeal(parseInt(currentMealId), newItem);

    // Toast de sucesso
    Toast.show({
      type: "success",
      text1: "Alimento adicionado!",
      text2: `${selectedFood.name} foi adicionado à refeição`,
      position: "top",
      visibilityTime: 2000,
    });

    // Limpar todos os estados do modal
    handleCloseFoodModal();
  };

  const handleRemoveMeal = () => {
    if (mealToRemove !== null) {
      removeMealFromBuilder(mealToRemove);
      setShowConfirmRemoveMeal(false);
      setMealToRemove(null);
    }
  };

  const handleRemoveFood = () => {
    if (foodToRemove) {
      removeItemFromMeal(foodToRemove.mealIndex, foodToRemove.foodIndex);
      setShowConfirmRemoveFood(false);
      setFoodToRemove(null);
    }
  };

  // 🔄 Handlers para gerenciar substituições
  const handleAddSubstitution = (
    food: any,
    quantity: number,
    measurementType: "gramas" | "caseira",
    measurementUnit: any,
    observation: string
  ) => {
    if (!substitutionTarget || !builderState) return;

    const { mealIndex, foodIndex } = substitutionTarget;
    const currentDay = builderState.currentDay;
    const currentItem =
      builderState.mealsByDay[currentDay][mealIndex].items[foodIndex];

    // Calcular quantidade em gramas e nutrição
    let gramsAmount = quantity;
    if (measurementType === "caseira" && measurementUnit) {
      gramsAmount = quantity * (measurementUnit.gramsEquivalent || 0);
    }
    const factor = gramsAmount / 100;

    const substitution = {
      id: `temp-sub-${Date.now()}`,
      foodId: food.id,
      foodName: food.name,
      category: food.category?.name || "Sem categoria",
      quantity: gramsAmount,
      originalQuantity: measurementType === "caseira" ? quantity : undefined, // Quantidade original para medidas caseiras
      measurementType:
        measurementType === "gramas" ? "gramas" : measurementType,
      measurementUnit:
        measurementType === "caseira" ? measurementUnit : undefined,
      observation,
      calories: Math.round((food.energyKcal || 0) * factor),
      protein: parseFloat(((food.protein || 0) * factor).toFixed(1)),
      carbs: parseFloat(((food.carbohydrate || 0) * factor).toFixed(1)),
      fat: parseFloat(((food.lipids || 0) * factor).toFixed(1)),
      fiber: parseFloat(((food.fiber || 0) * factor).toFixed(1)),
    };

    // Atualizar item com nova substituição
    const updatedItem = {
      ...currentItem,
      substitutions: [...(currentItem.substitutions || []), substitution],
    };

    updateItemInMeal(mealIndex, foodIndex, updatedItem);

    // Limpar estado e fechar modal
    setSubstitutionTarget(null);
    setShowAddSubstitutionModal(false);

    Toast.show({
      type: "success",
      text1: "Substituição adicionada! 🔄",
      text2: `${food.name} pode substituir este alimento`,
      position: "top",
      visibilityTime: 2000,
    });
  };

  const handleRemoveSubstitution = (
    mealIdx: number,
    foodIdx: number,
    subIdx: number
  ) => {
    if (!builderState) return;

    const currentDay = builderState.currentDay;
    const currentItem =
      builderState.mealsByDay[currentDay][mealIdx].items[foodIdx];

    const updatedSubstitutions = [...(currentItem.substitutions || [])];
    const removedSub = updatedSubstitutions.splice(subIdx, 1);

    const updatedItem = {
      ...currentItem,
      substitutions: updatedSubstitutions,
    };

    updateItemInMeal(mealIdx, foodIdx, updatedItem);

    Toast.show({
      type: "info",
      text1: "Substituição removida",
      text2: removedSub?.[0]?.foodName
        ? `${removedSub[0].foodName} removido`
        : undefined,
      position: "top",
      visibilityTime: 2000,
    });
  };

  const handleLoadMoreFoods = async () => {
    if (loadingFoods || !hasMoreFoods) return;

    const nextPage = foodsPage + 1;
    setFoodsPage(nextPage);

    try {
      await searchFoods({
        search: searchQuery || undefined,
        page: nextPage,
        limit: 50,
      });

      // Após 5 páginas (250 alimentos), desabilita "carregar mais"
      if (nextPage >= 5) {
        setHasMoreFoods(false);
      }
    } catch (error) {
      console.error("Erro ao carregar mais alimentos:", error);
    }
  };

  const handleCopyMeals = async (sourceDay: DayOfWeek) => {
    if (!builderState) return;

    try {
      copyMealsToDay(sourceDay, builderState.currentDay);
      setShowCopyMealModal(false);

      Toast.show({
        type: "success",
        text1: "Refeições copiadas! 📋",
        text2: "As refeições foram copiadas com sucesso",
        position: "top",
        visibilityTime: 2000,
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Erro ao copiar refeições",
        text2: "Tente novamente em alguns instantes",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  const handleSavePlan = async () => {
    const meals = (builderState as any)?.meals || [];

    if (meals.length === 0) {
      Alert.alert("Atenção", "Adicione pelo menos uma refeição");
      return;
    }

    const hasFoodsInAllMeals = meals.every(
      (meal: any) => meal.items && meal.items.length > 0
    );
    if (!hasFoodsInAllMeals) {
      Alert.alert(
        "Atenção",
        "Todas as refeições devem ter pelo menos um alimento"
      );
      return;
    }

    setSaving(true);
    try {
      await savePlanFromBuilder();

      Toast.show({
        type: "success",
        text1: "Plano salvo com sucesso! 🎉",
        text2: "O plano alimentar foi criado",
        position: "top",
        visibilityTime: 3000,
      });

      // Navegar para PatientDetails com reload da aba de planos
      const patientId = builderState?.patientId;
      if (patientId) {
        setTimeout(() => {
          navigation.navigate("PatientDetails", {
            patientId,
            initialTab: "plans",
            shouldReload: true,
          });
        }, 1500);
      } else {
        setTimeout(() => navigation.goBack(), 1500);
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Erro ao salvar plano",
        text2: "Tente novamente em alguns instantes",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  const meals = (builderState as any)?.meals || [];
  const goals = {
    calories: builderState?.targetCalories || 0,
    protein: builderState?.targetProtein || 0,
    carbs: builderState?.targetCarbs || 0,
    fat: builderState?.targetFat || 0,
    fiber: builderState?.targetFiber || 0,
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        {/* Step Header with Save Button */}
        <StepHeader
          currentStep={2}
          totalSteps={2}
          title="Construir Refeições"
          onBackPress={onPrevious}
          rightAction={{
            icon: "checkmark",
            onPress: handleSavePlan,
            loading: saving,
            disabled: saving,
          }}
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Step Progress Bar */}
            <View style={styles.stepIndicator}>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarActive} />
                <View style={styles.progressBarActive} />
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <Text style={styles.sectionTitle}>Progresso das Metas</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(progress.calories, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {planNutrition.calories.toFixed(0)} / {goals.calories || 0} kcal
                ({progress.calories.toFixed(0)}%)
              </Text>
            </View>

            {/* Nutrition Cards */}
            <View style={styles.nutritionCardsGrid}>
              <View style={styles.nutritionCard}>
                <Ionicons name="flame" size={20} color="#FF6B6B" />
                <View style={styles.nutritionInfo}>
                  <Text style={styles.nutritionLabel}>Proteína</Text>
                  <Text style={styles.nutritionValue}>
                    {planNutrition.protein.toFixed(1)}g / {goals.protein || 0}g
                  </Text>
                </View>
              </View>

              <View style={styles.nutritionCard}>
                <Ionicons name="nutrition" size={20} color="#4ECDC4" />
                <View style={styles.nutritionInfo}>
                  <Text style={styles.nutritionLabel}>Carboidratos</Text>
                  <Text style={styles.nutritionValue}>
                    {planNutrition.carbs.toFixed(1)}g / {goals.carbs || 0}g
                  </Text>
                </View>
              </View>

              <View style={styles.nutritionCard}>
                <Ionicons name="water" size={20} color="#FFD93D" />
                <View style={styles.nutritionInfo}>
                  <Text style={styles.nutritionLabel}>Gorduras</Text>
                  <Text style={styles.nutritionValue}>
                    {planNutrition.fat.toFixed(1)}g / {goals.fat || 0}g
                  </Text>
                </View>
              </View>

              <View style={styles.nutritionCard}>
                <Ionicons name="leaf" size={20} color="#95E1D3" />
                <View style={styles.nutritionInfo}>
                  <Text style={styles.nutritionLabel}>Fibras</Text>
                  <Text style={styles.nutritionValue}>
                    {planNutrition.fiber.toFixed(1)}g / {goals.fiber || 0}g
                  </Text>
                </View>
              </View>
            </View>

            {/* Week Day Tabs */}
            <WeekDayTabs
              currentDay={builderState?.currentDay || DayOfWeek.MONDAY}
              onDayChange={setCurrentDay}
              canAccessDay={canAccessDay}
              filledDays={getFilledDays()}
            />

            {/* Add Meal and Copy Buttons */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.addMealButton, { flex: 1 }]}
                onPress={() => setShowAddMealModal(true)}
              >
                <Ionicons name="add-circle-outline" size={24} color="#4A90E2" />
                <Text style={styles.addMealText}>Adicionar Refeição</Text>
              </TouchableOpacity>

              {getFilledDays().filter((day) => day !== builderState?.currentDay)
                .length > 0 && (
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => setShowCopyMealModal(true)}
                >
                  <Ionicons name="copy-outline" size={22} color="#4A90E2" />
                </TouchableOpacity>
              )}
            </View>

            {/* Meals List */}
            {meals.map((meal: any, mealIndex: number) => (
              <View key={mealIndex} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <View style={styles.mealTitleRow}>
                    <Ionicons
                      name={
                        (MEAL_TYPES.find((t) => t.id === meal.type)
                          ?.icon as any) || "restaurant-outline"
                      }
                      size={20}
                      color="#4A90E2"
                    />
                    <Text style={styles.mealName}>{meal.name}</Text>
                    {meal.time && (
                      <Text style={styles.mealTime}>{meal.time}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setMealToRemove(mealIndex);
                      setShowConfirmRemoveMeal(true);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>

                {meal.observation && (
                  <Text style={styles.mealObservation}>{meal.observation}</Text>
                )}

                {/* Foods in meal */}
                {(meal.items || []).map((item: any, itemIndex: number) => (
                  <View key={itemIndex}>
                    {/* Food Item */}
                    <View style={styles.foodItem}>
                      <View style={styles.foodInfo}>
                        <Text style={styles.foodName}>{item.foodName}</Text>
                        <Text style={styles.foodQuantity}>
                          {item.measurementType !== "gramas" &&
                          item.originalQuantity &&
                          item.measurementUnit
                            ? `${item.originalQuantity} ${
                                item.measurementUnit.name
                              } (${item.quantity?.toFixed(0) || 0}g)`
                            : `${item.quantity?.toFixed(0) || 0}g`}
                        </Text>
                        <Text style={styles.foodNutrition}>
                          {item.calories?.toFixed(0) || 0} kcal | P:{" "}
                          {item.protein?.toFixed(1) || 0}g | C:{" "}
                          {item.carbs?.toFixed(1) || 0}g | G:{" "}
                          {item.fat?.toFixed(1) || 0}g
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setFoodToRemove({ mealIndex, foodIndex: itemIndex });
                          setShowConfirmRemoveFood(true);
                        }}
                      >
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color="#FF6B6B"
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Substitutions List - Accordion */}
                    {item.substitutions && item.substitutions.length > 0 && (
                      <View
                        style={{
                          marginTop: 8,
                          marginBottom: 4,
                          borderWidth: 1,
                          borderColor: "#E9D5FF",
                          borderRadius: 8,
                          overflow: "hidden",
                        }}
                      >
                        <TouchableOpacity
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            backgroundColor: "#FAF5FF",
                          }}
                          onPress={() => {
                            const key = `${mealIndex}-${itemIndex}`;
                            setExpandedSubstitutions((prev) => {
                              const newSet = new Set(prev);
                              if (newSet.has(key)) {
                                newSet.delete(key);
                              } else {
                                newSet.add(key);
                              }
                              return newSet;
                            });
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Ionicons
                              name="swap-horizontal"
                              size={16}
                              color="#8B5CF6"
                            />
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: "600",
                                color: "#8B5CF6",
                              }}
                            >
                              Substituições ({item.substitutions.length})
                            </Text>
                          </View>
                          <Ionicons
                            name={
                              expandedSubstitutions.has(
                                `${mealIndex}-${itemIndex}`
                              )
                                ? "chevron-up"
                                : "chevron-down"
                            }
                            size={18}
                            color="#8B5CF6"
                          />
                        </TouchableOpacity>

                        {expandedSubstitutions.has(
                          `${mealIndex}-${itemIndex}`
                        ) && (
                          <View
                            style={{ padding: 12, backgroundColor: "#FFFFFF" }}
                          >
                            {item.substitutions.map(
                              (sub: any, subIdx: number) => {
                                return (
                                  <SubstitutionItem
                                    key={subIdx}
                                    substitution={sub}
                                    onRemove={() =>
                                      handleRemoveSubstitution(
                                        mealIndex,
                                        itemIndex,
                                        subIdx
                                      )
                                    }
                                    showRemoveButton={true}
                                  />
                                );
                              }
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                ))}

                {/* Add Food Button */}
                <TouchableOpacity
                  style={styles.addFoodButton}
                  onPress={() => handleOpenFoodSearch(mealIndex)}
                >
                  <Ionicons name="add" size={18} color="#4A90E2" />
                  <Text style={styles.addFoodText}>Adicionar Alimento</Text>
                </TouchableOpacity>

                {/* 🔄 Add Substitution Button */}
                {meal.items && meal.items.length > 0 && (
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#F5F3FF",
                      borderWidth: 1.5,
                      borderStyle: "dashed",
                      borderColor: "#8B5CF6",
                      borderRadius: 8,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      marginTop: 12,
                    }}
                    onPress={() => {
                      // Se houver apenas 1 alimento, abre o modal diretamente
                      if (meal.items.length === 1) {
                        setSubstitutionTarget({
                          mealIndex,
                          foodIndex: 0,
                        });
                        setShowAddSubstitutionModal(true);
                        return;
                      }

                      // Se houver múltiplos alimentos, mostra modal customizado
                      setFoodsForSubstitution({
                        mealIndex,
                        items: meal.items,
                      });
                      setShowFoodSelectionModal(true);
                    }}
                  >
                    <Ionicons
                      name="swap-horizontal-outline"
                      size={20}
                      color="#8B5CF6"
                    />
                    <Text
                      style={{
                        marginLeft: 8,
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#8B5CF6",
                      }}
                    >
                      Gerenciar Substituições
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {meals.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="restaurant-outline" size={64} color="#CCC" />
                <Text style={styles.emptyText}>
                  Nenhuma refeição adicionada
                </Text>
                <Text style={styles.emptyHint}>
                  Toque em &quot;Adicionar Refeição&quot; para começar
                </Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Add Meal Modal */}
        <Modal
          visible={showAddMealModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowAddMealModal(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            <View style={styles.modalContentMeal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nova Refeição</Text>
                <TouchableOpacity onPress={() => setShowAddMealModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.inputLabel}>Nome da Refeição *</Text>
                <TextInput
                  style={styles.input}
                  value={mealForm.name}
                  onChangeText={(text) =>
                    setMealForm({ ...mealForm, name: text })
                  }
                  placeholder="Ex: Café da Manhã"
                  placeholderTextColor={lightTheme.colors.gray[400]}
                />

                <Text style={styles.inputLabel}>Tipo</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.typePicker}
                >
                  {MEAL_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeButton,
                        mealForm.type === type.id && styles.typeButtonActive,
                      ]}
                      onPress={() =>
                        setMealForm({ ...mealForm, type: type.id as MealType })
                      }
                    >
                      <Ionicons
                        name={type.icon as any}
                        size={20}
                        color={mealForm.type === type.id ? "#FFF" : "#4A90E2"}
                      />
                      <Text
                        style={[
                          styles.typeButtonText,
                          mealForm.type === type.id &&
                            styles.typeButtonTextActive,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>Horário (opcional)</Text>
                <TextInput
                  style={styles.input}
                  value={mealForm.time}
                  onChangeText={(text) => {
                    const formatted = formatTimeInput(text);
                    setMealForm({ ...mealForm, time: formatted });
                  }}
                  placeholder="Ex: 08:00"
                  placeholderTextColor={lightTheme.colors.gray[400]}
                  keyboardType="numeric"
                  maxLength={5}
                />

                <Text style={styles.inputLabel}>Observação (opcional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={mealForm.observation}
                  onChangeText={(text) =>
                    setMealForm({ ...mealForm, observation: text })
                  }
                  placeholder="Observações sobre esta refeição"
                  placeholderTextColor={lightTheme.colors.gray[400]}
                  multiline
                  numberOfLines={3}
                />

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { marginBottom: insets.bottom + 12 },
                  ]}
                  onPress={handleAddMeal}
                >
                  <Text style={styles.primaryButtonText}>
                    Adicionar Refeição
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Food Search Modal */}
        <Modal
          visible={showFoodSearchModal}
          animationType="slide"
          transparent
          onRequestClose={handleCloseFoodModal}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={{ flex: 1, justifyContent: "flex-end" }}
            >
              <View
                style={[
                  styles.modalContentFood,
                  { paddingBottom: insets.bottom || lightTheme.spacing[2] },
                ]}
              >
                {/* Header com navegação */}
                <View style={styles.modalHeader}>
                  {foodModalStep === "configure" && (
                    <TouchableOpacity
                      onPress={() => {
                        setFoodModalStep("search");
                        setSelectedFood(null);
                      }}
                      style={{ padding: lightTheme.spacing[2] }}
                    >
                      <Ionicons
                        name="arrow-back"
                        size={24}
                        color={lightTheme.colors.gray[700]}
                      />
                    </TouchableOpacity>
                  )}
                  {foodModalStep !== "configure" && (
                    <View style={{ width: 40 }} />
                  )}
                  <Text
                    style={[
                      styles.modalTitle,
                      { flex: 1, textAlign: "center" },
                    ]}
                  >
                    {foodModalStep === "search"
                      ? "Selecionar Alimento"
                      : "Configurar Alimento"}
                  </Text>
                  <TouchableOpacity
                    onPress={handleCloseFoodModal}
                    style={{ padding: lightTheme.spacing[2] }}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={lightTheme.colors.gray[700]}
                    />
                  </TouchableOpacity>
                </View>

                {/* Step 1: Search Food */}
                {foodModalStep === "search" && (
                  <>
                    <TextInput
                      style={styles.searchInput}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Buscar alimento..."
                      placeholderTextColor={lightTheme.colors.gray[400]}
                      autoCapitalize="none"
                    />

                    {/* Recent Searches - Feature 1 */}
                    {!searchQuery.trim() &&
                      !selectedFood &&
                      Array.isArray(recentSearches) &&
                      recentSearches.length > 0 && (
                        <View style={styles.recentSearchesContainer}>
                          <View style={styles.recentSearchesHeader}>
                            <Text style={styles.recentSearchesTitle}>
                              Buscas recentes
                            </Text>
                            <TouchableOpacity
                              onPress={() => clearRecentSearches?.()}
                            >
                              <Text style={styles.clearRecentText}>Limpar</Text>
                            </TouchableOpacity>
                          </View>
                          <View style={styles.recentSearchesList}>
                            {recentSearches.map((term) => (
                              <TouchableOpacity
                                key={term}
                                onPress={() => {
                                  setSearchQuery(term);
                                  addRecentSearch?.(term);
                                }}
                                style={styles.recentSearchItem}
                              >
                                <Ionicons
                                  name="time-outline"
                                  size={14}
                                  color="#666"
                                />
                                <Text style={styles.recentSearchText}>
                                  {term}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}

                    <FlatList
                      data={filteredFoods}
                      keyExtractor={(item: any) => item.id}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.foodSearchItem}
                          onPress={() => handleSelectFood(item)}
                        >
                          <Text style={styles.foodSearchName}>{item.name}</Text>
                          <Text style={styles.foodSearchInfo}>
                            {item.energyKcal?.toFixed(0) || 0} kcal/100g
                          </Text>
                        </TouchableOpacity>
                      )}
                      ListEmptyComponent={
                        loadingFoods ? (
                          <ActivityIndicator
                            size="large"
                            color="#4A90E2"
                            style={{ marginTop: 20 }}
                          />
                        ) : (
                          <Text style={styles.emptySearchText}>
                            Nenhum alimento encontrado
                          </Text>
                        )
                      }
                      ListFooterComponent={
                        filteredFoods.length > 0 && hasMoreFoods ? (
                          <TouchableOpacity
                            style={styles.loadMoreButton}
                            onPress={handleLoadMoreFoods}
                            disabled={loadingFoods}
                          >
                            {loadingFoods ? (
                              <ActivityIndicator size="small" color="#4A90E2" />
                            ) : (
                              <>
                                <Ionicons
                                  name="arrow-down-circle-outline"
                                  size={20}
                                  color="#4A90E2"
                                />
                                <Text style={styles.loadMoreText}>
                                  Carregar mais alimentos
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        ) : null
                      }
                    />
                  </>
                )}

                {/* Step 2: Configure Food */}
                {foodModalStep === "configure" && selectedFood && (
                  <>
                    <ScrollView
                      style={styles.configContainer}
                      contentContainerStyle={styles.configScrollContent}
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={false}
                    >
                      {/* Selected Food Card - Azul claro igual AddSubstitutionModal */}
                      <View style={styles.selectedFoodCard}>
                        <View style={styles.selectedFoodHeader}>
                          <Ionicons
                            name="restaurant"
                            size={24}
                            color={lightTheme.colors.primary}
                          />
                          <View style={styles.selectedFoodInfoContainer}>
                            <Text style={styles.selectedFoodName}>
                              {selectedFood.name}
                            </Text>
                            <Text style={styles.selectedFoodCategory}>
                              {selectedFood.category?.name || "Sem categoria"}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Quantity Input + Toggle - mesma linha */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Quantidade *</Text>
                        <View style={styles.quantityRow}>
                          <TextInput
                            style={styles.quantityInput}
                            value={foodQuantity}
                            onChangeText={setFoodQuantity}
                            placeholder="0"
                            placeholderTextColor={lightTheme.colors.gray[400]}
                            keyboardType="numeric"
                          />
                          <View style={styles.measurementToggle}>
                            <TouchableOpacity
                              style={[
                                styles.measurementButton,
                                selectedMeasurement === "gramas" &&
                                  styles.measurementButtonActive,
                              ]}
                              onPress={() => setSelectedMeasurement("gramas")}
                            >
                              <Text
                                style={[
                                  styles.measurementButtonText,
                                  selectedMeasurement === "gramas" &&
                                    styles.measurementButtonTextActive,
                                ]}
                              >
                                Gramas
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.measurementButton,
                                selectedMeasurement !== "gramas" &&
                                  styles.measurementButtonActive,
                              ]}
                              onPress={() =>
                                setSelectedMeasurement("colher_sopa")
                              }
                            >
                              <Text
                                style={[
                                  styles.measurementButtonText,
                                  selectedMeasurement !== "gramas" &&
                                    styles.measurementButtonTextActive,
                                ]}
                              >
                                Caseira
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>

                      {/* Household Measures Modal Suspenso */}
                      {selectedMeasurement !== "gramas" && (
                        <View style={styles.inputGroup}>
                          <Text style={styles.label}>Medida Caseira *</Text>
                          <TouchableOpacity
                            style={styles.measurementSelector}
                            onPress={() => setShowMeasuresModal(true)}
                          >
                            <View style={styles.measurementSelectorContent}>
                              <Text style={styles.measurementSelectorText}>
                                {HOUSEHOLD_MEASURES.find(
                                  (m) => m.id === selectedMeasurement
                                )?.name || "Selecione uma medida"}{" "}
                                (
                                {HOUSEHOLD_MEASURES.find(
                                  (m) => m.id === selectedMeasurement
                                )?.gramsEquivalent || 0}
                                g)
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

                      {/* Observation - Campo Opcional */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Observação (Opcional)</Text>
                        <TextInput
                          style={styles.observationInput}
                          value={mealForm.observation}
                          onChangeText={(text) =>
                            setMealForm({ ...mealForm, observation: text })
                          }
                          placeholder="Ex: Observações sobre este alimento"
                          placeholderTextColor={lightTheme.colors.gray[400]}
                          multiline
                          numberOfLines={3}
                        />
                      </View>

                      {/* Nutrition Preview */}
                      {nutritionPreview && (
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
                                {nutritionPreview.calories.toFixed(0)}
                              </Text>
                              <Text style={styles.nutritionLabel}>kcal</Text>
                            </View>
                            <View style={styles.nutritionItem}>
                              <Text style={styles.nutritionValue}>
                                {nutritionPreview.protein.toFixed(1)}g
                              </Text>
                              <Text style={styles.nutritionLabel}>
                                Proteínas
                              </Text>
                            </View>
                            <View style={styles.nutritionItem}>
                              <Text style={styles.nutritionValue}>
                                {nutritionPreview.carbs.toFixed(1)}g
                              </Text>
                              <Text style={styles.nutritionLabel}>Carbos</Text>
                            </View>
                            <View style={styles.nutritionItem}>
                              <Text style={styles.nutritionValue}>
                                {nutritionPreview.fat.toFixed(1)}g
                              </Text>
                              <Text style={styles.nutritionLabel}>
                                Gorduras
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}
                    </ScrollView>

                    {/* Action Buttons - FORA do ScrollView */}
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setFoodModalStep("search");
                          setSelectedFood(null);
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Voltar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={handleAddFood}
                      >
                        <Ionicons
                          name="add-circle"
                          size={20}
                          color={lightTheme.colors.white}
                        />
                        <Text style={styles.addButtonText}>Adicionar</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

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
                {
                  paddingBottom: Math.max(insets.bottom, lightTheme.spacing[4]),
                },
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
                      selectedMeasurement === item.id &&
                        styles.measureItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedMeasurement(item.id as HouseholdMeasure);
                      setShowMeasuresModal(false);
                    }}
                  >
                    <View style={styles.measureItemContent}>
                      <Text
                        style={[
                          styles.measureItemName,
                          selectedMeasurement === item.id &&
                            styles.measureItemNameSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text style={styles.measureItemGrams}>
                        {item.gramsEquivalent}g
                      </Text>
                    </View>
                    {selectedMeasurement === item.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={lightTheme.colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Confirm Remove Meal Modal */}
        <Modal
          visible={showConfirmRemoveMeal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowConfirmRemoveMeal(false)}
        >
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmDialog}>
              <Ionicons name="warning" size={48} color="#FF6B6B" />
              <Text style={styles.confirmTitle}>Remover Refeição?</Text>
              <Text style={styles.confirmMessage}>
                Esta ação não pode ser desfeita. Todos os alimentos desta
                refeição serão removidos.
              </Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={styles.confirmCancelButton}
                  onPress={() => setShowConfirmRemoveMeal(false)}
                >
                  <Text style={styles.confirmCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmDeleteButton}
                  onPress={handleRemoveMeal}
                >
                  <Text style={styles.confirmDeleteText}>Remover</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Confirm Remove Food Modal */}
        <Modal
          visible={showConfirmRemoveFood}
          animationType="fade"
          transparent
          onRequestClose={() => setShowConfirmRemoveFood(false)}
        >
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmDialog}>
              <Ionicons name="warning" size={48} color="#FF6B6B" />
              <Text style={styles.confirmTitle}>Remover Alimento?</Text>
              <Text style={styles.confirmMessage}>
                Este alimento será removido da refeição.
              </Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={styles.confirmCancelButton}
                  onPress={() => setShowConfirmRemoveFood(false)}
                >
                  <Text style={styles.confirmCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmDeleteButton}
                  onPress={handleRemoveFood}
                >
                  <Text style={styles.confirmDeleteText}>Remover</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Copy Meal Modal */}
        <CopyMealModal
          visible={showCopyMealModal}
          currentDay={builderState?.currentDay || DayOfWeek.MONDAY}
          filledDays={getFilledDays()}
          mealCountByDay={getMealCountByDay()}
          onClose={() => setShowCopyMealModal(false)}
          onCopy={handleCopyMeals}
        />

        {/* Food Selection Modal for Substitutions */}
        <Modal
          visible={showFoodSelectionModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowFoodSelectionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.foodSelectionModalContent,
                { paddingBottom: insets.bottom || lightTheme.spacing[4] },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecione o Alimento</Text>
                <TouchableOpacity
                  onPress={() => setShowFoodSelectionModal(false)}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <Text style={styles.foodSelectionSubtitle}>
                Escolha qual alimento deseja adicionar substituições:
              </Text>

              <FlatList
                data={foodsForSubstitution?.items || []}
                keyExtractor={(item, index) => `food-${index}`}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={styles.foodSelectionItem}
                    onPress={() => {
                      setSubstitutionTarget({
                        mealIndex: foodsForSubstitution?.mealIndex || 0,
                        foodIndex: index,
                      });
                      setShowFoodSelectionModal(false);
                      setShowAddSubstitutionModal(true);
                    }}
                  >
                    <View style={styles.foodSelectionItemContent}>
                      <Ionicons
                        name="restaurant"
                        size={24}
                        color={lightTheme.colors.primary}
                      />
                      <View style={styles.foodSelectionItemInfo}>
                        <Text style={styles.foodSelectionItemName}>
                          {item.foodName}
                        </Text>
                        <Text style={styles.foodSelectionItemQuantity}>
                          {item.quantity?.toFixed(0)}g
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={lightTheme.colors.gray[400]}
                    />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    Nenhum alimento disponível
                  </Text>
                }
              />

              <TouchableOpacity
                style={styles.foodSelectionCancelButton}
                onPress={() => setShowFoodSelectionModal(false)}
              >
                <Text style={styles.foodSelectionCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Add Substitution Modal */}
        <AddSubstitutionModal
          visible={showAddSubstitutionModal}
          onClose={() => {
            setShowAddSubstitutionModal(false);
            setSubstitutionTarget(null);
          }}
          onAdd={handleAddSubstitution}
        />

        {/* Toast Component */}
        <Toast />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: lightTheme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  headerTitle: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
    flex: 1,
    marginLeft: lightTheme.spacing[3],
  },
  content: {
    flex: 1,
  },
  stepIndicator: {
    paddingVertical: lightTheme.spacing[5],
    paddingHorizontal: lightTheme.spacing[5],
  },
  progressBarContainer: {
    flexDirection: "row",
    gap: lightTheme.spacing[2],
  },
  progressBarActive: {
    flex: 1,
    height: 4,
    backgroundColor: lightTheme.colors.primary,
    borderRadius: 2,
  },
  progressBarInactive: {
    flex: 1,
    height: 4,
    backgroundColor: lightTheme.colors.gray[200],
    borderRadius: 2,
  },
  progressSection: {
    padding: lightTheme.spacing[4],
    backgroundColor: lightTheme.colors.gray[50],
  },
  sectionTitle: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing[3],
  },
  progressBar: {
    height: 8,
    backgroundColor: lightTheme.colors.gray[200],
    borderRadius: lightTheme.borderRadius.sm,
    overflow: "hidden",
    marginBottom: lightTheme.spacing[2],
  },
  progressFill: {
    height: "100%",
    backgroundColor: lightTheme.colors.primary,
  },
  progressText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
  },
  nutritionCardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: lightTheme.spacing[3],
  },
  nutritionCard: {
    width: "48%",
    backgroundColor: lightTheme.colors.white,
    padding: lightTheme.spacing[2],
    margin: "1%",
    borderRadius: lightTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    flexDirection: "row",
    alignItems: "center",
  },
  nutritionInfo: {
    flex: 1,
    marginLeft: lightTheme.spacing[2],
  },
  nutritionLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
  },
  nutritionValue: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
    marginTop: 2,
  },
  addMealButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: lightTheme.spacing[4],
    margin: lightTheme.spacing[4],
    backgroundColor: lightTheme.colors.primaryBackground,
    borderRadius: lightTheme.borderRadius.lg,
    borderWidth: 2,
    borderColor: lightTheme.colors.primary,
    borderStyle: "dashed",
  },
  addMealText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.primary,
    marginLeft: lightTheme.spacing[2],
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: lightTheme.spacing[4],
    gap: lightTheme.spacing[2],
  },
  copyButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: lightTheme.colors.primaryBackground,
    borderRadius: lightTheme.borderRadius.lg,
    borderWidth: 2,
    borderColor: lightTheme.colors.primary,
    borderStyle: "dashed",
  },
  mealCard: {
    margin: lightTheme.spacing[4],
    marginTop: 0,
    padding: lightTheme.spacing[4],
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  mealTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  mealName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
    marginLeft: lightTheme.spacing[2],
    flex: 1,
  },
  mealTime: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginLeft: lightTheme.spacing[2],
  },
  mealObservation: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    fontStyle: "italic",
    marginBottom: lightTheme.spacing[3],
  },
  foodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: lightTheme.spacing[3],
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: lightTheme.borderRadius.md,
    marginBottom: lightTheme.spacing[2],
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing[1],
  },
  foodQuantity: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.primary,
    marginBottom: lightTheme.spacing[1],
  },
  foodNutrition: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
  },
  addFoodButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: lightTheme.spacing[3],
    marginTop: lightTheme.spacing[2],
    backgroundColor: lightTheme.colors.primaryBackground,
    borderRadius: lightTheme.borderRadius.md,
  },
  addFoodText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.primary,
    marginLeft: lightTheme.spacing[1],
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[400],
    marginTop: lightTheme.spacing[4],
  },
  emptyHint: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[300],
    marginTop: lightTheme.spacing[2],
    textAlign: "center",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: lightTheme.colors.white,
    borderTopLeftRadius: lightTheme.borderRadius["2xl"],
    borderTopRightRadius: lightTheme.borderRadius["2xl"],
    height: "90%",
    maxHeight: "90%",
  },
  modalContentMeal: {
    backgroundColor: lightTheme.colors.white,
    borderTopLeftRadius: lightTheme.borderRadius["2xl"],
    borderTopRightRadius: lightTheme.borderRadius["2xl"],
    maxHeight: "90%",
  },
  modalContentFood: {
    backgroundColor: lightTheme.colors.white,
    borderTopLeftRadius: lightTheme.borderRadius["2xl"],
    borderTopRightRadius: lightTheme.borderRadius["2xl"],
    height: "80%",
    maxHeight: "80%",
    paddingTop: lightTheme.spacing[2],
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  modalScrollContent: {
    padding: lightTheme.spacing[4],
    paddingTop: lightTheme.spacing[2],
  },
  modalTitle: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
  },
  inputLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing[2],
    marginTop: lightTheme.spacing[3],
  },
  input: {
    backgroundColor: lightTheme.colors.white,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    borderRadius: lightTheme.borderRadius.md,
    padding: lightTheme.spacing[3],
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[900],
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    marginBottom: lightTheme.spacing[2],
  },
  typePicker: {
    marginBottom: lightTheme.spacing[3],
  },
  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: lightTheme.spacing[2],
    paddingHorizontal: lightTheme.spacing[4],
    marginRight: lightTheme.spacing[2],
    borderRadius: lightTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: lightTheme.colors.primary,
    backgroundColor: lightTheme.colors.white,
  },
  typeButtonActive: {
    backgroundColor: lightTheme.colors.primary,
  },
  typeButtonText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.primary,
    marginLeft: lightTheme.spacing[2],
  },
  typeButtonTextActive: {
    color: lightTheme.colors.white,
  },
  primaryButton: {
    backgroundColor: lightTheme.colors.primary,
    padding: lightTheme.spacing[4],
    borderRadius: lightTheme.borderRadius.lg,
    alignItems: "center",
    flex: 1,
  },
  primaryButtonText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.white,
  },
  secondaryButton: {
    backgroundColor: lightTheme.colors.gray[50],
    padding: lightTheme.spacing[4],
    borderRadius: lightTheme.borderRadius.lg,
    alignItems: "center",
    flex: 1,
    marginRight: lightTheme.spacing[2],
  },
  secondaryButtonText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[600],
  },
  searchInput: {
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    borderRadius: lightTheme.borderRadius.md,
    padding: lightTheme.spacing[3],
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[900],
    marginHorizontal: lightTheme.spacing[4],
    marginTop: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[4],
  },
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
  emptySearchText: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[400],
    textAlign: "center",
    marginTop: 40,
  },
  selectedFoodCard: {
    backgroundColor: "#EFF6FF", // Azul claro (cor de alimento)
    borderWidth: 1,
    borderColor: "#BFDBFE", // Azul borda
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing[3],
    marginBottom: lightTheme.spacing[4],
  },
  selectedFoodName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
  },
  selectedFoodInfo: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing[3],
  },
  measurementButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    borderRadius: lightTheme.borderRadius.md,
    padding: lightTheme.spacing[3],
  },
  measurementButtonText: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[900],
  },
  measurementPicker: {
    marginVertical: lightTheme.spacing[3],
  },
  measurementOption: {
    paddingVertical: lightTheme.spacing[2],
    paddingHorizontal: lightTheme.spacing[4],
    marginRight: lightTheme.spacing[2],
    borderRadius: lightTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    backgroundColor: lightTheme.colors.white,
  },
  measurementOptionActive: {
    backgroundColor: lightTheme.colors.primary,
    borderColor: lightTheme.colors.primary,
  },
  measurementOptionText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[900],
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: lightTheme.spacing[5],
  },
  // Confirm modals
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: lightTheme.spacing[5],
  },
  confirmDialog: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing[6],
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  confirmTitle: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
    marginTop: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[2],
  },
  confirmMessage: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
    marginBottom: lightTheme.spacing[6],
  },
  confirmButtons: {
    flexDirection: "row",
    width: "100%",
  },
  confirmCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: lightTheme.borderRadius.md,
    backgroundColor: lightTheme.colors.gray[50],
    marginRight: lightTheme.spacing[2],
    alignItems: "center",
  },
  confirmCancelText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[600],
  },
  confirmDeleteButton: {
    flex: 1,
    padding: 14,
    borderRadius: lightTheme.borderRadius.md,
    backgroundColor: lightTheme.colors.error,
    marginLeft: lightTheme.spacing[2],
    alignItems: "center",
  },
  confirmDeleteText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.white,
  },
  // Recent Searches styles
  recentSearchesContainer: {
    marginBottom: lightTheme.spacing[4],
    paddingHorizontal: lightTheme.spacing[4],
  },
  recentSearchesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: lightTheme.spacing[3],
  },
  recentSearchesTitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
  },
  clearRecentText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.primary,
    fontWeight: lightTheme.typography.fontWeight.medium,
  },
  recentSearchesList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  recentSearchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: lightTheme.spacing[3],
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.full,
    marginRight: lightTheme.spacing[2],
    marginBottom: lightTheme.spacing[2],
  },
  recentSearchText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginLeft: lightTheme.spacing[1],
  },
  // Measurement Toggle Visual styles
  measurementToggleContainer: {
    flexDirection: "row",
    marginBottom: lightTheme.spacing[4],
    borderRadius: lightTheme.borderRadius.lg,
    backgroundColor: lightTheme.colors.gray[100],
    padding: lightTheme.spacing[1],
  },
  measurementToggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: lightTheme.spacing[3],
    paddingHorizontal: lightTheme.spacing[4],
    borderRadius: lightTheme.borderRadius.md,
    gap: lightTheme.spacing[2],
  },
  measurementToggleButtonActive: {
    backgroundColor: lightTheme.colors.primary,
    shadowColor: lightTheme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  measurementToggleText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.primary,
  },
  measurementToggleTextActive: {
    color: lightTheme.colors.white,
  },
  measurementPickerHorizontal: {
    maxHeight: 120,
    marginBottom: lightTheme.spacing[4],
  },
  measurementOptionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[2],
    paddingVertical: lightTheme.spacing[2],
    paddingHorizontal: lightTheme.spacing[4],
    marginRight: lightTheme.spacing[2],
    borderRadius: lightTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: lightTheme.colors.primary,
    backgroundColor: lightTheme.colors.white,
  },
  measurementOptionChipActive: {
    backgroundColor: lightTheme.colors.primary,
  },
  measurementOptionChipText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.primary,
  },
  measurementOptionChipTextActive: {
    color: lightTheme.colors.white,
  },
  measurementOptionChipGrams: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.primary,
  },
  measurementOptionChipGramsActive: {
    color: lightTheme.colors.white,
  },
  // Nutrition Preview styles
  nutritionPreviewContainer: {
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[4],
    borderWidth: 1,
    borderColor: lightTheme.colors.primaryLighter,
  },
  nutritionPreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: lightTheme.spacing[3],
    gap: lightTheme.spacing[2],
  },
  nutritionPreviewTitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.primary,
  },
  nutritionPreviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: lightTheme.spacing[2],
  },
  nutritionPreviewItem: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: lightTheme.colors.white,
    padding: lightTheme.spacing[3],
    borderRadius: lightTheme.borderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
  },
  nutritionPreviewValue: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing[1],
  },
  nutritionPreviewLabel: {
    fontSize: 11,
    color: lightTheme.colors.gray[600],
    fontWeight: lightTheme.typography.fontWeight.medium,
  },
  // Load More Pagination styles
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: lightTheme.spacing[4],
    margin: lightTheme.spacing[4],
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: lightTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: lightTheme.colors.primary,
    gap: lightTheme.spacing[2],
  },
  loadMoreText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.primary,
  },
  // Novos estilos para modal igual ao AddSubstitutionModal
  configContainer: {
    flex: 1,
  },
  configScrollContent: {
    padding: lightTheme.spacing[4],
    paddingBottom: lightTheme.spacing[20],
  },
  selectedFoodHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedFoodInfoContainer: {
    marginLeft: lightTheme.spacing[3],
    flex: 1,
  },
  selectedFoodCategory: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginTop: 2,
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
  },
  quantityInput: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.lg,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[900],
  },
  measurementToggle: {
    flexDirection: "row",
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.lg,
    padding: 4,
  },
  measurementButtonActive: {
    backgroundColor: lightTheme.colors.primary,
  },
  measurementButtonTextActive: {
    color: lightTheme.colors.white,
  },
  measurementSelector: {
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.lg,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
  },
  measurementSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  measurementSelectorText: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[900],
    flex: 1,
  },
  measurementSelectorPlaceholder: {
    color: lightTheme.colors.gray[400],
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
  nutritionGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  nutritionItem: {
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    gap: lightTheme.spacing[3],
    padding: lightTheme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[200],
    backgroundColor: lightTheme.colors.white,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: lightTheme.spacing[3],
    borderRadius: lightTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[700],
  },
  addButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: lightTheme.spacing[3],
    borderRadius: lightTheme.borderRadius.lg,
    backgroundColor: lightTheme.colors.primary,
    gap: lightTheme.spacing[2],
  },
  addButtonText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.white,
  },
  // Estilos do Modal de Medidas Caseiras
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
  measureItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: lightTheme.spacing[4],
    paddingHorizontal: lightTheme.spacing[4],
    borderRadius: lightTheme.borderRadius.lg,
    marginVertical: lightTheme.spacing[1],
    marginHorizontal: lightTheme.spacing[4],
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
  // Food Selection Modal styles
  foodSelectionModalContent: {
    backgroundColor: lightTheme.colors.white,
    borderTopLeftRadius: lightTheme.borderRadius["2xl"],
    borderTopRightRadius: lightTheme.borderRadius["2xl"],
    height: "70%",
    maxHeight: "70%",
    padding: lightTheme.spacing[4],
  },
  foodSelectionSubtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing[4],
    paddingHorizontal: lightTheme.spacing[2],
  },
  foodSelectionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: lightTheme.spacing[4],
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    marginBottom: lightTheme.spacing[3],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
  },
  foodSelectionItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[3],
    flex: 1,
  },
  foodSelectionItemInfo: {
    flex: 1,
  },
  foodSelectionItemName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing[1],
  },
  foodSelectionItemQuantity: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
  },
  foodSelectionCancelButton: {
    padding: lightTheme.spacing[4],
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.lg,
    alignItems: "center",
    marginTop: lightTheme.spacing[3],
  },
  foodSelectionCancelText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[700],
  },
});
