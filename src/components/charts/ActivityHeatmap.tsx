import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import type { Theme } from "../../theme";

export interface ActivityData {
  date: string; // YYYY-MM-DD
  count: number; // Número de atividades no dia
}

interface ActivityHeatmapProps {
  data: ActivityData[];
  months?: number; // Quantos meses mostrar (padrão: 6)
}

/**
 * ActivityHeatmap Component
 *
 * Heatmap estilo GitHub mostrando atividades do paciente
 * - Cada célula = 1 dia
 * - Cor baseada na intensidade de atividade
 * - Layout: semanas × dias da semana (7 linhas)
 */
export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  data,
  months = 6,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Configurações do heatmap
  const cellSize = 14;
  const cellGap = 3;
  const cellFullSize = cellSize + cellGap;
  const monthLabelHeight = 20;
  const dayLabelWidth = 25;

  // Calcular data inicial (months meses atrás)
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1); // Começar do dia 1

  // Gerar todas as datas do período
  const generateDates = () => {
    const dates: Date[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const allDates = generateDates();

  // Criar mapa de atividades por data
  const activityMap = new Map<string, number>();
  data.forEach((activity) => {
    activityMap.set(activity.date, activity.count);
  });

  // Encontrar valor máximo para normalização
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  // Função para obter cor baseada na contagem
  const getColor = (count: number) => {
    if (count === 0) return theme.colors.border;
    const intensity = count / maxCount;
    if (intensity >= 0.75) return theme.colors.success;
    if (intensity >= 0.5) return theme.colors.primary;
    if (intensity >= 0.25) return theme.colors.warning;
    return theme.colors.info;
  };

  // Agrupar datas por semana e mês
  interface WeekData {
    days: (Date | null)[];
  }

  const weeks: WeekData[] = [];
  let currentWeek: (Date | null)[] = [];

  // Preencher dias vazios no início da primeira semana
  const firstDayOfWeek = allDates[0].getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null);
  }

  allDates.forEach((date) => {
    currentWeek.push(date);
    if (currentWeek.length === 7) {
      weeks.push({ days: [...currentWeek] });
      currentWeek = [];
    }
  });

  // Adicionar última semana se incompleta
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push({ days: [...currentWeek] });
  }

  // Agrupar semanas por mês para labels
  interface MonthLabel {
    month: string;
    weekIndex: number;
  }

  const monthLabels: MonthLabel[] = [];
  let lastMonth = -1;

  weeks.forEach((week, index) => {
    const firstDayOfWeek = week.days.find((d) => d !== null);
    if (firstDayOfWeek) {
      const month = firstDayOfWeek.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({
          month: firstDayOfWeek.toLocaleDateString("pt-BR", {
            month: "short",
          }),
          weekIndex: index,
        });
        lastMonth = month;
      }
    }
  });

  // Calcular dimensões
  const svgWidth = dayLabelWidth + weeks.length * cellFullSize;
  const svgHeight = monthLabelHeight + 7 * cellFullSize;

  // Dados do dia selecionado
  const selectedActivity = selectedDate
    ? activityMap.get(selectedDate) || 0
    : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Atividades</Text>
        <Text style={styles.subtitle}>Últimos {months} meses</Text>
      </View>

      {/* Selected Date Info */}
      {selectedDate && (
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedDate}>
            {new Date(selectedDate).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </Text>
          <Text style={styles.selectedCount}>
            {selectedActivity === 0
              ? "Nenhuma atividade"
              : selectedActivity === 1
              ? "1 atividade"
              : `${selectedActivity} atividades`}
          </Text>
        </View>
      )}

      {/* Heatmap */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={svgWidth} height={svgHeight}>
          {/* Month Labels */}
          {monthLabels.map((label) => (
            <SvgText
              key={`month-${label.weekIndex}`}
              x={dayLabelWidth + label.weekIndex * cellFullSize}
              y={15}
              fontSize={12}
              fill={theme.colors.textSecondary}
              fontFamily={theme.typography.fontFamily.medium}
            >
              {label.month}
            </SvgText>
          ))}

          {/* Day Labels */}
          {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => (
            <SvgText
              key={`day-${index}`}
              x={12}
              y={monthLabelHeight + index * cellFullSize + cellSize / 2 + 4}
              fontSize={10}
              fill={theme.colors.textSecondary}
              fontFamily={theme.typography.fontFamily.medium}
              textAnchor="middle"
            >
              {day}
            </SvgText>
          ))}

          {/* Cells */}
          {weeks.map((week, weekIndex) =>
            week.days.map((date, dayIndex) => {
              if (!date) return null;

              const dateStr = date.toISOString().split("T")[0];
              const count = activityMap.get(dateStr) || 0;
              const color = getColor(count);
              const x = dayLabelWidth + weekIndex * cellFullSize;
              const y = monthLabelHeight + dayIndex * cellFullSize;

              return (
                <Rect
                  key={`cell-${weekIndex}-${dayIndex}`}
                  x={x}
                  y={y}
                  width={cellSize}
                  height={cellSize}
                  fill={color}
                  rx={2}
                  onPress={() => setSelectedDate(dateStr)}
                />
              );
            })
          )}
        </Svg>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>Menos</Text>
        <View style={styles.legendColors}>
          <View
            style={[
              styles.legendCell,
              { backgroundColor: theme.colors.border },
            ]}
          />
          <View
            style={[styles.legendCell, { backgroundColor: theme.colors.info }]}
          />
          <View
            style={[
              styles.legendCell,
              { backgroundColor: theme.colors.warning },
            ]}
          />
          <View
            style={[
              styles.legendCell,
              { backgroundColor: theme.colors.primary },
            ]}
          />
          <View
            style={[
              styles.legendCell,
              { backgroundColor: theme.colors.success },
            ]}
          />
        </View>
        <Text style={styles.legendLabel}>Mais</Text>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data.length}</Text>
          <Text style={styles.statLabel}>Dias ativos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {data.reduce((sum, d) => sum + d.count, 0)}
          </Text>
          <Text style={styles.statLabel}>Total atividades</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {data.length > 0
              ? Math.round(
                  data.reduce((sum, d) => sum + d.count, 0) / data.length
                )
              : 0}
          </Text>
          <Text style={styles.statLabel}>Média/dia</Text>
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      ...theme.shadows.md,
      marginBottom: theme.spacing.lg,
    },
    header: {
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    selectedInfo: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    selectedDate: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.semibold,
      color: theme.colors.text,
    },
    selectedCount: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    legend: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    legendLabel: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textSecondary,
    },
    legendColors: {
      flexDirection: "row",
      gap: theme.spacing.xs,
    },
    legendCell: {
      width: 14,
      height: 14,
      borderRadius: 2,
    },
    statsContainer: {
      flexDirection: "row",
      gap: theme.spacing.md,
      marginTop: theme.spacing.xl,
      paddingTop: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    statCard: {
      flex: 1,
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    statValue: {
      fontSize: theme.typography.fontSize["2xl"],
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
  });
