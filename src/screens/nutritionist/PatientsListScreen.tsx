import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";

interface Patient {
  id: string;
  name: string;
  age: number;
  avatarUrl?: string;
  lastContact: string;
  status: "active" | "inactive" | "pending";
  adherence?: number;
}

interface PatientCardProps {
  patient: Patient;
  onPress: (patient: Patient) => void;
}

function PatientCard({ patient, onPress }: PatientCardProps) {
  const statusConfig = {
    active: {
      label: "Ativo",
      color: lightTheme.colors.success,
      icon: "checkmark-circle" as keyof typeof Ionicons.glyphMap,
    },
    inactive: {
      label: "Inativo",
      color: lightTheme.colors.gray[400],
      icon: "pause-circle" as keyof typeof Ionicons.glyphMap,
    },
    pending: {
      label: "Pendente",
      color: lightTheme.colors.warning,
      icon: "time" as keyof typeof Ionicons.glyphMap,
    },
  };

  const status = statusConfig[patient.status];

  return (
    <TouchableOpacity
      style={styles.patientCard}
      onPress={() => onPress(patient)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {patient.avatarUrl ? (
            <Image source={{ uri: patient.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {patient.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {/* Status Badge */}
          <View
            style={[styles.statusBadge, { backgroundColor: status.color }]}
          />
        </View>

        {/* Patient Info */}
        <View style={styles.patientInfo}>
          <View style={styles.patientHeader}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientAge}>{patient.age} anos</Text>
          </View>

          <View style={styles.patientDetails}>
            <View style={styles.detailItem}>
              <Ionicons name={status.icon} size={14} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons
                name="time-outline"
                size={14}
                color={lightTheme.colors.gray[400]}
              />
              <Text style={styles.lastContactText}>{patient.lastContact}</Text>
            </View>
          </View>

          {/* Adherence Bar (if available) */}
          {patient.adherence !== undefined && (
            <View style={styles.adherenceContainer}>
              <Text style={styles.adherenceLabel}>Adesão</Text>
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
              <Text style={styles.adherenceValue}>{patient.adherence}%</Text>
            </View>
          )}
        </View>

        {/* Chevron */}
        <Ionicons
          name="chevron-forward"
          size={20}
          color={lightTheme.colors.gray[400]}
        />
      </View>
    </TouchableOpacity>
  );
}

export function PatientsListScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive" | "pending"
  >("all");
  const [refreshing, setRefreshing] = useState(false);

  // Dados mockados - serão substituídos pela API
  const patients: Patient[] = [
    {
      id: "1",
      name: "Maria Silva",
      age: 34,
      lastContact: "Há 2 dias",
      status: "active",
      adherence: 85,
    },
    {
      id: "2",
      name: "João Santos",
      age: 28,
      lastContact: "Há 5 dias",
      status: "active",
      adherence: 72,
    },
    {
      id: "3",
      name: "Ana Costa",
      age: 42,
      lastContact: "Há 1 semana",
      status: "pending",
      adherence: 45,
    },
    {
      id: "4",
      name: "Carlos Oliveira",
      age: 51,
      lastContact: "Há 2 horas",
      status: "active",
      adherence: 92,
    },
    {
      id: "5",
      name: "Paula Mendes",
      age: 29,
      lastContact: "Há 3 dias",
      status: "inactive",
      adherence: 28,
    },
    {
      id: "6",
      name: "Roberto Lima",
      age: 36,
      lastContact: "Há 1 dia",
      status: "active",
      adherence: 88,
    },
  ];

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch = patient.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || patient.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handlePatientPress = (patient: Patient) => {
    // TODO: Navegar para tela de detalhes do paciente
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // TODO: Atualizar lista da API
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filterButtons = [
    { key: "all", label: "Todos", count: patients.length },
    {
      key: "active",
      label: "Ativos",
      count: patients.filter((p) => p.status === "active").length,
    },
    {
      key: "pending",
      label: "Pendentes",
      count: patients.filter((p) => p.status === "pending").length,
    },
    {
      key: "inactive",
      label: "Inativos",
      count: patients.filter((p) => p.status === "inactive").length,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color={lightTheme.colors.gray[400]}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar paciente..."
            placeholderTextColor={lightTheme.colors.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
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
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {filterButtons.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              filterStatus === filter.key && styles.filterButtonActive,
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
                styles.filterButtonText,
                filterStatus === filter.key && styles.filterButtonTextActive,
              ]}
            >
              {filter.label}
            </Text>
            <View
              style={[
                styles.filterBadge,
                filterStatus === filter.key && styles.filterBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.filterBadgeText,
                  filterStatus === filter.key && styles.filterBadgeTextActive,
                ]}
              >
                {filter.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Patients List */}
      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PatientCard patient={item} onPress={handlePatientPress} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[50],
  },
  searchContainer: {
    paddingHorizontal: lightTheme.spacing.xl,
    paddingTop: lightTheme.spacing.lg,
    paddingBottom: lightTheme.spacing.md,
    backgroundColor: lightTheme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: lightTheme.borderRadius.lg,
    paddingHorizontal: lightTheme.spacing.md,
    height: 48,
    gap: lightTheme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[800],
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: lightTheme.spacing.xl,
    paddingVertical: lightTheme.spacing.md,
    backgroundColor: lightTheme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
    gap: lightTheme.spacing.sm,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.sm,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: lightTheme.colors.gray[50],
    gap: lightTheme.spacing.xs,
  },
  filterButtonActive: {
    backgroundColor: lightTheme.colors.primaryBackground,
  },
  filterButtonText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[600],
  },
  filterButtonTextActive: {
    color: lightTheme.colors.primary,
  },
  filterBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: lightTheme.colors.gray[200],
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: lightTheme.spacing.xs - 2,
  },
  filterBadgeActive: {
    backgroundColor: lightTheme.colors.primary,
  },
  filterBadgeText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[600],
  },
  filterBadgeTextActive: {
    color: lightTheme.colors.white,
  },
  listContent: {
    paddingVertical: lightTheme.spacing.lg,
  },
  patientCard: {
    backgroundColor: lightTheme.colors.white,
    marginHorizontal: lightTheme.spacing.xl,
    marginBottom: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.lg,
    ...lightTheme.shadows.sm,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: lightTheme.spacing.lg,
  },
  avatarContainer: {
    position: "relative",
    marginRight: lightTheme.spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: lightTheme.borderRadius.full,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: lightTheme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.primary,
  },
  statusBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: lightTheme.borderRadius.full,
    borderWidth: 3,
    borderColor: lightTheme.colors.white,
  },
  patientInfo: {
    flex: 1,
    gap: lightTheme.spacing.xs,
  },
  patientHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: lightTheme.spacing.sm,
  },
  patientName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[800],
  },
  patientAge: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
  },
  patientDetails: {
    flexDirection: "row",
    gap: lightTheme.spacing.md,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.xs - 2,
  },
  statusText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
  },
  lastContactText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
  },
  adherenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.sm,
    marginTop: lightTheme.spacing.xs - 2,
  },
  adherenceLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    width: 45,
  },
  adherenceBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.full,
    overflow: "hidden",
  },
  adherenceBar: {
    height: "100%",
    borderRadius: lightTheme.borderRadius.full,
  },
  adherenceValue: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[600],
    width: 35,
    textAlign: "right",
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
});
