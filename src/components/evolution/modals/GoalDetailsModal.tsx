/**
 * GoalDetailsModal Component
 *
 * Modal para visualizar detalhes de uma meta específica do paciente
 * com histórico de progresso e ações de edição.
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles, useTheme } from "../../../hooks/useTheme";
import type { Theme } from "../../../theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface GoalProgress {
  date: string;
  value: number;
  notes?: string;
}

interface GoalData {
  id: string;
  title: string;
  description?: string;
  type: "weight" | "body_fat" | "muscle_mass" | "circumference" | "other";
  initialValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline?: string;
  startDate: string;
  progress?: GoalProgress[];
  status: "in_progress" | "completed" | "exceeded" | "paused";
}

export interface GoalDetailsModalProps {
  visible: boolean;
  goal: GoalData | null;
  onClose: () => void;
  onEdit?: (goalId: string) => void;
  onDelete?: (goalId: string) => void;
}

export const GoalDetailsModal: React.FC<GoalDetailsModalProps> = ({
  visible,
  goal,
  onClose,
  onEdit,
  onDelete,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();

  if (!goal) return null;

  // Calcular progresso
  const totalChange = goal.targetValue - goal.initialValue;
  const currentChange = goal.currentValue - goal.initialValue;
  const progressPercent = (currentChange / totalChange) * 100;
  const isComplete = progressPercent >= 100;

  // Status da meta
  const statusConfig = {
    in_progress: {
      label: "Em Progresso",
      color: theme.colors.primary,
      icon: "time" as const,
    },
    completed: {
      label: "Concluída",
      color: theme.colors.success,
      icon: "checkmark-circle" as const,
    },
    exceeded: {
      label: "Superada",
      color: theme.colors.warning,
      icon: "trophy" as const,
    },
    paused: {
      label: "Pausada",
      color: theme.colors.textSecondary,
      icon: "pause-circle" as const,
    },
  };

  const currentStatus = statusConfig[goal.status];

  // Calcular dias restantes
  let daysRemaining = null;
  if (goal.deadline) {
    const deadlineDate = new Date(goal.deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <SafeAreaView style={styles.modalContent} edges={["bottom"]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dragIndicator} />

            <View style={styles.titleContainer}>
              <View style={styles.titleContent}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{goal.title}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${currentStatus.color}15` },
                    ]}
                  >
                    <Ionicons
                      name={currentStatus.icon}
                      size={14}
                      color={currentStatus.color}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: currentStatus.color },
                      ]}
                    >
                      {currentStatus.label}
                    </Text>
                  </View>
                </View>
                {goal.description && (
                  <Text style={styles.description}>{goal.description}</Text>
                )}
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Card de Progresso */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons
                  name="analytics"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={styles.cardTitle}>Progresso Atual</Text>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(progressPercent, 100)}%`,
                        backgroundColor: isComplete
                          ? theme.colors.success
                          : theme.colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {progressPercent.toFixed(1)}%
                </Text>
              </View>

              <View style={styles.valuesRow}>
                <View style={styles.valueBox}>
                  <Text style={styles.valueLabel}>Inicial</Text>
                  <Text style={styles.valueText}>
                    {goal.initialValue} {goal.unit}
                  </Text>
                </View>

                <View style={styles.valueBox}>
                  <Text style={styles.valueLabel}>Atual</Text>
                  <Text
                    style={[styles.valueText, { color: theme.colors.primary }]}
                  >
                    {goal.currentValue} {goal.unit}
                  </Text>
                </View>

                <View style={styles.valueBox}>
                  <Text style={styles.valueLabel}>Meta</Text>
                  <Text style={styles.valueText}>
                    {goal.targetValue} {goal.unit}
                  </Text>
                </View>
              </View>

              {daysRemaining !== null && (
                <View style={styles.deadlineRow}>
                  <Ionicons
                    name="calendar"
                    size={16}
                    color={
                      daysRemaining < 7
                        ? theme.colors.error
                        : theme.colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.deadlineText,
                      {
                        color:
                          daysRemaining < 7
                            ? theme.colors.error
                            : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {daysRemaining > 0
                      ? `${daysRemaining} dias restantes`
                      : daysRemaining === 0
                      ? "Prazo termina hoje"
                      : `Prazo vencido há ${Math.abs(daysRemaining)} dias`}
                  </Text>
                </View>
              )}
            </View>

            {/* Card de Histórico */}
            {goal.progress && goal.progress.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="time"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.cardTitle}>Histórico</Text>
                </View>

                {goal.progress.map((entry, index) => (
                  <View key={index} style={styles.historyItem}>
                    <View style={styles.historyDot} />
                    <View style={styles.historyContent}>
                      <View style={styles.historyHeader}>
                        <Text style={styles.historyValue}>
                          {entry.value} {goal.unit}
                        </Text>
                        <Text style={styles.historyDate}>
                          {new Date(entry.date).toLocaleDateString("pt-BR")}
                        </Text>
                      </View>
                      {entry.notes && (
                        <Text style={styles.historyNotes}>{entry.notes}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Ações */}
            {(onEdit || onDelete) && (
              <View style={styles.actionsCard}>
                {onEdit && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      onEdit(goal.id);
                      onClose();
                    }}
                  >
                    <Ionicons
                      name="pencil"
                      size={20}
                      color={theme.colors.primary}
                    />
                    <Text
                      style={[
                        styles.actionText,
                        { color: theme.colors.primary },
                      ]}
                    >
                      Editar Meta
                    </Text>
                  </TouchableOpacity>
                )}

                {onDelete && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      onDelete(goal.id);
                      onClose();
                    }}
                  >
                    <Ionicons
                      name="trash"
                      size={20}
                      color={theme.colors.error}
                    />
                    <Text
                      style={[styles.actionText, { color: theme.colors.error }]}
                    >
                      Excluir Meta
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={{ height: 32 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalBackdrop: {
      flex: 1,
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: SCREEN_HEIGHT * 0.9,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    dragIndicator: {
      width: 40,
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: 12,
    },
    titleContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    titleContent: {
      flex: 1,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.text,
      flex: 1,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
      marginLeft: 4,
    },
    description: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    closeButton: {
      padding: 4,
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 20,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
      marginLeft: 8,
    },
    progressContainer: {
      marginBottom: 16,
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: 4,
      overflow: "hidden",
      marginBottom: 8,
    },
    progressFill: {
      height: "100%",
      borderRadius: 4,
    },
    progressText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
      textAlign: "center",
    },
    valuesRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    valueBox: {
      alignItems: "center",
    },
    valueLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    valueText: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.text,
    },
    deadlineRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    deadlineText: {
      fontSize: 14,
      marginLeft: 6,
    },
    historyItem: {
      flexDirection: "row",
      marginBottom: 16,
    },
    historyDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
      marginTop: 6,
      marginRight: 12,
    },
    historyContent: {
      flex: 1,
    },
    historyHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    historyValue: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
    },
    historyDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    historyNotes: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    actionsCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 4,
      marginTop: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 8,
    },
    actionText: {
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 12,
    },
  });
