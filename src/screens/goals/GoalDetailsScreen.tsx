import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useRoute,
  useNavigation,
  useFocusEffect,
  type RouteProp,
} from "@react-navigation/native";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import { useHaptics } from "../../hooks/useHaptics";
import type { Theme } from "../../theme";
import {
  GoalProgressCircle,
  UpdateProgressModal,
  GoalTimeline,
} from "../../components/goals";
import type { GoalHistoryItem } from "../../components/goals";
import { EditGoalModal } from "../../components/modals/EditGoalModal";
import { goalsService } from "../../services/api";
import type {
  Goal,
  GoalType,
  UpdateGoalDto,
} from "../../types/patient-details.types";
import { useNotificationStore } from "../../stores/notification.store";
import { notificationService } from "../../services/notification.service";

type RouteParams = {
  GoalDetails: {
    patientId: string;
    goalId: string;
    patientName?: string;
  };
};

/**
 * Ícones por tipo de meta
 */
const GOAL_ICONS: Record<GoalType, keyof typeof Ionicons.glyphMap> = {
  WEIGHT: "scale-outline",
  BODY_FAT: "flame-outline",
  MUSCLE_MASS: "fitness-outline",
  WAIST_CIRC: "resize-outline",
  OTHER: "flag-outline",
};

/**
 * Labels por tipo de meta
 */
const GOAL_LABELS: Record<GoalType, string> = {
  WEIGHT: "Peso",
  BODY_FAT: "Gordura Corporal",
  MUSCLE_MASS: "Massa Muscular",
  WAIST_CIRC: "Circunferência da Cintura",
  OTHER: "Outra Meta",
};

/**
 * Tela de detalhes de uma meta
 */
