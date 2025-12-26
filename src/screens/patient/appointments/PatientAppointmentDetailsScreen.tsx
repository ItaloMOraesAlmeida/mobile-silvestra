import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { ConfirmModal } from "../../../components/ui/confirm-modal";
import { appointmentsService } from "../../../services/appointments";
import {
  Appointment,
  AppointmentStatus,
  AppointmentStatusLabels,
  AppointmentStatusColors,
  AppointmentTypeLabels,
} from "../../../types/appointments";

export default function PatientAppointmentDetailsScreen({
  route,
  navigation,
}: any) {
  const { appointmentId } = route.params;

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const loadAppointment = useCallback(async () => {
    try {
      setLoading(true);
      const data = await appointmentsService.findMyAppointments();
      const apt = data.find((a: Appointment) => a.id === appointmentId);

      if (!apt) {
        throw new Error("Consulta não encontrada");
      }

      setAppointment(apt);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message,
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [appointmentId, navigation]);

  useEffect(() => {
    loadAppointment();
  }, [loadAppointment]);

  const handleCancel = async () => {
    try {
      await appointmentsService.cancel(
        appointmentId,
        "Cancelado pelo paciente"
      );

      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: "Consulta cancelada com sucesso!",
      });
      setShowCancelModal(false);
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message,
      });
    }
  };

  const handleOpenMeeting = () => {
    if (appointment?.meetingUrl) {
      Linking.openURL(appointment.meetingUrl);
    }
  };

  const handleOpenMaps = () => {
    if (appointment?.location) {
      const url = Platform.select({
        ios: `maps://app?q=${encodeURIComponent(appointment.location)}`,
        android: `geo:0,0?q=${encodeURIComponent(appointment.location)}`,
      });
      if (url) {
        Linking.openURL(url).catch(() => {
          Toast.show({
            type: "error",
            text1: "Erro",
            text2: "Não foi possível abrir o mapa",
          });
        });
      }
    }
  };

  useEffect(() => {
    loadAppointment();
  }, [loadAppointment]);

  const formatDate = (dateString: string): string => {
    if (!dateString) return "Data não disponível";

    try {
      const dateOnly = dateString.includes("T")
        ? dateString.split("T")[0]
        : dateString;
      const date = new Date(dateOnly + "T00:00:00Z");

      if (isNaN(date.getTime())) return "Data inválida";

      return date.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
    } catch {
      return "Data inválida";
    }
  };

  const canCancel = () => {
    if (!appointment) return false;
    return ![
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CANCELLED_BY_PATIENT,
      AppointmentStatus.CANCELLED_BY_NUTRITIONIST,
      AppointmentStatus.NO_SHOW,
    ].includes(appointment.status);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5a9f" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#999" />
          <Text style={styles.errorText}>Consulta não encontrada</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = AppointmentStatusColors[appointment.status] || "#999";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header com Status */}
        <View style={styles.header}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>
              {AppointmentStatusLabels[appointment.status]}
            </Text>
          </View>
        </View>

        {/* Informações do Nutricionista */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutricionista</Text>
          <View style={styles.nutritionistCard}>
            <View style={styles.nutritionistAvatar}>
              <Ionicons name="person" size={32} color="#8b5a9f" />
            </View>
            <View style={styles.nutritionistInfo}>
              <Text style={styles.nutritionistName}>
                {appointment.nutritionist?.user?.name || "Nutricionista"}
              </Text>
              {appointment.nutritionist?.crn && (
                <Text style={styles.nutritionistCRN}>
                  CRN: {appointment.nutritionist.crn}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Informações da Consulta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações da Consulta</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="calendar" size={20} color="#8b5a9f" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Data</Text>
              <Text style={styles.infoValue}>
                {formatDate(appointment.scheduledDate)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="time" size={20} color="#8b5a9f" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Horário</Text>
              <Text style={styles.infoValue}>
                {appointment.scheduledTime} - {appointment.endTime} (
                {appointment.duration} min)
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="medical" size={20} color="#8b5a9f" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Tipo</Text>
              <Text style={styles.infoValue}>
                {AppointmentTypeLabels[appointment.type]}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons
                name={appointment.isOnline ? "videocam" : "location"}
                size={20}
                color="#8b5a9f"
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                {appointment.isOnline ? "Consulta Online" : "Local"}
              </Text>
              {appointment.isOnline ? (
                appointment.meetingUrl ? (
                  <TouchableOpacity onPress={handleOpenMeeting}>
                    <Text style={styles.linkText}>Acessar Link da Reunião</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.infoValue}>
                    Link será fornecido pelo nutricionista
                  </Text>
                )
              ) : (
                <TouchableOpacity onPress={handleOpenMaps}>
                  <Text style={styles.infoValue}>{appointment.location}</Text>
                  <Text style={styles.linkText}>Abrir no Mapa</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {appointment.price && appointment.price > 0 && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="cash" size={20} color="#8b5a9f" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Valor</Text>
                <Text style={styles.infoValue}>
                  R$ {appointment.price.toFixed(2)}
                  {appointment.isPaid && (
                    <Text style={styles.paidBadge}> • Pago</Text>
                  )}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Título e Descrição */}
        {(appointment.title || appointment.description) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalhes</Text>
            {appointment.title && (
              <View style={styles.detailsCard}>
                <Text style={styles.detailsTitle}>{appointment.title}</Text>
              </View>
            )}
            {appointment.description && (
              <View style={styles.detailsCard}>
                <Text style={styles.detailsText}>
                  {appointment.description}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Suas Observações */}
        {appointment.patientNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suas Observações</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{appointment.patientNotes}</Text>
            </View>
          </View>
        )}

        {/* Observações do Nutricionista */}
        {appointment.nutritionistNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Observações do Nutricionista
            </Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>
                {appointment.nutritionistNotes}
              </Text>
            </View>
          </View>
        )}

        {/* Botão de Cancelar */}
        {canCancel() && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCancelModal(true)}
            >
              <Ionicons name="close-circle" size={20} color="#fff" />
              <Text style={styles.cancelButtonText}>Cancelar Consulta</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <ConfirmModal
        visible={showCancelModal}
        title="Cancelar Consulta"
        message="Tem certeza que deseja cancelar esta consulta?"
        confirmText="Sim, cancelar"
        cancelText="Não"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#8b5a9f",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    alignItems: "center",
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  section: {
    marginTop: 16,
    backgroundColor: "#fff",
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  nutritionistCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f3e8f7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#9b6cb0",
  },
  nutritionistAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  nutritionistInfo: {
    flex: 1,
  },
  nutritionistName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  nutritionistCRN: {
    fontSize: 14,
    color: "#666",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3e8f7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: "#333",
    lineHeight: 20,
  },
  linkText: {
    fontSize: 14,
    color: "#8b5a9f",
    marginTop: 4,
    textDecorationLine: "underline",
  },
  paidBadge: {
    color: "#4caf50",
    fontWeight: "600",
  },
  detailsCard: {
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  detailsText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  notesCard: {
    padding: 16,
    backgroundColor: "#fff9e6",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  notesText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  cancelButton: {
    flexDirection: "row",
    backgroundColor: "#f44336",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
