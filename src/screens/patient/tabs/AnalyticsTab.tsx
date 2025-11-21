import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { useThemedStyles, useTheme } from "../../../hooks/useTheme";
import type { Theme } from "../../../theme";
import { CardSkeleton } from "../../../components/patient";
import {
  WeightEvolutionChart,
  BodyCompositionChart,
  GoalsDistributionChart,
  ActivityHeatmap,
  ProgressGauge,
  type WeightDataPoint,
  type BodyCompositionData,
  type GoalsDistribution,
  type ActivityData,
  type ProgressGaugeData,
} from "../../../components/charts";

type RouteParams = {
  PatientDetails: {
    patientId: string;
    patientName: string;
  };
};

type PeriodOption = "7d" | "30d" | "90d" | "all";

interface PeriodButtonProps {
  label: string;
  value: PeriodOption;
  selected: boolean;
  onPress: () => void;
}

const PeriodButton: React.FC<PeriodButtonProps> = ({
  label,
  value,
  selected,
  onPress,
}) => {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: theme.borderRadius.lg,
          backgroundColor: selected
            ? theme.colors.primary
            : theme.colors.surface,
          borderWidth: 1,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <Text
        style={{
          fontSize: theme.typography.fontSize.sm,
          fontFamily: theme.typography.fontFamily.semibold,
          color: selected ? theme.colors.white : theme.colors.text,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * AnalyticsTab Component
 *
 * Aba de analytics avançada com gráficos ricos:
 * - Evolução de peso
 * - Composição corporal
 * - Distribuição de metas
 * - Heatmap de atividades
 * - Medidor de progresso geral
 */
export const AnalyticsTab: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const route = useRoute<RouteProp<RouteParams, "PatientDetails">>();
  const { patientId } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>("30d");

  // Mock data - TODO: Substituir por chamadas reais à API
  const mockWeightData: WeightDataPoint[] = [
    { date: "2024-01-01", weight: 85.5, goal: 80, bmi: 27.2 },
    { date: "2024-01-15", weight: 84.8, goal: 80, bmi: 27.0 },
    { date: "2024-02-01", weight: 83.9, goal: 80, bmi: 26.7 },
    { date: "2024-02-15", weight: 83.2, goal: 80, bmi: 26.5 },
    { date: "2024-03-01", weight: 82.1, goal: 80, bmi: 26.1 },
    { date: "2024-03-15", weight: 81.5, goal: 80, bmi: 25.9 },
  ];

  const mockBodyCompositionData: BodyCompositionData[] = [
    {
      date: "2024-01-01",
      leanMass: 60.5,
      fatMass: 25.0,
      waterPercentage: 58.5,
    },
    {
      date: "2024-01-15",
      leanMass: 61.2,
      fatMass: 23.6,
      waterPercentage: 59.0,
    },
    {
      date: "2024-02-01",
      leanMass: 61.8,
      fatMass: 22.1,
      waterPercentage: 59.5,
    },
    {
      date: "2024-02-15",
      leanMass: 62.3,
      fatMass: 20.9,
      waterPercentage: 60.0,
    },
    {
      date: "2024-03-01",
      leanMass: 62.9,
      fatMass: 19.2,
      waterPercentage: 60.5,
    },
    {
      date: "2024-03-15",
      leanMass: 63.4,
      fatMass: 18.1,
      waterPercentage: 61.0,
    },
  ];

  const mockGoalsData: GoalsDistribution = {
    achieved: 8,
    inProgress: 5,
    overdue: 2,
    notStarted: 3,
  };

  const mockActivityData: ActivityData[] = [];
  // Gerar 180 dias de atividades aleatórias
  for (let i = 180; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const count = Math.random() > 0.3 ? Math.floor(Math.random() * 8) : 0;
    mockActivityData.push({
      date: date.toISOString().split("T")[0],
      count,
    });
  }

  const mockProgressData: ProgressGaugeData = {
    overall: 78.5,
    goalsCompleted: 75,
    adherence: 82,
    consistency: 85,
  };

  const fetchAnalyticsData = React.useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) setLoading(true);

        // TODO: Fetch real analytics data from backend using patientId and selectedPeriod
        // await analyticsService.getWeightEvolution(patientId, selectedPeriod);
        // await analyticsService.getBodyComposition(patientId, selectedPeriod);
        // await analyticsService.getGoalsStats(patientId);
        // await analyticsService.getActivityHeatmap(patientId);
        // await analyticsService.getProgressScore(patientId);
        console.log(
          "Fetching analytics for patient:",
          patientId,
          "period:",
          selectedPeriod
        );

        // Simulando delay da API
        await new Promise((resolve) => setTimeout(resolve, 800));
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
        if (isRefresh) setRefreshing(false);
      }
    },
    [patientId, selectedPeriod]
  );

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAnalyticsData(true);
  }, [fetchAnalyticsData]);

  // Loading state
  if (loading) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </ScrollView>
    );
  }

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
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Ionicons name="stats-chart" size={28} color={theme.colors.primary} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Analytics Avançado</Text>
            <Text style={styles.headerSubtitle}>
              Visualizações detalhadas de progresso e aderência
            </Text>
          </View>
        </View>
      </View>

      {/* Period Selector */}
      <View style={styles.periodCard}>
        <View style={styles.selectorHeader}>
          <Ionicons name="calendar" size={20} color={theme.colors.primary} />
          <Text style={styles.selectorTitle}>Período de Análise</Text>
        </View>
        <View style={styles.periodButtons}>
          <PeriodButton
            label="7 dias"
            value="7d"
            selected={selectedPeriod === "7d"}
            onPress={() => setSelectedPeriod("7d")}
          />
          <PeriodButton
            label="30 dias"
            value="30d"
            selected={selectedPeriod === "30d"}
            onPress={() => setSelectedPeriod("30d")}
          />
          <PeriodButton
            label="90 dias"
            value="90d"
            selected={selectedPeriod === "90d"}
            onPress={() => setSelectedPeriod("90d")}
          />
          <PeriodButton
            label="Tudo"
            value="all"
            selected={selectedPeriod === "all"}
            onPress={() => setSelectedPeriod("all")}
          />
        </View>
      </View>

      {/* Progress Gauge - Primeiro para mostrar score geral */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="speedometer" size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Score Geral</Text>
        </View>
        <ProgressGauge data={mockProgressData} />
      </View>

      {/* Weight Evolution Chart */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trending-up" size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Evolução de Peso</Text>
        </View>
        <WeightEvolutionChart
          data={mockWeightData}
          showGoal={true}
          showBMI={true}
        />
      </View>

      {/* Body Composition Chart */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="body" size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Composição Corporal</Text>
        </View>
        <BodyCompositionChart data={mockBodyCompositionData} />
      </View>

      {/* Goals Distribution */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trophy" size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Status das Metas</Text>
        </View>
        <GoalsDistributionChart data={mockGoalsData} />
      </View>

      {/* Activity Heatmap */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons
            name="calendar-outline"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.sectionTitle}>Padrão de Atividades</Text>
        </View>
        <ActivityHeatmap data={mockActivityData} months={6} />
      </View>

      {/* Info Footer */}
      <View style={styles.infoFooter}>
        <Ionicons
          name="information-circle"
          size={20}
          color={theme.colors.info}
        />
        <Text style={styles.infoText}>
          Os dados são atualizados automaticamente com base nas medições e
          registros do paciente. Para análises mais detalhadas, utilize a aba
          &quot;Progresso&quot;.
        </Text>
      </View>
    </ScrollView>
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
    headerCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.md,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    headerTextContainer: {
      flex: 1,
    },
    headerTitle: {
      fontSize: theme.typography.fontSize["2xl"],
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text,
    },
    headerSubtitle: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    periodCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.sm,
    },
    selectorHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    selectorTitle: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.semibold,
      color: theme.colors.text,
    },
    periodButtons: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      flexWrap: "wrap",
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.xs,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text,
    },
    infoFooter: {
      flexDirection: "row",
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.xl,
      marginBottom: theme.spacing.xl,
      ...theme.shadows.sm,
    },
    infoText: {
      flex: 1,
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
  });
