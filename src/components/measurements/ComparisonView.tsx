import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import type { Theme } from "../../theme";
import type { BodyMeasurement } from "../../types/patient-details.types";

interface ComparisonViewProps {
  currentMeasurement: BodyMeasurement;
  previousMeasurement: BodyMeasurement | null;
  loading?: boolean;
}

interface ComparisonItem {
  label: string;
  current: number | null | undefined;
  previous: number | null | undefined;
  unit: string;
  icon: keyof typeof Ionicons.glyphMap;
}

/**
 * Calcula diferença entre valores
 */
const calculateDifference = (
  current: number | null | undefined,
  previous: number | null | undefined
) => {
  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined
  ) {
    return { diff: null, percent: null, direction: "equal" as const };
  }

  const diff = current - previous;
  const percent = previous !== 0 ? (diff / previous) * 100 : 0;

  return {
    diff,
    percent,
    direction:
      diff > 0
        ? ("up" as const)
        : diff < 0
        ? ("down" as const)
        : ("equal" as const),
  };
};

/**
 * Componente de comparação entre medições
 */
export const ComparisonView: React.FC<ComparisonViewProps> = ({
  currentMeasurement,
  previousMeasurement,
  loading = false,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();

  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    main: true,
    circumferences: false,
    skinfolds: false,
    composition: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatValue = (value: number | null | undefined, unit: string = "") => {
    if (value === null || value === undefined) return "—";
    return `${value.toFixed(1)} ${unit}`;
  };

  /**
   * Renderiza um item de comparação
   */
  const renderComparisonItem = (item: ComparisonItem) => {
    const { diff, percent, direction } = calculateDifference(
      item.current,
      item.previous
    );

    const hasComparison = item.current !== null && item.previous !== null;

    return (
      <View key={item.label} style={styles.comparisonItem}>
        <View style={styles.comparisonItemHeader}>
          <View style={styles.comparisonItemTitle}>
            <Ionicons
              name={item.icon}
              size={18}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.comparisonItemLabel}>{item.label}</Text>
          </View>
        </View>

        <View style={styles.comparisonItemValues}>
          {/* Valor Anterior */}
          <View style={styles.valueBox}>
            <Text style={styles.valueLabel}>Anterior</Text>
            <Text style={styles.valuePrevious}>
              {formatValue(item.previous, item.unit)}
            </Text>
          </View>

          {/* Seta */}
          {hasComparison && (
            <View style={styles.arrowContainer}>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={theme.colors.textSecondary}
              />
            </View>
          )}

          {/* Valor Atual */}
          <View style={styles.valueBox}>
            <Text style={styles.valueLabel}>Atual</Text>
            <Text style={styles.valueCurrent}>
              {formatValue(item.current, item.unit)}
            </Text>
          </View>
        </View>

        {/* Diferença */}
        {hasComparison && diff !== null && (
          <View style={styles.differenceContainer}>
            <View
              style={[
                styles.differenceBadge,
                direction === "up" && styles.differenceBadgeUp,
                direction === "down" && styles.differenceBadgeDown,
                direction === "equal" && styles.differenceBadgeEqual,
              ]}
            >
              {direction !== "equal" && (
                <Ionicons
                  name={
                    direction === "up"
                      ? "arrow-up"
                      : direction === "down"
                      ? "arrow-down"
                      : "remove"
                  }
                  size={14}
                  color={
                    direction === "up"
                      ? theme.colors.error
                      : direction === "down"
                      ? theme.colors.success
                      : theme.colors.textSecondary
                  }
                />
              )}
              <Text
                style={[
                  styles.differenceText,
                  direction === "up" && styles.differenceTextUp,
                  direction === "down" && styles.differenceTextDown,
                  direction === "equal" && styles.differenceTextEqual,
                ]}
              >
                {diff > 0 ? "+" : ""}
                {diff.toFixed(1)} {item.unit}
                {percent !== null &&
                  ` (${percent > 0 ? "+" : ""}${percent.toFixed(1)}%)`}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Carregando comparação...</Text>
      </View>
    );
  }

  if (!previousMeasurement) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="git-compare-outline"
          size={64}
          color={theme.colors.textSecondary}
        />
        <Text style={styles.emptyTitle}>Primeira Medição</Text>
        <Text style={styles.emptyText}>
          Esta é a primeira medição registrada. Não há dados anteriores para
          comparação.
        </Text>
      </View>
    );
  }

  // Dados para comparação
  const mainMetrics: ComparisonItem[] = [
    {
      label: "Peso",
      current: currentMeasurement.weight,
      previous: previousMeasurement.weight,
      unit: "kg",
      icon: "scale-outline" as const,
    },
    {
      label: "Altura",
      current: currentMeasurement.height,
      previous: previousMeasurement.height,
      unit: "cm",
      icon: "resize-outline" as const,
    },
    {
      label: "IMC",
      current: currentMeasurement.bmi,
      previous: previousMeasurement.bmi,
      unit: "",
      icon: "analytics-outline" as const,
    },
  ].filter((item) => item.current !== null || item.previous !== null);

  const circumferences: ComparisonItem[] = [
    {
      label: "Pescoço",
      current: currentMeasurement.neckCirc,
      previous: previousMeasurement.neckCirc,
      unit: "cm",
      icon: "body-outline" as const,
    },
    {
      label: "Ombros",
      current: currentMeasurement.shoulderCirc,
      previous: previousMeasurement.shoulderCirc,
      unit: "cm",
      icon: "resize-outline" as const,
    },
    {
      label: "Braço Direito",
      current: currentMeasurement.rightArmCirc,
      previous: previousMeasurement.rightArmCirc,
      unit: "cm",
      icon: "fitness-outline" as const,
    },
    {
      label: "Braço Esquerdo",
      current: currentMeasurement.leftArmCirc,
      previous: previousMeasurement.leftArmCirc,
      unit: "cm",
      icon: "fitness-outline" as const,
    },
    {
      label: "Antebraço",
      current: currentMeasurement.forearmCirc,
      previous: previousMeasurement.forearmCirc,
      unit: "cm",
      icon: "hand-right-outline" as const,
    },
    {
      label: "Tórax",
      current: currentMeasurement.chestCirc,
      previous: previousMeasurement.chestCirc,
      unit: "cm",
      icon: "shirt-outline" as const,
    },
    {
      label: "Cintura",
      current: currentMeasurement.waistCirc,
      previous: previousMeasurement.waistCirc,
      unit: "cm",
      icon: "contract-outline" as const,
    },
    {
      label: "Abdômen",
      current: currentMeasurement.abdomenCirc,
      previous: previousMeasurement.abdomenCirc,
      unit: "cm",
      icon: "ellipse-outline" as const,
    },
    {
      label: "Quadril",
      current: currentMeasurement.hipCirc,
      previous: previousMeasurement.hipCirc,
      unit: "cm",
      icon: "ellipse-outline" as const,
    },
    {
      label: "Coxa",
      current: currentMeasurement.thighCirc,
      previous: previousMeasurement.thighCirc,
      unit: "cm",
      icon: "walk-outline" as const,
    },
    {
      label: "Panturrilha",
      current: currentMeasurement.calfCirc,
      previous: previousMeasurement.calfCirc,
      unit: "cm",
      icon: "footsteps-outline" as const,
    },
  ].filter((item) => item.current !== null || item.previous !== null);

  const skinfolds: ComparisonItem[] = [
    {
      label: "Tríceps",
      current: currentMeasurement.tricepsSkinfold,
      previous: previousMeasurement.tricepsSkinfold,
      unit: "mm",
      icon: "analytics-outline" as const,
    },
    {
      label: "Subescapular",
      current: currentMeasurement.subscapularSkinfold,
      previous: previousMeasurement.subscapularSkinfold,
      unit: "mm",
      icon: "analytics-outline" as const,
    },
    {
      label: "Peitoral",
      current: currentMeasurement.pectoralSkinfold,
      previous: previousMeasurement.pectoralSkinfold,
      unit: "mm",
      icon: "analytics-outline" as const,
    },
    {
      label: "Axilar Média",
      current: currentMeasurement.midaxillarySkinfold,
      previous: previousMeasurement.midaxillarySkinfold,
      unit: "mm",
      icon: "analytics-outline" as const,
    },
    {
      label: "Suprailíaca",
      current: currentMeasurement.suprailiacSkinfold,
      previous: previousMeasurement.suprailiacSkinfold,
      unit: "mm",
      icon: "analytics-outline" as const,
    },
    {
      label: "Abdominal",
      current: currentMeasurement.abdominalSkinfold,
      previous: previousMeasurement.abdominalSkinfold,
      unit: "mm",
      icon: "analytics-outline" as const,
    },
    {
      label: "Coxa",
      current: currentMeasurement.thighSkinfold,
      previous: previousMeasurement.thighSkinfold,
      unit: "mm",
      icon: "analytics-outline" as const,
    },
  ].filter((item) => item.current !== null || item.previous !== null);

  const composition: ComparisonItem[] = [
    {
      label: "% Gordura",
      current: currentMeasurement.bodyFatPercent,
      previous: previousMeasurement.bodyFatPercent,
      unit: "%",
      icon: "flame-outline" as const,
    },
    {
      label: "Massa Muscular",
      current: currentMeasurement.muscleMass,
      previous: previousMeasurement.muscleMass,
      unit: "kg",
      icon: "fitness-outline" as const,
    },
    {
      label: "Massa Gorda",
      current: currentMeasurement.fatMass,
      previous: previousMeasurement.fatMass,
      unit: "kg",
      icon: "water-outline" as const,
    },
  ].filter((item) => item.current !== null || item.previous !== null);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header com datas */}
      <View style={styles.header}>
        <View style={styles.dateBox}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.dateLabel}>Anterior:</Text>
          <Text style={styles.dateValue}>
            {formatDate(previousMeasurement.createdAt)}
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={20} color={theme.colors.primary} />
        <View style={styles.dateBox}>
          <Ionicons name="calendar" size={16} color={theme.colors.primary} />
          <Text style={styles.dateLabel}>Atual:</Text>
          <Text style={styles.dateValue}>
            {formatDate(currentMeasurement.createdAt)}
          </Text>
        </View>
      </View>

      {/* Medidas Principais */}
      {mainMetrics.length > 0 && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("main")}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="fitness" size={22} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Medidas Principais</Text>
            </View>
            <Ionicons
              name={expandedSections.main ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
          {expandedSections.main && (
            <View style={styles.sectionContent}>
              {mainMetrics.map(renderComparisonItem)}
            </View>
          )}
        </View>
      )}

      {/* Circunferências */}
      {circumferences.length > 0 && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("circumferences")}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="resize" size={22} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Circunferências</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{circumferences.length}</Text>
              </View>
            </View>
            <Ionicons
              name={
                expandedSections.circumferences ? "chevron-up" : "chevron-down"
              }
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
          {expandedSections.circumferences && (
            <View style={styles.sectionContent}>
              {circumferences.map(renderComparisonItem)}
            </View>
          )}
        </View>
      )}

      {/* Dobras Cutâneas */}
      {skinfolds.length > 0 && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("skinfolds")}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Ionicons
                name="analytics"
                size={22}
                color={theme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Dobras Cutâneas</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{skinfolds.length}</Text>
              </View>
            </View>
            <Ionicons
              name={expandedSections.skinfolds ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
          {expandedSections.skinfolds && (
            <View style={styles.sectionContent}>
              {skinfolds.map(renderComparisonItem)}
            </View>
          )}
        </View>
      )}

      {/* Composição Corporal */}
      {composition.length > 0 && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("composition")}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="body" size={22} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Composição Corporal</Text>
            </View>
            <Ionicons
              name={
                expandedSections.composition ? "chevron-up" : "chevron-down"
              }
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
          {expandedSections.composition && (
            <View style={styles.sectionContent}>
              {composition.map(renderComparisonItem)}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      paddingBottom: theme.spacing.xl,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    loadingText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textSecondary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    emptyTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      marginTop: theme.spacing.md,
    },
    emptyText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.md,
      ...theme.shadows.sm,
    },
    dateBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    dateLabel: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    dateValue: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.md,
      overflow: "hidden",
      ...theme.shadows.sm,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sectionHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
    },
    badge: {
      backgroundColor: theme.colors.primaryBackground,
      borderRadius: 12,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      marginLeft: theme.spacing.xs,
    },
    badgeText: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.primary,
    },
    sectionContent: {
      padding: theme.spacing.md,
      gap: theme.spacing.md,
    },
    comparisonItem: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + "30",
      paddingBottom: theme.spacing.md,
    },
    comparisonItemHeader: {
      marginBottom: theme.spacing.sm,
    },
    comparisonItemTitle: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    comparisonItemLabel: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text,
    },
    comparisonItemValues: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.sm,
    },
    valueBox: {
      flex: 1,
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    valueLabel: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
      textTransform: "uppercase",
    },
    valuePrevious: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.textSecondary,
    },
    valueCurrent: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.primary,
    },
    arrowContainer: {
      paddingHorizontal: theme.spacing.sm,
    },
    differenceContainer: {
      alignItems: "center",
      marginTop: theme.spacing.xs,
    },
    differenceBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.full,
    },
    differenceBadgeUp: {
      backgroundColor: `${theme.colors.error}15`,
    },
    differenceBadgeDown: {
      backgroundColor: `${theme.colors.success}15`,
    },
    differenceBadgeEqual: {
      backgroundColor: `${theme.colors.textSecondary}15`,
    },
    differenceText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    differenceTextUp: {
      color: theme.colors.error,
    },
    differenceTextDown: {
      color: theme.colors.success,
    },
    differenceTextEqual: {
      color: theme.colors.textSecondary,
    },
  });
