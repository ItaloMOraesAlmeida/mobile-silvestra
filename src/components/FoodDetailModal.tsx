import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../theme";
import {
  formatCalories,
  formatMacro,
  formatFoodQuantity,
  getMacroColor,
} from "../utils/meal-plan.utils";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface FoodDetailModalProps {
  visible: boolean;
  foodItem: any;
  mealInfo?: any;
  onClose: () => void;
}

export function FoodDetailModal({
  visible,
  foodItem,
  mealInfo,
  onClose,
}: FoodDetailModalProps) {
  if (!foodItem) return null;

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
          <View style={styles.modalHeader}>
            <View style={styles.modalDragIndicator} />
            <View style={styles.modalTitleContainer}>
              <View style={styles.modalTitleContent}>
                <Text style={styles.modalTitle}>{foodItem.name}</Text>
                {foodItem.category && (
                  <Text style={styles.modalSubtitle}>{foodItem.category}</Text>
                )}
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons
                  name="close"
                  size={24}
                  color={lightTheme.colors.gray[600]}
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.modalScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Quantity Card */}
            <View style={styles.quantityCard}>
              <View style={styles.quantityHeader}>
                <Ionicons
                  name="scale-outline"
                  size={20}
                  color={lightTheme.colors.primary}
                />
                <Text style={styles.quantityTitle}>Quantidade</Text>
              </View>
              <Text style={styles.quantityValue}>
                {formatFoodQuantity(foodItem)}
              </Text>
            </View>

            {/* Nutrition Summary */}
            <View style={styles.nutritionCard}>
              <View style={styles.nutritionHeader}>
                <Ionicons
                  name="nutrition-outline"
                  size={20}
                  color={lightTheme.colors.success}
                />
                <Text style={styles.nutritionTitle}>
                  Informação Nutricional
                </Text>
              </View>

              {/* Calories */}
              <View style={styles.calorieCard}>
                <Ionicons
                  name="flame"
                  size={24}
                  color={lightTheme.colors.error}
                />
                <View style={styles.calorieInfo}>
                  <Text style={styles.calorieLabel}>Energia</Text>
                  <Text style={styles.calorieValue}>
                    {formatCalories(foodItem.calories)}
                  </Text>
                </View>
              </View>

              {/* Macros Grid */}
              <View style={styles.macrosGrid}>
                <View style={styles.macroCard}>
                  <View
                    style={[
                      styles.macroIcon,
                      { backgroundColor: getMacroColor("protein") + "15" },
                    ]}
                  >
                    <Ionicons
                      name="fitness-outline"
                      size={20}
                      color={getMacroColor("protein")}
                    />
                  </View>
                  <Text style={styles.macroLabel}>Proteína</Text>
                  <Text
                    style={[
                      styles.macroValue,
                      { color: getMacroColor("protein") },
                    ]}
                  >
                    {formatMacro(foodItem.protein)}
                  </Text>
                </View>

                <View style={styles.macroCard}>
                  <View
                    style={[
                      styles.macroIcon,
                      { backgroundColor: getMacroColor("carbs") + "15" },
                    ]}
                  >
                    <Ionicons
                      name="leaf-outline"
                      size={20}
                      color={getMacroColor("carbs")}
                    />
                  </View>
                  <Text style={styles.macroLabel}>Carboidrato</Text>
                  <Text
                    style={[
                      styles.macroValue,
                      { color: getMacroColor("carbs") },
                    ]}
                  >
                    {formatMacro(foodItem.carbs)}
                  </Text>
                </View>

                <View style={styles.macroCard}>
                  <View
                    style={[
                      styles.macroIcon,
                      { backgroundColor: getMacroColor("fat") + "15" },
                    ]}
                  >
                    <Ionicons
                      name="water-outline"
                      size={20}
                      color={getMacroColor("fat")}
                    />
                  </View>
                  <Text style={styles.macroLabel}>Gordura</Text>
                  <Text
                    style={[styles.macroValue, { color: getMacroColor("fat") }]}
                  >
                    {formatMacro(foodItem.fat)}
                  </Text>
                </View>

                <View style={styles.macroCard}>
                  <View
                    style={[
                      styles.macroIcon,
                      { backgroundColor: lightTheme.colors.success + "15" },
                    ]}
                  >
                    <Ionicons
                      name="leaf"
                      size={20}
                      color={lightTheme.colors.success}
                    />
                  </View>
                  <Text style={styles.macroLabel}>Fibra</Text>
                  <Text
                    style={[
                      styles.macroValue,
                      { color: lightTheme.colors.success },
                    ]}
                  >
                    {formatMacro(foodItem.fiber)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Observation */}
            {foodItem.observation && (
              <View style={styles.observationCard}>
                <View style={styles.observationHeader}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={18}
                    color={lightTheme.colors.info}
                  />
                  <Text style={styles.observationTitle}>Observação</Text>
                </View>
                <Text style={styles.observationText}>
                  {foodItem.observation}
                </Text>
              </View>
            )}

            {/* Substitutions */}
            {foodItem.substitutions && foodItem.substitutions.length > 0 && (
              <View style={styles.substitutionsCard}>
                <View style={styles.substitutionsHeader}>
                  <Ionicons
                    name="swap-horizontal"
                    size={20}
                    color={lightTheme.colors.success}
                  />
                  <Text style={styles.substitutionsTitle}>
                    Opções de Substituição ({foodItem.substitutions.length})
                  </Text>
                </View>

                {foodItem.substitutions.map((sub: any, index: number) => (
                  <View key={index} style={styles.substitutionItem}>
                    <View style={styles.substitutionHeader}>
                      <View style={styles.substitutionLeft}>
                        <Text style={styles.substitutionName}>{sub.name}</Text>
                        <Text style={styles.substitutionQuantity}>
                          {formatFoodQuantity(sub)}
                        </Text>
                      </View>
                      <View style={styles.substitutionCalories}>
                        <Ionicons
                          name="flame"
                          size={12}
                          color={lightTheme.colors.error}
                        />
                        <Text style={styles.substitutionCaloriesText}>
                          {formatCalories(sub.calories)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.substitutionMacros}>
                      <View style={styles.substitutionMacro}>
                        <Text style={styles.substitutionMacroLabel}>P</Text>
                        <Text
                          style={[
                            styles.substitutionMacroValue,
                            { color: getMacroColor("protein") },
                          ]}
                        >
                          {formatMacro(sub.protein)}
                        </Text>
                      </View>
                      <View style={styles.substitutionMacro}>
                        <Text style={styles.substitutionMacroLabel}>C</Text>
                        <Text
                          style={[
                            styles.substitutionMacroValue,
                            { color: getMacroColor("carbs") },
                          ]}
                        >
                          {formatMacro(sub.carbs)}
                        </Text>
                      </View>
                      <View style={styles.substitutionMacro}>
                        <Text style={styles.substitutionMacroLabel}>G</Text>
                        <Text
                          style={[
                            styles.substitutionMacroValue,
                            { color: getMacroColor("fat") },
                          ]}
                        >
                          {formatMacro(sub.fat)}
                        </Text>
                      </View>
                      <View style={styles.substitutionMacro}>
                        <Text style={styles.substitutionMacroLabel}>F</Text>
                        <Text
                          style={[
                            styles.substitutionMacroValue,
                            { color: lightTheme.colors.success },
                          ]}
                        >
                          {formatMacro(sub.fiber)}
                        </Text>
                      </View>
                    </View>

                    {sub.observation && (
                      <Text style={styles.substitutionObservation}>
                        💡 {sub.observation}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Bottom spacing */}
            <View style={{ height: lightTheme.spacing[8] }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: lightTheme.colors.white,
    borderTopLeftRadius: lightTheme.borderRadius["2xl"],
    borderTopRightRadius: lightTheme.borderRadius["2xl"],
    height: SCREEN_HEIGHT * 0.85,
    maxHeight: SCREEN_HEIGHT * 0.85,
    ...lightTheme.shadows.lg,
  },
  modalHeader: {
    padding: lightTheme.spacing[4],
    paddingTop: lightTheme.spacing[3],
    paddingBottom: lightTheme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  modalDragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: lightTheme.colors.gray[300],
    alignSelf: "center",
    marginBottom: lightTheme.spacing[4],
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  modalTitleContent: {
    flex: 1,
    marginRight: lightTheme.spacing[3],
  },
  modalTitle: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing[1],
  },
  modalSubtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
  },
  closeButton: {
    padding: lightTheme.spacing[2],
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.full,
  },
  modalScroll: {
    flex: 1,
  },
  quantityCard: {
    backgroundColor: lightTheme.colors.primary + "10",
    margin: lightTheme.spacing[4],
    padding: lightTheme.spacing[4],
    borderRadius: lightTheme.borderRadius.xl,
  },
  quantityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[2],
    marginBottom: lightTheme.spacing[2],
  },
  quantityTitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.primary,
  },
  quantityValue: {
    fontSize: lightTheme.typography.fontSize["2xl"],
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
  },
  nutritionCard: {
    marginHorizontal: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[4],
  },
  nutritionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[2],
    marginBottom: lightTheme.spacing[3],
  },
  nutritionTitle: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
  },
  calorieCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.error + "10",
    padding: lightTheme.spacing[4],
    borderRadius: lightTheme.borderRadius.lg,
    marginBottom: lightTheme.spacing[3],
    gap: lightTheme.spacing[3],
  },
  calorieInfo: {
    flex: 1,
  },
  calorieLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginBottom: 4,
  },
  calorieValue: {
    fontSize: lightTheme.typography.fontSize["2xl"],
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.error,
  },
  macrosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: lightTheme.spacing[2],
  },
  macroCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: lightTheme.colors.gray[50],
    padding: lightTheme.spacing[3],
    borderRadius: lightTheme.borderRadius.lg,
    alignItems: "center",
  },
  macroIcon: {
    width: 40,
    height: 40,
    borderRadius: lightTheme.borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: lightTheme.spacing[2],
  },
  macroLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
    marginBottom: 4,
  },
  macroValue: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold,
  },
  observationCard: {
    marginHorizontal: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[4],
    backgroundColor: lightTheme.colors.info + "10",
    padding: lightTheme.spacing[4],
    borderRadius: lightTheme.borderRadius.lg,
  },
  observationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[2],
    marginBottom: lightTheme.spacing[2],
  },
  observationTitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.info,
  },
  observationText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[700],
    lineHeight: 20,
  },
  substitutionsCard: {
    marginHorizontal: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[4],
  },
  substitutionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[2],
    marginBottom: lightTheme.spacing[3],
  },
  substitutionsTitle: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.success,
  },
  substitutionItem: {
    backgroundColor: lightTheme.colors.success + "08",
    padding: lightTheme.spacing[4],
    borderRadius: lightTheme.borderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: lightTheme.colors.success,
    marginBottom: lightTheme.spacing[2],
  },
  substitutionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: lightTheme.spacing[2],
  },
  substitutionLeft: {
    flex: 1,
    marginRight: lightTheme.spacing[2],
  },
  substitutionName: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
    marginBottom: 4,
  },
  substitutionQuantity: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
  },
  substitutionCalories: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.error + "15",
    paddingHorizontal: lightTheme.spacing[2],
    paddingVertical: 4,
    borderRadius: lightTheme.borderRadius.sm,
    gap: 4,
  },
  substitutionCaloriesText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.error,
  },
  substitutionMacros: {
    flexDirection: "row",
    gap: lightTheme.spacing[3],
    paddingTop: lightTheme.spacing[2],
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[200],
  },
  substitutionMacro: {
    flex: 1,
    alignItems: "center",
  },
  substitutionMacroLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginBottom: 2,
  },
  substitutionMacroValue: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.bold,
  },
  substitutionObservation: {
    marginTop: lightTheme.spacing[2],
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
    fontStyle: "italic",
  },
});
