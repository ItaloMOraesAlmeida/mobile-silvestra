/**
 * PatientEvolutionScreen
 *
 * Tela moderna de evolução do paciente integrando todos os componentes,
 * modals e hooks criados nas fases anteriores.
 *
 * Integra:
 * - Fase 3: Componentes (MetricCard, EvolutionChart, PeriodSelector, etc)
 * - Fase 4: Modals (AssessmentDetails, Circumferences, Skinfolds, etc)
 * - Fase 5: Hooks (usePatientEvolution, usePatientInsights, useEvolutionCharts)
 */

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";

// Componentes da Fase 3
import {
  MetricCard,
  EvolutionChart,
  PeriodSelector,
  InsightCard,
  ProgressIndicator,
  GoalProgressBar,
} from "../../components/evolution";

// Modals da Fase 4
import {
  AssessmentDetailsModal,
  CircumferencesModal,
  SkinfoldsModal,
  GoalDetailsModal,
  MealPlanAdherenceModal,
} from "../../components/evolution/modals";

// Hooks da Fase 5
import {
  usePatientEvolution,
  usePatientInsights,
  useMealPlanAdherence,
  useEvolutionCharts,
  type Period,
} from "../../hooks/evolution";

interface PatientEvolutionScreenProps {
  route: {
    params: {
      patientId: string;
    };
  };
  navigation: any;
}

