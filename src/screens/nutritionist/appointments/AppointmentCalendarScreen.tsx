import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { ConfirmModal } from "../../../components/ui/confirm-modal";
import { appointmentsService } from "../../../services/appointments";
import {
  Appointment,
  AppointmentStatus,
  AppointmentStatusColors,
  AppointmentTypeLabels,
} from "../../../types/appointments";

export default function AppointmentCalendarScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filterStatus, setFilterStatus] = useState<
    AppointmentStatus | undefined
  >();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(
    null
  );

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterStatus])
  );

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const filters: any = {};

      if (filterStatus) {
        filters.status = filterStatus;
      }

      const data = await appointmentsService.findAll(filters);
      setAppointments(data);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const formatDate = (dateString: string): string => {
    // Extrair apenas a parte da data se vier em formato ISO completo
    const dateOnly = dateString.includes("T")
      ? dateString.split("T")[0]
      : dateString;

    // Parse como UTC para evitar problemas de timezone
    const date = new Date(dateOnly + "T00:00:00Z");

    if (isNaN(date.getTime())) {
      console.error("❌ Data inválida:", dateString);
      return dateString;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Comparar apenas as datas (ano, mês, dia)
    const dateOnlyObj = new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    );
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const tomorrowOnly = new Date(
      tomorrow.getFullYear(),
      tomorrow.getMonth(),
      tomorrow.getDate()
    );

    if (dateOnlyObj.getTime() === todayOnly.getTime()) {
      return "Hoje";
    } else if (dateOnlyObj.getTime() === tomorrowOnly.getTime()) {
      return "Amanhã";
    }

    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    });
  };

  const formatTime = (time: string): string => {
    return time.substring(0, 5); // HH:mm
  };

  const isToday = (dateString: string): boolean => {
    // Extrair apenas a parte da data se vier em formato ISO completo
    const dateOnly = dateString.includes("T")
      ? dateString.split("T")[0]
      : dateString;

    // Parse como UTC para evitar problemas de timezone
    const date = new Date(dateOnly + "T00:00:00Z");

    if (isNaN(date.getTime())) {
      return false;
    }

    const today = new Date();
    return (
      date.getUTCDate() === today.getDate() &&
      date.getUTCMonth() === today.getMonth() &&
      date.getUTCFullYear() === today.getFullYear()
    );
  };

  const getStatusIcon = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.PENDING:
        return (
          <Ionicons
            name="time-outline"
            size={16}
            color={AppointmentStatusColors[status]}
          />
        );
      case AppointmentStatus.CONFIRMED:
        return (
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={AppointmentStatusColors[status]}
          />
        );
      case AppointmentStatus.COMPLETED:
        return (
          <Ionicons
            name="checkmark-done-circle"
            size={16}
            color={AppointmentStatusColors[status]}
          />
        );
      case AppointmentStatus.CANCELLED_BY_NUTRITIONIST:
      case AppointmentStatus.CANCELLED_BY_PATIENT:
        return (
          <Ionicons
            name="close-circle"
            size={16}
            color={AppointmentStatusColors[status]}
          />
        );
      case AppointmentStatus.NO_SHOW:
        return (
          <Ionicons
            name="alert-circle"
            size={16}
            color={AppointmentStatusColors[status]}
          />
        );
      default:
        return <Ionicons name="calendar-outline" size={16} color="#6C757D" />;
    }
  };

  const groupAppointmentsByDate = () => {
    const grouped: { [key: string]: Appointment[] } = {};

    // Proteção contra appointments undefined ou não-array
    if (!Array.isArray(appointments)) {
      return [];
    }

    appointments.forEach((appointment) => {
      const dateKey = appointment.scheduledDate;

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(appointment);
    });

    // Ordenar por data
    const sortedKeys = Object.keys(grouped).sort();
    const result: { date: string; appointments: Appointment[] }[] = [];

    sortedKeys.forEach((key) => {
      // Ordenar consultas do dia por horário
      grouped[key].sort((a, b) =>
        a.scheduledTime.localeCompare(b.scheduledTime)
      );
      result.push({ date: key, appointments: grouped[key] });
    });

    return result;
  };

  const handleQuickAction = async (
    appointmentId: string,
    action: "confirm" | "complete" | "cancel"
  ) => {
    try {
      if (action === "confirm") {
        await appointmentsService.confirm(appointmentId);
        Toast.show({
          type: "success",
          text1: "Sucesso",
          text2: "Consulta confirmada!",
        });
      } else if (action === "complete") {
        await appointmentsService.complete(appointmentId);
        Toast.show({
          type: "success",
          text1: "Sucesso",
          text2: "Consulta marcada como realizada!",
        });
      } else if (action === "cancel") {
        setAppointmentToCancel(appointmentId);
        setShowCancelConfirm(true);
        return;
      }
      loadAppointments();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message,
      });
    }
  };

  const renderStatusFilter = () => {
    const statuses = [
      {
        label: "Todos",
        value: undefined,
        icon: "list-outline",
        count: appointments.length,
      },
      {
        label: "Pendente",
        value: AppointmentStatus.PENDING,
        icon: "time-outline",
        count: appointments.filter(
          (a) => a.status === AppointmentStatus.PENDING
        ).length,
      },
      {
        label: "Confirmado",
        value: AppointmentStatus.CONFIRMED,
        icon: "checkmark-circle-outline",
        count: appointments.filter(
          (a) => a.status === AppointmentStatus.CONFIRMED
        ).length,
      },
      {
        label: "Realizado",
        value: AppointmentStatus.COMPLETED,
        icon: "checkmark-done-circle-outline",
        count: appointments.filter(
          (a) => a.status === AppointmentStatus.COMPLETED
        ).length,
      },
    ];

    return (
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {statuses.map((status) => {
            const isActive = filterStatus === status.value;
            return (
              <TouchableOpacity
                key={status.label}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setFilterStatus(status.value)}
              >
                <Ionicons
                  name={status.icon as any}
                  size={16}
                  color={isActive ? "#FFFFFF" : "#495057"}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {status.label}
                </Text>
                {status.count > 0 && (
                  <View
                    style={[
                      styles.filterChipBadge,
                      isActive && styles.filterChipBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipBadgeText,
                        isActive && styles.filterChipBadgeTextActive,
                      ]}
                    >
                      {status.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5a9f" />
        <Text style={styles.loadingText}>Carregando consultas...</Text>
      </View>
    );
  }

  const groupedAppointments = groupAppointmentsByDate();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agenda</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("AppointmentForm")}
        >
          <Text style={styles.addButtonText}>+ Nova Consulta</Text>
        </TouchableOpacity>
      </View>

      {renderStatusFilter()}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {groupedAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#CED4DA" />
            <Text style={styles.emptyTitle}>Nenhuma consulta agendada</Text>
            <Text style={styles.emptyText}>
              {filterStatus
                ? "Nenhuma consulta com este status"
                : "Crie uma nova consulta para começar"}
            </Text>
          </View>
        ) : (
          groupedAppointments.map((group) => (
            <View key={group.date} style={styles.dateGroup}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateText}>{formatDate(group.date)}</Text>
                {isToday(group.date) && (
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>Hoje</Text>
                  </View>
                )}
              </View>

              {group.appointments.map((appointment) => (
                <TouchableOpacity
                  key={appointment.id}
                  style={[
                    styles.appointmentCard,
                    appointment.status === AppointmentStatus.COMPLETED &&
                      styles.appointmentCardCompleted,
                    appointment.status ===
                      AppointmentStatus.CANCELLED_BY_NUTRITIONIST &&
                      styles.appointmentCardCancelled,
                    appointment.status ===
                      AppointmentStatus.CANCELLED_BY_PATIENT &&
                      styles.appointmentCardCancelled,
                  ]}
                  onPress={() =>
                    navigation.navigate("AppointmentDetails", {
                      appointmentId: appointment.id,
                    })
                  }
                  activeOpacity={0.7}
                >
                  {/* Left Border Color Indicator */}
                  <View
                    style={[
                      styles.appointmentBorder,
                      {
                        backgroundColor:
                          AppointmentStatusColors[appointment.status],
                      },
                    ]}
                  />

                  {/* Time Badge */}
                  <View style={styles.appointmentTimeSection}>
                    <Text style={styles.appointmentTime}>
                      {formatTime(appointment.scheduledTime)}
                    </Text>
                    <Text style={styles.appointmentDuration}>
                      {appointment.duration} min
                    </Text>
                  </View>

                  {/* Main Content */}
                  <View style={styles.appointmentMainContent}>
                    {/* Header with Patient and Status */}
                    <View style={styles.appointmentHeader}>
                      <View style={styles.appointmentPatientSection}>
                        <View style={styles.patientAvatar}>
                          <Text style={styles.patientAvatarText}>
                            {(appointment.patient?.patient?.user?.name || "P")
                              .charAt(0)
                              .toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.patientInfo}>
                          <Text style={styles.appointmentPatientName}>
                            {appointment.patient?.patient?.user?.name ||
                              "Paciente"}
                          </Text>
                          <Text style={styles.appointmentType}>
                            {AppointmentTypeLabels[appointment.type]}
                          </Text>
                        </View>
                      </View>

                      {/* Status Badge */}
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              AppointmentStatusColors[appointment.status] +
                              "15",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color:
                                AppointmentStatusColors[appointment.status],
                            },
                          ]}
                        >
                          {getStatusIcon(appointment.status)}
                        </Text>
                      </View>
                    </View>

                    {/* Title if exists */}
                    {appointment.title && (
                      <Text style={styles.appointmentTitle} numberOfLines={1}>
                        {appointment.title}
                      </Text>
                    )}

                    {/* Metadata */}
                    <View style={styles.appointmentFooter}>
                      <View style={styles.appointmentTag}>
                        <Ionicons
                          name={
                            appointment.isOnline
                              ? "videocam-outline"
                              : "location-outline"
                          }
                          size={12}
                          color="#495057"
                        />
                        <Text style={styles.appointmentTagText}>
                          {appointment.isOnline ? "Online" : "Presencial"}
                        </Text>
                      </View>

                      {appointment.price && (
                        <View style={styles.appointmentTag}>
                          <Ionicons
                            name="cash-outline"
                            size={12}
                            color="#495057"
                          />
                          <Text style={styles.appointmentTagText}>
                            R$ {appointment.price.toFixed(2)}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Quick Actions */}
                    {appointment.status === AppointmentStatus.PENDING && (
                      <View style={styles.quickActions}>
                        <TouchableOpacity
                          style={styles.quickActionConfirm}
                          onPress={() =>
                            handleQuickAction(appointment.id, "confirm")
                          }
                        >
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color="#FFFFFF"
                          />
                          <Text style={styles.quickActionConfirmText}>
                            Confirmar
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.quickActionCancel}
                          onPress={() =>
                            handleQuickAction(appointment.id, "cancel")
                          }
                        >
                          <Text style={styles.quickActionCancelText}>
                            Cancelar
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {appointment.status === AppointmentStatus.CONFIRMED &&
                      isToday(appointment.scheduledDate) && (
                        <TouchableOpacity
                          style={styles.quickActionComplete}
                          onPress={() =>
                            handleQuickAction(appointment.id, "complete")
                          }
                        >
                          <Ionicons
                            name="checkmark-done"
                            size={16}
                            color="#FFFFFF"
                          />
                          <Text style={styles.quickActionCompleteText}>
                            Marcar como Realizada
                          </Text>
                        </TouchableOpacity>
                      )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Confirm Cancel Modal */}
      <ConfirmModal
        visible={showCancelConfirm}
        title="Cancelar Consulta"
        message="Deseja cancelar esta consulta?"
        confirmText="Sim"
        cancelText="Não"
        icon="close-circle-outline"
        iconColor="#F44336"
        confirmColor="#F44336"
        onConfirm={async () => {
          if (!appointmentToCancel) return;
          try {
            await appointmentsService.cancel(appointmentToCancel);
            Toast.show({
              type: "success",
              text1: "Sucesso",
              text2: "Consulta cancelada!",
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
        }}
        onCancel={() => {
          setShowCancelConfirm(false);
          setAppointmentToCancel(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6C757D",
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#212529",
    letterSpacing: -0.3,
  },
  addButton: {
    backgroundColor: "#8b5a9f",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#8b5a9f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  filterContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    paddingVertical: 12,
  },
  filterContent: {
    paddingHorizontal: 16,
  },

  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#6C757D",
    textAlign: "center",
    lineHeight: 22,
  },
  dateGroup: {
    marginTop: 20,
    marginBottom: 8,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    textTransform: "capitalize",
  },
  todayBadge: {
    backgroundColor: "#8b5a9f",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  todayBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  appointmentCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  appointmentTimeContainer: {
    width: 80,
    backgroundColor: "#F8F9FA",
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  appointmentTime: {
    fontSize: 20,
    fontWeight: "800",
    color: "#212529",
    letterSpacing: -0.5,
  },
  appointmentDuration: {
    fontSize: 11,
    color: "#6C757D",
    marginTop: 4,
    fontWeight: "600",
  },
  appointmentContent: {
    flex: 1,
    padding: 12,
  },
  appointmentTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 12,
  },
  appointmentPatient: {
    fontSize: 14,
    color: "#6C757D",
    marginBottom: 8,
  },

  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: 16,
  },
  quickActions: {
    flexDirection: "row",
    marginTop: 16,
    gap: 8,
  },

  // New Styles
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    gap: 6,
    height: 36,
  },
  filterChipActive: {
    backgroundColor: "#8b5a9f",
    borderColor: "#8b5a9f",
    elevation: 2,
    shadowColor: "#8b5a9f",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  filterChipText: {
    fontSize: 13,
    color: "#495057",
    fontWeight: "600",
    lineHeight: 16,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  filterChipBadge: {
    backgroundColor: "#E9ECEF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  filterChipBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#495057",
    lineHeight: 14,
  },
  filterChipBadgeTextActive: {
    color: "#FFFFFF",
  },
  appointmentCardCompleted: {
    opacity: 0.7,
  },
  appointmentCardCancelled: {
    opacity: 0.6,
  },
  appointmentBorder: {
    width: 4,
  },
  appointmentTimeSection: {
    width: 70,
    backgroundColor: "#F8F9FA",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  appointmentMainContent: {
    flex: 1,
    padding: 16,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  appointmentPatientSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#8b5a9f",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  patientAvatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  patientInfo: {
    flex: 1,
  },
  appointmentPatientName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 2,
  },
  appointmentType: {
    fontSize: 13,
    color: "#6C757D",
    fontWeight: "500",
  },
  appointmentFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  appointmentTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    gap: 4,
  },
  appointmentTagText: {
    fontSize: 12,
    color: "#495057",
    fontWeight: "600",
  },
  quickActionConfirm: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#8b5a9f",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#8b5a9f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    gap: 6,
  },
  quickActionConfirmText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  quickActionCancel: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#DC2626",
  },
  quickActionCancelText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
  },
  quickActionComplete: {
    flexDirection: "row",
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    elevation: 2,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    gap: 6,
  },
  quickActionCompleteText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
