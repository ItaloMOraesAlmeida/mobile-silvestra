import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { lightTheme } from "../theme";

/**
 * Skeleton para MealPlanDetailsScreen durante carregamento
 *
 * Mostra placeholder enquanto os dados do plano alimentar estão sendo carregados
 */
export const MealPlanDetailsSkeleton: React.FC = () => {
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Card Skeleton */}
        <View style={styles.headerCard}>
          <View style={styles.titleSkeleton} />
          <View style={styles.subtitleSkeleton} />
          <View style={styles.dateRowSkeleton}>
            <View style={styles.dateItemSkeleton} />
            <View style={styles.dateItemSkeleton} />
          </View>
        </View>

        {/* Metas Nutricionais Skeleton */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleSkeleton} />
          <View style={styles.goalRowSkeleton}>
            <View style={styles.goalItemSkeleton} />
            <View style={styles.goalItemSkeleton} />
          </View>
        </View>

        {/* Resumo Nutricional Skeleton */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleSkeleton} />
          <View style={styles.macroRowSkeleton}>
            <View style={styles.macroItemSkeleton} />
            <View style={styles.macroItemSkeleton} />
            <View style={styles.macroItemSkeleton} />
          </View>
        </View>

        {/* Gráficos Skeleton */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleSkeleton} />
          <View style={styles.chartSkeleton} />
        </View>

        {/* Shopping List CTA Skeleton */}
        <View style={styles.ctaSkeleton} />

        {/* Day Cards Skeleton (3 dias) */}
        {[1, 2, 3].map((day) => (
          <View key={day} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <View style={styles.dayBadgeSkeleton} />
              <View style={styles.dayTitleSkeleton} />
            </View>
          </View>
        ))}

        {/* Observações Skeleton */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleSkeleton} />
          <View style={styles.notesSkeleton} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[50],
  },
  scrollContent: {
    padding: lightTheme.spacing[4],
  },
  headerCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[4],
    ...lightTheme.shadows.sm,
  },
  titleSkeleton: {
    width: "70%",
    height: 24,
    backgroundColor: lightTheme.colors.gray[200],
    borderRadius: lightTheme.borderRadius.md,
    marginBottom: lightTheme.spacing[2],
  },
  subtitleSkeleton: {
    width: "50%",
    height: 16,
    backgroundColor: lightTheme.colors.gray[200],
    borderRadius: lightTheme.borderRadius.md,
    marginBottom: lightTheme.spacing[4],
  },
  dateRowSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: lightTheme.spacing[3],
  },
  dateItemSkeleton: {
    flex: 1,
    height: 40,
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.lg,
  },
  sectionCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[4],
    ...lightTheme.shadows.sm,
  },
  sectionTitleSkeleton: {
    width: "60%",
    height: 20,
    backgroundColor: lightTheme.colors.gray[200],
    borderRadius: lightTheme.borderRadius.md,
    marginBottom: lightTheme.spacing[3],
  },
  goalRowSkeleton: {
    flexDirection: "row",
    gap: lightTheme.spacing[3],
  },
  goalItemSkeleton: {
    flex: 1,
    height: 80,
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.lg,
  },
  macroRowSkeleton: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: lightTheme.spacing[2],
  },
  macroItemSkeleton: {
    flex: 1,
    height: 60,
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.lg,
  },
  chartSkeleton: {
    width: "100%",
    height: 200,
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.lg,
    marginTop: lightTheme.spacing[2],
  },
  ctaSkeleton: {
    height: 120,
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.xl,
    marginBottom: lightTheme.spacing[4],
    ...lightTheme.shadows.sm,
  },
  dayCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[3],
    ...lightTheme.shadows.sm,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[3],
  },
  dayBadgeSkeleton: {
    width: 40,
    height: 40,
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: 20,
  },
  dayTitleSkeleton: {
    flex: 1,
    height: 20,
    backgroundColor: lightTheme.colors.gray[200],
    borderRadius: lightTheme.borderRadius.md,
  },
  notesSkeleton: {
    width: "100%",
    height: 80,
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.lg,
  },
});
