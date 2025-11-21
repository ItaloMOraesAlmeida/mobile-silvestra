/**
 * MyMealPlansScreen
 * Feature #4 - App do Paciente
 *
 * Tela para listar planos alimentares do paciente com progresso de adesão
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
import { lightTheme } from "../../theme";
import { useAuthStore } from "../../stores/auth.store";
import {
  getPatientMealPlans,
  type PatientMealPlan,
} from "../../services/meal-consumption.service";

interface MyMealPlansScreenProps {
  navigation: any;
}

export function MyMealPlansScreen({ navigation }: MyMealPlansScreenProps) {
  const user = useAuthStore((s) => s.user);
  const patientId = user?.patientProfile?.id;

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [plans, setPlans] = React.useState<PatientMealPlan[]>([]);

  const fetchPlans = React.useCallback(async () => {
    if (!patientId) {
      setError("Perfil de paciente não encontrado");
      setLoading(false);
      return;
    }

    try {
      const response = await getPatientMealPlans(patientId);
      setPlans(response.plans || []);
      setError(null);
    } catch (err: any) {
      console.error("Erro ao buscar planos:", err);
      setError(err?.response?.data?.message || "Erro ao carregar planos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  React.useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchPlans();
  }, [fetchPlans]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return lightTheme.colors.success;
      case "completed":
        return lightTheme.colors.gray[400];
      case "cancelled":
        return lightTheme.colors.error;
      default:
        return lightTheme.colors.gray[500];
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "Ativo";
      case "completed":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return lightTheme.colors.success;
    if (progress >= 50) return lightTheme.colors.warning;
    return lightTheme.colors.error;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (!patientId) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={lightTheme.colors.gray[400]}
          />
          <Text style={styles.errorText}>
            Perfil de paciente não encontrado
          </Text>
          <Text style={styles.errorSubtext}>
            Entre em contato com seu nutricionista
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[lightTheme.colors.primary, lightTheme.colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Meus Planos</Text>
            <Text style={styles.headerSubtitle}>
              Acompanhe sua adesão alimentar
            </Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons
              name="nutrition-outline"
              size={32}
              color={lightTheme.colors.white}
            />
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
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
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={lightTheme.colors.primary} />
            <Text style={styles.loadingText}>Carregando planos...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={64}
              color={lightTheme.colors.error}
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchPlans}>
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="document-text-outline"
              size={64}
              color={lightTheme.colors.gray[400]}
            />
            <Text style={styles.emptyText}>Nenhum plano encontrado</Text>
            <Text style={styles.emptySubtext}>
              Seu nutricionista ainda não criou planos para você
            </Text>
          </View>
        ) : (
          <View style={styles.plansContainer}>
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={styles.planCard}
                onPress={() =>
                  navigation.navigate("MealPlanDetails", { planId: plan.id })
                }
                activeOpacity={0.7}
              >
                {/* Card Header */}
                <View style={styles.planHeader}>
                  <View style={styles.planTitleContainer}>
                    <Text style={styles.planName} numberOfLines={1}>
                      {plan.name}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(plan.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {getStatusLabel(plan.status)}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={lightTheme.colors.gray[400]}
                  />
                </View>

                {/* Objective */}
                {plan.objective && (
                  <Text style={styles.planObjective} numberOfLines={2}>
                    {plan.objective}
                  </Text>
                )}

                {/* Dates */}
                <View style={styles.planDates}>
                  <View style={styles.dateItem}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={lightTheme.colors.gray[500]}
                    />
                    <Text style={styles.dateText}>
                      {formatDate(plan.startDate)}
                    </Text>
                  </View>
                  {plan.endDate && (
                    <>
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color={lightTheme.colors.gray[400]}
                      />
                      <View style={styles.dateItem}>
                        <Text style={styles.dateText}>
                          {formatDate(plan.endDate)}
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Progress */}
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Adesão</Text>
                    <Text
                      style={[
                        styles.progressValue,
                        { color: getProgressColor(plan.progress) },
                      ]}
                    >
                      {plan.progress}%
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${plan.progress}%`,
                          backgroundColor: getProgressColor(plan.progress),
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.mealsInfo}>
                    <Text style={styles.mealsText}>
                      {plan.consumedMeals} de {plan.totalMeals} refeições
                      consumidas
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[50],
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: lightTheme.colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: lightTheme.colors.white,
    opacity: 0.9,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
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
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: lightTheme.colors.gray[700],
    textAlign: "center",
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: lightTheme.colors.gray[500],
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: lightTheme.colors.gray[700],
    textAlign: "center",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: lightTheme.colors.gray[500],
    textAlign: "center",
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  planTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: "bold",
    color: lightTheme.colors.gray[900],
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: lightTheme.colors.white,
    textTransform: "uppercase",
  },
  planObjective: {
    fontSize: 14,
    color: lightTheme.colors.gray[600],
    marginBottom: 12,
    lineHeight: 20,
  },
  planDates: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 13,
    color: lightTheme.colors.gray[600],
  },
  progressSection: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: lightTheme.colors.gray[700],
  },
  progressValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: lightTheme.colors.gray[200],
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  mealsInfo: {
    marginTop: 4,
  },
  mealsText: {
    fontSize: 12,
    color: lightTheme.colors.gray[500],
  },
});
