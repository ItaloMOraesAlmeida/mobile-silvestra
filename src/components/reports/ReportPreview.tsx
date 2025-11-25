/**
 * Componente de preview do relatório (opcional)
 * Exibe pré-visualização antes da geração final do PDF
 */

import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ReportData, ReportConfig } from "../../types/report.types";
import {
  getReportTypeLabel,
  formatReportPeriod,
} from "../../utils/report.utils";

interface ReportPreviewProps {
  reportData: ReportData;
  config: ReportConfig;
}

export default function ReportPreview({
  reportData,
  config,
}: ReportPreviewProps) {
  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-6">
        {/* Header do preview */}
        <View className="bg-primary-500 rounded-2xl p-6 mb-4">
          <Text className="text-2xl font-bold text-white mb-2">
            {getReportTypeLabel(config.type)}
          </Text>
          <Text className="text-white opacity-90 mb-1">
            Paciente: {reportData.patient.name}
          </Text>
          <Text className="text-white opacity-80 text-sm">
            Período:{" "}
            {formatReportPeriod(
              config.period,
              config.startDate,
              config.endDate
            )}
          </Text>
        </View>

        {/* Resumo do conteúdo */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-4">
          <Text className="text-lg font-bold text-gray-800 dark:text-white mb-4">
            Conteúdo do Relatório
          </Text>

          {/* Medições */}
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg items-center justify-center mr-3">
              <Ionicons name="fitness" size={20} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-800 dark:text-white">
                {reportData.totalMeasurements} medições
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                De{" "}
                {new Date(reportData.periodStart).toLocaleDateString("pt-BR")}{" "}
                até {new Date(reportData.periodEnd).toLocaleDateString("pt-BR")}
              </Text>
            </View>
          </View>

          {/* Metas */}
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg items-center justify-center mr-3">
              <Ionicons name="trophy" size={20} color="#f59e0b" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-800 dark:text-white">
                {reportData.totalGoals} metas
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                {reportData.achievedGoals} alcançadas
              </Text>
            </View>
          </View>

          {/* Estatísticas */}
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg items-center justify-center mr-3">
              <Ionicons name="stats-chart" size={20} color="#8b5cf6" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-800 dark:text-white">
                Estatísticas completas
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                Peso, IMC, tendências e mais
              </Text>
            </View>
          </View>
        </View>

        {/* Opções incluídas */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-4">
          <Text className="text-lg font-bold text-gray-800 dark:text-white mb-4">
            Opções Incluídas
          </Text>

          <View className="gap-3">
            {config.includeCharts && (
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text className="ml-2 text-gray-700 dark:text-gray-300">
                  Gráficos de evolução
                </Text>
              </View>
            )}
            {config.includePhotos && (
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text className="ml-2 text-gray-700 dark:text-gray-300">
                  Fotos de progresso
                </Text>
              </View>
            )}
            {config.includeSummary && (
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text className="ml-2 text-gray-700 dark:text-gray-300">
                  Resumo executivo
                </Text>
              </View>
            )}
            {config.includeRecommendations && (
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text className="ml-2 text-gray-700 dark:text-gray-300">
                  Recomendações
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Formato */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6">
          <Text className="text-lg font-bold text-gray-800 dark:text-white mb-4">
            Formato
          </Text>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Tamanho
              </Text>
              <Text className="font-semibold text-gray-800 dark:text-white">
                {config.pageSize}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Orientação
              </Text>
              <Text className="font-semibold text-gray-800 dark:text-white">
                {config.orientation === "PORTRAIT" ? "Retrato" : "Paisagem"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
