import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import type { Theme } from "../../theme";
import { api } from "../../services/api";
import { StatCardSkeleton } from "../../components/StatCardSkeleton";
import { ActivityItemSkeleton } from "../../components/ActivityItemSkeleton";
import { PriorityPatientCard } from "../../components/PriorityPatientCard";
import {
  AgendaItemCard,
  type AgendaActivityType,
} from "../../components/AgendaItemCard";

/**
 * Interfaces
 */
interface DashboardStats {
  totalPatients: number;
  activeGoals: number;
  measurementsToday: number;
  newPatientsThisMonth: number;
}

interface RecentActivity {
  id: string;
  type: "goal_achieved" | "new_measurement" | "new_patient" | "goal_created";
  title: string;
  description: string;
  timestamp: string;
  patientId?: string;
  patientName?: string;
  icon: string;
}

interface PriorityPatient {
  id: string;
  name: string;
  reason: string;
  urgency: "high" | "medium" | "low";
  lastContact?: Date;
  avatar?: string;
}

interface AgendaItem {
  id: string;
  type: AgendaActivityType;
  title: string;
  description: string;
  time: string;
  patientId?: string;
  patientName?: string;
  status: "scheduled" | "completed" | "cancelled";
}

/**
 * DashboardScreen - Tela principal do nutricionista
 *
 * Exibe:
 * - Estatísticas gerais (total pacientes, metas ativas, medições hoje)
 * - Gráfico de novos pacientes
 * - Pacientes que precisam de atenção
 * - Pacientes mais ativos
 * - Agenda do dia
 */
