/**
 * ReportPreviewScreen
 * Tela de pré-visualização do relatório antes de gerar o PDF
 * Permite visualizar o HTML renderizado em WebView com controles de zoom
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { pdfGeneratorService } from "../../services/pdf-generator.service";
import { reportService } from "../../services/report.service";
import { useAuthStore } from "../../stores/auth.store";
import { ReportConfig } from "../../types/report.types";

type Props = StackScreenProps<any, "ReportPreview">;

export default function ReportPreviewScreen({ route, navigation }: Props) {
  const { patientId, patientName, config } = route.params as {
    patientId: string;
    patientName: string;
    config: ReportConfig;
  };

  const user = useAuthStore((state) => state.user);

  const [html, setHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  const loadPreview = React.useCallback(async () => {
    try {
      setIsLoading(true);

      // Preparar dados do relatório
      const reportData = await reportService["prepareReportData"](
        patientId,
        config
      );

      // Gerar HTML
      const generatedHtml = pdfGeneratorService["generateHTML"](
        reportData,
        config
      );

      setHtml(generatedHtml);
    } catch (error) {
      console.error("Erro ao carregar preview:", error);
      Alert.alert(
        "Erro",
        "Não foi possível carregar a pré-visualização do relatório."
      );
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [patientId, config, navigation]);

  /**
   * Carrega o HTML de pré-visualização
   */
  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  /**
   * Gera o PDF final
   */
  const handleGeneratePDF = async () => {
    if (!user) {
      Alert.alert("Erro", "Usuário não identificado");
      return;
    }

    Alert.alert(
      "Confirmar Geração",
      "Deseja gerar o relatório em PDF?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Gerar",
          onPress: async () => {
            setIsGenerating(true);

            try {
              const result = await reportService.generateReport(
                patientId,
                config,
                user.id
              );

              if (result.success && result.metadata) {
                Alert.alert(
                  "Sucesso",
                  "Relatório gerado com sucesso!",
                  [
                    {
                      text: "Visualizar",
                      onPress: () => {
                        navigation.replace("ReportViewer", {
                          reportId: result.metadata!.id,
                        });
                      },
                    },
                    {
                      text: "Voltar",
                      onPress: () => {
                        navigation.navigate("PatientDetails", { patientId });
                      },
                    },
                  ],
                  { cancelable: false }
                );
              } else {
                Alert.alert(
                  "Erro",
                  result.error || "Não foi possível gerar o relatório"
                );
              }
            } catch (error) {
              console.error("Erro ao gerar PDF:", error);
              Alert.alert("Erro", "Ocorreu um erro ao gerar o relatório");
            } finally {
              setIsGenerating(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  /**
   * Controles de zoom
   */
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 2.0));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Carregando pré-visualização...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Pré-visualização</Text>
          <Text style={styles.headerSubtitle}>{patientName}</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity
          onPress={handleZoomOut}
          style={styles.zoomButton}
          disabled={zoomLevel <= 0.5}
        >
          <Ionicons
            name="remove-circle-outline"
            size={28}
            color={zoomLevel <= 0.5 ? "#d1d5db" : "#3b82f6"}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResetZoom} style={styles.zoomText}>
          <Text style={styles.zoomValue}>{Math.round(zoomLevel * 100)}%</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleZoomIn}
          style={styles.zoomButton}
          disabled={zoomLevel >= 2.0}
        >
          <Ionicons
            name="add-circle-outline"
            size={28}
            color={zoomLevel >= 2.0 ? "#d1d5db" : "#3b82f6"}
          />
        </TouchableOpacity>
      </View>

      {/* WebView com HTML */}
      <View style={styles.webViewContainer}>
        <WebView
          source={{ html }}
          style={styles.webView}
          scalesPageToFit
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color="#3b82f6" />
            </View>
          )}
          injectedJavaScript={`
            document.body.style.zoom = ${zoomLevel};
            true;
          `}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
          disabled={isGenerating}
        >
          <Ionicons name="close-circle" size={24} color="#ef4444" />
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGeneratePDF}
          style={[styles.generateButton, isGenerating && styles.buttonDisabled]}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.generateButtonText}>Gerando...</Text>
            </>
          ) : (
            <>
              <Ionicons name="document-text" size={24} color="#fff" />
              <Text style={styles.generateButtonText}>Gerar PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#3b82f6",
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
  },
  headerPlaceholder: {
    width: 40,
  },
  zoomControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 16,
  },
  zoomButton: {
    padding: 4,
  },
  zoomText: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    minWidth: 70,
    alignItems: "center",
  },
  zoomValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    padding: 8,
  },
  webView: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  webViewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  actionsContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#fee2e2",
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
  },
  generateButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#3b82f6",
    gap: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
  },
});
