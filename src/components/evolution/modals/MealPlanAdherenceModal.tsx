/**
 * MealPlanAdherenceModal Component
 *
 * Modal para visualizar detalhes de aderência do plano alimentar do paciente
 * com estatísticas detalhadas e visualização de padrões.
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

interface MealAdherence {
  mealName: string;
  completed: number;
  total: number;
  percentage: number;
}

interface WeekdayAdherence {
  day: string;
  adherence: number;
}

interface AdherenceData {
  period: string;
  overallAdherence: number;
  mealsCompleted: number;
  mealsTotal: number;
  consistencyScore: number;
  byMeal: MealAdherence[];
  byWeekday: WeekdayAdherence[];
  bestStreak: number;
  currentStreak: number;
  lastUpdated: string;
}

export interface MealPlanAdherenceModalProps {
  visible: boolean;
  data: AdherenceData | null;
  onClose: () => void;
}

export const MealPlanAdherenceModal: React.FC<MealPlanAdherenceModalProps> = ({
  visible,
  data,
  onClose,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();

  if (!data) return null;

  // Determinar cor da aderência geral
  const getAdherenceColor = (percentage: number) => {
    if (percentage >= 80) return theme.colors.success;
    if (percentage >= 60) return theme.colors.warning;
    return theme.colors.error;
  };

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
                <Text style={styles.title}>Aderência ao Plano</Text>
                <Text style={styles.subtitle}>{data.period}</Text>
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
            {/* Card de Aderência Geral */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons
                  name="stats-chart"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={styles.cardTitle}>Resumo Geral</Text>
              </View>

              <View style={styles.overallContainer}>
                <View style={styles.circularProgress}>
                  <Text
                    style={[
                      styles.percentageText,
                      { color: getAdherenceColor(data.overallAdherence) },
                    ]}
                  >
                    {data.overallAdherence.toFixed(0)}%
                  </Text>
                  <Text style={styles.percentageLabel}>Aderência</Text>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{data.mealsCompleted}</Text>
                    <Text style={styles.statLabel}>Refeições realizadas</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>
                      {data.consistencyScore.toFixed(0)}%
                    </Text>
                    <Text style={styles.statLabel}>Consistência</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Card de Sequências */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="flame" size={20} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>Sequências</Text>
              </View>

              <View style={styles.streakRow}>
                <View style={styles.streakBox}>
                  <Ionicons
                    name="trophy"
                    size={24}
                    color={theme.colors.warning}
                  />
                  <Text style={styles.streakValue}>{data.bestStreak}</Text>
                  <Text style={styles.streakLabel}>Melhor</Text>
                </View>

                <View style={styles.streakDivider} />

                <View style={styles.streakBox}>
                  <Ionicons name="flame" size={24} color={theme.colors.error} />
                  <Text style={styles.streakValue}>{data.currentStreak}</Text>
                  <Text style={styles.streakLabel}>Atual</Text>
                </View>
              </View>
            </View>

            {/* Card de Aderência por Refeição */}
            {data.byMeal.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="restaurant"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.cardTitle}>Por Refeição</Text>
                </View>

                {data.byMeal.map((meal, index) => (
                  <View key={index} style={styles.mealRow}>
                    <Text style={styles.mealName}>{meal.mealName}</Text>
                    <View style={styles.mealProgress}>
                      <View style={styles.mealProgressBar}>
                        <View
                          style={[
                            styles.mealProgressFill,
                            {
                              width: `${meal.percentage}%`,
                              backgroundColor: getAdherenceColor(
                                meal.percentage
                              ),
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.mealPercentage}>
                        {meal.percentage.toFixed(0)}%
                      </Text>
                    </View>
                    <Text style={styles.mealCount}>
                      {meal.completed}/{meal.total}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Card de Aderência por Dia da Semana */}
            {data.byWeekday.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="calendar"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.cardTitle}>Por Dia da Semana</Text>
                </View>

                <View style={styles.weekdayChart}>
                  {data.byWeekday.map((day, index) => (
                    <View key={index} style={styles.weekdayColumn}>
                      <View
                        style={[
                          styles.weekdayBar,
                          {
                            height: `${day.adherence}%`,
                            backgroundColor: getAdherenceColor(day.adherence),
                          },
                        ]}
                      />
                      <Text style={styles.weekdayLabel}>{day.day}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Info de atualização */}
            <View style={styles.updateInfo}>
              <Ionicons
                name="time"
                size={14}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.updateText}>
                Atualizado em{" "}
                {new Date(data.lastUpdated).toLocaleDateString("pt-BR")} às{" "}
                {new Date(data.lastUpdated).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

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
    overallContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    circularProgress: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 8,
      borderColor: theme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 20,
    },
    percentageText: {
      fontSize: 28,
      fontWeight: "700",
    },
    percentageLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    statsGrid: {
      flex: 1,
    },
    statBox: {
      marginBottom: 12,
    },
    statValue: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    streakRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    streakBox: {
      flex: 1,
      alignItems: "center",
    },
    streakValue: {
      fontSize: 28,
      fontWeight: "700",
      color: theme.colors.text,
      marginTop: 8,
      marginBottom: 4,
    },
    streakLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    streakDivider: {
      width: 1,
      height: 60,
      backgroundColor: theme.colors.border,
      marginHorizontal: 16,
    },
    mealRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    mealName: {
      fontSize: 14,
      color: theme.colors.text,
      width: 100,
    },
    mealProgress: {
      flex: 1,
      marginHorizontal: 12,
    },
    mealProgressBar: {
      height: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: 4,
      overflow: "hidden",
    },
    mealProgressFill: {
      height: "100%",
      borderRadius: 4,
    },
    mealPercentage: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 4,
      textAlign: "center",
    },
    mealCount: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      width: 40,
      textAlign: "right",
    },
    weekdayChart: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "flex-end",
      height: 150,
      paddingTop: 20,
    },
    weekdayColumn: {
      alignItems: "center",
      flex: 1,
    },
    weekdayBar: {
      width: 32,
      borderRadius: 4,
      marginBottom: 8,
      minHeight: 4,
    },
    weekdayLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    updateInfo: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
    },
    updateText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginLeft: 6,
    },
  });