export const DashboardScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [isLoadingPriority, setIsLoadingPriority] = useState(true);
  const [isLoadingAgenda, setIsLoadingAgenda] = useState(true);

  // Estados de dados
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activeGoals: 0,
    measurementsToday: 0,
    newPatientsThisMonth: 0,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [priorityPatients, setPriorityPatients] = useState<PriorityPatient[]>(
    []
  );
  const [todaysAgenda, setTodaysAgenda] = useState<AgendaItem[]>([]);

  // Animações
  const fadeAnims = {
    stats: useRef(new Animated.Value(0)).current,
    activity: useRef(new Animated.Value(0)).current,
    priority: useRef(new Animated.Value(0)).current,
    agenda: useRef(new Animated.Value(0)).current,
  };

  /**
   * Busca estatísticas do dashboard
   */
  const fetchStats = async () => {
    try {
      const data = await api.get<DashboardStats>("/dashboard/stats");
      setStats(data);
    } catch (error: any) {
      console.error("Erro ao buscar estatísticas:", error);
      Alert.alert(
        "Erro",
        "Não foi possível carregar as estatísticas. Tente novamente."
      );
    } finally {
      setIsLoadingStats(false);
    }
  };

  /**
   * Busca atividades recentes
   */
  const fetchRecentActivity = async () => {
    try {
      const data = await api.get<RecentActivity[]>(
        "/dashboard/recent-activity?limit=5"
      );
      setRecentActivity(data);
    } catch (error: any) {
      console.error("Erro ao buscar atividades:", error);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  /**
   * Busca pacientes prioritários
   */
  const fetchPriorityPatients = async () => {
    try {
      const data = await api.get<PriorityPatient[]>(
        "/dashboard/priority-patients?limit=5"
      );
      setPriorityPatients(data);
    } catch (error: any) {
      console.error("Erro ao buscar pacientes prioritários:", error);
    } finally {
      setIsLoadingPriority(false);
    }
  };

  /**
   * Busca agenda do dia
   * TODO: Implementar endpoint real quando modelo Appointment for criado
   */
  const fetchTodaysAgenda = async () => {
    try {
      setIsLoadingAgenda(true);

      // Mock data - Será substituído por endpoint real
      // GET /dashboard/todays-agenda
      const mockAgenda: AgendaItem[] = [
        {
          id: "1",
          type: "appointment",
          title: "Consulta de Retorno",
          description: "Acompanhamento de evolução e ajuste do plano alimentar",
          time: "09:00",
          patientName: "Maria Silva",
          patientId: "patient-1",
          status: "scheduled",
        },
        {
          id: "2",
          type: "evaluation",
          title: "Avaliação Antropométrica",
          description: "Medição de dobras cutâneas e bioimpedância",
          time: "10:30",
          patientName: "João Santos",
          patientId: "patient-2",
          status: "scheduled",
        },
        {
          id: "3",
          type: "goal_deadline",
          title: "Prazo de Meta",
          description: "Meta de peso: 70kg (vence hoje)",
          time: "14:00",
          patientName: "Ana Costa",
          patientId: "patient-3",
          status: "scheduled",
        },
      ];

      setTodaysAgenda(mockAgenda);
    } catch (error: any) {
      console.error("Erro ao buscar agenda:", error);
      Alert.alert(
        "Erro",
        "Não foi possível carregar a agenda do dia. Tente novamente."
      );
    } finally {
      setIsLoadingAgenda(false);
    }
  };

  /**
   * Busca todos os dados do dashboard
   */
  const fetchDashboardData = async () => {
    await Promise.all([
      fetchStats(),
      fetchRecentActivity(),
      fetchPriorityPatients(),
      fetchTodaysAgenda(),
    ]);
  };

  /**
   * Pull to refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    setIsLoadingStats(true);
    setIsLoadingActivity(true);
    setIsLoadingPriority(true);
    setIsLoadingAgenda(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  /**
   * Carrega dados ao montar
   */
  useEffect(() => {
    void fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Anima seções quando dados carregam
   */
  useEffect(() => {
    if (!isLoadingStats) {
      Animated.timing(fadeAnims.stats, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoadingStats, fadeAnims.stats]);

  useEffect(() => {
    if (!isLoadingActivity) {
      Animated.timing(fadeAnims.activity, {
        toValue: 1,
        duration: 400,
        delay: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoadingActivity, fadeAnims.activity]);

  useEffect(() => {
    if (!isLoadingPriority) {
      Animated.timing(fadeAnims.priority, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoadingPriority, fadeAnims.priority]);

  useEffect(() => {
    if (!isLoadingAgenda) {
      Animated.timing(fadeAnims.agenda, {
        toValue: 1,
        duration: 400,
        delay: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoadingAgenda, fadeAnims.agenda]);

  /**
   * Formata timestamp para exibição
   */
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return "Agora";
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Ontem";
    if (diffInDays < 7) return `${diffInDays}d atrás`;

    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  /**
   * Retorna o ícone correto para o tipo de atividade
   */
  const getActivityIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      goal_achieved: "trophy",
      new_measurement: "body",
      new_patient: "person-add",
      goal_created: "flag",
    };
    return iconMap[type] || "information-circle";
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, Nutricionista! 👋</Text>
          <Text style={styles.subtitle}>
            Aqui está um resumo da sua clínica
          </Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => {
            // TODO: Navegar para notificações
          }}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={theme.colors.text}
          />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <Animated.View
        style={[
          styles.statsGrid,
          { opacity: isLoadingStats ? 1 : fadeAnims.stats },
        ]}
      >
        {isLoadingStats ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <Ionicons name="people" size={32} color={theme.colors.primary} />
              <Text style={styles.statValue}>{stats.totalPatients}</Text>
              <Text style={styles.statLabel}>Total de Pacientes</Text>
            </View>

            <View style={[styles.statCard, styles.statCardSuccess]}>
              <Ionicons name="flag" size={32} color={theme.colors.success} />
              <Text style={styles.statValue}>{stats.activeGoals}</Text>
              <Text style={styles.statLabel}>Metas Ativas</Text>
            </View>

            <View style={[styles.statCard, styles.statCardWarning]}>
              <Ionicons name="body" size={32} color={theme.colors.warning} />
              <Text style={styles.statValue}>{stats.measurementsToday}</Text>
              <Text style={styles.statLabel}>Medições Hoje</Text>
            </View>

            <View style={[styles.statCard, styles.statCardInfo]}>
              <Ionicons name="person-add" size={32} color={theme.colors.info} />
              <Text style={styles.statValue}>
                +{stats.newPatientsThisMonth}
              </Text>
              <Text style={styles.statLabel}>Novos Este Mês</Text>
            </View>
          </>
        )}
      </Animated.View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("PatientCreate")}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: theme.colors.primary + "20" },
              ]}
            >
              <Ionicons
                name="person-add"
                size={24}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.actionLabel}>Novo Paciente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // TODO: Navegar para agenda
            }}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: theme.colors.success + "20" },
              ]}
            >
              <Ionicons
                name="calendar"
                size={24}
                color={theme.colors.success}
              />
            </View>
            <Text style={styles.actionLabel}>Agenda</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // TODO: Navegar para relatórios
            }}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: theme.colors.warning + "20" },
              ]}
            >
              <Ionicons
                name="stats-chart"
                size={24}
                color={theme.colors.warning}
              />
            </View>
            <Text style={styles.actionLabel}>Relatórios</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Patients")}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: theme.colors.info + "20" },
              ]}
            >
              <Ionicons name="people" size={24} color={theme.colors.info} />
            </View>
            <Text style={styles.actionLabel}>Ver Todos</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <Animated.View
        style={[
          styles.section,
          { opacity: isLoadingActivity ? 1 : fadeAnims.activity },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Atividade Recente</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Ver Tudo</Text>
          </TouchableOpacity>
        </View>

        {isLoadingActivity ? (
          <View style={styles.activityList}>
            <ActivityItemSkeleton />
            <ActivityItemSkeleton />
            <ActivityItemSkeleton />
          </View>
        ) : recentActivity.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.emptyStateText}>Nenhuma atividade recente</Text>
          </View>
        ) : (
          <View style={styles.activityList}>
            {recentActivity.map((activity) => {
              const iconName = getActivityIcon(activity.type);
              const iconColor =
                activity.type === "goal_achieved"
                  ? theme.colors.success
                  : activity.type === "new_measurement"
                  ? theme.colors.primary
                  : activity.type === "new_patient"
                  ? theme.colors.info
                  : theme.colors.warning;

              return (
                <TouchableOpacity
                  key={activity.id}
                  style={styles.activityItem}
                  onPress={() => {
                    if (activity.patientId) {
                      // @ts-ignore - navegação entre diferentes navigators
                      navigation.navigate("PatientDetails", {
                        patientId: activity.patientId,
                        patientName: activity.patientName || "Paciente",
                      });
                    }
                  }}
                >
                  <View
                    style={[
                      styles.activityIcon,
                      { backgroundColor: iconColor + "20" },
                    ]}
                  >
                    <Ionicons name={iconName} size={20} color={iconColor} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityDescription}>
                      {activity.description}
                    </Text>
                    <Text style={styles.activityTime}>
                      {formatTimestamp(activity.timestamp)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </Animated.View>

      {/* Pacientes Prioritários */}
      <Animated.View
        style={[
          styles.section,
          { opacity: isLoadingPriority ? 1 : fadeAnims.priority },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pacientes Prioritários</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Patients")}>
            <Text style={styles.seeAllButton}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {isLoadingPriority ? (
          <>
            <ActivityItemSkeleton />
            <ActivityItemSkeleton />
            <ActivityItemSkeleton />
          </>
        ) : priorityPatients.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="shield-checkmark-outline"
              size={48}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.emptyStateText}>
              Nenhum paciente requer atenção no momento
            </Text>
          </View>
        ) : (
          <View style={styles.priorityList}>
            {priorityPatients.map((patient) => (
              <PriorityPatientCard
                key={patient.id}
                patient={patient}
                onPress={() => {
                  navigation.navigate("PatientDetails", {
                    patientId: patient.id,
                    patientName: patient.name,
                  });
                }}
              />
            ))}
          </View>
        )}
      </Animated.View>

      {/* Agenda do Dia */}
      <Animated.View
        style={[
          styles.section,
          { opacity: isLoadingAgenda ? 1 : fadeAnims.agenda },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Agenda de Hoje</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Calendar")}>
            <Text style={styles.seeAllButton}>Ver calendário</Text>
          </TouchableOpacity>
        </View>

        {isLoadingAgenda ? (
          <>
            <ActivityItemSkeleton />
            <ActivityItemSkeleton />
          </>
        ) : todaysAgenda.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.emptyStateText}>
              Nenhuma atividade agendada para hoje
            </Text>
          </View>
        ) : (
          <View style={styles.agendaList}>
            {todaysAgenda.map((item) => (
              <AgendaItemCard
                key={item.id}
                item={item}
                onPress={() => {
                  if (item.patientId) {
                    navigation.navigate("PatientDetails", {
                      patientId: item.patientId,
                      patientName: item.patientName,
                    });
                  }
                }}
                onComplete={() => {
                  Alert.alert(
                    "Concluir Atividade",
                    `Marcar "${item.title}" como concluída?`,
                    [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Concluir",
                        onPress: () => {
                          // TODO: Implementar lógica de conclusão
                          setTodaysAgenda((prev) =>
                            prev.map((a) =>
                              a.id === item.id
                                ? { ...a, status: "completed" as const }
                                : a
                            )
                          );
                          Alert.alert("Sucesso", "Atividade concluída!");
                        },
                      },
                    ]
                  );
                }}
              />
            ))}
          </View>
        )}
      </Animated.View>

      {/* Placeholder para gráficos futuros */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Evolução Mensal</Text>
        <View style={styles.chartPlaceholder}>
          <Ionicons
            name="bar-chart-outline"
            size={48}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.placeholderText}>
            Gráficos serão adicionados na Task 3
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.xl * 2,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: theme.spacing.xl,
    },
    greeting: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    notificationButton: {
      position: "relative",
      padding: theme.spacing.xs,
    },
    badge: {
      position: "absolute",
      top: 0,
      right: 0,
      backgroundColor: theme.colors.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.xs,
    },
    badgeText: {
      color: theme.colors.white,
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.bold,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.md,
      marginBottom: theme.spacing.xl,
    },
    statCard: {
      flex: 1,
      minWidth: "45%",
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      alignItems: "center",
      ...theme.shadows.sm,
    },
    statCardPrimary: {
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    statCardSuccess: {
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.success,
    },
    statCardWarning: {
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.warning,
    },
    statCardInfo: {
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.info,
    },
    statValue: {
      fontSize: theme.typography.fontSize["3xl"],
      fontWeight: theme.typography.fontWeight.black,
      color: theme.colors.text,
      marginTop: theme.spacing.sm,
    },
    statLabel: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
      textAlign: "center",
      marginTop: theme.spacing.xs,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
    },
    seeAllText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.primary,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    quickActions: {
      flexDirection: "row",
      gap: theme.spacing.md,
    },
    actionButton: {
      flex: 1,
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    actionIcon: {
      width: 56,
      height: 56,
      borderRadius: theme.borderRadius.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    actionLabel: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.text,
      textAlign: "center",
    },
    activityList: {
      gap: theme.spacing.md,
    },
    activityItem: {
      flexDirection: "row",
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      gap: theme.spacing.md,
      ...theme.shadows.sm,
    },
    activityIcon: {
      width: 40,
      height: 40,
      borderRadius: theme.borderRadius.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    activityDescription: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    activityTime: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
    },
    emptyState: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.xl * 2,
      alignItems: "center",
      justifyContent: "center",
      ...theme.shadows.sm,
    },
    emptyStateText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.md,
      textAlign: "center",
    },
    chartPlaceholder: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.xl * 2,
      alignItems: "center",
      justifyContent: "center",
      ...theme.shadows.sm,
    },
    placeholderText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.md,
      textAlign: "center",
    },
    seeAllButton: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.primary,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    priorityList: {
      gap: theme.spacing.md,
    },
    agendaList: {
      gap: theme.spacing.md,
    },
  });
