import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";
import { LineChart } from "../../components/charts";
import {
  useBodyMeasurements,
  EvolutionData,
} from "../../hooks/useBodyMeasurements";
import { usePatients } from "../../hooks/usePatients";

interface PatientProgressScreenProps {
  route: {
    params: {
      patientId: string;
    };
  };
  navigation: any;
}

type PeriodFilter = "7d" | "30d" | "3m" | "6m" | "1y";

export function PatientProgressScreen({ route }: PatientProgressScreenProps) {
  const patientId = route?.params?.patientId;
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("30d");
  const { width } = useWindowDimensions();
  const { getEvolution } = useBodyMeasurements();
  const { getPatientById } = usePatients();

  // Estados para dados do paciente
  const [patient, setPatient] = useState<any>(null);
  const [loadingPatient, setLoadingPatient] = useState(true);

  // Estados para dados reais
  const [loadingWeight, setLoadingWeight] = useState(true);
  const [loadingBMI, setLoadingBMI] = useState(true);

  const [weightData, setWeightData] = useState<{ date: Date; value: number }[]>(
    []
  );
  const [bmiData, setBmiData] = useState<{ date: Date; value: number }[]>([]);

  const [hasData, setHasData] = useState(true);

  const periods: { value: PeriodFilter; label: string }[] = [
    { value: "7d", label: "7 dias" },
    { value: "30d", label: "30 dias" },
    { value: "3m", label: "3 meses" },
    { value: "6m", label: "6 meses" },
    { value: "1y", label: "1 ano" },
  ];

  // Carregar dados do paciente
  useEffect(() => {
    loadPatientDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // Carregar dados de evolução após ter os dados do paciente
  useEffect(() => {
    if (patient) {
      loadWeightEvolution();
      loadBMIEvolution();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient, selectedPeriod]);

  const loadPatientDetails = async () => {
    try {
      setLoadingPatient(true);
      const result = await getPatientById(patientId);
      if (result) {
        setPatient(result);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do paciente:", error);
    } finally {
      setLoadingPatient(false);
    }
  };

  const loadWeightEvolution = async () => {
    try {
      setLoadingWeight(true);

      // Verifica se o paciente confirmou o acesso
      if (!patient?.patient?.hasConfirmedAccess) {
        setWeightData([]);
        setHasData(false);
        setLoadingWeight(false);
        return;
      }

      const evolution = await getEvolution(patientId, "weight", selectedPeriod);

      if (evolution && evolution.data.length > 0) {
        const formattedData = evolution.data.map((item: EvolutionData) => ({
          date: new Date(item.date),
          value: item.value,
        }));
        setWeightData(formattedData);
        setHasData(true);
      } else {
        setWeightData([]);
        setHasData(false);
      }
    } catch (error) {
      console.error("Erro ao carregar evolução de peso:", error);
      setWeightData([]);
    } finally {
      setLoadingWeight(false);
    }
  };

  const loadBMIEvolution = async () => {
    try {
      setLoadingBMI(true);

      // Verifica se o paciente confirmou o acesso
      if (!patient?.patient?.hasConfirmedAccess) {
        setBmiData([]);
        setLoadingBMI(false);
        return;
      }

      const evolution = await getEvolution(patientId, "bmi", selectedPeriod);

      if (evolution && evolution.data.length > 0) {
        const formattedData = evolution.data.map((item: EvolutionData) => ({
          date: new Date(item.date),
          value: item.value,
        }));
        setBmiData(formattedData);
      } else {
        setBmiData([]);
      }
    } catch (error) {
      console.error("Erro ao carregar evolução de IMC:", error);
      setBmiData([]);
    } finally {
      setLoadingBMI(false);
    }
  };

  const chartWidth = width - lightTheme.spacing.xl * 2;

  // Calcular estatísticas de peso
  const weightStats = {
    initial: weightData.length > 0 ? weightData[0].value : 0,
    current:
      weightData.length > 0 ? weightData[weightData.length - 1].value : 0,
    change:
      weightData.length > 0
        ? weightData[weightData.length - 1].value - weightData[0].value
        : 0,
    changePercent:
      weightData.length > 0 && weightData[0].value > 0
        ? ((weightData[weightData.length - 1].value - weightData[0].value) /
            weightData[0].value) *
          100
        : 0,
  };

  // Calcular estatísticas de IMC
  const bmiStats = {
    initial: bmiData.length > 0 ? bmiData[0].value : 0,
    current: bmiData.length > 0 ? bmiData[bmiData.length - 1].value : 0,
  };

  const getBMIClassification = (bmi: number): string => {
    if (bmi < 18.5) return "Abaixo do peso";
    if (bmi < 25) return "Peso Normal";
    if (bmi < 30) return "Sobrepeso";
    return "Obesidade";
  };

  // Validação de patientId
  if (!patientId) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={80}
          color={lightTheme.colors.error}
        />
        <Text style={styles.emptyTitle}>Erro</Text>
        <Text style={styles.emptyText}>
          ID do paciente não encontrado. Por favor, retorne e tente novamente.
        </Text>
      </SafeAreaView>
    );
  }

  // Se não há dados suficientes
  if (!hasData && !loadingWeight && !loadingBMI && !loadingPatient) {
    // Verifica se o paciente não confirmou o acesso
    if (!patient?.patient?.hasConfirmedAccess) {
      return (
        <SafeAreaView style={styles.emptyContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={80}
            color={lightTheme.colors.gray[400]}
          />
          <Text style={styles.emptyTitle}>Acesso Pendente</Text>
          <Text style={styles.emptyText}>
            O paciente ainda não confirmou o código de acesso. Os dados de
            evolução só estarão disponíveis após a confirmação.
          </Text>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Ionicons
          name="analytics-outline"
          size={80}
          color={lightTheme.colors.gray[400]}
        />
        <Text style={styles.emptyTitle}>Sem dados de evolução</Text>
        <Text style={styles.emptyText}>
          Ainda não há avaliações suficientes para gerar gráficos de evolução.
        </Text>
        <Text style={styles.emptySubtext}>
          Crie pelo menos 2 avaliações antropométricas para começar a acompanhar
          o progresso do paciente.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Evolução do Paciente</Text>
          <Text style={styles.subtitle}>
            Acompanhe o progresso ao longo do tempo
          </Text>
        </View>

        {/* Period Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Período:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterButtons}
          >
            {periods.map((period) => (
              <TouchableOpacity
                key={period.value}
                style={[
                  styles.filterButton,
                  selectedPeriod === period.value && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedPeriod(period.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedPeriod === period.value &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Peso */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons
                name="analytics"
                size={24}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Evolução de Peso</Text>
            </View>
          </View>

          {loadingWeight ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={lightTheme.colors.primary}
              />
              <Text style={styles.loadingText}>
                Carregando dados de peso...
              </Text>
            </View>
          ) : weightData.length > 0 ? (
            <>
              <LineChart
                data={weightData}
                width={chartWidth}
                height={200}
                color={lightTheme.colors.primary}
                showDots
                showGrid
                showLabels
                yAxisLabel="Peso (kg)"
                formatValue={(v) => `${v.toFixed(1)} kg`}
              />

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Peso Inicial</Text>
                  <Text style={styles.statValue}>
                    {weightStats.initial.toFixed(1)} kg
                  </Text>
                  <Text style={styles.statDate}>primeira avaliação</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Peso Atual</Text>
                  <Text
                    style={[
                      styles.statValue,
                      {
                        color:
                          weightStats.change < 0
                            ? lightTheme.colors.success
                            : lightTheme.colors.error,
                      },
                    ]}
                  >
                    {weightStats.current.toFixed(1)} kg
                  </Text>
                  <Text style={styles.statDate}>última avaliação</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Variação</Text>
                  <Text
                    style={[
                      styles.statValue,
                      {
                        color:
                          weightStats.change < 0
                            ? lightTheme.colors.success
                            : lightTheme.colors.error,
                      },
                    ]}
                  >
                    {weightStats.change > 0 ? "+" : ""}
                    {weightStats.change.toFixed(1)} kg
                  </Text>
                  <Text style={styles.statDate}>
                    {weightStats.changePercent > 0 ? "+" : ""}
                    {weightStats.changePercent.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons
                name="bar-chart-outline"
                size={48}
                color={lightTheme.colors.gray[400]}
              />
              <Text style={styles.noDataText}>
                Sem dados de peso para este período
              </Text>
            </View>
          )}
        </View>

        {/* IMC */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons
                name="calculator"
                size={24}
                color={lightTheme.colors.warning}
              />
              <Text style={styles.sectionTitle}>Índice de Massa Corporal</Text>
            </View>
          </View>

          {loadingBMI ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={lightTheme.colors.primary}
              />
              <Text style={styles.loadingText}>Carregando dados de IMC...</Text>
            </View>
          ) : bmiData.length > 0 ? (
            <>
              <LineChart
                data={bmiData}
                width={chartWidth}
                height={180}
                color={lightTheme.colors.success}
                showDots
                showGrid
                showLabels
                yAxisLabel="IMC"
                formatValue={(v) => v.toFixed(1)}
              />

              <View style={styles.imcStats}>
                <View style={styles.imcCard}>
                  <Text style={styles.imcLabel}>IMC Inicial</Text>
                  <Text style={styles.imcValue}>
                    {bmiStats.initial.toFixed(1)}
                  </Text>
                  <Text style={styles.imcCategory}>
                    {getBMIClassification(bmiStats.initial)}
                  </Text>
                </View>
                <Ionicons
                  name="arrow-forward"
                  size={24}
                  color={lightTheme.colors.gray[400]}
                />
                <View style={styles.imcCard}>
                  <Text style={styles.imcLabel}>IMC Atual</Text>
                  <Text
                    style={[
                      styles.imcValue,
                      {
                        color:
                          bmiStats.current < 25
                            ? lightTheme.colors.success
                            : lightTheme.colors.warning,
                      },
                    ]}
                  >
                    {bmiStats.current.toFixed(1)}
                  </Text>
                  <Text
                    style={[
                      styles.imcCategory,
                      {
                        color:
                          bmiStats.current < 25
                            ? lightTheme.colors.success
                            : lightTheme.colors.warning,
                      },
                    ]}
                  >
                    {getBMIClassification(bmiStats.current)}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons
                name="calculator-outline"
                size={48}
                color={lightTheme.colors.gray[400]}
              />
              <Text style={styles.noDataText}>
                Sem dados de IMC para este período
              </Text>
            </View>
          )}
        </View>

        {/* Info Footer */}
        <View style={styles.infoFooter}>
          <Ionicons
            name="information-circle"
            size={20}
            color={lightTheme.colors.info}
          />
          <Text style={styles.infoText}>
            Os gráficos exibem dados simulados para demonstração. Conecte a API
            real para visualizar o progresso do paciente com dados atualizados.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: lightTheme.spacing.xl,
    paddingTop: lightTheme.spacing.xl,
    paddingBottom: lightTheme.spacing.lg,
    backgroundColor: lightTheme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  title: {
    fontSize: lightTheme.typography.fontSize["2xl"],
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[800],
    marginBottom: lightTheme.spacing.xs,
  },
  subtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
  },
  filterContainer: {
    backgroundColor: lightTheme.colors.white,
    paddingVertical: lightTheme.spacing.lg,
    paddingHorizontal: lightTheme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  filterLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[700],
    marginBottom: lightTheme.spacing.sm,
  },
  filterButtons: {
    gap: lightTheme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: lightTheme.spacing.lg,
    paddingVertical: lightTheme.spacing.sm,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: lightTheme.colors.gray[100],
  },
  filterButtonActive: {
    backgroundColor: lightTheme.colors.primary,
  },
  filterButtonText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[700],
  },
  filterButtonTextActive: {
    color: lightTheme.colors.white,
  },
  section: {
    marginTop: lightTheme.spacing.xl,
    paddingHorizontal: lightTheme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: lightTheme.spacing.lg,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.sm,
  },
  sectionTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[800],
  },
  chartPlaceholder: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing["2xl"],
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
    ...lightTheme.shadows.sm,
  },
  placeholderText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[600],
    marginTop: lightTheme.spacing.md,
    textAlign: "center",
  },
  placeholderSubtext: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[400],
    marginTop: lightTheme.spacing.xs,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    gap: lightTheme.spacing.md,
    marginTop: lightTheme.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.lg,
    alignItems: "center",
    ...lightTheme.shadows.sm,
  },
  statLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginBottom: lightTheme.spacing.xs,
  },
  statValue: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[800],
    marginBottom: lightTheme.spacing.xs - 2,
  },
  statDate: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[400],
  },
  adherenceStats: {
    marginTop: lightTheme.spacing.lg,
  },
  adherenceCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.xl,
    alignItems: "center",
    ...lightTheme.shadows.sm,
  },
  adherenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.md,
    marginBottom: lightTheme.spacing.sm,
  },
  adherenceValue: {
    fontSize: lightTheme.typography.fontSize["3xl"],
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[800],
  },
  adherenceBadge: {
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.xs,
    borderRadius: lightTheme.borderRadius.full,
  },
  adherenceBadgeText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
  },
  adherenceLabel: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[700],
    marginBottom: lightTheme.spacing.xs - 2,
  },
  adherenceSubtext: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
  },
  measurementsTable: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    overflow: "hidden",
    marginTop: lightTheme.spacing.lg,
    ...lightTheme.shadows.sm,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: lightTheme.colors.gray[50],
    paddingVertical: lightTheme.spacing.sm,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
    textTransform: "uppercase",
  },
  tableHeaderCellFirst: {
    textAlign: "left",
    paddingLeft: lightTheme.spacing.lg,
  },
  tableHeaderCellLast: {
    textAlign: "right",
    paddingRight: lightTheme.spacing.lg,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: lightTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  tableRowEven: {
    backgroundColor: lightTheme.colors.gray[50],
  },
  tableCell: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[700],
    textAlign: "center",
  },
  tableCellFirst: {
    textAlign: "left",
    paddingLeft: lightTheme.spacing.lg,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
  },
  tableCellLast: {
    textAlign: "right",
    paddingRight: lightTheme.spacing.lg,
  },
  tableCellChange: {
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.success,
  },
  imcStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: lightTheme.spacing.lg,
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.xl,
    ...lightTheme.shadows.sm,
  },
  imcCard: {
    flex: 1,
    alignItems: "center",
  },
  imcLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing.sm,
  },
  imcValue: {
    fontSize: lightTheme.typography.fontSize["2xl"],
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[800],
    marginBottom: lightTheme.spacing.xs,
  },
  imcCategory: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[600],
  },
  infoFooter: {
    flexDirection: "row",
    backgroundColor: lightTheme.colors.info + "10",
    marginHorizontal: lightTheme.spacing.xl,
    marginTop: lightTheme.spacing.xl,
    padding: lightTheme.spacing.lg,
    borderRadius: lightTheme.borderRadius.lg,
    gap: lightTheme.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[700],
    lineHeight: 20,
  },
  bottomSpacer: {
    height: lightTheme.spacing["2xl"],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: lightTheme.spacing["2xl"],
    backgroundColor: lightTheme.colors.background,
  },
  emptyTitle: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[800],
    marginTop: lightTheme.spacing.lg,
    marginBottom: lightTheme.spacing.sm,
    textAlign: "center",
  },
  emptyText: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
    marginBottom: lightTheme.spacing.sm,
  },
  emptySubtext: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
    textAlign: "center",
    lineHeight: 20,
  },
  loadingContainer: {
    padding: lightTheme.spacing["2xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: lightTheme.spacing.md,
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
  },
  noDataContainer: {
    padding: lightTheme.spacing["2xl"],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: lightTheme.borderRadius.lg,
  },
  noDataText: {
    marginTop: lightTheme.spacing.md,
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
  },
});
