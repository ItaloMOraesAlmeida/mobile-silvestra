import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles, useTheme } from "../hooks/useTheme";
import type { Theme } from "../theme";

/**
 * Tipos de atividades na agenda
 */
export type AgendaActivityType =
  | "appointment" // Consulta agendada
  | "followup" // Follow-up/retorno
  | "evaluation" // Avaliação antropométrica
  | "meal_plan" // Entrega de plano alimentar
  | "goal_deadline"; // Prazo de meta

/**
 * Interface para Item da Agenda
 */
interface AgendaItem {
  id: string;
  type: AgendaActivityType;
  title: string;
  description: string;
  time: string; // Formato "HH:MM"
  patientId?: string;
  patientName?: string;
  status: "scheduled" | "completed" | "cancelled";
}

interface AgendaItemCardProps {
  item: AgendaItem;
  onPress?: () => void;
  onComplete?: () => void;
}

/**
 * Card de Item da Agenda
 *
 * Exibe atividades agendadas para o dia com horário e tipo de atividade
 */
export const AgendaItemCard: React.FC<AgendaItemCardProps> = ({
  item,
  onPress,
  onComplete,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();

  // Configurações por tipo de atividade
  const activityConfig = {
    appointment: {
      icon: "calendar" as const,
      color: theme.colors.primary,
      label: "Consulta",
    },
    followup: {
      icon: "reload-circle" as const,
      color: theme.colors.info,
      label: "Retorno",
    },
    evaluation: {
      icon: "body" as const,
      color: theme.colors.success,
      label: "Avaliação",
    },
    meal_plan: {
      icon: "restaurant" as const,
      color: theme.colors.warning,
      label: "Plano Alimentar",
    },
    goal_deadline: {
      icon: "flag" as const,
      color: theme.colors.error,
      label: "Prazo de Meta",
    },
  };

  const config = activityConfig[item.type];

  // Estilo baseado no status
  const getStatusStyle = () => {
    switch (item.status) {
      case "completed":
        return {
          opacity: 0.6,
          backgroundColor: theme.colors.success + "10",
        };
      case "cancelled":
        return {
          opacity: 0.5,
          backgroundColor: theme.colors.error + "10",
        };
      default:
        return {};
    }
  };

  const statusIcon = {
    scheduled: null,
    completed: "checkmark-circle" as const,
    cancelled: "close-circle" as const,
  };

  return (
    <TouchableOpacity
      style={[styles.card, getStatusStyle()]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={item.status !== "scheduled"}
    >
      {/* Horário */}
      <View style={styles.timeContainer}>
        <Text style={styles.time}>{item.time}</Text>
      </View>

      {/* Conteúdo */}
      <View style={styles.content}>
        {/* Cabeçalho: Ícone + Tipo */}
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: config.color + "20" },
            ]}
          >
            <Ionicons name={config.icon} size={20} color={config.color} />
          </View>
          <Text style={[styles.typeLabel, { color: config.color }]}>
            {config.label}
          </Text>
        </View>

        {/* Título */}
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>

        {/* Descrição */}
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Nome do Paciente */}
        {item.patientName && (
          <View style={styles.patientInfo}>
            <Ionicons
              name="person-outline"
              size={14}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.patientName}>{item.patientName}</Text>
          </View>
        )}
      </View>

      {/* Ações */}
      <View style={styles.actions}>
        {item.status === "scheduled" && onComplete && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.success + "20" },
            ]}
            onPress={(e) => {
              e.stopPropagation();
              onComplete();
            }}
          >
            <Ionicons name="checkmark" size={20} color={theme.colors.success} />
          </TouchableOpacity>
        )}

        {item.status !== "scheduled" && statusIcon[item.status] && (
          <Ionicons
            name={statusIcon[item.status]!}
            size={24}
            color={
              item.status === "completed"
                ? theme.colors.success
                : theme.colors.error
            }
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      flexDirection: "row",
      alignItems: "stretch",
      gap: theme.spacing.md,
      ...theme.shadows.sm,
    },
    timeContainer: {
      width: 60,
      alignItems: "center",
      justifyContent: "center",
      borderRightWidth: 2,
      borderRightColor: theme.colors.border,
      paddingRight: theme.spacing.md,
    },
    time: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.primary,
    },
    content: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: theme.borderRadius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    typeLabel: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.semibold,
      textTransform: "uppercase",
    },
    title: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
    },
    description: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    patientInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
    },
    patientName: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      fontWeight: theme.typography.fontWeight.medium,
    },
    actions: {
      justifyContent: "center",
      alignItems: "center",
    },
    actionButton: {
      width: 40,
      height: 40,
      borderRadius: theme.borderRadius.full,
      alignItems: "center",
      justifyContent: "center",
    },
  });
