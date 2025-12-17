/**
 * MealPlanDetailsForPatientScreen
 * Feature #4 - App do Paciente
 *
 * Tela de detalhes do plano alimentar com lista de refeições e check-in
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { lightTheme } from "../../theme";
import { useAuthStore } from "../../stores/auth.store";
import { getMealPlanById } from "../../services/meal-plan.service";
import {
  getMealConsumptions,
  type MealConsumption,
} from "../../services/meal-consumption.service";
import type {
  MealPlan,
  Meal,
  FoodNutrition,
} from "../../types/meal-plan.types";

interface MealPlanDetailsForPatientScreenProps {
  navigation: any;
  route: any;
}

export function MealPlanDetailsForPatientScreen({
  navigation,
  route,
}: MealPlanDetailsForPatientScreenProps) {
  const { planId } = route.params;
  const user = useAuthStore((s) => s.user);
  // ID do relacionamento Patient (paciente-nutricionista)
  const patientId = user?.patientProfile?.patients?.[0]?.id;

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [plan, setPlan] = React.useState<MealPlan | null>(null);
  const [consumptions, setConsumptions] = React.useState<MealConsumption[]>([]);
  const [substitutionModalVisible, setSubstitutionModalVisible] =
    React.useState(false);
  const [selectedFoodItem, setSelectedFoodItem] =
    React.useState<FoodNutrition | null>(null);

  const fetchPlanDetails = React.useCallback(async () => {
    if (!planId || !patientId) {
      setError("Dados inválidos");
      setLoading(false);
      return;
    }

    try {
      // Buscar plano
      const planData = await getMealPlanById(planId);
      setPlan(planData);

      // Buscar consumos das refeições deste plano
      const mealIds = planData.meals?.map((m) => m.id) || [];
      if (mealIds.length > 0) {
        const consumptionsData = await getMealConsumptions({ patientId });
        // Filtrar apenas consumos das refeições deste plano
        const planConsumptions = consumptionsData.filter((c) =>
          mealIds.includes(c.mealId)
        );
        setConsumptions(planConsumptions);
      } else {
        setConsumptions([]);
      }

      setError(null);
    } catch (err: any) {
      console.error("Erro ao buscar detalhes do plano:", err);
      setError(
        err?.response?.data?.message || "Erro ao carregar dados do plano"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [planId, patientId]);

  React.useEffect(() => {
    fetchPlanDetails();
  }, [fetchPlanDetails]);

  // Recarregar dados quando a tela receber foco (ex: volta do check-in)
  useFocusEffect(
    React.useCallback(() => {
      if (planId && patientId) {
        fetchPlanDetails();
      }
    }, [planId, patientId, fetchPlanDetails])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchPlanDetails();
  }, [fetchPlanDetails]);

  const getDayOfWeekLabel = (day: string) => {
    const labels: { [key: string]: string } = {
      SUNDAY: "Domingo",
      MONDAY: "Segunda-feira",
      TUESDAY: "Terça-feira",
      WEDNESDAY: "Quarta-feira",
      THURSDAY: "Quinta-feira",
      FRIDAY: "Sexta-feira",
      SATURDAY: "Sábado",
    };
    return labels[day] || day;
  };

  const getMealTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      BREAKFAST: "Café da Manhã",
      MORNING_SNACK: "Lanche da Manhã",
      LUNCH: "Almoço",
      AFTERNOON_SNACK: "Lanche da Tarde",
      DINNER: "Jantar",
      EVENING_SNACK: "Ceia",
      PRE_WORKOUT: "Pré-Treino",
      POST_WORKOUT: "Pós-Treino",
      OTHER: "Outro",
    };
    return labels[type] || type;
  };

  const groupMealsByDay = () => {
    if (!plan?.meals) return {};

    const daysOrder = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    const grouped: { [key: string]: Meal[] } = {};

    plan.meals.forEach((meal) => {
      const day = meal.dayOfWeek || "MONDAY";
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(meal);
    });

    // Ordenar refeições de cada dia por horário
    Object.keys(grouped).forEach((day) => {
      grouped[day].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    });

    // Retornar dias na ordem correta
    const orderedGrouped: { [key: string]: Meal[] } = {};
    daysOrder.forEach((day) => {
      if (grouped[day]) {
        orderedGrouped[day] = grouped[day];
      }
    });

    return orderedGrouped;
  };

  const getMealTypeIcon = (type: string): any => {
    const icons: { [key: string]: any } = {
      BREAKFAST: "sunny-outline",
      MORNING_SNACK: "cafe-outline",
      LUNCH: "restaurant-outline",
      AFTERNOON_SNACK: "ice-cream-outline",
      DINNER: "moon-outline",
      EVENING_SNACK: "bed-outline",
      PRE_WORKOUT: "fitness-outline",
      POST_WORKOUT: "water-outline",
      OTHER: "nutrition-outline",
    };
    return icons[type] || "nutrition-outline";
  };

  // Verifica se a refeição foi consumida HOJE (para o progresso diário)
  const isMealConsumedToday = (mealId: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    return consumptions.some((c) => {
      const consumedAt = new Date(c.consumedAt);
      return (
        c.mealId === mealId && consumedAt >= today && consumedAt <= todayEnd
      );
    });
  };

  // Verifica se a refeição foi consumida em QUALQUER DIA (para a lista de refeições)
  const isMealConsumed = (mealId: string): boolean => {
    return consumptions.some((c) => c.mealId === mealId);
  };

  const calculateProgress = () => {
    if (!plan?.meals || plan.meals.length === 0) return 0;

    // Obter o dia da semana atual usando getDay() para evitar problemas com Intl no Android
    const today = new Date();
    const dayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysOfWeek = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    const dayOfWeek = daysOfWeek[dayIndex];

    // Filtrar apenas refeições do dia da semana atual
    const todayMeals = plan.meals.filter((m) => m.dayOfWeek === dayOfWeek);

    if (todayMeals.length === 0) return 0;

    // Contar refeições de hoje que foram consumidas
    const consumedMeals = todayMeals.filter((m) =>
      isMealConsumedToday(m.id)
    ).length;

    return Math.round((consumedMeals / todayMeals.length) * 100);
  };

  const progress = plan ? calculateProgress() : 0;

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={lightTheme.colors.primary} />
        <Text style={styles.loadingText}>Carregando plano...</Text>
      </View>
    );
  }

  if (error || !plan) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={lightTheme.colors.error}
        />
        <Text style={styles.errorText}>{error || "Plano não encontrado"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPlanDetails}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[lightTheme.colors.primary]}
            tintColor={lightTheme.colors.primary}
          />
        }
      >
        {/* Header Card */}
        <LinearGradient
          colors={[lightTheme.colors.primary, lightTheme.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={lightTheme.colors.white}
            />
          </TouchableOpacity>

          <Text style={styles.planName}>{plan.name}</Text>
          {plan.description && (
            <Text style={styles.planDescription}>{plan.description}</Text>
          )}

          {/* Progress Circle */}
          <View style={styles.progressCircleContainer}>
            <Svg width={120} height={120}>
              <Circle
                cx={60}
                cy={60}
                r={50}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth={8}
                fill="none"
              />
              <Circle
                cx={60}
                cy={60}
                r={50}
                stroke={lightTheme.colors.white}
                strokeWidth={8}
                fill="none"
                strokeDasharray={`${(progress / 100) * 314} 314`}
                strokeLinecap="round"
                rotation="-90"
                origin="60, 60"
              />
            </Svg>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressText}>{progress}%</Text>
              <Text style={styles.progressLabel}>Hoje</Text>
            </View>
          </View>

          <Text style={styles.progressSubtext}>
            {(() => {
              const today = new Date();
              const dayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
              const daysOfWeek = [
                "SUNDAY",
                "MONDAY",
                "TUESDAY",
                "WEDNESDAY",
                "THURSDAY",
                "FRIDAY",
                "SATURDAY",
              ];
              const dayOfWeek = daysOfWeek[dayIndex];
              const todayMeals =
                plan.meals?.filter((m) => m.dayOfWeek === dayOfWeek) || [];
              const consumedToday = todayMeals.filter((m) =>
                isMealConsumedToday(m.id)
              ).length;
              return `${consumedToday} de ${todayMeals.length} refeições consumidas hoje`;
            })()}
          </Text>
        </LinearGradient>

        {/* Meals List */}
        <View style={styles.mealsSection}>
          <Text style={styles.sectionTitle}>Refeições do Plano</Text>

          {!plan.meals || plan.meals.length === 0 ? (
            <View style={styles.emptyMeals}>
              <Ionicons
                name="restaurant-outline"
                size={48}
                color={lightTheme.colors.gray[400]}
              />
              <Text style={styles.emptyText}>
                Nenhuma refeição cadastrada neste plano
              </Text>
            </View>
          ) : (
            <View style={styles.mealsList}>
              {Object.entries(groupMealsByDay()).map(([day, meals]) => (
                <View key={day} style={styles.daySection}>
                  <View style={styles.dayHeader}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={lightTheme.colors.primary}
                    />
                    <Text style={styles.dayTitle}>
                      {getDayOfWeekLabel(day)}
                    </Text>
                  </View>

                  {meals.map((meal: Meal, index: number) => {
                    const consumed = isMealConsumed(meal.id); // Mudado para verificar consumo em qualquer dia
                    return (
                      <View
                        key={meal.id}
                        style={[
                          styles.mealCard,
                          consumed && styles.mealCardConsumed,
                        ]}
                      >
                        <View style={styles.mealCardHeader}>
                          <View
                            style={[
                              styles.mealIconContainer,
                              consumed && styles.mealIconConsumed,
                            ]}
                          >
                            <Ionicons
                              name={getMealTypeIcon(meal.type)}
                              size={24}
                              color={
                                consumed
                                  ? lightTheme.colors.white
                                  : lightTheme.colors.primary
                              }
                            />
                          </View>
                          <View style={styles.mealInfo}>
                            <Text style={styles.mealName} numberOfLines={1}>
                              {meal.name}
                            </Text>
                            <Text style={styles.mealType}>
                              {getMealTypeLabel(meal.type)}
                              {meal.time && ` • ${meal.time}`}
                            </Text>
                            {meal.nutrition && (
                              <Text style={styles.mealCalories}>
                                {Math.round(meal.nutrition.totalCalories)} kcal
                              </Text>
                            )}
                          </View>
                          {consumed && (
                            <Ionicons
                              name="checkmark-circle"
                              size={28}
                              color={lightTheme.colors.success}
                            />
                          )}
                        </View>

                        {/* Alimentos */}
                        {meal.items && meal.items.length > 0 && (
                          <View style={styles.foodItemsContainer}>
                            <Text style={styles.foodItemsTitle}>
                              Alimentos:
                            </Text>
                            {meal.items.map((item: any, idx: number) => {
                              let quantityText = "";
                              if (item.measurementUnit?.gramsEquivalent) {
                                const units =
                                  item.quantity /
                                  item.measurementUnit.gramsEquivalent;
                                quantityText = `${units.toFixed(1)} ${
                                  item.measurementUnit.abbreviation
                                } (${item.quantity}g)`;
                              } else {
                                quantityText = `${item.quantity}g`;
                              }

                              const hasSubstitutions =
                                item.substitutions &&
                                item.substitutions.length > 0;

                              return (
                                <View
                                  key={item.id || idx}
                                  style={styles.foodItemRow}
                                >
                                  <View style={styles.foodItemContent}>
                                    <Text style={styles.foodItemBullet}>•</Text>
                                    <View style={styles.foodItemTextContainer}>
                                      <Text style={styles.foodItemName}>
                                        {item.name}
                                      </Text>
                                      <Text style={styles.foodItemQuantity}>
                                        {quantityText}
                                      </Text>
                                    </View>
                                  </View>
                                  {hasSubstitutions && (
                                    <TouchableOpacity
                                      style={styles.substitutionButton}
                                      onPress={() => {
                                        setSelectedFoodItem(item);
                                        setSubstitutionModalVisible(true);
                                      }}
                                      activeOpacity={0.7}
                                    >
                                      <Ionicons
                                        name="swap-horizontal"
                                        size={18}
                                        color={lightTheme.colors.primary}
                                      />
                                      <Text
                                        style={styles.substitutionButtonText}
                                      >
                                        {item.substitutions.length}
                                      </Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        )}

                        {meal.observation && (
                          <View style={styles.observationContainer}>
                            <Ionicons
                              name="information-circle-outline"
                              size={16}
                              color={lightTheme.colors.gray[600]}
                            />
                            <Text
                              style={styles.mealObservation}
                              numberOfLines={2}
                            >
                              {meal.observation}
                            </Text>
                          </View>
                        )}

                        {!consumed && (
                          <TouchableOpacity
                            style={styles.checkInButton}
                            onPress={() =>
                              navigation.navigate("MealCheckIn", {
                                mealId: meal.id,
                                mealName: meal.name,
                                patientId,
                                planId: plan.id,
                              })
                            }
                          >
                            <Ionicons
                              name="checkmark-circle-outline"
                              size={20}
                              color={lightTheme.colors.primary}
                            />
                            <Text style={styles.checkInButtonText}>
                              Marcar como consumida
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de Substituições */}
      <Modal
        visible={substitutionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSubstitutionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Substituições</Text>
              <TouchableOpacity
                onPress={() => setSubstitutionModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={lightTheme.colors.gray[700]}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.originalFoodContainer}>
                <Text style={styles.originalFoodLabel}>Alimento original:</Text>
                <Text style={styles.originalFoodName}>
                  {selectedFoodItem?.name}
                </Text>
                <Text style={styles.originalFoodQuantity}>
                  {selectedFoodItem?.measurementUnit?.gramsEquivalent
                    ? `${(
                        selectedFoodItem.quantity /
                        selectedFoodItem.measurementUnit.gramsEquivalent
                      ).toFixed(1)} ${
                        selectedFoodItem.measurementUnit.abbreviation
                      } (${selectedFoodItem.quantity}g)`
                    : `${selectedFoodItem?.quantity}g`}
                </Text>
              </View>

              <Text style={styles.substitutionsTitle}>
                Você pode substituir por:
              </Text>

              {selectedFoodItem?.substitutions?.map(
                (sub: any, index: number) => {
                  let subQuantityText = "";
                  if (sub.measurementUnit?.gramsEquivalent) {
                    const units =
                      sub.quantity / sub.measurementUnit.gramsEquivalent;
                    subQuantityText = `${units.toFixed(1)} ${
                      sub.measurementUnit.abbreviation
                    } (${sub.quantity}g)`;
                  } else {
                    subQuantityText = `${sub.quantity}g`;
                  }

                  return (
                    <View key={sub.id || index} style={styles.substitutionItem}>
                      <View style={styles.substitutionHeader}>
                        <Ionicons
                          name="swap-horizontal"
                          size={20}
                          color={lightTheme.colors.primary}
                        />
                        <Text style={styles.substitutionName}>{sub.name}</Text>
                      </View>
                      <Text style={styles.substitutionQuantity}>
                        {subQuantityText}
                      </Text>
                      <View style={styles.substitutionNutrition}>
                        <View style={styles.nutritionItem}>
                          <Text style={styles.nutritionLabel}>Calorias:</Text>
                          <Text style={styles.nutritionValue}>
                            {Math.round(sub.calories)} kcal
                          </Text>
                        </View>
                        <View style={styles.nutritionItem}>
                          <Text style={styles.nutritionLabel}>Proteína:</Text>
                          <Text style={styles.nutritionValue}>
                            {sub.protein.toFixed(1)}g
                          </Text>
                        </View>
                        <View style={styles.nutritionItem}>
                          <Text style={styles.nutritionLabel}>Carbo:</Text>
                          <Text style={styles.nutritionValue}>
                            {sub.carbs.toFixed(1)}g
                          </Text>
                        </View>
                        <View style={styles.nutritionItem}>
                          <Text style={styles.nutritionLabel}>Gordura:</Text>
                          <Text style={styles.nutritionValue}>
                            {sub.fat.toFixed(1)}g
                          </Text>
                        </View>
                      </View>
                      {sub.observation && (
                        <Text style={styles.substitutionObservation}>
                          Obs: {sub.observation}
                        </Text>
                      )}
                    </View>
                  );
                }
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButtonBottom}
              onPress={() => setSubstitutionModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: lightTheme.colors.gray[50],
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: lightTheme.colors.gray[600],
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: lightTheme.colors.gray[50],
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: lightTheme.colors.gray[700],
    textAlign: "center",
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: lightTheme.colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.white,
  },
  headerCard: {
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  planName: {
    fontSize: 24,
    fontWeight: "bold",
    color: lightTheme.colors.white,
    textAlign: "center",
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: lightTheme.colors.white,
    opacity: 0.9,
    textAlign: "center",
    marginBottom: 24,
  },
  progressCircleContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  progressTextContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    fontSize: 32,
    fontWeight: "bold",
    color: lightTheme.colors.white,
  },
  progressLabel: {
    fontSize: 12,
    color: lightTheme.colors.white,
    opacity: 0.8,
    textTransform: "uppercase",
  },
  progressSubtext: {
    fontSize: 14,
    color: lightTheme.colors.white,
    opacity: 0.9,
    marginTop: 8,
  },
  mealsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: lightTheme.colors.gray[900],
    marginBottom: 16,
  },
  emptyMeals: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
  },
  mealsList: {
    gap: 16,
  },
  daySection: {
    marginBottom: 8,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingLeft: 4,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: lightTheme.colors.gray[900],
  },
  mealCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealCardConsumed: {
    opacity: 0.6,
  },
  mealCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mealIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: lightTheme.colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  mealIconConsumed: {
    backgroundColor: lightTheme.colors.success,
  },
  mealInfo: {
    flex: 1,
  },
  mealTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mealName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    color: lightTheme.colors.gray[900],
  },
  consumedBadge: {
    marginLeft: "auto",
  },
  mealType: {
    fontSize: 13,
    color: lightTheme.colors.gray[600],
    marginTop: 2,
  },
  mealCalories: {
    fontSize: 12,
    color: lightTheme.colors.gray[500],
    marginTop: 2,
  },
  mealObservation: {
    marginTop: 12,
    fontSize: 14,
    color: lightTheme.colors.gray[600],
    fontStyle: "italic",
  },
  checkInButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: lightTheme.colors.primary + "10",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: lightTheme.colors.primary + "40",
  },
  checkInButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: lightTheme.colors.primary,
  },
  foodItemsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[200],
  },
  foodItemsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: lightTheme.colors.gray[700],
    marginBottom: 8,
  },
  foodItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  foodItemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  foodItemBullet: {
    fontSize: 16,
    color: lightTheme.colors.gray[600],
    marginTop: 2,
  },
  foodItemTextContainer: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 14,
    color: lightTheme.colors.gray[800],
    fontWeight: "500",
  },
  foodItemQuantity: {
    fontSize: 13,
    color: lightTheme.colors.gray[600],
    marginTop: 2,
  },
  substitutionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: lightTheme.colors.primary + "15",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: lightTheme.colors.primary + "30",
  },
  substitutionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: lightTheme.colors.primary,
  },
  observationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[200],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: lightTheme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: lightTheme.colors.gray[900],
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollView: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  originalFoodContainer: {
    backgroundColor: lightTheme.colors.gray[100],
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  originalFoodLabel: {
    fontSize: 12,
    color: lightTheme.colors.gray[600],
    marginBottom: 4,
  },
  originalFoodName: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.gray[900],
    marginBottom: 4,
  },
  originalFoodQuantity: {
    fontSize: 14,
    color: lightTheme.colors.gray[700],
  },
  substitutionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.gray[800],
    marginBottom: 16,
  },
  substitutionItem: {
    backgroundColor: lightTheme.colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
  },
  substitutionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  substitutionName: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.gray[900],
    flex: 1,
  },
  substitutionQuantity: {
    fontSize: 14,
    color: lightTheme.colors.gray[700],
    marginBottom: 12,
  },
  substitutionNutrition: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  nutritionItem: {
    flex: 1,
    minWidth: "45%",
  },
  nutritionLabel: {
    fontSize: 12,
    color: lightTheme.colors.gray[600],
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: "600",
    color: lightTheme.colors.gray[900],
  },
  substitutionObservation: {
    marginTop: 12,
    fontSize: 13,
    color: lightTheme.colors.gray[600],
    fontStyle: "italic",
  },
  modalCloseButtonBottom: {
    margin: 20,
    padding: 16,
    backgroundColor: lightTheme.colors.primary,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.white,
  },
});
