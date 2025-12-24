import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useRoute,
  useNavigation,
  type RouteProp,
} from "@react-navigation/native";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import { useThemedStyles, useTheme } from "../../../hooks/useTheme";
import { useListItemAnimation } from "../../../hooks/useAnimations";
import type { Theme } from "../../../theme";
import {
  GoalCard,
  EmptyState,
  CardSkeleton,
} from "../../../components/patient";
import { AddGoalModal, EditGoalModal } from "../../../components/modals";
import { goalsService } from "../../../services/api";
import type {
  Goal,
  CreateGoalDto,
  UpdateGoalDto,
} from "../../../types/patient-details.types";
import { GoalType } from "../../../types/patient-details.types";
import { useNotificationStore } from "../../../stores/notification.store";
import { notificationService } from "../../../services/notification.service";

type RouteParams = {
  PatientDetails: {
    patientId: string;
    patientName: string;
  };
};

type TabType = "active" | "completed";

export const GoalsTab: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const route = useRoute<RouteProp<RouteParams, "PatientDetails">>();
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  // 🔍 FIX: Obter params da rota pai (PatientDetailsScreen)
  // Tabs não recebem params diretamente, precisam buscar do parent
  const parentRoute = navigation
    .getState()
    ?.routes?.find((r) => r.name === "PatientDetails");
  const { patientId, patientName } = (parentRoute?.params || {}) as {
    patientId?: string;
    patientName?: string;
  };

  // Notification store
  const { getPreferences } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<GoalType | "ALL">("ALL");
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const fetchGoals = React.useCallback(
    async (isRefresh = false) => {
      // 🔍 FIX: Verificar se patientId existe antes de fazer requisição
      if (!patientId) {
        console.error("❌ [GoalsTab.fetchGoals] patientId não encontrado!");
        setError("ID do paciente não encontrado");
        setLoading(false);
        return;
      }

      try {
        setError(null);
        if (!isRefresh) setLoading(true);

        const goals = await goalsService.findAll(patientId);

        setGoals(goals);
      } catch (err) {
        console.error("❌ [GoalsTab.fetchGoals] Error fetching goals:", err);
        setError("Não foi possível carregar as metas");
      } finally {
        setLoading(false);
        if (isRefresh) setRefreshing(false);
      }
    },
    [patientId]
  );

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchGoals(true);
  }, [fetchGoals]);

  const handleAddGoal = async (data: CreateGoalDto) => {
    if (!patientId) {
      Alert.alert("Erro", "ID do paciente não encontrado");
      return;
    }

    try {
      const createdGoal = await goalsService.create(patientId, data);

      // 🔔 Agendar notificação de deadline se habilitado
      const prefs = getPreferences(patientId);
      if (prefs.goalAlerts.enabled && data.deadline) {
        try {
          const goalDescription = data.notes || `Meta de ${data.type}`;
          await notificationService.scheduleGoalDeadlineAlert(
            patientId,
            createdGoal.id,
            goalDescription,
            new Date(data.deadline),
            prefs.goalAlerts.daysBeforeDeadline
          );
        } catch (notifError) {
          console.error(
            "⚠️ Erro ao agendar notificação de deadline:",
            notifError
          );
          // Não bloqueia a criação da meta se notificação falhar
        }
      }

      // Refresh list after successful creation
      await fetchGoals(true);
    } catch (error) {
      console.error("Error adding goal:", error);
      Alert.alert("Erro", "Não foi possível adicionar a meta");
      throw error; // Re-throw to let modal handle it
    }
  };

  const handleEditPress = (goal: Goal) => {
    setSelectedGoal(goal);
    setEditModalVisible(true);
  };

  const handleEditGoal = async (goalId: string, data: UpdateGoalDto) => {
    if (!patientId) {
      Alert.alert("Erro", "ID do paciente não encontrado");
      return;
    }

    try {
      await goalsService.update(patientId, goalId, data);
      // Refresh list after successful update
      await fetchGoals(true);
    } catch (error) {
      console.error("Error updating goal:", error);
      Alert.alert("Erro", "Não foi possível atualizar a meta");
      throw error;
    }
  };

  const handleGoalPress = (goal: Goal) => {
    navigation.navigate("GoalDetails", {
      patientId,
      goalId: goal.id,
      patientName,
    });
  };

  const handleAchieveGoal = async (goalId: string) => {
    Alert.alert(
      "Marcar como concluída",
      "Deseja realmente marcar esta meta como concluída?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            if (!patientId) {
              Alert.alert("Erro", "ID do paciente não encontrado");
              return;
            }

            try {
              // Find the goal to get current value
              const goal = goals.find((g) => g.id === goalId);
              if (!goal) return;

              await goalsService.achieve(patientId, goalId, {
                current: goal.target, // Set current to target when achieving
              });

              // Refresh goals
              fetchGoals(true);
              Alert.alert("Sucesso", "Meta marcada como concluída!");
            } catch (err) {
              console.error("Error achieving goal:", err);
              Alert.alert(
                "Erro",
                "Não foi possível marcar a meta como concluída"
              );
            }
          },
        },
      ]
    );
  };

  const handleDeletePress = (goal: Goal) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => handleDeleteGoal(goal.id),
        },
      ]
    );
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!patientId) {
      Alert.alert("Erro", "ID do paciente não encontrado");
      return;
    }

    try {
      await goalsService.remove(patientId, goalId);
      // Refresh list after successful deletion
      await fetchGoals(true);
      Alert.alert("Sucesso", "Meta excluída com sucesso!");
    } catch (error) {
      console.error("Error deleting goal:", error);
      Alert.alert("Erro", "Não foi possível excluir a meta");
    }
  };

  const filteredGoals = goals.filter((goal) => {
    const matchesTab = activeTab === "active" ? !goal.achieved : goal.achieved;
    const matchesType = filterType === "ALL" || goal.type === filterType;
    return matchesTab && matchesType;
  });

  // 🔍 GUARD: Se patientId não existir, mostrar erro
  if (!patientId) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContent}>
          <EmptyState
            icon="alert-circle"
            title="Erro"
            message="ID do paciente não encontrado. Por favor, volte e tente novamente."
            actionLabel="Voltar"
            onAction={() => navigation.goBack()}
          />
        </View>
      </View>
    );
  }

  const AnimatedGoalCard: React.FC<{ goal: Goal; index: number }> = ({
    goal,
    index,
  }) => {
    const fadeAnim = useListItemAnimation(index);

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <GoalCard
          goal={goal}
          onPress={() => handleGoalPress(goal)}
          onAchieve={
            !goal.achieved ? () => handleAchieveGoal(goal.id) : undefined
          }
          onEdit={!goal.achieved ? () => handleEditPress(goal) : undefined}
          onDelete={!goal.achieved ? () => handleDeletePress(goal) : undefined}
        />
      </Animated.View>
    );
  };

  const renderFilterButton = (
    type: GoalType | "ALL",
    label: string,
    icon: keyof typeof Ionicons.glyphMap
  ) => (
    <TouchableOpacity
      key={type}
      style={[
        styles.filterButton,
        filterType === type && styles.filterButtonActive,
      ]}
      onPress={() => setFilterType(type)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={16}
        color={
          filterType === type ? theme.colors.white : theme.colors.textSecondary
        }
      />
      <Text
        style={[
          styles.filterButtonText,
          filterType === type && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <EmptyState
      icon="flag"
      title={
        activeTab === "active" ? "Nenhuma meta ativa" : "Nenhuma meta concluída"
      }
      message={
        activeTab === "active"
          ? "Adicione uma nova meta para começar a acompanhar o progresso"
          : "Metas concluídas aparecerão aqui"
      }
      actionLabel={activeTab === "active" ? "Adicionar Meta" : undefined}
      onAction={
        activeTab === "active" ? () => setGoalModalVisible(true) : undefined
      }
    />
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabs}>
            <View style={[styles.tab, styles.tabActive]}>
              <Text style={[styles.tabText, styles.tabTextActive]}>Ativas</Text>
            </View>
            <View style={styles.tab}>
              <Text style={styles.tabText}>Concluídas</Text>
            </View>
          </View>
        </View>

        {/* Loading skeletons */}
        <FlatList
          data={[1, 2, 3]}
          renderItem={() => <CardSkeleton />}
          keyExtractor={(item) => item.toString()}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContent}>
          <EmptyState
            icon="alert-circle"
            title="Erro ao carregar"
            message={error}
            actionLabel="Tentar novamente"
            onAction={() => fetchGoals()}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "active" && styles.tabActive]}
            onPress={() => setActiveTab("active")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "active" && styles.tabTextActive,
              ]}
            >
              Ativas ({goals.filter((g) => !g.achieved).length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "completed" && styles.tabActive]}
            onPress={() => setActiveTab("completed")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "completed" && styles.tabTextActive,
              ]}
            >
              Concluídas ({goals.filter((g) => g.achieved).length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {renderFilterButton("ALL", "Todas", "list")}
        {renderFilterButton(GoalType.WEIGHT, "Peso", "scale")}
        {renderFilterButton(GoalType.BODY_FAT, "Gordura", "water")}
        {renderFilterButton(GoalType.MUSCLE_MASS, "Músculo", "fitness")}
        {renderFilterButton(GoalType.WAIST_CIRC, "Cintura", "ellipse")}
      </View>

      {/* Goals List */}
      <FlatList
        data={filteredGoals}
        renderItem={({ item, index }) => (
          <AnimatedGoalCard goal={item} index={index} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.content,
          filteredGoals.length === 0 && styles.emptyContent,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setGoalModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={theme.colors.white} />
      </TouchableOpacity>

      {/* Add Goal Modal */}
      <AddGoalModal
        visible={goalModalVisible}
        patientId={patientId}
        onClose={() => setGoalModalVisible(false)}
        onSubmit={handleAddGoal}
      />

      {/* Edit Goal Modal */}
      <EditGoalModal
        visible={editModalVisible}
        patientId={patientId}
        goal={selectedGoal}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedGoal(null);
        }}
        onSubmit={handleEditGoal}
      />
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    content: {
      padding: theme.spacing.md,
    },
    emptyContent: {
      flexGrow: 1,
      justifyContent: "center",
    },
    tabsContainer: {
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tabs: {
      flexDirection: "row",
      paddingHorizontal: theme.spacing.md,
    },
    tab: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      alignItems: "center",
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabActive: {
      borderBottomColor: theme.colors.primary,
    },
    tabText: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.textSecondary,
    },
    tabTextActive: {
      color: theme.colors.primary,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    filtersContainer: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    filterButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterButtonText: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.textSecondary,
    },
    filterButtonTextActive: {
      color: theme.colors.white,
    },
    fab: {
      position: "absolute",
      right: 16,
      bottom: 16,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
      ...theme.shadows.lg,
    },
  });
