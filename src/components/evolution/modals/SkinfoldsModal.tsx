/**
 * SkinfoldsModal Component
 *
 * Modal focado em exibir dobras cutâneas com cálculo de percentual de gordura
 * e visualização do protocolo utilizado.
 */

import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles, useTheme } from "../../../hooks/useTheme";
import type { Theme } from "../../../theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SkinfoldData {
  date: string;
  gender?: string;
  age?: number;
  tricepsFold?: number | null;
  bicepsFold?: number | null;
  subscapularFold?: number | null;
  suprailiacFold?: number | null;
  abdominalFold?: number | null;
  thighFold?: number | null;
  calfFold?: number | null;
}

export interface SkinfoldsModalProps {
  visible: boolean;
  currentData: SkinfoldData | null;
  previousData?: SkinfoldData | null;
  onClose: () => void;
}

export const SkinfoldsModal: React.FC<SkinfoldsModalProps> = ({
  visible,
  currentData,
  previousData,
  onClose,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();

  // Calcular soma das dobras e percentual de gordura
  const calculations = useMemo(() => {
    if (!currentData) return null;

    const folds = [
      currentData.tricepsFold,
      currentData.bicepsFold,
      currentData.subscapularFold,
      currentData.suprailiacFold,
      currentData.abdominalFold,
      currentData.thighFold,
      currentData.calfFold,
    ].filter((f) => f !== null && f !== undefined) as number[];

    const sum = folds.reduce((acc, val) => acc + val, 0);

    // Cálculo simplificado usando protocolo de 7 dobras (Jackson & Pollock)
    let bodyFat = null;
    if (currentData.gender && currentData.age && folds.length >= 3) {
      const isMale = currentData.gender.toLowerCase() === "male";
      const age = currentData.age;

      if (isMale) {
        const density =
          1.112 - 0.00043499 * sum + 0.00000055 * sum * sum - 0.00028826 * age;
        bodyFat = ((4.95 / density - 4.5) * 100).toFixed(1);
      } else {
        const density =
          1.097 - 0.00046971 * sum + 0.00000056 * sum * sum - 0.00012828 * age;
        bodyFat = ((4.95 / density - 4.5) * 100).toFixed(1);
      }
    }

    return { sum: sum.toFixed(1), bodyFat, count: folds.length };
  }, [currentData]);

  if (!currentData) return null;

  const measurements = [
    {
      label: "Tríceps",
      value: currentData.tricepsFold,
      prev: previousData?.tricepsFold,
    },
    {
      label: "Bíceps",
      value: currentData.bicepsFold,
      prev: previousData?.bicepsFold,
    },
    {
      label: "Subescapular",
      value: currentData.subscapularFold,
      prev: previousData?.subscapularFold,
    },
    {
      label: "Suprailíaca",
      value: currentData.suprailiacFold,
      prev: previousData?.suprailiacFold,
    },
    {
      label: "Abdominal",
      value: currentData.abdominalFold,
      prev: previousData?.abdominalFold,
    },
    {
      label: "Coxa",
      value: currentData.thighFold,
      prev: previousData?.thighFold,
    },
    {
      label: "Panturrilha",
      value: currentData.calfFold,
      prev: previousData?.calfFold,
    },
  ].filter((m) => m.value !== null && m.value !== undefined);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <SafeAreaView style={styles.modalContent} edges={["bottom"]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dragIndicator} />

            <View style={styles.titleContainer}>
              <View style={styles.titleContent}>
                <Text style={styles.title}>Dobras Cutâneas</Text>
                <Text style={styles.subtitle}>
                  {new Date(currentData.date).toLocaleDateString("pt-BR")}
                </Text>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Card de Resumo */}
            {calculations && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="calculator"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.cardTitle}>Resumo</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Soma das Dobras</Text>
                  <Text style={styles.summaryValue}>{calculations.sum} mm</Text>
                </View>

                {calculations.bodyFat && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Percentual de Gordura
                    </Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {calculations.bodyFat}%
                    </Text>
                  </View>
                )}

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Protocolo</Text>
                  <Text style={styles.summaryValue}>
                    {calculations.count} dobras
                  </Text>
                </View>
              </View>
            )}

            {/* Card de Medições */}
            {measurements.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="resize"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.cardTitle}>Medições</Text>
                </View>

                {measurements.map((measurement, index) => (
                  <MeasurementRow
                    key={index}
                    label={measurement.label}
                    value={measurement.value!}
                    previousValue={measurement.prev}
                    theme={theme}
                  />
                ))}
              </View>
            )}

            <View style={{ height: 32 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

// Componente auxiliar
interface MeasurementRowProps {
  label: string;
  value: number;
  previousValue?: number | null;
  theme: Theme;
}

const MeasurementRow: React.FC<MeasurementRowProps> = ({
  label,
  value,
  previousValue,
  theme,
}) => {
  const change = previousValue ? value - previousValue : null;
  const hasChange = change !== null && Math.abs(change) > 0.1;

  return (
    <View style={rowStyles(theme).container}>
      <Text style={rowStyles(theme).label}>{label}</Text>

      <View style={rowStyles(theme).valueContainer}>
        <Text style={rowStyles(theme).value}>{value.toFixed(1)} mm</Text>

        {hasChange && (
          <View style={rowStyles(theme).changeContainer}>
            <Ionicons
              name={change! > 0 ? "arrow-up" : "arrow-down"}
              size={12}
              color={change! > 0 ? theme.colors.error : theme.colors.success}
            />
            <Text
              style={[
                rowStyles(theme).changeText,
                {
                  color:
                    change! > 0 ? theme.colors.error : theme.colors.success,
                },
              ]}
            >
              {Math.abs(change!).toFixed(1)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const rowStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    label: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
    },
    valueContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    value: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
      marginRight: 8,
    },
    changeContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    changeText: {
      fontSize: 11,
      fontWeight: "500",
      marginLeft: 2,
    },
  });

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalBackdrop: {
      flex: 1,
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: SCREEN_HEIGHT * 0.9,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    dragIndicator: {
      width: 40,
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: 12,
    },
    titleContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    titleContent: {
      flex: 1,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    closeButton: {
      padding: 4,
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 20,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
      marginLeft: 8,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    summaryLabel: {
      fontSize: 14,
      color: theme.colors.text,
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.text,
    },
  });
