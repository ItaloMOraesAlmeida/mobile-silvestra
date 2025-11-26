/**
 * MetricCard Component
 *
 * Card que exibe uma métrica de evolução com:
 * - Valor atual destacado
 * - Mudança absoluta e percentual
 * - Indicador de tendência (↑ ↓ →)
 * - Valor inicial de comparação
 * - Estados: normal, loading, error
 *
 * Usado para: Peso, IMC, Gordura Corporal, Massa Magra, etc.
 */

import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";

type TrendType = "up" | "down" | "stable";
type CardSize = "small" | "medium" | "large";

export interface MetricCardProps {
  // Dados da métrica
  label: string;
  value: number;
  unit: string;
  initialValue?: number | null;
  change?: number | null;
  changePercent?: number | null;
  trend?: TrendType;

  // Customização visual
  size?: CardSize;
  icon?: keyof typeof Ionicons.glyphMap;
  accentColor?: string;

  // Estados
  loading?: boolean;
  error?: string | null;

  // Formatação
  decimals?: number;
  formatValue?: (value: number) => string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  initialValue,
  change,
  changePercent,
  trend = "stable",
  size = "medium",
  icon,
  accentColor,
  loading = false,
  error = null,
  decimals = 1,
  formatValue,
}) => {
  const styles = createStyles(lightTheme, size, accentColor);

  // Formatação do valor
  const formattedValue = formatValue
    ? formatValue(value)
    : value.toFixed(decimals);

  // Determinar cor da tendência
  const getTrendColor = () => {
    if (trend === "up") return lightTheme.colors.success;
    if (trend === "down") return lightTheme.colors.error;
    return lightTheme.colors.textSecondary;
  };

  // Ícone da tendência
  const getTrendIcon = () => {
    if (trend === "up") return "trending-up";
    if (trend === "down") return "trending-down";
    return "remove";
  };

  // Estado de loading
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={lightTheme.colors.primary} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </View>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons
          name="alert-circle"
          size={32}
          color={lightTheme.colors.error}
        />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header com label e ícone */}
      <View style={styles.header}>
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons
              name={icon}
              size={size === "small" ? 16 : size === "medium" ? 20 : 24}
              color={accentColor || lightTheme.colors.primary}
            />
          </View>
        )}
        <Text style={styles.label}>{label}</Text>
      </View>

      {/* Valor principal */}
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{formattedValue}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>

      {/* Informações de mudança */}
      {(change !== null && change !== undefined) ||
      (changePercent !== null && changePercent !== undefined) ? (
        <View style={styles.changeContainer}>
          {/* Ícone de tendência */}
          <Ionicons
            name={getTrendIcon()}
            size={16}
            color={getTrendColor()}
            style={styles.trendIcon}
          />

          {/* Mudança absoluta */}
          {change !== null && change !== undefined && (
            <Text style={[styles.changeText, { color: getTrendColor() }]}>
              {change > 0 ? "+" : ""}
              {change.toFixed(decimals)} {unit}
            </Text>
          )}

          {/* Mudança percentual */}
          {changePercent !== null && changePercent !== undefined && (
            <Text style={[styles.changePercent, { color: getTrendColor() }]}>
              ({changePercent > 0 ? "+" : ""}
              {changePercent.toFixed(1)}%)
            </Text>
          )}
        </View>
      ) : null}

      {/* Valor inicial (se disponível) */}
      {initialValue !== null && initialValue !== undefined && (
        <View style={styles.initialContainer}>
          <Text style={styles.initialLabel}>Inicial: </Text>
          <Text style={styles.initialValue}>
            {initialValue.toFixed(decimals)} {unit}
          </Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (
  theme: typeof lightTheme,
  size: CardSize,
  accentColor?: string
) => {
  // Tamanhos baseados no size
  const padding = size === "small" ? 12 : size === "medium" ? 16 : 20;

  const valueFontSize = size === "small" ? 24 : size === "medium" ? 32 : 40;

  const labelFontSize = size === "small" ? 12 : size === "medium" ? 14 : 16;

  return StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding,
      minHeight: size === "small" ? 100 : size === "medium" ? 130 : 160,
      justifyContent: "space-between",
      // Sombra sutil
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },

    iconContainer: {
      width: size === "small" ? 28 : size === "medium" ? 32 : 36,
      height: size === "small" ? 28 : size === "medium" ? 32 : 36,
      borderRadius: size === "small" ? 14 : size === "medium" ? 16 : 18,
      backgroundColor: accentColor
        ? `${accentColor}20`
        : `${theme.colors.primary}20`,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
    },

    label: {
      fontSize: labelFontSize,
      fontWeight: "600",
      color: theme.colors.textSecondary,
      flex: 1,
    },

    valueContainer: {
      flexDirection: "row",
      alignItems: "baseline",
      marginVertical: 4,
    },

    value: {
      fontSize: valueFontSize,
      fontWeight: "700",
      color: theme.colors.text,
      letterSpacing: -0.5,
    },

    unit: {
      fontSize: labelFontSize,
      fontWeight: "500",
      color: theme.colors.textSecondary,
      marginLeft: 4,
    },

    changeContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
    },

    trendIcon: {
      marginRight: 4,
    },

    changeText: {
      fontSize: size === "small" ? 12 : 14,
      fontWeight: "600",
      marginRight: 4,
    },

    changePercent: {
      fontSize: size === "small" ? 11 : 13,
      fontWeight: "500",
    },

    initialContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },

    initialLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },

    initialValue: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.text,
    },

    // Estados especiais
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 130,
    },

    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },

    errorContainer: {
      justifyContent: "center",
      alignItems: "center",
      minHeight: 130,
      borderWidth: 1,
      borderColor: theme.colors.error,
      backgroundColor: `${theme.colors.error}10`,
    },

    errorText: {
      marginTop: 8,
      fontSize: 14,
      color: theme.colors.error,
      textAlign: "center",
    },
  });
};
