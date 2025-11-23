/**
 * SubstitutionItem Component
 *
 * Exibe um alimento substituto de um item de refeição
 * Mostra nome, quantidade, informações nutricionais e botão de remover
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../theme";
import {
  MealItemSubstitution,
  SubstitutionBuilderItem,
} from "../types/meal-plan.types";
import { formatCalories, formatMacro } from "../utils/meal-plan.utils";

interface SubstitutionItemProps {
  substitution: MealItemSubstitution | SubstitutionBuilderItem;
  onRemove?: () => void;
  showRemoveButton?: boolean;
}

export default function SubstitutionItem({
  substitution,
  onRemove,
  showRemoveButton = true,
}: SubstitutionItemProps) {
  // Helper function to format quantity
  const formatQuantity = (): string => {
    const isMealItemSubstitution = "measurementType" in substitution;

    if (isMealItemSubstitution) {
      const sub = substitution as MealItemSubstitution;
      // Aceitar tanto "CASEIRA" quanto "caseira"
      const isCaseiraType = sub.measurementType?.toUpperCase() === "CASEIRA";
      if (isCaseiraType && sub.measurementUnit) {
        const totalGrams = sub.quantity || 0;
        const measureName =
          sub.measurementUnit.name ||
          sub.measurementUnit.abbreviation ||
          "medida";

        // Use originalQuantity if available, otherwise calculate
        const quantityInUnits =
          (sub as any).originalQuantity !== undefined
            ? (sub as any).originalQuantity
            : (() => {
                const gramsPerUnit =
                  (sub.measurementUnit as any).grams ||
                  (sub.measurementUnit as any).gramsEquivalent ||
                  0;
                return gramsPerUnit > 0 ? totalGrams / gramsPerUnit : 0;
              })();

        return `${quantityInUnits} ${measureName} (${totalGrams.toFixed(0)}g)`;
      }
      return `${(sub.quantity || 0).toFixed(0)}g`;
    } else {
      // SubstitutionBuilderItem
      const sub = substitution as SubstitutionBuilderItem;
      if (sub.measurementType === "caseira" && sub.measurementUnit) {
        const totalGrams = sub.quantity || 0;
        const measureName =
          sub.measurementUnit.name ||
          sub.measurementUnit.abbreviation ||
          "medida";

        // Use originalQuantity if available, otherwise calculate
        const quantityInUnits =
          sub.originalQuantity !== undefined
            ? sub.originalQuantity
            : (() => {
                const gramsPerUnit =
                  (sub.measurementUnit as any).grams ||
                  (sub.measurementUnit as any).gramsEquivalent ||
                  0;
                return gramsPerUnit > 0 ? totalGrams / gramsPerUnit : 0;
              })();

        return `${quantityInUnits} ${measureName} (${totalGrams.toFixed(0)}g)`;
      }
      return `${(sub.quantity || 0).toFixed(0)}g`;
    }
  };

  // Get food name
  const getFoodName = (): string => {
    if ("food" in substitution && substitution.food) {
      return substitution.food.name;
    }
    if ("foodName" in substitution) {
      return substitution.foodName;
    }
    return "Alimento desconhecido";
  };

  return (
    <View style={styles.container}>
      {/* Header com ícone e nome */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="swap-horizontal" size={14} color="#8B5CF6" />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.foodName} numberOfLines={2}>
            {getFoodName()}
          </Text>
        </View>

        {/* Botão de remover */}
        {showRemoveButton && onRemove && (
          <TouchableOpacity
            onPress={onRemove}
            style={styles.removeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={lightTheme.colors.error}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Quantidade/Medida */}
      <View style={styles.quantityRow}>
        <Text style={styles.quantity}>{formatQuantity()}</Text>
      </View>

      {/* Informações Nutricionais - formato compacto */}
      <View style={styles.nutritionRow}>
        <Text style={styles.nutritionText}>
          {formatCalories(substitution.calories)} • P:{" "}
          {formatMacro(substitution.protein)} • C:{" "}
          {formatMacro(substitution.carbs)} • G: {formatMacro(substitution.fat)}
        </Text>
      </View>

      {/* Observação (se houver) */}
      {substitution.observation && (
        <Text style={styles.observation} numberOfLines={2}>
          💬 {substitution.observation}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightTheme.colors.white,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing[3],
    marginBottom: lightTheme.spacing[2],
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: "#F5F3FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: lightTheme.spacing[2],
  },
  headerContent: {
    flex: 1,
  },
  foodName: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
    lineHeight: 18,
  },
  quantityRow: {
    marginTop: lightTheme.spacing[2],
    marginLeft: 32, // Alinha com o texto do nome (ícone 24px + margin 8px)
  },
  quantity: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.primary,
  },
  removeButton: {
    padding: lightTheme.spacing[1],
    marginLeft: lightTheme.spacing[2],
  },
  nutritionRow: {
    marginTop: lightTheme.spacing[2],
    marginLeft: 32, // Alinha com o texto do nome
  },
  nutritionText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
  },
  observation: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
    marginTop: lightTheme.spacing[2],
    marginLeft: 32, // Alinha com o texto do nome
    fontStyle: "italic",
  },
});
