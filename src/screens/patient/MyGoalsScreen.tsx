/**
 * MyGoalsScreen
 * Feature #4 - App do Paciente
 *
 * Tela para visualizar metas e progresso
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
import {
  getPatientGoals,
  type PatientGoal,
} from "../../services/meal-consumption.service";

interface MyGoalsScreenProps {
  navigation: any;
}

export function MyGoalsScreen({ navigation }: MyGoalsScreenProps) {
  const user = useAuthStore((s) => s.user);
  // ID do relacionamento Patient (paciente-nutricionista)
  const patientId = user?.patientProfile?.patients?.[0]?.id;

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [goals, setGoals] = React.useState<PatientGoal[]>([]);

  const fetchGoals = React.useCallback(async () => {
    if (!patientId) {
      setError("Perfil de paciente não encontrado");
      setLoading(false);
      return;
    }

    try {
      const response = await getPatientGoals(patientId);
      setGoals(response.goals || []);
      setError(null);
    } catch (err: any) {
      console.error("Erro ao buscar metas:", err);
      setError(err?.response?.data?.message || "Erro ao carregar metas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  React.useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchGoals();
  }, [fetchGoals]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return lightTheme.colors.primary;
      case "achieved":
        return lightTheme.colors.success;
      case "abandoned":
        return lightTheme.colors.gray[400];
      default:
        return lightTheme.colors.gray[500];
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "Em Progresso";
      case "achieved":
        return "Alcançada";
      case "abandoned":
        return "Abandonada";
      default:
        return status;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return lightTheme.colors.success;
    if (progress >= 50) return lightTheme.colors.warning;
    return lightTheme.colors.primary;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Sem prazo";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const calculateDaysLeft = (deadline?: string) => {
    if (!deadline) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isGoalNearDeadline = (deadline?: string) => {
    const daysLeft = calculateDaysLeft(deadline);
    return daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;
  };

  const isGoalOverdue = (deadline?: string) => {
    const daysLeft = calculateDaysLeft(deadline);
    return daysLeft !== null && daysLeft < 0;
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
        </View>
      </View>
    );
  }

  const activeGoals = goals.filter((g) => g.status === "ACTIVE");
  const achievedGoals = goals.filter((g) => g.status === "ACHIEVED");

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
            <Text style={styles.headerTitle}>Minhas Metas</Text>
            <Text style={styles.headerSubtitle}>Acompanhe seus objetivos</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons
              name="trophy-outline"
              size={32}
              color={lightTheme.colors.white}
            />
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{activeGoals.length}</Text>
            <Text style={styles.summaryLabel}>Ativas</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{achievedGoals.length}</Text>
            <Text style={styles.summaryLabel}>Alcançadas</Text>
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
            <Text style={styles.loadingText}>Carregando metas...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={64}
              color={lightTheme.colors.error}
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchGoals}>
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : goals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="trophy-outline"
              size={64}
              color={lightTheme.colors.gray[400]}
            />
            <Text style={styles.emptyText}>Nenhuma meta cadastrada</Text>
            <Text style={styles.emptySubtext}>
              Seu nutricionista criará metas personalizadas para você
            </Text>
          </View>
        ) : (
          <View style={styles.goalsContainer}>
            {/* Active Goals */}
            {activeGoals.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Metas Ativas</Text>
                {activeGoals.map((goal) => {
                  const daysLeft = calculateDaysLeft(goal.deadline);
                  const isNearDeadline = isGoalNearDeadline(goal.deadline);
                  const isOverdue = isGoalOverdue(goal.deadline);

                  return (
                    <View
                      key={goal.id}
                      style={[
                        styles.goalCard,
                        isOverdue && styles.goalCardOverdue,
                      ]}
                    >
                      {/* Progress Circle */}
                      <View style={styles.goalHeader}>
                        <View style={styles.progressCircleContainer}>
                          <Svg width={80} height={80}>
                            <Circle
                              cx={40}
                              cy={40}
                              r={32}
                              stroke={lightTheme.colors.gray[200]}
                              strokeWidth={6}
                              fill="none"
                            />
                            <Circle
                              cx={40}
                              cy={40}
                              r={32}
                              stroke={getProgressColor(goal.progress)}
                              strokeWidth={6}
                              fill="none"
                              strokeDasharray={`${
                                (goal.progress / 100) * 200
                              } 200`}
                              strokeLinecap="round"
                              rotation="-90"
                              origin="40, 40"
                            />
                          </Svg>
                          <View style={styles.progressTextContainer}>
                            <Text style={styles.progressPercentage}>
                              {goal.progress}%
                            </Text>
                          </View>
                        </View>

                        <View style={styles.goalInfo}>
                          <Text style={styles.goalName} numberOfLines={2}>
                            {goal.name}
                          </Text>
                          <View style={styles.goalValues}>
                            <View style={styles.valueItem}>
                              <Text style={styles.valueLabel}>Atual</Text>
                              <Text style={styles.valueText}>
                                {goal.currentValue} {goal.unit}
                              </Text>
                            </View>
                            <Ionicons
                              name="arrow-forward"
                              size={16}
                              color={lightTheme.colors.gray[400]}
                            />
                            <View style={styles.valueItem}>
                              <Text style={styles.valueLabel}>Meta</Text>
                              <Text style={styles.valueText}>
                                {goal.targetValue} {goal.unit}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Deadline */}
                      {goal.deadline && (
                        <View
                          style={[
                            styles.deadlineContainer,
                            isOverdue && styles.deadlineOverdue,
                            isNearDeadline && styles.deadlineNear,
                          ]}
                        >
                          <Ionicons
                            name={
                              isOverdue
                                ? "alert-circle"
                                : isNearDeadline
                                ? "warning"
                                : "calendar-outline"
                            }
                            size={16}
                            color={
                              isOverdue
                                ? lightTheme.colors.error
                                : isNearDeadline
                                ? lightTheme.colors.warning
                                : lightTheme.colors.gray[600]
                            }
                          />
                          <Text
                            style={[
                              styles.deadlineText,
                              isOverdue && styles.deadlineTextOverdue,
                              isNearDeadline && styles.deadlineTextNear,
                            ]}
                          >
                            {isOverdue
                              ? `Atrasado há ${Math.abs(daysLeft!)} dias`
                              : daysLeft === 0
                              ? "Prazo é hoje!"
                              : `${daysLeft} ${
                                  daysLeft === 1 ? "dia" : "dias"
                                } restantes`}
                          </Text>
                          <Text style={styles.deadlineDate}>
                            ({formatDate(goal.deadline)})
                          </Text>
                        </View>
                      )}

                      {/* Progress Bar */}
                      <View style={styles.progressBarContainer}>
                        <View
                          style={[
                            styles.progressBar,
                            {
                              width: `${goal.progress}%`,
                              backgroundColor: getProgressColor(goal.progress),
                            },
                          ]}
                        />
                      </View>

                      {/* Footer */}
                      <View style={styles.goalFooter}>
                        <Text style={styles.initialValueText}>
                          Inicial: {goal.initialValue} {goal.unit}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(goal.status) },
                          ]}
                        >
                          <Text style={styles.statusText}>
                            {getStatusLabel(goal.status)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </>
            )}

            {/* Achieved Goals */}
            {achievedGoals.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                  Metas Alcançadas 🎉
                </Text>
                {achievedGoals.map((goal) => (
                  <View key={goal.id} style={styles.goalCardAchieved}>
                    <View style={styles.achievedHeader}>
                      <Ionicons
                        name="checkmark-circle"
                        size={48}
                        color={lightTheme.colors.success}
                      />
                      <View style={styles.achievedInfo}>
                        <Text style={styles.goalName}>{goal.name}</Text>
                        <Text style={styles.achievedValue}>
                          {goal.targetValue} {goal.unit} alcançados!
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}
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
    marginBottom: 20,
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
  summaryContainer: {
    flexDirection: "row",
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: lightTheme.colors.white,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: lightTheme.colors.white,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    paddingVertical: 80,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: lightTheme.colors.gray[600],
  },
  errorContainer: {
    paddingVertical: 80,
    paddingHorizontal: 32,
    alignItems: "center",
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
  emptyContainer: {
    paddingVertical: 80,
    paddingHorizontal: 32,
    alignItems: "center",
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
  goalsContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: lightTheme.colors.gray[900],
    marginBottom: 12,
  },
  goalCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalCardOverdue: {
    borderWidth: 2,
    borderColor: lightTheme.colors.error + "40",
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  progressCircleContainer: {
    position: "relative",
    width: 80,
    height: 80,
  },
  progressTextContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: "bold",
    color: lightTheme.colors.gray[900],
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 18,
    fontWeight: "bold",
    color: lightTheme.colors.gray[900],
    marginBottom: 8,
  },
  goalValues: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  valueItem: {
    flex: 1,
  },
  valueLabel: {
    fontSize: 12,
    color: lightTheme.colors.gray[500],
    marginBottom: 2,
  },
  valueText: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.gray[900],
  },
  deadlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: 8,
    marginBottom: 12,
  },
  deadlineOverdue: {
    backgroundColor: lightTheme.colors.error + "10",
  },
  deadlineNear: {
    backgroundColor: lightTheme.colors.warning + "10",
  },
  deadlineText: {
    fontSize: 13,
    fontWeight: "600",
    color: lightTheme.colors.gray[700],
  },
  deadlineTextOverdue: {
    color: lightTheme.colors.error,
  },
  deadlineTextNear: {
    color: lightTheme.colors.warning,
  },
  deadlineDate: {
    fontSize: 12,
    color: lightTheme.colors.gray[500],
    marginLeft: "auto",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: lightTheme.colors.gray[200],
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  initialValueText: {
    fontSize: 12,
    color: lightTheme.colors.gray[500],
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
  goalCardAchieved: {
    backgroundColor: lightTheme.colors.success + "10",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: lightTheme.colors.success + "40",
  },
  achievedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  achievedInfo: {
    flex: 1,
  },
  achievedValue: {
    fontSize: 14,
    color: lightTheme.colors.gray[600],
    marginTop: 4,
  },
});
