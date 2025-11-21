/**
 * Tela de Lista de Compras
 * Sprint 8-9 - Meal Plans Module
 *
 * Lista de compras gerada automaticamente a partir do plano alimentar:
 * - Alimentos agrupados por categoria
 * - Quantidades totais agregadas
 * - Checkbox para marcar itens comprados
 * - Compartilhamento da lista
 */

import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMealPlansStore } from "../stores/meal-plans.store";
import { formatGrams } from "../utils/meal-plan.utils";

interface Props {
  navigation: any;
  route: any;
}

export default function ShoppingListScreen({ navigation, route }: Props) {
  const {
    shoppingList,
    generateShoppingList,
    toggleShoppingItem,
    clearShoppingList,
    loading,
    error,
  } = useMealPlansStore();

  const planId = route?.params?.planId;

  useEffect(() => {
    if (planId && !shoppingList) {
      generateShoppingList(planId);
    }
  }, [planId, shoppingList, generateShoppingList]);

  const handleGenerateList = async () => {
    if (!planId) return;

    try {
      await generateShoppingList(planId);
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao gerar lista de compras");
    }
  };

  const handleRefresh = async () => {
    if (!planId) return;
    await handleGenerateList();
  };

  const handleToggleItem = async (itemId: string) => {
    try {
      await toggleShoppingItem(itemId);
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao atualizar item");
    }
  };

  const handleClearChecked = () => {
    Alert.alert(
      "Limpar Comprados",
      "Deseja remover todos os itens marcados como comprados?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar",
          style: "destructive",
          onPress: () => {
            // TODO: Implementar limpeza de itens marcados
            Alert.alert(
              "Em Desenvolvimento",
              "Recurso será implementado em breve"
            );
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!shoppingList) return;

    const categoriesText = shoppingList.categories
      .map((category) => {
        const items = category.items
          .map(
            (item) =>
              `  ${item.checked ? "☑" : "☐"} ${item.foodName} - ${formatGrams(
                item.totalQuantity
              )}`
          )
          .join("\n");
        return `\n📁 ${category.category} (${category.totalItems} itens)\n${items}`;
      })
      .join("\n");

    const message = `
🛒 Lista de Compras
📋 Plano: ${shoppingList.planName}

📊 Total: ${shoppingList.totalItems} itens
✓ Comprados: ${shoppingList.checkedItems} itens

${categoriesText}

---
Gerado pelo Silvestra App 🌿
    `.trim();

    try {
      await Share.share({
        message,
        title: `Lista de Compras - ${shoppingList.planName}`,
      });
    } catch (err) {
      console.error("Erro ao compartilhar:", err);
    }
  };

  const handleClose = () => {
    clearShoppingList();
    navigation.goBack();
  };

  if (loading && !shoppingList) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#10B981" />
        <Text className="text-gray-500 mt-4">Gerando lista de compras...</Text>
      </SafeAreaView>
    );
  }

  if (error || !shoppingList) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-4">
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-red-600 text-lg font-semibold mt-4">
          Erro ao carregar lista
        </Text>
        <Text className="text-gray-500 text-center mt-2">
          {error || "Lista de compras não encontrada"}
        </Text>
        <TouchableOpacity
          onPress={handleRefresh}
          className="bg-green-600 px-6 py-3 rounded-xl mt-6"
        >
          <Text className="text-white font-semibold">Tentar Novamente</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const progressPercentage =
    shoppingList.totalItems > 0
      ? (shoppingList.checkedItems / shoppingList.totalItems) * 100
      : 0;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={handleClose}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">
          Lista de Compras
        </Text>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color="#10B981" />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View className="bg-gradient-to-br from-green-50 to-emerald-50 mx-4 mt-4 p-4 rounded-2xl border border-green-100">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-lg font-bold text-gray-900 mb-1">
              🛒 {shoppingList.planName}
            </Text>
            <Text className="text-sm text-gray-600">
              {shoppingList.totalItems} itens • {shoppingList.checkedItems}{" "}
              comprados
            </Text>
          </View>
          <View className="bg-white rounded-full px-4 py-2">
            <Text className="text-xl font-bold text-green-600">
              {progressPercentage.toFixed(0)}%
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View className="bg-gray-200 h-2 rounded-full overflow-hidden">
          <View
            className="h-full bg-green-500 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View className="flex-row px-4 mt-4 gap-3">
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={loading}
          className="flex-1 bg-blue-50 border border-blue-200 py-3 rounded-xl flex-row items-center justify-center"
        >
          <Ionicons name="refresh-outline" size={18} color="#3B82F6" />
          <Text className="text-blue-600 text-sm font-medium ml-2">
            Atualizar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleClearChecked}
          disabled={shoppingList.checkedItems === 0}
          className={`flex-1 py-3 rounded-xl flex-row items-center justify-center ${
            shoppingList.checkedItems === 0
              ? "bg-gray-100 border border-gray-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color={shoppingList.checkedItems === 0 ? "#9CA3AF" : "#EF4444"}
          />
          <Text
            className={`text-sm font-medium ml-2 ${
              shoppingList.checkedItems === 0 ? "text-gray-400" : "text-red-600"
            }`}
          >
            Limpar Comprados
          </Text>
        </TouchableOpacity>
      </View>

      {/* Shopping List by Categories */}
      <ScrollView className="flex-1 px-4 mt-4">
        {shoppingList.categories.map((category, categoryIndex) => (
          <View key={categoryIndex} className="mb-4">
            {/* Category Header */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-semibold text-gray-900">
                📁 {category.category}
              </Text>
              <View className="bg-gray-100 px-3 py-1 rounded-full">
                <Text className="text-xs text-gray-600">
                  {category.totalItems} itens
                </Text>
              </View>
            </View>

            {/* Category Items */}
            <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {category.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleToggleItem(item.id)}
                  className={`flex-row items-center justify-between p-4 ${
                    itemIndex < category.items.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  } ${item.checked ? "bg-gray-50" : "bg-white"}`}
                  activeOpacity={0.7}
                >
                  {/* Checkbox */}
                  <View
                    className={`w-6 h-6 rounded-lg border-2 items-center justify-center mr-3 ${
                      item.checked
                        ? "bg-green-500 border-green-500"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    {item.checked && (
                      <Ionicons name="checkmark" size={18} color="white" />
                    )}
                  </View>

                  {/* Item Info */}
                  <View className="flex-1">
                    <Text
                      className={`text-sm font-medium mb-1 ${
                        item.checked
                          ? "text-gray-400 line-through"
                          : "text-gray-900"
                      }`}
                    >
                      {item.foodName}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {formatGrams(item.totalQuantity)}
                    </Text>
                  </View>

                  {/* Visual Indicator */}
                  {item.checked && (
                    <View className="bg-green-100 px-2 py-1 rounded-full">
                      <Text className="text-green-700 text-xs">✓ Comprado</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Empty State */}
        {shoppingList.categories.length === 0 && (
          <View className="items-center py-12">
            <Ionicons name="cart-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-400 text-base mt-4">
              Nenhum item na lista
            </Text>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Footer Summary */}
      {shoppingList.totalItems > 0 && (
        <View className="border-t border-gray-100 p-4 bg-white">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-gray-600">Progresso</Text>
              <Text className="text-lg font-bold text-gray-900">
                {shoppingList.checkedItems} de {shoppingList.totalItems} itens
              </Text>
            </View>
            {shoppingList.checkedItems === shoppingList.totalItems ? (
              <View className="bg-green-100 px-4 py-2 rounded-full">
                <Text className="text-green-700 font-semibold">
                  🎉 Completo!
                </Text>
              </View>
            ) : (
              <View className="bg-blue-100 px-4 py-2 rounded-full">
                <Text className="text-blue-700 font-semibold">
                  {shoppingList.totalItems - shoppingList.checkedItems}{" "}
                  restantes
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
