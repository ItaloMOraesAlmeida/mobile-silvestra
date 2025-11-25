/**
 * Componente seletor de período do relatório
 * Permite escolher período predefinido ou customizado com datas
 */

import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { ReportPeriod } from "../../types/report.types";

interface PeriodOption {
  period: ReportPeriod;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface ReportPeriodPickerProps {
  selectedPeriod: ReportPeriod;
  startDate?: Date;
  endDate?: Date;
  onSelect: (period: ReportPeriod, startDate?: Date, endDate?: Date) => void;
}

const periodOptions: PeriodOption[] = [
  { period: ReportPeriod.WEEK, label: "Última semana", icon: "calendar" },
  { period: ReportPeriod.MONTH, label: "Último mês", icon: "calendar" },
  {
    period: ReportPeriod.THREE_MONTHS,
    label: "Últimos 3 meses",
    icon: "calendar",
  },
  {
    period: ReportPeriod.SIX_MONTHS,
    label: "Últimos 6 meses",
    icon: "calendar",
  },
  { period: ReportPeriod.YEAR, label: "Último ano", icon: "calendar" },
  { period: ReportPeriod.ALL, label: "Todos os dados", icon: "infinite" },
  {
    period: ReportPeriod.CUSTOM,
    label: "Período customizado",
    icon: "create",
  },
];

export default function ReportPeriodPicker({
  selectedPeriod,
  startDate = new Date(),
  endDate = new Date(),
  onSelect,
}: ReportPeriodPickerProps) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handlePeriodSelect = (period: ReportPeriod) => {
    if (period === ReportPeriod.CUSTOM) {
      setShowCustomModal(true);
    } else {
      onSelect(period);
    }
  };

  const handleCustomPeriodConfirm = () => {
    onSelect(ReportPeriod.CUSTOM, tempStartDate, tempEndDate);
    setShowCustomModal(false);
  };

  return (
    <>
      <View className="flex-row flex-wrap gap-2">
        {periodOptions.map((option) => {
          const isSelected = selectedPeriod === option.period;

          return (
            <TouchableOpacity
              key={option.period}
              onPress={() => handlePeriodSelect(option.period)}
              className={`px-4 py-3 rounded-xl flex-row items-center gap-2 ${
                isSelected ? "bg-primary-500" : "bg-gray-100 dark:bg-gray-800"
              }`}
              activeOpacity={0.7}
            >
              <Ionicons
                name={option.icon}
                size={18}
                color={isSelected ? "#fff" : "#6b7280"}
              />
              <Text
                className={`font-medium ${
                  isSelected ? "text-white" : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Modal de período customizado */}
      <Modal
        visible={showCustomModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Período Customizado
            </Text>

            {/* Data inicial */}
            <View className="mb-4">
              <Text className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Data inicial
              </Text>
              <TouchableOpacity
                onPress={() => setShowStartPicker(true)}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex-row items-center justify-between"
              >
                <Text className="text-gray-800 dark:text-white">
                  {tempStartDate.toLocaleDateString("pt-BR")}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Data final */}
            <View className="mb-6">
              <Text className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Data final
              </Text>
              <TouchableOpacity
                onPress={() => setShowEndPicker(true)}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex-row items-center justify-between"
              >
                <Text className="text-gray-800 dark:text-white">
                  {tempEndDate.toLocaleDateString("pt-BR")}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Botões */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowCustomModal(false)}
                className="flex-1 p-3 bg-gray-200 dark:bg-gray-700 rounded-xl"
              >
                <Text className="text-center font-semibold text-gray-700 dark:text-gray-300">
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCustomPeriodConfirm}
                className="flex-1 p-3 bg-primary-500 rounded-xl"
              >
                <Text className="text-center font-semibold text-white">
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DateTimePickers */}
      {showStartPicker && (
        <DateTimePicker
          value={tempStartDate}
          mode="date"
          display="default"
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            setShowStartPicker(false);
            if (date) setTempStartDate(date);
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={tempEndDate}
          mode="date"
          display="default"
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            setShowEndPicker(false);
            if (date) setTempEndDate(date);
          }}
        />
      )}
    </>
  );
}
