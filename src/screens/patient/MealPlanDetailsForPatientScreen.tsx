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
} from "react-native";
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
import type { MealPlan, Meal } from "../../types/meal-plan.types";

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
  const patientId = user?.patientProfile?.id;

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [plan, setPlan] = React.useState<MealPlan | null>(null);
  const [consumptions, setConsumptions] = React.useState<MealConsumption[]>([]);

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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchPlanDetails();
  }, [fetchPlanDetails]);

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

  const calculateProgress = () => {
    if (!plan?.meals || plan.meals.length === 0) return 0;
    const totalMeals = plan.meals.length;
    const consumedMeals = plan.meals.filter((m) =>
      isMealConsumedToday(m.id)
    ).length;
    return Math.round((consumedMeals / totalMeals) * 100);
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
            {plan.meals?.filter((m) => isMealConsumedToday(m.id)).length || 0}{" "}
            de {plan.meals?.length || 0} refeições consumidas hoje
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
              {plan.meals.map((meal: Meal, index: number) => {
                const consumed = isMealConsumedToday(meal.id);
                return (
                  <TouchableOpacity
                    key={meal.id}
                    style={[
                      styles.mealCard,
                      consumed && styles.mealCardConsumed,
                    ]}
                    onPress={() =>
                      navigation.navigate("MealCheckIn", {
                        mealId: meal.id,
                        mealName: meal.name,
                        patientId,
                        planId: plan.id,
                      })
                    }
                    activeOpacity={0.7}
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
                        <View style={styles.mealTitleRow}>
                          <Text style={styles.mealName} numberOfLines={1}>
                            {meal.name}
                          </Text>
                          {consumed && (
                            <View style={styles.consumedBadge}>
                              <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color={lightTheme.colors.success}
                              />
                            </View>
                          )}
                        </View>
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
                      <Ionicons
                        name="chevron-forward"
                        size={24}
                        color={lightTheme.colors.gray[400]}
                      />
                    </View>

                    {meal.observation && (
                      <Text style={styles.mealObservation} numberOfLines={2}>
                        {meal.observation}
                      </Text>
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
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
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
    gap: 12,
  },
  mealCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealCardConsumed: {
    backgroundColor: lightTheme.colors.success + "10",
    borderWidth: 1,
    borderColor: lightTheme.colors.success + "40",
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
});
