/**
 * PatientHomeScreen - Home refatorada do perfil do paciente
 *
 * Integra todas as funcionalidades implementadas:
 * - Plano alimentar do dia
 * - Consultas agendadas
 * - Últimas medições com gráfico
 * - Adesão e evolução
 * - Resumo informativo/insights
 * - Header com informações do nutricionista
 */

import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";
import { useAuthStore } from "../../stores/auth.store";
import { appointmentsService } from "../../services/appointments";
import { AppointmentStatus } from "../../types/appointments";
import {
  getPatientMealPlans,
  getMealConsumptions,
} from "../../services/meal-consumption.service";
import { getMealPlanById } from "../../services/meal-plan.service";
import { useBodyMeasurements } from "../../hooks/useBodyMeasurements";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 48;

interface PatientHomeScreenProps {
  navigation: any;
}

export function PatientHomeScreen({ navigation }: PatientHomeScreenProps) {
  const user = useAuthStore((s) => s.user);
  // ID do relacionamento Patient (paciente-nutricionista)
  const patientId = user?.patientProfile?.patients?.[0]?.id;

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Estado dos dados
  const [nutritionist, setNutritionist] = useState<any>(null);
  const [todayMealPlan, setTodayMealPlan] = useState<any>(null);
  const [todayMeals, setTodayMeals] = useState<any[]>([]);
  const [mealPlanExpanded, setMealPlanExpanded] = useState(false);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [recentMeasurements, setRecentMeasurements] = useState<any[]>([]);
  const [adherenceData, setAdherenceData] = useState<any>(null);

  // Estado para modal de substituições
  const [substitutionModalVisible, setSubstitutionModalVisible] =
    useState(false);
  const [selectedFoodItem, setSelectedFoodItem] = useState<any>(null);

  // Estado para modal de confirmação de check-in
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);

  const { listMeasurements } = useBodyMeasurements();

  // Carregar todos os dados
  const loadAllData = useCallback(async () => {
    if (!patientId) return;

    try {
      setLoading(true);

      // Carregar dados em paralelo
      await Promise.all([
        loadNutritionist(),
        loadTodayMealPlan(),
        loadNextAppointment(),
        loadRecentMeasurements(),
        loadAdherence(),
      ]);
    } catch (error) {
      console.error("❌ [PatientHome] Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // Carregar nutricionista
  const loadNutritionist = async () => {
    try {
      const data = await appointmentsService.findMyNutritionist();
      setNutritionist(data);
    } catch (error) {
      console.error("Erro ao carregar nutricionista:", error);
      setNutritionist(null);
    }
  };

  // Carregar plano alimentar de hoje
  const loadTodayMealPlan = async () => {
    try {
      if (!patientId) return;
      const response = await getPatientMealPlans(patientId);

      // Pegar plano mais recente com status ACTIVE
      const activePlan = response.plans?.find(
        (p: any) => p.status === "ACTIVE"
      );
      setTodayMealPlan(activePlan || null);
    } catch (error) {
      console.error("Erro ao carregar plano alimentar:", error);
      setTodayMealPlan(null);
    }
  };

  // Carregar próxima consulta
  const loadNextAppointment = async () => {
    try {
      const appointments = await appointmentsService.findMyAppointments({
        status: AppointmentStatus.CONFIRMED,
      });

      if (!Array.isArray(appointments) || appointments.length === 0) {
        setNextAppointment(null);
        return;
      }

      // Filtrar consultas futuras (ou de hoje) e pegar a mais próxima
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Zera as horas para comparar apenas datas

      const futureAppointments = appointments
        .filter((apt: any) => {
          // Extrair componentes UTC e criar data local para evitar problemas de timezone
          const dateUTC = new Date(apt.scheduledDate);
          const year = dateUTC.getUTCFullYear();
          const month = dateUTC.getUTCMonth();
          const day = dateUTC.getUTCDate();
          const aptDate = new Date(year, month, day);
          aptDate.setHours(0, 0, 0, 0);

          // Incluir consultas de hoje ou futuras
          return aptDate >= now;
        })
        .sort((a: any, b: any) => {
          // Ordenar por data e hora (mais próxima primeiro)
          const dateA = new Date(a.scheduledDate);
          const dateB = new Date(b.scheduledDate);

          // Se datas diferentes, ordenar por data
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA.getTime() - dateB.getTime();
          }

          // Se mesma data, ordenar por horário
          const timeA = a.scheduledTime || "00:00";
          const timeB = b.scheduledTime || "00:00";
          return timeA.localeCompare(timeB);
        });

      setNextAppointment(futureAppointments[0] || null);
    } catch (error) {
      console.error("Erro ao carregar próxima consulta:", error);
      setNextAppointment(null);
    }
  };

  // Carregar medições recentes
  const loadRecentMeasurements = async () => {
    try {
      if (!patientId) {
        return;
      }

      const result = await listMeasurements(patientId, {
        limit: 5,
        sortOrder: "desc",
      });

      // O retorno correto é result.measurements, não result.data
      const measurements = result?.measurements || [];

      setRecentMeasurements(measurements);
    } catch (error: any) {
      console.error(
        "❌ [loadRecentMeasurements] Erro ao carregar medições:",
        error
      );
      console.error(
        "❌ [loadRecentMeasurements] Error message:",
        error?.message
      );
      console.error(
        "❌ [loadRecentMeasurements] Error response:",
        error?.response?.data
      );
      setRecentMeasurements([]);
    }
  };

  // Carregar dados de adesão
  const loadAdherence = async () => {
    try {
      if (!patientId) return;
      const response = await getPatientMealPlans(patientId);

      const activePlan = response.plans?.find(
        (p: any) => p.status === "ACTIVE"
      );

      if (activePlan) {
        // Buscar consumos para calcular adesão real
        const consumptions = await getMealConsumptions({ patientId });

        // Buscar detalhes do plano para ter todas as refeições
        const planDetails = await getMealPlanById(activePlan.id);
        const allPlanMeals = planDetails.meals || [];

        // Calcular número TOTAL de dias do plano (início até fim)
        const startDate = new Date(activePlan.startDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = activePlan.endDate
          ? new Date(activePlan.endDate)
          : new Date();
        endDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Total de dias do plano (do início ao fim)
        const totalPlanDays =
          Math.floor(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          ) + 1;

        // Dias decorridos desde o início (para calcular refeições esperadas)
        let daysElapsed = 0;
        if (today >= startDate) {
          const analysisEndDate = endDate < today ? endDate : today;
          daysElapsed =
            Math.floor(
              (analysisEndDate.getTime() - startDate.getTime()) /
                (1000 * 60 * 60 * 24)
            ) + 1;
        }

        // Contar refeições únicas por dia da semana (quantas refeições por dia)
        const mealsPerDay: { [key: string]: number } = {};
        allPlanMeals.forEach((meal: any) => {
          const day = meal.dayOfWeek;
          mealsPerDay[day] = (mealsPerDay[day] || 0) + 1;
        });

        // Calcular total de refeições ESPERADAS até hoje
        // Para cada dia decorrido, contar quantas refeições deveriam ter sido consumidas
        let expectedMealsUntilToday = 0;
        for (let i = 0; i < daysElapsed; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
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
          expectedMealsUntilToday += mealsPerDay[dayOfWeek] || 0;
        }

        // Filtrar IDs das refeições do plano
        const planMealIds = allPlanMeals.map((m: any) => m.id);

        // Contar refeições consumidas deste plano
        const consumedMeals = consumptions.filter((c: any) =>
          planMealIds.includes(c.mealId)
        ).length;

        // Calcular percentual de adesão CORRETO
        // Adesão = (refeições consumidas / refeições esperadas até hoje) * 100
        const adherencePercentage =
          expectedMealsUntilToday > 0
            ? Math.round((consumedMeals / expectedMealsUntilToday) * 100)
            : 0;

        // Calcular total de refeições do plano completo (todas as semanas)
        const totalMealsInPlan = allPlanMeals.length; // Refeições únicas da semana
        const weeksInPlan = totalPlanDays / 7;
        const totalMealsEntirePlan = Math.ceil(totalMealsInPlan * weeksInPlan);

        // Calcular adesão em relação ao plano completo
        const overallAdherencePercentage =
          totalMealsEntirePlan > 0
            ? Math.round((consumedMeals / totalMealsEntirePlan) * 100)
            : 0;

        setAdherenceData({
          current: adherencePercentage, // Adesão até hoje
          overall: overallAdherencePercentage, // Adesão do plano completo
          totalDays: totalPlanDays, // Total de dias do plano
          daysElapsed: daysElapsed, // Dias decorridos
          consumedMeals: consumedMeals,
          totalMeals: expectedMealsUntilToday, // Refeições esperadas até hoje
          totalMealsInPlan: totalMealsEntirePlan, // Total de refeições do plano completo
        });
      } else {
        setAdherenceData(null);
      }
    } catch (error) {
      console.error("Erro ao carregar adesão:", error);
      setAdherenceData(null);
    }
  };

  // Buscar refeições do dia (do plano ativo)
  const loadTodayMeals = async () => {
    if (!todayMealPlan?.id || !patientId) {
      return;
    }

    try {
      setLoadingMeals(true);
      const planDetails = await getMealPlanById(todayMealPlan.id);

      // Filtrar refeições do dia atual usando getDay() para evitar problemas com Intl no Android
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
      const todayDayOfWeek = daysOfWeek[dayIndex];

      const allTodayMeals =
        planDetails.meals
          ?.filter((meal: any) => meal.dayOfWeek === todayDayOfWeek)
          .sort((a: any, b: any) => a.time.localeCompare(b.time)) || [];

      // Buscar consumos de hoje
      const consumptions = await getMealConsumptions({ patientId });

      // Filtrar apenas refeições ainda não consumidas hoje
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const consumedMealIds = consumptions
        .filter((c) => {
          const consumedAt = new Date(c.consumedAt);

          return consumedAt >= todayStart && consumedAt <= todayEnd;
        })
        .map((c) => c.mealId);

      const pendingMeals = allTodayMeals.filter((meal: any) => {
        const isConsumed = consumedMealIds.includes(meal.id);

        return !isConsumed; // Retornar apenas refeições NÃO consumidas
      });

      setTodayMeals(pendingMeals);
    } catch (error) {
      console.error("Erro ao carregar refeições do dia:", error);
      setTodayMeals([]);
    } finally {
      setLoadingMeals(false);
    }
  };

  const toggleMealPlan = () => {
    const newExpanded = !mealPlanExpanded;
    setMealPlanExpanded(newExpanded);

    // Sempre recarregar refeições ao expandir para garantir lista atualizada
    if (newExpanded) {
      loadTodayMeals();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Recarregar dados quando a tela receber foco (ex: volta do check-in)
  useFocusEffect(
    useCallback(() => {
      if (!patientId) return;

      // Recolher a seção de refeições ao entrar na tela
      setMealPlanExpanded(false);

      loadAllData();
    }, [patientId])
  );

  // Formatadores
  const formatDate = (dateString: string): string => {
    // Extrair ano, mês e dia da string ISO sem considerar timezone
    const date = new Date(dateString);
    // Usar UTC para evitar problemas de fuso horário
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    // Criar nova data no timezone local
    const localDate = new Date(year, month, day);

    return localDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (time: string): string => {
    return time.substring(0, 5);
  };

  const getMealTypeName = (type: string): string => {
    const types: { [key: string]: string } = {
      BREAKFAST: "Café da Manhã",
      MORNING_SNACK: "Lanche da Manhã",
      LUNCH: "Almoço",
      AFTERNOON_SNACK: "Lanche da Tarde",
      DINNER: "Jantar",
      EVENING_SNACK: "Ceia",
      PRE_WORKOUT: "Pré-treino",
      POST_WORKOUT: "Pós-treino",
    };
    return types[type] || type;
  };

  if (!patientId) {
    const hasPatientProfile = !!user?.patientProfile;
    const hasPatients =
      user?.patientProfile?.patients &&
      user?.patientProfile?.patients.length > 0;

    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle"
            size={64}
            color={lightTheme.colors.error}
          />
          <Text style={styles.errorText}>
            {!hasPatientProfile
              ? "Perfil de paciente não encontrado"
              : !hasPatients
              ? "Nutricionista não vinculado"
              : "Erro ao carregar dados"}
          </Text>
          <Text style={styles.errorSubtext}>
            {!hasPatientProfile
              ? "Você não possui um perfil de paciente no sistema."
              : !hasPatients
              ? "Você ainda não está vinculado a um nutricionista. Entre em contato com seu nutricionista para obter o código de acesso ou faça logout e login novamente."
              : "Erro ao carregar informações do paciente. Tente fazer logout e login novamente."}
          </Text>
          <View style={styles.errorActions}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => navigation.navigate("Profile")}
            >
              <Text style={styles.retryButtonText}>Ver Perfil</Text>
            </TouchableOpacity>
            {hasPatientProfile && !hasPatients && (
              <TouchableOpacity
                style={[styles.retryButton, styles.secondaryButton]}
                onPress={() => {
                  // Navegar para tela de inserir código de acesso
                  // @ts-ignore
                  navigation.navigate("AccessCode");
                }}
              >
                <Text
                  style={[styles.retryButtonText, styles.secondaryButtonText]}
                >
                  Inserir Código
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header com Gradient */}
        <LinearGradient
          colors={[lightTheme.colors.primary, lightTheme.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>
                Olá, {user?.name?.split(" ")[0] || "Paciente"}
              </Text>
              <Text style={styles.subtitle}>Como está sua saúde hoje?</Text>
            </View>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate("Profile")}
              activeOpacity={0.8}
            >
              <Ionicons name="person-circle" size={32} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Card do Nutricionista */}
          {nutritionist && (
            <View style={styles.nutritionistCard}>
              <View style={styles.nutritionistAvatar}>
                <Ionicons
                  name="person"
                  size={24}
                  color={lightTheme.colors.primary}
                />
              </View>
              <View style={styles.nutritionistInfo}>
                <Text style={styles.nutritionistLabel}>Seu Nutricionista</Text>
                <Text style={styles.nutritionistName}>
                  {nutritionist.user?.name || "Não informado"}
                </Text>
                {nutritionist.crn && (
                  <Text style={styles.nutritionistCRN}>
                    CRN: {nutritionist.crn}
                  </Text>
                )}
              </View>
              <TouchableOpacity style={styles.nutritionistButton}>
                <Ionicons
                  name="chatbubble-outline"
                  size={20}
                  color={lightTheme.colors.primary}
                />
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>

        {/* Plano Alimentar do Dia */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons
                name="restaurant"
                size={24}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Plano de Hoje</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("MyMealPlans")}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.card}>
              <ActivityIndicator
                size="large"
                color={lightTheme.colors.primary}
              />
            </View>
          ) : todayMealPlan ? (
            <View style={styles.mealPlanCard}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate("MealPlanDetailsForPatient", {
                    planId: todayMealPlan.id,
                  })
                }
              >
                <View style={styles.mealPlanHeader}>
                  <View style={styles.mealPlanBadge}>
                    <Text style={styles.mealPlanBadgeText}>Ativo</Text>
                  </View>
                  <Text style={styles.mealPlanTitle}>{todayMealPlan.name}</Text>
                </View>

                <Text style={styles.mealPlanDescription} numberOfLines={2}>
                  {todayMealPlan.description ||
                    "Seu plano alimentar personalizado"}
                </Text>

                <View style={styles.mealPlanStats}>
                  <View style={styles.mealPlanStat}>
                    <Ionicons
                      name="flame"
                      size={16}
                      color={lightTheme.colors.warning}
                    />
                    <Text style={styles.mealPlanStatText}>
                      {todayMealPlan.targetCalories || "---"} kcal
                    </Text>
                  </View>
                  <View style={styles.mealPlanStat}>
                    <Ionicons
                      name="restaurant"
                      size={16}
                      color={lightTheme.colors.primary}
                    />
                    <Text style={styles.mealPlanStatText}>
                      {todayMealPlan.totalMeals || 0} refeições
                    </Text>
                  </View>
                  <View style={styles.mealPlanStat}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={lightTheme.colors.success}
                    />
                    <Text style={styles.mealPlanStatText}>
                      {todayMealPlan.dailyProgress || 0}% hoje
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Botão Expandir/Recolher */}
              <TouchableOpacity
                style={styles.expandButton}
                onPress={toggleMealPlan}
                activeOpacity={0.7}
              >
                <Text style={styles.expandButtonText}>
                  {mealPlanExpanded
                    ? "Recolher refeições"
                    : "Ver refeições de hoje"}
                </Text>
                <Ionicons
                  name={mealPlanExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={lightTheme.colors.primary}
                />
              </TouchableOpacity>

              {/* Lista de Refeições do Dia */}
              {mealPlanExpanded && (
                <View style={styles.mealsContainer}>
                  {loadingMeals ? (
                    <ActivityIndicator
                      size="small"
                      color={lightTheme.colors.primary}
                    />
                  ) : todayMeals.length > 0 ? (
                    todayMeals.map((meal: any, index: number) => (
                      <View key={meal.id || index} style={styles.mealItem}>
                        <View style={styles.mealHeader}>
                          <View style={styles.mealHeaderLeft}>
                            <View style={styles.mealTimeContainer}>
                              <Ionicons
                                name="time-outline"
                                size={16}
                                color={lightTheme.colors.gray[600]}
                              />
                              <Text style={styles.mealTime}>{meal.time}</Text>
                            </View>
                            <Text style={styles.mealType}>
                              {getMealTypeName(meal.type)}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.checkInButtonHeader}
                            onPress={() => {
                              setSelectedMeal(meal);
                              setCheckInModalVisible(true);
                            }}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name="checkmark-circle-outline"
                              size={20}
                              color={lightTheme.colors.success}
                            />
                          </TouchableOpacity>
                        </View>
                        {meal.items && meal.items.length > 0 ? (
                          <View style={styles.foodItems}>
                            {meal.items.map((item: any, idx: number) => {
                              let quantityText = "";
                              if (item.measurementUnit?.gramsEquivalent) {
                                // Calcula quantas unidades baseado no peso
                                const units =
                                  item.quantity /
                                  item.measurementUnit.gramsEquivalent;
                                quantityText = `${units} ${item.measurementUnit.abbreviation} de ${item.quantity}g`;
                              } else {
                                // Apenas gramas
                                quantityText = `${item.quantity}g`;
                              }

                              const hasSubstitutions =
                                item.substitutions &&
                                item.substitutions.length > 0;

                              return (
                                <View
                                  key={item.id || idx}
                                  style={styles.foodItem}
                                >
                                  <Text style={styles.foodItemText}>
                                    {item.name} - {quantityText}
                                  </Text>
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
                        ) : (
                          <Text style={styles.noFoodsText}>
                            Nenhum alimento cadastrado
                          </Text>
                        )}
                      </View>
                    ))
                  ) : (
                    <View style={styles.allMealsCompletedContainer}>
                      <Ionicons
                        name="checkmark-done-circle"
                        size={48}
                        color={lightTheme.colors.success}
                      />
                      <Text style={styles.allMealsCompletedTitle}>
                        Parabéns! 🎉
                      </Text>
                      <Text style={styles.allMealsCompletedText}>
                        Todas as refeições de hoje foram concluídas
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons
                name="restaurant-outline"
                size={48}
                color={lightTheme.colors.gray[300]}
              />
              <Text style={styles.emptyCardTitle}>Nenhum plano ativo</Text>
              <Text style={styles.emptyCardText}>
                Seu nutricionista ainda não criou um plano alimentar para você
              </Text>
            </View>
          )}
        </View>

        {/* Adesão ao Plano */}
        {adherenceData && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons
                  name="checkmark-done"
                  size={24}
                  color={lightTheme.colors.primary}
                />
                <Text style={styles.sectionTitle}>Sua Adesão</Text>
              </View>
            </View>

            <View style={styles.adherenceCard}>
              {/* Adesão Atual (período decorrido) */}
              <View style={styles.adherenceHeader}>
                <View style={styles.adherenceCircle}>
                  <Text style={styles.adherencePercentage}>
                    {Math.round(adherenceData.current)}%
                  </Text>
                  <Text style={styles.adherenceCircleLabel}>Atual</Text>
                </View>
                <View style={styles.adherenceInfo}>
                  <Text style={styles.adherenceTitle}>
                    {adherenceData.current >= 80
                      ? "Excelente progresso!"
                      : adherenceData.current >= 60
                      ? "Bom progresso!"
                      : adherenceData.current >= 40
                      ? "Continue se esforçando!"
                      : "Vamos retomar o foco!"}
                  </Text>
                  <Text style={styles.adherenceText}>
                    {adherenceData.consumedMeals}/{adherenceData.totalMeals}{" "}
                    refeições nos últimos {adherenceData.daysElapsed} dias
                  </Text>
                </View>
              </View>

              {/* Separador */}
              <View style={styles.adherenceSeparator} />

              {/* Visão Geral do Plano Completo */}
              <View style={styles.adherenceOverall}>
                <View style={styles.adherenceOverallHeader}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={lightTheme.colors.textSecondary}
                  />
                  <Text style={styles.adherenceOverallTitle}>
                    Visão Geral do Plano
                  </Text>
                </View>

                <View style={styles.adherenceStats}>
                  <View style={styles.adherenceStat}>
                    <Text style={styles.adherenceStatValue}>
                      {adherenceData.totalDays || 0}
                    </Text>
                    <Text style={styles.adherenceStatLabel}>Dias totais</Text>
                  </View>
                  <View style={styles.adherenceDivider} />
                  <View style={styles.adherenceStat}>
                    <Text style={styles.adherenceStatValue}>
                      {adherenceData.consumedMeals || 0}/
                      {adherenceData.totalMealsInPlan || 0}
                    </Text>
                    <Text style={styles.adherenceStatLabel}>Refeições</Text>
                  </View>
                  <View style={styles.adherenceDivider} />
                  <View style={styles.adherenceStat}>
                    <Text style={styles.adherenceStatValue}>
                      {Math.round(adherenceData.overall || 0)}%
                    </Text>
                    <Text style={styles.adherenceStatLabel}>Progresso</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Próxima Consulta */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons
                name="calendar"
                size={24}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Próxima Consulta</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("PatientAppointments")}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.card}>
              <ActivityIndicator
                size="large"
                color={lightTheme.colors.primary}
              />
            </View>
          ) : nextAppointment ? (
            <TouchableOpacity
              style={styles.appointmentCard}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate("PatientAppointmentDetails", {
                  appointmentId: nextAppointment.id,
                })
              }
            >
              <View style={styles.appointmentIconContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={32}
                  color={lightTheme.colors.primary}
                />
              </View>
              <View style={styles.appointmentInfo}>
                <Text style={styles.appointmentDate}>
                  {formatDate(nextAppointment.scheduledDate)}
                </Text>
                <Text style={styles.appointmentTime}>
                  {formatTime(nextAppointment.scheduledTime)}
                </Text>
                <View style={styles.appointmentType}>
                  <Ionicons
                    name={nextAppointment.isOnline ? "videocam" : "location"}
                    size={14}
                    color={lightTheme.colors.gray[600]}
                  />
                  <Text style={styles.appointmentTypeText}>
                    {nextAppointment.isOnline ? "Online" : "Presencial"}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={lightTheme.colors.gray[400]}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons
                name="calendar-outline"
                size={48}
                color={lightTheme.colors.gray[300]}
              />
              <Text style={styles.emptyCardTitle}>
                Nenhuma consulta agendada
              </Text>
              <Text style={styles.emptyCardText}>
                Agende uma consulta com seu nutricionista
              </Text>
              <TouchableOpacity
                style={styles.emptyCardButton}
                onPress={() => navigation.navigate("RequestAppointment")}
              >
                <Text style={styles.emptyCardButtonText}>
                  Solicitar Consulta
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Últimas Medições */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons
                name="analytics"
                size={24}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Suas Medições</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("MyMeasurements")}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.card}>
              <ActivityIndicator
                size="large"
                color={lightTheme.colors.primary}
              />
            </View>
          ) : recentMeasurements.length > 0 ? (
            <TouchableOpacity
              style={styles.measurementsCard}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate("PatientMeasurementDetails", {
                  measurement: recentMeasurements[0],
                })
              }
            >
              <View style={styles.measurementHighlights}>
                <View style={styles.measurementHighlight}>
                  <Ionicons
                    name="scale-outline"
                    size={24}
                    color={lightTheme.colors.primary}
                  />
                  <Text style={styles.measurementValue}>
                    {recentMeasurements[0].weight?.toFixed(1) || "--"} kg
                  </Text>
                  <Text style={styles.measurementLabel}>Peso</Text>
                </View>

                {recentMeasurements[0].bmi && (
                  <View style={styles.measurementHighlight}>
                    <Ionicons
                      name="analytics-outline"
                      size={24}
                      color={lightTheme.colors.primary}
                    />
                    <Text style={styles.measurementValue}>
                      {recentMeasurements[0].bmi.toFixed(1)}
                    </Text>
                    <Text style={styles.measurementLabel}>IMC</Text>
                  </View>
                )}

                {recentMeasurements[0].bodyFatPercent && (
                  <View style={styles.measurementHighlight}>
                    <Ionicons
                      name="water-outline"
                      size={24}
                      color={lightTheme.colors.primary}
                    />
                    <Text style={styles.measurementValue}>
                      {recentMeasurements[0].bodyFatPercent.toFixed(1)}%
                    </Text>
                    <Text style={styles.measurementLabel}>Gordura</Text>
                  </View>
                )}

                {recentMeasurements[0].muscleMass && (
                  <View style={styles.measurementHighlight}>
                    <Ionicons
                      name="fitness-outline"
                      size={24}
                      color={lightTheme.colors.primary}
                    />
                    <Text style={styles.measurementValue}>
                      {recentMeasurements[0].muscleMass.toFixed(1)} kg
                    </Text>
                    <Text style={styles.measurementLabel}>Músculo</Text>
                  </View>
                )}
              </View>

              {recentMeasurements.length > 1 && (
                <View style={styles.measurementComparison}>
                  <Ionicons
                    name={
                      recentMeasurements[0].weight >
                      recentMeasurements[1].weight
                        ? "trending-up"
                        : "trending-down"
                    }
                    size={16}
                    color={
                      recentMeasurements[0].weight >
                      recentMeasurements[1].weight
                        ? lightTheme.colors.warning
                        : lightTheme.colors.success
                    }
                  />
                  <Text style={styles.measurementComparisonText}>
                    {Math.abs(
                      recentMeasurements[0].weight -
                        recentMeasurements[1].weight
                    ).toFixed(1)}{" "}
                    kg desde a última medição
                  </Text>
                </View>
              )}

              <View style={styles.measurementFooter}>
                <Text style={styles.measurementDate}>
                  {new Date(recentMeasurements[0].createdAt).toLocaleDateString(
                    "pt-BR"
                  )}
                </Text>
                <View style={styles.measurementAction}>
                  <Text style={styles.measurementActionText}>Ver detalhes</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={lightTheme.colors.primary}
                  />
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons
                name="analytics-outline"
                size={48}
                color={lightTheme.colors.gray[300]}
              />
              <Text style={styles.emptyCardTitle}>
                Nenhuma medição registrada
              </Text>
              <Text style={styles.emptyCardText}>
                Aguarde seu nutricionista registrar suas primeiras medições
              </Text>
            </View>
          )}
        </View>

        {/* Ações Rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>

          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate("MyMealPlans")}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: lightTheme.colors.primary + "20" },
                ]}
              >
                <Ionicons
                  name="restaurant"
                  size={24}
                  color={lightTheme.colors.primary}
                />
              </View>
              <Text style={styles.quickActionText}>Meus Planos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate("PatientAppointments")}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: lightTheme.colors.success + "20" },
                ]}
              >
                <Ionicons
                  name="calendar"
                  size={24}
                  color={lightTheme.colors.success}
                />
              </View>
              <Text style={styles.quickActionText}>Consultas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate("MyMeasurements")}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: lightTheme.colors.warning + "20" },
                ]}
              >
                <Ionicons
                  name="analytics"
                  size={24}
                  color={lightTheme.colors.warning}
                />
              </View>
              <Text style={styles.quickActionText}>Medições</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate("MyGoals")}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: lightTheme.colors.info + "20" },
                ]}
              >
                <Ionicons
                  name="flag"
                  size={24}
                  color={lightTheme.colors.info}
                />
              </View>
              <Text style={styles.quickActionText}>Metas</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal de Substituições */}
      <Modal
        visible={substitutionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSubstitutionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Substituições Disponíveis</Text>
              <TouchableOpacity
                onPress={() => setSubstitutionModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={lightTheme.colors.gray[600]}
                />
              </TouchableOpacity>
            </View>

            {selectedFoodItem && (
              <>
                <View style={styles.originalFoodCard}>
                  <Text style={styles.originalFoodLabel}>
                    Alimento Original:
                  </Text>
                  <Text style={styles.originalFoodName}>
                    {selectedFoodItem.name}
                  </Text>
                  <Text style={styles.originalFoodQuantity}>
                    {selectedFoodItem.measurementUnit?.gramsEquivalent
                      ? `${
                          selectedFoodItem.quantity /
                          selectedFoodItem.measurementUnit.gramsEquivalent
                        } ${selectedFoodItem.measurementUnit.abbreviation} de ${
                          selectedFoodItem.quantity
                        }g`
                      : `${selectedFoodItem.quantity}g`}
                  </Text>
                </View>

                <View style={styles.substitutionsDivider}>
                  <View style={styles.substitutionsDividerLine} />
                  <Ionicons
                    name="swap-vertical"
                    size={20}
                    color={lightTheme.colors.primary}
                  />
                  <View style={styles.substitutionsDividerLine} />
                </View>

                <ScrollView style={styles.substitutionsList}>
                  {selectedFoodItem.substitutions.map(
                    (sub: any, index: number) => (
                      <View
                        key={sub.id || index}
                        style={styles.substitutionCard}
                      >
                        <View style={styles.substitutionHeader}>
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={lightTheme.colors.success}
                          />
                          <Text style={styles.substitutionName}>
                            {sub.name}
                          </Text>
                        </View>
                        <Text style={styles.substitutionQuantity}>
                          {sub.measurementUnit?.gramsEquivalent
                            ? `${
                                sub.quantity /
                                sub.measurementUnit.gramsEquivalent
                              } ${sub.measurementUnit.abbreviation} de ${
                                sub.quantity
                              }g`
                            : `${sub.quantity}g`}
                        </Text>
                        <View style={styles.substitutionNutrition}>
                          <View style={styles.substitutionNutritionItem}>
                            <Text style={styles.substitutionNutritionValue}>
                              {sub.calories?.toFixed(0) || 0}
                            </Text>
                            <Text style={styles.substitutionNutritionLabel}>
                              kcal
                            </Text>
                          </View>
                          <View style={styles.substitutionNutritionItem}>
                            <Text style={styles.substitutionNutritionValue}>
                              {sub.protein?.toFixed(1) || 0}g
                            </Text>
                            <Text style={styles.substitutionNutritionLabel}>
                              Proteína
                            </Text>
                          </View>
                          <View style={styles.substitutionNutritionItem}>
                            <Text style={styles.substitutionNutritionValue}>
                              {sub.carbs?.toFixed(1) || 0}g
                            </Text>
                            <Text style={styles.substitutionNutritionLabel}>
                              Carbo
                            </Text>
                          </View>
                          <View style={styles.substitutionNutritionItem}>
                            <Text style={styles.substitutionNutritionValue}>
                              {sub.fat?.toFixed(1) || 0}g
                            </Text>
                            <Text style={styles.substitutionNutritionLabel}>
                              Gordura
                            </Text>
                          </View>
                        </View>
                      </View>
                    )
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmação de Check-in */}
      <Modal
        visible={checkInModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCheckInModalVisible(false)}
      >
        <View style={styles.checkInModalOverlay}>
          <View style={styles.checkInModalContent}>
            <View style={styles.checkInModalIcon}>
              <Ionicons
                name="checkmark-circle"
                size={48}
                color={lightTheme.colors.success}
              />
            </View>

            <Text style={styles.checkInModalTitle}>Confirmar Check-in</Text>
            <Text style={styles.checkInModalText}>
              Deseja registrar o consumo de{" "}
              <Text style={styles.checkInModalMealName}>
                {selectedMeal?.name}
              </Text>
              ?
            </Text>

            <View style={styles.checkInModalButtons}>
              <TouchableOpacity
                style={styles.checkInModalButtonCancel}
                onPress={() => setCheckInModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.checkInModalButtonCancelText}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkInModalButtonConfirm}
                onPress={() => {
                  setCheckInModalVisible(false);
                  navigation.navigate("MealCheckIn", {
                    mealId: selectedMeal?.id,
                    mealName: selectedMeal?.name,
                    patientId,
                    planId: todayMealPlan?.id,
                  });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.checkInModalButtonConfirmText}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
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
  scrollContent: {
    paddingBottom: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: lightTheme.colors.gray[900],
    textAlign: "center",
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  errorActions: {
    marginTop: 24,
    flexDirection: "row",
    gap: 12,
  },
  retryButton: {
    backgroundColor: lightTheme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: lightTheme.colors.primary,
  },
  secondaryButtonText: {
    color: lightTheme.colors.primary,
  },

  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Nutritionist Card
  nutritionistCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    ...lightTheme.shadows.sm,
  },
  nutritionistAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: lightTheme.colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  nutritionistInfo: {
    flex: 1,
  },
  nutritionistLabel: {
    fontSize: 12,
    color: lightTheme.colors.gray[600],
    marginBottom: 2,
  },
  nutritionistName: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.gray[900],
    marginBottom: 2,
  },
  nutritionistCRN: {
    fontSize: 13,
    color: lightTheme.colors.gray[500],
  },
  nutritionistButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: lightTheme.colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },

  // Section
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: lightTheme.colors.gray[900],
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: lightTheme.colors.primary,
  },

  // Cards
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    ...lightTheme.shadows.sm,
  },

  // Meal Plan Card
  mealPlanCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    ...lightTheme.shadows.md,
  },
  mealPlanHeader: {
    marginBottom: 12,
  },
  mealPlanBadge: {
    alignSelf: "flex-start",
    backgroundColor: lightTheme.colors.success + "20",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  mealPlanBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: lightTheme.colors.success,
  },
  mealPlanTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: lightTheme.colors.gray[900],
  },
  mealPlanDescription: {
    fontSize: 14,
    color: lightTheme.colors.gray[600],
    marginBottom: 16,
    lineHeight: 20,
  },
  mealPlanStats: {
    flexDirection: "row",
    gap: 16,
  },
  mealPlanStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mealPlanStatText: {
    fontSize: 13,
    fontWeight: "600",
    color: lightTheme.colors.gray[700],
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[200],
    gap: 8,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: lightTheme.colors.primary,
  },
  mealsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[200],
  },
  mealItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mealHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  mealTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkInButtonHeader: {
    padding: 4,
  },
  mealTime: {
    fontSize: 14,
    fontWeight: "600",
    color: lightTheme.colors.gray[700],
  },
  mealType: {
    fontSize: 13,
    fontWeight: "600",
    color: lightTheme.colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  foodItems: {
    gap: 6,
  },
  foodItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  foodItemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: lightTheme.colors.gray[400],
    marginTop: 6,
  },
  foodItemText: {
    flex: 1,
    fontSize: 14,
    color: lightTheme.colors.gray[700],
    lineHeight: 20,
  },
  noFoodsText: {
    fontSize: 13,
    color: lightTheme.colors.gray[500],
    fontStyle: "italic",
  },
  noMealsText: {
    fontSize: 14,
    color: lightTheme.colors.gray[500],
    textAlign: "center",
    padding: 16,
  },
  allMealsCompletedContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  allMealsCompletedTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: lightTheme.colors.gray[900],
    marginTop: 8,
  },
  allMealsCompletedText: {
    fontSize: 14,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
  },

  // Modal de Confirmação de Check-in
  checkInModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  checkInModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  checkInModalIcon: {
    marginBottom: 16,
  },
  checkInModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: lightTheme.colors.gray[900],
    marginBottom: 8,
    textAlign: "center",
  },
  checkInModalText: {
    fontSize: 15,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  checkInModalMealName: {
    fontWeight: "600",
    color: lightTheme.colors.gray[900],
  },
  checkInModalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  checkInModalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: lightTheme.colors.gray[100],
    alignItems: "center",
  },
  checkInModalButtonCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: lightTheme.colors.gray[700],
  },
  checkInModalButtonConfirm: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: lightTheme.colors.success,
    alignItems: "center",
  },
  checkInModalButtonConfirmText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },

  // Appointment Card
  appointmentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    ...lightTheme.shadows.md,
  },
  appointmentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: lightTheme.colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.gray[900],
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 24,
    fontWeight: "bold",
    color: lightTheme.colors.primary,
    marginBottom: 4,
  },
  appointmentType: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  appointmentTypeText: {
    fontSize: 13,
    color: lightTheme.colors.gray[600],
  },

  // Measurements Card
  measurementsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    ...lightTheme.shadows.md,
  },
  measurementHighlights: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  measurementHighlight: {
    alignItems: "center",
    flex: 1,
    gap: 4,
  },
  measurementValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: lightTheme.colors.gray[900],
  },
  measurementLabel: {
    fontSize: 11,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
  },
  measurementComparison: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: 8,
  },
  measurementComparisonText: {
    fontSize: 13,
    color: lightTheme.colors.gray[700],
    fontWeight: "500",
  },
  measurementFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[100],
  },
  measurementDate: {
    fontSize: 13,
    color: lightTheme.colors.gray[600],
  },
  measurementAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  measurementActionText: {
    fontSize: 13,
    color: lightTheme.colors.primary,
    fontWeight: "600",
  },

  // Adherence Card
  adherenceCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    ...lightTheme.shadows.md,
  },
  adherenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  adherenceCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: lightTheme.colors.success + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  adherencePercentage: {
    fontSize: 24,
    fontWeight: "bold",
    color: lightTheme.colors.success,
  },
  adherenceCircleLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: lightTheme.colors.success,
    marginTop: 2,
    textTransform: "uppercase",
  },
  adherenceInfo: {
    flex: 1,
  },
  adherenceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.gray[900],
    marginBottom: 4,
  },
  adherenceText: {
    fontSize: 13,
    color: lightTheme.colors.gray[600],
    lineHeight: 18,
  },
  adherenceStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  adherenceStat: {
    flex: 1,
    alignItems: "center",
  },
  adherenceStatValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: lightTheme.colors.primary,
    marginBottom: 4,
  },
  adherenceStatLabel: {
    fontSize: 12,
    color: lightTheme.colors.gray[600],
  },
  adherenceDivider: {
    width: 1,
    height: 40,
    backgroundColor: lightTheme.colors.gray[200],
  },
  adherenceSeparator: {
    height: 1,
    backgroundColor: lightTheme.colors.gray[200],
    marginVertical: 16,
  },
  adherenceOverall: {
    marginTop: 4,
  },
  adherenceOverallHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  adherenceOverallTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: lightTheme.colors.textSecondary,
    marginLeft: 6,
  },

  // Empty Card
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    ...lightTheme.shadows.sm,
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.gray[700],
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCardText: {
    fontSize: 14,
    color: lightTheme.colors.gray[500],
    textAlign: "center",
    lineHeight: 20,
  },
  emptyCardButton: {
    marginTop: 16,
    backgroundColor: lightTheme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyCardButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  quickAction: {
    flex: 1,
    minWidth: (CARD_WIDTH - 12) / 2,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    ...lightTheme.shadows.sm,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: lightTheme.colors.gray[700],
  },

  bottomSpacer: {
    height: 24,
  },

  // Food Item com botão de substituição
  foodItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  substitutionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginLeft: 8,
  },
  substitutionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: lightTheme.colors.primary,
  },

  // Modal de Substituições
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: lightTheme.colors.gray[900],
  },
  originalFoodCard: {
    backgroundColor: lightTheme.colors.primary + "10",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  originalFoodLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: lightTheme.colors.primary,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  originalFoodName: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.gray[900],
    marginBottom: 4,
  },
  originalFoodQuantity: {
    fontSize: 14,
    color: lightTheme.colors.gray[600],
  },
  substitutionsDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  substitutionsDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: lightTheme.colors.gray[200],
  },
  substitutionsList: {
    maxHeight: 400,
  },
  substitutionCard: {
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
  },
  substitutionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  substitutionName: {
    fontSize: 15,
    fontWeight: "600",
    color: lightTheme.colors.gray[900],
    flex: 1,
  },
  substitutionQuantity: {
    fontSize: 14,
    color: lightTheme.colors.gray[600],
    marginBottom: 12,
  },
  substitutionNutrition: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  substitutionNutritionItem: {
    flex: 1,
    alignItems: "center",
  },
  substitutionNutritionValue: {
    fontSize: 14,
    fontWeight: "600",
    color: lightTheme.colors.gray[900],
    marginBottom: 2,
  },
  substitutionNutritionLabel: {
    fontSize: 11,
    color: lightTheme.colors.gray[500],
  },
});
