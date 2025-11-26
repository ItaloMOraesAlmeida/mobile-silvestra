/**
 * CircumferencesModal Component
 *
 * Modal focado em exibir circunferências corporais com comparação
 * entre medições e visualização organizada por região corporal.
 */

import React from "react";
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

interface CircumferenceData {
  date: string;
  neck?: number | null;
  shoulder?: number | null;
  chest?: number | null;
  waist?: number | null;
  abdomen?: number | null;
  hip?: number | null;
  rightThigh?: number | null;
  leftThigh?: number | null;
  rightCalf?: number | null;
  leftCalf?: number | null;
  rightArm?: number | null;
  leftArm?: number | null;
  rightForearm?: number | null;
  leftForearm?: number | null;
}

export interface CircumferencesModalProps {
  visible: boolean;
  currentData: CircumferenceData | null;
  previousData?: CircumferenceData | null;
  onClose: () => void;
}

export const CircumferencesModal: React.FC<CircumferencesModalProps> = ({
  visible,
  currentData,
  previousData,
  onClose,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();

  if (!currentData) return null;

  // Agrupar circunferências por região
  const regions = [
    {
      title: "Tronco",
      icon: "body" as const,
      measurements: [
        { label: "Pescoço", value: currentData.neck, prev: previousData?.neck },
        {
          label: "Ombro",
          value: currentData.shoulder,
          prev: previousData?.shoulder,
        },
        {
          label: "Peitoral",
          value: currentData.chest,
          prev: previousData?.chest,
        },
        {
          label: "Cintura",
          value: currentData.waist,
          prev: previousData?.waist,
        },
        {
          label: "Abdômen",
          value: currentData.abdomen,
          prev: previousData?.abdomen,
        },
        { label: "Quadril", value: currentData.hip, prev: previousData?.hip },
      ].filter((m) => m.value !== null && m.value !== undefined),
    },
    {
      title: "Membros Superiores",
      icon: "hand-right" as const,
      measurements: [
        {
          label: "Braço Direito",
          value: currentData.rightArm,
          prev: previousData?.rightArm,
        },
        {
          label: "Braço Esquerdo",
          value: currentData.leftArm,
          prev: previousData?.leftArm,
        },
        {
          label: "Antebraço Direito",
          value: currentData.rightForearm,
          prev: previousData?.rightForearm,
        },
        {
          label: "Antebraço Esquerdo",
          value: currentData.leftForearm,
          prev: previousData?.leftForearm,
        },
      ].filter((m) => m.value !== null && m.value !== undefined),
    },
    {
      title: "Membros Inferiores",
      icon: "walk" as const,
      measurements: [
        {
          label: "Coxa Direita",
          value: currentData.rightThigh,
          prev: previousData?.rightThigh,
        },
        {
          label: "Coxa Esquerda",
          value: currentData.leftThigh,
          prev: previousData?.leftThigh,
        },
        {
          label: "Panturrilha Direita",
          value: currentData.rightCalf,
          prev: previousData?.rightCalf,
        },
        {
          label: "Panturrilha Esquerda",
          value: currentData.leftCalf,
          prev: previousData?.leftCalf,
        },
      ].filter((m) => m.value !== null && m.value !== undefined),
    },
  ].filter((region) => region.measurements.length > 0);

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
                <Text style={styles.title}>Circunferências Corporais</Text>
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
            {regions.map((region) => (
              <View key={region.title} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons
                    name={region.icon}
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.cardTitle}>{region.title}</Text>
                </View>

                {region.measurements.map((measurement, index) => (
                  <MeasurementRow
                    key={index}
                    label={measurement.label}
                    value={measurement.value!}
                    previousValue={measurement.prev}
                    theme={theme}
                  />
                ))}
              </View>
            ))}

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
        <Text style={rowStyles(theme).value}>{value.toFixed(1)} cm</Text>

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
  });
