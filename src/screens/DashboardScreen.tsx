/**
 * Dashboard Screen - Tela principal do nutricionista
 * Exibe métricas, alertas, performance e insights
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Text,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { lightTheme } from "../theme";
import OverviewCards from "../components/dashboard/OverviewCards";
import AlertsSection from "../components/dashboard/AlertsSection";
import AdherencePatientsModal from "../components/dashboard/AdherencePatientsModal";
import PendingReviewsModal from "../components/dashboard/PendingReviewsModal";
import UpcomingDeadlinesModal from "../components/dashboard/UpcomingDeadlinesModal";
import InactivePatientsModal from "../components/dashboard/InactivePatientsModal";
import PerformanceChart from "../components/dashboard/PerformanceChart";
import TopPerformersCard from "../components/dashboard/TopPerformersCard";
import StatisticsGrid from "../components/dashboard/StatisticsGrid";
import GoalsProgressSection from "../components/dashboard/GoalsProgressSection";
import InsightsSection from "../components/dashboard/InsightsSection";
import {
  getDashboardOverview,
  getDashboardAlerts,
  getDashboardPerformance,
  getDashboardTopPerformers,
  getDashboardStatistics,
  getDashboardGoalsProgress,
  getDashboardInsights,
} from "../services/dashboard.service";
import {
  DashboardOverview,
  DashboardAlerts,
  PerformanceData,
  TopPerformers,
  DashboardStatistics,
  GoalsProgress,
  DashboardInsights,
  DashboardPeriod,
} from "../types/dashboard";

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados dos dados
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlerts | null>(null);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [topPerformers, setTopPerformers] = useState<TopPerformers | null>(
    null
  );
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(
    null
  );
  const [goalsProgress, setGoalsProgress] = useState<GoalsProgress | null>(
    null
  );
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>(
    DashboardPeriod.WEEK
  );
  const [adherenceModalVisible, setAdherenceModalVisible] = useState(false);
  const [pendingReviewsModalVisible, setPendingReviewsModalVisible] =
    useState(false);
  const [deadlinesModalVisible, setDeadlinesModalVisible] = useState(false);
  const [inactivePatientsModalVisible, setInactivePatientsModalVisible] =
    useState(false);

  /**
   * Carregar todos os dados do dashboard
   */
  const loadDashboardData = useCallback(async () => {
    try {
      const [
        overviewData,
        alertsData,
        performanceData,
        topPerformersData,
        statisticsData,
        goalsProgressData,
        insightsData,
      ] = await Promise.all([
        getDashboardOverview().then((data) => {
          return data;
        }),
        getDashboardAlerts().then((data) => {
          return data;
        }),
        getDashboardPerformance(selectedPeriod).then((data) => {
          return data;
        }),
        getDashboardTopPerformers(5).then((data) => {
          return data;
        }),
        getDashboardStatistics().then((data) => {
          return data;
        }),
        getDashboardGoalsProgress().then((data) => {
          return data;
        }),
        getDashboardInsights().then((data) => {
          return data;
        }),
      ]);

      setOverview(overviewData);
      setAlerts(alertsData);
      setPerformance(performanceData);
      setTopPerformers(topPerformersData);
      setStatistics(statisticsData);
      setGoalsProgress(goalsProgressData);
      setInsights(insightsData);
    } catch (error) {
      console.error("[DashboardScreen] Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod]);

  /**
   * Recarregar dados (pull to refresh)
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  /**
   * Navegar para detalhes do paciente
   */
  const handlePatientPress = useCallback(
    (patientId?: string) => {
      if (patientId) {
        // @ts-ignore - Navigation types
        navigation.navigate("PatientDetails", { patientId });
      }
    },
    [navigation]
  );

  /**
   * Navegar para detalhes do paciente na aba de planos alimentares
   */
  const handleAdherencePatientPress = useCallback(
    (patientId: string) => {
      // @ts-ignore - Navigation types
      navigation.navigate("PatientDetails", {
        patientId,
        initialTab: "plans", // Indica para abrir na aba de planos
      });
    },
    [navigation]
  );

  /**
   * Handler para avaliações pendentes (lógica inteligente)
   * Se houver apenas 1 avaliação pendente, navega direto para detalhes
   * Se houver mais de 1, exibe o modal de seleção
   */
  const handleReviewsPress = useCallback(() => {
    if (alerts && alerts.pendingReviews === 1) {
      // Com apenas 1 avaliação, navegaria diretamente
      // Mas como precisamos buscar o ID da consulta, exibe o modal
      // O modal já fará a navegação para a consulta única
      setPendingReviewsModalVisible(true);
    } else if (alerts && alerts.pendingReviews > 1) {
      setPendingReviewsModalVisible(true);
    }
  }, [alerts]);

  /**
   * Handler para metas vencendo - sempre exibe modal agrupado por paciente
   */
  const handleGoalsPress = useCallback(() => {
    setDeadlinesModalVisible(true);
  }, []);

  /**
   * Handler para pacientes inativos - sempre exibe modal
   */
  const handleInactivePatientsPress = useCallback(() => {
    setInactivePatientsModalVisible(true);
  }, []);

  /**
   * Navegar para detalhes da consulta
   */
  const handleAppointmentPress = useCallback(
    (appointmentId: string) => {
      setPendingReviewsModalVisible(false);
      // @ts-ignore - Navigation types
      navigation.navigate("AppointmentDetails", { appointmentId });
    },
    [navigation]
  );

  /**
   * Navegar para detalhes do paciente (a partir dos modais de alerta)
   */
  const handleAlertPatientPress = useCallback(
    (patientId: string) => {
      setDeadlinesModalVisible(false);
      setInactivePatientsModalVisible(false);
      // @ts-ignore - Navigation types
      navigation.navigate("PatientDetails", { patientId });
    },
    [navigation]
  );

  /**
   * Mudar período do gráfico
   */
  const handlePeriodChange = useCallback((period: DashboardPeriod) => {
    setSelectedPeriod(period);
  }, []);

  /**
   * Carregar dados na inicialização
   */
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={lightTheme.colors.primary} />
        <Text style={styles.loadingText}>Carregando dashboard...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Seção 1 - Resumo Executivo (Overview Cards) */}
        {overview && (
          <View style={styles.firstSection}>
            <OverviewCards
              data={overview}
              onTotalPatientsPress={() => {
                // @ts-ignore - Navigation types
                navigation.navigate("Patients", { initialFilter: "all" });
              }}
              onActivePatientsPress={() => {
                // @ts-ignore - Navigation types
                navigation.navigate("Patients", { initialFilter: "active" });
              }}
              onAdherencePress={() => setAdherenceModalVisible(true)}
              onTodayAppointmentsPress={() =>
                navigation.navigate("AppointmentCalendar" as never)
              }
            />
          </View>
        )}

        {/* Seção 2 - Alertas */}
        {alerts && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alertas</Text>
            <AlertsSection
              data={alerts}
              onAlertPress={handlePatientPress}
              onGoalsPress={handleGoalsPress}
              onReviewsPress={handleReviewsPress}
              onInactivePatientsPress={handleInactivePatientsPress}
            />
          </View>
        )}

        {/* Seção 3 - Gráfico de Performance */}
        {performance && (
          <View style={styles.section}>
            <PerformanceChart
              data={performance}
              selectedPeriod={selectedPeriod}
              onPeriodChange={handlePeriodChange}
            />
          </View>
        )}

        {/* Seção 4 - Top Performers */}
        {topPerformers && (
          <View style={styles.section}>
            <TopPerformersCard
              data={topPerformers}
              onPatientPress={handlePatientPress}
            />
          </View>
        )}

        {/* Seção 5 - Grid de Estatísticas */}
        {statistics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estatísticas Gerais</Text>
            <StatisticsGrid data={statistics} />
          </View>
        )}

        {/* Seção 6 - Progresso de Metas */}
        {goalsProgress && (
          <View style={styles.section}>
            <GoalsProgressSection data={goalsProgress} />
          </View>
        )}

        {/* Seção 7 - Insights */}
        {insights && (
          <View style={[styles.section, styles.lastSection]}>
            <InsightsSection data={insights} />
          </View>
        )}
      </ScrollView>

      {/* Modal de Adesão Alimentar */}
      <AdherencePatientsModal
        visible={adherenceModalVisible}
        onClose={() => setAdherenceModalVisible(false)}
        onPatientPress={handleAdherencePatientPress}
      />

      {/* Modal de Avaliações Pendentes */}
      <PendingReviewsModal
        visible={pendingReviewsModalVisible}
        onClose={() => setPendingReviewsModalVisible(false)}
        onAppointmentPress={handleAppointmentPress}
      />

      {/* Modal de Metas Vencendo */}
      {alerts && (
        <UpcomingDeadlinesModal
          visible={deadlinesModalVisible}
          onClose={() => setDeadlinesModalVisible(false)}
          deadlines={alerts.upcomingDeadlines}
          onPatientPress={handleAlertPatientPress}
        />
      )}

      {/* Modal de Pacientes Inativos */}
      {alerts && (
        <InactivePatientsModal
          visible={inactivePatientsModalVisible}
          onClose={() => setInactivePatientsModalVisible(false)}
          patients={alerts.inactivePatients}
          onPatientPress={handleAlertPatientPress}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: lightTheme.colors.text,
  },
  firstSection: {
    padding: 20,
    paddingTop: 20,
  },
  section: {
    padding: 20,
    paddingTop: 12,
  },
  lastSection: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: lightTheme.colors.text,
  },
});
