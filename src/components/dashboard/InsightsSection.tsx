/**
 * InsightsSection - Seção com insights e recomendações
 */

import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";
import { DashboardInsights } from "../../types/dashboard";

interface InsightsSectionProps {
  data: DashboardInsights;
}

export default function InsightsSection({ data }: InsightsSectionProps) {
  const colors = lightTheme.colors;

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "success":
        return { name: "checkmark-circle" as const, color: "#10B981" };
      case "warning":
        return { name: "alert-circle" as const, color: "#F59E0B" };
      case "info":
        return { name: "information-circle" as const, color: "#3B82F6" };
      case "action":
        return { name: "flash" as const, color: "#8B5CF6" };
      default:
        return { name: "bulb" as const, color: "#6B7280" };
    }
  };

  const getInsightBackground = (type: string) => {
    switch (type) {
      case "success":
        return "#D1FAE5";
      case "warning":
        return "#FEF3C7";
      case "info":
        return "#DBEAFE";
      case "action":
        return "#EDE9FE";
      default:
        return "rgba(0,0,0,0.05)";
    }
  };

  if (data.insights.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
        <Ionicons name="bulb-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.text }]}>
          Nenhum insight disponível
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
          Continue trabalhando para gerar novas recomendações
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Insights & Recomendações
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Baseado nos últimos 30 dias
        </Text>
      </View>

      {/* Lista de insights */}
      <View style={styles.insightsList}>
        {data.insights.map((insight, index) => {
          const iconConfig = getInsightIcon(insight.type);
          const background = getInsightBackground(insight.type);

          return (
            <View
              key={index}
              style={[
                styles.insightCard,
                {
                  backgroundColor: colors.card,
                },
              ]}
            >
              {/* Ícone e tipo */}
              <View style={styles.insightHeader}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: background },
                  ]}
                >
                  <Ionicons
                    name={iconConfig.name}
                    size={24}
                    color={iconConfig.color}
                  />
                </View>
                <View style={styles.insightHeaderText}>
                  <Text
                    style={[
                      styles.insightType,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {insight.type === "success" && "Sucesso"}
                    {insight.type === "warning" && "Atenção"}
                    {insight.type === "info" && "Informação"}
                  </Text>
                </View>
              </View>

              {/* Mensagem */}
              <Text style={[styles.insightMessage, { color: colors.text }]}>
                {insight.message}
              </Text>

              {/* Ação */}
              {insight.action && (
                <View style={styles.actionContainer}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.actionText, { color: colors.textSecondary }]}
                  >
                    {insight.action}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Rodapé com informação */}
      <View style={[styles.footer, { backgroundColor: colors.card }]}>
        <Ionicons name="sparkles" size={16} color={colors.primary} />
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Insights gerados automaticamente com base no desempenho dos seus
          pacientes
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
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
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  insightsList: {
    gap: 12,
  },
  insightCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  insightHeaderText: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  insightType: {
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  insightMessage: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  actionText: {
    flex: 1,
    fontSize: 13,
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});
