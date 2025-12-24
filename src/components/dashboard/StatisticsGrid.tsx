/**
 * StatisticsGrid - Grid com 8 estatísticas principais
 */

import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";
import { DashboardStatistics } from "../../types/dashboard";

interface StatisticsGridProps {
  data: DashboardStatistics;
}

export default function StatisticsGrid({ data }: StatisticsGridProps) {
  const colors = lightTheme.colors;

  const statistics = [
    {
      id: "activeGoals",
      icon: "flag" as const,
      label: "Metas Ativas",
      value: data.activeGoals,
      color: "#8B5CF6",
    },
    {
      id: "completedGoals",
      icon: "checkmark-circle" as const,
      label: "Metas Concluídas",
      value: data.completedGoals ?? 0,
      color: "#10B981",
    },
    {
      id: "activePlans",
      icon: "document-text" as const,
      label: "Planos Ativos",
      value: data.activePlans,
      color: "#3B82F6",
    },
    {
      id: "totalAppointments",
      icon: "calendar" as const,
      label: "Consultas do Mês",
      value: data.totalAppointments ?? 0,
      color: "#F59E0B",
    },
    {
      id: "completedAppointments",
      icon: "checkmark-done" as const,
      label: "Consultas Realizadas",
      value: data.completedAppointments ?? 0,
      color: "#059669",
    },
    {
      id: "weeklyCheckIns",
      icon: "pulse" as const,
      label: "Check-ins Semanais",
      value: data.weeklyCheckIns ?? 0,
      color: "#EC4899",
    },
    {
      id: "successRate",
      icon: "trending-up" as const,
      label: "Taxa de Sucesso",
      value: `${data.successRate}%`,
      color: "#10B981",
    },
    {
      id: "averageRating",
      icon: "star" as const,
      label: "Avaliação Média",
      value: data.averageRating.toFixed(1),
      suffix: "⭐",
      color: "#F59E0B",
    },
  ];

  return (
    <View style={styles.container}>
      {statistics.map((stat) => (
        <View
          key={stat.id}
          style={[styles.statCard, { backgroundColor: colors.card }]}
        >
          {/* Ícone */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${stat.color}15` },
            ]}
          >
            <Ionicons name={stat.icon} size={24} color={stat.color} />
          </View>

          {/* Valor */}
          <Text style={[styles.value, { color: colors.text }]}>
            {stat.value}
            {stat.suffix && <Text style={styles.suffix}> {stat.suffix}</Text>}
          </Text>

          {/* Label */}
          <Text
            style={[styles.label, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  value: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  suffix: {
    fontSize: 20,
  },
  label: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
});
