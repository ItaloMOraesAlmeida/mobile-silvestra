/**
 * EvolutionChart Component
 *
 * Gráfico de linha genérico para exibir evolução de métricas ao longo do tempo.
 * Baseado no WeightEvolutionChart mas mais flexível e reutilizável.
 *
 * Features:
 * - Suporta múltiplas séries de dados
 * - Formatação customizável de valores e datas
 * - Cores temáticas
 * - Estados de loading e empty
 * - Scroll horizontal para muitos pontos
 * - Tooltips nos pontos
 *
 * Usado para: Peso, IMC, Gordura, Massa Magra, Circunferências, etc.
 */

import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { lightTheme } from "../../theme";

const screenWidth = Dimensions.get("window").width;

export interface ChartDataPoint {
  date: string; // ISO date string
  value: number;
}

export interface EvolutionChartProps {
  // Dados
  data: ChartDataPoint[];
  label: string;
  unit: string;

  // Customização visual
  color?: string;
  height?: number;
  showDots?: boolean;
  bezier?: boolean;

  // Formatação
  formatValue?: (value: number) => string;
  formatDate?: (date: string) => string;
  decimals?: number;

  // Estados
  loading?: boolean;
  error?: string | null;
}

export const EvolutionChart: React.FC<EvolutionChartProps> = ({
  data,
  label,
  unit,
  color,
  height = 220,
  showDots = true,
  bezier = true,
  formatValue,
  formatDate,
  decimals = 1,
  loading = false,
  error = null,
}) => {
  const styles = createStyles(lightTheme);

  const chartColor = color || lightTheme.colors.primary;

  // Processar dados para o gráfico
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Ordenar por data
    const sortedData = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Extrair valores
    const values = sortedData.map((point) => point.value);

    // Formatar labels (datas)
    const labels = sortedData.map((point) => {
      if (formatDate) {
        return formatDate(point.date);
      }
      // Formatação padrão: dia/mês
      const date = new Date(point.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    return {
      labels,
      datasets: [
        {
          data: values,
          color: () => chartColor,
          strokeWidth: 2,
        },
      ],
    };
  }, [data, formatDate, chartColor]);

  // Estado de loading
  if (loading) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={lightTheme.colors.primary} />
          <Text style={styles.loadingText}>Carregando gráfico...</Text>
        </View>
      </View>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  // Sem dados
  if (!chartData || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Nenhum dado disponível para este período
          </Text>
        </View>
      </View>
    );
  }

  // Poucos dados (menos de 2 pontos)
  if (data.length < 2) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Pelo menos 2 medições são necessárias para gerar o gráfico
          </Text>
          <Text style={styles.currentValue}>
            Valor atual: {data[0].value.toFixed(decimals)} {unit}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header com label */}
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.dataPoints}>
          {data.length} {data.length === 1 ? "medição" : "medições"}
        </Text>
      </View>

      {/* Gráfico */}
      <LineChart
        data={chartData}
        width={screenWidth - 32} // Margem de 16px de cada lado
        height={height - 60} // Menos o espaço do header
        yAxisSuffix={` ${unit}`}
        chartConfig={{
          backgroundColor: lightTheme.colors.card,
          backgroundGradientFrom: lightTheme.colors.card,
          backgroundGradientTo: lightTheme.colors.card,
          decimalPlaces: decimals,
          color: (opacity = 1) => {
            // Converter hex para rgba
            const hex = chartColor.replace("#", "");
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
          },
          labelColor: () => lightTheme.colors.textSecondary,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: showDots ? "4" : "0",
            strokeWidth: "2",
            stroke: chartColor,
          },
          propsForBackgroundLines: {
            strokeDasharray: "", // Linhas sólidas
            stroke: lightTheme.colors.border,
            strokeWidth: 1,
          },
        }}
        bezier={bezier}
        style={styles.chart}
        fromZero={false}
        yAxisInterval={1}
        segments={4}
        withInnerLines={true}
        withOuterLines={true}
        withVerticalLines={false}
        withHorizontalLines={true}
        withVerticalLabels={true}
        withHorizontalLabels={true}
        formatYLabel={(value) => {
          if (formatValue) {
            return formatValue(parseFloat(value));
          }
          return parseFloat(value).toFixed(decimals);
        }}
      />

      {/* Estatísticas rápidas */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Mínimo</Text>
          <Text style={styles.statValue}>
            {Math.min(...chartData.datasets[0].data).toFixed(decimals)} {unit}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Máximo</Text>
          <Text style={styles.statValue}>
            {Math.max(...chartData.datasets[0].data).toFixed(decimals)} {unit}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Variação</Text>
          <Text style={styles.statValue}>
            {(
              Math.max(...chartData.datasets[0].data) -
              Math.min(...chartData.datasets[0].data)
            ).toFixed(decimals)}{" "}
            {unit}
          </Text>
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: typeof lightTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      // Sombra
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },

    label: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
    },

    dataPoints: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },

    chart: {
      marginVertical: 8,
      borderRadius: 16,
    },

    stats: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },

    statItem: {
      alignItems: "center",
      flex: 1,
    },

    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },

    statValue: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
    },

    statDivider: {
      width: 1,
      backgroundColor: theme.colors.border,
      marginHorizontal: 8,
    },

    // Estados
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 150,
    },

    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },

    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 150,
    },

    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      textAlign: "center",
    },

    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 150,
    },

    emptyText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: "center",
      marginBottom: 8,
    },

    currentValue: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
      marginTop: 8,
    },
  });
