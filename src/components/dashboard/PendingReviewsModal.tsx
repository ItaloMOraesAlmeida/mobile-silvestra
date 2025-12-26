/**
 * PendingReviewsModal - Modal com listagem de consultas pendentes de feedback
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";
import { api } from "../../services/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PendingAppointment {
  id: string;
  patientName: string;
  scheduledDate: string;
  type?: string;
}

interface PendingReviewsModalProps {
  visible: boolean;
  onClose: () => void;
  onAppointmentPress: (appointmentId: string) => void;
}

export default function PendingReviewsModal({
  visible,
  onClose,
  onAppointmentPress,
}: PendingReviewsModalProps) {
  const colors = lightTheme?.colors || {
    primary: "#10B981",
    background: "#FFFFFF",
    text: "#1F2937",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    surface: "#F9FAFB",
    warning: "#F59E0B",
  };

  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<PendingAppointment[]>([]);

  useEffect(() => {
    if (visible) {
      loadPendingReviews();
    }
  }, [visible]);

  const loadPendingReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: any[] }>(
        "/appointments?status=COMPLETED&hasNotes=false&limit=100"
      );

      const mapped = response.data.map((apt: any) => ({
        id: apt.id,
        patientName: apt.patient?.patient?.user?.name || "Nome não disponível",
        scheduledDate: apt.scheduledDate,
        type: apt.type,
      }));

      setAppointments(mapped);
    } catch (error) {
      console.error("Erro ao carregar consultas pendentes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentPress = (appointmentId: string) => {
    onClose();
    onAppointmentPress(appointmentId);
  };

  const renderAppointmentItem = ({ item }: { item: PendingAppointment }) => (
    <TouchableOpacity
      style={[styles.appointmentItem, { backgroundColor: colors.surface }]}
      onPress={() => handleAppointmentPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.appointmentInfo}>
        <Text style={[styles.patientName, { color: colors.text }]}>
          {item.patientName}
        </Text>
        <Text style={[styles.appointmentDate, { color: colors.textSecondary }]}>
          {format(new Date(item.scheduledDate), "dd 'de' MMMM 'às' HH:mm", {
            locale: ptBR,
          })}
        </Text>
        {item.type && (
          <Text
            style={[styles.appointmentType, { color: colors.textSecondary }]}
          >
            {item.type}
          </Text>
        )}
      </View>

      <View
        style={[
          styles.warningBadge,
          { backgroundColor: colors.warning + "20" },
        ]}
      >
        <Ionicons name="alert-circle" size={20} color={colors.warning} />
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
                Avaliações Pendentes
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {appointments.length} consulta
                {appointments.length !== 1 ? "s" : ""} sem feedback
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

          {/* Lista de consultas */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                Carregando consultas...
              </Text>
            </View>
          ) : appointments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="checkmark-circle-outline"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Todas as consultas avaliadas!
              </Text>
            </View>
          ) : (
            <FlatList
              data={appointments}
              renderItem={renderAppointmentItem}
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
  appointmentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 14,
    marginBottom: 2,
  },
  appointmentType: {
    fontSize: 12,
  },
  warningBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
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