export function PatientEvolutionScreen({
  route,
  navigation,
}: PatientEvolutionScreenProps) {
  const patientId = route?.params?.patientId;
  const styles = createStyles(lightTheme);

  // Estados de período e modals
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("30d");
  const [assessmentModalVisible, setAssessmentModalVisible] = useState(false);
  const [circumferencesModalVisible, setCircumferencesModalVisible] =
    useState(false);
  const [skinfoldsModalVisible, setSkinfoldsModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [adherenceModalVisible, setAdherenceModalVisible] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Hooks da Fase 5
  const {
    data: evolutionData,
    loading: evolutionLoading,
    error: evolutionError,
    refetch: refetchEvolution,
    isRefetching,
    filteredAssessments,
    latestAssessment,
    previousAssessment,
  } = usePatientEvolution({
    patientId,
    period: selectedPeriod,
    autoFetch: true,
  });

  const {
    insights,
    loading: insightsLoading,
    dismissInsight,
  } = usePatientInsights({
    patientId,
    minSeverity: 1,
    excludeDismissed: true,
  });

  const { stats: adherenceStats, loading: adherenceLoading } =
    useMealPlanAdherence({
      patientId,
      autoFetch: true,
    });

  const { weightChart, bodyFatChart, muscleMassChart, hasData } =
    useEvolutionCharts({
      assessments: filteredAssessments,
    });

  // Calcular BMI atual
  const currentBMI = useMemo(() => {
    if (latestAssessment?.weight && latestAssessment?.height) {
      return (
        latestAssessment.weight / Math.pow(latestAssessment.height / 100, 2)
      );
    }
    return null;
  }, [latestAssessment]);

  // Meta selecionada (com cast para GoalData)
  const selectedGoal = useMemo(() => {
    if (!selectedGoalId || !evolutionData) return null;
    const goal = evolutionData.goals.find((g) => g.id === selectedGoalId);
    if (!goal) return null;

    // Cast para GoalData (compatível com GoalDetailsModal)
    return {
      ...goal,
      type: goal.type as
        | "weight"
        | "body_fat"
        | "muscle_mass"
        | "circumference"
        | "other",
    };
  }, [selectedGoalId, evolutionData]);

  // Loading inicial
  if (evolutionLoading && !evolutionData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={lightTheme.colors.primary} />
        <Text style={styles.loadingText}>Carregando evolução...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (evolutionError && !evolutionData) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons
          name="alert-circle"
          size={48}
          color={lightTheme.colors.error}
        />
        <Text style={styles.errorText}>Erro ao carregar dados</Text>
        <Text style={styles.errorMessage}>{evolutionError.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetchEvolution}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={lightTheme.colors.text}
          />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Evolução do Paciente</Text>
          <Text style={styles.headerSubtitle}>
            {evolutionData?.patient.name}
          </Text>
        </View>

        <TouchableOpacity
          onPress={refetchEvolution}
          style={styles.refreshButton}
        >
          <Ionicons
            name="refresh"
            size={24}
            color={
              isRefetching ? lightTheme.colors.primary : lightTheme.colors.text
            }
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetchEvolution}
            tintColor={lightTheme.colors.primary}
          />
        }
      >
        {/* Seletor de Período */}
        <View style={styles.section}>
          <PeriodSelector
            selectedPeriod={selectedPeriod}
            onSelectPeriod={setSelectedPeriod}
          />
        </View>

        {/* Cards de Métricas Principais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Métricas Principais</Text>
          <View style={styles.metricsGrid}>
            <View key="metric-weight" style={styles.metricItem}>
              <MetricCard
                label="Peso"
                value={latestAssessment?.weight || 0}
                unit="kg"
                initialValue={previousAssessment?.weight}
                icon="body"
                size="medium"
                loading={evolutionLoading}
              />
            </View>

            <View key="metric-bmi" style={styles.metricItem}>
              <MetricCard
                label="IMC"
                value={currentBMI || 0}
                unit=""
                initialValue={
                  previousAssessment?.weight && previousAssessment?.height
                    ? previousAssessment.weight /
                      Math.pow(previousAssessment.height / 100, 2)
                    : undefined
                }
                icon="calculator"
                size="medium"
                loading={evolutionLoading}
              />
            </View>

            <View key="metric-bodyfat" style={styles.metricItem}>
              <MetricCard
                label="Gordura"
                value={latestAssessment?.bodyFatPercent || 0}
                unit="%"
                initialValue={previousAssessment?.bodyFatPercent}
                icon="water"
                size="medium"
                accentColor={lightTheme.colors.warning}
                loading={evolutionLoading}
              />
            </View>

            <View key="metric-muscle" style={styles.metricItem}>
              <MetricCard
                label="Massa Muscular"
                value={latestAssessment?.muscleMass || 0}
                unit="kg"
                initialValue={previousAssessment?.muscleMass}
                icon="fitness"
                size="medium"
                accentColor={lightTheme.colors.success}
                loading={evolutionLoading}
              />
            </View>
          </View>
        </View>

        {/* Gráficos de Evolução */}
        {hasData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evolução</Text>

            {weightChart && (
              <View style={styles.chartContainer}>
                <EvolutionChart
                  data={weightChart.data}
                  label="Peso"
                  unit="kg"
                  color={lightTheme.colors.primary}
                  height={200}
                  showDots
                />
              </View>
            )}

            {bodyFatChart && (
              <View style={styles.chartContainer}>
                <EvolutionChart
                  data={bodyFatChart.data}
                  label="Percentual de Gordura"
                  unit="%"
                  color={lightTheme.colors.warning}
                  height={200}
                />
              </View>
            )}

            {muscleMassChart && (
              <View style={styles.chartContainer}>
                <EvolutionChart
                  data={muscleMassChart.data}
                  label="Massa Muscular"
                  unit="kg"
                  color={lightTheme.colors.success}
                  height={200}
                />
              </View>
            )}
          </View>
        )}

        {/* Insights */}
        {!insightsLoading && insights && insights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insights</Text>
            {insights.slice(0, 3).map((insight) => (
              <View key={insight.id} style={styles.insightItem}>
                <InsightCard
                  type={insight.type}
                  title={insight.title}
                  message={insight.message}
                  severity={insight.severity}
                  onDismiss={() => dismissInsight(insight.id)}
                />
              </View>
            ))}
          </View>
        )}

        {/* Metas Ativas */}
        {evolutionData && evolutionData.goals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Metas Ativas</Text>
            {evolutionData.goals
              .filter((goal) => goal.status === "in_progress")
              .slice(0, 3)
              .map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  style={styles.goalCard}
                  onPress={() => {
                    setSelectedGoalId(goal.id);
                    setGoalModalVisible(true);
                  }}
                >
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <View style={styles.goalProgressContainer}>
                    <GoalProgressBar
                      initialValue={goal.initialValue}
                      currentValue={goal.currentValue}
                      targetValue={goal.targetValue}
                      unit={goal.unit}
                      height={8}
                      showLabels={false}
                      animated
                    />
                  </View>
                  <View style={styles.goalFooter}>
                    <Text style={styles.goalValues}>
                      {goal.currentValue} / {goal.targetValue} {goal.unit}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={lightTheme.colors.textSecondary}
                    />
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* Aderência ao Plano Alimentar */}
        {adherenceStats && !adherenceLoading && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.adherenceCard}
              onPress={() => setAdherenceModalVisible(true)}
            >
              <View style={styles.adherenceHeader}>
                <View>
                  <Text style={styles.adherenceTitle}>Aderência ao Plano</Text>
                  <Text style={styles.adherencePeriod}>
                    {adherenceStats.period}
                  </Text>
                </View>
                <ProgressIndicator
                  progress={adherenceStats.overallAdherence}
                  size="medium"
                  showPercentage
                  animated
                />
              </View>

              <View style={styles.adherenceStats}>
                <View style={styles.adherenceStat}>
                  <Text style={styles.adherenceStatValue}>
                    {adherenceStats.mealsCompleted}
                  </Text>
                  <Text style={styles.adherenceStatLabel}>Refeições</Text>
                </View>
                <View style={styles.adherenceStat}>
                  <Text style={styles.adherenceStatValue}>
                    {adherenceStats.currentStreak}
                  </Text>
                  <Text style={styles.adherenceStatLabel}>Sequência</Text>
                </View>
                <View style={styles.adherenceStat}>
                  <Text style={styles.adherenceStatValue}>
                    {adherenceStats.consistencyScore.toFixed(0)}%
                  </Text>
                  <Text style={styles.adherenceStatLabel}>Consistência</Text>
                </View>
              </View>

              <View style={styles.adherenceFooter}>
                <Text style={styles.viewDetailsText}>Ver detalhes</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={lightTheme.colors.primary}
                />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Ações Rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setAssessmentModalVisible(true)}
            >
              <Ionicons
                name="document-text"
                size={24}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.actionButtonText}>Avaliação Completa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setCircumferencesModalVisible(true)}
            >
              <Ionicons
                name="body"
                size={24}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.actionButtonText}>Circunferências</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setSkinfoldsModalVisible(true)}
            >
              <Ionicons
                name="resize"
                size={24}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.actionButtonText}>Dobras Cutâneas</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Modals da Fase 4 */}
      <AssessmentDetailsModal
        visible={assessmentModalVisible}
        assessment={latestAssessment}
        previousAssessment={previousAssessment}
        onClose={() => setAssessmentModalVisible(false)}
      />

      <CircumferencesModal
        visible={circumferencesModalVisible}
        currentData={latestAssessment}
        previousData={previousAssessment}
        onClose={() => setCircumferencesModalVisible(false)}
      />

      <SkinfoldsModal
        visible={skinfoldsModalVisible}
        currentData={latestAssessment}
        previousData={previousAssessment}
        onClose={() => setSkinfoldsModalVisible(false)}
      />

      <GoalDetailsModal
        visible={goalModalVisible}
        goal={selectedGoal}
        onClose={() => {
          setGoalModalVisible(false);
          setSelectedGoalId(null);
        }}
        onEdit={(goalId) => {
          // Navegar para tela de edição
          console.log("Editar meta:", goalId);
        }}
        onDelete={(goalId) => {
          // Implementar deleção
          console.log("Deletar meta:", goalId);
        }}
      />

      <MealPlanAdherenceModal
        visible={adherenceModalVisible}
        data={adherenceStats}
        onClose={() => setAdherenceModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: typeof lightTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 16,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.background,
      padding: 20,
    },
    errorText: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.error,
      marginTop: 16,
      marginBottom: 8,
    },
    errorMessage: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: "center",
      marginBottom: 24,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      marginRight: 12,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: 2,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    refreshButton: {
      marginLeft: 12,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      paddingHorizontal: 20,
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: 16,
    },
    metricsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -6,
    },
    metricItem: {
      width: "50%",
      paddingHorizontal: 6,
      marginBottom: 12,
    },
    chartContainer: {
      marginBottom: 24,
    },
    insightItem: {
      marginBottom: 12,
    },
    goalCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    goalTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 12,
    },
    goalProgressContainer: {
      marginBottom: 12,
    },
    goalFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    goalValues: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    adherenceCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    adherenceHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    adherenceTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 4,
    },
    adherencePeriod: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    adherenceStats: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      marginBottom: 12,
    },
    adherenceStat: {
      alignItems: "center",
    },
    adherenceStatValue: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: 4,
    },
    adherenceStatLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    adherenceFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    viewDetailsText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.primary,
      marginRight: 4,
    },
    actionsGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    actionButton: {
      flex: 1,
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      marginHorizontal: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.text,
      marginTop: 8,
      textAlign: "center",
    },
  });
