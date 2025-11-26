/**
 * Componente de card de relatório
 * Exibe miniatura e informações de um relatório na lista
 */

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ReportMetadata } from "../../types/report.types";
import {
  formatReportPeriod,
  getReportTypeIcon,
  getReportTypeLabel,
  getReportTypeColor,
  formatFileSize,
} from "../../utils/report.utils";

interface ReportCardProps {
  metadata: ReportMetadata;
  onPress: () => void;
  onShare?: () => void;
  onDelete?: () => void;
}

export default function ReportCard({
  metadata,
  onPress,
  onShare,
  onDelete,
}: ReportCardProps) {
  const typeIcon = getReportTypeIcon(
    metadata.type
  ) as keyof typeof Ionicons.glyphMap;
  const typeColor = getReportTypeColor(metadata.type);
  const typeLabel = getReportTypeLabel(metadata.type);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm"
      activeOpacity={0.7}
    >
      <View className="flex-row items-start mb-3">
        {/* Ícone do tipo */}
        <View
          className="w-14 h-14 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: `${typeColor}20` }}
        >
          <Ionicons name={typeIcon} size={28} color={typeColor} />
        </View>

        {/* Informações principais */}
        <View className="flex-1">
          <Text
            className="text-lg font-semibold text-gray-800 dark:text-white mb-1"
            numberOfLines={1}
          >
            {metadata.patientName}
          </Text>

          {/* Type badge e período */}
          <View className="flex-row items-center gap-2 mb-1">
            <View
              className="px-2 py-1 rounded"
              style={{ backgroundColor: `${typeColor}30` }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: typeColor }}
              >
                {typeLabel}
              </Text>
            </View>
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {formatReportPeriod(
                metadata.period,
                new Date(metadata.startDate),
                new Date(metadata.endDate)
              )}
            </Text>
          </View>

          {/* Data de criação */}
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(metadata.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        {/* Badge de status */}
        {metadata.status === "COMPLETED" && (
          <View className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
            <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
          </View>
        )}
        {metadata.status === "GENERATING" && (
          <View className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
            <Ionicons name="hourglass" size={16} color="#3b82f6" />
          </View>
        )}
        {metadata.status === "FAILED" && (
          <View className="bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
            <Ionicons name="close-circle" size={16} color="#ef4444" />
          </View>
        )}
      </View>

      {/* Informações adicionais e ações */}
      <View className="flex-row items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        {/* Metadados do arquivo */}
        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-1">
            <Ionicons name="document-text-outline" size={16} color="#6b7280" />
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {metadata.pageCount || "-"} pág.
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons
              name="document-attach-outline"
              size={16}
              color="#6b7280"
            />
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {formatFileSize(metadata.fileSize || 0)}
            </Text>
          </View>
        </View>

        {/* Botões de ação */}
        <View className="flex-row gap-2">
          {onShare && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onShare();
              }}
              className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg items-center justify-center"
            >
              <Ionicons name="share-social" size={16} color="#3b82f6" />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg items-center justify-center"
            >
              <Ionicons name="trash" size={16} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
