import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";
import { LineChart, BarChart, PieChart } from "../../components/charts";
import { subDays, subMonths } from "date-fns";

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
  const { patientId } = route.params;
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("30d");
  const { width } = useWindowDimensions();

  // TODO: Carregar dados reais do paciente usando patientId
  console.log("Patient ID:", patientId);

  const periods: { value: PeriodFilter; label: string }[] = [
    { value: "7d", label: "7 dias" },
    { value: "30d", label: "30 dias" },
    { value: "3m", label: "3 meses" },
    { value: "6m", label: "6 meses" },
    { value: "1y", label: "1 ano" },
  ];

  // Dados simulados para gráficos
  const weightData = useMemo(() => {
    const now = new Date();
    const points =
      selectedPeriod === "7d" ? 7 : selectedPeriod === "30d" ? 10 : 12;
    const data = [];

    for (let i = points - 1; i >= 0; i--) {
      const date =
        selectedPeriod === "7d"
          ? subDays(now, i)
          : selectedPeriod === "30d"
          ? subDays(now, i * 3)
          : subMonths(now, i);

      // Simula perda gradual de peso
      const baseWeight = 78.5;
      const progressFactor = (points - i) / points;
      const value = baseWeight - progressFactor * 3.3;

      data.push({ date, value });
    }
    return data;
  }, [selectedPeriod]);

  const adherenceData = useMemo(
    () => [
      { label: "Ótima", value: 70, color: lightTheme.colors.success },
      { label: "Boa", value: 17, color: lightTheme.colors.info },
      { label: "Regular", value: 10, color: lightTheme.colors.warning },
      { label: "Baixa", value: 3, color: lightTheme.colors.error },
    ],
    []
  );

  const measurementsData = useMemo(
    () => [
      { label: "Cintura", value: 87, color: lightTheme.colors.primary },
      { label: "Quadril", value: 98, color: lightTheme.colors.success },
      { label: "Braço", value: 31, color: lightTheme.colors.info },
      { label: "Coxa", value: 56, color: lightTheme.colors.warning },
    ],
    []
  );

  const imcData = useMemo(() => {
    const now = new Date();
    return [
      { date: subMonths(now, 3), value: 26.8 },
      { date: subMonths(now, 2), value: 26.2 },
      { date: subMonths(now, 1), value: 25.5 },
      { date: now, value: 24.9 },
    ];
  }, []);

  const chartWidth = width - lightTheme.spacing.xl * 2;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
          <TouchableOpacity>
            <Ionicons
              name="expand"
              size={20}
              color={lightTheme.colors.gray[400]}
            />
          </TouchableOpacity>
        </View>

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
            <Text style={styles.statValue}>78.5 kg</Text>
            <Text style={styles.statDate}>há 3 meses</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Peso Atual</Text>
            <Text
              style={[styles.statValue, { color: lightTheme.colors.success }]}
            >
              75.2 kg
            </Text>
            <Text style={styles.statDate}>hoje</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Variação</Text>
            <Text
              style={[styles.statValue, { color: lightTheme.colors.success }]}
            >
              -3.3 kg
            </Text>
            <Text style={styles.statDate}>-4.2%</Text>
          </View>
        </View>
      </View>

      {/* Adesão */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons
              name="checkmark-done"
              size={24}
              color={lightTheme.colors.success}
            />
            <Text style={styles.sectionTitle}>Adesão ao Plano</Text>
          </View>
          <TouchableOpacity>
            <Ionicons
              name="expand"
              size={20}
              color={lightTheme.colors.gray[400]}
            />
          </TouchableOpacity>
        </View>

        <PieChart
          data={adherenceData}
          width={chartWidth}
          height={250}
          showLabels
          showPercentages
          innerRadius={60}
        />

        <View style={styles.adherenceStats}>
          <View style={styles.adherenceCard}>
            <View style={styles.adherenceHeader}>
              <Text style={styles.adherenceValue}>87%</Text>
              <View
                style={[
                  styles.adherenceBadge,
                  { backgroundColor: lightTheme.colors.success + "20" },
                ]}
              >
                <Text
                  style={[
                    styles.adherenceBadgeText,
                    { color: lightTheme.colors.success },
                  ]}
                >
                  Ótima
                </Text>
              </View>
            </View>
            <Text style={styles.adherenceLabel}>Adesão Média</Text>
            <Text style={styles.adherenceSubtext}>nos últimos 30 dias</Text>
          </View>
        </View>
      </View>

      {/* Medidas Corporais */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="body" size={24} color={lightTheme.colors.info} />
            <Text style={styles.sectionTitle}>Medidas Corporais</Text>
          </View>
          <TouchableOpacity>
            <Ionicons
              name="expand"
              size={20}
              color={lightTheme.colors.gray[400]}
            />
          </TouchableOpacity>
        </View>

        <BarChart
          data={measurementsData}
          width={chartWidth}
          height={220}
          showValues
          showGrid
          formatValue={(v) => `${v} cm`}
        />

        <View style={styles.measurementsTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.tableHeaderCellFirst]}>
              Medida
            </Text>
            <Text style={styles.tableHeaderCell}>Inicial</Text>
            <Text style={styles.tableHeaderCell}>Atual</Text>
            <Text style={[styles.tableHeaderCell, styles.tableHeaderCellLast]}>
              Var.
            </Text>
          </View>

          {[
            {
              label: "Cintura",
              initial: "92 cm",
              current: "87 cm",
              change: "-5 cm",
            },
            {
              label: "Quadril",
              initial: "102 cm",
              current: "98 cm",
              change: "-4 cm",
            },
            {
              label: "Braço",
              initial: "32 cm",
              current: "31 cm",
              change: "-1 cm",
            },
            {
              label: "Coxa",
              initial: "58 cm",
              current: "56 cm",
              change: "-2 cm",
            },
          ].map((measurement, index) => (
            <View
              key={index}
              style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}
            >
              <Text style={[styles.tableCell, styles.tableCellFirst]}>
                {measurement.label}
              </Text>
              <Text style={styles.tableCell}>{measurement.initial}</Text>
              <Text style={styles.tableCell}>{measurement.current}</Text>
              <Text
                style={[
                  styles.tableCell,
                  styles.tableCellLast,
                  styles.tableCellChange,
                ]}
              >
                {measurement.change}
              </Text>
            </View>
          ))}
        </View>
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
          <TouchableOpacity>
            <Ionicons
              name="expand"
              size={20}
              color={lightTheme.colors.gray[400]}
            />
          </TouchableOpacity>
        </View>

        <LineChart
          data={imcData}
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
            <Text style={styles.imcValue}>26.8</Text>
            <Text style={styles.imcCategory}>Sobrepeso</Text>
          </View>
          <Ionicons
            name="arrow-forward"
            size={24}
            color={lightTheme.colors.gray[400]}
          />
          <View style={styles.imcCard}>
            <Text style={styles.imcLabel}>IMC Atual</Text>
            <Text
              style={[styles.imcValue, { color: lightTheme.colors.success }]}
            >
              24.9
            </Text>
            <Text
              style={[styles.imcCategory, { color: lightTheme.colors.success }]}
            >
              Peso Normal
            </Text>
          </View>
        </View>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[50],
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
});
