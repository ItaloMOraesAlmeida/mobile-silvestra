/**
 * Tela de Listagem de Planos Alimentares
 * Sprint 8-9 - Meal Plans Module
 *
 * Features:
 * - Lista de todos os planos do nutricionista
 * - Filtros por paciente, status, busca
 * - Cards com resumo nutricional
 * - Navegação para detalhes/edição
 * - FAB para criar novo plano
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../theme";
import { useMealPlansStore } from "../stores/meal-plans.store";
import type { MealPlan, PlanStatus } from "../types/meal-plan.types";
import {
  getPlanStatusInfo,
  formatPlanPeriod,
  getDaysRemaining,
} from "../utils/meal-plan.utils";

interface Props {
  navigation: any;
}

export default function MealPlansListScreen({ navigation }: Props) {
  const {
    plans,
    loading,
    error,
    loadPlans,
    setSelectedPlan,
    activeFilters,
    setActiveFilters,
  } = useMealPlansStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PlanStatus | "ALL">("ALL");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPlans(activeFilters);
  }, [activeFilters, loadPlans]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPlans(activeFilters);
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearchTerm(text);
    setActiveFilters({
      ...activeFilters,
      search: text || undefined,
    });
  };

  const handleStatusFilter = (status: PlanStatus | "ALL") => {
    setStatusFilter(status);
    setActiveFilters({
      ...activeFilters,
      status: status === "ALL" ? undefined : status,
    });
  };

  const handlePlanPress = (plan: MealPlan) => {
    setSelectedPlan(plan);
    navigation.navigate("MealPlanDetails", {
      planId: plan.id,
      patientId: plan.patientId,
    });
  };

  const handleCreatePlan = () => {
    navigation.navigate("CreateMealPlan");
  };

  const filteredPlans = plans.filter((plan) => {
    if (statusFilter !== "ALL" && plan.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const renderPlanCard = ({ item: plan }: { item: MealPlan }) => {
    const statusInfo = getPlanStatusInfo(plan.status);
    const daysRemaining = getDaysRemaining(plan.endDate);
    const mealCount = plan.meals.length;

    return (
      <TouchableOpacity
        onPress={() => handlePlanPress(plan)}
        style={styles.planCard}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderContent}>
            <Text style={styles.planName} numberOfLines={1}>
              {plan.name}
            </Text>
            <Text style={styles.planPeriod}>
              {formatPlanPeriod(plan.startDate, plan.endDate)}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusInfo.color}15` },
            ]}
          >
            <Ionicons
              name={statusInfo.icon as any}
              size={14}
              color={statusInfo.color}
            />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {/* Description */}
        {plan.description && (
          <Text style={styles.planDescription} numberOfLines={2}>
            {plan.description}
          </Text>
        )}

        {/* Nutrition Summary */}
        <View style={styles.nutritionSummary}>
          <View style={styles.nutritionHeader}>
            <Text style={styles.nutritionTitle}>RESUMO NUTRICIONAL</Text>
            <Text style={styles.mealCount}>{mealCount} refeições</Text>
          </View>

          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Calorias</Text>
              <Text style={styles.nutritionValue}>
                {Math.round(plan.nutrition.totalCalories)} kcal
              </Text>
            </View>

            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Proteínas</Text>
              <Text style={styles.nutritionValueProtein}>
                {plan.nutrition.totalProtein.toFixed(0)}g
              </Text>
            </View>

            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Carbos</Text>
              <Text style={styles.nutritionValueCarbs}>
                {plan.nutrition.totalCarbs.toFixed(0)}g
              </Text>
            </View>

            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Gorduras</Text>
              <Text style={styles.nutritionValueFat}>
                {plan.nutrition.totalFat.toFixed(0)}g
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          {daysRemaining !== null && daysRemaining > 0 && (
            <View style={styles.footerItem}>
              <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
              <Text style={styles.footerText}>
                {daysRemaining}{" "}
                {daysRemaining === 1 ? "dia restante" : "dias restantes"}
              </Text>
            </View>
          )}

          {plan.isTemplate && (
            <View style={styles.footerItem}>
              <Ionicons name="bookmark" size={14} color="#3B82F6" />
              <Text style={styles.templateText}>Template</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Planos Alimentares</Text>
        <Text style={styles.headerSubtitle}>
          {filteredPlans.length}{" "}
          {filteredPlans.length === 1 ? "plano" : "planos"}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Buscar planos..."
            value={searchTerm}
            onChangeText={handleSearch}
            style={styles.searchInputText}
            placeholderTextColor="#9CA3AF"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={["ALL", "DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isSelected = statusFilter === item;
            const statusInfo =
              item === "ALL"
                ? { label: "Todos", color: "#3B82F6", icon: "list" }
                : getPlanStatusInfo(item as PlanStatus);

            return (
              <TouchableOpacity
                onPress={() => handleStatusFilter(item as PlanStatus | "ALL")}
                style={[
                  styles.filterButton,
                  isSelected
                    ? styles.filterButtonSelected
                    : styles.filterButtonUnselected,
                ]}
              >
                <Ionicons
                  name={statusInfo.icon as any}
                  size={16}
                  color={isSelected ? "#FFFFFF" : statusInfo.color}
                />
                <Text
                  style={[
                    styles.filterButtonText,
                    isSelected
                      ? styles.filterButtonTextSelected
                      : styles.filterButtonTextUnselected,
                  ]}
                >
                  {statusInfo.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Carregando planos...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Erro ao carregar</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            onPress={() => loadPlans(activeFilters)}
            style={styles.errorButton}
          >
            <Text style={styles.errorButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : filteredPlans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>
            {searchTerm ? "Nenhum plano encontrado" : "Nenhum plano criado"}
          </Text>
          <Text style={styles.emptyMessage}>
            {searchTerm
              ? "Tente ajustar os filtros de busca"
              : "Crie seu primeiro plano alimentar para começar"}
          </Text>
          {!searchTerm && (
            <TouchableOpacity
              onPress={handleCreatePlan}
              style={styles.emptyButton}
            >
              <Text style={styles.emptyButtonText}>Criar Plano</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredPlans}
          renderItem={renderPlanCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      {/* FAB */}
      {!loading && filteredPlans.length > 0 && (
        <TouchableOpacity onPress={handleCreatePlan} style={styles.fab}>
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[50],
  },
  header: {
    backgroundColor: lightTheme.colors.white,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  headerTitle: {
    fontSize: lightTheme.typography.fontSize["2xl"],
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
  },
  headerSubtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
    marginTop: lightTheme.spacing[1],
  },
  searchContainer: {
    paddingHorizontal: lightTheme.spacing[4],
    paddingTop: lightTheme.spacing[4],
    paddingBottom: lightTheme.spacing[2],
  },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius["2xl"],
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
    gap: lightTheme.spacing[2],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
  },
  searchInputText: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[900],
  },
  filtersContainer: {
    paddingHorizontal: lightTheme.spacing[4],
    paddingBottom: lightTheme.spacing[3],
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[1],
    marginRight: lightTheme.spacing[2],
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[2],
    borderRadius: lightTheme.borderRadius.full,
    borderWidth: 1,
  },
  filterButtonSelected: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  filterButtonUnselected: {
    backgroundColor: lightTheme.colors.white,
    borderColor: lightTheme.colors.gray[300],
  },
  filterButtonText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
  },
  filterButtonTextSelected: {
    color: lightTheme.colors.white,
  },
  filterButtonTextUnselected: {
    color: lightTheme.colors.gray[700],
  },
  listContent: {
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
  },
  planCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius["2xl"],
    padding: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[3],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[100],
    ...lightTheme.shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: lightTheme.spacing[2],
  },
  cardHeaderContent: {
    flex: 1,
    marginRight: lightTheme.spacing[2],
  },
  planName: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
  },
  planPeriod: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[1],
    paddingHorizontal: lightTheme.spacing[3],
    paddingVertical: lightTheme.spacing[1],
    borderRadius: lightTheme.borderRadius.full,
  },
  statusText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.medium,
  },
  planDescription: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing[3],
  },
  nutritionSummary: {
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing[3],
    marginBottom: lightTheme.spacing[3],
  },
  nutritionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: lightTheme.spacing[2],
  },
  nutritionTitle: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[500],
  },
  mealCount: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[400],
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: lightTheme.spacing[2],
  },
  nutritionItem: {
    backgroundColor: lightTheme.colors.white,
    paddingHorizontal: lightTheme.spacing[2],
    paddingVertical: lightTheme.spacing[1],
    borderRadius: lightTheme.borderRadius.md,
  },
  nutritionLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
  },
  nutritionValue: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
  },
  nutritionValueProtein: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: "#EC4899",
  },
  nutritionValueCarbs: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: "#3B82F6",
  },
  nutritionValueFat: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: "#F97316",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginLeft: lightTheme.spacing[1],
  },
  templateText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: "#3B82F6",
    marginLeft: lightTheme.spacing[1],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: lightTheme.colors.gray[500],
    marginTop: lightTheme.spacing[4],
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: lightTheme.spacing[4],
  },
  errorTitle: {
    color: lightTheme.colors.gray[900],
    fontWeight: lightTheme.typography.fontWeight.semibold,
    fontSize: lightTheme.typography.fontSize.lg,
    marginTop: lightTheme.spacing[4],
  },
  errorMessage: {
    color: lightTheme.colors.gray[500],
    textAlign: "center",
    marginTop: lightTheme.spacing[2],
  },
  errorButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: lightTheme.spacing[6],
    paddingVertical: lightTheme.spacing[3],
    borderRadius: lightTheme.borderRadius.full,
    marginTop: lightTheme.spacing[4],
  },
  errorButtonText: {
    color: lightTheme.colors.white,
    fontWeight: lightTheme.typography.fontWeight.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: lightTheme.spacing[4],
  },
  emptyTitle: {
    color: lightTheme.colors.gray[900],
    fontWeight: lightTheme.typography.fontWeight.semibold,
    fontSize: lightTheme.typography.fontSize.lg,
    marginTop: lightTheme.spacing[4],
  },
  emptyMessage: {
    color: lightTheme.colors.gray[500],
    textAlign: "center",
    marginTop: lightTheme.spacing[2],
  },
  emptyButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: lightTheme.spacing[6],
    paddingVertical: lightTheme.spacing[3],
    borderRadius: lightTheme.borderRadius.full,
    marginTop: lightTheme.spacing[4],
  },
  emptyButtonText: {
    color: lightTheme.colors.white,
    fontWeight: lightTheme.typography.fontWeight.medium,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#3B82F6",
    width: 56,
    height: 56,
    borderRadius: lightTheme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    ...lightTheme.shadows.lg,
  },
});
