/**
 * AdherencePatientsModal - Modal com listagem de pacientes e suas adesões
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";
import { getDashboardTopPerformers } from "../../services/dashboard.service";

interface PatientAdherence {
  id: string;
  name: string;
  avatarUrl?: string;
  adherence: number;
  status: string;
}

interface AdherencePatientsModalProps {
  visible: boolean;
  onClose: () => void;
  onPatientPress: (patientId: string) => void;
}

export default function AdherencePatientsModal({
  visible,
  onClose,
  onPatientPress,
}: AdherencePatientsModalProps) {
  const colors = lightTheme?.colors || {
    primary: "#10B981",
    background: "#FFFFFF",
    text: "#1F2937",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    surface: "#F9FAFB",
    error: "#EF4444",
    warning: "#F59E0B",
    success: "#10B981",
  };
  const [loading, setLoading] = useState(false);
  const [patientsData, setPatientsData] = useState<PatientAdherence[]>([]);

  useEffect(() => {
    if (visible) {
      loadPatients();
    }
  }, [visible]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      // Buscar todos os pacientes (top performers + needs support)
      const data = await getDashboardTopPerformers(100); // Limit alto para pegar todos

      // Combinar topPerformers e needsSupport
      const allPatients = [...data.topPerformers, ...data.needsSupport];

      // Mapear para o formato do modal
      const mapped: PatientAdherence[] = allPatients.map((patient) => ({
        id: patient.patientId,
        name: patient.patientName,
        avatarUrl: patient.avatarUrl,
        adherence: patient.adherenceRate,
        status: "ACTIVE",
      }));

      // Ordenar por adesão (maior para menor)
      mapped.sort((a, b) => b.adherence - a.adherence);

      setPatientsData(mapped);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAdherenceColor = (adherence: number) => {
    if (adherence >= 80) return "#10B981"; // Verde
    if (adherence >= 50) return "#F59E0B"; // Amarelo
    return "#EF4444"; // Vermelho
  };

  const handlePatientPress = (patientId: string) => {
    onClose();
    onPatientPress(patientId);
  };

  const renderPatientItem = ({ item }: { item: PatientAdherence }) => (
    <TouchableOpacity
      style={[styles.patientItem, { backgroundColor: colors.card }]}
      onPress={() => handlePatientPress(item.id)}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {item.name ? item.name.charAt(0).toUpperCase() : "?"}
            </Text>
          </View>
        )}
      </View>

      {/* Informações */}
      <View style={styles.patientInfo}>
        <Text style={[styles.patientName, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.adherenceLabel, { color: colors.textSecondary }]}>
          Adesão alimentar
        </Text>
      </View>

      {/* Adesão */}
      <View style={styles.adherenceContainer}>
        <Text
          style={[
            styles.adherenceValue,
            { color: getAdherenceColor(item.adherence) },
          ]}
        >
          {item.adherence}%
        </Text>
        <View
          style={[
            styles.adherenceBadge,
            { backgroundColor: getAdherenceColor(item.adherence) + "20" },
          ]}
        >
          <Ionicons
            name={
              item.adherence >= 80
                ? "trending-up"
                : item.adherence >= 50
                ? "remove"
                : "trending-down"
            }
            size={16}
            color={getAdherenceColor(item.adherence)}
          />
        </View>
      </View>

      {/* Ícone de navegação */}
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: colors.background }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>
                Adesão Alimentar dos Pacientes
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {patientsData.length} pacientes
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: colors.gray?.[100] || "#F3F4F6" },
              ]}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Lista de pacientes */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                Carregando pacientes...
              </Text>
            </View>
          ) : patientsData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="people-outline"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Nenhum paciente encontrado
              </Text>
            </View>
          ) : (
            <FlatList
              data={patientsData}
              renderItem={renderPatientItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={true}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    height: "85%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: 20,
  },
  patientItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  adherenceLabel: {
    fontSize: 12,
  },
  adherenceContainer: {
    alignItems: "flex-end",
    marginRight: 12,
  },
  adherenceValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  adherenceBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
});
