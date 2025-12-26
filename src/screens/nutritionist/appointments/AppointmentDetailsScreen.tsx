import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { appointmentsService } from "../../../services/appointments";
import {
  Appointment,
  AppointmentStatus,
  AppointmentStatusLabels,
  AppointmentStatusColors,
  AppointmentTypeLabels,
} from "../../../types/appointments";

export default function AppointmentDetailsScreen({ route, navigation }: any) {
  const { appointmentId } = route.params;

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);

  // Form states
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus>(
    AppointmentStatus.CONFIRMED
  );
  const [statusReason, setStatusReason] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [nutritionistNotes, setNutritionistNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAppointment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      const data = await appointmentsService.findOne(appointmentId);
      setAppointment(data);
      setNutritionistNotes(data.nutritionistNotes || "");
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
  };

  const handleUpdateStatus = async () => {
    if (!appointment) return;

    try {
      setSaving(true);
      await appointmentsService.updateStatus(appointmentId, {
        status: selectedStatus,
        reason: statusReason || undefined,
      });

      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: "Status atualizado com sucesso!",
      });
      setShowStatusModal(false);
      loadAppointment();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    try {
      setSaving(true);
      await appointmentsService.cancel(
        appointmentId,
        cancellationReason || undefined
      );

      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: "Consulta cancelada com sucesso!",
      });
      setShowCancelModal(false);
      loadAppointment();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReschedule = () => {
    setShowRescheduleModal(false);
    navigation.navigate("AppointmentForm", {
      appointmentId,
      mode: "reschedule",
    });
  };

  const handleSaveNotes = async () => {
    try {
      setSaving(true);
      await appointmentsService.update(appointmentId, {
        nutritionistNotes,
      } as any);

      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: "Notas salvas com sucesso!",
      });
      setShowNotesModal(false);
      loadAppointment();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "Data não disponível";

    try {
      const dateOnly = dateString.includes("T")
        ? dateString.split("T")[0]
        : dateString;
      const date = new Date(dateOnly + "T00:00:00Z");

      if (isNaN(date.getTime())) {
        return "Data inválida";
      }

      return date.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
    } catch {
      return "Data inválida";
    }
  };

  const formatTime = (time: string | undefined): string => {
    if (!time) return "--:--";
    return time.substring(0, 5);
  };

  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return "Data não disponível";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Data inválida";
      }

      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Data inválida";
    }
  };

  const getPatientName = (): string => {
    return appointment?.patient?.patient?.user?.name || "Nome não disponível";
  };

  const getPatientEmail = (): string | null => {
    return appointment?.patient?.patient?.user?.email || null;
  };

  const getPatientPhone = (): string | null => {
    return appointment?.patient?.patient?.user?.phone || null;
  };

  const handleOpenMeeting = async () => {
    if (appointment?.meetingUrl) {
      try {
        await Linking.openURL(appointment.meetingUrl);
      } catch {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Não foi possível abrir o link",
        });
      }
    }
  };

  const handleCallPatient = async () => {
    const phone = getPatientPhone();
    if (phone) {
      try {
        await Linking.openURL(`tel:${phone}`);
      } catch {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Não foi possível realizar a chamada",
        });
      }
    }
  };

  const handleEmailPatient = async () => {
    const email = getPatientEmail();
    if (email) {
      try {
        await Linking.openURL(`mailto:${email}`);
      } catch {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Não foi possível abrir o email",
        });
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["bottom"]}>
        <ActivityIndicator size="large" color="#8b5a9f" />
        <Text style={styles.loadingText}>Carregando consulta...</Text>
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={["bottom"]}>
        <Text style={styles.errorText}>Consulta não encontrada</Text>
      </SafeAreaView>
    );
  }

  const canEdit = ![
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED_BY_PATIENT,
    AppointmentStatus.CANCELLED_BY_NUTRITIONIST,
  ].includes(appointment.status);

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: AppointmentStatusColors[appointment.status] },
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {AppointmentStatusLabels[appointment.status]}
            </Text>
          </View>
        </View>

        {/* Main Info Card */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardHeader}>
            <Ionicons
              name={appointment.isOnline ? "videocam" : "location"}
              size={24}
              color="#8b5a9f"
            />
            <Text style={styles.mainCardTitle}>
              {appointment.title || AppointmentTypeLabels[appointment.type]}
            </Text>
          </View>

          <View style={styles.dateTimeCard}>
            <View style={styles.dateTimeRow}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.dateTimeText}>
                {formatDate(appointment.scheduledDate)}
              </Text>
            </View>
            <View style={styles.dateTimeRow}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.dateTimeText}>
                {formatTime(appointment.scheduledTime)} • {appointment.duration}{" "}
                minutos
              </Text>
            </View>
          </View>
        </View>

        {/* Patient Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={20} color="#8b5a9f" />
            <Text style={styles.cardTitle}>Informações do Paciente</Text>
          </View>

          <View style={styles.patientInfoContainer}>
            <View style={styles.patientAvatar}>
              <Text style={styles.patientAvatarText}>
                {getPatientName().charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.patientDetails}>
              <Text style={styles.patientName}>{getPatientName()}</Text>
              {getPatientEmail() && (
                <Text style={styles.patientContact}>{getPatientEmail()}</Text>
              )}
              {getPatientPhone() && (
                <Text style={styles.patientContact}>{getPatientPhone()}</Text>
              )}
            </View>
          </View>

          {(getPatientPhone() || getPatientEmail()) && (
            <View style={styles.contactActions}>
              {getPatientPhone() && (
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={handleCallPatient}
                >
                  <Ionicons name="call" size={18} color="#4CAF50" />
                  <Text style={styles.contactButtonText}>Ligar</Text>
                </TouchableOpacity>
              )}
              {getPatientEmail() && (
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={handleEmailPatient}
                >
                  <Ionicons name="mail" size={18} color="#2196F3" />
                  <Text style={styles.contactButtonText}>Email</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={20} color="#8b5a9f" />
            <Text style={styles.cardTitle}>Detalhes da Consulta</Text>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Tipo</Text>
              <Text style={styles.detailValue}>
                {AppointmentTypeLabels[appointment.type]}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Modalidade</Text>
              <View style={styles.modalityBadge}>
                <Ionicons
                  name={appointment.isOnline ? "videocam" : "location"}
                  size={14}
                  color={appointment.isOnline ? "#2196F3" : "#FF9800"}
                />
                <Text style={[styles.detailValue, { marginLeft: 4 }]}>
                  {appointment.isOnline ? "Online" : "Presencial"}
                </Text>
              </View>
            </View>

            {appointment.price && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Valor</Text>
                <View style={styles.priceBadge}>
                  <Text style={styles.priceValue}>
                    R$ {appointment.price.toFixed(2)}
                  </Text>
                  {appointment.isPaid && (
                    <View style={styles.paidBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#4CAF50"
                      />
                      <Text style={styles.paidText}>Pago</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>

          {appointment.isOnline && appointment.meetingUrl && (
            <TouchableOpacity
              style={styles.meetingButton}
              onPress={handleOpenMeeting}
            >
              <Ionicons name="videocam" size={20} color="#fff" />
              <Text style={styles.meetingButtonText}>Entrar na Reunião</Text>
            </TouchableOpacity>
          )}

          {!appointment.isOnline && appointment.location && (
            <View style={styles.locationCard}>
              <Ionicons name="location" size={20} color="#FF9800" />
              <Text style={styles.locationText}>{appointment.location}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {appointment.description && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={20} color="#8b5a9f" />
              <Text style={styles.cardTitle}>Descrição</Text>
            </View>
            <Text style={styles.descriptionText}>
              {appointment.description}
            </Text>
          </View>
        )}

        {/* Patient Notes */}
        {appointment.patientNotes && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="chatbox-ellipses" size={20} color="#8b5a9f" />
              <Text style={styles.cardTitle}>Observações do Paciente</Text>
            </View>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{appointment.patientNotes}</Text>
            </View>
          </View>
        )}

        {/* Nutritionist Notes */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="create" size={20} color="#8b5a9f" />
            <Text style={styles.cardTitle}>Suas Anotações</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowNotesModal(true)}
            >
              <Ionicons
                name={appointment.nutritionistNotes ? "pencil" : "add"}
                size={18}
                color="#8b5a9f"
              />
            </TouchableOpacity>
          </View>
          {appointment.nutritionistNotes ? (
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>
                {appointment.nutritionistNotes}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.emptyNotesContainer}
              onPress={() => setShowNotesModal(true)}
            >
              <Ionicons name="add-circle-outline" size={32} color="#CED4DA" />
              <Text style={styles.emptyNotesText}>
                Adicionar anotações sobre a consulta
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Timeline */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="time" size={20} color="#8b5a9f" />
            <Text style={styles.cardTitle}>Histórico</Text>
          </View>

          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View
                style={[styles.timelineDot, { backgroundColor: "#8b5a9f" }]}
              />
              <View style={styles.timelineLine} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Agendamento criado</Text>
                <Text style={styles.timelineDate}>
                  {formatDateTime(appointment.createdAt)}
                </Text>
              </View>
            </View>

            {appointment.confirmationSentAt && (
              <View style={styles.timelineItem}>
                <View
                  style={[styles.timelineDot, { backgroundColor: "#2196F3" }]}
                />
                <View style={styles.timelineLine} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Confirmação enviada</Text>
                  <Text style={styles.timelineDate}>
                    {formatDateTime(appointment.confirmationSentAt)}
                  </Text>
                </View>
              </View>
            )}

            {appointment.completedAt && (
              <View style={styles.timelineItem}>
                <View
                  style={[styles.timelineDot, { backgroundColor: "#4CAF50" }]}
                />
                <View style={styles.timelineLine} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Consulta realizada</Text>
                  <Text style={styles.timelineDate}>
                    {formatDateTime(appointment.completedAt)}
                  </Text>
                </View>
              </View>
            )}

            {appointment.rescheduledToId && (
              <View style={styles.timelineItem}>
                <View
                  style={[styles.timelineDot, { backgroundColor: "#9C27B0" }]}
                />
                <View style={styles.timelineLine} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Consulta reagendada</Text>
                  <Text style={styles.timelineDate}>
                    {formatDateTime(appointment.updatedAt)}
                  </Text>
                  <TouchableOpacity
                    style={styles.rescheduledButton}
                    onPress={() =>
                      navigation.replace("AppointmentDetails", {
                        appointmentId: appointment.rescheduledToId,
                      })
                    }
                  >
                    <Ionicons name="calendar" size={16} color="#9C27B0" />
                    <Text style={styles.rescheduledButtonText}>
                      Ver nova consulta
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {appointment.cancelledAt && (
              <View style={styles.timelineItem}>
                <View
                  style={[styles.timelineDot, { backgroundColor: "#F44336" }]}
                />
                <View style={styles.timelineLine} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Consulta cancelada</Text>
                  <Text style={styles.timelineDate}>
                    {formatDateTime(appointment.cancelledAt)}
                  </Text>
                  {appointment.cancellationReason && (
                    <View style={styles.cancellationReasonCard}>
                      <Text style={styles.cancellationReasonText}>
                        {appointment.cancellationReason}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        {canEdit && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="flash" size={20} color="#8b5a9f" />
              <Text style={styles.cardTitle}>Ações Rápidas</Text>
            </View>

            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() =>
                  navigation.navigate("AppointmentForm", {
                    appointmentId,
                    mode: "edit",
                  })
                }
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: "#E3F2FD" },
                  ]}
                >
                  <Ionicons name="create-outline" size={24} color="#2196F3" />
                </View>
                <Text style={styles.quickActionText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => setShowStatusModal(true)}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: "#FFF3E0" },
                  ]}
                >
                  <Ionicons name="sync-outline" size={24} color="#FF9800" />
                </View>
                <Text style={styles.quickActionText}>Status</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => setShowRescheduleModal(true)}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: "#F3E5F5" },
                  ]}
                >
                  <Ionicons name="calendar-outline" size={24} color="#9C27B0" />
                </View>
                <Text style={styles.quickActionText}>Reagendar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => setShowCancelModal(true)}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: "#FFEBEE" },
                  ]}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={24}
                    color="#F44336"
                  />
                </View>
                <Text style={styles.quickActionText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Status Modal */}
      <Modal
        visible={showStatusModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Atualizar Status</Text>

            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.statusOptions}>
                {Object.values(AppointmentStatus)
                  .filter((status) => status !== AppointmentStatus.RESCHEDULED)
                  .map((status) => {
                    const getStatusIcon = (st: AppointmentStatus) => {
                      switch (st) {
                        case AppointmentStatus.PENDING:
                          return "time";
                        case AppointmentStatus.CONFIRMED:
                          return "checkmark-circle";
                        case AppointmentStatus.COMPLETED:
                          return "checkmark-done-circle";
                        case AppointmentStatus.CANCELLED_BY_NUTRITIONIST:
                          return "close-circle";
                        case AppointmentStatus.CANCELLED_BY_PATIENT:
                          return "close-circle";
                        case AppointmentStatus.NO_SHOW:
                          return "alert-circle";
                        default:
                          return "ellipse";
                      }
                    };

                    return (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusOption,
                          selectedStatus === status &&
                            styles.statusOptionActive,
                        ]}
                        onPress={() => setSelectedStatus(status)}
                      >
                        <View
                          style={[
                            styles.statusOptionIcon,
                            selectedStatus === status && {
                              backgroundColor:
                                AppointmentStatusColors[status] + "20",
                            },
                          ]}
                        >
                          <Ionicons
                            name={getStatusIcon(status)}
                            size={20}
                            color={
                              selectedStatus === status
                                ? AppointmentStatusColors[status]
                                : "#ADB5BD"
                            }
                          />
                        </View>
                        <Text
                          style={[
                            styles.statusOptionText,
                            selectedStatus === status && {
                              color: AppointmentStatusColors[status],
                              fontWeight: "700",
                            },
                          ]}
                        >
                          {AppointmentStatusLabels[status]}
                        </Text>
                        {selectedStatus === status && (
                          <Ionicons
                            name="checkmark"
                            size={18}
                            color={AppointmentStatusColors[status]}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Observação</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={statusReason}
                  onChangeText={setStatusReason}
                  placeholder="Adicione uma observação sobre a alteração (opcional)"
                  placeholderTextColor="#ADB5BD"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowStatusModal(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleUpdateStatus}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Atualizar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        visible={showCancelModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancelar Consulta</Text>
            <Text style={styles.modalDescription}>
              Tem certeza que deseja cancelar esta consulta?
            </Text>

            <TextInput
              style={[styles.input, styles.textArea]}
              value={cancellationReason}
              onChangeText={setCancellationReason}
              placeholder="Motivo do cancelamento (opcional)"
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowCancelModal(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelButtonText}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalDangerButton]}
                onPress={handleCancel}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveButtonText}>
                    Cancelar Consulta
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reschedule Confirmation Modal */}
      <Modal
        visible={showRescheduleModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reagendar Consulta</Text>
            <Text style={styles.modalDescription}>
              Ao reagendar, a consulta atual será marcada como
              &quot;Reagendada&quot; e uma nova consulta será criada. Deseja
              continuar?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowRescheduleModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleReschedule}
              >
                <Text style={styles.modalSaveButtonText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notes Modal */}
      <Modal
        visible={showNotesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Notas do Nutricionista</Text>

            <TextInput
              style={[styles.input, styles.largeTextArea]}
              value={nutritionistNotes}
              onChangeText={setNutritionistNotes}
              placeholder="Adicione suas observações sobre a consulta..."
              multiline
              numberOfLines={8}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowNotesModal(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleSaveNotes}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: "#F8F9FA",
  },
  scrollContent: {
    paddingBottom: Platform.OS === "android" ? 16 : 0,
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    textAlign: "center",
  },

  // Status Header
  statusHeader: {
    backgroundColor: "#fff",
    padding: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Main Card
  mainCard: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  mainCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  mainCardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#212529",
    flex: 1,
  },
  dateTimeCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  dateTimeText: {
    flex: 1,
    fontSize: 15,
    color: "#495057",
    textTransform: "capitalize",
    lineHeight: 22,
  },

  // Card Styles
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    flex: 1,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
  },

  // Patient Info
  patientInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  patientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#8b5a9f",
    justifyContent: "center",
    alignItems: "center",
  },
  patientAvatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4,
  },
  patientContact: {
    fontSize: 14,
    color: "#6C757D",
    marginTop: 2,
  },
  contactActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#DEE2E6",
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
  },

  // Details Grid
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6C757D",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    color: "#212529",
    fontWeight: "500",
  },
  modalityBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#8b5a9f",
  },
  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#D4EDDA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#155724",
  },
  meetingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#8b5a9f",
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#8b5a9f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  meetingButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: "#495057",
    lineHeight: 20,
  },

  // Description & Notes
  descriptionText: {
    fontSize: 15,
    color: "#495057",
    lineHeight: 24,
  },
  notesContainer: {
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#8b5a9f",
  },
  notesText: {
    fontSize: 15,
    color: "#495057",
    lineHeight: 24,
  },
  emptyNotesContainer: {
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  emptyNotesText: {
    fontSize: 14,
    color: "#ADB5BD",
    textAlign: "center",
  },

  // Timeline
  timeline: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: "row",
    position: "relative",
    paddingBottom: 20,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    marginTop: 2,
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  timelineLine: {
    position: "absolute",
    left: 7,
    top: 18,
    bottom: -4,
    width: 2,
    backgroundColor: "#DEE2E6",
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 13,
    color: "#6C757D",
  },
  cancellationReasonCard: {
    marginTop: 8,
    padding: 10,
    backgroundColor: "#FFEBEE",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#F44336",
  },
  cancellationReasonText: {
    fontSize: 13,
    color: "#C62828",
    lineHeight: 18,
  },
  rescheduledButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F3E5F5",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  rescheduledButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9C27B0",
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxHeight: "85%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  modalScrollView: {
    maxHeight: 400,
  },
  statusOptions: {
    marginBottom: 16,
    gap: 8,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F8F9FA",
    gap: 10,
    borderWidth: 2,
    borderColor: "#F8F9FA",
  },
  statusOptionActive: {
    backgroundColor: "#fff",
    borderColor: "#8b5a9f",
    elevation: 2,
    shadowColor: "#8b5a9f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  statusOptionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#495057",
  },
  inputContainer: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  largeTextArea: {
    height: 150,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: "#f5f5f5",
  },
  modalCancelButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  modalSaveButton: {
    backgroundColor: "#8b5a9f",
  },
  modalDangerButton: {
    backgroundColor: "#F44336",
  },
  modalSaveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
