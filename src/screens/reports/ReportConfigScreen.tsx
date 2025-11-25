/**
 * Tela de configuração de relatório
 * Permite ao usuário selecionar tipo, período e opções visuais do relatório
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  ReportType,
  ReportPeriod,
  ReportFormat,
  PageOrientation,
  PageSize,
  ReportConfig,
} from "../../types/report.types";
import { reportService } from "../../services/report.service";
import { useAuthStore } from "../../stores/auth.store";

type Props = StackScreenProps<any, "ReportConfig">;

interface ReportTypeOption {
  type: ReportType;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const reportTypeOptions: ReportTypeOption[] = [
  {
    type: ReportType.FULL,
    title: "Completo",
    description: "Relatório completo com medidas e metas",
    icon: "document-text",
  },
  {
    type: ReportType.EVOLUTION,
    title: "Evolução",
    description: "Histórico de medidas e estatísticas corporais",
    icon: "trending-up",
  },
  {
    type: ReportType.GOALS,
    title: "Metas",
    description: "Progresso e conquistas de objetivos",
    icon: "trophy",
  },
  {
    type: ReportType.PHOTO_COMPARISON,
    title: "Fotos",
    description: "Comparação visual antes/depois",
    icon: "images",
  },
  {
    type: ReportType.MEDICAL,
    title: "Médico",
    description: "Documento formal para profissionais de saúde",
    icon: "medical",
  },
];

interface PeriodOption {
  period: ReportPeriod;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
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
  { period: ReportPeriod.CUSTOM, label: "Período customizado", icon: "create" },
];

export default function ReportConfigScreen({ route, navigation }: Props) {
  const { patientId, patientName } = route.params as {
    patientId: string;
    patientName: string;
  };
  const user = useAuthStore((state) => state.user);

  // Estado do formulário
  const [selectedType, setSelectedType] = useState<ReportType>(ReportType.FULL);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>(
    ReportPeriod.MONTH
  );
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Opções visuais
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includePhotos, setIncludePhotos] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(false);

  // Formato
  const [pageSize, setPageSize] = useState<PageSize>(PageSize.A4);
  const [orientation, setOrientation] = useState<PageOrientation>(
    PageOrientation.PORTRAIT
  );

  // Estados de controle
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedReportId, setGeneratedReportId] = useState<string | null>(
    null
  );

  /**
   * Gera o relatório com as configurações selecionadas
   */
  const handleGenerateReport = async () => {
    if (!user) {
      Alert.alert("Erro", "Usuário não identificado");
      return;
    }

    setIsGenerating(true);

    try {
      const config: ReportConfig = {
        type: selectedType,
        period: selectedPeriod,
        startDate:
          selectedPeriod === ReportPeriod.CUSTOM ? startDate : undefined,
        endDate: selectedPeriod === ReportPeriod.CUSTOM ? endDate : undefined,
        format: ReportFormat.PDF,
        orientation,
        pageSize,
        includeCharts,
        includePhotos,
        includeSummary,
        includeRecommendations,
      };

      const result = await reportService.generateReport(
        patientId,
        config,
        user.id
      );

      if (result.success && result.metadata) {
        setGeneratedReportId(result.metadata.id);
        setShowSuccessModal(true);
      } else {
        Alert.alert(
          "Erro",
          result.error || "Não foi possível gerar o relatório"
        );
      }
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      Alert.alert("Erro", "Ocorreu um erro ao gerar o relatório");
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Navega para o visualizador de relatórios
   */
  const handleViewReport = () => {
    setShowSuccessModal(false);
    if (generatedReportId) {
      navigation.navigate("ReportViewer", { reportId: generatedReportId });
    }
  };

  /**
   * Compartilha o relatório gerado
   */
  const handleShareReport = async () => {
    if (!generatedReportId) return;

    try {
      const shared = await reportService.shareReport(generatedReportId);
      if (shared) {
        setShowSuccessModal(false);
      }
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
      Alert.alert("Erro", "Não foi possível compartilhar o relatório");
    }
  };

  /**
   * Renderiza os botões de tipo de relatório
   */
  const renderTypeSelector = () => (
    <View className="mb-6">
      <Text className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
        Tipo de Relatório
      </Text>
      <View className="flex-row justify-between gap-2">
        {reportTypeOptions.map((option) => (
          <TouchableOpacity
            key={option.type}
            onPress={() => setSelectedType(option.type)}
            className={`flex-1 p-4 rounded-xl border-2 ${
              selectedType === option.type
                ? "bg-primary-50 border-primary-500 dark:bg-primary-900"
                : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
            }`}
          >
            <Ionicons
              name={option.icon}
              size={32}
              color={selectedType === option.type ? "#3b82f6" : "#6b7280"}
              style={{ alignSelf: "center", marginBottom: 8 }}
            />
            <Text
              className={`text-center font-semibold mb-1 ${
                selectedType === option.type
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {option.title}
            </Text>
            <Text className="text-xs text-center text-gray-500 dark:text-gray-400">
              {option.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  /**
   * Renderiza o seletor de período
   */
  const renderPeriodSelector = () => (
    <View className="mb-6">
      <Text className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
        Período
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {periodOptions.map((option) => (
          <TouchableOpacity
            key={option.period}
            onPress={() => setSelectedPeriod(option.period)}
            className={`px-4 py-3 rounded-lg flex-row items-center gap-2 ${
              selectedPeriod === option.period
                ? "bg-primary-500"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            <Ionicons
              name={option.icon}
              size={18}
              color={selectedPeriod === option.period ? "#fff" : "#6b7280"}
            />
            <Text
              className={`font-medium ${
                selectedPeriod === option.period
                  ? "text-white"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date pickers para período customizado */}
      {selectedPeriod === ReportPeriod.CUSTOM && (
        <View className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <View className="mb-3">
            <Text className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Data inicial
            </Text>
            <TouchableOpacity
              onPress={() => setShowStartPicker(true)}
              className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <Text className="text-gray-800 dark:text-white">
                {startDate.toLocaleDateString("pt-BR")}
              </Text>
            </TouchableOpacity>
          </View>

          <View>
            <Text className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Data final
            </Text>
            <TouchableOpacity
              onPress={() => setShowEndPicker(true)}
              className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <Text className="text-gray-800 dark:text-white">
                {endDate.toLocaleDateString("pt-BR")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            setShowStartPicker(false);
            if (date) setStartDate(date);
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            setShowEndPicker(false);
            if (date) setEndDate(date);
          }}
        />
      )}
    </View>
  );

  /**
   * Renderiza opções visuais
   */
  const renderVisualOptions = () => (
    <View className="mb-6">
      <Text className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
        Opções Visuais
      </Text>
      <View className="bg-white dark:bg-gray-800 rounded-xl p-4 gap-4">
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="font-medium text-gray-800 dark:text-white">
              Incluir gráficos
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              Gráficos de evolução de peso
            </Text>
          </View>
          <Switch
            value={includeCharts}
            onValueChange={setIncludeCharts}
            trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
            thumbColor={includeCharts ? "#3b82f6" : "#f3f4f6"}
          />
        </View>

        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="font-medium text-gray-800 dark:text-white">
              Incluir fotos
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              Fotos de progresso do paciente
            </Text>
          </View>
          <Switch
            value={includePhotos}
            onValueChange={setIncludePhotos}
            trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
            thumbColor={includePhotos ? "#3b82f6" : "#f3f4f6"}
          />
        </View>

        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="font-medium text-gray-800 dark:text-white">
              Incluir resumo executivo
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              Análise automática dos dados
            </Text>
          </View>
          <Switch
            value={includeSummary}
            onValueChange={setIncludeSummary}
            trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
            thumbColor={includeSummary ? "#3b82f6" : "#f3f4f6"}
          />
        </View>

        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="font-medium text-gray-800 dark:text-white">
              Incluir recomendações
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              Sugestões baseadas nos resultados
            </Text>
          </View>
          <Switch
            value={includeRecommendations}
            onValueChange={setIncludeRecommendations}
            trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
            thumbColor={includeRecommendations ? "#3b82f6" : "#f3f4f6"}
          />
        </View>
      </View>
    </View>
  );

  /**
   * Renderiza opções de formato
   */
  const renderFormatOptions = () => (
    <View className="mb-6">
      <Text className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
        Formato
      </Text>
      <View className="flex-row gap-3 mb-3">
        <TouchableOpacity
          onPress={() => setPageSize(PageSize.A4)}
          className={`flex-1 p-3 rounded-lg border-2 ${
            pageSize === PageSize.A4
              ? "bg-primary-50 border-primary-500 dark:bg-primary-900"
              : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              pageSize === PageSize.A4
                ? "text-primary-600 dark:text-primary-400"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            A4
          </Text>
          <Text className="text-xs text-center text-gray-500 dark:text-gray-400">
            210 × 297 mm
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setPageSize(PageSize.LETTER)}
          className={`flex-1 p-3 rounded-lg border-2 ${
            pageSize === PageSize.LETTER
              ? "bg-primary-50 border-primary-500 dark:bg-primary-900"
              : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              pageSize === PageSize.LETTER
                ? "text-primary-600 dark:text-primary-400"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            Letter
          </Text>
          <Text className="text-xs text-center text-gray-500 dark:text-gray-400">
            216 × 279 mm
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={() => setOrientation(PageOrientation.PORTRAIT)}
          className={`flex-1 p-3 rounded-lg border-2 flex-row items-center justify-center gap-2 ${
            orientation === PageOrientation.PORTRAIT
              ? "bg-primary-50 border-primary-500 dark:bg-primary-900"
              : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
          }`}
        >
          <Ionicons
            name="phone-portrait-outline"
            size={20}
            color={
              orientation === PageOrientation.PORTRAIT ? "#3b82f6" : "#6b7280"
            }
          />
          <Text
            className={`font-semibold ${
              orientation === PageOrientation.PORTRAIT
                ? "text-primary-600 dark:text-primary-400"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            Retrato
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setOrientation(PageOrientation.LANDSCAPE)}
          className={`flex-1 p-3 rounded-lg border-2 flex-row items-center justify-center gap-2 ${
            orientation === PageOrientation.LANDSCAPE
              ? "bg-primary-50 border-primary-500 dark:bg-primary-900"
              : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
          }`}
        >
          <Ionicons
            name="phone-landscape-outline"
            size={20}
            color={
              orientation === PageOrientation.LANDSCAPE ? "#3b82f6" : "#6b7280"
            }
          />
          <Text
            className={`font-semibold ${
              orientation === PageOrientation.LANDSCAPE
                ? "text-primary-600 dark:text-primary-400"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            Paisagem
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="bg-primary-500 pt-12 pb-6 px-6">
        <View className="flex-row items-center mb-2">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white">
            Configurar Relatório
          </Text>
        </View>
        <Text className="text-white opacity-90 ml-9">
          Paciente: {patientName}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {renderTypeSelector()}
        {renderPeriodSelector()}
        {renderVisualOptions()}
        {renderFormatOptions()}
      </ScrollView>

      {/* Botão Gerar */}
      <View className="p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <TouchableOpacity
          onPress={handleGenerateReport}
          disabled={isGenerating}
          className={`p-4 rounded-xl flex-row items-center justify-center gap-2 ${
            isGenerating ? "bg-gray-400" : "bg-primary-500"
          }`}
        >
          {isGenerating ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text className="text-white font-semibold text-lg">
                Gerando...
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="document-text" size={24} color="#fff" />
              <Text className="text-white font-semibold text-lg">
                Gerar Relatório
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de Sucesso */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full items-center justify-center mb-3">
                <Ionicons name="checkmark-circle" size={40} color="#16a34a" />
              </View>
              <Text className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                Relatório Gerado!
              </Text>
              <Text className="text-center text-gray-600 dark:text-gray-400">
                Seu relatório foi gerado com sucesso.
              </Text>
            </View>

            <View className="gap-3">
              <TouchableOpacity
                onPress={handleViewReport}
                className="bg-primary-500 p-4 rounded-xl flex-row items-center justify-center gap-2"
              >
                <Ionicons name="eye" size={20} color="#fff" />
                <Text className="text-white font-semibold">Visualizar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShareReport}
                className="bg-green-500 p-4 rounded-xl flex-row items-center justify-center gap-2"
              >
                <Ionicons name="share-social" size={20} color="#fff" />
                <Text className="text-white font-semibold">Compartilhar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowSuccessModal(false);
                  navigation.goBack();
                }}
                className="bg-gray-200 dark:bg-gray-700 p-4 rounded-xl"
              >
                <Text className="text-gray-700 dark:text-gray-300 font-semibold text-center">
                  Voltar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
