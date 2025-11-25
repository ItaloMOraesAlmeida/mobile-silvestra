/**
 * Tela de Criação de Plano Alimentar - Step 1
 * Sprint 8-9 - Meal Plans Module
 *
 * Formulário para definir informações básicas do plano:
 * - Nome do plano
 * - Paciente
 * - Período (data início/fim)
 * - Metas nutricionais
 * - Observações
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { lightTheme } from "../theme";
import { useMealPlansStore } from "../stores/meal-plans.store";
import { usePatientsStore } from "../stores/patients.store";
import { useFoodsStore } from "../stores/foods.store";
import FoodListSkeleton from "../components/FoodListSkeleton";
import { ConfirmModal } from "../components/ui/confirm-modal";
import {
  MealType,
  type MeasurementType,
  type HouseholdMeasure,
} from "../types/meal-plan.types";
import {
  PLAN_STATUS_INFO,
  validatePlanData,
  MEAL_TYPES_INFO,
  getMealTypeIcon,
  getMealTypeColor,
  formatCalories,
  formatMacro,
  getMacroColor,
  calculateMacroDistribution,
} from "../utils/meal-plan.utils";
import {
  HOUSEHOLD_MEASURES,
  convertToGrams,
  formatQuantityWithMeasure,
} from "../constants/household-measures";

// Tipos de metas nutricionais
const GOAL_TYPES = [
  {
    id: "basic",
    label: "Básico",
    description: "Manutenção de peso e saúde",
    icon: "fitness-outline",
    multipliers: { protein: 1.2, carbs: 3, fat: 0.8 },
  },
  {
    id: "beginner",
    label: "Iniciante",
    description: "Início de mudança de hábitos",
    icon: "walk-outline",
    multipliers: { protein: 1.4, carbs: 3.5, fat: 0.9 },
  },
  {
    id: "light",
    label: "Leve",
    description: "Perda de peso moderada",
    icon: "leaf-outline",
    multipliers: { protein: 1.6, carbs: 2.5, fat: 0.7 },
  },
  {
    id: "intermediate",
    label: "Intermediário",
    description: "Ganho muscular moderado",
    icon: "barbell-outline",
    multipliers: { protein: 2.0, carbs: 4, fat: 1.0 },
  },
  {
    id: "advanced",
    label: "Avançado",
    description: "Alta performance e definição",
    icon: "trending-up-outline",
    multipliers: { protein: 2.5, carbs: 4.5, fat: 0.8 },
  },
  {
    id: "rapid",
    label: "Evolução Rápida",
    description: "Ganho acelerado de massa",
    icon: "flash-outline",
    multipliers: { protein: 2.8, carbs: 5.5, fat: 1.2 },
  },
];

interface Props {
  navigation: any;
  route?: {
    params?: {
      patientId?: string;
      patientName?: string;
    };
  };
}

export default function CreateMealPlanScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { initBuilder, updateBuilderField, loading } = useMealPlansStore();

  // Usar selector explícito para garantir que sempre pegue um array
  const patientsData = usePatientsStore((state) => state.patients);
  const loadPatients = usePatientsStore((state) => state.loadPatients);

  // Garantir que patients seja sempre um array
  const patients = Array.isArray(patientsData) ? patientsData : [];

  // Step control
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [hasEndDate, setHasEndDate] = useState(false);
  const [status, setStatus] = useState<
    "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED"
  >("DRAFT");

  // Metas nutricionais
  const [targetCalories, setTargetCalories] = useState("");
  const [targetProtein, setTargetProtein] = useState("");
  const [targetCarbs, setTargetCarbs] = useState("");
  const [targetFat, setTargetFat] = useState("");
  const [targetFiber, setTargetFiber] = useState("");

  const [notes, setNotes] = useState("");
  const [isTemplate, setIsTemplate] = useState(false);

  // Date pickers
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Modal state - Step 1
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [calculatedGoalType, setCalculatedGoalType] = useState<
    (typeof GOAL_TYPES)[0] | null
  >(null);

  // ========== STEP 2: MEAL BUILDER STATES ==========
  const {
    builderState,
    addMealToBuilder,
    removeMealFromBuilder,
    addItemToMeal,
    removeItemFromMeal,
    savePlanFromBuilder,
    clearBuilder,
  } = useMealPlansStore();

  const {
    foods,
    searchFoods,
    setSearchTerm,
    loadMore: loadMoreFoods,
    loading: foodsLoading,
    currentPage: foodsCurrentPage,
    totalPages: foodsTotalPages,
    addRecentSearch,
    recentSearches,
    clearRecentSearches,
  } = useFoodsStore();

  // Modals - Step 2
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [showFoodSearchModal, setShowFoodSearchModal] = useState(false);
  const [selectedMealIndex, setSelectedMealIndex] = useState<number | null>(
    null
  );

  // Meal form - Step 2
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState<MealType>(MealType.BREAKFAST);
  const [mealTime, setMealTime] = useState("08:00");
  const [mealObservation, setMealObservation] = useState("");

  // Food search - Step 2
  const [foodSearchQuery, setFoodSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [foodQuantity, setFoodQuantity] = useState("100");
  const [measurementType, setMeasurementType] =
    useState<MeasurementType>("gramas");
  const [selectedMeasure, setSelectedMeasure] =
    useState<HouseholdMeasure | null>(null);

  // Confirm modals - apenas para confirmações críticas
  const [confirmRemoveMeal, setConfirmRemoveMeal] = useState<{
    visible: boolean;
    index: number | null;
  }>({ visible: false, index: null });

  const [confirmRemoveFood, setConfirmRemoveFood] = useState<{
    visible: boolean;
    mealIndex: number | null;
    itemIndex: number | null;
  }>({ visible: false, mealIndex: null, itemIndex: null });

  // Keyboard height tracking - Step 2
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    loadPatients().catch((err) => {
      console.error("Error loading patients:", err);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível carregar os pacientes.",
        position: "bottom",
        visibilityTime: 3000,
      });
    });
  }, [loadPatients]);

  // Preencher patientId se vier da navegação
  useEffect(() => {
    if (route?.params?.patientId) {
      setSelectedPatientId(route.params.patientId);
    }
  }, [route?.params?.patientId]);

  // Listener para detectar altura do teclado dinamicamente
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Função para calcular metas nutricionais automaticamente
  const calculateNutritionalGoals = async (
    goalType: (typeof GOAL_TYPES)[0]
  ) => {
    if (!selectedPatientId && !route?.params?.patientId) {
      Toast.show({
        type: "error",
        text1: "Atenção",
        text2: "Selecione um paciente primeiro",
        position: "bottom",
        visibilityTime: 3000,
      });
      return;
    }

    setLoadingGoals(true);
    try {
      // TODO: Buscar última avaliação do paciente
      // const lastMeasurement = await fetchLastMeasurement(patientId);
      // TODO: Buscar último plano alimentar
      // const lastPlan = await fetchLastPlan(patientId);

      // Por enquanto, vamos usar valores exemplo baseados em um peso médio
      // Em produção, isso virá das medidas reais do paciente
      const estimatedWeight = 70; // kg (virá da última avaliação)
      // const estimatedTMB = 1800; // kcal (virá do cálculo da última avaliação)

      // Calcular macros baseado no tipo de meta
      const protein = Math.round(
        estimatedWeight * goalType.multipliers.protein
      );
      const carbs = Math.round(estimatedWeight * goalType.multipliers.carbs);
      const fat = Math.round(estimatedWeight * goalType.multipliers.fat);
      const fiber = Math.round(estimatedWeight * 0.35); // ~25-30g padrão

      // Calcular calorias totais (1g proteína = 4kcal, 1g carbo = 4kcal, 1g gordura = 9kcal)
      const calories = Math.round(protein * 4 + carbs * 4 + fat * 9);

      // Preencher os campos
      setTargetCalories(calories.toString());
      setTargetProtein(protein.toString());
      setTargetCarbs(carbs.toString());
      setTargetFat(fat.toString());
      setTargetFiber(fiber.toString());

      setShowGoalsModal(false);
      setCalculatedGoalType(goalType);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Erro ao calcular metas:", error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível calcular as metas automaticamente",
        position: "bottom",
        visibilityTime: 3000,
      });
    } finally {
      setLoadingGoals(false);
    }
  };

  const handleNext = () => {
    // Validar dados
    const validation = validatePlanData({
      name,
      patientId: selectedPatientId,
      startDate,
    });

    if (!validation.valid) {
      Toast.show({
        type: "error",
        text1: "Erro de Validação",
        text2: validation.errors.join(" • "),
        position: "bottom",
        visibilityTime: 4000,
      });
      return;
    }

    // Iniciar builder com os dados do formulário
    initBuilder(selectedPatientId);

    // Atualizar campos do builder
    updateBuilderField("planName", name);
    updateBuilderField("description", description);
    updateBuilderField("startDate", startDate);
    updateBuilderField("endDate", endDate);
    updateBuilderField("status", status as any); // TODO: Fix type
    updateBuilderField(
      "targetCalories",
      targetCalories ? parseFloat(targetCalories) : undefined
    );
    updateBuilderField(
      "targetProtein",
      targetProtein ? parseFloat(targetProtein) : undefined
    );
    updateBuilderField(
      "targetCarbs",
      targetCarbs ? parseFloat(targetCarbs) : undefined
    );
    updateBuilderField(
      "targetFat",
      targetFat ? parseFloat(targetFat) : undefined
    );
    updateBuilderField(
      "targetFiber",
      targetFiber ? parseFloat(targetFiber) : undefined
    );
    updateBuilderField("notes", notes);
    updateBuilderField("isTemplate", isTemplate);

    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  // ========== HELPER: Calculate nutrition with measurement type ==========
  const calculateNutritionPreview = () => {
    if (!selectedFood) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

    const quantity = parseFloat(foodQuantity || "0");
    const gramsAmount = convertToGrams(
      quantity,
      measurementType,
      selectedMeasure || undefined
    );

    return {
      calories: ((selectedFood.energyKcal || 0) * gramsAmount) / 100,
      protein: ((selectedFood.protein || 0) * gramsAmount) / 100,
      carbs: ((selectedFood.carbohydrate || 0) * gramsAmount) / 100,
      fat: ((selectedFood.lipids || 0) * gramsAmount) / 100,
    };
  };

  // ========== STEP 2: USE EFFECTS AND CALCULATIONS ==========
  useEffect(() => {
    if (currentStep === 2) {
      searchFoods();
    }
  }, [currentStep, searchFoods]);

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

  // ========== STEP 2: MEAL HANDLERS ==========
  const handleAddMeal = () => {
    if (!mealName.trim()) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Digite um nome para a refeição",
        position: "bottom",
        visibilityTime: 3000,
      });
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
    setMealType(MealType.BREAKFAST);
    setMealTime("08:00");
    setMealObservation("");
    setShowAddMealModal(false);
  };

  const handleRemoveMeal = (index: number) => {
    setConfirmRemoveMeal({ visible: true, index });
  };

  const handleAddFood = () => {
    if (!selectedFood) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Selecione um alimento",
        position: "bottom",
        visibilityTime: 3000,
      });
      return;
    }

    if (selectedMealIndex === null) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Nenhuma refeição selecionada",
        position: "bottom",
        visibilityTime: 3000,
      });
      return;
    }

    const quantity = parseFloat(foodQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Digite uma quantidade válida",
        position: "bottom",
        visibilityTime: 3000,
      });
      return;
    }

    // Convert to grams based on measurement type
    const gramsAmount = convertToGrams(
      quantity,
      measurementType,
      selectedMeasure || undefined
    );
    const factor = gramsAmount / 100;

    addItemToMeal(selectedMealIndex, {
      foodId: selectedFood.id,
      name: selectedFood.name,
      category: selectedFood.category || "Outros",
      quantity,
      measurementType,
      measurementUnit: selectedMeasure || undefined,
      calories: (selectedFood.energyKcal || 0) * factor,
      protein: (selectedFood.protein || 0) * factor,
      carbs: (selectedFood.carbohydrate || 0) * factor,
      fat: (selectedFood.lipids || 0) * factor,
      fiber: (selectedFood.fiber || 0) * factor,
    });

    // Reset
    setSelectedFood(null);
    setFoodQuantity("100");
    setMeasurementType("gramas");
    setSelectedMeasure(null);
    setShowFoodSearchModal(false);
  };

  const handleRemoveFood = (mealIndex: number, itemIndex: number) => {
    setConfirmRemoveFood({ visible: true, mealIndex, itemIndex });
  };

  const handleSavePlan = async () => {
    if (!builderState?.meals || builderState.meals.length === 0) {
      Toast.show({
        type: "error",
        text1: "Atenção",
        text2: "Adicione pelo menos uma refeição ao plano",
        position: "bottom",
        visibilityTime: 3000,
      });
      return;
    }

    try {
      await savePlanFromBuilder();
      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: "Plano alimentar salvo com sucesso!",
        position: "bottom",
        visibilityTime: 2000,
      });
      // Aguardar um pouco para o toast aparecer antes de navegar
      setTimeout(() => {
        clearBuilder();
        navigation.goBack();
      }, 500);
    } catch (error: any) {
      console.error("Error saving plan:", error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message || "Não foi possível salvar o plano",
        position: "bottom",
        visibilityTime: 3000,
      });
    }
  };

  const getProgressColor = (value: number) => {
    if (value < 95) return "#F59E0B"; // amber
    if (value <= 105) return "#10B981"; // green
    return "#EF4444"; // red (over target)
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  // Filtered foods para o modal de busca (Step 2)
  const filteredFoods = useMemo(() => {
    if (!foodSearchQuery.trim()) return foods;

    const query = foodSearchQuery.toLowerCase();
    return foods.filter(
      (food) =>
        food.name?.toLowerCase().includes(query) ||
        food.category?.name?.toLowerCase().includes(query)
    );
  }, [foods, foodSearchQuery]);

  // Quando o usuário digita na busca do modal, sincronizar com o store e
  // chamar o endpoint (debounced) para garantir resultados do servidor.
  useEffect(() => {
    // Criar um AbortController por efeito para cancelar requisições anteriores
    const controller = new AbortController();
    const handler = setTimeout(() => {
      // Atualiza o termo de busca no store (para paginação e histórico)
      setSearchTerm(foodSearchQuery);
      // Chama searchFoods com o termo atual passando o signal para cancelar se necessário
      searchFoods({
        search: foodSearchQuery || undefined,
        page: 1,
        limit: 50,
        signal: controller.signal,
      }).catch((err) => {
        // Se a requisição foi abortada, não logar como erro
        if ((err as any)?.name === "AbortError") return;
        console.error("Erro ao buscar alimentos (modal):", err);
      });
    }, 300); // debounce 300ms

    return () => {
      clearTimeout(handler);
      // Cancelar requisição pendente
      controller.abort();
    };
  }, [foodSearchQuery, searchFoods, setSearchTerm]);

  // ========== RENDERIZAÇÃO CONDICIONAL POR PASSO ==========
  if (currentStep === 2) {
    // ========== STEP 2: MEAL BUILDER ==========
    return (
      <>
        <SafeAreaView style={styles.container}>
          {/* Subtítulo do Passo com botão Voltar */}
          <View style={styles.stepHeader}>
            <TouchableOpacity
              onPress={handlePrevStep}
              style={styles.backButton}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.backButtonText}>Voltar</Text>
            </TouchableOpacity>
            <Text style={styles.stepHeaderText}>
              Passo 2 de 2 - Construir Refeições
            </Text>
            <View style={styles.backButtonPlaceholder} />
          </View>

          <KeyboardAvoidingView
            style={styles.flex1}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
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
                            backgroundColor: getProgressColor(
                              progress.calories
                            ),
                          },
                        ]}
                      />
                    </View>
                  )}
                </View>

                {/* Macros Grid */}
                <View style={styles.macrosSummaryGrid}>
                  {/* Proteínas */}
                  <View style={styles.macroSummaryCard}>
                    <View style={styles.macroSummaryHeader}>
                      <View
                        style={[
                          styles.macroSummaryDot,
                          { backgroundColor: getMacroColor("protein") },
                        ]}
                      />
                      <Text style={styles.macroSummaryLabel}>Proteínas</Text>
                    </View>
                    <View style={styles.macroSummaryValueRow}>
                      <Text style={styles.macroSummaryValue}>
                        {formatMacro(planNutrition.totalProtein)}
                      </Text>
                      {targets?.targetProtein && (
                        <Text style={styles.macroSummaryTarget}>
                          / {formatMacro(targets.targetProtein)}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.macroSummaryPercentage}>
                      {macroDistribution.proteinPercentage.toFixed(0)}%
                    </Text>
                  </View>

                  {/* Carboidratos */}
                  <View style={styles.macroSummaryCard}>
                    <View style={styles.macroSummaryHeader}>
                      <View
                        style={[
                          styles.macroSummaryDot,
                          { backgroundColor: getMacroColor("carbs") },
                        ]}
                      />
                      <Text style={styles.macroSummaryLabel}>Carboidratos</Text>
                    </View>
                    <View style={styles.macroSummaryValueRow}>
                      <Text style={styles.macroSummaryValue}>
                        {formatMacro(planNutrition.totalCarbs)}
                      </Text>
                      {targets?.targetCarbs && (
                        <Text style={styles.macroSummaryTarget}>
                          / {formatMacro(targets.targetCarbs)}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.macroSummaryPercentage}>
                      {macroDistribution.carbsPercentage.toFixed(0)}%
                    </Text>
                  </View>

                  {/* Gorduras */}
                  <View style={styles.macroSummaryCard}>
                    <View style={styles.macroSummaryHeader}>
                      <View
                        style={[
                          styles.macroSummaryDot,
                          { backgroundColor: getMacroColor("fat") },
                        ]}
                      />
                      <Text style={styles.macroSummaryLabel}>Gorduras</Text>
                    </View>
                    <View style={styles.macroSummaryValueRow}>
                      <Text style={styles.macroSummaryValue}>
                        {formatMacro(planNutrition.totalFat)}
                      </Text>
                      {targets?.targetFat && (
                        <Text style={styles.macroSummaryTarget}>
                          / {formatMacro(targets.targetFat)}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.macroSummaryPercentage}>
                      {macroDistribution.fatPercentage.toFixed(0)}%
                    </Text>
                  </View>

                  {/* Fibras */}
                  <View style={styles.macroSummaryCard}>
                    <View style={styles.macroSummaryHeader}>
                      <Ionicons name="leaf-outline" size={12} color="#10B981" />
                      <Text
                        style={[styles.macroSummaryLabel, { marginLeft: 4 }]}
                      >
                        Fibras
                      </Text>
                    </View>
                    <View style={styles.macroSummaryValueRow}>
                      <Text style={styles.macroSummaryValue}>
                        {formatMacro(planNutrition.totalFiber)}
                      </Text>
                      {targets?.targetFiber && (
                        <Text style={styles.macroSummaryTarget}>
                          / {formatMacro(targets.targetFiber)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              {/* Meals Section */}
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

                {/* Lista de refeições */}
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
                              backgroundColor:
                                getMealTypeColor(meal.type) + "15",
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
                              // Valores já estão calculados com base na quantidade
                              const itemCalories = item.calories || 0;
                              const itemProtein = item.protein || 0;
                              const itemCarbs = item.carbs || 0;
                              const itemFat = item.fat || 0;

                              return (
                                <View
                                  key={itemIndex}
                                  style={styles.mealItemRow}
                                >
                                  <View style={styles.mealItemContent}>
                                    <Text style={styles.mealItemName}>
                                      {item.foodName}
                                    </Text>
                                    <Text style={styles.mealItemInfo}>
                                      {formatQuantityWithMeasure(
                                        item.quantity,
                                        item.measurementType || "gramas",
                                        item.measurementUnit
                                      )}{" "}
                                      • {formatCalories(itemCalories)}
                                    </Text>
                                    <Text style={styles.mealItemMacros}>
                                      P: {formatMacro(itemProtein)} • C:{" "}
                                      {formatMacro(itemCarbs)} • G:{" "}
                                      {formatMacro(itemFat)}
                                    </Text>
                                  </View>
                                  <TouchableOpacity
                                    onPress={() =>
                                      handleRemoveFood(mealIndex, itemIndex)
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
                                color={lightTheme.colors.primary}
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
                    <Ionicons
                      name="restaurant-outline"
                      size={64}
                      color="#D1D5DB"
                    />
                    <Text style={styles.emptyStateTitle}>
                      Nenhuma refeição adicionada
                    </Text>
                    <Text style={styles.emptyStateDescription}>
                      Comece criando uma refeição e adicionando alimentos da
                      base TACO
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.bottomSpacer} />
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Save Button Footer */}
          {builderState?.meals && builderState.meals.length > 0 && (
            <View
              style={[
                styles.footerStep2,
                { paddingBottom: Math.max(insets.bottom, 16) },
              ]}
            >
              <TouchableOpacity
                onPress={handleSavePlan}
                disabled={loading}
                style={[
                  styles.saveButton,
                  loading && styles.saveButtonDisabled,
                ]}
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
        </SafeAreaView>
        {/* Add Meal Modal */}
        <Modal
          visible={showAddMealModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddMealModal(false)}
        >
          <KeyboardAvoidingView
            style={styles.flex1}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.modalOverlay}>
              <TouchableOpacity
                style={styles.modalBackdrop}
                activeOpacity={1}
                onPress={() => setShowAddMealModal(false)}
              />
              <SafeAreaView style={styles.modalContent} edges={["bottom"]}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Adicionar Refeição</Text>
                  <TouchableOpacity onPress={() => setShowAddMealModal(false)}>
                    <Ionicons
                      name="close"
                      size={24}
                      color={lightTheme.colors.gray[500]}
                    />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  {/* Meal Name */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Nome da Refeição *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={mealName}
                      onChangeText={setMealName}
                      placeholder="Ex: Café da Manhã"
                      placeholderTextColor={lightTheme.colors.gray[400]}
                    />
                  </View>

                  {/* Meal Type */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Tipo de Refeição *</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.mealTypeScroll}
                    >
                      {Object.values(MealType).map((type) => {
                        const isSelected = mealType === type;
                        const typeInfo = MEAL_TYPES_INFO[type];
                        return (
                          <TouchableOpacity
                            key={type}
                            onPress={() => setMealType(type)}
                            style={[
                              styles.mealTypeChip,
                              isSelected && {
                                backgroundColor: getMealTypeColor(type) + "20",
                                borderColor: getMealTypeColor(type),
                              },
                            ]}
                          >
                            <Text style={styles.mealTypeEmoji}>
                              {getMealTypeIcon(type)}
                            </Text>
                            <Text
                              style={[
                                styles.mealTypeLabel,
                                isSelected && {
                                  color: getMealTypeColor(type),
                                  fontWeight: lightTheme.typography.fontWeight
                                    .semibold as any,
                                },
                              ]}
                            >
                              {typeInfo.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Meal Time */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Horário *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={mealTime}
                      onChangeText={setMealTime}
                      placeholder="Ex: 08:00"
                      placeholderTextColor={lightTheme.colors.gray[400]}
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Meal Observation */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Observação (opcional)</Text>
                    <TextInput
                      style={[styles.formInput, styles.textArea]}
                      value={mealObservation}
                      onChangeText={setMealObservation}
                      placeholder="Ex: Tomar com água"
                      placeholderTextColor={lightTheme.colors.gray[400]}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>
                </ScrollView>

                {/* Modal Footer */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    onPress={() => setShowAddMealModal(false)}
                    style={styles.modalCancelButton}
                  >
                    <Text style={styles.modalCancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddMeal}
                    style={styles.modalConfirmButton}
                  >
                    <Text style={styles.modalConfirmButtonText}>Adicionar</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
        {/* Food Search Modal */}
        <Modal
          visible={showFoodSearchModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFoodSearchModal(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => {
                setShowFoodSearchModal(false);
                setSelectedFood(null);
                setFoodQuantity("100");
              }}
            />
            <SafeAreaView
              style={[styles.modalContent, styles.modalContentLarge]}
              edges={["bottom"]}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Adicionar Alimento</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowFoodSearchModal(false);
                    setSelectedFood(null);
                    setFoodQuantity("100");
                  }}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={lightTheme.colors.gray[500]}
                  />
                </TouchableOpacity>
              </View>

              {/* Search Input */}
              <View style={styles.searchInputContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color={lightTheme.colors.gray[400]}
                />
                <TextInput
                  style={styles.searchInput}
                  value={foodSearchQuery}
                  onChangeText={setFoodSearchQuery}
                  placeholder="Buscar alimento..."
                  placeholderTextColor={lightTheme.colors.gray[400]}
                  returnKeyType="search"
                  onSubmitEditing={() => {
                    const term = foodSearchQuery.trim();
                    if (term) {
                      addRecentSearch(term);
                      setSearchTerm(term);
                      searchFoods({
                        search: term || undefined,
                        page: 1,
                        limit: 50,
                      }).catch((err) =>
                        console.error("Erro ao buscar alimentos (submit):", err)
                      );
                    }
                  }}
                />
                {foodsLoading && (
                  <ActivityIndicator
                    size="small"
                    color={lightTheme.colors.primary}
                    style={{ marginLeft: 8 }}
                  />
                )}
              </View>

              {/* Recent Searches (quando campo vazio) */}
              {!foodSearchQuery.trim() &&
                Array.isArray(recentSearches) &&
                recentSearches.length > 0 && (
                  <View style={styles.recentSearchesContainer}>
                    <View style={styles.recentSearchesHeader}>
                      <Text style={styles.recentSearchesTitle}>
                        Buscas recentes
                      </Text>
                      <TouchableOpacity onPress={() => clearRecentSearches()}>
                        <Text style={styles.clearRecentText}>Limpar</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.recentSearchesList}>
                      {recentSearches.map((term) => (
                        <TouchableOpacity
                          key={term}
                          onPress={() => {
                            setFoodSearchQuery(term);
                            addRecentSearch(term);
                            setSearchTerm(term);
                            searchFoods({
                              search: term || undefined,
                              page: 1,
                              limit: 50,
                            }).catch((err) =>
                              console.error(
                                "Erro ao buscar alimentos (recent):",
                                err
                              )
                            );
                          }}
                          style={styles.recentSearchItem}
                        >
                          <Text style={styles.recentSearchText}>{term}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

              {/* Selected Food Card */}
              {selectedFood && (
                <View style={styles.selectedFoodCard}>
                  <View style={styles.selectedFoodHeader}>
                    <Text style={styles.selectedFoodName}>
                      {selectedFood.name}
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedFood(null)}>
                      <Ionicons name="close-circle" size={20} color="#3B82F6" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.selectedFoodCategory}>
                    {selectedFood.category?.name || "Sem categoria"}
                  </Text>

                  {/* Measurement Type Selector */}
                  <View style={styles.measurementTypeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.measurementTypeButton,
                        measurementType === "gramas" &&
                          styles.measurementTypeButtonActive,
                      ]}
                      onPress={() => {
                        setMeasurementType("gramas");
                        setSelectedMeasure(null);
                      }}
                    >
                      <Ionicons
                        name="scale-outline"
                        size={18}
                        color={
                          measurementType === "gramas"
                            ? lightTheme.colors.primary[500]
                            : lightTheme.colors.gray[500]
                        }
                      />
                      <Text
                        style={[
                          styles.measurementTypeButtonText,
                          measurementType === "gramas" &&
                            styles.measurementTypeButtonTextActive,
                        ]}
                      >
                        Gramas
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.measurementTypeButton,
                        measurementType === "caseira" &&
                          styles.measurementTypeButtonActive,
                      ]}
                      onPress={() => {
                        setMeasurementType("caseira");
                        if (!selectedMeasure) {
                          setSelectedMeasure(HOUSEHOLD_MEASURES[0]);
                        }
                      }}
                    >
                      <Ionicons
                        name="restaurant-outline"
                        size={18}
                        color={
                          measurementType === "caseira"
                            ? lightTheme.colors.primary[500]
                            : lightTheme.colors.gray[500]
                        }
                      />
                      <Text
                        style={[
                          styles.measurementTypeButtonText,
                          measurementType === "caseira" &&
                            styles.measurementTypeButtonTextActive,
                        ]}
                      >
                        Medida Caseira
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Household Measure Picker (if caseira) */}
                  {measurementType === "caseira" && (
                    <View style={styles.householdMeasurePickerContainer}>
                      <Text style={styles.quantityLabel}>Medida:</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.householdMeasurePicker}
                      >
                        {HOUSEHOLD_MEASURES.map((measure) => (
                          <TouchableOpacity
                            key={measure.id}
                            style={[
                              styles.householdMeasureOption,
                              selectedMeasure?.id === measure.id &&
                                styles.householdMeasureOptionActive,
                            ]}
                            onPress={() => setSelectedMeasure(measure)}
                          >
                            <Text
                              style={[
                                styles.householdMeasureOptionText,
                                selectedMeasure?.id === measure.id &&
                                  styles.householdMeasureOptionTextActive,
                              ]}
                            >
                              {measure.name}
                            </Text>
                            <Text
                              style={[
                                styles.householdMeasureOptionGrams,
                                selectedMeasure?.id === measure.id &&
                                  styles.householdMeasureOptionGramsActive,
                              ]}
                            >
                              ({measure.gramsEquivalent}g)
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Quantity Input */}
                  <View style={styles.quantityInputContainer}>
                    <Text style={styles.quantityLabel}>
                      Quantidade{" "}
                      {measurementType === "gramas"
                        ? "(g)"
                        : `(${selectedMeasure?.abbreviation || ""})`}
                      :
                    </Text>
                    <TextInput
                      style={styles.quantityInput}
                      value={foodQuantity}
                      onChangeText={setFoodQuantity}
                      keyboardType="numeric"
                      placeholder={measurementType === "gramas" ? "100" : "1"}
                      placeholderTextColor={lightTheme.colors.gray[400]}
                    />
                  </View>

                  {/* Nutrition Preview */}
                  <View style={styles.nutritionPreview}>
                    <View style={styles.nutritionPreviewItem}>
                      <Text style={styles.nutritionPreviewLabel}>Calorias</Text>
                      <Text style={styles.nutritionPreviewValue}>
                        {formatCalories(calculateNutritionPreview().calories)}
                      </Text>
                    </View>
                    <View style={styles.nutritionPreviewItem}>
                      <Text style={styles.nutritionPreviewLabel}>Proteína</Text>
                      <Text style={styles.nutritionPreviewValue}>
                        {formatMacro(calculateNutritionPreview().protein)}
                      </Text>
                    </View>
                    <View style={styles.nutritionPreviewItem}>
                      <Text style={styles.nutritionPreviewLabel}>
                        Carboidrato
                      </Text>
                      <Text style={styles.nutritionPreviewValue}>
                        {formatMacro(calculateNutritionPreview().carbs)}
                      </Text>
                    </View>
                    <View style={styles.nutritionPreviewItem}>
                      <Text style={styles.nutritionPreviewLabel}>Gordura</Text>
                      <Text style={styles.nutritionPreviewValue}>
                        {formatMacro(calculateNutritionPreview().fat)}
                      </Text>
                    </View>
                  </View>

                  {/* Add Button */}
                  <TouchableOpacity
                    onPress={handleAddFood}
                    style={styles.addFoodToMealButton}
                  >
                    <Text style={styles.addFoodToMealButtonText}>
                      Adicionar à Refeição
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Food List */}
              <FlatList
                data={filteredFoods}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : 20,
                }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => setSelectedFood(item)}
                    style={[
                      styles.foodListItem,
                      selectedFood?.id === item.id &&
                        styles.foodListItemSelected,
                    ]}
                  >
                    <View style={styles.foodListItemContent}>
                      <Text style={styles.foodListItemName}>{item.name}</Text>
                      <Text style={styles.foodListItemCategory}>
                        {item.category?.name || "Sem categoria"}
                      </Text>
                    </View>
                    <View style={styles.foodListItemNutrition}>
                      <Text style={styles.foodListItemCalories}>
                        {formatCalories(item.energyKcal || 0)} / 100g
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  foodsLoading && foodsCurrentPage === 1 ? (
                    <FoodListSkeleton />
                  ) : (
                    <View style={styles.emptyState}>
                      <Ionicons
                        name="search-outline"
                        size={48}
                        color={lightTheme.colors.gray[300]}
                      />
                      <Text style={styles.emptyStateTitle}>
                        Nenhum alimento encontrado
                      </Text>
                      <Text style={styles.emptyStateDescription}>
                        Tente buscar com outros termos
                      </Text>
                    </View>
                  )
                }
                onEndReached={() => {
                  if (!foodsLoading && foodsCurrentPage < foodsTotalPages) {
                    loadMoreFoods();
                  }
                }}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  foodsLoading && foodsCurrentPage > 1 ? (
                    <View style={styles.footerLoaderModal}>
                      <ActivityIndicator
                        size="small"
                        color={lightTheme.colors.primary}
                      />
                    </View>
                  ) : null
                }
                style={styles.foodList}
              />
            </SafeAreaView>
          </View>
        </Modal>

        {/* Confirm Modal - Remover Refeição */}
        <ConfirmModal
          visible={confirmRemoveMeal.visible}
          title="Remover Refeição"
          message="Tem certeza que deseja remover esta refeição?"
          confirmText="Remover"
          cancelText="Cancelar"
          confirmColor={lightTheme.colors.error}
          icon="trash-outline"
          iconColor={lightTheme.colors.error}
          onConfirm={() => {
            if (confirmRemoveMeal.index !== null) {
              removeMealFromBuilder(confirmRemoveMeal.index);
            }
            setConfirmRemoveMeal({ visible: false, index: null });
          }}
          onCancel={() => setConfirmRemoveMeal({ visible: false, index: null })}
        />

        {/* Confirm Modal - Remover Alimento */}
        <ConfirmModal
          visible={confirmRemoveFood.visible}
          title="Remover Alimento"
          message="Tem certeza que deseja remover este alimento?"
          confirmText="Remover"
          cancelText="Cancelar"
          confirmColor={lightTheme.colors.error}
          icon="trash-outline"
          iconColor={lightTheme.colors.error}
          onConfirm={() => {
            if (
              confirmRemoveFood.mealIndex !== null &&
              confirmRemoveFood.itemIndex !== null
            ) {
              removeItemFromMeal(
                confirmRemoveFood.mealIndex,
                confirmRemoveFood.itemIndex
              );
            }
            setConfirmRemoveFood({
              visible: false,
              mealIndex: null,
              itemIndex: null,
            });
          }}
          onCancel={() =>
            setConfirmRemoveFood({
              visible: false,
              mealIndex: null,
              itemIndex: null,
            })
          }
        />
      </>
    );
  }

  // ========== STEP 1: INFORMAÇÕES BÁSICAS ==========
  return (
    <>
      <SafeAreaView style={styles.container}>
        {/* Subtítulo do Passo */}
        <View style={styles.stepHeader}>
          <Text style={styles.stepHeaderText}>
            Passo 1 de 2 - Informações Básicas
          </Text>
        </View>

        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
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
                <View style={styles.progressBarInactive} />
              </View>
            </View>

            {/* Nome do Plano */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Nome do Plano <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                placeholder="Ex: Plano de Emagrecimento - Semana 1"
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Descrição */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                placeholder="Adicione uma descrição (opcional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textArea]}
                placeholderTextColor="#9CA3AF"
                textAlignVertical="top"
              />
            </View>

            {/* Seleção de Paciente */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Paciente <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                onPress={() => {
                  // Se veio de PatientDetails, não permite alterar o paciente
                  if (!route?.params?.patientId) {
                    setShowPatientModal(true);
                  }
                }}
                style={[
                  styles.selectButton,
                  route?.params?.patientId && styles.selectButtonDisabled,
                ]}
                disabled={!!route?.params?.patientId}
              >
                <View style={styles.selectButtonContent}>
                  <View style={styles.selectButtonText}>
                    {route?.params?.patientId && route?.params?.patientName ? (
                      <View>
                        <Text
                          style={[
                            styles.selectedPatientName,
                            styles.selectedPatientNameDisabled,
                          ]}
                        >
                          {route.params.patientName}
                        </Text>
                      </View>
                    ) : selectedPatient ? (
                      <View>
                        <Text style={styles.selectedPatientName}>
                          {selectedPatient.name}
                        </Text>
                        {selectedPatient.email && (
                          <Text style={styles.selectedPatientEmail}>
                            {selectedPatient.email}
                          </Text>
                        )}
                      </View>
                    ) : (
                      <Text style={styles.placeholder}>
                        Selecionar paciente
                      </Text>
                    )}
                  </View>
                  {!route?.params?.patientId && (
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#9CA3AF"
                    />
                  )}
                </View>
              </TouchableOpacity>
              {route?.params?.patientId && (
                <Text style={styles.fieldHint}>
                  Paciente selecionado automaticamente
                </Text>
              )}
            </View>

            {/* Período */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Período</Text>

              {/* Data de Início */}
              <View style={styles.dateGroup}>
                <Text style={styles.dateLabel}>Data de Início</Text>
                <TouchableOpacity
                  onPress={() => setShowStartDatePicker(true)}
                  style={styles.dateButton}
                >
                  <Text style={styles.dateButtonText}>
                    {startDate.toLocaleDateString("pt-BR")}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={lightTheme.colors.secondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Toggle Data de Fim */}
              <TouchableOpacity
                onPress={() => {
                  const newHasEndDate = !hasEndDate;
                  setHasEndDate(newHasEndDate);
                  if (newHasEndDate) {
                    // Definir data de término como startDate + 45 dias (1 mês e meio)
                    const futureDate = new Date(startDate);
                    futureDate.setDate(futureDate.getDate() + 45);
                    setEndDate(futureDate);
                  }
                }}
                style={styles.checkboxContainer}
              >
                <View
                  style={[
                    styles.checkbox,
                    hasEndDate && styles.checkboxChecked,
                  ]}
                >
                  {hasEndDate && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  Definir data de término
                </Text>
              </TouchableOpacity>

              {/* Data de Fim */}
              {hasEndDate && (
                <View style={styles.dateGroup}>
                  <Text style={styles.dateLabel}>Data de Término</Text>
                  <TouchableOpacity
                    onPress={() => setShowEndDatePicker(true)}
                    style={styles.dateButton}
                  >
                    <Text style={styles.dateButtonText}>
                      {endDate?.toLocaleDateString("pt-BR") || "Selecionar"}
                    </Text>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={lightTheme.colors.secondary}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Status */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusGrid}>
                {Object.values(PLAN_STATUS_INFO).map((statusInfo) => {
                  const isSelected = status === statusInfo.status;
                  return (
                    <TouchableOpacity
                      key={statusInfo.status}
                      onPress={() => setStatus(statusInfo.status)}
                      style={[
                        styles.statusButton,
                        isSelected
                          ? styles.statusButtonSelected
                          : styles.statusButtonUnselected,
                      ]}
                    >
                      <Ionicons
                        name={statusInfo.icon as any}
                        size={16}
                        color={
                          isSelected
                            ? lightTheme.colors.secondary
                            : statusInfo.color
                        }
                      />
                      <Text
                        style={[
                          styles.statusButtonText,
                          isSelected
                            ? styles.statusButtonTextSelected
                            : styles.statusButtonTextUnselected,
                        ]}
                      >
                        {statusInfo.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Metas Nutricionais */}
            <View style={styles.formGroup}>
              <View style={styles.goalsHeader}>
                <View style={styles.goalsHeaderText}>
                  <Text style={styles.label}>
                    Metas Nutricionais (Opcional)
                  </Text>
                  <Text style={styles.goalsDescription}>
                    Defina as metas diárias para acompanhamento
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowGoalsModal(true)}
                  style={styles.autoCalculateButton}
                >
                  <Ionicons
                    name="calculator-outline"
                    size={20}
                    color={lightTheme.colors.white}
                  />
                  <Text style={styles.autoCalculateButtonText}>Auto</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.goalsContainer}>
                {/* Calorias */}
                <View style={styles.goalInputContainer}>
                  <Text style={styles.inputLabel}>Calorias (kcal)</Text>
                  <TextInput
                    placeholder="Ex: 2000"
                    value={targetCalories}
                    onChangeText={setTargetCalories}
                    keyboardType="decimal-pad"
                    style={styles.input}
                    placeholderTextColor={lightTheme.colors.gray[400]}
                  />
                </View>

                {/* Macros em Grid */}
                <View style={styles.macrosGrid}>
                  <View style={styles.macroInputWrapper}>
                    <Text style={styles.inputLabel}>Proteínas (g)</Text>
                    <TextInput
                      placeholder="150"
                      value={targetProtein}
                      onChangeText={setTargetProtein}
                      keyboardType="decimal-pad"
                      style={styles.input}
                      placeholderTextColor={lightTheme.colors.gray[400]}
                    />
                  </View>

                  <View style={styles.macroInputWrapper}>
                    <Text style={styles.inputLabel}>Carbos (g)</Text>
                    <TextInput
                      placeholder="200"
                      value={targetCarbs}
                      onChangeText={setTargetCarbs}
                      keyboardType="decimal-pad"
                      style={styles.input}
                      placeholderTextColor={lightTheme.colors.gray[400]}
                    />
                  </View>
                </View>

                <View style={styles.macrosGrid}>
                  <View style={styles.macroInputWrapper}>
                    <Text style={styles.inputLabel}>Gorduras (g)</Text>
                    <TextInput
                      placeholder="60"
                      value={targetFat}
                      onChangeText={setTargetFat}
                      keyboardType="decimal-pad"
                      style={styles.input}
                      placeholderTextColor={lightTheme.colors.gray[400]}
                    />
                  </View>

                  <View style={styles.macroInputWrapper}>
                    <Text style={styles.inputLabel}>Fibras (g)</Text>
                    <TextInput
                      placeholder="25"
                      value={targetFiber}
                      onChangeText={setTargetFiber}
                      keyboardType="decimal-pad"
                      style={styles.input}
                      placeholderTextColor={lightTheme.colors.gray[400]}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Observações */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Observações Privadas</Text>
              <TextInput
                placeholder="Observações que apenas você verá"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textArea]}
                placeholderTextColor={lightTheme.colors.gray[400]}
                textAlignVertical="top"
              />
            </View>

            {/* Template Toggle */}
            <TouchableOpacity
              onPress={() => setIsTemplate(!isTemplate)}
              style={styles.templateContainer}
            >
              <View
                style={[styles.checkbox, isTemplate && styles.checkboxChecked]}
              >
                {isTemplate && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
              <View style={styles.templateTextContainer}>
                <Text style={styles.templateLabel}>Salvar como template</Text>
                <Text style={styles.templateDescription}>
                  Poderá reutilizar este plano para outros pacientes
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleNext}
            disabled={loading || !name || !selectedPatientId}
            style={[
              styles.nextButton,
              (loading || !name || !selectedPatientId) &&
                styles.nextButtonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  Próximo: Criar Refeições
                </Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowStartDatePicker(false);
              if (date) {
                setStartDate(date);
                // Se hasEndDate estiver ativo, atualizar automaticamente a data de término
                if (hasEndDate) {
                  const futureDate = new Date(date);
                  futureDate.setDate(futureDate.getDate() + 45);
                  setEndDate(futureDate);
                }
              }
            }}
          />
        )}

        {showEndDatePicker && endDate && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            minimumDate={startDate}
            onChange={(event, date) => {
              setShowEndDatePicker(false);
              if (date) setEndDate(date);
            }}
          />
        )}
      </SafeAreaView>

      {/* Modal de Seleção de Paciente */}
      <Modal
        visible={showPatientModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPatientModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header do Modal */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Paciente</Text>
            <TouchableOpacity onPress={() => setShowPatientModal(false)}>
              <Ionicons
                name="close"
                size={24}
                color={lightTheme.colors.gray[900]}
              />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.modalSearchContainer}>
            <View style={styles.modalSearchBar}>
              <Ionicons
                name="search"
                size={20}
                color={lightTheme.colors.gray[400]}
              />
              <TextInput
                placeholder="Buscar paciente..."
                value={patientSearch}
                onChangeText={setPatientSearch}
                style={styles.modalSearchInput}
                placeholderTextColor={lightTheme.colors.gray[400]}
              />
            </View>
          </View>

          {/* Lista de Pacientes */}
          <FlatList
            data={patients.filter(
              (p) =>
                p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                p.email?.toLowerCase().includes(patientSearch.toLowerCase())
            )}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setSelectedPatientId(item.id);
                  setShowPatientModal(false);
                  setPatientSearch("");
                }}
                style={styles.patientItem}
              >
                <View style={styles.patientItemContent}>
                  <View style={styles.patientAvatar}>
                    <Text style={styles.patientAvatarText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{item.name}</Text>
                    {item.email && (
                      <Text style={styles.patientEmail}>{item.email}</Text>
                    )}
                    {item.phone && (
                      <Text style={styles.patientPhone}>{item.phone}</Text>
                    )}
                  </View>
                  {selectedPatientId === item.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#10B981"
                    />
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons
                  name="people-outline"
                  size={64}
                  color={lightTheme.colors.gray[300]}
                />
                <Text style={styles.emptyStateText}>
                  {patientSearch
                    ? "Nenhum paciente encontrado"
                    : "Nenhum paciente cadastrado"}
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* Modal de Seleção de Meta Nutricional */}
      <Modal
        visible={showGoalsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGoalsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header do Modal */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Calcular Metas Automáticas</Text>
              <Text style={styles.modalSubtitle}>
                Escolha um perfil de meta nutricional
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowGoalsModal(false)}>
              <Ionicons
                name="close"
                size={24}
                color={lightTheme.colors.gray[900]}
              />
            </TouchableOpacity>
          </View>

          {/* Lista de Tipos de Meta */}
          <ScrollView style={styles.goalsModalContent}>
            {GOAL_TYPES.map((goalType) => (
              <TouchableOpacity
                key={goalType.id}
                onPress={() => calculateNutritionalGoals(goalType)}
                style={styles.goalTypeCard}
                disabled={loadingGoals}
              >
                <View style={styles.goalTypeIcon}>
                  <Ionicons
                    name={goalType.icon as any}
                    size={32}
                    color={lightTheme.colors.white}
                  />
                </View>
                <View style={styles.goalTypeInfo}>
                  <Text style={styles.goalTypeLabel}>{goalType.label}</Text>
                  <Text style={styles.goalTypeDescription}>
                    {goalType.description}
                  </Text>
                  <View style={styles.goalTypeMultipliers}>
                    <View style={styles.multiplierBadge}>
                      <Text style={styles.multiplierText}>
                        Proteína: {goalType.multipliers.protein}x
                      </Text>
                    </View>
                    <View style={styles.multiplierBadge}>
                      <Text style={styles.multiplierText}>
                        Carbos: {goalType.multipliers.carbs}x
                      </Text>
                    </View>
                    <View style={styles.multiplierBadge}>
                      <Text style={styles.multiplierText}>
                        Gordura: {goalType.multipliers.fat}x
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={lightTheme.colors.gray[400]}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loadingGoals && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator
                size="large"
                color={lightTheme.colors.primary}
              />
              <Text style={styles.loadingText}>Calculando metas...</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Modal de Sucesso - Metas Calculadas */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalCard}>
            {/* Ícone de Sucesso */}
            <View style={styles.successIconContainer}>
              <View style={styles.successIcon}>
                <Ionicons
                  name="checkmark-circle"
                  size={64}
                  color={lightTheme.colors.success}
                />
              </View>
            </View>

            {/* Título e Descrição */}
            <Text style={styles.successTitle}>Metas Calculadas!</Text>
            {calculatedGoalType && (
              <View style={styles.successProfileContainer}>
                <View style={styles.successProfileBadge}>
                  <Ionicons
                    name={calculatedGoalType.icon as any}
                    size={20}
                    color={lightTheme.colors.white}
                  />
                  <Text style={styles.successProfileName}>
                    {calculatedGoalType.label}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.successProfileEditButton}
                  onPress={() => {
                    setShowSuccessModal(false);
                    setShowGoalsModal(true);
                  }}
                >
                  <Ionicons
                    name="reload"
                    size={20}
                    color={lightTheme.colors.white}
                  />
                </TouchableOpacity>
              </View>
            )}
            <Text style={styles.successDescription}>
              As metas foram calculadas com base no perfil selecionado
            </Text>

            {/* Valores Calculados */}
            <View style={styles.successValuesContainer}>
              <View style={styles.successValueRow}>
                <View style={styles.successValueItem}>
                  <Ionicons
                    name="flame-outline"
                    size={24}
                    color={lightTheme.colors.primary}
                  />
                  <Text style={styles.successValueLabel}>Calorias</Text>
                  <Text style={styles.successValueNumber}>
                    {targetCalories || "0"} kcal
                  </Text>
                </View>
                <View style={styles.successValueItem}>
                  <Ionicons
                    name="nutrition-outline"
                    size={24}
                    color={lightTheme.colors.primary}
                  />
                  <Text style={styles.successValueLabel}>Proteína</Text>
                  <Text style={styles.successValueNumber}>
                    {targetProtein || "0"}g
                  </Text>
                </View>
              </View>

              <View style={styles.successValueRow}>
                <View style={styles.successValueItem}>
                  <Ionicons
                    name="leaf-outline"
                    size={24}
                    color={lightTheme.colors.primary}
                  />
                  <Text style={styles.successValueLabel}>Carboidratos</Text>
                  <Text style={styles.successValueNumber}>
                    {targetCarbs || "0"}g
                  </Text>
                </View>
                <View style={styles.successValueItem}>
                  <Ionicons
                    name="water-outline"
                    size={24}
                    color={lightTheme.colors.primary}
                  />
                  <Text style={styles.successValueLabel}>Gordura</Text>
                  <Text style={styles.successValueNumber}>
                    {targetFat || "0"}g
                  </Text>
                </View>
              </View>

              {targetFiber && (
                <View style={styles.successValueRow}>
                  <View style={styles.successValueItem}>
                    <Ionicons
                      name="fitness-outline"
                      size={24}
                      color={lightTheme.colors.primary}
                    />
                    <Text style={styles.successValueLabel}>Fibras</Text>
                    <Text style={styles.successValueNumber}>
                      {targetFiber}g
                    </Text>
                  </View>
                  <View style={styles.successValueItem} />
                </View>
              )}
            </View>

            {/* Hint de Edição */}
            <View style={styles.successHintContainer}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={lightTheme.colors.gray[600]}
              />
              <Text style={styles.successHintText}>
                Você pode ajustar os valores abaixo conforme necessário
              </Text>
            </View>

            {/* Botão de Confirmação */}
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.successButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirm Modal - Remover Refeição */}
      <ConfirmModal
        visible={confirmRemoveMeal.visible}
        title="Remover Refeição"
        message="Tem certeza que deseja remover esta refeição?"
        confirmText="Remover"
        cancelText="Cancelar"
        confirmColor={lightTheme.colors.error}
        icon="trash-outline"
        iconColor={lightTheme.colors.error}
        onConfirm={() => {
          if (confirmRemoveMeal.index !== null) {
            removeMealFromBuilder(confirmRemoveMeal.index);
          }
          setConfirmRemoveMeal({ visible: false, index: null });
        }}
        onCancel={() => setConfirmRemoveMeal({ visible: false, index: null })}
      />

      {/* Confirm Modal - Remover Alimento */}
      <ConfirmModal
        visible={confirmRemoveFood.visible}
        title="Remover Alimento"
        message="Tem certeza que deseja remover este alimento?"
        confirmText="Remover"
        cancelText="Cancelar"
        confirmColor={lightTheme.colors.error}
        icon="trash-outline"
        iconColor={lightTheme.colors.error}
        onConfirm={() => {
          if (
            confirmRemoveFood.mealIndex !== null &&
            confirmRemoveFood.itemIndex !== null
          ) {
            removeItemFromMeal(
              confirmRemoveFood.mealIndex,
              confirmRemoveFood.itemIndex
            );
          }
          setConfirmRemoveFood({
            visible: false,
            mealIndex: null,
            itemIndex: null,
          });
        }}
        onCancel={() =>
          setConfirmRemoveFood({
            visible: false,
            mealIndex: null,
            itemIndex: null,
          })
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[3],
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
    backgroundColor: lightTheme.colors.white,
  },
  stepHeader: {
    backgroundColor: lightTheme.colors.white,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepHeaderText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    fontWeight: lightTheme.typography.fontWeight.medium,
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: lightTheme.spacing[2],
  },
  backButtonText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.primary,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    marginLeft: 4,
  },
  backButtonPlaceholder: {
    width: 70,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: lightTheme.spacing[4],
    paddingBottom: 32,
  },
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
  formGroup: {
    marginBottom: lightTheme.spacing[4],
  },
  label: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[700],
    marginBottom: lightTheme.spacing[2],
  },
  required: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: lightTheme.colors.gray[50],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    borderRadius: lightTheme.borderRadius.xl,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[900],
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  selectButton: {
    backgroundColor: lightTheme.colors.gray[50],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    borderRadius: lightTheme.borderRadius.xl,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
  },
  selectButtonDisabled: {
    backgroundColor: lightTheme.colors.gray[100],
    opacity: 0.6,
  },
  selectButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectButtonText: {
    flex: 1,
  },
  selectedPatientName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[900],
  },
  selectedPatientNameDisabled: {
    color: lightTheme.colors.gray[600],
  },
  selectedPatientEmail: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginTop: lightTheme.spacing[1],
  },
  selectedPatientEmailDisabled: {
    color: lightTheme.colors.gray[400],
  },
  placeholder: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[400],
  },
  fieldHint: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginTop: lightTheme.spacing[1],
    fontStyle: "italic",
  },
  // Date styles
  dateGroup: {
    marginBottom: lightTheme.spacing[3],
  },
  dateLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginBottom: lightTheme.spacing[1],
  },
  dateButton: {
    backgroundColor: lightTheme.colors.gray[50],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    borderRadius: lightTheme.borderRadius.xl,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateButtonText: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[900],
  },
  // Checkbox styles
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: lightTheme.spacing[3],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: lightTheme.borderRadius.sm,
    borderWidth: 2,
    borderColor: lightTheme.colors.gray[300],
    alignItems: "center",
    justifyContent: "center",
    marginRight: lightTheme.spacing[2],
  },
  checkboxChecked: {
    backgroundColor: lightTheme.colors.secondary,
    borderColor: lightTheme.colors.secondary,
  },
  checkboxLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[700],
  },
  // Status styles
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: lightTheme.spacing[2],
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[1],
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[2],
    borderRadius: lightTheme.borderRadius.full,
    borderWidth: 1,
  },
  statusButtonSelected: {
    backgroundColor: `${lightTheme.colors.secondary}15`,
    borderColor: lightTheme.colors.secondary,
  },
  statusButtonUnselected: {
    backgroundColor: lightTheme.colors.white,
    borderColor: lightTheme.colors.gray[200],
  },
  statusButtonText: {
    fontSize: lightTheme.typography.fontSize.sm,
  },
  statusButtonTextSelected: {
    color: lightTheme.colors.secondary,
    fontWeight: lightTheme.typography.fontWeight.medium,
  },
  statusButtonTextUnselected: {
    color: lightTheme.colors.gray[700],
  },
  // Goals styles
  goalsDescription: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginBottom: lightTheme.spacing[3],
  },
  goalsContainer: {
    gap: lightTheme.spacing[3],
  },
  goalInputContainer: {
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing[1],
  },
  macrosGrid: {
    flexDirection: "row",
    gap: lightTheme.spacing[2],
  },
  macroInputWrapper: {
    flex: 1,
  },
  // Template styles
  templateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: lightTheme.spacing[6],
  },
  templateTextContainer: {
    flex: 1,
  },
  templateLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[700],
  },
  templateDescription: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
  },
  // Footer styles
  footer: {
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[100],
  },
  nextButton: {
    backgroundColor: lightTheme.colors.secondary,
    paddingVertical: lightTheme.spacing[4],
    borderRadius: lightTheme.borderRadius.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: lightTheme.spacing[2],
  },
  nextButtonDisabled: {
    backgroundColor: lightTheme.colors.gray[300],
  },
  nextButtonText: {
    color: lightTheme.colors.white,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    fontSize: lightTheme.typography.fontSize.base,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: lightTheme.colors.white,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  modalTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
  },
  modalSearchContainer: {
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  modalSearchBar: {
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: lightTheme.borderRadius.xl,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[2],
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[2],
  },
  modalSearchInput: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[900],
  },
  patientItem: {
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  patientItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: `${lightTheme.colors.secondary}20`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: lightTheme.spacing[3],
  },
  patientAvatarText: {
    color: lightTheme.colors.secondary,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    fontSize: lightTheme.typography.fontSize.lg,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[900],
  },
  patientEmail: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
    marginTop: lightTheme.spacing[1],
  },
  patientPhone: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[400],
    marginTop: lightTheme.spacing[1],
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: lightTheme.spacing[12],
  },
  emptyStateText: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[400],
    marginTop: lightTheme.spacing[4],
  },
  // Goals header styles
  goalsHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: lightTheme.spacing[3],
  },
  goalsHeaderText: {
    flex: 1,
  },
  autoCalculateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[1],
    paddingHorizontal: lightTheme.spacing[3],
    paddingVertical: lightTheme.spacing[2],
    backgroundColor: lightTheme.colors.primaryLight,
    borderRadius: lightTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.primary,
  },
  autoCalculateButtonText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.white,
  },
  // Goals modal styles
  modalSubtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginTop: lightTheme.spacing[1],
  },
  goalsModalContent: {
    flex: 1,
    padding: lightTheme.spacing[4],
  },
  goalTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[3],
    padding: lightTheme.spacing[4],
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.xl,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    marginBottom: lightTheme.spacing[3],
    ...lightTheme.shadows.sm,
  },
  goalTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: lightTheme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  goalTypeInfo: {
    flex: 1,
  },
  goalTypeLabel: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing[1],
  },
  goalTypeDescription: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing[2],
  },
  goalTypeMultipliers: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: lightTheme.spacing[2],
  },
  multiplierBadge: {
    paddingHorizontal: lightTheme.spacing[2],
    paddingVertical: lightTheme.spacing[1],
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.md,
  },
  multiplierText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[700],
    fontWeight: lightTheme.typography.fontWeight.medium,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    gap: lightTheme.spacing[3],
  },
  loadingText: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[700],
    fontWeight: lightTheme.typography.fontWeight.medium,
  },
  // Success Modal Styles
  successModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: lightTheme.spacing[4],
  },
  successModalCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing[6],
    width: "100%",
    maxWidth: 400,
    ...lightTheme.shadows.xl,
  },
  successIconContainer: {
    alignItems: "center",
    marginBottom: lightTheme.spacing[4],
  },
  successIcon: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: lightTheme.typography.fontSize["2xl"],
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
    textAlign: "center",
    marginBottom: lightTheme.spacing[3],
  },
  successProfileContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: lightTheme.spacing[2],
    marginBottom: lightTheme.spacing[2],
  },
  successProfileBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: lightTheme.spacing[2],
    paddingHorizontal: lightTheme.spacing[3],
    paddingVertical: lightTheme.spacing[2],
    backgroundColor: lightTheme.colors.primaryLight,
    borderRadius: lightTheme.borderRadius.full,
  },
  successProfileEditButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: lightTheme.colors.primaryLight,
    borderRadius: lightTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: lightTheme.colors.primary,
  },
  successProfileName: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.white,
  },
  successDescription: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
    marginBottom: lightTheme.spacing[5],
  },
  successValuesContainer: {
    gap: lightTheme.spacing[3],
    marginBottom: lightTheme.spacing[4],
  },
  successValueRow: {
    flexDirection: "row",
    gap: lightTheme.spacing[3],
  },
  successValueItem: {
    flex: 1,
    alignItems: "center",
    padding: lightTheme.spacing[3],
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: lightTheme.borderRadius.lg,
    gap: lightTheme.spacing[1],
  },
  successValueLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
    fontWeight: lightTheme.typography.fontWeight.medium,
    textAlign: "center",
  },
  successValueNumber: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
    textAlign: "center",
  },
  successHintContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: lightTheme.spacing[2],
    paddingHorizontal: lightTheme.spacing[3],
    paddingVertical: lightTheme.spacing[2],
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.lg,
    marginBottom: lightTheme.spacing[4],
  },
  successHintText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
    fontStyle: "italic",
    textAlign: "center",
    flex: 1,
  },
  successButton: {
    backgroundColor: lightTheme.colors.primary,
    paddingVertical: lightTheme.spacing[3],
    paddingHorizontal: lightTheme.spacing[4],
    borderRadius: lightTheme.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  successButtonText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.white,
  },

  // Step 2 - Spacing
  bottomSpacer: {
    height: 100,
  },

  // Step 2 - Nutrition Summary Card
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

  // Step 2 - Macros Summary Grid
  macrosSummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  macroSummaryCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: lightTheme.colors.white,
    borderRadius: 12,
    padding: lightTheme.spacing[3],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[100],
  },
  macroSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  macroSummaryDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginRight: 8,
  },
  macroSummaryLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
  },
  macroSummaryValue: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[900],
  },
  macroSummaryValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  macroSummaryTarget: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
    marginLeft: 4,
  },
  macroSummaryPercentage: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
  },

  // Step 2 - Meals Section
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

  // Empty State
  emptyStateTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[900],
    marginTop: lightTheme.spacing[2],
    textAlign: "center",
  },
  emptyStateDescription: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
    marginTop: lightTheme.spacing[1],
    textAlign: "center",
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

  // Footer Step 2
  footerStep2: {
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
    marginBottom: lightTheme.spacing[2],
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: lightTheme.colors.white,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    fontSize: lightTheme.typography.fontSize.base,
    marginLeft: 8,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: lightTheme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: lightTheme.spacing[6],
    maxHeight: "95%",
  },
  modalBody: {
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: "row",
    gap: lightTheme.spacing[3],
    marginTop: lightTheme.spacing[4],
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: lightTheme.spacing[3],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: lightTheme.colors.gray[700],
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    fontSize: lightTheme.typography.fontSize.sm,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: lightTheme.spacing[3],
    borderRadius: 12,
    backgroundColor: lightTheme.colors.primary,
    alignItems: "center",
  },
  modalConfirmButtonText: {
    color: lightTheme.colors.white,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    fontSize: lightTheme.typography.fontSize.sm,
  },

  // Form Elements
  formInput: {
    backgroundColor: lightTheme.colors.gray[50],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
    color: lightTheme.colors.gray[900],
    fontSize: lightTheme.typography.fontSize.sm,
  },

  // Meal Type Selector
  mealTypeScroll: {
    marginTop: lightTheme.spacing[2],
  },
  mealTypeChip: {
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[2],
    borderRadius: 999,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    backgroundColor: lightTheme.colors.white,
    marginRight: lightTheme.spacing[2],
    flexDirection: "row",
    alignItems: "center",
  },
  mealTypeEmoji: {
    fontSize: 20,
    marginRight: 6,
  },
  mealTypeLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[700],
  },

  // Food Search Modal
  modalContentLarge: {
    height: "95%",
  },
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
    fontSize: lightTheme.typography.fontSize.sm,
  },

  recentSearchesContainer: {
    marginBottom: lightTheme.spacing[4],
  },
  recentSearchesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: lightTheme.spacing[2],
  },
  recentSearchesTitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[700],
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
  },
  clearRecentText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
  },
  recentSearchesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: lightTheme.spacing[2],
  },
  recentSearchItem: {
    backgroundColor: lightTheme.colors.gray[100],
    paddingHorizontal: lightTheme.spacing[3],
    paddingVertical: lightTheme.spacing[2],
    borderRadius: 999,
    marginRight: lightTheme.spacing[2],
    marginBottom: lightTheme.spacing[2],
  },
  recentSearchText: {
    color: lightTheme.colors.gray[700],
    fontSize: lightTheme.typography.fontSize.sm,
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
  selectedFoodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  selectedFoodName: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[900],
  },
  selectedFoodCategory: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginBottom: lightTheme.spacing[3],
  },

  // Measurement Type Selector
  measurementTypeContainer: {
    flexDirection: "row",
    gap: lightTheme.spacing[2],
    marginBottom: lightTheme.spacing[3],
  },
  measurementTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: lightTheme.spacing[2],
    paddingVertical: 10,
    paddingHorizontal: lightTheme.spacing[3],
    backgroundColor: lightTheme.colors.gray[50],
    borderWidth: 1.5,
    borderColor: lightTheme.colors.gray[200],
    borderRadius: lightTheme.borderRadius.lg,
  },
  measurementTypeButtonActive: {
    backgroundColor: lightTheme.colors.primary[50],
    borderColor: lightTheme.colors.primary[500],
  },
  measurementTypeButtonText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[600],
  },
  measurementTypeButtonTextActive: {
    color: lightTheme.colors.primary[700],
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
  },

  // Household Measure Picker
  householdMeasurePickerContainer: {
    marginBottom: lightTheme.spacing[3],
  },
  householdMeasurePicker: {
    flexDirection: "row",
    gap: lightTheme.spacing[2],
  },
  householdMeasureOption: {
    paddingVertical: lightTheme.spacing[2],
    paddingHorizontal: lightTheme.spacing[3],
    backgroundColor: lightTheme.colors.gray[50],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    borderRadius: lightTheme.borderRadius.lg,
    marginRight: lightTheme.spacing[2],
  },
  householdMeasureOptionActive: {
    backgroundColor: lightTheme.colors.primary[50],
    borderColor: lightTheme.colors.primary[500],
  },
  householdMeasureOptionText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[700],
    marginBottom: 2,
  },
  householdMeasureOptionTextActive: {
    color: lightTheme.colors.primary[700],
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
  },
  householdMeasureOptionGrams: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
  },
  householdMeasureOptionGramsActive: {
    color: lightTheme.colors.primary[600],
  },

  quantityInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: lightTheme.spacing[3],
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
    fontSize: lightTheme.typography.fontSize.sm,
  },

  // Nutrition Preview
  nutritionPreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: lightTheme.spacing[3],
  },
  nutritionPreviewItem: {
    alignItems: "center",
  },
  nutritionPreviewLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginBottom: 4,
  },
  nutritionPreviewValue: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[900],
  },

  // Add Food Button
  addFoodToMealButton: {
    backgroundColor: lightTheme.colors.primary,
    paddingVertical: lightTheme.spacing[3],
    borderRadius: 8,
  },
  addFoodToMealButtonText: {
    color: lightTheme.colors.white,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    fontSize: lightTheme.typography.fontSize.sm,
    textAlign: "center",
  },

  // Food List
  foodList: {
    flex: 1,
  },
  foodListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: lightTheme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  foodListItemSelected: {
    backgroundColor: lightTheme.colors.primaryBackground,
  },
  foodListItemContent: {
    flex: 1,
    marginRight: lightTheme.spacing[3],
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
  },
  foodListItemNutrition: {
    alignItems: "flex-end",
  },
  foodListItemCalories: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
    fontWeight: lightTheme.typography.fontWeight.medium as any,
  },
  footerLoaderModal: {
    paddingVertical: lightTheme.spacing[3],
    alignItems: "center",
  },
});
