import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../theme";
import {
  formatCalories,
  formatMacro,
  formatFoodQuantity,
  getMealTypeIcon,
  getMealTypeColor,
  getMacroColor,
} from "../utils/meal-plan.utils";

interface MealPlanDayViewProps {
  meals: any[];
  onFoodItemPress: (item: any, meal: any) => void;
}

export function MealPlanDayView({
  meals,
  onFoodItemPress,
}: MealPlanDayViewProps) {
  if (!meals || meals.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="restaurant-outline"
          size={48}
          color={lightTheme.colors.gray[300]}
        />
        <Text style={styles.emptyText}>Nenhuma refeição neste dia</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {meals.map((meal, mealIndex) => (
        <View key={meal.id} style={styles.mealCard}>
          {/* Meal Header - Compact */}
          <View style={styles.mealHeader}>
            <View style={styles.mealHeaderLeft}>
              <View
                style={[
                  styles.mealIconContainer,
                  { backgroundColor: getMealTypeColor(meal.type) + "15" },
                ]}
              >
                <Text style={{ fontSize: 20 }}>
                  {getMealTypeIcon(meal.type)}
                </Text>
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <View style={styles.mealMeta}>
                  {meal.time && (
                    <>
                      <Ionicons
                        name="time-outline"
                        size={12}
                        color={lightTheme.colors.gray[500]}
                      />
                      <Text style={styles.mealMetaText}>{meal.time}</Text>
                      <Text style={styles.mealMetaText}>•</Text>
                    </>
                  )}
                  <Text style={styles.mealMetaText}>
                    {meal.items.length}{" "}
                    {meal.items.length === 1 ? "item" : "itens"}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.mealCalorieBadge}>
              <Ionicons
                name="flame"
                size={12}
                color={lightTheme.colors.error}
              />
              <Text style={styles.mealCalorieText}>
                {formatCalories(meal.nutrition.totalCalories)}
              </Text>
            </View>
          </View>

          {/* Food Items - Compact Cards */}
          <View style={styles.foodItemsContainer}>
            {meal.items.map((item: any, itemIndex: number) => (
              <TouchableOpacity
                key={itemIndex}
                onPress={() => onFoodItemPress(item, meal)}
                style={styles.compactFoodCard}
                activeOpacity={0.7}
              >
                <View style={styles.compactFoodHeader}>
                  <View style={styles.compactFoodLeft}>
                    <Text style={styles.compactFoodName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.compactFoodQuantity}>
                      {formatFoodQuantity(item)}
                    </Text>
                  </View>
                  <View style={styles.compactFoodRight}>
                    <View style={styles.compactCalorieBadge}>
                      <Ionicons
                        name="flame"
                        size={10}
                        color={lightTheme.colors.error}
                      />
                      <Text style={styles.compactCalorieText}>
                        {formatCalories(item.calories)}
                      </Text>
                    </View>
                    {item.substitutions && item.substitutions.length > 0 && (
                      <View style={styles.substitutionBadge}>
                        <Ionicons
                          name="swap-horizontal"
                          size={10}
                          color={lightTheme.colors.success}
                        />
                        <Text style={styles.substitutionBadgeText}>
                          {item.substitutions.length}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Mini Macros Bar */}
                <View style={styles.miniMacrosBar}>
                  <View style={[styles.miniMacro, { flex: item.protein }]}>
                    <View
                      style={[
                        styles.miniMacroFill,
                        { backgroundColor: getMacroColor("protein") },
                      ]}
                    />
                  </View>
                  <View style={[styles.miniMacro, { flex: item.carbs }]}>
                    <View
                      style={[
                        styles.miniMacroFill,
                        { backgroundColor: getMacroColor("carbs") },
                      ]}
                    />
                  </View>
                  <View style={[styles.miniMacro, { flex: item.fat }]}>
                    <View
                      style={[
                        styles.miniMacroFill,
                        { backgroundColor: getMacroColor("fat") },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.compactMacros}>
                  <Text style={styles.compactMacroText}>
                    P: {formatMacro(item.protein)}
                  </Text>
                  <Text style={styles.compactMacroSeparator}>•</Text>
                  <Text style={styles.compactMacroText}>
                    C: {formatMacro(item.carbs)}
                  </Text>
                  <Text style={styles.compactMacroSeparator}>•</Text>
                  <Text style={styles.compactMacroText}>
                    G: {formatMacro(item.fat)}
                  </Text>
                </View>

                {item.observation && (
                  <View style={styles.compactObservation}>
                    <Ionicons
                      name="information-circle"
                      size={10}
                      color={lightTheme.colors.info}
                    />
                    <Text
                      style={styles.compactObservationText}
                      numberOfLines={1}
                    >
                      {item.observation}
                    </Text>
                  </View>
                )}

                <View style={styles.tapIndicator}>
                  <Text style={styles.tapIndicatorText}>
                    Toque para ver detalhes
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={12}
                    color={lightTheme.colors.gray[400]}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: lightTheme.spacing[12],
  },
  emptyText: {
    marginTop: lightTheme.spacing[4],
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[400],
  },
  mealCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.xl,
    marginBottom: lightTheme.spacing[3],
    overflow: "hidden",
    ...lightTheme.shadows.sm,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: lightTheme.spacing[4],
    backgroundColor: lightTheme.colors.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  mealHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  mealIconContainer: {
    width: 40,
    height: 40,
    borderRadius: lightTheme.borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: lightTheme.spacing[3],
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
    marginBottom: 2,
  },
  mealMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  mealMetaText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
  },
  mealCalorieBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.error + "15",
    paddingHorizontal: lightTheme.spacing[2],
    paddingVertical: 6,
    borderRadius: lightTheme.borderRadius.full,
    gap: 4,
  },
  mealCalorieText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.error,
  },
  foodItemsContainer: {
    padding: lightTheme.spacing[3],
    gap: lightTheme.spacing[2],
  },
  compactFoodCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing[3],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
  },
  compactFoodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: lightTheme.spacing[2],
  },
  compactFoodLeft: {
    flex: 1,
    marginRight: lightTheme.spacing[2],
  },
  compactFoodName: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
    marginBottom: 2,
  },
  compactFoodQuantity: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
  },
  compactFoodRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[1],
  },
  compactCalorieBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.error + "10",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: lightTheme.borderRadius.sm,
    gap: 3,
  },
  compactCalorieText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.error,
  },
  substitutionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.success + "10",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: lightTheme.borderRadius.sm,
    gap: 2,
  },
  substitutionBadgeText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.success,
  },
  miniMacrosBar: {
    flexDirection: "row",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: lightTheme.spacing[2],
    gap: 1,
  },
  miniMacro: {
    backgroundColor: lightTheme.colors.gray[100],
  },
  miniMacroFill: {
    flex: 1,
    borderRadius: 2,
  },
  compactMacros: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[1],
    marginBottom: lightTheme.spacing[1],
  },
  compactMacroText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
  },
  compactMacroSeparator: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[300],
  },
  compactObservation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: lightTheme.spacing[1],
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[100],
    marginTop: lightTheme.spacing[1],
  },
  compactObservationText: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.info,
    fontStyle: "italic",
  },
  tapIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: lightTheme.spacing[2],
    paddingTop: lightTheme.spacing[2],
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[100],
  },
  tapIndicatorText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[400],
  },
});
