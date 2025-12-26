import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Share,
  TextInput,
  ScrollView,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";
import { usePatients } from "../../hooks/usePatients";
import { PatientStatus } from "../../types/patient";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FilterSheet, FilterValues } from "../../components/FilterSheet";
import { SortDropdown, SortField } from "../../components/SortDropdown";

const STORAGE_KEY_FILTERS = "@silvestra_patients_filters";
const STORAGE_KEY_SORT = "@silvestra_patients_sort";

// Interface local para o card (simplificada)
interface PatientCardData {
  id: string;
  name: string;
  age?: number;
  avatarUrl?: string;
  lastContact: string;
  status: "active" | "inactive" | "pending" | "archived";
  adherence?: number;
  accessCode?: string;
  accessCodeUsedAt?: Date;
  accessCodeExpiresAt?: Date;
}

interface PatientCardProps {
  patient: PatientCardData;
  onPress: (patient: PatientCardData) => void;
  onViewCode?: (patient: PatientCardData) => void;
}

function PatientCard({ patient, onPress, onViewCode }: PatientCardProps) {
  const statusConfig: Record<
    string,
    {
      label: string;
      color: string;
      bgColor: string;
      icon: keyof typeof Ionicons.glyphMap;
    }
  > = {
    active: {
      label: "Ativo",
      color: lightTheme.colors.success,
      bgColor: `${lightTheme.colors.success}15`,
      icon: "checkmark-circle",
    },
    inactive: {
      label: "Inativo",
      color: lightTheme.colors.gray[500],
      bgColor: lightTheme.colors.gray[100],
      icon: "pause-circle",
    },
    pending: {
      label: "Pendente",
      color: lightTheme.colors.warning,
      bgColor: `${lightTheme.colors.warning}15`,
      icon: "time",
    },
    archived: {
      label: "Arquivado",
      color: lightTheme.colors.gray[400],
      bgColor: lightTheme.colors.gray[50],
      icon: "archive",
    },
  };

  const status = statusConfig[patient.status] || statusConfig.active;
  const isExpired =
    patient.accessCodeExpiresAt &&
    new Date(patient.accessCodeExpiresAt) < new Date();
  const hasPendingCode = patient.accessCode && !patient.accessCodeUsedAt;

  return (
    <TouchableOpacity
      style={styles.patientCard}
      onPress={() => onPress(patient)}
      activeOpacity={0.7}
    >
      {/* Header com Avatar e Status */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarSection}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {patient.avatarUrl ? (
              <Image
                source={{ uri: patient.avatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {patient.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Nome e Informações Básicas */}
          <View style={styles.patientMainInfo}>
            <Text style={styles.patientName} numberOfLines={1}>
              {patient.name}
            </Text>
            <View style={styles.quickInfo}>
              {patient.age && (
                <View style={styles.infoChip}>
                  <Ionicons
                    name="calendar-outline"
                    size={12}
                    color={lightTheme.colors.gray[500]}
                  />
                  <Text style={styles.infoChipText}>{patient.age} anos</Text>
                </View>
              )}
              <View style={styles.infoChip}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={lightTheme.colors.gray[500]}
                />
                <Text style={styles.infoChipText}>{patient.lastContact}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Status Badge */}
        <View style={[styles.statusPill, { backgroundColor: status.bgColor }]}>
          <Ionicons name={status.icon} size={14} color={status.color} />
          <Text style={[styles.statusPillText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
      </View>

      {/* Adesão (se disponível) */}
      {patient.adherence !== undefined && (
        <View style={styles.adherenceSection}>
          <View style={styles.adherenceHeader}>
            <Text style={styles.adherenceLabel}>Adesão ao plano</Text>
            <Text
              style={[
                styles.adherenceValue,
                {
                  color:
                    patient.adherence >= 70
                      ? lightTheme.colors.success
                      : patient.adherence >= 40
                      ? lightTheme.colors.warning
                      : lightTheme.colors.error,
                },
              ]}
            >
              {patient.adherence}%
            </Text>
          </View>
          <View style={styles.adherenceBarContainer}>
            <View
              style={[
                styles.adherenceBar,
                {
                  width: `${patient.adherence}%`,
                  backgroundColor:
                    patient.adherence >= 70
                      ? lightTheme.colors.success
                      : patient.adherence >= 40
                      ? lightTheme.colors.warning
                      : lightTheme.colors.error,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Código de Acesso Pendente/Expirado */}
      {hasPendingCode && (
        <View style={styles.accessCodeSection}>
          <View
            style={[
              styles.accessCodeBanner,
              {
                backgroundColor: isExpired
                  ? `${lightTheme.colors.error}08`
                  : `${lightTheme.colors.warning}08`,
              },
            ]}
          >
            <View style={styles.accessCodeInfo}>
              <Ionicons
                name={isExpired ? "alert-circle" : "hourglass-outline"}
                size={16}
                color={
                  isExpired
                    ? lightTheme.colors.error
                    : lightTheme.colors.warning
                }
              />
              <Text
                style={[
                  styles.accessCodeText,
                  {
                    color: isExpired
                      ? lightTheme.colors.error
                      : lightTheme.colors.warning,
                  },
                ]}
              >
                {isExpired ? "Código expirado" : "Aguardando confirmação"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewCodeButton}
              onPress={(e) => {
                e.stopPropagation();
                onViewCode?.(patient);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="key" size={14} color={lightTheme.colors.white} />
              <Text style={styles.viewCodeButtonText}>Ver Código</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

interface PatientsListScreenProps {
  navigation: any;
  route?: any;
}

export function PatientsListScreen({
  navigation,
  route,
}: PatientsListScreenProps) {
  // Obter filtro inicial dos parâmetros da rota, se existir
  const initialFilter = route?.params?.initialFilter || "all";

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive" | "pending" | "archived"
  >(initialFilter);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState<SortField>(SortField.UPDATED_AT_DESC);
  const [selectedPatientCode, setSelectedPatientCode] = useState<{
    id: string;
    name: string;
    code: string;
    expiresAt?: Date;
  } | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [regeneratingCode, setRegeneratingCode] = useState(false);

  const {
    patients: apiPatients,
    loading,
    error,
    getPatients,
    searchPatients,
    refreshPatients,
    regenerateAccessCode,
  } = usePatients();

  /**
   * Carregar filtros salvos do AsyncStorage
   */
  useEffect(() => {
    const loadSavedPreferences = async () => {
      try {
        const [savedFilters, savedSort] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_FILTERS),
          AsyncStorage.getItem(STORAGE_KEY_SORT),
        ]);

        if (savedFilters) {
          setFilters(JSON.parse(savedFilters));
        }

        if (savedSort) {
          setSortBy(savedSort as SortField);
        }
      } catch (error) {
        console.error("Erro ao carregar preferências:", error);
      }
    };

    loadSavedPreferences();
  }, []);

  /**
   * Salvar filtros no AsyncStorage quando mudarem
   */
  useEffect(() => {
    const saveFilters = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY_FILTERS,
          JSON.stringify(filters)
        );
      } catch (error) {
        console.error("Erro ao salvar filtros:", error);
      }
    };

    saveFilters();
  }, [filters]);

  /**
   * Salvar ordenação no AsyncStorage quando mudar
   */
  useEffect(() => {
    const saveSort = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY_SORT, sortBy);
      } catch (error) {
        console.error("Erro ao salvar ordenação:", error);
      }
    };

    saveSort();
  }, [sortBy]);

  const loadPatients = React.useCallback(async () => {
    try {
      if (filterStatus === "all") {
        await getPatients();
      } else {
        await getPatients({
          status: filterStatus.toUpperCase() as PatientStatus,
        });
      }
    } catch (err) {
      console.error("Erro ao carregar pacientes:", err);
    }
  }, [filterStatus, getPatients]);

  // Carregar pacientes ao montar o componente
  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Refresh quando voltar da tela de cadastro
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // Verifica se há parâmetro de refresh
      const params = navigation
        .getState()
        .routes.find((r: any) => r.name === "Patients")?.params as any;

      if (params?.refresh) {
        refreshPatients().catch((error) => {
          console.error(
            "❌ [PATIENTS_LIST] Erro ao recarregar pacientes:",
            error
          );
        });
        // Limpa o parâmetro após usar
        navigation.setParams({ refresh: undefined, timestamp: undefined });
      } else {
      }
    });

    return unsubscribe;
  }, [navigation, refreshPatients]);

  // Buscar com debounce
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery) {
        searchPatients(searchQuery);
      } else {
        loadPatients();
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [searchQuery, searchPatients, loadPatients]);

  // Transformar dados da API para o formato do card
  const patientsCardData: PatientCardData[] = apiPatients.map((patient) => ({
    id: patient.id,
    name: patient.patient.name,
    age: patient.patient.age,
    avatarUrl: patient.patient.avatarUrl,
    lastContact: patient.lastContactDate
      ? formatDistanceToNow(new Date(patient.lastContactDate), {
          addSuffix: true,
          locale: ptBR,
        })
      : "Nunca",
    status: patient.status.toLowerCase() as
      | "active"
      | "inactive"
      | "pending"
      | "archived",
    adherence: patient.adherenceScore,
    accessCode: patient.accessCode,
    accessCodeUsedAt: patient.accessCodeUsedAt
      ? new Date(patient.accessCodeUsedAt)
      : undefined,
    accessCodeExpiresAt: patient.accessCodeExpiresAt
      ? new Date(patient.accessCodeExpiresAt)
      : undefined,
  }));

  const handlePatientPress = (patient: PatientCardData) => {
    navigation.navigate("PatientDetails", { patientId: patient.id });
  };

  const isCodeExpired = (expiresAt?: Date) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const handleViewCode = (patient: PatientCardData) => {
    if (patient.accessCode) {
      setSelectedPatientCode({
        id: patient.id,
        name: patient.name,
        code: patient.accessCode,
        expiresAt: patient.accessCodeExpiresAt,
      });
      setShowCodeModal(true);
    }
  };

  const handleCopyCode = async () => {
    if (selectedPatientCode) {
      await Clipboard.setStringAsync(selectedPatientCode.code);
      Toast.show({
        type: "success",
        text1: "Código copiado!",
        text2: "O código foi copiado para a área de transferência",
        position: "bottom",
        visibilityTime: 2000,
      });
    }
  };

  const handleShareCode = async () => {
    if (selectedPatientCode) {
      try {
        await Share.share({
          message: `Código de acesso para ${selectedPatientCode.name}: ${selectedPatientCode.code}`,
        });
      } catch (error) {
        console.error("Erro ao compartilhar:", error);
        Toast.show({
          type: "error",
          text1: "Erro ao compartilhar",
          text2: "Não foi possível compartilhar o código",
          position: "bottom",
        });
      }
    }
  };

  const handleRegenerateCode = async () => {
    if (!selectedPatientCode) return;

    setRegeneratingCode(true);
    try {
      const response = await regenerateAccessCode(selectedPatientCode.id);
      const updatedPatient = (response as any).data || response;

      // Atualiza o código no modal
      setSelectedPatientCode({
        id: updatedPatient.id,
        name: updatedPatient.patient.name,
        code: updatedPatient.accessCode,
        expiresAt: updatedPatient.accessCodeExpiresAt,
      });

      Toast.show({
        type: "success",
        text1: "Código regenerado!",
        text2: "Um novo código foi gerado com sucesso",
        position: "bottom",
        visibilityTime: 3000,
      });

      // Atualiza a lista de pacientes
      await refreshPatients();
    } catch (error: any) {
      console.error("Erro ao regenerar código:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao regenerar",
        text2:
          error.response?.data?.message ||
          "Não foi possível gerar um novo código",
        position: "bottom",
      });
    } finally {
      setRegeneratingCode(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshPatients();
    } catch (err: any) {
      console.error("Erro ao atualizar pacientes:", err);
      console.error("Detalhes do erro:", {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
      });

      Toast.show({
        type: "error",
        text1: "Erro ao atualizar",
        text2:
          err?.response?.data?.message ||
          err?.message ||
          "Não foi possível atualizar a lista",
        position: "bottom",
      });
    }
  };

  const filterButtons = [
    { key: "all", label: "Todos", count: patientsCardData.length },
    {
      key: "active",
      label: "Ativos",
      count: patientsCardData.filter((p) => p.status === "active").length,
    },
    {
      key: "pending",
      label: "Pendentes",
      count: patientsCardData.filter((p) => p.status === "pending").length,
    },
    {
      key: "inactive",
      label: "Inativos",
      count: patientsCardData.filter((p) => p.status === "inactive").length,
    },
  ];

  // Loading inicial
  if (loading && apiPatients.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={lightTheme.colors.primary} />
        <Text style={styles.loadingText}>Carregando pacientes...</Text>
      </View>
    );
  }

  // Erro
  if (error && apiPatients.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons
          name="alert-circle"
          size={64}
          color={lightTheme.colors.error}
        />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPatients}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /**
   * Verifica se há filtros ativos
   */
  const hasActiveFilters = Object.keys(filters).length > 0;

  /**
   * Handler para aplicar filtros
   */
  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters);
    // TODO: Integrar com API
    // Aqui você chamaria getPatients(newFilters)
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Ionicons
            name="search"
            size={20}
            color={lightTheme.colors.gray[400]}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por nome, email ou CPF..."
            placeholderTextColor={lightTheme.colors.gray[400]}
            style={styles.searchInputText}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={lightTheme.colors.gray[400]}
              />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.filterIconButton,
            hasActiveFilters && styles.filterIconButtonActive,
          ]}
          onPress={() => setFilterSheetVisible(true)}
        >
          <Ionicons
            name="options"
            size={20}
            color={
              hasActiveFilters
                ? lightTheme.colors.primary
                : lightTheme.colors.gray[600]
            }
          />
          {hasActiveFilters && <View style={styles.filterActiveDot} />}
        </TouchableOpacity>
      </View>

      {/* Controls Bar */}
      <View style={styles.controlsBar}>
        {/* Sort Dropdown */}
        <View style={styles.sortContainer}>
          <SortDropdown value={sortBy} onChange={setSortBy} />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsContent}
        >
          {filterButtons.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                filterStatus === filter.key && styles.filterTabActive,
              ]}
              onPress={() =>
                setFilterStatus(
                  filter.key as "all" | "active" | "inactive" | "pending"
                )
              }
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filterStatus === filter.key && styles.filterTabTextActive,
                ]}
              >
                {filter.label}
              </Text>
              <View
                style={[
                  styles.filterTabBadge,
                  filterStatus === filter.key && styles.filterTabBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterTabBadgeText,
                    filterStatus === filter.key &&
                      styles.filterTabBadgeTextActive,
                  ]}
                >
                  {filter.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Patients List */}
      <FlatList
        data={patientsCardData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PatientCard
            patient={item}
            onPress={handlePatientPress}
            onViewCode={handleViewCode}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="people-outline"
              size={64}
              color={lightTheme.colors.gray[300]}
            />
            <Text style={styles.emptyText}>Nenhum paciente encontrado</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? "Tente buscar com outros termos"
                : "Adicione seu primeiro paciente"}
            </Text>
          </View>
        }
      />

      {/* Filter Sheet */}
      <FilterSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        filters={filters}
        onApply={handleApplyFilters}
      />

      {/* Modal de Código de Acesso */}
      <Modal
        visible={showCodeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCodeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.codeModalContent}>
            <View style={styles.codeModalHeader}>
              <View
                style={[
                  styles.codeModalIconContainer,
                  isCodeExpired(selectedPatientCode?.expiresAt) && {
                    backgroundColor: `${lightTheme.colors.error}15`,
                  },
                ]}
              >
                <Ionicons
                  name={
                    isCodeExpired(selectedPatientCode?.expiresAt)
                      ? "alert-circle"
                      : "key"
                  }
                  size={24}
                  color={
                    isCodeExpired(selectedPatientCode?.expiresAt)
                      ? lightTheme.colors.error
                      : lightTheme.colors.primary
                  }
                />
              </View>
              <Text style={styles.codeModalTitle}>
                {isCodeExpired(selectedPatientCode?.expiresAt)
                  ? "Código Expirado"
                  : "Código de Acesso"}
              </Text>
              <Text style={styles.codeModalSubtitle}>
                {selectedPatientCode?.name}
              </Text>
            </View>

            <View
              style={[
                styles.codeModalCodeBox,
                isCodeExpired(selectedPatientCode?.expiresAt) && {
                  opacity: 0.5,
                },
              ]}
            >
              <Text style={styles.codeModalCodeText}>
                {selectedPatientCode?.code}
              </Text>
            </View>

            {isCodeExpired(selectedPatientCode?.expiresAt) ? (
              <View style={styles.expiredWarning}>
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color={lightTheme.colors.error}
                />
                <Text style={styles.expiredWarningText}>
                  Este código expirou e não pode mais ser usado. Gere um novo
                  código para o paciente.
                </Text>
              </View>
            ) : (
              <Text style={styles.codeModalInstructions}>
                Compartilhe este código com o paciente para que ele possa fazer
                o primeiro acesso ao aplicativo.
              </Text>
            )}

            <View style={styles.codeModalActions}>
              <TouchableOpacity
                style={[
                  styles.codeModalCopyButton,
                  isCodeExpired(selectedPatientCode?.expiresAt) &&
                    styles.codeModalButtonDisabled,
                ]}
                onPress={handleCopyCode}
                disabled={isCodeExpired(selectedPatientCode?.expiresAt)}
              >
                <Ionicons
                  name="copy-outline"
                  size={18}
                  color={lightTheme.colors.white}
                />
                <Text style={styles.codeModalCopyButtonText}>Copiar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.codeModalShareButton,
                  isCodeExpired(selectedPatientCode?.expiresAt) &&
                    styles.codeModalButtonDisabled,
                ]}
                onPress={handleShareCode}
                disabled={isCodeExpired(selectedPatientCode?.expiresAt)}
              >
                <Ionicons
                  name="share-outline"
                  size={18}
                  color={
                    isCodeExpired(selectedPatientCode?.expiresAt)
                      ? lightTheme.colors.gray[400]
                      : lightTheme.colors.primary
                  }
                />
                <Text
                  style={[
                    styles.codeModalShareButtonText,
                    isCodeExpired(selectedPatientCode?.expiresAt) && {
                      color: lightTheme.colors.gray[400],
                    },
                  ]}
                >
                  Compartilhar
                </Text>
              </TouchableOpacity>
            </View>

            {/* Botão Gerar Novo Código (só aparece se expirado) */}
            {isCodeExpired(selectedPatientCode?.expiresAt) && (
              <TouchableOpacity
                style={styles.codeModalRegenerateButton}
                onPress={handleRegenerateCode}
                disabled={regeneratingCode}
              >
                <Ionicons
                  name="refresh"
                  size={18}
                  color={lightTheme.colors.white}
                />
                <Text style={styles.codeModalRegenerateButtonText}>
                  {regeneratingCode ? "Gerando..." : "Gerar Novo Código"}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.codeModalCloseButton}
              onPress={() => setShowCodeModal(false)}
            >
              <Text style={styles.codeModalCloseButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[50],
  },
  // Estilos da barra de busca
  searchContainer: {
    backgroundColor: lightTheme.colors.white,
    paddingHorizontal: lightTheme.spacing.xl,
    paddingVertical: lightTheme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  searchInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.lg,
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.sm,
    gap: lightTheme.spacing.sm,
  },
  searchInputText: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[900],
    paddingVertical: 4,
  },
  filterIconButton: {
    width: 40,
    height: 40,
    borderRadius: lightTheme.borderRadius.lg,
    backgroundColor: lightTheme.colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterIconButtonActive: {
    backgroundColor: `${lightTheme.colors.primary}15`,
  },
  filterActiveDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: lightTheme.colors.primary,
  },
  // Controls bar (ordenação)
  controlsBar: {
    backgroundColor: lightTheme.colors.white,
    paddingHorizontal: lightTheme.spacing.xl,
    paddingVertical: lightTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
    zIndex: 10, // Garante que o botão fique acima das tabs
  },
  sortContainer: {
    // Removido flex: 1 que estava causando problemas
  },
  // Filter tabs
  filterTabsContainer: {
    backgroundColor: lightTheme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
    zIndex: 1, // Abaixo do controlsBar
  },
  filterTabsContent: {
    paddingHorizontal: lightTheme.spacing.xl,
    paddingVertical: lightTheme.spacing.md,
    gap: lightTheme.spacing.sm,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.sm,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: lightTheme.colors.gray[100],
    gap: lightTheme.spacing.xs,
  },
  filterTabActive: {
    backgroundColor: `${lightTheme.colors.primary}15`,
  },
  filterTabText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[600],
  },
  filterTabTextActive: {
    color: lightTheme.colors.primary,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
  },
  filterTabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: lightTheme.colors.gray[300],
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  filterTabBadgeActive: {
    backgroundColor: lightTheme.colors.primary,
  },
  filterTabBadgeText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[700],
  },
  filterTabBadgeTextActive: {
    color: lightTheme.colors.white,
  },
  listContent: {
    paddingVertical: lightTheme.spacing.lg,
  },
  // === PATIENT CARD STYLES ===
  patientCard: {
    backgroundColor: lightTheme.colors.white,
    marginHorizontal: lightTheme.spacing.xl,
    marginBottom: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing.lg,
    ...lightTheme.shadows.sm,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[100],
  },

  // Card Header (Avatar + Nome + Status)
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: lightTheme.spacing.md,
  },
  avatarSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: lightTheme.spacing.sm,
  },
  avatarContainer: {
    marginRight: lightTheme.spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: lightTheme.borderRadius.full,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: lightTheme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.white,
  },

  // Informações principais (Nome + Quick Info)
  patientMainInfo: {
    flex: 1,
    justifyContent: "center",
  },
  patientName: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[900],
    marginBottom: 4,
  },
  quickInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: lightTheme.spacing.xs,
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.gray[50],
    paddingHorizontal: lightTheme.spacing.xs,
    paddingVertical: 2,
    borderRadius: lightTheme.borderRadius.sm,
    gap: 4,
  },
  infoChipText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
    fontWeight: lightTheme.typography.fontWeight.medium as any,
  },

  // Status Pill
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: lightTheme.spacing.sm,
    paddingVertical: 6,
    borderRadius: lightTheme.borderRadius.full,
    gap: 4,
  },
  statusPillText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
  },

  // Adherence Section
  adherenceSection: {
    marginTop: lightTheme.spacing.sm,
    paddingTop: lightTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[100],
  },
  adherenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: lightTheme.spacing.xs,
  },
  adherenceLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
    fontWeight: lightTheme.typography.fontWeight.medium as any,
  },
  adherenceValue: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
  },
  adherenceBarContainer: {
    height: 6,
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.full,
    overflow: "hidden",
  },
  adherenceBar: {
    height: "100%",
    borderRadius: lightTheme.borderRadius.full,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: lightTheme.spacing["3xl"],
    paddingHorizontal: lightTheme.spacing.xl,
  },
  emptyText: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[600],
    marginTop: lightTheme.spacing.lg,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[400],
    marginTop: lightTheme.spacing.xs,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: lightTheme.colors.gray[50],
    padding: lightTheme.spacing.xl,
  },
  loadingText: {
    marginTop: lightTheme.spacing.lg,
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: lightTheme.colors.gray[50],
    padding: lightTheme.spacing.xl,
  },
  errorText: {
    marginTop: lightTheme.spacing.lg,
    marginBottom: lightTheme.spacing.xl,
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: lightTheme.colors.primary,
    paddingHorizontal: lightTheme.spacing.xl,
    paddingVertical: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.lg,
  },
  retryButtonText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
  },
  // Access Code Section
  accessCodeSection: {
    marginTop: lightTheme.spacing.md,
    paddingTop: lightTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[100],
  },
  accessCodeBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: lightTheme.spacing.sm,
    borderRadius: lightTheme.borderRadius.lg,
    gap: lightTheme.spacing.sm,
  },
  accessCodeInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: lightTheme.spacing.xs,
  },
  accessCodeText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    flex: 1,
  },
  viewCodeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.primary,
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.xs,
    borderRadius: lightTheme.borderRadius.md,
    gap: 4,
  },
  viewCodeButtonText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.white,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
  },
  // Estilos do modal de código
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: lightTheme.spacing.xl,
  },
  codeModalContent: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing.lg,
    width: "100%",
    maxWidth: 400,
  },
  codeModalHeader: {
    alignItems: "center",
    marginBottom: lightTheme.spacing.md,
  },
  codeModalIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${lightTheme.colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: lightTheme.spacing.sm,
  },
  codeModalTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing.xs,
  },
  codeModalSubtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
  },
  codeModalCodeBox: {
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: lightTheme.borderRadius.lg,
    paddingVertical: lightTheme.spacing.md,
    paddingHorizontal: lightTheme.spacing.lg,
    alignItems: "center",
    marginBottom: lightTheme.spacing.sm,
  },
  codeModalCodeText: {
    fontSize: 24,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[900],
    letterSpacing: 3,
  },
  codeModalInstructions: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    textAlign: "center",
    marginBottom: lightTheme.spacing.md,
    lineHeight: 18,
  },
  codeModalActions: {
    flexDirection: "row",
    gap: lightTheme.spacing.sm,
    marginBottom: lightTheme.spacing.sm,
  },
  codeModalCopyButton: {
    flex: 1,
    backgroundColor: lightTheme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: lightTheme.spacing.sm,
    borderRadius: lightTheme.borderRadius.md,
    gap: 6,
  },
  codeModalCopyButtonText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
  },
  codeModalShareButton: {
    flex: 1,
    backgroundColor: lightTheme.colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: lightTheme.spacing.sm,
    borderRadius: lightTheme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: lightTheme.colors.primary,
    gap: 6,
  },
  codeModalShareButtonText: {
    color: lightTheme.colors.primary,
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
  },
  codeModalCloseButton: {
    backgroundColor: lightTheme.colors.gray[100],
    paddingVertical: 12,
    borderRadius: lightTheme.borderRadius.md,
    alignItems: "center",
  },
  codeModalCloseButtonText: {
    color: lightTheme.colors.gray[700],
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
  },
  expiredWarning: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: `${lightTheme.colors.error}10`,
    padding: lightTheme.spacing.sm,
    borderRadius: lightTheme.borderRadius.md,
    marginBottom: lightTheme.spacing.md,
    gap: lightTheme.spacing.xs,
  },
  expiredWarningText: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.error,
    lineHeight: 18,
  },
  codeModalButtonDisabled: {
    opacity: 0.5,
  },
  codeModalRegenerateButton: {
    backgroundColor: lightTheme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: lightTheme.borderRadius.md,
    gap: lightTheme.spacing.xs,
    marginBottom: lightTheme.spacing.sm,
  },
  codeModalRegenerateButtonText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
  },
});
