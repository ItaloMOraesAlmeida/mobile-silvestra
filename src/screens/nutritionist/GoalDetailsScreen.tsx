import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";
import { goalsService } from "../../services/patient-details.service";
import {
  getGoalHistory,
  type GoalProgressHistory,
} from "../../services/meal-consumption.service";
import Toast from "react-native-toast-message";
import { getGoalTypeLabel } from "../../constants/goalTypes";

type GoalDetailsScreenProps = {
  route: {
    params: {
      goal: any;
      patientId: string;
      patientName: string;
    };
  };
  navigation: any;
};

export function GoalDetailsScreen({
  route,
  navigation,
}: GoalDetailsScreenProps) {
  const { goal, patientId, patientName } = route.params;
  const [deleting, setDeleting] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [history, setHistory] = useState<GoalProgressHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleEdit = () => {
    navigation.navigate("GoalCreate", {
      patientId,
      patientName,
      goalToEdit: goal,
      isEditing: true,
    });
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      setHistory([]); // Limpar histórico anterior
      const historyData = await getGoalHistory(patientId, goal.id);
      setHistory(historyData);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal.id]); // Recarregar quando o goal.id mudar

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const result = await goalsService.deleteGoal(patientId, goal.id);

      if (result.success) {
        Toast.show({
          type: "success",
          text1: "Sucesso!",
          text2: "Meta excluída com sucesso",
          position: "bottom",
          visibilityTime: 2000,
        });

        // Voltar para a tela anterior com flag para recarregar
        navigation.navigate("PatientDetails", {
          patientId,
          initialTab: "goals",
          shouldReload: true,
        });
      } else {
        Alert.alert("Erro", "Não foi possível excluir a meta");
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
      Alert.alert("Erro", "Não foi possível excluir a meta");
    } finally {
      setDeleting(false);
      setDeleteModalVisible(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView style={styles.content}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="flag"
                size={20}
                color={lightTheme.colors.primary}
              />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.goalName} numberOfLines={1}>
                {goal.name}
              </Text>
              <Text style={styles.goalType}>{getGoalTypeLabel(goal.type)}</Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              goal.achieved
                ? styles.statusBadgeCompleted
                : styles.statusBadgeActive,
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {goal.achieved ? "Concluída" : "Ativa"}
            </Text>
          </View>
        </View>

        {/* Values Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Valores</Text>
          <View style={styles.valuesGrid}>
            <View style={styles.valueCard}>
              <Ionicons
                name="play-outline"
                size={24}
                color={lightTheme.colors.gray[500]}
              />
              <Text style={styles.valueLabel}>Inicial</Text>
              <Text style={styles.valueNumber}>
                {goal.initialValue || goal.current} {goal.unit}
              </Text>
            </View>

            <View style={styles.valueCard}>
              <Ionicons
                name="speedometer-outline"
                size={24}
                color={lightTheme.colors.info}
              />
              <Text style={styles.valueLabel}>Atual</Text>
              <Text style={styles.valueNumber}>
                {goal.current} {goal.unit}
              </Text>
            </View>

            <View style={styles.valueCard}>
              <Ionicons
                name="flag-outline"
                size={24}
                color={lightTheme.colors.success}
              />
              <Text style={styles.valueLabel}>Meta</Text>
              <Text style={styles.valueNumber}>
                {goal.target} {goal.unit}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes Section */}
        {goal.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{goal.notes}</Text>
            </View>
          </View>
        )}

        {/* Deadline Section */}
        {goal.deadline && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prazo</Text>
            <View style={styles.deadlineCard}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={lightTheme.colors.gray[600]}
              />
              <Text style={styles.deadlineText}>
                {new Date(goal.deadline).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>
        )}

        {/* Achievement Date */}
        {goal.achieved && goal.achievedAt && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data de Conclusão</Text>
            <View style={styles.deadlineCard}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={lightTheme.colors.success}
              />
              <Text style={styles.deadlineText}>
                {new Date(goal.achievedAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>
        )}

        {/* Histórico de Evolução */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico de Evolução</Text>
          {loadingHistory ? (
            <View style={styles.historyLoading}>
              <ActivityIndicator
                size="small"
                color={lightTheme.colors.primary}
              />
              <Text style={styles.historyLoadingText}>
                Carregando histórico...
              </Text>
            </View>
          ) : history.length > 0 ? (
            <View style={styles.historyContainer}>
              {history.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.historyItem,
                    index < history.length - 1 && styles.historyItemBorder,
                  ]}
                >
                  <View style={styles.historyIconContainer}>
                    <Ionicons
                      name={
                        item.event === "CREATED"
                          ? "add-circle"
                          : item.event === "ACHIEVED"
                          ? "checkmark-circle"
                          : "trending-up"
                      }
                      size={20}
                      color={
                        item.event === "CREATED"
                          ? lightTheme.colors.info
                          : item.event === "ACHIEVED"
                          ? lightTheme.colors.success
                          : lightTheme.colors.primary
                      }
                    />
                  </View>
                  <View style={styles.historyContent}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyEvent}>
                        {item.event === "CREATED"
                          ? "Meta Criada"
                          : item.event === "ACHIEVED"
                          ? "Meta Concluída"
                          : "Atualização"}
                      </Text>
                      <Text style={styles.historyDate}>
                        {new Date(item.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </Text>
                    </View>
                    <Text style={styles.historyValue}>
                      {item.value} {goal.unit}
                    </Text>
                    {item.notes && (
                      <Text style={styles.historyNotes}>{item.notes}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.historyEmpty}>
              <Ionicons
                name="time-outline"
                size={32}
                color={lightTheme.colors.gray[300]}
              />
              <Text style={styles.historyEmptyText}>
                Nenhum histórico registrado
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEdit}
            activeOpacity={0.7}
          >
            <Ionicons
              name="pencil"
              size={16}
              color={lightTheme.colors.primary}
            />
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setDeleteModalVisible(true)}
            disabled={deleting}
            activeOpacity={0.7}
          >
            <Ionicons name="trash" size={16} color={lightTheme.colors.error} />
            <Text style={styles.deleteButtonText}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons
              name="warning-outline"
              size={48}
              color={lightTheme.colors.error}
            />
            <Text style={styles.modalTitle}>Excluir Meta</Text>
            <Text style={styles.modalText}>
              Tem certeza que deseja excluir esta meta? Esta ação não pode ser
              desfeita.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deleting}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color={lightTheme.colors.white} />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Excluir</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[50],
  },
  content: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: lightTheme.colors.white,
    padding: lightTheme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.sm,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: lightTheme.colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 0,
    paddingBottom: 0,
  },
  goalName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[900],
    marginBottom: 0,
    marginTop: 0,
    lineHeight: 18,
    includeFontPadding: false,
  },
  goalType: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[600],
    marginTop: 2,
    lineHeight: 14,
    includeFontPadding: false,
  },
  statusBadge: {
    paddingHorizontal: lightTheme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: lightTheme.colors.info + "20",
  },
  statusBadgeCompleted: {
    backgroundColor: lightTheme.colors.success + "20",
  },
  statusBadgeText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[700],
  },
  section: {
    backgroundColor: lightTheme.colors.white,
    padding: lightTheme.spacing.lg,
    marginTop: lightTheme.spacing.md,
  },
  sectionTitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[600],
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: lightTheme.spacing.md,
  },
  valuesGrid: {
    flexDirection: "row",
    gap: lightTheme.spacing.md,
  },
  valueCard: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[50],
    padding: lightTheme.spacing.lg,
    borderRadius: lightTheme.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    minHeight: 100,
  },
  valueLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginTop: lightTheme.spacing.sm,
    marginBottom: lightTheme.spacing.xs,
    textAlign: "center",
  },
  valueNumber: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[900],
    textAlign: "center",
    flexWrap: "wrap",
  },
  notesCard: {
    backgroundColor: lightTheme.colors.gray[50],
    padding: lightTheme.spacing.lg,
    borderRadius: lightTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
  },
  notesText: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[700],
    lineHeight: 24,
  },
  deadlineCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.gray[50],
    padding: lightTheme.spacing.lg,
    borderRadius: lightTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    gap: lightTheme.spacing.sm,
  },
  deadlineText: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[700],
  },
  patientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.gray[50],
    padding: lightTheme.spacing.lg,
    borderRadius: lightTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    gap: lightTheme.spacing.sm,
  },
  patientName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[900],
  },
  bottomSpacer: {
    height: 120,
  },
  actionContainer: {
    backgroundColor: lightTheme.colors.white,
    padding: lightTheme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[200],
    gap: lightTheme.spacing.sm,
  },
  achieveButton: {
    backgroundColor: lightTheme.colors.success,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: lightTheme.spacing.sm,
    borderRadius: lightTheme.borderRadius.md,
    gap: lightTheme.spacing.xs,
  },
  achieveButtonText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
  },
  buttonRow: {
    flexDirection: "row",
    gap: lightTheme.spacing.sm,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: lightTheme.spacing.sm,
    borderRadius: lightTheme.borderRadius.md,
    backgroundColor: lightTheme.colors.gray[50],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    gap: lightTheme.spacing.xs,
  },
  editButtonText: {
    color: lightTheme.colors.gray[700],
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: lightTheme.spacing.sm,
    borderRadius: lightTheme.borderRadius.md,
    backgroundColor: lightTheme.colors.gray[50],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    gap: lightTheme.spacing.xs,
  },
  deleteButtonText: {
    color: lightTheme.colors.gray[700],
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: lightTheme.spacing.lg,
  },
  modalContent: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing.xl,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[900],
    marginTop: lightTheme.spacing.md,
    marginBottom: lightTheme.spacing.sm,
  },
  modalText: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
    marginBottom: lightTheme.spacing.xl,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: "row",
    gap: lightTheme.spacing.sm,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.lg,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: lightTheme.colors.gray[100],
  },
  modalCancelButtonText: {
    color: lightTheme.colors.gray[700],
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
  },
  modalConfirmButton: {
    backgroundColor: lightTheme.colors.error,
  },
  modalConfirmButtonSuccess: {
    backgroundColor: lightTheme.colors.success,
  },
  modalConfirmButtonText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
  },
  // Estilos do histórico
  historyLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 20,
  },
  historyLoadingText: {
    fontSize: 14,
    color: lightTheme.colors.gray[600],
  },
  historyContainer: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 0,
  },
  historyItem: {
    flexDirection: "row",
    paddingVertical: 12,
    gap: 12,
  },
  historyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  historyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: lightTheme.colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  historyContent: {
    flex: 1,
    gap: 4,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyEvent: {
    fontSize: 14,
    fontWeight: "600",
    color: lightTheme.colors.gray[900],
  },
  historyDate: {
    fontSize: 12,
    color: lightTheme.colors.gray[500],
  },
  historyValue: {
    fontSize: 16,
    fontWeight: "700",
    color: lightTheme.colors.primary,
  },
  historyNotes: {
    fontSize: 13,
    color: lightTheme.colors.gray[600],
    marginTop: 2,
  },
  historyEmpty: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  historyEmptyText: {
    fontSize: 14,
    color: lightTheme.colors.gray[500],
  },
});
