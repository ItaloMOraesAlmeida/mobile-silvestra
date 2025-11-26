import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles } from "../../hooks/useTheme";
import type { Theme } from "../../theme";
import type {
  ActivityLevel,
  SleepQuality,
  StressLevel,
  AlcoholLevel,
} from "../../types/patient-details.types";

interface LifestyleCardProps {
  activityLevel?: ActivityLevel | null;
  sleepQuality?: SleepQuality | null;
  stressLevel?: StressLevel | null;
  smoker?: boolean | null;
  alcoholConsumption?: AlcoholLevel | null;
  onEdit?: () => void;
}

export const LifestyleCard: React.FC<LifestyleCardProps> = ({
  activityLevel,
  sleepQuality,
  stressLevel,
  smoker,
  alcoholConsumption,
  onEdit,
}) => {
  const styles = useThemedStyles(createStyles);

  const lifestyleItems = [
    {
      icon: "fitness" as const,
      label: "Nível de atividade",
      value: activityLevel
        ? getActivityLevelLabel(activityLevel)
        : "Não informado",
    },
    {
      icon: "moon" as const,
      label: "Qualidade do sono",
      value: sleepQuality
        ? getSleepQualityLabel(sleepQuality)
        : "Não informado",
    },
    {
      icon: "pulse" as const,
      label: "Nível de estresse",
      value: stressLevel ? getStressLevelLabel(stressLevel) : "Não informado",
    },
    {
      icon: "ban" as const,
      label: "Fumante",
      value:
        smoker === null || smoker === undefined
          ? "Não informado"
          : smoker
          ? "Sim"
          : "Não",
    },
    {
      icon: "beer" as const,
      label: "Consumo de álcool",
      value: alcoholConsumption
        ? getAlcoholLevelLabel(alcoholConsumption)
        : "Não informado",
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="heart" size={20} color={styles.iconColor.color} />
          </View>
          <Text style={styles.title}>Estilo de Vida</Text>
        </View>

        {onEdit && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={onEdit}
            activeOpacity={0.7}
          >
            <Ionicons
              name="pencil"
              size={18}
              color={styles.editIconColor.color}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {lifestyleItems.map((item, index) => (
          <View key={index} style={styles.item}>
            <View style={styles.itemLeft}>
              <Ionicons
                name={item.icon}
                size={18}
                color={styles.itemIconColor.color}
              />
              <Text style={styles.itemLabel}>{item.label}</Text>
            </View>
            <Text style={styles.itemValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Helper functions for labels
const getActivityLevelLabel = (level: ActivityLevel): string => {
  const labels: Record<ActivityLevel, string> = {
    SEDENTARY: "Sedentário",
    LIGHTLY_ACTIVE: "Levemente ativo",
    MODERATELY_ACTIVE: "Moderadamente ativo",
    VERY_ACTIVE: "Muito ativo",
    EXTREMELY_ACTIVE: "Extremamente ativo",
  };
  return labels[level];
};

const getSleepQualityLabel = (quality: SleepQuality): string => {
  const labels: Record<SleepQuality, string> = {
    POOR: "Ruim",
    FAIR: "Regular",
    GOOD: "Boa",
    EXCELLENT: "Excelente",
  };
  return labels[quality];
};

const getStressLevelLabel = (level: StressLevel): string => {
  const labels: Record<StressLevel, string> = {
    LOW: "Baixo",
    MODERATE: "Moderado",
    HIGH: "Alto",
  };
  return labels[level];
};

const getAlcoholLevelLabel = (level: AlcoholLevel): string => {
  const labels: Record<AlcoholLevel, string> = {
    NONE: "Não consome",
    OCCASIONAL: "Ocasional",
    MODERATE: "Moderado",
    FREQUENT: "Frequente",
  };
  return labels[level];
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.sm,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.md,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.sm,
    },
    iconColor: {
      color: theme.colors.primary,
    },
    title: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
    },
    editButton: {
      width: 32,
      height: 32,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    editIconColor: {
      color: theme.colors.primary,
    },
    content: {
      gap: theme.spacing.sm,
    },
    item: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: theme.spacing.xs,
    },
    itemLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    itemIconColor: {
      color: theme.colors.primary,
    },
    itemLabel: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.sm,
    },
    itemValue: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text,
    },
  });
