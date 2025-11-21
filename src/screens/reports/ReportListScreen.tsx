/**
 * Tela de listagem de relatórios
 * Exibe todos os relatórios gerados com filtros e ações
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { reportStore } from "../../stores/report.store";
import { reportService } from "../../services/report.service";
import { ReportType } from "../../types/report.types";
import { formatReportPeriod } from "../../utils/report.utils";

type Props = StackScreenProps<any, "ReportList">;

interface FilterOption {
  label: string;
  value: ReportType | "ALL";
  icon: keyof typeof Ionicons.glyphMap;
}

const filterOptions: FilterOption[] = [
  { label: "Todos", value: "ALL", icon: "document-text" },
  { label: "Evolução", value: ReportType.EVOLUTION, icon: "trending-up" },
  { label: "Metas", value: ReportType.GOALS, icon: "trophy" },
  { label: "Completo", value: ReportType.FULL, icon: "documents" },
];

export default function ReportListScreen({ navigation }: Props) {
  const reports = reportStore((state) => state.reports);
  const removeReport = reportStore((state) => state.removeReport);

  const [selectedFilter, setSelectedFilter] = useState<ReportType | "ALL">(
    "ALL"
  );
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Filtra relatórios por tipo
   */
  const filteredReports = reports.filter((report) => {
    if (selectedFilter === "ALL") return true;
    return report.type === selectedFilter;
  });

  /**
   * Atualiza a lista (cleanup de relatórios antigos)
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reportService.cleanupOldReports();
    } catch (error) {
      console.error("Erro ao limpar relatórios:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  /**
   * Navega para visualização do relatório
   */
  const handleOpenReport = (reportId: string) => {
    navigation.navigate("ReportViewer", { reportId });
  };

  /**
   * Deleta um relatório
   */
  const handleDeleteReport = (reportId: string, patientName: string) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Deseja excluir o relatório de ${patientName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const deleted = await reportService.deleteReport(reportId);
              if (deleted) {
                removeReport(reportId);
              } else {
                Alert.alert("Erro", "Não foi possível excluir o relatório");
              }
            } catch (error) {
              console.error("Erro ao deletar:", error);
              Alert.alert("Erro", "Ocorreu um erro ao excluir o relatório");
            }
          },
        },
      ]
    );
  };

  /**
   * Compartilha um relatório
   */
  const handleShareReport = async (reportId: string) => {
    try {
      const shared = await reportService.shareReport(reportId);
      if (!shared) {
        Alert.alert("Aviso", "Não foi possível compartilhar o relatório");
      }
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
      Alert.alert("Erro", "Ocorreu um erro ao compartilhar o relatório");
    }
  };

  /**
   * Formata tamanho do arquivo
   */
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * Retorna ícone do tipo de relatório
   */
  const getTypeIcon = (type: ReportType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case ReportType.EVOLUTION:
        return "trending-up";
      case ReportType.GOALS:
        return "trophy";
      case ReportType.FULL:
        return "documents";
      default:
        return "document-text";
    }
  };

  /**
   * Retorna cor do tipo de relatório
   */
  const getTypeColor = (type: ReportType): string => {
    switch (type) {
      case ReportType.EVOLUTION:
        return "#3b82f6"; // blue
      case ReportType.GOALS:
        return "#f59e0b"; // yellow/amber
      case ReportType.FULL:
        return "#8b5cf6"; // purple
      default:
        return "#6b7280"; // gray
    }
  };

  /**
   * Retorna label do tipo
   */
  const getTypeLabel = (type: ReportType): string => {
    switch (type) {
      case ReportType.EVOLUTION:
        return "Evolução";
      case ReportType.GOALS:
        return "Metas";
      case ReportType.FULL:
        return "Completo";
      default:
        return "Relatório";
    }
  };

  /**
   * Renderiza card de relatório
   */
  const renderReportCard = ({ item }: { item: any }) => {
    const typeIcon = getTypeIcon(item.type);
    const typeColor = getTypeColor(item.type);
    const typeLabel = getTypeLabel(item.type);

    return (
      <TouchableOpacity
        onPress={() => handleOpenReport(item.id)}
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 mx-6"
      >
        <View className="flex-row items-start mb-3">
          {/* Ícone do tipo */}
          <View
            className="w-14 h-14 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: `${typeColor}20` }}
          >
            <Ionicons name={typeIcon} size={28} color={typeColor} />
          </View>

          {/* Informações */}
          <View className="flex-1">
            <Text
              className="text-lg font-semibold text-gray-800 dark:text-white mb-1"
              numberOfLines={1}
            >
              {item.patientName}
            </Text>
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
                  item.period,
                  new Date(item.startDate),
                  new Date(item.endDate)
                )}
              </Text>
            </View>
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(item.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>

          {/* Badge de status */}
          {item.status === "COMPLETED" && (
            <View className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
            </View>
          )}
        </View>

        {/* Informações adicionais */}
        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1">
              <Ionicons
                name="document-text-outline"
                size={16}
                color="#6b7280"
              />
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {item.pageCount || "-"} pág.
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons
                name="document-attach-outline"
                size={16}
                color="#6b7280"
              />
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(item.fileSize)}
              </Text>
            </View>
          </View>

          {/* Ações */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => handleShareReport(item.id)}
              className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg items-center justify-center"
            >
              <Ionicons name="share-social" size={16} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteReport(item.id, item.patientName)}
              className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg items-center justify-center"
            >
              <Ionicons name="trash" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Renderiza estado vazio
   */
  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-6 py-12">
      <View className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center mb-6">
        <Ionicons name="document-text-outline" size={64} color="#9ca3af" />
      </View>
      <Text className="text-xl font-bold text-gray-800 dark:text-white mb-2">
        Nenhum relatório encontrado
      </Text>
      <Text className="text-center text-gray-600 dark:text-gray-400 mb-6">
        {selectedFilter === "ALL"
          ? "Você ainda não gerou nenhum relatório. Comece gerando um relatório para seus pacientes."
          : `Nenhum relatório do tipo "${
              filterOptions.find((f) => f.value === selectedFilter)?.label
            }" encontrado.`}
      </Text>
      {selectedFilter === "ALL" && (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-primary-500 px-6 py-3 rounded-xl flex-row items-center gap-2"
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text className="text-white font-semibold">Gerar Relatório</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="bg-primary-500 pt-12 pb-4 px-6">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-3"
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-bold text-white">
                Meus Relatórios
              </Text>
              <Text className="text-white opacity-80">
                {filteredReports.length}{" "}
                {filteredReports.length === 1 ? "relatório" : "relatórios"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onRefresh}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
            <Ionicons name="reload" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Filtros */}
        <View className="flex-row gap-2">
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => setSelectedFilter(option.value)}
              className={`px-4 py-2 rounded-lg flex-row items-center gap-2 ${
                selectedFilter === option.value ? "bg-white" : "bg-white/20"
              }`}
            >
              <Ionicons
                name={option.icon}
                size={16}
                color={selectedFilter === option.value ? "#3b82f6" : "#fff"}
              />
              <Text
                className={`font-medium ${
                  selectedFilter === option.value
                    ? "text-primary-600"
                    : "text-white"
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Lista de Relatórios */}
      <FlatList
        data={filteredReports}
        renderItem={renderReportCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 24,
          flexGrow: 1,
        }}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={["#3b82f6"]}
          />
        }
      />
    </View>
  );
}
