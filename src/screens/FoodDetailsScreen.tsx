/**
 * FoodDetailsScreen - Tela de Detalhes do Alimento
 * Sprint 7 - Silvestra App
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { lightTheme } from "../theme";
import { useFoodsStore } from "../stores/foods.store";
import { Food } from "../types/food.types";
import NutrientChart from "../components/NutrientChart";
import {
  formatNutrient,
  formatCalories,
  formatPercentage,
  getCategoryColor,
  getNutrientGroups,
  calculateNutritionalScore,
  getScoreDescription,
} from "../utils/food.utils";

export default function FoodDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { foodId } = route.params as { foodId: string };

  const {
    favorites,
    toggleFavorite,
    getFoodById,
    addToComparison,
    comparisonList,
  } = useFoodsStore();

  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPortion, setSelectedPortion] = useState(100); // Porção em gramas

  useEffect(() => {
    loadFood();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foodId]);

  const loadFood = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFoodById(foodId);
      setFood(data);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar alimento");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToComparison = () => {
    if (comparisonList.includes(foodId)) {
      Alert.alert("Aviso", "Este alimento já está na lista de comparação");
      return;
    }

    if (comparisonList.length >= 5) {
      Alert.alert(
        "Limite atingido",
        "Você pode comparar no máximo 5 alimentos"
      );
      return;
    }

    addToComparison(foodId);
    Alert.alert("Sucesso", "Alimento adicionado à comparação");
  };

  const calculateNutrient = (
    value: number | null | undefined
  ): number | null => {
    if (value === null || value === undefined) return null;
    return (value * selectedPortion) / 100;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Carregando alimento...</Text>
      </SafeAreaView>
    );
  }

  if (error || !food) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>
          {error || "Alimento não encontrado"}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.errorButton}
        >
          <Text style={styles.errorButtonText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isFavorite = favorites.includes(foodId);
  const score = calculateNutritionalScore(food);
  const scoreInfo = getScoreDescription(score);
  const categoryColor = food.category?.name
    ? getCategoryColor(food.category.name)
    : "#6B7280";
  const nutrientGroups = getNutrientGroups(food);

  // Porções comuns
  const portions = [
    { label: "50g", value: 50 },
    { label: "100g", value: 100 },
    { label: "150g", value: 150 },
    { label: "200g", value: 200 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Food Info */}
        <View style={styles.foodInfoSection}>
          <View style={styles.foodHeaderRow}>
            <Text style={styles.foodTitle}>{food.name}</Text>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleAddToComparison}
                style={styles.iconButton}
              >
                <Ionicons name="git-compare" size={22} color="#3B82F6" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => toggleFavorite(foodId)}
                style={styles.iconButton}
              >
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={22}
                  color={isFavorite ? "#EF4444" : "#6B7280"}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.foodInfoRow}>
            {food.category && (
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: categoryColor },
                ]}
              >
                <Text style={styles.categoryText}>{food.category.name}</Text>
              </View>
            )}

            <View style={styles.scoreContainer}>
              <Ionicons name="star" size={18} color={scoreInfo.color} />
              <Text style={[styles.scoreText, { color: scoreInfo.color }]}>
                {scoreInfo.label} ({score}/100)
              </Text>
            </View>
          </View>
        </View>

        {/* Portion Selector */}
        <View style={styles.portionSection}>
          <Text style={styles.portionLabel}>Selecione a porção:</Text>
          <View style={styles.portionButtons}>
            {portions.map((portion) => (
              <TouchableOpacity
                key={portion.value}
                onPress={() => setSelectedPortion(portion.value)}
                style={[
                  styles.portionButton,
                  selectedPortion === portion.value &&
                    styles.portionButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.portionButtonText,
                    selectedPortion === portion.value &&
                      styles.portionButtonTextSelected,
                  ]}
                >
                  {portion.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Macronutrients Chart */}
        {food.percentages && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Composição Nutricional</Text>
            <NutrientChart percentages={food.percentages} />
          </View>
        )}

        {/* Calories & Macros */}
        <View style={styles.macrosSection}>
          <View style={styles.macrosHeaderColumn}>
            <Text style={styles.sectionTitle}>Informações Básicas</Text>
            <Text style={styles.macrosSubtitle}>Por {selectedPortion}g</Text>
          </View>

          <View style={styles.macrosRow}>
            <View style={[styles.macroCard, styles.caloriesCard]}>
              <Text style={styles.macroValue}>
                {formatCalories(calculateNutrient(food.energyKcal))}
              </Text>
              <Text style={styles.macroLabel}>Calorias</Text>
            </View>

            <View style={[styles.macroCard, styles.proteinCard]}>
              <Text style={[styles.macroValue, styles.proteinValue]}>
                {formatNutrient(calculateNutrient(food.protein))}
              </Text>
              <Text style={[styles.macroLabel, styles.proteinLabel]}>
                Proteínas
              </Text>
            </View>
          </View>

          <View style={styles.macrosRow}>
            <View style={[styles.macroCard, styles.carbsCard]}>
              <Text style={[styles.macroValue, styles.carbsValue]}>
                {formatNutrient(calculateNutrient(food.carbohydrate))}
              </Text>
              <Text style={[styles.macroLabel, styles.carbsLabel]}>
                Carboidratos
              </Text>
            </View>

            <View style={[styles.macroCard, styles.fatsCard]}>
              <Text style={[styles.macroValue, styles.fatsValue]}>
                {formatNutrient(calculateNutrient(food.lipids))}
              </Text>
              <Text style={[styles.macroLabel, styles.fatsLabel]}>
                Gorduras
              </Text>
            </View>

            <View style={[styles.macroCard, styles.fiberCard]}>
              <Text style={[styles.macroValue, styles.fiberValue]}>
                {formatNutrient(calculateNutrient(food.fiber))}
              </Text>
              <Text style={[styles.macroLabel, styles.fiberLabel]}>Fibras</Text>
            </View>
          </View>
        </View>

        {/* Detailed Nutrients */}
        {nutrientGroups.map((group, index) => (
          <View key={index} style={styles.nutrientGroupSection}>
            <View style={styles.nutrientGroupHeader}>
              <View
                style={[
                  styles.nutrientIcon,
                  { backgroundColor: `${group.color}20` },
                ]}
              >
                <Ionicons
                  name={group.icon as any}
                  size={20}
                  color={group.color}
                />
              </View>
              <Text style={styles.nutrientGroupTitle}>{group.title}</Text>
            </View>

            {group.nutrients.map((nutrient, idx) => {
              const adjustedValue = calculateNutrient(nutrient.value);
              if (adjustedValue === null && nutrient.value === null)
                return null;

              return (
                <View key={idx} style={styles.nutrientRow}>
                  <Text style={styles.nutrientName}>{nutrient.name}</Text>
                  <View style={styles.nutrientValueContainer}>
                    <Text style={styles.nutrientValue}>
                      {formatNutrient(adjustedValue, nutrient.unit)}
                    </Text>
                    {nutrient.dailyValue !== undefined &&
                      nutrient.dailyValue > 0 && (
                        <Text style={styles.nutrientDV}>
                          {formatPercentage(
                            (nutrient.dailyValue * selectedPortion) / 100
                          )}{" "}
                          VD
                        </Text>
                      )}
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        {/* Abbreviations Legend */}
        <View style={styles.legendSection}>
          <Text style={styles.legendTitle}>Legenda de Siglas</Text>
          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <Text style={styles.legendAbbr}>g</Text>
              <Text style={styles.legendDesc}>Gramas</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendAbbr}>mg</Text>
              <Text style={styles.legendDesc}>Miligramas</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendAbbr}>µg</Text>
              <Text style={styles.legendDesc}>Microgramas</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendAbbr}>kcal</Text>
              <Text style={styles.legendDesc}>Quilocalorias</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendAbbr}>VD</Text>
              <Text style={styles.legendDesc}>
                Valor Diário (% recomendado)
              </Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendAbbr}>Tr</Text>
              <Text style={styles.legendDesc}>
                Traços (quantidade muito pequena)
              </Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendAbbr}>N/D</Text>
              <Text style={styles.legendDesc}>Não disponível</Text>
            </View>
          </View>
        </View>

        {/* Footer Note */}
        <View style={styles.footerSection}>
          <Text style={styles.footerText}>
            VD = Valores Diários de referência com base em uma dieta de 2000
            kcal
          </Text>
          <Text style={styles.footerTextMargin}>
            Fonte: Tabela TACO - UNICAMP
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Loading & Error States
  loadingContainer: {
    flex: 1,
    backgroundColor: lightTheme.colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: lightTheme.colors.gray[600],
    marginTop: lightTheme.spacing[4],
  },
  errorContainer: {
    flex: 1,
    backgroundColor: lightTheme.colors.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: lightTheme.spacing[8],
  },
  errorTitle: {
    color: lightTheme.colors.gray[900],
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    marginTop: lightTheme.spacing[4],
    textAlign: "center",
  },
  errorButton: {
    marginTop: lightTheme.spacing[6],
    backgroundColor: "#3B82F6",
    paddingHorizontal: lightTheme.spacing[6],
    paddingVertical: lightTheme.spacing[3],
    borderRadius: 8,
  },
  errorButtonText: {
    color: lightTheme.colors.white,
    fontWeight: lightTheme.typography.fontWeight.medium,
  },

  // Container & Header
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[50],
  },
  header: {
    backgroundColor: lightTheme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: lightTheme.spacing[2],
    marginLeft: -lightTheme.spacing[2],
  },
  headerActions: {
    flexDirection: "row",
    gap: lightTheme.spacing[2],
  },
  iconButton: {
    padding: lightTheme.spacing[2],
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },

  // Food Info Section
  foodInfoSection: {
    backgroundColor: lightTheme.colors.white,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[6],
    marginBottom: lightTheme.spacing[3],
  },
  foodHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: lightTheme.spacing[2],
  },
  foodTitle: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize["2xl"],
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
    marginRight: lightTheme.spacing[2],
  },
  foodInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: lightTheme.spacing[3],
  },
  categoryBadge: {
    paddingHorizontal: lightTheme.spacing[3],
    paddingVertical: 6,
    borderRadius: 9999,
  },
  categoryText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreText: {
    marginLeft: lightTheme.spacing[1],
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
  },

  // Portion Selector
  portionSection: {
    backgroundColor: lightTheme.colors.white,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[3],
  },
  portionLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[700],
    marginBottom: lightTheme.spacing[3],
  },
  portionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  portionButton: {
    flex: 1,
    marginHorizontal: lightTheme.spacing[1],
    paddingVertical: lightTheme.spacing[3],
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: lightTheme.colors.white,
    borderColor: lightTheme.colors.gray[300],
  },
  portionButtonSelected: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  portionButtonText: {
    textAlign: "center",
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[700],
  },
  portionButtonTextSelected: {
    color: lightTheme.colors.white,
  },

  // Chart Section
  chartSection: {
    backgroundColor: lightTheme.colors.white,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[6],
    marginBottom: lightTheme.spacing[3],
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing[4],
    textAlign: "center",
    width: "100%",
  },

  // Macros Section
  macrosSection: {
    backgroundColor: lightTheme.colors.white,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[3],
  },
  macrosHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: lightTheme.spacing[4],
  },
  macrosHeaderColumn: {
    flexDirection: "column",
    marginBottom: lightTheme.spacing[4],
  },
  macrosSubtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
    marginTop: lightTheme.spacing[1],
  },
  macrosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: lightTheme.spacing[3],
  },
  macroCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: lightTheme.spacing[4],
    borderRadius: 8,
    marginHorizontal: lightTheme.spacing[1],
  },
  caloriesCard: {
    backgroundColor: lightTheme.colors.gray[50],
    marginRight: lightTheme.spacing[2],
    marginLeft: 0,
  },
  proteinCard: {
    backgroundColor: "#F0FDF4",
  },
  carbsCard: {
    backgroundColor: "#EFF6FF",
    marginRight: lightTheme.spacing[2],
    marginLeft: 0,
  },
  fatsCard: {
    backgroundColor: "#FFF7ED",
  },
  fiberCard: {
    backgroundColor: "#FAF5FF",
    marginLeft: lightTheme.spacing[2],
    marginRight: 0,
  },
  macroValue: {
    fontSize: lightTheme.typography.fontSize["2xl"],
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
  },
  macroLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginTop: lightTheme.spacing[1],
  },
  proteinValue: {
    color: "#15803D",
  },
  proteinLabel: {
    color: "#16A34A",
  },
  carbsValue: {
    color: "#1D4ED8",
  },
  carbsLabel: {
    color: "#2563EB",
  },
  fatsValue: {
    color: "#C2410C",
  },
  fatsLabel: {
    color: "#EA580C",
  },
  fiberValue: {
    color: "#6B21A8",
  },
  fiberLabel: {
    color: "#9333EA",
  },

  // Nutrient Groups
  nutrientGroupSection: {
    backgroundColor: lightTheme.colors.white,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[3],
  },
  nutrientGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: lightTheme.spacing[4],
  },
  nutrientIcon: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    marginRight: lightTheme.spacing[3],
  },
  nutrientGroupTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
  },
  nutrientRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: lightTheme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  nutrientName: {
    color: lightTheme.colors.gray[700],
    flex: 1,
  },
  nutrientValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  nutrientValue: {
    color: lightTheme.colors.gray[900],
    fontWeight: lightTheme.typography.fontWeight.semibold,
    marginRight: lightTheme.spacing[2],
  },
  nutrientDV: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    width: 64,
    textAlign: "right",
  },

  // Abbreviations Legend
  legendSection: {
    backgroundColor: lightTheme.colors.white,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[6],
    marginBottom: lightTheme.spacing[3],
  },
  legendTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing[4],
    textAlign: "center",
  },
  legendGrid: {
    gap: lightTheme.spacing[3],
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: lightTheme.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  legendAbbr: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.primary,
    width: 60,
  },
  legendDesc: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[700],
  },

  // Footer
  footerSection: {
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[6],
  },
  footerText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    textAlign: "center",
  },
  footerTextMargin: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    textAlign: "center",
    marginTop: lightTheme.spacing[2],
  },
});
