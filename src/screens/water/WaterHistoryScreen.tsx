import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

import { getWaterHistory } from "../../services/water/waterService";
import { HistoryItem } from "../../types/water";
import { lightTheme } from "../../theme";

const { width } = Dimensions.get("window");

type TimeRange = "7days" | "30days" | "90days";

export default function WaterHistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<TimeRange>("7days");

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRange]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const days =
        selectedRange === "7days" ? 7 : selectedRange === "30days" ? 30 : 90;
      const endDate = endOfDay(new Date());
      const startDate = startOfDay(subDays(endDate, days - 1));

      const data = await getWaterHistory(
        startDate.toISOString(),
        endDate.toISOString()
      );

      setHistory(data);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (history.length === 0) {
      return {
        totalConsumed: 0,
        avgConsumed: 0,
        daysAchieved: 0,
        percentAchieved: 0,
        bestDay: null as HistoryItem | null,
      };
    }

    const totalConsumed = history.reduce((sum, day) => sum + day.consumed, 0);
    const avgConsumed = Math.round(totalConsumed / history.length);
    const daysAchieved = history.filter((day) => day.achieved).length;
    const percentAchieved = Math.round((daysAchieved / history.length) * 100);
    const bestDay = history.reduce((best, day) =>
      day.consumed > best.consumed ? day : best
    );

    return {
      totalConsumed,
      avgConsumed,
      daysAchieved,
      percentAchieved,
      bestDay,
    };
  };

  const stats = calculateStats();

  const renderTimeRangeSelector = () => (
    <View style={styles.rangeSelector}>
      {(["7days", "30days", "90days"] as TimeRange[]).map((range) => {
        const label =
          range === "7days"
            ? "7 dias"
            : range === "30days"
            ? "30 dias"
            : "90 dias";
        const isSelected = selectedRange === range;

        return (
          <TouchableOpacity
            key={range}
            onPress={() => setSelectedRange(range)}
            style={[
              styles.rangeButton,
              isSelected && { backgroundColor: lightTheme.colors.primary },
              !isSelected && { backgroundColor: lightTheme.colors.card },
            ]}
          >
            <Text
              style={[
                styles.rangeButtonText,
                { color: isSelected ? "#FFFFFF" : lightTheme.colors.text },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      {/* Total Consumido */}
      <View
        style={[styles.statCard, { backgroundColor: lightTheme.colors.card }]}
      >
        <Ionicons name="water" size={24} color={lightTheme.colors.primary} />
        <Text style={[styles.statValue, { color: lightTheme.colors.text }]}>
          {stats.totalConsumed.toLocaleString("pt-BR")}ml
        </Text>
        <Text
          style={[styles.statLabel, { color: lightTheme.colors.textSecondary }]}
        >
          Total consumido
        </Text>
      </View>

      {/* Média Diária */}
      <View
        style={[styles.statCard, { backgroundColor: lightTheme.colors.card }]}
      >
        <Ionicons
          name="trending-up"
          size={24}
          color={lightTheme.colors.primary}
        />
        <Text style={[styles.statValue, { color: lightTheme.colors.text }]}>
          {stats.avgConsumed.toLocaleString("pt-BR")}ml
        </Text>
        <Text
          style={[styles.statLabel, { color: lightTheme.colors.textSecondary }]}
        >
          Média diária
        </Text>
      </View>

      {/* Dias com Meta */}
      <View
        style={[styles.statCard, { backgroundColor: lightTheme.colors.card }]}
      >
        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        <Text style={[styles.statValue, { color: lightTheme.colors.text }]}>
          {stats.daysAchieved}/{history.length}
        </Text>
        <Text
          style={[styles.statLabel, { color: lightTheme.colors.textSecondary }]}
        >
          Dias com meta
        </Text>
      </View>

      {/* Taxa de Sucesso */}
      <View
        style={[styles.statCard, { backgroundColor: lightTheme.colors.card }]}
      >
        <Ionicons name="trophy" size={24} color="#FFB300" />
        <Text style={[styles.statValue, { color: lightTheme.colors.text }]}>
          {stats.percentAchieved}%
        </Text>
        <Text
          style={[styles.statLabel, { color: lightTheme.colors.textSecondary }]}
        >
          Taxa de sucesso
        </Text>
      </View>
    </View>
  );

  const renderHistoryList = () => (
    <View style={styles.historySection}>
      <Text style={[styles.sectionTitle, { color: lightTheme.colors.text }]}>
        Histórico Detalhado
      </Text>

      {history.map((day) => {
        const date = new Date(day.date);
        const isToday =
          format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

        return (
          <View
            key={day.date}
            style={[
              styles.historyItem,
              { backgroundColor: lightTheme.colors.card },
            ]}
          >
            <View style={styles.historyItemLeft}>
              <Text
                style={[styles.historyDate, { color: lightTheme.colors.text }]}
              >
                {isToday
                  ? "Hoje"
                  : format(date, "EEE, dd 'de' MMM", { locale: ptBR })}
              </Text>
              <View style={styles.historyProgress}>
                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: lightTheme.colors.background },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, day.percent)}%`,
                        backgroundColor: day.achieved
                          ? "#4CAF50"
                          : lightTheme.colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.progressText,
                    { color: lightTheme.colors.textSecondary },
                  ]}
                >
                  {Math.round(day.percent)}%
                </Text>
              </View>
            </View>

            <View style={styles.historyItemRight}>
              {day.achieved && (
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              )}
              <Text
                style={[
                  styles.historyAmount,
                  { color: lightTheme.colors.text },
                ]}
              >
                {day.consumed.toLocaleString("pt-BR")}ml
              </Text>
              <Text
                style={[
                  styles.historyGoal,
                  { color: lightTheme.colors.textSecondary },
                ]}
              >
                de {day.goal.toLocaleString("pt-BR")}ml
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={lightTheme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Time Range Selector */}
        {renderTimeRangeSelector()}

        {/* Stats Cards */}
        {renderStats()}

        {/* Best Day Highlight */}
        {stats.bestDay && (
          <View style={styles.bestDayCard}>
            <View style={styles.bestDayIcon}>
              <Ionicons name="trophy" size={32} color={lightTheme.colors.warning} />
            </View>
            <View style={styles.bestDayInfo}>
              <Text style={styles.bestDayLabel}>Melhor Dia</Text>
              <Text style={styles.bestDayDate}>
                {format(new Date(stats.bestDay.date), "dd 'de' MMMM", {
                  locale: ptBR,
                })}
              </Text>
              <Text style={styles.bestDayAmount}>
                {stats.bestDay.consumed.toLocaleString("pt-BR")}ml
              </Text>
            </View>
          </View>
        )}

        {/* History List */}
        {history.length > 0 ? (
          renderHistoryList()
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="water-outline"
              size={64}
              color={lightTheme.colors.gray[300]}
            />
            <Text style={styles.emptyText}>Nenhum registro encontrado</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 20,
  },
  rangeSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  rangeButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: lightTheme.colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: lightTheme.colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: lightTheme.colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  bestDayCard: {
    backgroundColor: lightTheme.colors.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
  },
  bestDayIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${lightTheme.colors.warning}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  bestDayInfo: {
    flex: 1,
  },
  bestDayLabel: {
    fontSize: 12,
    color: lightTheme.colors.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  bestDayDate: {
    fontSize: 14,
    color: lightTheme.colors.text,
    marginBottom: 4,
    textTransform: "capitalize",
  },
  bestDayAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: lightTheme.colors.primary,
  },
  historySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: lightTheme.colors.text,
    marginBottom: 16,
  },
  historyItem: {
    backgroundColor: lightTheme.colors.card,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
  },
  historyItemLeft: {
    flex: 1,
    marginRight: 16,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: "600",
    color: lightTheme.colors.text,
    marginBottom: 8,
    textTransform: "capitalize",
  },
  historyProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: lightTheme.colors.background,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: lightTheme.colors.textSecondary,
    width: 40,
    fontWeight: "500",
  },
  historyItemRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: lightTheme.colors.text,
  },
  historyGoal: {
    fontSize: 11,
    color: lightTheme.colors.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: lightTheme.colors.textSecondary,
    marginTop: 16,
  },
});
