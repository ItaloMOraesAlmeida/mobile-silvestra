import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles, useTheme } from "../hooks/useTheme";
import type { Theme } from "../theme";

/**
 * Interface para Paciente Prioritário
 */
interface PriorityPatient {
  id: string;
  name: string;
  reason: string;
  urgency: "high" | "medium" | "low";
  lastContact?: Date;
  avatar?: string;
}

interface PriorityPatientCardProps {
  patient: PriorityPatient;
  onPress?: () => void;
}

/**
 * Card de Paciente Prioritário
 *
 * Exibe pacientes que precisam de atenção com indicador de urgência
 */
export const PriorityPatientCard: React.FC<PriorityPatientCardProps> = ({
  patient,
  onPress,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();

  const urgencyConfig = {
    high: {
      color: theme.colors.error,
      icon: "alert-circle" as keyof typeof Ionicons.glyphMap,
      label: "Alta",
    },
    medium: {
      color: theme.colors.warning,
      icon: "warning" as keyof typeof Ionicons.glyphMap,
      label: "Média",
    },
    low: {
      color: theme.colors.info,
      icon: "information-circle" as keyof typeof Ionicons.glyphMap,
      label: "Baixa",
    },
  };

  const config = urgencyConfig[patient.urgency];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar & Name */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          {patient.avatar ? (
            // TODO: Adicionar Image component
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {patient.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {patient.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{patient.name}</Text>
          <View style={styles.urgencyBadge}>
            <Ionicons name={config.icon} size={14} color={config.color} />
            <Text style={[styles.urgencyText, { color: config.color }]}>
              {config.label} Prioridade
            </Text>
          </View>
        </View>
      </View>

      {/* Reason */}
      <View style={[styles.reasonContainer, { borderLeftColor: config.color }]}>
        <Ionicons
          name="alert-circle-outline"
          size={16}
          color={theme.colors.textSecondary}
        />
        <Text style={styles.reasonText}>{patient.reason}</Text>
      </View>

      {/* Last Contact (if available) */}
      {patient.lastContact && (
        <View style={styles.footer}>
          <Ionicons
            name="time-outline"
            size={14}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.lastContactText}>
            Último contato:{" "}
            {new Date(patient.lastContact).toLocaleDateString("pt-BR")}
          </Text>
        </View>
      )}

      {/* Arrow Icon */}
      <View style={styles.arrow}>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.textSecondary}
        />
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
      marginBottom: theme.spacing.sm,
      position: "relative",
      ...theme.shadows.sm,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: theme.spacing.md,
    },
    avatar: {
      marginRight: theme.spacing.md,
    },
    avatarPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary + "20",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.primary,
    },
    info: {
      flex: 1,
    },
    name: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    urgencyBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    urgencyText: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    reasonContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.spacing.sm,
      paddingLeft: theme.spacing.md,
      borderLeftWidth: 3,
      marginBottom: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    reasonText: {
      flex: 1,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
    },
    lastContactText: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
    },
    arrow: {
      position: "absolute",
      top: theme.spacing.md,
      right: theme.spacing.md,
    },
  });
