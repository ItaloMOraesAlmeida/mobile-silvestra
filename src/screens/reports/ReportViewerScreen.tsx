/**
 * Tela de visualização de relatório PDF
 * Renderiza PDF com controles de zoom, navegação e ações
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import Pdf from "react-native-pdf";
import { reportStore } from "../../stores/report.store";
import { reportService } from "../../services/report.service";

type Props = StackScreenProps<any, "ReportViewer">;

export default function ReportViewerScreen({ route, navigation }: Props) {
  const { reportId } = route.params as { reportId: string };
  const report = reportStore((state) => state.getReportById(reportId));
  const removeReport = reportStore((state) => state.removeReport);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!report) {
      setError("Relatório não encontrado");
      setLoading(false);
    }
  }, [report]);

  /**
   * Compartilha o relatório
   */
  const handleShare = async () => {
    try {
      const shared = await reportService.shareReport(reportId);
      if (!shared) {
        Alert.alert("Aviso", "Não foi possível compartilhar o relatório");
      }
    } catch (err) {
      console.error("Erro ao compartilhar:", err);
      Alert.alert("Erro", "Ocorreu um erro ao compartilhar o relatório");
    }
  };

  /**
   * Deleta o relatório
   */
  const handleDelete = () => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir este relatório?",
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
                navigation.goBack();
              } else {
                Alert.alert("Erro", "Não foi possível excluir o relatório");
              }
            } catch (err) {
              console.error("Erro ao deletar:", err);
              Alert.alert("Erro", "Ocorreu um erro ao excluir o relatório");
            }
          },
        },
      ]
    );
  };

  /**
   * Aumenta o zoom
   */
  const handleZoomIn = () => {
    if (scale < 3) {
      setScale((prev) => Math.min(prev + 0.25, 3));
    }
  };

  /**
   * Diminui o zoom
   */
  const handleZoomOut = () => {
    if (scale > 0.5) {
      setScale((prev) => Math.max(prev - 0.25, 0.5));
    }
  };

  /**
   * Reseta o zoom
   */
  const handleResetZoom = () => {
    setScale(1);
  };

  /**
   * Renderiza estado de erro
   */
  if (error) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900">
        <View className="bg-primary-500 pt-12 pb-4 px-6 flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">
            Visualizar Relatório
          </Text>
        </View>

        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text className="text-xl font-bold text-gray-800 dark:text-white mt-4 mb-2">
            Erro ao Carregar
          </Text>
          <Text className="text-center text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-primary-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /**
   * Renderiza estado de carregamento
   */
  if (!report) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600 dark:text-gray-400">
          Carregando relatório...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-900">
      {/* Header */}
      <View className="bg-primary-500 pt-12 pb-4 px-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-3"
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-lg font-bold text-white" numberOfLines={1}>
                {report.patientName}
              </Text>
              <Text className="text-sm text-white opacity-80">
                {report.type} • {totalPages > 0 ? `${totalPages} páginas` : ""}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleShare}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            >
              <Ionicons name="share-social" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            >
              <Ionicons name="trash" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* PDF Viewer */}
      <View className="flex-1">
        {report.fileUri ? (
          <Pdf
            source={{ uri: report.fileUri }}
            onLoadComplete={(numberOfPages) => {
              setTotalPages(numberOfPages);
              setLoading(false);
            }}
            onPageChanged={(page) => {
              setCurrentPage(page);
            }}
            onError={(error) => {
              console.error("Erro ao carregar PDF:", error);
              setError("Não foi possível carregar o PDF");
              setLoading(false);
            }}
            onLoadProgress={(percent) => {
              // Opcional: adicionar barra de progresso
            }}
            style={{
              flex: 1,
              backgroundColor: "#1f2937",
            }}
            scale={scale}
            minScale={0.5}
            maxScale={3.0}
            enablePaging
            horizontal
            spacing={10}
            fitPolicy={0} // 0 = WIDTH, 1 = HEIGHT, 2 = BOTH
            trustAllCerts={false}
          />
        ) : (
          <View className="flex-1 justify-center items-center">
            <Ionicons name="document-outline" size={64} color="#6b7280" />
            <Text className="mt-4 text-gray-400">PDF não disponível</Text>
          </View>
        )}

        {loading && (
          <View className="absolute inset-0 bg-gray-900/80 justify-center items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="mt-4 text-white">Carregando PDF...</Text>
          </View>
        )}
      </View>

      {/* Controles de Navegação e Zoom */}
      {!loading && totalPages > 0 && (
        <View className="absolute bottom-6 left-0 right-0 items-center">
          <View className="bg-gray-800/90 rounded-2xl px-4 py-3 flex-row items-center gap-4">
            {/* Zoom Out */}
            <TouchableOpacity
              onPress={handleZoomOut}
              disabled={scale <= 0.5}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                scale <= 0.5 ? "bg-gray-700" : "bg-gray-700"
              }`}
            >
              <Ionicons
                name="remove"
                size={24}
                color={scale <= 0.5 ? "#4b5563" : "#fff"}
              />
            </TouchableOpacity>

            {/* Zoom Reset */}
            <TouchableOpacity
              onPress={handleResetZoom}
              className="px-3 py-2 bg-gray-700 rounded-lg"
            >
              <Text className="text-white font-semibold">
                {Math.round(scale * 100)}%
              </Text>
            </TouchableOpacity>

            {/* Zoom In */}
            <TouchableOpacity
              onPress={handleZoomIn}
              disabled={scale >= 3}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                scale >= 3 ? "bg-gray-700" : "bg-gray-700"
              }`}
            >
              <Ionicons
                name="add"
                size={24}
                color={scale >= 3 ? "#4b5563" : "#fff"}
              />
            </TouchableOpacity>

            {/* Separador */}
            <View className="w-px h-8 bg-gray-600" />

            {/* Indicador de Página */}
            <View className="px-3">
              <Text className="text-white font-semibold">
                {currentPage} / {totalPages}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
