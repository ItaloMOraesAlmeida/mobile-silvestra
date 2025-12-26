/**
 * GoalsProgressSection - Seção com barras de progresso de metas por tipo
 */

import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";
import { GoalsProgress } from "../../types/dashboard";

interface GoalsProgressSectionProps {
  data: GoalsProgress;
}

export default function GoalsProgressSection({
  data,
}: GoalsProgressSectionProps) {
  const colors = lightTheme.colors;

  // Calcular totais a partir dos dados
  const totalGoals = data.byType.reduce((sum, item) => sum + item.total, 0);
  const completedGoals = data.byType.reduce(
    (sum, item) => sum + item.completed,
    0
  );
  const overallProgress =
    totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case "WEIGHT":
        return {
          name: "scale-outline" as const,
          color: "#EF4444",
          label: "Peso",
        };
      case "WAIST_CIRC":
        return {
          name: "body-outline" as const,
          color: "#F59E0B",
          label: "Circunferência",
        };
      case "BODY_FAT":
        return {
          name: "flame-outline" as const,
          color: "#EF4444",
          label: "Gordura Corporal",
        };
      case "MUSCLE_MASS":
        return {
          name: "barbell-outline" as const,
          color: "#10B981",
          label: "Massa Muscular",
        };
      case "OTHER":
        return {
          name: "flag-outline" as const,
          color: "#8B5CF6",
          label: "Outros",
        };
      default:
        return { name: "flag-outline" as const, color: "#6B7280", label: type };
    }
  };

  if (data.byType.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
        <Ionicons name="flag-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.text }]}>
          Nenhuma meta cadastrada
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
          Crie metas para seus pacientes e acompanhe o progresso aqui
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Progresso de Metas
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {totalGoals} metas • {completedGoals} concluídas
        </Text>
      </View>

      {/* Barra de progresso geral */}
      <View style={styles.overallProgress}>
        <View style={styles.overallHeader}>
          <Text style={[styles.overallLabel, { color: colors.text }]}>
            Progresso Geral
          </Text>
          <Text style={[styles.overallPercentage, { color: colors.primary }]}>
            {overallProgress}%
          </Text>
        </View>
        <View
          style={[
            styles.progressBarLarge,
            { backgroundColor: "rgba(0,0,0,0.1)" },
          ]}
        >
          <View
            style={[
              styles.progressFillLarge,
              {
                width: `${overallProgress}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* Metas por tipo */}
      <View style={styles.goalsTypesList}>
        {data.byType.map((goalType) => {
          const iconConfig = getGoalTypeIcon(goalType.type);
          const progress = goalType.percentage;

          return (
            <View key={goalType.type} style={styles.goalTypeItem}>
              {/* Header do tipo */}
              <View style={styles.goalTypeHeader}>
                <View style={styles.goalTypeLeft}>
                  <View
                    style={[
                      styles.goalTypeIcon,
                      { backgroundColor: `${iconConfig.color}15` },
                    ]}
                  >
                    <Ionicons
                      name={iconConfig.name}
                      size={20}
                      color={iconConfig.color}
                    />
                  </View>
                  <View>
                    <Text
                      style={[styles.goalTypeLabel, { color: colors.text }]}
                    >
                      {iconConfig.label}
                    </Text>
                    <Text
                      style={[
                        styles.goalTypeCount,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {goalType.completed} de {goalType.total} concluídas
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.goalTypePercentage,
                    { color: iconConfig.color },
                  ]}
                >
                  {progress}%
                </Text>
              </View>

              {/* Barra de progresso */}
              <View
                style={[
                  styles.progressBar,
                  { backgroundColor: "rgba(0,0,0,0.1)" },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress}%`,
                      backgroundColor: iconConfig.color,
                    },
                  ]}
                />
              </View>

              {/* Estatísticas adicionais */}
              <View style={styles.goalTypeStats}>
                <View style={styles.statBadge}>
                  <Ionicons name="trophy" size={12} color="#10B981" />
                  <Text
                    style={[styles.statText, { color: colors.textSecondary }]}
                  >
                    {goalType.completed} concluídas
                  </Text>
                </View>
                <View style={styles.statBadge}>
                  <Ionicons
                    name="flag"
                    size={12}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.statText, { color: colors.textSecondary }]}
                  >
                    {goalType.total - goalType.completed} restantes
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
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
  emptyContainer: {
    padding: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  overallProgress: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  overallHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  overallLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  overallPercentage: {
    fontSize: 24,
    fontWeight: "bold",
  },
  progressBarLarge: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFillLarge: {
    height: "100%",
    borderRadius: 6,
  },
  goalsTypesList: {
    gap: 16,
  },
  goalTypeItem: {
    gap: 8,
  },
  goalTypeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalTypeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  goalTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  goalTypeLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  goalTypeCount: {
    fontSize: 12,
  },
  goalTypePercentage: {
    fontSize: 18,
    fontWeight: "bold",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  goalTypeStats: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
});
