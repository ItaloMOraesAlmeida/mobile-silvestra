/**
 * InactivePatientsModal - Modal com listagem de pacientes inativos
 */

import React from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";

interface InactivePatient {
  id: string;
  name: string;
  avatarUrl?: string;
  alertType: string;
  message: string;
  daysSinceActivity?: number;
}

interface InactivePatientsModalProps {
  visible: boolean;
  onClose: () => void;
  patients: InactivePatient[];
  onPatientPress: (patientId: string) => void;
}

export default function InactivePatientsModal({
  visible,
  onClose,
  patients,
  onPatientPress,
}: InactivePatientsModalProps) {
  const colors = lightTheme?.colors || {
    primary: "#10B981",
    background: "#FFFFFF",
    text: "#1F2937",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    surface: "#F9FAFB",
    warning: "#F59E0B",
  };

  const handlePatientPress = (patientId: string) => {
    onClose();
    onPatientPress(patientId);
  };

  const renderPatientItem = ({ item }: { item: InactivePatient }) => (
    <TouchableOpacity
      style={[styles.patientItem, { backgroundColor: colors.surface }]}
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
        <View style={styles.alertRow}>
          <Ionicons name="alert-circle" size={14} color={colors.warning} />
          <Text style={[styles.alertText, { color: colors.textSecondary }]}>
            {item.message}
          </Text>
        </View>
      </View>

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
                Pacientes Inativos
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {patients.length} paciente{patients.length !== 1 ? "s" : ""} sem
                atividade recente
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
          {patients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="checkmark-circle-outline"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Todos os pacientes estão ativos!
              </Text>
            </View>
          ) : (
            <FlatList
              data={patients}
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
    height: "70%",
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
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
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
    fontWeight: "bold",
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertText: {
    fontSize: 13,
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
});