export const GoalDetailsScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const haptics = useHaptics();
  const route = useRoute<RouteProp<RouteParams, "GoalDetails">>();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const { patientId, goalId, patientName } = route.params;

  // Notification store
  const { getPreferences } = useNotificationStore();

  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [history, setHistory] = useState<GoalHistoryItem[]>([]);

  /**
   * Carrega detalhes da meta
   */
  const fetchGoal = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await goalsService.findOne(patientId, goalId);
      setGoal(response);

      // Gera histórico de exemplo (em produção, isso viria da API)
      const mockHistory: GoalHistoryItem[] = [
        {
          id: "1",
          date: new Date(response.createdAt),
          type: "created",
          newValue: response.current ?? 0,
          unit: response.unit,
          updatedBy: "nutritionist",
          updatedByName: "Dr. Silva",
        },
      ];

      // Se foi atualizado, adiciona update
      if (
        response.current !== null &&
        response.createdAt !== response.updatedAt
      ) {
        mockHistory.push({
          id: "2",
          date: new Date(response.updatedAt),
          type: "updated",
          previousValue: 0, // Em produção, viria da API
          newValue: response.current,
          unit: response.unit,
          updatedBy: "nutritionist",
          updatedByName: "Dr. Silva",
        });
      }

      // Se alcançado, adiciona achievement
      if (response.achieved && response.achievedAt) {
        mockHistory.push({
          id: "3",
          date: new Date(response.achievedAt),
          type: "achieved",
          newValue: response.target,
          unit: response.unit,
          updatedBy: "nutritionist",
          updatedByName: "Dr. Silva",
        });

        // 🎉 Enviar notificação de celebração se habilitado
        const prefs = getPreferences(patientId);
        if (prefs.celebrations.enabled) {
          try {
            const goalDescription = `Meta de ${GOAL_LABELS[response.type]}`;
            await notificationService.notifyGoalAchieved(
              patientId,
              goalId,
              goalDescription
            );
          } catch (notifError) {
            console.error(
              "⚠️ Erro ao enviar notificação de celebração:",
              notifError
            );
            // Não bloqueia o carregamento se notificação falhar
          }
        }
      }

      setHistory(
        mockHistory.sort((a, b) => b.date.getTime() - a.date.getTime())
      );
    } catch (err) {
      console.error("Error loading goal:", err);
      setError("Erro ao carregar detalhes da meta");
    } finally {
      setLoading(false);
    }
  }, [patientId, goalId, getPreferences]);

  useFocusEffect(
    React.useCallback(() => {
      fetchGoal();
    }, [fetchGoal])
  );

  /**
   * Calcula progresso da meta
   */
  const calculateProgress = (): number => {
    if (!goal || !goal.current) return 0;
    const progress = (goal.current / goal.target) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  /**
   * Calcula dias restantes até o prazo
   */
  const getDaysRemaining = (): number | null => {
    if (!goal?.deadline) return null;
    const now = new Date();
    const deadline = new Date(goal.deadline);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  /**
   * Formata data
   */
  const formatDate = React.useCallback((date: string): string => {
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

  /**
   * Navega para editar meta
   */
  const handleEdit = React.useCallback(() => {
    haptics.light();
    setEditModalVisible(true);
  }, [haptics]);

  /**
   * Callback após edição bem-sucedida
   */
  const handleEditSubmit = React.useCallback(
    async (goalId: string, data: UpdateGoalDto) => {
      try {
        await goalsService.update(patientId, goalId, data);
        await fetchGoal(); // Recarrega dados
        setEditModalVisible(false);
        haptics.success();
        Alert.alert("Sucesso", "Meta atualizada com sucesso!");
      } catch (error) {
        console.error("Error updating goal:", error);
        haptics.error();
        Alert.alert("Erro", "Não foi possível atualizar a meta");
      }
    },
    [patientId, fetchGoal, haptics]
  );

  /**
   * Deleta a meta
   */
  const handleDelete = React.useCallback(() => {
    haptics.warning();
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel", onPress: () => haptics.light() },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              haptics.heavy();
              await goalsService.remove(patientId, goalId);
              haptics.success();
              Alert.alert("Sucesso", "Meta excluída com sucesso!");
              navigation.goBack();
            } catch (error) {
              console.error("Error deleting goal:", error);
              haptics.error();
              Alert.alert("Erro", "Não foi possível excluir a meta");
            }
          },
        },
      ]
    );
  }, [patientId, goalId, navigation, haptics]);

  /**
   * Atualiza progresso da meta
   */
  const handleUpdateProgress = React.useCallback(() => {
    haptics.light();
    setUpdateModalVisible(true);
  }, [haptics]);

  /**
   * Confirma atualização de progresso
   */
  const handleConfirmUpdate = React.useCallback(
    async (newValue: number, notes?: string) => {
      try {
        await goalsService.updateProgress(patientId, goalId, {
          current: newValue,
          notes,
        });
        await fetchGoal(); // Recarrega dados
        haptics.success();
        Alert.alert("Sucesso", "Progresso atualizado com sucesso!");
      } catch (error) {
        console.error("Error updating progress:", error);
        haptics.error();
        throw error; // Let modal handle the error
      }
    },
    [patientId, goalId, fetchGoal, haptics]
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Carregando meta...</Text>
        </View>
      </View>
    );
  }

  if (error || !goal) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={theme.colors.error}
          />
          <Text style={styles.errorText}>{error || "Meta não encontrada"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchGoal}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const progress = calculateProgress();
  const daysRemaining = getDaysRemaining();
  const icon = GOAL_ICONS[goal.type];
  const label = GOAL_LABELS[goal.type];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Voltar"
          accessibilityHint="Retorna para a tela anterior"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {patientName || "Detalhes da Meta"}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleEdit}
            style={styles.headerButton}
            accessibilityLabel="Editar meta"
            accessibilityHint="Abre o formulário para editar esta meta"
            accessibilityRole="button"
          >
            <Ionicons
              name="create-outline"
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.headerButton}
            accessibilityLabel="Excluir meta"
            accessibilityHint="Remove permanentemente esta meta"
            accessibilityRole="button"
          >
            <Ionicons
              name="trash-outline"
              size={24}
              color={theme.colors.error}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.goalTitle}>{label}</Text>
          {goal.notes && <Text style={styles.goalNotes}>{goal.notes}</Text>}

          {/* Progress Circle */}
          <View style={styles.progressContainer}>
            <GoalProgressCircle
              progress={progress}
              size={220}
              strokeWidth={16}
              target={goal.target}
              current={goal.current || 0}
              unit={goal.unit}
              showValues={true}
            />
          </View>

          {/* Status Badge */}
          {goal.achieved && (
            <View style={styles.achievedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.colors.white}
              />
              <Text style={styles.achievedBadgeText}>Meta Alcançada!</Text>
            </View>
          )}
        </View>

        {/* Info Cards */}
        <View style={styles.infoCardsContainer}>
          <View style={styles.infoCard}>
            <Ionicons
              name="calendar-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.infoCardLabel}>Criada em</Text>
            <Text style={styles.infoCardValue}>
              {formatDate(goal.createdAt)}
            </Text>
          </View>

          {goal.deadline && (
            <View style={styles.infoCard}>
              <Ionicons
                name="time-outline"
                size={24}
                color={
                  daysRemaining !== null && daysRemaining < 7
                    ? theme.colors.warning
                    : theme.colors.primary
                }
              />
              <Text style={styles.infoCardLabel}>Prazo</Text>
              <Text style={styles.infoCardValue}>
                {formatDate(goal.deadline)}
              </Text>
              {daysRemaining !== null && (
                <Text
                  style={[
                    styles.infoCardSubtext,
                    daysRemaining < 7 && { color: theme.colors.warning },
                  ]}
                >
                  {daysRemaining > 0
                    ? `${daysRemaining} dias restantes`
                    : daysRemaining === 0
                    ? "Prazo hoje!"
                    : `${Math.abs(daysRemaining)} dias atrasado`}
                </Text>
              )}
            </View>
          )}

          <View style={styles.infoCard}>
            <Ionicons
              name="trending-up-outline"
              size={24}
              color={theme.colors.success}
            />
            <Text style={styles.infoCardLabel}>Progresso</Text>
            <Text style={styles.infoCardValue}>{Math.round(progress)}%</Text>
            <Text style={styles.infoCardSubtext}>
              {goal.current || 0} de {goal.target} {goal.unit}
            </Text>
          </View>

          {goal.current !== null && goal.target && (
            <View style={styles.infoCard}>
              <Ionicons
                name="flag-outline"
                size={24}
                color={theme.colors.info}
              />
              <Text style={styles.infoCardLabel}>Falta</Text>
              <Text style={styles.infoCardValue}>
                {Math.abs(goal.target - (goal.current || 0)).toFixed(1)}{" "}
                {goal.unit}
              </Text>
              <Text style={styles.infoCardSubtext}>
                {goal.current >= goal.target ? "Meta atingida!" : "para a meta"}
              </Text>
            </View>
          )}
        </View>

        {/* Update Progress Button */}
        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleUpdateProgress}
          disabled={goal.achieved}
          accessibilityLabel="Atualizar progresso"
          accessibilityHint={`Progresso atual: ${goal.current || 0} ${
            goal.unit
          }. Toque para atualizar o valor`}
          accessibilityRole="button"
          accessibilityState={{ disabled: goal.achieved }}
        >
          <Ionicons
            name="refresh-outline"
            size={20}
            color={theme.colors.white}
          />
          <Text style={styles.updateButtonText}>Atualizar Progresso</Text>
        </TouchableOpacity>

        {/* Evolution Chart (Placeholder for future) */}
        {/* <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Evolução</Text>
          <AdvancedLineChart
            data={[]} // TODO: Implementar histórico de progresso
            width={350}
            height={200}
          />
        </View> */}

        {/* History Timeline */}
        {goal.achievedAt && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>📜 Histórico</Text>
            <GoalTimeline history={history} maxHeight={300} />
          </View>
        )}
      </ScrollView>

      {/* Update Progress Modal */}
      {goal && (
        <UpdateProgressModal
          visible={updateModalVisible}
          currentValue={goal.current}
          targetValue={goal.target}
          unit={goal.unit}
          goalType={label}
          onClose={() => setUpdateModalVisible(false)}
          onUpdate={handleConfirmUpdate}
        />
      )}

      {/* Edit Goal Modal */}
      {goal && (
        <EditGoalModal
          visible={editModalVisible}
          goal={goal}
          patientId={patientId}
          onClose={() => setEditModalVisible(false)}
          onSubmit={handleEditSubmit}
        />
      )}
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: theme.spacing.xs,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.text,
      marginHorizontal: theme.spacing.md,
    },
    headerActions: {
      flexDirection: "row",
      gap: theme.spacing.sm,
    },
    headerButton: {
      padding: theme.spacing.xs,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: theme.spacing.xl,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.md,
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: "center",
    },
    retryButton: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      marginTop: theme.spacing.md,
    },
    retryButtonText: {
      color: theme.colors.white,
      fontSize: 16,
      fontWeight: "600",
    },
    heroSection: {
      alignItems: "center",
      paddingVertical: theme.spacing.xl,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primaryBackground,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.md,
    },
    goalTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    goalNotes: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: "center",
      paddingHorizontal: theme.spacing.xl,
      marginBottom: theme.spacing.md,
    },
    progressContainer: {
      marginVertical: theme.spacing.lg,
    },
    achievedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: theme.colors.success,
      borderRadius: 20,
      marginTop: theme.spacing.md,
    },
    achievedBadgeText: {
      color: theme.colors.white,
      fontSize: 16,
      fontWeight: "600",
    },
    infoCardsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      padding: theme.spacing.md,
      gap: theme.spacing.md,
    },
    infoCard: {
      flex: 1,
      minWidth: "45%",
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
      borderRadius: 12,
      alignItems: "center",
      gap: theme.spacing.xs,
      ...theme.shadows.sm,
    },
    infoCardLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textTransform: "uppercase",
      marginTop: theme.spacing.xs,
    },
    infoCardValue: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.text,
    },
    infoCardSubtext: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
    updateButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.sm,
      marginHorizontal: theme.spacing.md,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      ...theme.shadows.md,
    },
    updateButtonText: {
      color: theme.colors.white,
      fontSize: 16,
      fontWeight: "600",
    },
    chartSection: {
      padding: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    historySection: {
      padding: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    historyItem: {
      flexDirection: "row",
      marginBottom: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
  });
