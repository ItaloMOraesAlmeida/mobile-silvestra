/**
 * PerformanceChart - Gráfico de performance com seletor de período
 */

import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Text,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { lightTheme } from "../../theme";
import { PerformanceData, DashboardPeriod } from "../../types/dashboard";

interface PerformanceChartProps {
  data: PerformanceData;
  selectedPeriod: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
}

export default function PerformanceChart({
  data,
  selectedPeriod,
  onPeriodChange,
}: PerformanceChartProps) {
  const colors = lightTheme.colors;
  const screenWidth = Dimensions.get("window").width;

  const periods = [
    { key: DashboardPeriod.TODAY, label: "Hoje" },
    { key: DashboardPeriod.WEEK, label: "Semana" },
    { key: DashboardPeriod.MONTH, label: "Mês" },
  ];

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#8B5CF6",
    },
  };

  // Preparar labels baseado no período
  const getLabels = (): string[] => {
    // A API já retorna os labels corretos para o período selecionado
    return data.labels || [];
  };

  // Preparar dados do gráfico
  const prepareChartData = () => {
    // A API já retorna os valores corretos para o período selecionado
    return data.values || [];
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Seletor de período */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Adesão ao Plano
        </Text>
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => onPeriodChange(period.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.periodText,
                  {
                    color:
                      selectedPeriod === period.key
                        ? "#FFFFFF"
                        : colors.textSecondary,
                  },
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Estatísticas rápidas */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {data.averageAdherence}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Média
          </Text>
        </View>
        {data.bestDay && (
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#10B981" }]}>
              {data.bestDay.value}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Melhor ({data.bestDay.day})
            </Text>
          </View>
        )}
        {data.worstDay && (
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#F59E0B" }]}>
              {data.worstDay.value}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Pior ({data.worstDay.day})
            </Text>
          </View>
        )}
      </View>

      {/* Gráfico */}
      <View style={styles.chartContainer}>
        <LineChart
          data={{
            labels: getLabels(),
            datasets: [
              {
                data: prepareChartData(),
              },
            ],
          }}
          width={screenWidth - 64}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={false}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
          withDots={true}
          withShadow={false}
          fromZero
          segments={4}
        />
      </View>

      {/* Legenda */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#8B5CF6" }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Taxa de adesão (%)
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  periodSelector: {
    flexDirection: "row",
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  periodText: {
    fontSize: 14,
    fontWeight: "600",
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  chartContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  chart: {
    borderRadius: 16,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
  },
});
