import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles } from "../../hooks/useTheme";
import type { Theme } from "../../theme";
import type { BodyMeasurement } from "../../types/patient-details.types";

interface MeasurementCardProps {
  measurement: BodyMeasurement;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const MeasurementCard: React.FC<MeasurementCardProps> = ({
  measurement,
  onPress,
  onEdit,
  onDelete,
}) => {
  const styles = useThemedStyles(createStyles);

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateBMI = (weight: number, height: number) => {
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5)
      return { label: "Abaixo do peso", color: styles.bmiLow.color };
    if (bmi < 25)
      return { label: "Peso normal", color: styles.bmiNormal.color };
    if (bmi < 30)
      return { label: "Sobrepeso", color: styles.bmiOverweight.color };
    return { label: "Obesidade", color: styles.bmiObese.color };
  };

  const bmi = measurement.height
    ? parseFloat(calculateBMI(measurement.weight, measurement.height))
    : null;

  const bmiInfo = bmi ? getBMICategory(bmi) : null;

  const mainMetrics = [
    {
      label: "Peso",
      value: `${measurement.weight.toFixed(1)} kg`,
      icon: "scale-outline" as const,
    },
    {
      label: "Altura",
      value: measurement.height ? `${measurement.height.toFixed(0)} cm` : "-",
      icon: "resize-outline" as const,
    },
    {
      label: "IMC",
      value: bmi ? bmi.toFixed(1) : "-",
      icon: "fitness-outline" as const,
    },
  ];

  const additionalMetrics = [
    measurement.bodyFatPercent && {
      label: "% Gordura",
      value: `${measurement.bodyFatPercent.toFixed(1)}%`,
    },
    measurement.muscleMass && {
      label: "Massa Muscular",
      value: `${measurement.muscleMass.toFixed(1)} kg`,
    },
    measurement.waistCirc && {
      label: "Cintura",
      value: `${measurement.waistCirc.toFixed(1)} cm`,
    },
    measurement.hipCirc && {
      label: "Quadril",
      value: `${measurement.hipCirc.toFixed(1)} cm`,
    },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {/* Header com data */}
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={styles.dateIcon.color}
          />
          <Text style={styles.dateText}>
            {formatDate(measurement.createdAt)}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {bmiInfo && (
            <View
              style={[styles.bmiTag, { backgroundColor: bmiInfo.color + "20" }]}
            >
              <Text style={[styles.bmiTagText, { color: bmiInfo.color }]}>
                {bmiInfo.label}
              </Text>
            </View>
          )}

          {onEdit && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={styles.editIcon.color}
              />
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={styles.deleteIcon.color}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Métricas Principais */}
      <View style={styles.mainMetrics}>
        {mainMetrics.map((metric, index) => (
          <View key={index} style={styles.metricItem}>
            <View style={styles.metricIconContainer}>
              <Ionicons
                name={metric.icon}
                size={20}
                color={styles.metricIcon.color}
              />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={styles.metricValue}>{metric.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Métricas Adicionais */}
      {additionalMetrics.length > 0 && (
        <View style={styles.additionalMetrics}>
          <View style={styles.divider} />
          <View style={styles.additionalGrid}>
            {additionalMetrics.map((metric, index) => (
              <View key={index} style={styles.additionalItem}>
                <Text style={styles.additionalLabel}>{metric.label}</Text>
                <Text style={styles.additionalValue}>{metric.value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Notas (se houver) */}
      {measurement.notes && (
        <View style={styles.notesContainer}>
          <View style={styles.divider} />
          <View style={styles.notesContent}>
            <Ionicons
              name="document-text-outline"
              size={16}
              color={styles.notesIcon.color}
            />
            <Text style={styles.notesText} numberOfLines={2}>
              {measurement.notes}
            </Text>
          </View>
        </View>
      )}

      {/* Indicador de mais informações */}
      {onPress && (
        <View style={styles.moreIndicator}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={styles.moreIcon.color}
          />
        </View>
      )}
    </TouchableOpacity>
  );
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
    dateContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    editButton: {
      width: 32,
      height: 32,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.primaryBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    editIcon: {
      color: theme.colors.primary,
    },
    deleteButton: {
      width: 32,
      height: 32,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.error + "15",
      alignItems: "center",
      justifyContent: "center",
    },
    deleteIcon: {
      color: theme.colors.error,
    },
    dateIcon: {
      color: theme.colors.textSecondary,
    },
    dateText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    bmiTag: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.sm,
    },
    bmiTagText: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.medium,
    },
    bmiLow: {
      color: theme.colors.info,
    },
    bmiNormal: {
      color: theme.colors.success,
    },
    bmiOverweight: {
      color: theme.colors.warning,
    },
    bmiObese: {
      color: theme.colors.error,
    },
    mainMetrics: {
      flexDirection: "row",
      gap: theme.spacing.sm,
    },
    metricItem: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.sm,
    },
    metricIconContainer: {
      width: 36,
      height: 36,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.primaryBackground,
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.xs,
    },
    metricIcon: {
      color: theme.colors.primary,
    },
    metricContent: {
      flex: 1,
    },
    metricLabel: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    metricValue: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
    },
    additionalMetrics: {
      marginTop: theme.spacing.md,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginBottom: theme.spacing.md,
    },
    additionalGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.md,
    },
    additionalItem: {
      minWidth: "45%",
      flex: 1,
    },
    additionalLabel: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    additionalValue: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text,
    },
    notesContainer: {
      marginTop: theme.spacing.md,
    },
    notesContent: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    notesIcon: {
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    notesText: {
      flex: 1,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      lineHeight:
        theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
    },
    moreIndicator: {
      position: "absolute",
      right: theme.spacing.md,
      top: theme.spacing.md,
    },
    moreIcon: {
      color: theme.colors.textSecondary,
    },
  });
