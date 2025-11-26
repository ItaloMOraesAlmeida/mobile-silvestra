/**
 * FoodFavoritesScreen - Tela de Alimentos Favoritos
 * Sprint 7 - Silvestra App
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { lightTheme } from "../theme";
import { useFoodsStore } from "../stores/foods.store";
import { Food, FoodFilterParams } from "../types/food.types";
import FoodFiltersModal from "../components/FoodFiltersModal";
import {
  formatNutrient,
  formatCalories,
  getCategoryColor,
} from "../utils/food.utils";

export default function FoodFavoritesScreen() {
  const navigation = useNavigation();
  const {
    favorites,
    toggleFavorite,
    getFavoritesList,
    categories,
    loadCategories,
  } = useFoodsStore();

  const [favoriteFoods, setFavoriteFoods] = useState<Food[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FoodFilterParams>({});

  useEffect(() => {
    loadCategories();
    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favorites]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favoriteFoods, localSearchTerm, selectedCategoryId, activeFilters]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const foods = await getFavoritesList();
      setFavoriteFoods(foods);
    } catch (error) {
      console.error("Erro ao carregar favoritos:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...favoriteFoods];

    // Filtro de busca por nome
    if (localSearchTerm.trim()) {
      const searchLower = localSearchTerm.toLowerCase().trim();
      filtered = filtered.filter((food) =>
        food.name.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por categoria
    if (selectedCategoryId) {
      filtered = filtered.filter(
        (food) => food.category?.id === selectedCategoryId
      );
    }

    // Filtros de nutrientes
    if (Object.keys(activeFilters).length > 0) {
      filtered = filtered.filter((food) => {
        const {
          minProtein,
          maxProtein,
          minCarbs,
          maxCarbs,
          minLipids,
          maxLipids,
          minCalories,
          maxCalories,
          minFiber,
        } = activeFilters;

        if (
          minProtein !== undefined &&
          (food.protein === null ||
            food.protein === undefined ||
            food.protein < minProtein)
        )
          return false;
        if (
          maxProtein !== undefined &&
          (food.protein === null ||
            food.protein === undefined ||
            food.protein > maxProtein)
        )
          return false;
        if (
          minCarbs !== undefined &&
          (food.carbohydrate === null ||
            food.carbohydrate === undefined ||
            food.carbohydrate < minCarbs)
        )
          return false;
        if (
          maxCarbs !== undefined &&
          (food.carbohydrate === null ||
            food.carbohydrate === undefined ||
            food.carbohydrate > maxCarbs)
        )
          return false;
        if (
          minLipids !== undefined &&
          (food.lipids === null ||
            food.lipids === undefined ||
            food.lipids < minLipids)
        )
          return false;
        if (
          maxLipids !== undefined &&
          (food.lipids === null ||
            food.lipids === undefined ||
            food.lipids > maxLipids)
        )
          return false;
        if (
          minCalories !== undefined &&
          (food.energyKcal === null ||
            food.energyKcal === undefined ||
            food.energyKcal < minCalories)
        )
          return false;
        if (
          maxCalories !== undefined &&
          (food.energyKcal === null ||
            food.energyKcal === undefined ||
            food.energyKcal > maxCalories)
        )
          return false;
        if (
          minFiber !== undefined &&
          (food.fiber === null ||
            food.fiber === undefined ||
            food.fiber < minFiber)
        )
          return false;

        return true;
      });
    }

    setFilteredFoods(filtered);
  }, [favoriteFoods, localSearchTerm, selectedCategoryId, activeFilters]);

  const handleSearch = () => {
    applyFilters();
  };

  const handleApplyFilters = (filters: FoodFilterParams) => {
    setActiveFilters(filters);
  };

  const handleCategoryPress = useCallback(
    (categoryId: string | null) => {
      setSelectedCategoryId(
        categoryId === selectedCategoryId ? null : categoryId
      );
    },
    [selectedCategoryId]
  );

  const handleFoodPress = (food: Food) => {
    // @ts-ignore - Navigation types will be updated later
    navigation.navigate("FoodDetails", { foodId: food.id });
  };

  const renderFoodItem = ({ item }: { item: Food }) => {
    const categoryColor = item.category?.name
      ? getCategoryColor(item.category.name)
      : "#6B7280";

    return (
      <TouchableOpacity
        onPress={() => handleFoodPress(item)}
        style={styles.foodCard}
      >
        <View style={styles.foodCardHeader}>
          <View style={styles.foodCardContent}>
            <Text style={styles.foodName}>{item.name}</Text>
            {item.category && (
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: categoryColor },
                ]}
              >
                <Text style={styles.categoryText}>{item.category.name}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={() => toggleFavorite(item.id)}
            style={styles.favoriteButton}
          >
            <Ionicons name="heart" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.macrosContainer}>
          <Text style={styles.caloriesText}>
            {formatCalories(item.energyKcal)}
          </Text>

          <View style={styles.macrosRow}>
            {item.protein !== null && item.protein !== undefined && (
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Proteínas</Text>
                <Text style={styles.macroValueProtein}>
                  {formatNutrient(item.protein)}
                </Text>
              </View>
            )}

            {item.carbohydrate !== null && item.carbohydrate !== undefined && (
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Carbos</Text>
                <Text style={styles.macroValueCarbs}>
                  {formatNutrient(item.carbohydrate)}
                </Text>
              </View>
            )}

            {item.lipids !== null && item.lipids !== undefined && (
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Gorduras</Text>
                <Text style={styles.macroValueFat}>
                  {formatNutrient(item.lipids)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInput}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          value={localSearchTerm}
          onChangeText={setLocalSearchTerm}
          onSubmitEditing={handleSearch}
          placeholder="Buscar nos favoritos..."
          placeholderTextColor="#9CA3AF"
          style={styles.searchInputText}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {localSearchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setLocalSearchTerm("")}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
          <Ionicons name="search" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategoryFilter = useCallback(() => {
    if (!categories || categories.length === 0) return null;

    return (
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selectedCategoryId === item.id;
          return (
            <TouchableOpacity
              onPress={() => handleCategoryPress(item.id)}
              style={[
                styles.categoryButton,
                isSelected
                  ? styles.categoryButtonSelected
                  : styles.categoryButtonUnselected,
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

  const renderHeader = () => {
    const hasActiveNutrientFilters = Object.keys(activeFilters).length > 0;

    return (
      <View>
        {/* Category Filters */}
        {renderCategoryFilter()}

        {/* Results Count */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {filteredFoods.length} de {favoriteFoods.length} favoritos
          </Text>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={[
              styles.filtersButton,
              hasActiveNutrientFilters && styles.filtersButtonActive,
            ]}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={hasActiveNutrientFilters ? "#FFFFFF" : "#3B82F6"}
            />
            <Text
              style={[
                styles.filtersButtonText,
                hasActiveNutrientFilters && styles.filtersButtonTextActive,
              ]}
            >
              Filtros
            </Text>
            {hasActiveNutrientFilters && (
              <View style={styles.filtersBadge}>
                <Text style={styles.filtersBadgeText}>
                  {Object.keys(activeFilters).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Nenhum favorito ainda</Text>
      <Text style={styles.emptySubtext}>
        Adicione alimentos aos favoritos para acesso rápido
      </Text>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.emptyButton}
      >
        <Text style={styles.emptyButtonText}>Buscar Alimentos</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      {renderSearchBar()}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={filteredFoods}
          renderItem={renderFoodItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  categoryBadge: {
    paddingHorizontal: lightTheme.spacing[2],
    paddingVertical: lightTheme.spacing[1],
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  categoryText: {
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
  macroValueProtein: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: "#4CAF50",
  },
  macroValueCarbs: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: "#2196F3",
  },
  macroValueFat: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: "#FF9800",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: lightTheme.spacing[12],
  },
  emptyTitle: {
    color: lightTheme.colors.gray[900],
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    marginTop: lightTheme.spacing[4],
  },
  emptySubtext: {
    color: lightTheme.colors.gray[500],
    textAlign: "center",
    marginTop: lightTheme.spacing[2],
    paddingHorizontal: lightTheme.spacing[8],
  },
  emptyButton: {
    marginTop: lightTheme.spacing[6],
    backgroundColor: "#3B82F6",
    paddingHorizontal: lightTheme.spacing[6],
    paddingVertical: lightTheme.spacing[3],
    borderRadius: lightTheme.borderRadius.xl,
  },
  emptyButtonText: {
    color: lightTheme.colors.white,
    fontWeight: lightTheme.typography.fontWeight.medium,
  },
  // Search Bar Styles
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
  // Categories Filter Styles
  categoriesContainer: {
    paddingVertical: lightTheme.spacing[2],
    marginBottom: lightTheme.spacing[2],
  },
  categoriesContent: {
    paddingHorizontal: lightTheme.spacing[4],
    gap: lightTheme.spacing[2],
  },
  categoryButton: {
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
  // Results and Filters Styles
  resultsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
    marginBottom: lightTheme.spacing[2],
    borderRadius: lightTheme.borderRadius.xl,
  },
  resultsText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    fontWeight: lightTheme.typography.fontWeight.medium,
  },
  filtersButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: lightTheme.spacing[3],
    paddingVertical: lightTheme.spacing[2],
    borderRadius: lightTheme.borderRadius.lg,
    gap: lightTheme.spacing[1],
    borderWidth: 1,
    borderColor: "#3B82F6",
    backgroundColor: lightTheme.colors.white,
  },
  filtersButtonActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  filtersButtonText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: "#3B82F6",
  },
  filtersButtonTextActive: {
    color: lightTheme.colors.white,
  },
  filtersBadge: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.full,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  filtersBadgeText: {
    fontSize: 10,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: "#3B82F6",
  },
});
