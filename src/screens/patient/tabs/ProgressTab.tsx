import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { useThemedStyles, useTheme } from "../../../hooks/useTheme";
import type { Theme } from "../../../theme";
import { EmptyState, CardSkeleton } from "../../../components/patient";
import {
  AdvancedLineChart,
  PeriodSelector,
  MetricSelector,
  type DataSeries,
  type PeriodOption,
  type MetricOption,
} from "../../../components/charts";
import { bodyMeasurementsService } from "../../../services/api";
import type { BodyMeasurement } from "../../../types/patient-details.types";

type RouteParams = {
  PatientDetails: {
    patientId: string;
    patientName: string;
  };
};

export const ProgressTab: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const route = useRoute<RouteProp<RouteParams, "PatientDetails">>();
  const { patientId } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>("3M");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["weight"]);

  const fetchMeasurements = React.useCallback(
    async (isRefresh = false) => {
      try {
        setError(null);
        if (!isRefresh) setLoading(true);

        // Fetch all measurements (we'll filter by period client-side)
        const response = await bodyMeasurementsService.findAll(patientId, {
          page: 1,
          limit: 100,
          sortOrder: "asc",
        });

        setMeasurements(response.data);
      } catch (err) {
        console.error("Error fetching measurements:", err);
        setError("Não foi possível carregar os dados de progresso");
      } finally {
        setLoading(false);
        if (isRefresh) setRefreshing(false);
      }
    },
    [patientId]
  );

  useEffect(() => {
    fetchMeasurements();
  }, [fetchMeasurements]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchMeasurements(true);
  }, [fetchMeasurements]);

  // Definir métricas disponíveis
  const availableMetrics: MetricOption[] = useMemo(
    () => [
      { id: "weight", label: "Peso", color: "#3B82F6", unit: "kg" },
      { id: "bodyFat", label: "% Gordura", color: "#EF4444", unit: "%" },
      {
        id: "muscleMass",
        label: "Massa Muscular",
        color: "#10B981",
        unit: "kg",
      },
      { id: "bmi", label: "IMC", color: "#F59E0B", unit: "" },
      { id: "waist", label: "Cintura", color: "#8B5CF6", unit: "cm" },
      { id: "chest", label: "Peito", color: "#EC4899", unit: "cm" },
    ],
    []
  );

  // Converter medições para séries de dados do gráfico
  const chartSeries: DataSeries[] = useMemo(() => {
    const series: DataSeries[] = [];

    // Filtrar medições por período
    const now = new Date();
    let startDate = new Date(0); // Início dos tempos para "ALL"

    if (selectedPeriod !== "ALL") {
      switch (selectedPeriod) {
        case "1M":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "3M":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "6M":
          startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          break;
        case "1Y":
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    const filteredMeasurements = measurements.filter(
      (m) => new Date(m.createdAt) >= startDate
    );

    selectedMetrics.forEach((metricId) => {
      const metric = availableMetrics.find((m) => m.id === metricId);
      if (!metric) return;

      const dataPoints = filteredMeasurements
        .map((m) => {
          let value: number | null = null;

          switch (metricId) {
            case "weight":
              value = m.weight ?? null;
              break;
            case "bodyFat":
              value = m.bodyFatPercent ?? null;
              break;
            case "muscleMass":
              value = m.muscleMass ?? null;
              break;
            case "bmi":
              if (m.weight && m.height) {
                value = Number(
                  (m.weight / Math.pow(m.height / 100, 2)).toFixed(1)
                );
              }
              break;
            case "waist":
              value = m.waistCirc ?? null;
              break;
            case "chest":
              value = m.chestCirc ?? null;
              break;
          }

          if (value === null || value === undefined) return null;

          return {
            date: new Date(m.createdAt),
            value,
          };
        })
        .filter((p): p is { date: Date; value: number } => p !== null);

      if (dataPoints.length > 0) {
        series.push({
          id: metric.id,
          label: metric.label,
          data: dataPoints,
          color: metric.color,
          unit: metric.unit,
        });
      }
    });

    return series;
  }, [measurements, selectedMetrics, selectedPeriod, availableMetrics]);

  // Manipular toggle de métrica
  const handleToggleMetric = (metricId: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricId)
        ? prev.filter((id) => id !== metricId)
        : [...prev, metricId]
    );
  };

  // Calcular estatísticas baseadas nas séries selecionadas
  const calculateStats = useMemo(() => {
    if (chartSeries.length === 0) return null;

    const stats: Record<
      string,
      {
        min: number;
        max: number;
        avg: number;
        current: number;
        change: number;
        changePercent: number;
      }
    > = {};

    chartSeries.forEach((series) => {
      if (series.data.length === 0) return;

      const values = series.data.map((d) => d.value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const current = values[values.length - 1];
      const previous = values[0];
      const change = current - previous;
      const changePercent = previous > 0 ? (change / previous) * 100 : 0;

      stats[series.id] = { min, max, avg, current, change, changePercent };
    });

    return stats;
  }, [chartSeries]);

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
      </ScrollView>
    );
  }

  // Error state
  if (error) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.emptyContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <EmptyState
          icon="alert-circle"
          title="Erro ao carregar"
          message={error}
          actionLabel="Tentar novamente"
          onAction={() => fetchMeasurements()}
        />
      </ScrollView>
    );
  }

  // Empty state
  if (measurements.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.emptyContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <EmptyState
          icon="bar-chart"
          title="Sem dados de progresso"
          message="Adicione medições para visualizar gráficos de evolução"
          actionLabel="Adicionar Medição"
          onAction={() =>
            Alert.alert("Em breve", "Funcionalidade em desenvolvimento")
          }
        />
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
      {/* Header com info */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Ionicons name="analytics" size={24} color={theme.colors.primary} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Evolução e Progresso</Text>
            <Text style={styles.headerSubtitle}>
              Compare até 3 métricas ao longo do tempo
            </Text>
          </View>
        </View>
      </View>

      {/* Period Selector */}
      <View style={styles.selectorCard}>
        <View style={styles.selectorHeader}>
          <Ionicons name="calendar" size={20} color={theme.colors.primary} />
          <Text style={styles.selectorTitle}>Período</Text>
        </View>
        <PeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
      </View>

      {/* Metric Selector */}
      <View style={styles.selectorCard}>
        <View style={styles.selectorHeader}>
          <Ionicons name="options" size={20} color={theme.colors.primary} />
          <Text style={styles.selectorTitle}>Métricas</Text>
        </View>
        <MetricSelector
          metrics={availableMetrics}
          selectedMetrics={selectedMetrics}
          onToggleMetric={handleToggleMetric}
          maxSelections={3}
        />
      </View>

      {/* Advanced Line Chart */}
      {chartSeries.length > 0 ? (
        <View style={styles.chartCard}>
          <AdvancedLineChart
            series={chartSeries}
            showDots={true}
            showGrid={true}
            showLabels={true}
            showLegend={false}
          />
        </View>
      ) : (
        <View style={styles.emptyChartCard}>
          <Ionicons
            name="bar-chart-outline"
            size={48}
            color={theme.colors.gray[400]}
          />
          <Text style={styles.emptyChartText}>
            Selecione métricas para visualizar o gráfico
          </Text>
        </View>
      )}

      {/* Stats Cards */}
      {calculateStats && Object.keys(calculateStats).length > 0 && (
        <View style={styles.statsSection}>
          <Text style={styles.statsSectionTitle}>Estatísticas do Período</Text>
          {Object.entries(calculateStats).map(([seriesId, stats]) => {
            const metric = availableMetrics.find((m) => m.id === seriesId);
            if (!metric) return null;

            const isPositive = stats.change >= 0;
            const changeColor = isPositive
              ? theme.colors.success
              : theme.colors.error;

            return (
              <View key={seriesId} style={styles.statsCard}>
                <View style={styles.statsCardHeader}>
                  <View
                    style={[
                      styles.statsColorDot,
                      { backgroundColor: metric.color },
                    ]}
                  />
                  <Text style={styles.statsCardTitle}>{metric.label}</Text>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Atual</Text>
                    <Text style={styles.statValue}>
                      {stats.current.toFixed(1)} {metric.unit}
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Variação</Text>
                    <Text style={[styles.statValue, { color: changeColor }]}>
                      {stats.change >= 0 ? "+" : ""}
                      {stats.change.toFixed(1)} {metric.unit}
                    </Text>
                    <Text style={styles.statSubtext}>
                      ({stats.changePercent >= 0 ? "+" : ""}
                      {stats.changePercent.toFixed(1)}%)
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Máximo</Text>
                    <Text style={styles.statValue}>
                      {stats.max.toFixed(1)} {metric.unit}
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Mínimo</Text>
                    <Text style={styles.statValue}>
                      {stats.min.toFixed(1)} {metric.unit}
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Média</Text>
                    <Text style={styles.statValue}>
                      {stats.avg.toFixed(1)} {metric.unit}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
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
    emptyContent: {
      flexGrow: 1,
      justifyContent: "center",
    },
    headerCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.sm,
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
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    headerSubtitle: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    selectorCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.sm,
    },
    selectorHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    selectorTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
    },
    chartCard: {
      marginBottom: theme.spacing.md,
    },
    emptyChartCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.xl,
      marginBottom: theme.spacing.md,
      alignItems: "center",
      justifyContent: "center",
      ...theme.shadows.sm,
      minHeight: 200,
    },
    emptyChartText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.md,
      textAlign: "center",
    },
    statsSection: {
      marginBottom: theme.spacing.md,
    },
    statsSectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.xs,
    },
    statsCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.sm,
    },
    statsCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    statsColorDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
    },
    statsCardTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.md,
    },
    statItem: {
      flex: 1,
      minWidth: "30%",
      alignItems: "center",
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
    },
    statLabel: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
      textTransform: "uppercase",
      marginBottom: theme.spacing.xs,
    },
    statValue: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    statSubtext: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
    },
  });
