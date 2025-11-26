/**
 * ReportHistoryScreen
 * Tela que exibe o histórico de relatórios gerados
 * Permite visualizar, compartilhar e excluir relatórios salvos
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { reportService } from "../../services/report.service";
import { reportStore } from "../../stores/report.store";
import {
  ReportMetadata,
  ReportType,
  REPORT_TYPE_LABELS,
} from "../../types/report.types";

type Props = StackScreenProps<any, "ReportHistory">;

export default function ReportHistoryScreen({ route, navigation }: Props) {
  const { patientId, patientName } = route.params as {
    patientId?: string;
    patientName?: string;
  };

  const [reports, setReports] = useState<ReportMetadata[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<ReportType | "ALL">("ALL");

  const loadReports = useCallback(async () => {
    try {
      const loadedReports = await reportService.getReports(patientId);
      setReports(loadedReports);
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
      Alert.alert("Erro", "Não foi possível carregar os relatórios");
    }
  }, [patientId]);

  /**
   * Carrega relatórios
   */
  useEffect(() => {
    loadReports();

    // Subscribe to store changes
    const unsubscribe = reportStore.subscribe((state) => {
      const allReports = patientId
        ? state.reports.filter((r) => r.patientId === patientId)
        : state.reports;
      setReports(allReports);
    });

    return unsubscribe;
  }, [patientId, loadReports]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReports();
    setIsRefreshing(false);
  };

  /**
   * Visualiza um relatório
   */
  const handleViewReport = (report: ReportMetadata) => {
    navigation.navigate("ReportViewer", { reportId: report.id });
  };

  /**
   * Compartilha um relatório
   */
  const handleShareReport = async (report: ReportMetadata) => {
    const shared = await reportService.shareReport(report.id);
    if (!shared) {
      Alert.alert("Erro", "Não foi possível compartilhar o relatório");
    }
  };

  /**
   * Exclui um relatório
   */
  const handleDeleteReport = (report: ReportMetadata) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Deseja excluir o relatório "${REPORT_TYPE_LABELS[report.type]}" de ${
        report.patientName
      }?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const deleted = await reportService.deleteReport(report.id);
            if (deleted) {
              Alert.alert("Sucesso", "Relatório excluído com sucesso");
            } else {
              Alert.alert("Erro", "Não foi possível excluir o relatório");
            }
          },
        },
      ]
    );
  };

  /**
   * Filtra relatórios por tipo
   */
  const filteredReports =
    filterType === "ALL"
      ? reports
      : reports.filter((r) => r.type === filterType);

  /**
   * Renderiza item do histórico
   */
  const renderReportItem = ({ item }: { item: ReportMetadata }) => {
    const createdDate = new Date(item.createdAt);
    const periodStart = new Date(item.startDate);
    const periodEnd = new Date(item.endDate);

    return (
      <TouchableOpacity
        onPress={() => handleViewReport(item)}
        style={styles.reportCard}
        activeOpacity={0.7}
      >
        {/* Header do Card */}
        <View style={styles.cardHeader}>
          <View style={styles.typeIconContainer}>
            <Ionicons name={getTypeIcon(item.type)} size={24} color="#3b82f6" />
          </View>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.reportType}>
              {REPORT_TYPE_LABELS[item.type]}
            </Text>
            <Text style={styles.patientName}>{item.patientName}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
          </View>
        </View>

        {/* Informações do Relatório */}
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={styles.infoText}>
              Período: {periodStart.toLocaleDateString("pt-BR")} até{" "}
              {periodEnd.toLocaleDateString("pt-BR")}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#6b7280" />
            <Text style={styles.infoText}>
              Gerado em: {createdDate.toLocaleDateString("pt-BR")} às{" "}
              {createdDate.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>

          {item.fileSize && (
            <View style={styles.infoRow}>
              <Ionicons name="document-outline" size={16} color="#6b7280" />
              <Text style={styles.infoText}>
                Tamanho: {(item.fileSize / 1024).toFixed(2)} KB
                {item.pageCount ? ` • ${item.pageCount} página(s)` : ""}
              </Text>
            </View>
          )}
        </View>

        {/* Ações */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => handleViewReport(item)}
            style={styles.actionButton}
          >
            <Ionicons name="eye-outline" size={20} color="#3b82f6" />
            <Text style={styles.actionButtonText}>Visualizar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleShareReport(item)}
            style={styles.actionButton}
          >
            <Ionicons name="share-social-outline" size={20} color="#16a34a" />
            <Text style={[styles.actionButtonText, { color: "#16a34a" }]}>
              Compartilhar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDeleteReport(item)}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text style={[styles.actionButtonText, { color: "#ef4444" }]}>
              Excluir
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Retorna ícone baseado no tipo
   */
  const getTypeIcon = (type: ReportType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case ReportType.EVOLUTION:
        return "trending-up";
      case ReportType.GOALS:
        return "trophy";
      case ReportType.FULL:
        return "document-text";
      case ReportType.PHOTO_COMPARISON:
        return "images";
      case ReportType.MEDICAL:
        return "medical";
      default:
        return "document";
    }
  };

  /**
   * Empty State
   */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="folder-open-outline" size={80} color="#d1d5db" />
      <Text style={styles.emptyTitle}>Nenhum relatório gerado</Text>
      <Text style={styles.emptyText}>
        {patientId
          ? `Não há relatórios para ${patientName}.`
          : "Ainda não foram gerados relatórios."}
      </Text>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.emptyButton}
      >
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.emptyButtonText}>Gerar Novo Relatório</Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Filtros
   */
  const filterOptions = [
    { value: "ALL", label: "Todos" },
    { value: ReportType.FULL, label: "Completo" },
    { value: ReportType.EVOLUTION, label: "Evolução" },
    { value: ReportType.GOALS, label: "Metas" },
    { value: ReportType.PHOTO_COMPARISON, label: "Fotos" },
    { value: ReportType.MEDICAL, label: "Médico" },
  ];

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
          <Text style={styles.headerTitle}>Histórico de Relatórios</Text>
          {patientName && (
            <Text style={styles.headerSubtitle}>{patientName}</Text>
          )}
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterOptions}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilterType(item.value as ReportType | "ALL")}
              style={[
                styles.filterChip,
                filterType === item.value && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterType === item.value && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filtersContent}
        />
      </View>

      {/* Lista de Relatórios */}
      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item.id}
        renderItem={renderReportItem}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          filteredReports.length === 0
            ? styles.emptyListContent
            : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#3b82f6"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
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
  filtersContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#3b82f6",
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
  },
  reportCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  reportType: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  patientName: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  statusBadge: {
    padding: 4,
  },
  cardBody: {
    marginBottom: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#6b7280",
    flex: 1,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3b82f6",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#3b82f6",
    borderRadius: 24,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
