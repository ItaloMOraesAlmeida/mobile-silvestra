/**
 * InsightCard Component
 *
 * Card para exibir insights inteligentes sobre a evolução do paciente.
 *
 * Tipos de insight:
 * - WARNING: Alertas (ex: peso estagnado, baixa adesão)
 * - SUCCESS: Conquistas (ex: meta atingida, progresso consistente)
 * - INFO: Informações gerais
 * - SUGGESTION: Sugestões de ação
 * - ACHIEVEMENT: Marcos importantes
 *
 * Features:
 * - Ícones e cores por tipo
 * - Severidade visual (1-5)
 * - Título e mensagem
 * - Ação opcional (botão)
 * - Animação sutil ao aparecer
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";

export type InsightType =
  | "WARNING"
  | "SUCCESS"
  | "INFO"
  | "SUGGESTION"
  | "ACHIEVEMENT";

export interface InsightCardProps {
  type: InsightType;
  title: string;
  message: string;
  severity?: number; // 1-5 (1 = baixa, 5 = crítica)
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  type,
  title,
  message,
  severity = 1,
  actionLabel,
  onAction,
  onDismiss,
}) => {
  const styles = createStyles(lightTheme, type, severity);

  // Configuração por tipo de insight
  const config = getInsightConfig(type, lightTheme);

  return (
    <View style={styles.container}>
      {/* Barra lateral de severidade */}
      <View style={styles.severityBar} />

      {/* Conteúdo */}
      <View style={styles.content}>
        {/* Header com ícone e título */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name={config.icon} size={20} color={config.color} />
          </View>
          <Text style={styles.title}>{title}</Text>

          {/* Botão de dismiss (se fornecido) */}
          {onDismiss && (
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={onDismiss}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={lightTheme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Mensagem */}
        <Text style={styles.message}>{message}</Text>

        {/* Ação (se fornecida) */}
        {actionLabel && onAction && (
          <TouchableOpacity style={styles.actionButton} onPress={onAction}>
            <Text style={styles.actionLabel}>{actionLabel}</Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={config.color}
              style={styles.actionIcon}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Configuração visual por tipo de insight
const getInsightConfig = (type: InsightType, theme: typeof lightTheme) => {
  switch (type) {
    case "WARNING":
      return {
        icon: "alert-circle" as keyof typeof Ionicons.glyphMap,
        color: theme.colors.warning,
        backgroundColor: `${theme.colors.warning}10`,
      };
    case "SUCCESS":
      return {
        icon: "checkmark-circle" as keyof typeof Ionicons.glyphMap,
        color: theme.colors.success,
        backgroundColor: `${theme.colors.success}10`,
      };
    case "INFO":
      return {
        icon: "information-circle" as keyof typeof Ionicons.glyphMap,
        color: theme.colors.info,
        backgroundColor: `${theme.colors.info}10`,
      };
    case "SUGGESTION":
      return {
        icon: "bulb" as keyof typeof Ionicons.glyphMap,
        color: theme.colors.accent,
        backgroundColor: `${theme.colors.accent}10`,
      };
    case "ACHIEVEMENT":
      return {
        icon: "trophy" as keyof typeof Ionicons.glyphMap,
        color: theme.colors.primary,
        backgroundColor: `${theme.colors.primary}10`,
      };
    default:
      return {
        icon: "information-circle" as keyof typeof Ionicons.glyphMap,
        color: theme.colors.textSecondary,
        backgroundColor: theme.colors.surface,
      };
  }
};

const createStyles = (
  theme: typeof lightTheme,
  type: InsightType,
  severity: number
) => {
  const config = getInsightConfig(type, theme);

  // Severidade afeta a opacidade da barra lateral
  const severityOpacity = Math.min(severity / 5, 1);

  return StyleSheet.create({
    container: {
      flexDirection: "row",
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      marginVertical: 6,
      overflow: "hidden",
      // Sombra
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },

    severityBar: {
      width: 4,
      backgroundColor: config.color,
      opacity: severityOpacity,
    },

    content: {
      flex: 1,
      padding: 16,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },

    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: config.backgroundColor,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },

    title: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
    },

    dismissButton: {
      padding: 4,
    },

    message: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textSecondary,
      marginLeft: 44, // Alinhado com o texto do título
    },

    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      marginTop: 12,
      marginLeft: 44,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      backgroundColor: config.backgroundColor,
    },

    actionLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: config.color,
    },

    actionIcon: {
      marginLeft: 6,
    },
  });
};
