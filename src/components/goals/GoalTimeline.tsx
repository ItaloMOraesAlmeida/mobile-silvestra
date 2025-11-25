import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import type { Theme } from "../../theme";

export interface GoalHistoryItem {
  id: string;
  date: Date;
  type: "created" | "updated" | "achieved" | "deadline_extended";
  previousValue?: number;
  newValue?: number;
  unit?: string;
  updatedBy?: "nutritionist" | "patient";
  updatedByName?: string;
  notes?: string;
}

interface GoalTimelineProps {
  history: GoalHistoryItem[];
  maxHeight?: number;
}

/**
 * Timeline de histórico de uma meta
 * Mostra todas as mudanças e atualizações ao longo do tempo
 */
export const GoalTimeline: React.FC<GoalTimelineProps> = ({
  history,
  maxHeight = 400,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEventIcon = (
    type: GoalHistoryItem["type"]
  ): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case "created":
        return "add-circle";
      case "updated":
        return "refresh-circle";
      case "achieved":
        return "checkmark-circle";
      case "deadline_extended":
        return "time";
      default:
        return "ellipse";
    }
  };

  const getEventColor = (type: GoalHistoryItem["type"]): string => {
    switch (type) {
      case "created":
        return theme.colors.info;
      case "updated":
        return theme.colors.primary;
      case "achieved":
        return theme.colors.success;
      case "deadline_extended":
        return theme.colors.warning;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getEventTitle = (item: GoalHistoryItem): string => {
    switch (item.type) {
      case "created":
        return "Meta Criada";
      case "updated":
        return "Progresso Atualizado";
      case "achieved":
        return "Meta Alcançada! 🎉";
      case "deadline_extended":
        return "Prazo Estendido";
      default:
        return "Atualização";
    }
  };

  const getEventDescription = (item: GoalHistoryItem): string | null => {
    if (
      item.type === "updated" &&
      item.previousValue !== undefined &&
      item.newValue !== undefined
    ) {
      const diff = item.newValue - item.previousValue;
      const diffText = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
      return `${item.previousValue.toFixed(1)} → ${item.newValue.toFixed(1)} ${
        item.unit
      } (${diffText})`;
    }
    if (item.notes) {
      return item.notes;
    }
    return null;
  };

  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="time-outline"
          size={48}
          color={theme.colors.textSecondary}
        />
        <Text style={styles.emptyText}>Nenhuma atualização ainda</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { maxHeight }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {history.map((item, index) => {
        const isLast = index === history.length - 1;
        const icon = getEventIcon(item.type);
        const color = getEventColor(item.type);
        const title = getEventTitle(item);
        const description = getEventDescription(item);

        return (
          <View key={item.id} style={styles.timelineItem}>
            {/* Timeline Line */}
            {!isLast && <View style={styles.timelineLine} />}

            {/* Icon */}
            <View
              style={[styles.iconContainer, { backgroundColor: color + "20" }]}
            >
              <Ionicons name={icon} size={20} color={color} />
            </View>

            {/* Content */}
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
              </View>

              {description && (
                <Text style={styles.description}>{description}</Text>
              )}

              {item.updatedBy && item.updatedByName && (
                <View style={styles.footer}>
                  <Ionicons
                    name={
                      item.updatedBy === "nutritionist"
                        ? "person-circle"
                        : "person"
                    }
                    size={14}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={styles.updatedBy}>
                    {item.updatedBy === "nutritionist"
                      ? "Nutricionista"
                      : "Paciente"}
                    : {item.updatedByName}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: theme.spacing.md,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
    timelineItem: {
      flexDirection: "row",
      marginBottom: theme.spacing.lg,
      position: "relative",
    },
    timelineLine: {
      position: "absolute",
      left: 19,
      top: 40,
      bottom: -theme.spacing.lg,
      width: 2,
      backgroundColor: theme.colors.border,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.md,
      ...theme.shadows.sm,
    },
    content: {
      flex: 1,
      paddingBottom: theme.spacing.xs,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: theme.spacing.xs,
      gap: theme.spacing.sm,
    },
    title: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
    },
    date: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    description: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
      lineHeight: 20,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
    },
    updatedBy: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
  });
