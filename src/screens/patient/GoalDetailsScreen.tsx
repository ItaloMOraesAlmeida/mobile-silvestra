/**
 * GoalDetailsScreen
 * Feature #4 - App do Paciente
 *
 * Tela para visualizar detalhes completos de uma meta
 */

import React from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";
import {
  type PatientGoal,
  type GoalProgressHistory,
  getGoalHistory,
  getPatientGoalById,
  updateGoalProgress,
  completeGoal,
} from "../../services/meal-consumption.service";
import { UpdateProgressModal } from "../../components/UpdateProgressModal";
import { CompleteGoalModal } from "../../components/CompleteGoalModal";
import { useAuthStore } from "../../stores/auth.store";

interface GoalDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      goal: PatientGoal;
    };
  };
}

export function GoalDetailsScreen({
  navigation,
  route,
}: GoalDetailsScreenProps) {
  const { goal: initialGoal } = route.params;
  const { user } = useAuthStore();
  const patientProfileId = user?.patientProfile?.id;

  const [goal, setGoal] = React.useState<PatientGoal>(initialGoal);
  const [history, setHistory] = React.useState<GoalProgressHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState(true);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [completeModalVisible, setCompleteModalVisible] = React.useState(false);

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
        return "Desconhecido";
    }
  };

  const calculateDaysLeft = (deadline?: string): number | null => {
    if (!deadline) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const diff = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const isGoalOverdue = (deadline?: string): boolean => {
    const daysLeft = calculateDaysLeft(deadline);
    return daysLeft !== null && daysLeft < 0;
  };

  const isGoalNearDeadline = (deadline?: string): boolean => {
    const daysLeft = calculateDaysLeft(deadline);
    return daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Não definido";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEventIcon = (event: GoalProgressHistory["event"]) => {
    switch (event) {
      case "CREATED":
        return "add-circle";
      case "UPDATED":
        return "create";
      case "ACHIEVED":
        return "checkmark-circle";
      case "EXPIRED":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  const getEventColor = (event: GoalProgressHistory["event"]) => {
    switch (event) {
      case "CREATED":
        return lightTheme.colors.primary;
      case "UPDATED":
        return lightTheme.colors.info;
      case "ACHIEVED":
        return lightTheme.colors.success;
      case "EXPIRED":
        return lightTheme.colors.error;
      default:
        return lightTheme.colors.gray[500];
    }
  };

  const getEventLabel = (event: GoalProgressHistory["event"]) => {
    switch (event) {
      case "CREATED":
        return "Meta Criada";
      case "UPDATED":
        return "Progresso Atualizado";
      case "ACHIEVED":
        return "Meta Alcançada";
      case "EXPIRED":
        return "Meta Expirada";
      default:
        return "Evento Desconhecido";
    }
  };

  const fetchHistory = React.useCallback(async () => {
    if (!patientProfileId) return;

    try {
      setLoadingHistory(true);
      const historyData = await getGoalHistory(patientProfileId, goal.id);
      setHistory(historyData);
    } catch (err: any) {
      console.error("Erro ao buscar histórico:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [patientProfileId, goal.id]);

  const fetchGoal = React.useCallback(async () => {
    if (!patientProfileId || !goal.id) return;

    try {
      const updatedGoal = await getPatientGoalById(patientProfileId, goal.id);
      setGoal(updatedGoal);
    } catch (err: any) {
      console.error("Erro ao buscar meta:", err);
    }
  }, [patientProfileId, goal.id]);

  useFocusEffect(
    React.useCallback(() => {
      fetchGoal();
      fetchHistory();
    }, [fetchGoal, fetchHistory])
  );

  const handleUpdateProgress = async (
    goalId: string,
    newValue: number,
    notes?: string
  ) => {
    if (!patientProfileId) return;

    try {
      const updatedGoal = await updateGoalProgress(patientProfileId, goalId, {
        current: newValue,
        notes,
      });
      setGoal(updatedGoal);
      fetchHistory(); // Recarrega o histórico
    } catch (err: any) {
      Alert.alert(
        "Erro",
        err?.response?.data?.message || "Erro ao atualizar progresso"
      );
    }
  };

  const handleCompleteGoal = async (
    goalId: string,
    finalValue: number,
    notes?: string
  ) => {
    if (!patientProfileId) return;

    const completedGoal = await completeGoal(
      patientProfileId,
      goalId,
      finalValue
    );
    setGoal(completedGoal);
    fetchHistory();
    setCompleteModalVisible(false);
  };

  const daysLeft = calculateDaysLeft(goal.deadline);
  const isOverdue = isGoalOverdue(goal.deadline);
  const isNearDeadline = isGoalNearDeadline(goal.deadline);

  const difference = goal.targetValue - goal.currentValue;
  const isIncreaseGoal = difference > 0;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Nome da Meta */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flag" size={20} color={lightTheme.colors.primary} />
            <Text style={styles.sectionTitle}>Meta</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.goalName}>{goal.name}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(goal.status) + "20" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(goal.status) },
                ]}
              >
                {getStatusLabel(goal.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Valores */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="stats-chart"
              size={20}
              color={lightTheme.colors.primary}
            />
            <Text style={styles.sectionTitle}>Valores</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.valueRow}>
              <View style={styles.valueBox}>
                <Text style={styles.valueBoxLabel}>Valor Inicial</Text>
                <Text style={styles.valueBoxValue}>
                  {goal.initialValue} {goal.unit}
                </Text>
              </View>
            </View>

            <View style={styles.valueRow}>
              <View style={styles.valueBox}>
                <Text style={styles.valueBoxLabel}>Valor Atual</Text>
                <Text style={[styles.valueBoxValue, styles.valueBoxCurrent]}>
                  {goal.currentValue} {goal.unit}
                </Text>
              </View>
            </View>

            <View style={styles.arrowContainer}>
              <Ionicons
                name="arrow-down"
                size={24}
                color={lightTheme.colors.primary}
              />
            </View>

            <View style={styles.valueRow}>
              <View style={[styles.valueBox, styles.valueBoxTarget]}>
                <Text style={styles.valueBoxLabel}>Meta</Text>
                <Text style={[styles.valueBoxValue, styles.valueBoxTargetText]}>
                  {goal.targetValue} {goal.unit}
                </Text>
              </View>
            </View>

            {/* Diferença */}
            <View style={styles.differenceContainer}>
              <Ionicons
                name={isIncreaseGoal ? "trending-up" : "trending-down"}
                size={20}
                color={lightTheme.colors.gray[600]}
              />
              <Text style={styles.differenceText}>
                {isIncreaseGoal ? "Aumentar" : "Reduzir"}{" "}
                {Math.abs(difference).toFixed(1)} {goal.unit}
              </Text>
            </View>
          </View>
        </View>

        {/* Prazo */}
        {goal.deadline && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="calendar"
                size={20}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Prazo</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.deadlineInfo}>
                <Text style={styles.deadlineDate}>
                  {formatDate(goal.deadline)}
                </Text>
                {daysLeft !== null && (
                  <View
                    style={[
                      styles.daysLeftBadge,
                      isOverdue && styles.daysLeftBadgeOverdue,
                      isNearDeadline && styles.daysLeftBadgeNear,
                    ]}
                  >
                    <Ionicons
                      name={
                        isOverdue
                          ? "alert-circle"
                          : isNearDeadline
                          ? "warning"
                          : "time-outline"
                      }
                      size={16}
                      color={
                        isOverdue
                          ? lightTheme.colors.error
                          : isNearDeadline
                          ? lightTheme.colors.warning
                          : lightTheme.colors.primary
                      }
                    />
                    <Text
                      style={[
                        styles.daysLeftText,
                        isOverdue && styles.daysLeftTextOverdue,
                        isNearDeadline && styles.daysLeftTextNear,
                      ]}
                    >
                      {isOverdue
                        ? `Atrasado há ${Math.abs(daysLeft)} dias`
                        : daysLeft === 0
                        ? "Prazo é hoje!"
                        : `${daysLeft} dias restantes`}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Observações */}
        {goal.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="document-text"
                size={20}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Observações</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.notesText}>{goal.notes}</Text>
            </View>
          </View>
        )}

        {/* Informações Adicionais */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="information-circle"
              size={20}
              color={lightTheme.colors.primary}
            />
            <Text style={styles.sectionTitle}>Informações</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo:</Text>
              <Text style={styles.infoValue}>{goal.type}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Criada em:</Text>
              <Text style={styles.infoValue}>{formatDate(goal.createdAt)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Atualizada em:</Text>
              <Text style={styles.infoValue}>{formatDate(goal.updatedAt)}</Text>
            </View>
            {goal.achieved && goal.achievedAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Alcançada em:</Text>
                <Text style={[styles.infoValue, styles.infoValueSuccess]}>
                  {formatDate(goal.achievedAt)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        {!goal.achieved && !isOverdue && (
          <View style={styles.section}>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setModalVisible(true)}
              >
                <Ionicons name="create-outline" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Atualizar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => setCompleteModalVisible(true)}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.actionButtonText}>Concluir Meta</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Histórico de Progresso */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="time-outline"
              size={20}
              color={lightTheme.colors.primary}
            />
            <Text style={styles.sectionTitle}>Histórico de Progresso</Text>
          </View>

          {loadingHistory ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={lightTheme.colors.primary}
              />
              <Text style={styles.loadingText}>Carregando histórico...</Text>
            </View>
          ) : history.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyHistoryText}>
                Nenhum histórico disponível
              </Text>
            </View>
          ) : (
            <View style={styles.historyContainer}>
              {history.map((item, index) => (
                <View key={item.id} style={styles.historyItem}>
                  <View
                    style={[
                      styles.historyIconContainer,
                      { backgroundColor: getEventColor(item.event) + "20" },
                    ]}
                  >
                    <Ionicons
                      name={getEventIcon(item.event)}
                      size={24}
                      color={getEventColor(item.event)}
                    />
                  </View>

                  <View style={styles.historyContent}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyEvent}>
                        {getEventLabel(item.event)}
                      </Text>
                      <Text style={styles.historyValue}>
                        {item.value} {goal.unit}
                      </Text>
                    </View>

                    {item.notes && (
                      <Text style={styles.historyNotes}>{item.notes}</Text>
                    )}

                    <Text style={styles.historyDate}>
                      {formatDateTime(item.createdAt)}
                    </Text>
                  </View>

                  {index < history.length - 1 && (
                    <View style={styles.historyLine} />
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Update Progress Modal */}
      <UpdateProgressModal
        visible={modalVisible}
        goal={goal}
        onClose={() => setModalVisible(false)}
        onUpdate={handleUpdateProgress}
      />

      <CompleteGoalModal
        visible={completeModalVisible}
        goal={goal}
        onClose={() => setCompleteModalVisible(false)}
        onComplete={handleCompleteGoal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.text,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  goalName: {
    fontSize: 18,
    fontWeight: "700",
    color: lightTheme.colors.text,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  valueRow: {
    marginBottom: 10,
  },
  valueBox: {
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: 8,
    padding: 12,
    borderWidth: 1.5,
    borderColor: lightTheme.colors.gray[200],
  },
  valueBoxTarget: {
    backgroundColor: lightTheme.colors.primary + "10",
    borderColor: lightTheme.colors.primary,
  },
  valueBoxLabel: {
    fontSize: 12,
    color: lightTheme.colors.gray[600],
    marginBottom: 2,
  },
  valueBoxValue: {
    fontSize: 20,
    fontWeight: "700",
    color: lightTheme.colors.text,
  },
  valueBoxCurrent: {
    color: lightTheme.colors.primary,
  },
  valueBoxTargetText: {
    color: lightTheme.colors.primary,
  },
  arrowContainer: {
    alignItems: "center",
    marginVertical: 4,
  },
  differenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[200],
  },
  differenceText: {
    fontSize: 14,
    fontWeight: "600",
    color: lightTheme.colors.gray[600],
  },
  deadlineInfo: {
    gap: 8,
  },
  deadlineDate: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.text,
  },
  daysLeftBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: lightTheme.colors.primary + "10",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  daysLeftBadgeOverdue: {
    backgroundColor: lightTheme.colors.error + "10",
  },
  daysLeftBadgeNear: {
    backgroundColor: lightTheme.colors.warning + "10",
  },
  daysLeftText: {
    fontSize: 13,
    fontWeight: "600",
    color: lightTheme.colors.primary,
  },
  daysLeftTextOverdue: {
    color: lightTheme.colors.error,
  },
  daysLeftTextNear: {
    color: lightTheme.colors.warning,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    color: lightTheme.colors.gray[700],
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  infoLabel: {
    fontSize: 13,
    color: lightTheme.colors.gray[600],
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: lightTheme.colors.text,
  },
  infoValueSuccess: {
    color: lightTheme.colors.success,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: lightTheme.colors.primary,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  completeButton: {
    backgroundColor: lightTheme.colors.success,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: lightTheme.colors.gray[600],
  },
  emptyHistoryText: {
    fontSize: 14,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
    paddingVertical: 20,
  },
  historyContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  historyItem: {
    position: "relative",
    flexDirection: "row",
    paddingVertical: 16,
  },
  historyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  historyEvent: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.text,
  },
  historyValue: {
    fontSize: 16,
    fontWeight: "700",
    color: lightTheme.colors.primary,
  },
  historyNotes: {
    fontSize: 14,
    color: lightTheme.colors.gray[700],
    marginBottom: 4,
    lineHeight: 20,
  },
  historyDate: {
    fontSize: 12,
    color: lightTheme.colors.gray[500],
  },
  historyLine: {
    position: "absolute",
    left: 23,
    top: 64,
    bottom: -16,
    width: 2,
    backgroundColor: lightTheme.colors.gray[200],
  },
});
