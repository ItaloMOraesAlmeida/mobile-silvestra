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
import { useKeyboardHeight } from "../hooks/useKeyboardHeight";
import { StepHeader } from "../components/StepHeader";
import { DayOfWeek } from "../../../../types/meal-plan.types";
import WeekDayTabs from "../components/WeekDayTabs";
import CopyMealModal from "../components/CopyMealModal";

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

// Household measures data
const HOUSEHOLD_MEASURES = [
  { id: "colher_sopa", name: "Colher de Sopa", grams: 15 },
  { id: "colher_cha", name: "Colher de Chá", grams: 5 },
  { id: "colher_cafe", name: "Colher de Café", grams: 2 },
  { id: "colher_sobremesa", name: "Colher de Sobremesa", grams: 10 },
  { id: "xicara_cha", name: "Xícara de Chá", grams: 200 },
  { id: "copo_americano", name: "Copo Americano", grams: 200 },
  { id: "copo_200ml", name: "Copo 200ml", grams: 200 },
  { id: "copo_300ml", name: "Copo 300ml", grams: 300 },
  { id: "prato_raso", name: "Prato Raso", grams: 250 },
  { id: "prato_fundo", name: "Prato Fundo", grams: 300 },
  { id: "prato_sobremesa", name: "Prato Sobremesa", grams: 150 },
  { id: "concha", name: "Concha", grams: 100 },
  { id: "concha_pequena", name: "Concha Pequena", grams: 60 },
  { id: "escumadeira", name: "Escumadeira", grams: 80 },
  { id: "fatia", name: "Fatia", grams: 50 },
  { id: "fatia_fina", name: "Fatia Fina", grams: 30 },
  { id: "fatia_grossa", name: "Fatia Grossa", grams: 80 },
  { id: "unidade", name: "Unidade", grams: 100 },
  { id: "unidade_pequena", name: "Unidade Pequena", grams: 50 },
  { id: "unidade_media", name: "Unidade Média", grams: 100 },
  { id: "unidade_grande", name: "Unidade Grande", grams: 150 },
  { id: "punhado", name: "Punhado", grams: 40 },
  { id: "porcao", name: "Porção", grams: 100 },
];

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
  const keyboardHeight = useKeyboardHeight();
  const insets = useSafeAreaInsets();

  // Store hooks
  const {
    builderState,
    addMealToBuilder,
    removeMealFromBuilder,
    addItemToMeal,
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
  const [showMeasurementPicker, setShowMeasurementPicker] = useState(false);
  const [foodsPage, setFoodsPage] = useState(1);
  const [hasMoreFoods, setHasMoreFoods] = useState(true);

  // Confirm states
  const [mealToRemove, setMealToRemove] = useState<number | null>(null);
  const [foodToRemove, setFoodToRemove] = useState<{
    mealIndex: number;
    foodIndex: number;
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

  const handleOpenFoodSearch = (mealIndex: number) => {
    setCurrentMealId(mealIndex.toString());
    setSearchQuery("");
    setSelectedFood(null);
    setFoodQuantity("");
    setSelectedMeasurement("gramas");
    setShowFoodSearchModal(true);
  };

  const handleSelectFood = (food: any) => {
    setSelectedFood(food);
    setFoodQuantity("");
    setSelectedMeasurement("gramas");
  };

  const convertToGrams = (
    quantity: number,
    measurement: "gramas" | HouseholdMeasure
  ): number => {
    if (measurement === "gramas") return quantity;
    const measure = HOUSEHOLD_MEASURES.find((m) => m.id === measurement);
    return measure ? quantity * measure.grams : quantity;
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

    setShowFoodSearchModal(false);
    setCurrentMealId(null);
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
            <View style={styles.nutritionGrid}>
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
                  <View key={itemIndex} style={styles.foodItem}>
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodName}>{item.foodName}</Text>
                      <Text style={styles.foodQuantity}>
                        {item.measurementType !== "gramas" &&
                        item.originalQuantity
                          ? `${item.originalQuantity} ${
                              HOUSEHOLD_MEASURES.find(
                                (m) => m.id === item.measurementType
                              )?.name || item.measurementType
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
                      <Ionicons name="close-circle" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
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
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalContent, { marginBottom: keyboardHeight }]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nova Refeição</Text>
                <TouchableOpacity onPress={() => setShowAddMealModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
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
            <View
              style={[styles.modalContent, { marginBottom: keyboardHeight }]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Adicionar Alimento</Text>
                <TouchableOpacity onPress={() => setShowFoodSearchModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

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
                      <TouchableOpacity onPress={() => clearRecentSearches?.()}>
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
                          <Text style={styles.recentSearchText}>{term}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

              {!selectedFood ? (
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
              ) : (
                <ScrollView>
                  <View style={styles.selectedFoodCard}>
                    <Text style={styles.selectedFoodName}>
                      {selectedFood.name}
                    </Text>
                    <Text style={styles.selectedFoodInfo}>
                      {selectedFood.energyKcal?.toFixed(0) || 0} kcal | P:{" "}
                      {selectedFood.protein?.toFixed(1) || 0}g | C:{" "}
                      {selectedFood.carbohydrate?.toFixed(1) || 0}g | G:{" "}
                      {selectedFood.lipids?.toFixed(1) || 0}g (por 100g)
                    </Text>

                    <Text style={styles.inputLabel}>Quantidade *</Text>
                    <TextInput
                      style={styles.input}
                      value={foodQuantity}
                      onChangeText={setFoodQuantity}
                      placeholder="Ex: 150"
                      placeholderTextColor={lightTheme.colors.gray[400]}
                      keyboardType="numeric"
                    />

                    {/* Toggle Visual para Tipo de Medida */}
                    <Text style={styles.inputLabel}>Tipo de Medida</Text>
                    <View style={styles.measurementToggleContainer}>
                      <TouchableOpacity
                        style={[
                          styles.measurementToggleButton,
                          selectedMeasurement === "gramas" &&
                            styles.measurementToggleButtonActive,
                        ]}
                        onPress={() => {
                          setSelectedMeasurement("gramas");
                          setShowMeasurementPicker(false);
                        }}
                      >
                        <Ionicons
                          name="scale-outline"
                          size={20}
                          color={
                            selectedMeasurement === "gramas"
                              ? "#FFF"
                              : "#4A90E2"
                          }
                        />
                        <Text
                          style={[
                            styles.measurementToggleText,
                            selectedMeasurement === "gramas" &&
                              styles.measurementToggleTextActive,
                          ]}
                        >
                          Gramas
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.measurementToggleButton,
                          selectedMeasurement !== "gramas" &&
                            styles.measurementToggleButtonActive,
                        ]}
                        onPress={() => {
                          if (selectedMeasurement === "gramas") {
                            setSelectedMeasurement("colher_sopa");
                          }
                          setShowMeasurementPicker(!showMeasurementPicker);
                        }}
                      >
                        <Ionicons
                          name="restaurant-outline"
                          size={20}
                          color={
                            selectedMeasurement !== "gramas"
                              ? "#FFF"
                              : "#4A90E2"
                          }
                        />
                        <Text
                          style={[
                            styles.measurementToggleText,
                            selectedMeasurement !== "gramas" &&
                              styles.measurementToggleTextActive,
                          ]}
                        >
                          Medida Caseira
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Picker Horizontal de Medidas Caseiras */}
                    {selectedMeasurement !== "gramas" && (
                      <ScrollView
                        style={styles.measurementPickerHorizontal}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                      >
                        {HOUSEHOLD_MEASURES.map((measure) => (
                          <TouchableOpacity
                            key={measure.id}
                            style={[
                              styles.measurementOptionChip,
                              selectedMeasurement === measure.id &&
                                styles.measurementOptionChipActive,
                            ]}
                            onPress={() => {
                              setSelectedMeasurement(
                                measure.id as HouseholdMeasure
                              );
                            }}
                          >
                            <Ionicons
                              name="restaurant-outline"
                              size={16}
                              color={
                                selectedMeasurement === measure.id
                                  ? lightTheme.colors.white
                                  : lightTheme.colors.primary
                              }
                            />
                            <Text
                              style={[
                                styles.measurementOptionChipText,
                                selectedMeasurement === measure.id &&
                                  styles.measurementOptionChipTextActive,
                              ]}
                            >
                              {measure.name}{" "}
                              <Text
                                style={[
                                  styles.measurementOptionChipGrams,
                                  selectedMeasurement === measure.id &&
                                    styles.measurementOptionChipGramsActive,
                                ]}
                              >
                                ({measure.grams}g)
                              </Text>
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}

                    {/* Nutrition Preview em Tempo Real */}
                    {nutritionPreview && (
                      <View style={styles.nutritionPreviewContainer}>
                        <View style={styles.nutritionPreviewHeader}>
                          <Ionicons
                            name="stats-chart"
                            size={18}
                            color="#4A90E2"
                          />
                          <Text style={styles.nutritionPreviewTitle}>
                            Valor Nutricional (estimado)
                          </Text>
                        </View>
                        <View style={styles.nutritionPreviewGrid}>
                          <View style={styles.nutritionPreviewItem}>
                            <Text style={styles.nutritionPreviewValue}>
                              {nutritionPreview.calories.toFixed(0)}
                            </Text>
                            <Text style={styles.nutritionPreviewLabel}>
                              kcal
                            </Text>
                          </View>
                          <View style={styles.nutritionPreviewItem}>
                            <Text style={styles.nutritionPreviewValue}>
                              {nutritionPreview.protein.toFixed(1)}g
                            </Text>
                            <Text style={styles.nutritionPreviewLabel}>
                              Proteína
                            </Text>
                          </View>
                          <View style={styles.nutritionPreviewItem}>
                            <Text style={styles.nutritionPreviewValue}>
                              {nutritionPreview.carbs.toFixed(1)}g
                            </Text>
                            <Text style={styles.nutritionPreviewLabel}>
                              Carbos
                            </Text>
                          </View>
                          <View style={styles.nutritionPreviewItem}>
                            <Text style={styles.nutritionPreviewValue}>
                              {nutritionPreview.fat.toFixed(1)}g
                            </Text>
                            <Text style={styles.nutritionPreviewLabel}>
                              Gorduras
                            </Text>
                          </View>
                          <View style={styles.nutritionPreviewItem}>
                            <Text style={styles.nutritionPreviewValue}>
                              {nutritionPreview.fiber.toFixed(1)}g
                            </Text>
                            <Text style={styles.nutritionPreviewLabel}>
                              Fibras
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}

                    <View
                      style={[
                        styles.buttonRow,
                        { marginBottom: insets.bottom + 12 },
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => setSelectedFood(null)}
                      >
                        <Text style={styles.secondaryButtonText}>Voltar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleAddFood}
                      >
                        <Text style={styles.primaryButtonText}>Adicionar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
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
  nutritionGrid: {
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
    padding: lightTheme.spacing[5],
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: lightTheme.spacing[5],
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
    padding: lightTheme.spacing[4],
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: lightTheme.borderRadius.lg,
    marginBottom: lightTheme.spacing[4],
  },
  selectedFoodName: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing[2],
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
});
