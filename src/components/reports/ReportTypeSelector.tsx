/**
 * Componente seletor de tipo de relatório
 * Permite escolher entre Evolution, Goals e Full
 */

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ReportType } from "../../types/report.types";

interface ReportTypeOption {
  type: ReportType;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface ReportTypeSelectorProps {
  selectedType: ReportType;
  onSelect: (type: ReportType) => void;
}

const typeOptions: ReportTypeOption[] = [
  {
    type: ReportType.EVOLUTION,
    title: "Evolução",
    description: "Histórico de medidas corporais",
    icon: "trending-up",
  },
  {
    type: ReportType.GOALS,
    title: "Metas",
    description: "Progresso de objetivos",
    icon: "trophy",
  },
  {
    type: ReportType.FULL,
    title: "Completo",
    description: "Medidas e metas juntos",
    icon: "document-text",
  },
];

export default function ReportTypeSelector({
  selectedType,
  onSelect,
}: ReportTypeSelectorProps) {
  return (
    <View className="gap-3">
      {typeOptions.map((option) => {
        const isSelected = selectedType === option.type;

        return (
          <TouchableOpacity
            key={option.type}
            onPress={() => onSelect(option.type)}
            className={`p-4 rounded-2xl border-2 flex-row items-center ${
              isSelected
                ? "bg-primary-50 border-primary-500 dark:bg-primary-900 dark:border-primary-400"
                : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
            }`}
            activeOpacity={0.7}
          >
            {/* Ícone */}
            <View
              className={`w-14 h-14 rounded-xl items-center justify-center mr-4 ${
                isSelected
                  ? "bg-primary-500 dark:bg-primary-600"
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              <Ionicons
                name={option.icon}
                size={28}
                color={isSelected ? "#fff" : "#6b7280"}
              />
            </View>

            {/* Textos */}
            <View className="flex-1">
              <Text
                className={`text-lg font-semibold mb-1 ${
                  isSelected
                    ? "text-primary-700 dark:text-primary-300"
                    : "text-gray-800 dark:text-white"
                }`}
              >
                {option.title}
              </Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                {option.description}
              </Text>
            </View>

            {/* Checkbox visual */}
            {isSelected && (
              <View className="w-6 h-6 bg-primary-500 rounded-full items-center justify-center ml-2">
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
