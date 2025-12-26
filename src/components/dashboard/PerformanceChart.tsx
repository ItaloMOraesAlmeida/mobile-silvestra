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
import Svg, { G, Path, Circle, Line, Text as SvgText } from "react-native-svg";
import { scaleLinear, scalePoint } from "d3-scale";
import { line, curveMonotoneX } from "d3-shape";
import { max } from "d3-array";
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

  // Configurar gráfico D3
  const chartWidth = screenWidth - 64;
  const chartHeight = 220;
  const chartPadding = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  const chartData = prepareChartData();
  const labels = getLabels();

  // Escalas
  const xScale = scalePoint()
    .domain(labels.map((_, i) => i.toString()))
    .range([0, innerWidth]);

  const yScale = scaleLinear()
    .domain([0, Math.max(max(chartData) || 100, 100)])
    .range([innerHeight, 0])
    .nice();

  const yTicks = yScale.ticks(4);

  // Gerador de linha D3
  const lineGenerator = line<number>()
    .x((_, i) => xScale(i.toString()) || 0)
    .y((d) => yScale(d))
    .curve(curveMonotoneX);

  const linePath = lineGenerator(chartData);

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
        <Svg width={chartWidth} height={chartHeight}>
          <G x={chartPadding.left} y={chartPadding.top}>
            {/* Grid horizontal */}
            {yTicks.map((tick) => (
              <Line
                key={`grid-${tick}`}
                x1={0}
                y1={yScale(tick)}
                x2={innerWidth}
                y2={yScale(tick)}
                stroke={colors.border}
                strokeWidth={1}
                opacity={0.2}
              />
            ))}

            {/* Linha de performance */}
            {linePath && (
              <Path d={linePath} stroke="#8B5CF6" strokeWidth={2} fill="none" />
            )}

            {/* Pontos */}
            {chartData.map((value, index) => {
              const x = xScale(index.toString()) || 0;
              const y = yScale(value);
              return (
                <Circle
                  key={`dot-${index}`}
                  cx={x}
                  cy={y}
                  r={4}
                  fill="#8B5CF6"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
              );
            })}

            {/* Eixo Y */}
            <Line
              x1={0}
              y1={0}
              x2={0}
              y2={innerHeight}
              stroke={colors.border}
              strokeWidth={1}
            />

            {/* Labels do eixo Y */}
            {yTicks.map((tick) => (
              <SvgText
                key={`label-y-${tick}`}
                x={-10}
                y={yScale(tick)}
                fontSize={10}
                fill={colors.text}
                textAnchor="end"
                alignmentBaseline="middle"
              >
                {tick}
              </SvgText>
            ))}

            {/* Eixo X */}
            <Line
              x1={0}
              y1={innerHeight}
              x2={innerWidth}
              y2={innerHeight}
              stroke={colors.border}
              strokeWidth={1}
            />

            {/* Labels do eixo X */}
            {labels.map((label, index) => {
              const x = xScale(index.toString()) || 0;
              return (
                <SvgText
                  key={`label-x-${index}`}
                  x={x}
                  y={innerHeight + 15}
                  fontSize={10}
                  fill={colors.text}
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
              );
            })}
          </G>
        </Svg>
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
