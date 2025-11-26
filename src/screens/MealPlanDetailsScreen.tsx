/**
 * Tela de Detalhes do Plano Alimentar - REFATORADO
 *
 * Visualização completa do plano alimentar com:
 * - Informações gerais (nome, descrição, período, status)
 * - Metas nutricionais e progresso
 * - Resumo nutricional completo
 * - Lista de todas as refeições e alimentos
 * - Ações: editar, excluir, clonar, exportar PDF
 *
 * Refatorado em 20/11/2025:
 * - Substituído className por StyleSheet
 * - Aplicado lightTheme consistente
 * - Adicionadas metas nutricionais
 * - Melhorada organização visual
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useMealPlansStore } from "../stores/meal-plans.store";
import { MealPlanDetailsSkeleton } from "../components/MealPlanDetailsSkeleton";
import { ProgressVsGoalsChart } from "../components/ProgressVsGoalsChart";
import { MealPlanDayView } from "../components/MealPlanDayView";
import { FoodDetailModal } from "../components/FoodDetailModal";
import { MealPlanStatusManager } from "../components/MealPlanStatusManager";
import { lightTheme } from "../theme";
import { DayOfWeek, PlanStatus } from "../types/meal-plan.types";
import {
  getPlanStatusIcon,
  getPlanStatusColor,
  getPlanStatusLabel,
  formatCalories,
  formatMacro,
  formatPlanPeriod,
  formatShortDate,
  getDaysRemaining,
  getProgressColor,
  getProgressLabel,
  getMacroColor,
} from "../utils/meal-plan.utils";

interface Props {
  navigation: any;
  route: any;
}

// Constantes para dias da semana
const DAY_LABELS: { key: DayOfWeek; label: string; shortLabel: string }[] = [
  { key: DayOfWeek.MONDAY, label: "Segunda-feira", shortLabel: "SEG" },
  { key: DayOfWeek.TUESDAY, label: "Terça-feira", shortLabel: "TER" },
  { key: DayOfWeek.WEDNESDAY, label: "Quarta-feira", shortLabel: "QUA" },
  { key: DayOfWeek.THURSDAY, label: "Quinta-feira", shortLabel: "QUI" },
  { key: DayOfWeek.FRIDAY, label: "Sexta-feira", shortLabel: "SEX" },
  { key: DayOfWeek.SATURDAY, label: "Sábado", shortLabel: "SÁB" },
  { key: DayOfWeek.SUNDAY, label: "Domingo", shortLabel: "DOM" },
];

export default function MealPlanDetailsScreen({ navigation, route }: Props) {
  const {
    selectedPlan,
    loadPlanById,
    deletePlan,
    clonePlan,
    generateShoppingList,
    updatePlanStatus,
    checkActivePlan,
    loading,
    error,
  } = useMealPlansStore();

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
  const [selectedFoodItem, setSelectedFoodItem] = useState<any>(null);
  const [isFoodDetailModalVisible, setIsFoodDetailModalVisible] =
    useState(false);
  const [isStatusManagerVisible, setIsStatusManagerVisible] = useState(false);
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);

  const planId = route?.params?.planId || selectedPlan?.id;

  // Carregar plano quando planId mudar
  useEffect(() => {
    if (planId) {
      setIsInitialLoad(true);
      loadPlanById(planId).finally(() => {
        setIsInitialLoad(false);
      });
    }
  }, [planId, loadPlanById]);

  // Inicializar com o primeiro dia que tem refeições
  useEffect(() => {
    if (selectedPlan && !selectedDay) {
      const firstDayWithMeals = DAY_LABELS.find(({ key }) => {
        const dayMeals = selectedPlan.meals.filter((m) => m.dayOfWeek === key);
        return dayMeals.length > 0;
      });
      if (firstDayWithMeals) {
        setSelectedDay(firstDayWithMeals.key);
      }
    }
  }, [selectedPlan, selectedDay]);

  // Used inline in MealPlanDayView component below
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFoodItemPress = (item: any) => {
    setSelectedFoodItem(item);
    setIsFoodDetailModalVisible(true);
  };

  const closeFoodDetailModal = () => {
    setIsFoodDetailModalVisible(false);
    setTimeout(() => setSelectedFoodItem(null), 300);
  };

  const handleEdit = async () => {
    if (!selectedPlan) return;

    // Se o plano não estiver em rascunho, mostrar modal de confirmação
    if (selectedPlan.status !== PlanStatus.DRAFT) {
      setShowEditConfirmModal(true);
    } else {
      // Já é rascunho, pode editar diretamente
      proceedToEdit();
    }
  };

  const proceedToEdit = async () => {
    if (!selectedPlan) return;

    try {
      // Se não for rascunho, alterar status para DRAFT
      if (selectedPlan.status !== PlanStatus.DRAFT) {
        await updatePlanStatus(selectedPlan.id, PlanStatus.DRAFT);

        Toast.show({
          type: "info",
          text1: "Status alterado para Rascunho",
          text2: "O plano pode ser editado agora",
          position: "top",
          visibilityTime: 2000,
        });
      }

      // Carregar plano completo no builder para edição
      const { initBuilderForEdit } = useMealPlansStore.getState();
      await initBuilderForEdit(selectedPlan.id);

      // Navegar para CreateMealPlan em modo de edição
      navigation.navigate("CreateMealPlan", {
        planId: selectedPlan.id,
        patientId: selectedPlan.patientId,
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao editar plano",
        text2: err.message || "Tente novamente",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  const handleDelete = () => {
    if (!selectedPlan) return;

    Alert.alert(
      "Excluir Plano",
      `Tem certeza que deseja excluir o plano "${selectedPlan.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePlan(selectedPlan.id);
              Alert.alert("Sucesso", "Plano excluído com sucesso");
              navigation.goBack();
            } catch (err: any) {
              Alert.alert("Erro", err.message || "Erro ao excluir plano");
            }
          },
        },
      ]
    );
  };

  const handleClone = async () => {
    if (!selectedPlan) return;

    Alert.alert("Duplicar Plano", "Deseja criar uma cópia deste plano?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Duplicar",
        onPress: async () => {
          try {
            const clonedPlan = await clonePlan(selectedPlan.id);
            Alert.alert("Sucesso", `Plano duplicado: "${clonedPlan.name}"`, [
              {
                text: "Ver Cópia",
                onPress: () =>
                  navigation.replace("MealPlanDetails", {
                    planId: clonedPlan.id,
                  }),
              },
              { text: "OK" },
            ]);
          } catch (err: any) {
            Alert.alert("Erro", err.message || "Erro ao duplicar plano");
          }
        },
      },
    ]);
  };

  const handleGenerateShoppingList = async () => {
    if (!selectedPlan) return;

    try {
      await generateShoppingList(selectedPlan.id);
      Alert.alert("Sucesso", "Lista de compras gerada!", [
        {
          text: "Ver Lista",
          onPress: () =>
            navigation.navigate("ShoppingList", { planId: selectedPlan.id }),
        },
        { text: "OK" },
      ]);
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao gerar lista de compras");
    }
  };

  /* TODO: Adicionar botão de compartilhar na UI
  const handleShare = async () => {
    if (!selectedPlan) return;

    const nutritionText = getNutritionSummaryText(selectedPlan.nutrition);
    const mealsText = selectedPlan.meals
      .map((meal) => {
        const items = meal.items
          .map((item) => `  • ${item.name} (${formatGrams(item.quantity)})`)
          .join("\n");
        return `\n${getMealTypeIcon(meal.type)} ${meal.name} - ${
          meal.time || "Sem horário"
        }\n${items}`;
      })
      .join("\n");

    const message = `
📋 Plano Alimentar: ${selectedPlan.name}

📅 Período: ${formatPlanPeriod(selectedPlan.startDate, selectedPlan.endDate)}
📊 Status: ${getPlanStatusLabel(selectedPlan.status)}

🔢 Resumo Nutricional:
${nutritionText}

🍽️ Refeições:${mealsText}

---
Gerado pelo Silvestra App 🌿
    `.trim();

    try {
      await Share.share({
        message,
        title: `Plano Alimentar - ${selectedPlan.name}`,
      });
    } catch (err) {
      console.error("Erro ao compartilhar:", err);
    }
  };
  */

  const handleExportPdf = async () => {
    if (!selectedPlan) return;

    // TODO: Implementar exportação de PDF
    // Requer instalação de: expo-file-system
    Alert.alert(
      "Em Desenvolvimento",
      "A funcionalidade de exportar PDF será implementada em breve.",
      [{ text: "OK" }]
    );

    /* Código para quando expo-file-system estiver instalado:
    try {
      Alert.alert("Exportando PDF", "Gerando PDF do plano alimentar...");
      const pdfBlob = await exportPlanPdf(selectedPlan.id);
      const fileName = `plano-${selectedPlan.id.substring(0, 8)}.pdf`;
      
      // Usar expo-file-system para salvar e compartilhar
      // const fileUri = FileSystem.cacheDirectory + fileName;
      // await FileSystem.writeAsStringAsync(fileUri, base64data, {...});
      // await Sharing.shareAsync(fileUri, {...});
    } catch (err: any) {
      console.error("Erro ao exportar PDF:", err);
      Alert.alert("Erro", err.message || "Erro ao exportar PDF");
    }
    */
  };

  const handleOpenStatusManager = () => {
    setIsStatusManagerVisible(true);
  };

  const handleStatusChange = async (
    newStatus: PlanStatus,
    startDate?: Date,
    endDate?: Date
  ) => {
    if (!selectedPlan) return;

    try {
      await updatePlanStatus(selectedPlan.id, newStatus, startDate, endDate);

      Toast.show({
        type: "success",
        text1: "Status atualizado! 🎉",
        text2: "O status do plano foi alterado com sucesso",
        position: "top",
        visibilityTime: 3000,
      });

      // Recarregar o plano para mostrar as mudanças
      await loadPlanById(selectedPlan.id, true);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao alterar status",
        text2: error.message || "Tente novamente em alguns instantes",
        position: "top",
        visibilityTime: 4000,
      });
    }
  };

  const handleCheckActivePlan = async (): Promise<boolean> => {
    if (!selectedPlan) return false;
    return await checkActivePlan(selectedPlan.patientId, selectedPlan.id);
  };

  // Loading State - Skeleton
  // Mostra skeleton durante carregamento inicial ou quando loading está ativo sem plano selecionado
  if (isInitialLoad || (loading && !selectedPlan)) {
    return <MealPlanDetailsSkeleton />;
  }

  // Error State
  if (error || !selectedPlan) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={lightTheme.colors.error}
        />
        <Text
          style={[
            styles.errorText,
            {
              fontWeight: lightTheme.typography.fontWeight.semibold,
              fontSize: lightTheme.typography.fontSize.lg,
              marginTop: lightTheme.spacing[4],
            },
          ]}
        >
          Erro ao carregar plano
        </Text>
        <Text style={styles.errorText}>{error || "Plano não encontrado"}</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const plan = selectedPlan;
  const daysRemaining = getDaysRemaining(plan.endDate);

  // Helper function to normalize dayOfWeek value
  const normalizeDayOfWeek = (day: any): DayOfWeek => {
    // Se for número (0-6), converte para enum
    if (typeof day === "number") {
      const dayMap: Record<number, DayOfWeek> = {
        0: DayOfWeek.SUNDAY,
        1: DayOfWeek.MONDAY,
        2: DayOfWeek.TUESDAY,
        3: DayOfWeek.WEDNESDAY,
        4: DayOfWeek.THURSDAY,
        5: DayOfWeek.FRIDAY,
        6: DayOfWeek.SATURDAY,
      };
      return dayMap[day] || DayOfWeek.MONDAY;
    }

    // Se for string, garante uppercase
    if (typeof day === "string") {
      const upperDay = day.toUpperCase();
      // Verifica se é um valor válido do enum
      if (Object.values(DayOfWeek).includes(upperDay as DayOfWeek)) {
        return upperDay as DayOfWeek;
      }
    }

    // Fallback para Monday se não conseguir normalizar
    console.warn(`⚠️ Invalid dayOfWeek value: ${day} (type: ${typeof day})`);
    return DayOfWeek.MONDAY;
  };

  // Group meals by day of week
  const mealsByDay = plan.meals.reduce((acc, meal) => {
    const day = normalizeDayOfWeek(meal.dayOfWeek);
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(meal);
    return acc;
  }, {} as Record<DayOfWeek, typeof plan.meals>);

  // Sort meals within each day by order (or time)
  Object.keys(mealsByDay).forEach((day) => {
    mealsByDay[day as DayOfWeek].sort((a, b) => {
      // Assuming meals have an 'order' field or we use time
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      return 0;
    });
  });

  // Calcular número de dias únicos no plano
  const uniqueDays = Object.keys(mealsByDay).length;

  // Calcular progresso correto (comparar médias diárias com metas diárias)
  const dailyAvgCalories =
    uniqueDays > 0 ? plan.nutrition.totalCalories / uniqueDays : 0;
  const dailyAvgProtein =
    uniqueDays > 0 ? plan.nutrition.totalProtein / uniqueDays : 0;
  const dailyAvgCarbs =
    uniqueDays > 0 ? plan.nutrition.totalCarbs / uniqueDays : 0;
  const dailyAvgFat = uniqueDays > 0 ? plan.nutrition.totalFat / uniqueDays : 0;

  // Calcular progresso percentual correto
  const caloriesProgress = plan.nutrition.targetCalories
    ? (dailyAvgCalories / plan.nutrition.targetCalories) * 100
    : 0;
  const proteinProgress = plan.nutrition.targetProtein
    ? (dailyAvgProtein / plan.nutrition.targetProtein) * 100
    : 0;
  const carbsProgress = plan.nutrition.targetCarbs
    ? (dailyAvgCarbs / plan.nutrition.targetCarbs) * 100
    : 0;
  const fatProgress = plan.nutrition.targetFat
    ? (dailyAvgFat / plan.nutrition.targetFat) * 100
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Plan Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.planName}>{plan.name}</Text>
              {plan.description && (
                <Text style={styles.planDescription}>{plan.description}</Text>
              )}
            </View>
            {plan.isTemplate && (
              <View style={styles.templateBadge}>
                <Ionicons
                  name="document-text"
                  size={12}
                  color={lightTheme.colors.warning}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.templateText}>Template</Text>
              </View>
            )}
          </View>

          {/* Status & Period */}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: getPlanStatusColor(plan.status) + "15",
                  borderColor: getPlanStatusColor(plan.status),
                },
              ]}
            >
              <Ionicons
                name={getPlanStatusIcon(plan.status) as any}
                size={16}
                color={getPlanStatusColor(plan.status)}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: getPlanStatusColor(plan.status) },
                ]}
              >
                {getPlanStatusLabel(plan.status)}
              </Text>
            </View>
            <View style={styles.periodBadge}>
              <Ionicons
                name="calendar-outline"
                size={12}
                color={lightTheme.colors.gray[700]}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.periodText}>
                {formatPlanPeriod(plan.startDate, plan.endDate)}
              </Text>
            </View>
            {daysRemaining !== null && daysRemaining >= 0 && (
              <View style={styles.daysRemainingBadge}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={lightTheme.colors.primary}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.daysRemainingText}>
                  {daysRemaining} dia(s) restantes
                </Text>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
              <Ionicons
                name="create-outline"
                size={16}
                color={lightTheme.colors.primary}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  { color: lightTheme.colors.primary },
                ]}
              >
                Editar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleOpenStatusManager}
              style={styles.actionButton}
            >
              <Ionicons
                name="swap-horizontal-outline"
                size={16}
                color={lightTheme.colors.warning}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  { color: lightTheme.colors.warning },
                ]}
              >
                Status
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClone} style={styles.actionButton}>
              <Ionicons
                name="copy-outline"
                size={16}
                color={lightTheme.colors.success}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  { color: lightTheme.colors.success },
                ]}
              >
                Copiar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.actionButton}
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color={lightTheme.colors.error}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  { color: lightTheme.colors.error },
                ]}
              >
                Excluir
              </Text>
            </TouchableOpacity>
          </View>

          {/* Export PDF Button - Full Width */}
          <TouchableOpacity
            onPress={handleExportPdf}
            style={[
              styles.exportButton,
              loading && styles.exportButtonDisabled,
            ]}
            disabled={loading}
          >
            <Ionicons
              name="download-outline"
              size={18}
              color={lightTheme.colors.white}
            />
            <Text style={styles.exportButtonText}>Exportar PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Metas Nutricionais - SEÇÃO MELHORADA */}
        {(plan.nutrition.targetCalories ||
          plan.nutrition.targetProtein ||
          plan.nutrition.targetCarbs ||
          plan.nutrition.targetFat ||
          plan.nutrition.targetFiber) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              🎯 Metas Nutricionais Diárias
            </Text>
            <View style={styles.goalsCard}>
              {plan.nutrition.targetCalories && (
                <View style={styles.goalItemEnhanced}>
                  <View style={styles.goalIconContainer}>
                    <Ionicons
                      name="flame"
                      size={28}
                      color={lightTheme.colors.primary}
                    />
                  </View>
                  <View style={styles.goalContent}>
                    <Text style={styles.goalLabelEnhanced}>
                      Calorias (Diária)
                    </Text>
                    <Text style={styles.goalValueEnhanced}>
                      {formatCalories(plan.nutrition.targetCalories)}
                    </Text>
                    <Text style={styles.goalProgress}>
                      Média Atual:{" "}
                      {formatCalories(Math.round(dailyAvgCalories))} •{" "}
                      <Text
                        style={{
                          color: getProgressColor(caloriesProgress),
                          fontWeight: "600",
                        }}
                      >
                        {getProgressLabel(caloriesProgress)}
                      </Text>
                    </Text>
                  </View>
                </View>
              )}
              {plan.nutrition.targetProtein && (
                <View style={styles.goalItemEnhanced}>
                  <View style={styles.goalIconContainer}>
                    <Ionicons
                      name="fitness"
                      size={28}
                      color={getMacroColor("protein")}
                    />
                  </View>
                  <View style={styles.goalContent}>
                    <Text style={styles.goalLabelEnhanced}>
                      Proteínas (Diária)
                    </Text>
                    <Text style={styles.goalValueEnhanced}>
                      {formatMacro(plan.nutrition.targetProtein)}
                    </Text>
                    <Text style={styles.goalProgress}>
                      Média Atual: {formatMacro(dailyAvgProtein)} •{" "}
                      <Text
                        style={{
                          color: getProgressColor(proteinProgress),
                          fontWeight: "600",
                        }}
                      >
                        {getProgressLabel(proteinProgress)}
                      </Text>
                    </Text>
                  </View>
                </View>
              )}
              {plan.nutrition.targetCarbs && (
                <View style={styles.goalItemEnhanced}>
                  <View style={styles.goalIconContainer}>
                    <Ionicons
                      name="battery-charging"
                      size={28}
                      color={getMacroColor("carbs")}
                    />
                  </View>
                  <View style={styles.goalContent}>
                    <Text style={styles.goalLabelEnhanced}>
                      Carboidratos (Diária)
                    </Text>
                    <Text style={styles.goalValueEnhanced}>
                      {formatMacro(plan.nutrition.targetCarbs)}
                    </Text>
                    <Text style={styles.goalProgress}>
                      Média Atual: {formatMacro(dailyAvgCarbs)} •{" "}
                      <Text
                        style={{
                          color: getProgressColor(carbsProgress),
                          fontWeight: "600",
                        }}
                      >
                        {getProgressLabel(carbsProgress)}
                      </Text>
                    </Text>
                  </View>
                </View>
              )}
              {plan.nutrition.targetFat && (
                <View style={styles.goalItemEnhanced}>
                  <View style={styles.goalIconContainer}>
                    <Ionicons
                      name="water"
                      size={28}
                      color={getMacroColor("fat")}
                    />
                  </View>
                  <View style={styles.goalContent}>
                    <Text style={styles.goalLabelEnhanced}>
                      Gorduras (Diária)
                    </Text>
                    <Text style={styles.goalValueEnhanced}>
                      {formatMacro(plan.nutrition.targetFat)}
                    </Text>
                    <Text style={styles.goalProgress}>
                      Média Atual: {formatMacro(dailyAvgFat)} •{" "}
                      <Text
                        style={{
                          color: getProgressColor(fatProgress),
                          fontWeight: "600",
                        }}
                      >
                        {getProgressLabel(fatProgress)}
                      </Text>
                    </Text>
                  </View>
                </View>
              )}
              {plan.nutrition.targetFiber && (
                <View style={styles.goalItemEnhanced}>
                  <View style={styles.goalIconContainer}>
                    <Ionicons
                      name="leaf"
                      size={28}
                      color={lightTheme.colors.success}
                    />
                  </View>
                  <View style={styles.goalContent}>
                    <Text style={styles.goalLabelEnhanced}>
                      Fibras (Diária)
                    </Text>
                    <Text style={styles.goalValueEnhanced}>
                      {formatMacro(plan.nutrition.targetFiber)}
                    </Text>
                    <Text style={styles.goalProgress}>
                      Média Atual:{" "}
                      {formatMacro(
                        uniqueDays > 0
                          ? plan.nutrition.totalFiber / uniqueDays
                          : 0
                      )}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Nutrition Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo Nutricional</Text>

          {/* Calories */}
          <View
            style={[
              styles.nutritionCard,
              { marginBottom: lightTheme.spacing[3] },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: lightTheme.spacing[2],
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: lightTheme.typography.fontSize.sm,
                    color: lightTheme.colors.gray[600],
                    marginBottom: 4,
                  }}
                >
                  🔥 Calorias Totais (Semanal)
                </Text>
                <Text
                  style={{
                    fontSize: lightTheme.typography.fontSize["3xl"],
                    fontWeight: lightTheme.typography.fontWeight.bold,
                    color: lightTheme.colors.gray[900],
                  }}
                >
                  {formatCalories(plan.nutrition.totalCalories)}
                </Text>
                {uniqueDays > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text
                      style={{
                        fontSize: lightTheme.typography.fontSize.sm,
                        color: lightTheme.colors.gray[600],
                      }}
                    >
                      Média Diária:{" "}
                      <Text
                        style={{
                          fontWeight: "600",
                          color: lightTheme.colors.gray[900],
                        }}
                      >
                        {formatCalories(Math.round(dailyAvgCalories))}
                      </Text>
                    </Text>
                    {plan.nutrition.targetCalories && (
                      <Text
                        style={{
                          fontSize: lightTheme.typography.fontSize.sm,
                          color: lightTheme.colors.gray[600],
                          marginTop: 2,
                        }}
                      >
                        Meta Diária:{" "}
                        <Text
                          style={{
                            fontWeight: "600",
                            color: lightTheme.colors.primary,
                          }}
                        >
                          {formatCalories(plan.nutrition.targetCalories)}
                        </Text>
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
            {plan.nutrition.targetCalories && (
              <>
                <View
                  style={{
                    backgroundColor: lightTheme.colors.gray[200],
                    height: 8,
                    borderRadius: lightTheme.borderRadius.full,
                    overflow: "hidden",
                    marginBottom: lightTheme.spacing[2],
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      borderRadius: lightTheme.borderRadius.full,
                      width: `${Math.min(caloriesProgress, 100)}%`,
                      backgroundColor: getProgressColor(caloriesProgress),
                    }}
                  />
                </View>
                <Text
                  style={{
                    fontSize: lightTheme.typography.fontSize.xs,
                    color: lightTheme.colors.gray[500],
                    textAlign: "center",
                  }}
                >
                  {getProgressLabel(caloriesProgress)}
                </Text>
              </>
            )}
          </View>

          {/* Macros Grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {/* Proteínas */}
            <View style={[styles.nutritionCard, { flex: 1, minWidth: "45%" }]}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: lightTheme.spacing[2],
                }}
              >
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: lightTheme.borderRadius.full,
                    marginRight: lightTheme.spacing[2],
                    backgroundColor: getMacroColor("protein"),
                  }}
                />
                <Text
                  style={{
                    fontSize: lightTheme.typography.fontSize.xs,
                    color: lightTheme.colors.gray[600],
                  }}
                >
                  Proteínas
                </Text>
              </View>
              <View>
                <Text
                  style={{
                    fontSize: lightTheme.typography.fontSize.xs,
                    color: lightTheme.colors.gray[500],
                    marginBottom: 2,
                  }}
                >
                  Total Semanal
                </Text>
                <Text
                  style={{
                    fontSize: lightTheme.typography.fontSize["2xl"],
                    fontWeight: lightTheme.typography.fontWeight.bold,
                    color: lightTheme.colors.gray[900],
                    marginBottom: lightTheme.spacing[1],
                  }}
                >
                  {formatMacro(plan.nutrition.totalProtein)}
                </Text>
              </View>
              {uniqueDays > 0 && (
                <View
                  style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: lightTheme.colors.gray[100],
                  }}
                >
                  <Text
                    style={{
                      fontSize: lightTheme.typography.fontSize.xs,
                      color: lightTheme.colors.gray[600],
                    }}
                  >
                    Média/dia:{" "}
                    <Text
                      style={{
                        fontWeight: "600",
                        color: lightTheme.colors.gray[900],
                      }}
                    >
                      {formatMacro(dailyAvgProtein)}
                    </Text>
                  </Text>
                  {plan.nutrition.targetProtein && (
                    <Text
                      style={{
                        fontSize: lightTheme.typography.fontSize.xs,
                        color: lightTheme.colors.gray[600],
                        marginTop: 2,
                      }}
                    >
                      Meta/dia:{" "}
                      <Text
                        style={{
                          fontWeight: "600",
                          color: getMacroColor("protein"),
                        }}
                      >
                        {formatMacro(plan.nutrition.targetProtein)}
                      </Text>
                    </Text>
                  )}
                </View>
              )}
              <Text
                style={{
                  fontSize: lightTheme.typography.fontSize.xs,
                  color: lightTheme.colors.gray[500],
                  marginTop: 8,
                }}
              >
                {plan.nutrition.proteinPercentage.toFixed(0)}% do total calórico
              </Text>
            </View>

            {/* Carboidratos */}
            <View style={[styles.nutritionCard, { flex: 1, minWidth: "45%" }]}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: lightTheme.spacing[2],
                }}
              >
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: lightTheme.borderRadius.full,
                    marginRight: lightTheme.spacing[2],
                    backgroundColor: getMacroColor("carbs"),
                  }}
                />
                <Text
                  style={{
                    fontSize: lightTheme.typography.fontSize.xs,
                    color: lightTheme.colors.gray[600],
                  }}
                >
                  Carboidratos
                </Text>
              </View>
              <View>
                <Text
                  style={{
                    fontSize: lightTheme.typography.fontSize.xs,
                    color: lightTheme.colors.gray[500],
                    marginBottom: 2,
                  }}
                >
                  Total Semanal
                </Text>
                <Text
                  style={{
                    fontSize: lightTheme.typography.fontSize["2xl"],
                    fontWeight: lightTheme.typography.fontWeight.bold,
                    color: lightTheme.colors.gray[900],
                    marginBottom: lightTheme.spacing[1],
                  }}
                >
                  {formatMacro(plan.nutrition.totalCarbs)}
                </Text>
              </View>
              {uniqueDays > 0 && (
                <View
                  style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: lightTheme.colors.gray[100],
                  }}
                >
                  <Text
                    style={{
                      fontSize: lightTheme.typography.fontSize.xs,
                      color: lightTheme.colors.gray[600],
                    }}
                  >
                    Média/dia:{" "}
                    <Text
                      style={{
                        fontWeight: "600",
                        color: lightTheme.colors.gray[900],
                      }}
                    >
                      {formatMacro(dailyAvgCarbs)}
                    </Text>
                  </Text>
                  {plan.nutrition.targetCarbs && (
                    <Text
                      style={{
                        fontSize: lightTheme.typography.fontSize.xs,
                        color: lightTheme.colors.gray[600],
                        marginTop: 2,
                      }}
                    >
                      Meta/dia:{" "}
                      <Text
                        style={{
                          fontWeight: "600",
                          color: getMacroColor("carbs"),
                        }}
                      >
                        {formatMacro(plan.nutrition.targetCarbs)}
                      </Text>
                    </Text>
                  )}
                </View>
              )}
              <Text
                style={{
                  fontSize: lightTheme.typography.fontSize.xs,
                  color: lightTheme.colors.gray[500],
                  marginTop: 8,
                }}
              >
                {plan.nutrition.carbsPercentage.toFixed(0)}% do total calórico
              </Text>
            </View>

            {/* Gorduras */}
            <View style={[styles.nutritionCard, { flex: 1, minWidth: "45%" }]}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: lightTheme.spacing[2],
                }}
              >
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: lightTheme.borderRadius.full,
                    marginRight: lightTheme.spacing[2],
                    backgroundColor: getMacroColor("fat"),
                  }}
                />
                <Text
                  style={{
                    fontSize: lightTheme.typography.fontSize.xs,
                    color: lightTheme.colors.gray[600],
                  }}
                >
                  Gorduras
                </Text>
              </View>
              <View>
                <Text
                  style={{
                    fontSize: lightTheme.typography.fontSize.xs,
                    color: lightTheme.colors.gray[500],
                    marginBottom: 2,
                  }}
                >
                  Total Semanal
                </Text>
                <Text
                  style={{
                    fontSize: lightTheme.typography.fontSize["2xl"],
                    fontWeight: lightTheme.typography.fontWeight.bold,
                    color: lightTheme.colors.gray[900],
                    marginBottom: lightTheme.spacing[1],
                  }}
                >
                  {formatMacro(plan.nutrition.totalFat)}
                </Text>
              </View>
              {uniqueDays > 0 && (
                <View
                  style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: lightTheme.colors.gray[100],
                  }}
                >
                  <Text
                    style={{
                      fontSize: lightTheme.typography.fontSize.xs,
                      color: lightTheme.colors.gray[600],
                    }}
                  >
                    Média/dia:{" "}
                    <Text
                      style={{
                        fontWeight: "600",
                        color: lightTheme.colors.gray[900],
                      }}
                    >
                      {formatMacro(dailyAvgFat)}
                    </Text>
                  </Text>
                  {plan.nutrition.targetFat && (
                    <Text
                      style={{
                        fontSize: lightTheme.typography.fontSize.xs,
                        color: lightTheme.colors.gray[600],
                        marginTop: 2,
                      }}
                    >
                      Meta/dia:{" "}
                      <Text
                        style={{
                          fontWeight: "600",
                          color: getMacroColor("fat"),
                        }}
                      >
                        {formatMacro(plan.nutrition.targetFat)}
                      </Text>
                    </Text>
                  )}
                </View>
              )}
              <Text
                style={{
                  fontSize: lightTheme.typography.fontSize.xs,
                  color: lightTheme.colors.gray[500],
                  marginTop: 8,
                }}
              >
                {plan.nutrition.fatPercentage.toFixed(0)}% do total calórico
              </Text>
            </View>

            {/* Fibras */}
            <View style={[styles.nutritionCard, { flex: 1, minWidth: "45%" }]}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: lightTheme.spacing[2],
                }}
              >
                <Ionicons
                  name="leaf-outline"
                  size={14}
                  color={lightTheme.colors.success}
                />
                <Text
                  style={{
                    fontSize: lightTheme.typography.fontSize.xs,
                    color: lightTheme.colors.gray[600],
                    marginLeft: lightTheme.spacing[1],
                  }}
                >
                  Fibras
                </Text>
              </View>
              <Text
                style={{
                  fontSize: lightTheme.typography.fontSize["2xl"],
                  fontWeight: lightTheme.typography.fontWeight.bold,
                  color: lightTheme.colors.gray[900],
                  marginBottom: lightTheme.spacing[1],
                }}
              >
                {formatMacro(plan.nutrition.totalFiber)}
              </Text>
              {plan.nutrition.targetFiber && (
                <Text
                  style={{
                    fontSize: lightTheme.typography.fontSize.xs,
                    color: lightTheme.colors.gray[400],
                    marginTop: lightTheme.spacing[1],
                  }}
                >
                  Meta: {formatMacro(plan.nutrition.targetFiber)}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Gráfico: Progresso vs Metas */}
        <View style={styles.section}>
          <ProgressVsGoalsChart
            meals={plan.meals}
            targets={{
              targetCalories: plan.nutrition.targetCalories,
              targetProtein: plan.nutrition.targetProtein,
              targetCarbs: plan.nutrition.targetCarbs,
              targetFat: plan.nutrition.targetFat,
            }}
            mealsByDay={mealsByDay}
          />
        </View>

        {/* Shopping List CTA */}
        <TouchableOpacity
          onPress={handleGenerateShoppingList}
          style={styles.shoppingListCTA}
        >
          <View style={styles.shoppingListIcon}>
            <Ionicons
              name="cart-outline"
              size={24}
              color={lightTheme.colors.success}
            />
          </View>
          <View style={styles.shoppingListContent}>
            <Text style={styles.shoppingListTitle}>Lista de Compras</Text>
            <Text style={styles.shoppingListDescription}>
              Gere uma lista organizada por categoria
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={24}
            color={lightTheme.colors.success}
          />
        </TouchableOpacity>

        {/* Meals List - With Day Tabs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Refeições ({plan.meals.length})
          </Text>

          {/* Day Tabs - Horizontal Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dayTabsContainer}
            contentContainerStyle={styles.dayTabsContent}
          >
            {DAY_LABELS.map(({ key, label, shortLabel }) => {
              const dayMeals = mealsByDay[key] || [];
              if (dayMeals.length === 0) return null;

              const isSelected = selectedDay === key;

              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setSelectedDay(key)}
                  style={[styles.dayTab, isSelected && styles.dayTabActive]}
                >
                  <View style={styles.dayTabContent}>
                    <Text
                      style={[
                        styles.dayTabLabel,
                        isSelected && styles.dayTabLabelActive,
                      ]}
                    >
                      {shortLabel}
                    </Text>
                    <Text
                      style={[
                        styles.dayTabSubtitle,
                        isSelected && styles.dayTabSubtitleActive,
                      ]}
                    >
                      {dayMeals.length}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Day Content */}
          {selectedDay && (
            <MealPlanDayView
              meals={mealsByDay[selectedDay] || []}
              onFoodItemPress={(item, meal) => {
                setSelectedFoodItem({ ...item, mealName: meal.name });
                setIsFoodDetailModalVisible(true);
              }}
            />
          )}
        </View>

        {/* Food Detail Modal */}
        <FoodDetailModal
          visible={isFoodDetailModalVisible}
          foodItem={selectedFoodItem}
          onClose={closeFoodDetailModal}
        />

        {/* Edit Confirmation Modal */}
        <Modal
          visible={showEditConfirmModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEditConfirmModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowEditConfirmModal(false)}
          >
            <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons
                  name="create-outline"
                  size={32}
                  color={lightTheme.colors.primary}
                />
                <Text style={styles.modalTitle}>Editar Plano</Text>
              </View>

              <Text style={styles.modalDescription}>
                Ao editar este plano, ele será automaticamente alterado para o
                status <Text style={styles.statusHighlight}>Rascunho</Text>.
                Deseja continuar?
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonSecondary}
                  onPress={() => setShowEditConfirmModal(false)}
                >
                  <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButtonPrimary}
                  onPress={() => {
                    setShowEditConfirmModal(false);
                    proceedToEdit();
                  }}
                >
                  <Text style={styles.modalButtonPrimaryText}>Continuar</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Status Manager Modal */}
        <MealPlanStatusManager
          visible={isStatusManagerVisible}
          currentStatus={plan.status}
          planId={plan.id}
          patientId={plan.patientId}
          currentStartDate={new Date(plan.startDate)}
          currentEndDate={plan.endDate ? new Date(plan.endDate) : undefined}
          onClose={() => setIsStatusManagerVisible(false)}
          onStatusChange={handleStatusChange}
          onCheckActivePlan={handleCheckActivePlan}
        />

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observações Privadas</Text>
          {plan.notes ? (
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{plan.notes}</Text>
            </View>
          ) : (
            <Text style={styles.emptyNotesText}>
              Sem observações registradas
            </Text>
          )}
        </View>

        {/* Metadata */}
        <View style={styles.metadata}>
          <Text style={styles.metadataText}>
            Criado em: {formatShortDate(plan.createdAt)}
          </Text>
          <Text style={styles.metadataText}>
            Atualizado em: {formatShortDate(plan.updatedAt)}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: lightTheme.spacing[6],
    backgroundColor: lightTheme.colors.background,
  },
  errorText: {
    marginTop: lightTheme.spacing[2],
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.error,
    textAlign: "center",
  },
  retryButton: {
    marginTop: lightTheme.spacing[6],
    backgroundColor: lightTheme.colors.primary,
    paddingHorizontal: lightTheme.spacing[6],
    paddingVertical: lightTheme.spacing[3],
    borderRadius: lightTheme.borderRadius.xl,
  },
  retryButtonText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: lightTheme.spacing[8],
  },

  // Day Tabs
  dayTabsContainer: {
    marginTop: lightTheme.spacing[3],
    marginBottom: lightTheme.spacing[4],
  },
  dayTabsContent: {
    paddingHorizontal: lightTheme.spacing[4],
    gap: lightTheme.spacing[2],
  },
  dayTab: {
    paddingVertical: lightTheme.spacing[2],
    paddingHorizontal: lightTheme.spacing[3],
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: lightTheme.borderRadius.lg,
    minWidth: 64,
    alignItems: "center",
  },
  dayTabActive: {
    backgroundColor: lightTheme.colors.primary + "15",
  },
  dayTabContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[2],
  },
  dayTabLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[700],
  },
  dayTabLabelActive: {
    color: lightTheme.colors.primary,
  },
  dayTabSubtitle: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[400],
    fontWeight: lightTheme.typography.fontWeight.medium,
  },
  dayTabSubtitleActive: {
    color: lightTheme.colors.primary,
    opacity: 0.8,
  },
  dayTabCalories: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.error,
    backgroundColor: lightTheme.colors.error + "10",
    paddingHorizontal: lightTheme.spacing[3],
    paddingVertical: lightTheme.spacing[1],
    borderRadius: lightTheme.borderRadius.full,
  },
  dayTabCaloriesActive: {
    color: lightTheme.colors.white,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },

  // Header Card
  headerCard: {
    backgroundColor: lightTheme.colors.white,
    marginHorizontal: lightTheme.spacing[4],
    marginTop: lightTheme.spacing[4],
    padding: lightTheme.spacing[4],
    borderRadius: lightTheme.borderRadius.xl,
    ...lightTheme.shadows.md,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: lightTheme.spacing[3],
  },
  headerLeft: {
    flex: 1,
    marginRight: lightTheme.spacing[3],
  },
  planName: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing[1],
  },
  planDescription: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing[2],
  },
  templateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.warning + "20",
    paddingHorizontal: lightTheme.spacing[3],
    paddingVertical: lightTheme.spacing[1],
    borderRadius: lightTheme.borderRadius.full,
  },
  templateText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.warning,
  },

  // Status & Period
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: lightTheme.spacing[2],
    marginBottom: lightTheme.spacing[3],
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[2],
    borderRadius: lightTheme.borderRadius.full,
    borderWidth: 1.5,
  },
  statusText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.bold,
    letterSpacing: 0.3,
  },
  periodBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.gray[100],
    paddingHorizontal: lightTheme.spacing[3],
    paddingVertical: lightTheme.spacing[1],
    borderRadius: lightTheme.borderRadius.full,
  },
  periodText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[700],
  },
  daysRemainingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.info + "20",
    paddingHorizontal: lightTheme.spacing[3],
    paddingVertical: lightTheme.spacing[1],
    borderRadius: lightTheme.borderRadius.full,
  },
  daysRemainingText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.info,
  },

  // Actions
  actionsRow: {
    flexDirection: "row",
    gap: lightTheme.spacing[2],
    marginBottom: lightTheme.spacing[2],
  },
  actionButton: {
    flex: 1,
    backgroundColor: lightTheme.colors.white,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
    paddingVertical: lightTheme.spacing[2],
    borderRadius: lightTheme.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
    marginLeft: lightTheme.spacing[1],
  },
  exportButton: {
    backgroundColor: lightTheme.colors.primary,
    paddingVertical: lightTheme.spacing[3],
    borderRadius: lightTheme.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  exportButtonText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    marginLeft: lightTheme.spacing[2],
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },

  // Section
  section: {
    marginHorizontal: lightTheme.spacing[4],
    marginTop: lightTheme.spacing[4],
  },
  sectionTitle: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing[3],
  },

  // Goals Card
  goalsCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing[4],
    ...lightTheme.shadows.sm,
  },
  goalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: lightTheme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  goalItemLast: {
    borderBottomWidth: 0,
  },
  goalLabel: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginLeft: lightTheme.spacing[2],
  },
  goalValue: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
  },

  // Nutrition Summary
  nutritionCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing[4],
    ...lightTheme.shadows.sm,
  },

  // Meals
  mealCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.xl,
    marginBottom: lightTheme.spacing[3],
    overflow: "hidden",
    ...lightTheme.shadows.sm,
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: lightTheme.spacing[4],
  },
  mealHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  mealIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: lightTheme.spacing[3],
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing[1],
  },
  mealTime: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
  },
  mealContent: {
    paddingHorizontal: lightTheme.spacing[4],
    paddingBottom: lightTheme.spacing[4],
  },
  macrosRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: lightTheme.spacing[2],
    marginBottom: lightTheme.spacing[3],
  },
  macroBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.white,
    paddingHorizontal: lightTheme.spacing[3],
    paddingVertical: lightTheme.spacing[1],
    borderRadius: lightTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
  },
  macroText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[900],
  },

  // Shopping List CTA
  shoppingListCTA: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginHorizontal: lightTheme.spacing[4],
    marginTop: lightTheme.spacing[6],
    padding: lightTheme.spacing[4],
    borderRadius: lightTheme.borderRadius.xl,
    ...lightTheme.shadows.sm,
  },
  shoppingListIcon: {
    width: 48,
    height: 48,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: lightTheme.colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: lightTheme.spacing[3],
  },
  shoppingListContent: {
    flex: 1,
  },
  shoppingListTitle: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: "#14532D",
    marginBottom: lightTheme.spacing[1],
  },
  shoppingListDescription: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: "#15803D",
  },

  foodItem: {
    paddingVertical: lightTheme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  foodItemLast: {
    borderBottomWidth: 0,
  },
  foodName: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing[1],
  },
  foodQuantity: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginBottom: lightTheme.spacing[1],
  },
  foodNutrition: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[400],
  },
  foodObservation: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    flex: 1,
  },

  // Substituições
  substitutionsContainer: {
    paddingLeft: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  substitutionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: lightTheme.spacing[2],
  },
  substitutionsTitle: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.success,
  },

  // Notes
  notesCard: {
    backgroundColor: lightTheme.colors.white,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing[4],
    marginTop: lightTheme.spacing[3],
  },
  notesText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[700],
    lineHeight: 20,
  },
  emptyNotesText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
    fontStyle: "italic",
    marginTop: lightTheme.spacing[2],
  },

  // Day Cards (Accordion)
  dayCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.xl,
    marginBottom: lightTheme.spacing[3],
    overflow: "hidden",
    ...lightTheme.shadows.sm,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: lightTheme.spacing[4],
    backgroundColor: lightTheme.colors.primary + "10",
  },
  dayHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dayBadge: {
    width: 48,
    height: 48,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: lightTheme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: lightTheme.spacing[3],
  },
  dayBadgeText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.bold,
  },
  dayName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.text,
  },
  daySubtitle: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
    marginTop: 2,
  },
  dayContent: {
    padding: lightTheme.spacing[4],
    gap: lightTheme.spacing[3],
  },

  // Metadata
  metadata: {
    marginHorizontal: lightTheme.spacing[4],
    marginTop: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[6],
  },
  metadataText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[400],
    marginBottom: lightTheme.spacing[1],
  },

  // Enhanced Goal Items
  goalItemEnhanced: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: lightTheme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: lightTheme.borderRadius.lg,
    backgroundColor: lightTheme.colors.gray[50],
    justifyContent: "center",
    alignItems: "center",
    marginRight: lightTheme.spacing[3],
  },
  goalContent: {
    flex: 1,
  },
  goalLabelEnhanced: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing[1],
  },
  goalValueEnhanced: {
    fontSize: lightTheme.typography.fontSize["2xl"],
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing[1],
  },
  goalProgress: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
  },

  // Modern Food Card Styles
  modernFoodCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[3],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[100],
  },
  lastFoodCard: {
    marginBottom: 0,
  },
  modernFoodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: lightTheme.spacing[3],
  },
  modernFoodLeft: {
    flex: 1,
    marginRight: lightTheme.spacing[3],
  },
  modernFoodName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing[1],
  },
  modernFoodQuantity: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
  },
  modernFoodCalories: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.error + "10",
    paddingHorizontal: lightTheme.spacing[2],
    paddingVertical: lightTheme.spacing[1],
    borderRadius: lightTheme.borderRadius.md,
    gap: 4,
  },
  modernCaloriesText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.error,
  },

  // Modern Macros Grid
  modernMacrosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: lightTheme.spacing[2],
    marginBottom: lightTheme.spacing[2],
  },
  modernMacroItem: {
    flex: 1,
    minWidth: "22%",
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: lightTheme.borderRadius.md,
    padding: lightTheme.spacing[2],
    alignItems: "center",
  },
  modernMacroLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
    marginBottom: 4,
  },
  modernMacroValue: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.bold,
  },

  // Modern Observation
  modernObservation: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: lightTheme.colors.info + "10",
    borderRadius: lightTheme.borderRadius.md,
    padding: lightTheme.spacing[2],
    marginTop: lightTheme.spacing[2],
    gap: lightTheme.spacing[2],
  },
  modernObservationText: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[700],
    lineHeight: 16,
  },

  // Modern Substitutions
  modernSubstitutions: {
    marginTop: lightTheme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[200],
    paddingTop: lightTheme.spacing[3],
  },
  modernSubstitutionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: lightTheme.spacing[2],
  },
  modernSubstitutionsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[2],
  },
  modernSubstitutionsTitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.success,
  },
  modernSubstitutionsList: {
    gap: lightTheme.spacing[2],
  },
  modernSubstitutionItem: {
    backgroundColor: lightTheme.colors.success + "08",
    borderRadius: lightTheme.borderRadius.md,
    padding: lightTheme.spacing[3],
    borderLeftWidth: 3,
    borderLeftColor: lightTheme.colors.success,
  },
  lastSubstitutionItem: {
    marginBottom: 0,
  },
  modernSubstitutionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: lightTheme.spacing[1],
  },
  modernSubstitutionLeft: {
    flex: 1,
    marginRight: lightTheme.spacing[2],
  },
  modernSubstitutionName: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[900],
    marginBottom: 2,
  },
  modernSubstitutionQuantity: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
  },
  modernSubstitutionCalories: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.success,
  },
  modernSubstitutionMacros: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[1],
    marginTop: lightTheme.spacing[1],
  },
  modernSubMacro: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
  },

  // Modern Meal Header
  modernMealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: lightTheme.spacing[4],
    backgroundColor: lightTheme.colors.white,
  },
  modernMealHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: lightTheme.spacing[3],
  },
  modernMealIconContainer: {
    width: 48,
    height: 48,
    borderRadius: lightTheme.borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: lightTheme.spacing[3],
  },
  modernMealInfo: {
    flex: 1,
  },
  modernMealName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
    marginBottom: 4,
  },
  modernMealMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  modernMealMetaText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
  },
  modernMealHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[2],
  },
  modernMealCalorieBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.error + "10",
    paddingHorizontal: lightTheme.spacing[2],
    paddingVertical: 6,
    borderRadius: lightTheme.borderRadius.md,
    gap: 4,
  },
  modernMealCalorieText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.error,
  },

  // Edit Confirmation Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: lightTheme.spacing[4],
  },
  modalContent: {
    backgroundColor: lightTheme.colors.background,
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing[6],
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: lightTheme.spacing[4],
    gap: lightTheme.spacing[2],
  },
  modalTitle: {
    fontSize: lightTheme.typography.fontSize["2xl"],
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
    textAlign: "center",
  },
  modalDescription: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[600],
    lineHeight: 22,
    marginBottom: lightTheme.spacing[6],
    textAlign: "center",
  },
  statusHighlight: {
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: "#FF9800", // DRAFT color
  },
  modalButtons: {
    flexDirection: "row",
    gap: lightTheme.spacing[3],
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: lightTheme.spacing[3],
    paddingHorizontal: lightTheme.spacing[4],
    borderRadius: lightTheme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: lightTheme.colors.gray[300],
    backgroundColor: lightTheme.colors.background,
    alignItems: "center",
  },
  modalButtonSecondaryText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[700],
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: lightTheme.spacing[3],
    paddingHorizontal: lightTheme.spacing[4],
    borderRadius: lightTheme.borderRadius.lg,
    backgroundColor: lightTheme.colors.primary,
    alignItems: "center",
  },
  modalButtonPrimaryText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: "#FFFFFF",
  },
});
