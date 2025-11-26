import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useRoute,
  useNavigation,
  type RouteProp,
} from "@react-navigation/native";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import { useThemedStyles, useTheme } from "../../../hooks/useTheme";
import type { Theme } from "../../../theme";
import {
  MeasurementCard,
  EmptyState,
  CardSkeleton,
} from "../../../components/patient";
import {
  AddMeasurementModal,
  EditMeasurementModal,
} from "../../../components/modals";
import { MeasurementFiltersModal } from "../../../components/filters";
import { SearchBar } from "../../../components/search";
import { bodyMeasurementsService } from "../../../services/api";
import type {
  BodyMeasurement,
  CreateBodyMeasurementDto,
  UpdateBodyMeasurementDto,
} from "../../../types/patient-details.types";
import type { MeasurementFilters } from "../../../types/measurement-filters.types";
import {
  DEFAULT_FILTERS,
  countActiveFilters,
} from "../../../types/measurement-filters.types";
import { searchMeasurements } from "../../../utils/search.utils";

type RouteParams = {
  PatientDetails: {
    patientId: string;
    patientName: string;
  };
};

const ITEMS_PER_PAGE = 10;

export const MeasurementsTab: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const route = useRoute<RouteProp<RouteParams, "PatientDetails">>();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const { patientId, patientName } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [measurementModalVisible, setMeasurementModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] =
    useState<BodyMeasurement | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [filters, setFilters] = useState<MeasurementFilters>(DEFAULT_FILTERS);
  const [searchText, setSearchText] = useState("");
  const [filteredMeasurements, setFilteredMeasurements] = useState<
    BodyMeasurement[]
  >([]);

  const fetchMeasurements = React.useCallback(
    async (page: number, isRefresh = false) => {
      try {
        setError(null);

        if (isRefresh) {
          setRefreshing(true);
        } else if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await bodyMeasurementsService.findAll(patientId, {
          page,
          limit: ITEMS_PER_PAGE,
          sortOrder: "desc",
        });

        if (isRefresh || page === 1) {
          setMeasurements(response.data);
        } else {
          setMeasurements((prev) => [...prev, ...response.data]);
        }

        setCurrentPage(response.meta.page);
        setTotalPages(response.meta.totalPages);
      } catch (err) {
        console.error("Erro ao carregar medições:", err);
        setError("Erro ao carregar histórico de medições");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [patientId]
  );

  useEffect(() => {
    fetchMeasurements(1);
  }, [fetchMeasurements]);

  const onRefresh = React.useCallback(() => {
    fetchMeasurements(1, true);
  }, [fetchMeasurements]);

  const onEndReached = React.useCallback(() => {
    if (!loadingMore && currentPage < totalPages) {
      fetchMeasurements(currentPage + 1);
    }
  }, [loadingMore, currentPage, totalPages, fetchMeasurements]);

  const handleMeasurementPress = (measurement: BodyMeasurement) => {
    navigation.navigate("MeasurementDetails", {
      measurementId: measurement.id,
      patientId: patientId,
      patientName: patientName,
    });
  };

  const handleEditPress = (measurement: BodyMeasurement) => {
    setSelectedMeasurement(measurement);
    setEditModalVisible(true);
  };

  const handleDeletePress = (measurement: BodyMeasurement) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir esta medição? Esta ação não pode ser desfeita.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => handleDeleteMeasurement(measurement.id),
        },
      ]
    );
  };

  const handleDeleteMeasurement = async (measurementId: string) => {
    try {
      await bodyMeasurementsService.remove(patientId, measurementId);
      // Refresh list after successful deletion
      await fetchMeasurements(1, true);
      Alert.alert("Sucesso", "Medição excluída com sucesso!");
    } catch (error) {
      console.error("Error deleting measurement:", error);
      Alert.alert("Erro", "Não foi possível excluir a medição");
    }
  };

  const handleAddMeasurement = async (data: CreateBodyMeasurementDto) => {
    try {
      await bodyMeasurementsService.create(patientId, data);
      // Refresh list after successful creation
      await fetchMeasurements(1, true);
    } catch (error) {
      console.error("Error adding measurement:", error);
      Alert.alert("Erro", "Não foi possível adicionar a medição");
      throw error; // Re-throw to let modal handle it
    }
  };

  const handleEditMeasurement = async (
    measurementId: string,
    data: UpdateBodyMeasurementDto
  ) => {
    try {
      await bodyMeasurementsService.update(patientId, measurementId, data);
      // Refresh list after successful update
      await fetchMeasurements(1, true);
    } catch (error) {
      console.error("Error updating measurement:", error);
      Alert.alert("Erro", "Não foi possível atualizar a medição");
      throw error;
    }
  };

  /**
   * Aplica filtros
   */
  const handleApplyFilters = (newFilters: MeasurementFilters) => {
    setFilters(newFilters);
    fetchMeasurements(1, true);
  };

  /**
   * Reseta filtros
   */
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    fetchMeasurements(1, true);
  };

  /**
   * Atualiza texto de busca
   */
  const handleSearchChange = (text: string) => {
    setSearchText(text);
  };

  /**
   * Limpa busca
   */
  const handleClearSearch = () => {
    setSearchText("");
  };

  /**
   * Aplica busca e filtros
   */
  useEffect(() => {
    const filtered = searchMeasurements(measurements, searchText);
    setFilteredMeasurements(filtered);
  }, [measurements, searchText]);

  const renderItem = ({ item }: { item: BodyMeasurement }) => (
    <MeasurementCard
      measurement={item}
      onPress={() => handleMeasurementPress(item)}
      onEdit={() => handleEditPress(item)}
      onDelete={() => handleDeletePress(item)}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <EmptyState
        icon="body-outline"
        title="Nenhuma medição encontrada"
        message="Adicione a primeira medição do paciente para começar o acompanhamento da evolução corporal"
        actionLabel="Adicionar Medição"
        onAction={() => setMeasurementModalVisible(true)}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </View>
      </View>
    );
  }

  if (error && measurements.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <EmptyState
            icon="alert-circle-outline"
            title="Erro ao carregar"
            message={error}
            actionLabel="Tentar novamente"
            onAction={() => fetchMeasurements(1)}
          />
        </View>
      </View>
    );
  }

  const activeFiltersCount = countActiveFilters(filters);

  return (
    <View style={styles.container}>
      {/* Search and Filter */}
      <View style={styles.topContainer}>
        <View style={styles.searchWrapper}>
          <SearchBar
            value={searchText}
            onChangeText={handleSearchChange}
            onClear={handleClearSearch}
            placeholder="Buscar por data, peso, IMC..."
            resultCount={searchText ? filteredMeasurements.length : undefined}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFiltersVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="filter" size={20} color={theme.colors.primary} />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredMeasurements}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.content,
          measurements.length === 0 && styles.emptyContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setMeasurementModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={theme.colors.white} />
      </TouchableOpacity>

      {/* Add Measurement Modal */}
      <AddMeasurementModal
        visible={measurementModalVisible}
        patientId={patientId}
        onClose={() => setMeasurementModalVisible(false)}
        onSubmit={handleAddMeasurement}
      />

      {/* Edit Measurement Modal */}
      <EditMeasurementModal
        visible={editModalVisible}
        patientId={patientId}
        measurement={selectedMeasurement}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedMeasurement(null);
        }}
        onSubmit={handleEditMeasurement}
      />

      {/* Filters Modal */}
      <MeasurementFiltersModal
        visible={filtersVisible}
        filters={filters}
        onClose={() => setFiltersVisible(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    topContainer: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      flexDirection: "row",
      gap: theme.spacing.sm,
      alignItems: "flex-start",
    },
    searchWrapper: {
      flex: 1,
    },
    filterButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      gap: theme.spacing.xs,
      minHeight: 44,
    },

    filterBadge: {
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    filterBadgeText: {
      color: theme.colors.white,
      fontSize: 12,
      fontWeight: "600",
    },
    content: {
      padding: theme.spacing.md,
    },
    emptyContent: {
      flexGrow: 1,
      justifyContent: "center",
    },
    footerLoader: {
      padding: theme.spacing.md,
      alignItems: "center",
    },
    fab: {
      position: "absolute",
      right: 16,
      bottom: 16,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
      ...theme.shadows.lg,
    },
  });
