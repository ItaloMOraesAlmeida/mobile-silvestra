import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
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

type FilterType = "all" | "upcoming" | "completed" | "cancelled";

export default function PatientAppointmentsScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<FilterType>("upcoming");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(
    null
  );

  const loadAppointments = async () => {
    try {
      setLoading(true);

      const data = await appointmentsService.findMyAppointments();

      setAppointments(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("❌ [PatientAppointments] Erro ao carregar:", error);
      console.error("❌ [PatientAppointments] Error stack:", error.stack);
      console.error("❌ [PatientAppointments] Error message:", error.message);
      console.error(
        "❌ [PatientAppointments] Error response:",
        error.response?.data
      );
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message || "Erro ao carregar consultas",
      });
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadAppointments();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const filterAppointments = (): Appointment[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (!Array.isArray(appointments)) {
      return [];
    }

    const filtered = appointments.filter((appointment) => {
      // Extrair componentes UTC e criar data local para evitar problemas de timezone
      const dateUTC = new Date(appointment.scheduledDate);
      const year = dateUTC.getUTCFullYear();
      const month = dateUTC.getUTCMonth();
      const day = dateUTC.getUTCDate();
      const appointmentDate = new Date(year, month, day);
      appointmentDate.setHours(0, 0, 0, 0);

      switch (filter) {
        case "all":
          // Mostra todas as consultas
          return true;

        case "upcoming":
          // Apenas consultas futuras (hoje ou depois) com status não finalizados
          return (
            appointmentDate >= today &&
            [
              AppointmentStatus.PENDING,
              AppointmentStatus.CONFIRMED,
              AppointmentStatus.RESCHEDULED,
            ].includes(appointment.status)
          );

        case "completed":
          // Apenas consultas realizadas (COMPLETED)
          return appointment.status === AppointmentStatus.COMPLETED;

        case "cancelled":
          // Apenas consultas canceladas ou com falta
          return [
            AppointmentStatus.CANCELLED_BY_PATIENT,
            AppointmentStatus.CANCELLED_BY_NUTRITIONIST,
            AppointmentStatus.NO_SHOW,
          ].includes(appointment.status);

        default:
          return true;
      }
    });

    // Ordenar por data e horário
    const sorted = filtered.sort((a, b) => {
      const dateA = new Date(a.scheduledDate);
      const dateB = new Date(b.scheduledDate);

      // Se datas diferentes, ordenar por data
      if (dateA.getTime() !== dateB.getTime()) {
        // Para upcoming e all: ordem crescente (mais próximas primeiro)
        // Para completed e cancelled: ordem decrescente (mais recentes primeiro)
        if (filter === "upcoming" || filter === "all") {
          return dateA.getTime() - dateB.getTime();
        } else {
          return dateB.getTime() - dateA.getTime();
        }
      }

      // Se mesma data, ordenar por horário
      const timeA = a.scheduledTime || "00:00";
      const timeB = b.scheduledTime || "00:00";

      if (filter === "upcoming" || filter === "all") {
        return timeA.localeCompare(timeB);
      } else {
        return timeB.localeCompare(timeA);
      }
    });

    return sorted;
  };

  const handleCancelRequest = (appointmentId: string) => {
    setAppointmentToCancel(appointmentId);
    setShowCancelConfirm(true);
  };

  const confirmCancelAppointment = async () => {
    if (!appointmentToCancel) return;

    try {
      await appointmentsService.cancel(
        appointmentToCancel,
        "Cancelado pelo paciente"
      );
      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: "Consulta cancelada com sucesso.",
      });
      loadAppointments();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message,
      });
    } finally {
      setShowCancelConfirm(false);
      setAppointmentToCancel(null);
    }
  };

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
        timeZone: "UTC",
      });
    } catch {
      return "Data inválida";
    }
  };

  const formatDateShort = (dateString: string): string => {
    if (!dateString) return "--/--/----";

    try {
      const dateOnly = dateString.includes("T")
        ? dateString.split("T")[0]
        : dateString;
      const date = new Date(dateOnly + "T00:00:00Z");

      if (isNaN(date.getTime())) return "--/--/----";

      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      });
    } catch {
      return "--/--/----";
    }
  };

  const formatTime = (time: string): string => {
    if (!time) return "--:--";
    return time.substring(0, 5);
  };

  const isToday = (dateString: string): boolean => {
    const dateOnly = dateString.includes("T")
      ? dateString.split("T")[0]
      : dateString;
    const date = new Date(dateOnly + "T00:00:00Z");
    const today = new Date();
    const todayUTC = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    );

    return date.getTime() === todayUTC.getTime();
  };

  const isTomorrow = (dateString: string): boolean => {
    const dateOnly = dateString.includes("T")
      ? dateString.split("T")[0]
      : dateString;
    const date = new Date(dateOnly + "T00:00:00Z");
    const today = new Date();
    const tomorrowUTC = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    );

    return date.getTime() === tomorrowUTC.getTime();
  };

  const getDateLabel = (dateString: string): string => {
    if (isToday(dateString)) return "Hoje";
    if (isTomorrow(dateString)) return "Amanhã";
    return formatDate(dateString);
  };

  const getStatusIcon = (status: AppointmentStatus): string => {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return "checkmark-circle";
      case AppointmentStatus.PENDING:
        return "time";
      case AppointmentStatus.COMPLETED:
        return "checkmark-done-circle";
      case AppointmentStatus.CANCELLED_BY_PATIENT:
      case AppointmentStatus.CANCELLED_BY_NUTRITIONIST:
        return "close-circle";
      case AppointmentStatus.NO_SHOW:
        return "alert-circle";
      default:
        return "calendar";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5a9f" />
          <Text style={styles.loadingText}>Carregando consultas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredAppointments = filterAppointments();

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Minhas Consultas</Text>
            <Text style={styles.headerSubtitle}>
              Gerencie suas consultas com seu nutricionista
            </Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabs}
          >
            <TouchableOpacity
              style={[
                styles.filterTab,
                filter === "all" && styles.filterTabActive,
              ]}
              onPress={() => setFilter("all")}
            >
              <Ionicons
                name="list-outline"
                size={18}
                color={filter === "all" ? "#8b5a9f" : "#757575"}
              />
              <Text
                style={[
                  styles.filterTabText,
                  filter === "all" && styles.filterTabTextActive,
                ]}
              >
                Todas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterTab,
                filter === "upcoming" && styles.filterTabActive,
              ]}
              onPress={() => setFilter("upcoming")}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={filter === "upcoming" ? "#8b5a9f" : "#757575"}
              />
              <Text
                style={[
                  styles.filterTabText,
                  filter === "upcoming" && styles.filterTabTextActive,
                ]}
              >
                Próximas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterTab,
                filter === "completed" && styles.filterTabActive,
              ]}
              onPress={() => setFilter("completed")}
            >
              <Ionicons
                name="checkmark-done-outline"
                size={18}
                color={filter === "completed" ? "#8b5a9f" : "#757575"}
              />
              <Text
                style={[
                  styles.filterTabText,
                  filter === "completed" && styles.filterTabTextActive,
                ]}
              >
                Realizadas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterTab,
                filter === "cancelled" && styles.filterTabActive,
              ]}
              onPress={() => setFilter("cancelled")}
            >
              <Ionicons
                name="close-circle-outline"
                size={18}
                color={filter === "cancelled" ? "#8b5a9f" : "#757575"}
              />
              <Text
                style={[
                  styles.filterTabText,
                  filter === "cancelled" && styles.filterTabTextActive,
                ]}
              >
                Canceladas
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Appointments List */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#8b5a9f"]}
              tintColor="#8b5a9f"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons
                  name={
                    filter === "all"
                      ? "list-outline"
                      : filter === "upcoming"
                      ? "calendar-outline"
                      : filter === "completed"
                      ? "checkmark-done-outline"
                      : "close-circle-outline"
                  }
                  size={64}
                  color="#BDBDBD"
                />
              </View>
              <Text style={styles.emptyTitle}>
                {filter === "all"
                  ? "Nenhuma consulta encontrada"
                  : filter === "upcoming"
                  ? "Nenhuma consulta agendada"
                  : filter === "completed"
                  ? "Nenhuma consulta realizada"
                  : "Nenhuma consulta cancelada"}
              </Text>
              <Text style={styles.emptyText}>
                {filter === "upcoming" &&
                  "Solicite uma consulta com seu nutricionista tocando no botão abaixo"}
              </Text>
            </View>
          ) : (
            filteredAppointments.map((appointment) => (
              <TouchableOpacity
                key={appointment.id}
                style={styles.appointmentCard}
                onPress={() =>
                  navigation.navigate("PatientAppointmentDetails", {
                    appointmentId: appointment.id,
                  })
                }
                activeOpacity={0.7}
              >
                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        AppointmentStatusColors[appointment.status] + "15",
                    },
                  ]}
                >
                  <Ionicons
                    name={getStatusIcon(appointment.status) as any}
                    size={20}
                    color={AppointmentStatusColors[appointment.status]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: AppointmentStatusColors[appointment.status] },
                    ]}
                  >
                    {AppointmentStatusLabels[appointment.status]}
                  </Text>
                </View>

                {/* Date and Time */}
                <View style={styles.cardHeader}>
                  <View style={styles.dateTimeContainer}>
                    <Ionicons name="calendar" size={20} color="#8b5a9f" />
                    <View style={styles.dateTimeTexts}>
                      <Text style={styles.dateLabel}>
                        {getDateLabel(appointment.scheduledDate)}
                      </Text>
                      <Text style={styles.dateShort}>
                        {formatDateShort(appointment.scheduledDate)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.timeContainer}>
                    <Ionicons name="time" size={20} color="#8b5a9f" />
                    <Text style={styles.timeText}>
                      {formatTime(appointment.scheduledTime)}
                    </Text>
                  </View>
                </View>

                {/* Title */}
                <Text style={styles.appointmentTitle}>
                  {appointment.title || AppointmentTypeLabels[appointment.type]}
                </Text>

                {/* Nutritionist */}
                <View style={styles.nutritionistInfo}>
                  <View style={styles.nutritionistAvatar}>
                    <Text style={styles.nutritionistAvatarText}>
                      {(appointment.nutritionist?.user?.name || "N")
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.nutritionistDetails}>
                    <Text style={styles.nutritionistLabel}>Nutricionista</Text>
                    <Text style={styles.nutritionistName}>
                      {appointment.nutritionist?.user?.name || "Não informado"}
                    </Text>
                  </View>
                </View>

                {/* Details */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Ionicons
                      name={appointment.isOnline ? "videocam" : "location"}
                      size={16}
                      color="#757575"
                    />
                    <Text style={styles.detailText}>
                      {appointment.isOnline ? "Online" : "Presencial"}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={16} color="#757575" />
                    <Text style={styles.detailText}>
                      {appointment.duration} min
                    </Text>
                  </View>

                  {appointment.price && (
                    <View style={styles.detailItem}>
                      <Ionicons name="cash-outline" size={16} color="#757575" />
                      <Text style={styles.detailText}>
                        R$ {appointment.price.toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Actions */}
                {filter === "upcoming" &&
                  appointment.status !==
                    AppointmentStatus.CANCELLED_BY_PATIENT &&
                  appointment.status !==
                    AppointmentStatus.CANCELLED_BY_NUTRITIONIST && (
                    <View style={styles.actionsRow}>
                      {appointment.isOnline && appointment.meetingUrl && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.joinButton]}
                          onPress={(e) => {
                            e.stopPropagation();
                            // TODO: Implementar abertura do link
                          }}
                        >
                          <Ionicons name="videocam" size={18} color="#fff" />
                          <Text style={styles.actionButtonText}>Entrar</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleCancelRequest(appointment.id);
                        }}
                      >
                        <Ionicons
                          name="close-circle-outline"
                          size={18}
                          color="#E53935"
                        />
                        <Text
                          style={[
                            styles.actionButtonText,
                            { color: "#E53935" },
                          ]}
                        >
                          Cancelar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                {/* Cancellation Reason */}
                {appointment.cancellationReason && (
                  <View style={styles.cancellationBox}>
                    <Ionicons
                      name="information-circle"
                      size={16}
                      color="#F57C00"
                    />
                    <View style={styles.cancellationTextContainer}>
                      <Text style={styles.cancellationLabel}>
                        Motivo do cancelamento:
                      </Text>
                      <Text style={styles.cancellationText}>
                        {appointment.cancellationReason}
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* FAB - Floating Action Button */}
        {filter === "upcoming" && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate("RequestAppointment")}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Cancel Confirmation Modal */}
        <ConfirmModal
          visible={showCancelConfirm}
          title="Cancelar Consulta"
          message="Tem certeza que deseja cancelar esta consulta? Esta ação não pode ser desfeita."
          confirmText="Sim, cancelar"
          cancelText="Não"
          onConfirm={confirmCancelAppointment}
          onCancel={() => {
            setShowCancelConfirm(false);
            setAppointmentToCancel(null);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#757575",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#757575",
  },
  filterContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  filterTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: "#F3E8F7",
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#757575",
  },
  filterTabTextActive: {
    color: "#8b5a9f",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === "android" ? 100 : 80,
  },
  appointmentCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  dateTimeTexts: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    textTransform: "capitalize",
  },
  dateShort: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F3E8F7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8b5a9f",
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 12,
  },
  nutritionistInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  nutritionistAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#8b5a9f",
    justifyContent: "center",
    alignItems: "center",
  },
  nutritionistAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  nutritionistDetails: {
    flex: 1,
  },
  nutritionistLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 2,
  },
  nutritionistName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: "#757575",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  joinButton: {
    backgroundColor: "#8b5a9f",
  },
  cancelButton: {
    backgroundColor: "#FFEBEE",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  cancellationBox: {
    flexDirection: "row",
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  cancellationTextContainer: {
    flex: 1,
  },
  cancellationLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F57C00",
    marginBottom: 4,
  },
  cancellationText: {
    fontSize: 14,
    color: "#757575",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    lineHeight: 20,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#8b5a9f",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
