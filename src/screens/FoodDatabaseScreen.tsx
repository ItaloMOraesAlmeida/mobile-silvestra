/**
 * FoodDatabaseScreen - Tela Principal do Banco de Alimentos TACO
 * Sprint 7 - Silvestra App
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { lightTheme } from "../theme";
import { useFoodsStore } from "../stores/foods.store";
import { Food, FoodFilterParams } from "../types/food.types";
import FoodFiltersModal from "../components/FoodFiltersModal";
import FoodListSkeleton from "../components/FoodListSkeleton";
import {
  formatNutrient,
  formatCalories,
  getCategoryColor,
  calculateNutritionalScore,
  getScoreDescription,
} from "../utils/food.utils";

export default function FoodDatabaseScreen() {
  const navigation = useNavigation();
  const {
    foods,
    categories,
    loading,
    error,
    searchTerm,
    selectedCategoryId,
    favorites,
    currentPage,
    totalPages,
    totalItems,
    activeFilters,
    searchFoods,
    loadMore,
    setSearchTerm,
    setSelectedCategory,
    setFilters,
    loadCategories,
    toggleFavorite,
    reset,
  } = useFoodsStore();

  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleApplyFilters = (filters: FoodFilterParams) => {
    setFilters(filters);
  };

  const handleSearch = useCallback(() => {
    // Cancel previous pending search
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    const controller = new AbortController();
    controllerRef.current = controller;

    setSearchTerm(localSearchTerm);
    searchFoods({ search: localSearchTerm, signal: controller.signal });
  }, [localSearchTerm, setSearchTerm, searchFoods]);

  useEffect(() => {
    loadCategories();
    // initial load (no signal)
    searchFoods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = useCallback(() => {
    reset();
    searchFoods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!loading && currentPage < totalPages) {
      loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, currentPage, totalPages]);

  // Abort controller for searches
  const controllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, []);

  const handleFoodPress = useCallback(
    (food: Food) => {
      // @ts-ignore - Navigation types will be updated later
      navigation.navigate("FoodDetails", { foodId: food.id });
    },
    [navigation]
  );

  const handleCategoryPress = useCallback(
    (categoryId: string | null) => {
      setSelectedCategory(
        categoryId === selectedCategoryId ? null : categoryId
      );
    },
    [selectedCategoryId, setSelectedCategory]
  );

  const isFavorite = useCallback(
    (foodId: string) => favorites.includes(foodId),
    [favorites]
  );

  const renderFoodItem = ({ item }: { item: Food }) => {
    const score = calculateNutritionalScore(item);
    const scoreInfo = getScoreDescription(score);
    const categoryColor = item.category?.name
      ? getCategoryColor(item.category.name)
      : "#6B7280";

    return (
      <TouchableOpacity
        onPress={() => handleFoodPress(item)}
        style={styles.foodCard}
      >
        {/* Header */}
        <View style={styles.foodCardHeader}>
          <View style={styles.foodCardContent}>
            <Text style={styles.foodName}>{item.name}</Text>
            {item.category && (
              <View style={styles.foodCategoryContainer}>
                <View
                  style={[
                    styles.foodCategoryBadge,
                    { backgroundColor: categoryColor },
                  ]}
                >
                  <Text style={styles.foodCategoryText}>
                    {item.category.name}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Favorite Button */}
          <TouchableOpacity
            onPress={() => toggleFavorite(item.id)}
            style={styles.favoriteButton}
          >
            <Ionicons
              name={isFavorite(item.id) ? "heart" : "heart-outline"}
              size={24}
              color={isFavorite(item.id) ? "#EF4444" : "#9CA3AF"}
            />
          </TouchableOpacity>
        </View>

        {/* Macros */}
        <View style={styles.macrosContainer}>
          <View style={styles.caloriesContainer}>
            <Text style={styles.caloriesText}>
              {formatCalories(item.energyKcal)}
            </Text>
          </View>

          <View style={styles.macrosRow}>
            {/* Proteínas */}
            {item.protein !== null && item.protein !== undefined && (
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Proteínas</Text>
                <Text style={[styles.macroValue, styles.macroValueProtein]}>
                  {formatNutrient(item.protein)}
                </Text>
              </View>
            )}

            {/* Carboidratos */}
            {item.carbohydrate !== null && item.carbohydrate !== undefined && (
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Carbos</Text>
                <Text style={[styles.macroValue, styles.macroValueCarbs]}>
                  {formatNutrient(item.carbohydrate)}
                </Text>
              </View>
            )}

            {/* Lipídeos */}
            {item.lipids !== null && item.lipids !== undefined && (
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Gorduras</Text>
                <Text style={[styles.macroValue, styles.macroValueFat]}>
                  {formatNutrient(item.lipids)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Score Nutricional */}
        <View style={styles.scoreContainer}>
          <View style={styles.scoreLabel}>
            <Ionicons name="star" size={16} color={scoreInfo.color} />
            <Text style={[styles.scoreLabelText, { color: scoreInfo.color }]}>
              {scoreInfo.label}
            </Text>
          </View>
          <Text style={styles.scoreSubtext}>Por 100g</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategoryFilter = useCallback(() => {
    // Validação defensiva: garante que categories seja sempre um array
    const categoryList = Array.isArray(categories) ? categories : [];

    return (
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ id: null, name: "Todos" }, ...categoryList]}
        keyExtractor={(item) => item.id || "all"}
        contentContainerStyle={styles.categoryFilterContainer}
        renderItem={({ item }) => {
          const isSelected =
            item.id === selectedCategoryId ||
            (item.id === null && !selectedCategoryId);
          const color = item.id ? getCategoryColor(item.name) : "#6B7280";

          return (
            <TouchableOpacity
              onPress={() => handleCategoryPress(item.id)}
              style={[
                styles.categoryButton,
                isSelected
                  ? styles.categoryButtonSelected
                  : styles.categoryButtonUnselected,
                { backgroundColor: isSelected ? color : "#F3F4F6" },
              ]}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  isSelected
                    ? styles.categoryButtonTextSelected
                    : styles.categoryButtonTextUnselected,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    );
  }, [categories, selectedCategoryId, handleCategoryPress]);

  const renderSearchBar = () => {
    return (
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            value={localSearchTerm}
            onChangeText={setLocalSearchTerm}
            onSubmitEditing={handleSearch}
            placeholder="Buscar alimentos (ex: arroz, frango...)"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInputText}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {loading ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            localSearchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setLocalSearchTerm("")}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )
          )}
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <Ionicons name="search" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHeader = useCallback(() => {
    // Validação defensiva para evitar undefined
    const foodsList = Array.isArray(foods) ? foods : [];

    return (
      <View>
        {/* Category Filters */}
        {renderCategoryFilter()}

        {/* Results Count */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {foodsList.length} alimentos encontrados
          </Text>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={styles.filtersButton}
          >
            <Ionicons name="options" size={20} color="#3B82F6" />
            <Text style={styles.filtersButtonText}>Filtros</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [foods, showFilters, renderCategoryFilter]);

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Ionicons name="search" size={48} color="#D1D5DB" />
        <Text style={styles.emptyText}>Nenhum alimento encontrado</Text>
        {searchTerm && (
          <Text style={styles.emptySubtext}>Tente buscar por outro termo</Text>
        )}
      </View>
    ),
    [searchTerm]
  );

  const renderFooter = useCallback(() => {
    if (!loading || currentPage === 1) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  }, [loading, currentPage]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Banco de Alimentos</Text>
            <Text style={styles.headerSubtitle}>
              Base TACO - {totalItems || 0} alimentos
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              // @ts-ignore - Navigation types will be updated later
              navigation.navigate("FoodFavorites");
            }}
            style={styles.favoritesButton}
          >
            <View>
              <Ionicons name="heart" size={28} color="#EF4444" />
              {Array.isArray(favorites) && favorites.length > 0 && (
                <View style={styles.favoriteBadge}>
                  <Text style={styles.favoriteBadgeText}>
                    {favorites.length}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Search Bar */}
      {renderSearchBar()}

      {/* Food List */}
      <FlatList
        data={Array.isArray(foods) ? foods : []}
        renderItem={renderFoodItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          loading && currentPage === 1 ? <FoodListSkeleton /> : renderEmpty
        }
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={loading && currentPage === 1}
            onRefresh={handleRefresh}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />

      {/* Filters Modal */}
      <FoodFiltersModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        initialFilters={activeFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[50],
  },
  header: {
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[2],
    backgroundColor: lightTheme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: lightTheme.typography.fontSize["2xl"],
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
  },
  headerSubtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginTop: lightTheme.spacing[1],
  },
  favoritesButton: {
    padding: lightTheme.spacing[2],
  },
  favoriteBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#F44336",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteBadgeText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.bold,
  },
  errorContainer: {
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
    backgroundColor: "#FEF2F2",
    borderBottomWidth: 1,
    borderBottomColor: "#FECACA",
  },
  errorText: {
    color: "#DC2626",
    fontSize: lightTheme.typography.fontSize.sm,
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
  searchButton: {
    padding: lightTheme.spacing[1],
  },
  categoryFilterContainer: {
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[2],
  },
  categoryButton: {
    marginRight: lightTheme.spacing[2],
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[2],
    borderRadius: lightTheme.borderRadius.full,
    borderWidth: 1,
  },
  categoryButtonSelected: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  categoryButtonUnselected: {
    backgroundColor: lightTheme.colors.white,
    borderColor: lightTheme.colors.gray[300],
  },
  categoryButtonText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
  },
  categoryButtonTextSelected: {
    color: lightTheme.colors.white,
  },
  categoryButtonTextUnselected: {
    color: lightTheme.colors.gray[700],
  },
  resultsContainer: {
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultsText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
  },
  filtersButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  filtersButtonText: {
    marginLeft: lightTheme.spacing[1],
    fontSize: lightTheme.typography.fontSize.sm,
    color: "#2196F3",
    fontWeight: lightTheme.typography.fontWeight.medium,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: lightTheme.spacing[12],
  },
  emptyText: {
    color: lightTheme.colors.gray[500],
    textAlign: "center",
    marginTop: lightTheme.spacing[4],
    fontSize: lightTheme.typography.fontSize.base,
  },
  emptySubtext: {
    color: lightTheme.colors.gray[400],
    textAlign: "center",
    marginTop: lightTheme.spacing[2],
    fontSize: lightTheme.typography.fontSize.sm,
    paddingHorizontal: lightTheme.spacing[8],
  },
  footerLoader: {
    paddingVertical: lightTheme.spacing[4],
  },
  listContent: {
    paddingHorizontal: lightTheme.spacing[4],
    paddingTop: lightTheme.spacing[4],
  },
  foodCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[3],
    ...lightTheme.shadows.sm,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[100],
  },
  foodCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: lightTheme.spacing[2],
  },
  foodCardContent: {
    flex: 1,
    paddingRight: lightTheme.spacing[2],
  },
  foodName: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing[1],
  },
  foodCategoryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  foodCategoryBadge: {
    paddingHorizontal: lightTheme.spacing[2],
    paddingVertical: lightTheme.spacing[1],
    borderRadius: 20,
  },
  foodCategoryText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.white,
    fontWeight: lightTheme.typography.fontWeight.medium,
  },
  favoriteButton: {
    padding: lightTheme.spacing[2],
  },
  macrosContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: lightTheme.spacing[3],
    paddingTop: lightTheme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[100],
  },
  caloriesContainer: {
    flex: 1,
  },
  caloriesText: {
    fontSize: lightTheme.typography.fontSize["2xl"],
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
  },
  macrosRow: {
    flexDirection: "row",
    gap: lightTheme.spacing[4],
  },
  macroItem: {
    alignItems: "center",
  },
  macroLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginBottom: lightTheme.spacing[1],
  },
  macroValue: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
  },
  macroValueProtein: {
    color: "#4CAF50",
  },
  macroValueCarbs: {
    color: "#2196F3",
  },
  macroValueFat: {
    color: "#FF9800",
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: lightTheme.spacing[3],
    paddingTop: lightTheme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[100],
  },
  scoreLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreLabelText: {
    marginLeft: lightTheme.spacing[1],
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
  },
  scoreSubtext: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
  },
});
