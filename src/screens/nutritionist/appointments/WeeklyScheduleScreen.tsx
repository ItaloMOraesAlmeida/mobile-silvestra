import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Modal,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { ConfirmModal } from "../../../components/ui/confirm-modal";
import { availabilityService } from "../../../services/appointments";
import {
  DayOfWeek,
  DayOfWeekLabels,
  WeeklySchedule,
  CreateWeeklyScheduleDto,
  UpdateWeeklyScheduleDto,
} from "../../../types/appointments";

const DAYS_ORDER = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

export default function WeeklyScheduleScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [hasConfig, setHasConfig] = useState(false);
  const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dayToDelete, setDayToDelete] = useState<DayOfWeek | null>(null);

  // Form state para edição
  const [isAvailable, setIsAvailable] = useState(true);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");
  const [hasLunchBreak, setHasLunchBreak] = useState(false);
  const [lunchStart, setLunchStart] = useState("12:00");
  const [lunchEnd, setLunchEnd] = useState("13:00");

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const response = await availabilityService.getConfig();
      const config = (response as any)?.data || response;
      setSchedules(config.weeklySchedules || []);
      setHasConfig(true);
    } catch (error: any) {
      setHasConfig(false);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getScheduleForDay = (day: DayOfWeek): WeeklySchedule | undefined => {
    // Proteção contra schedules undefined ou não-array
    if (!Array.isArray(schedules)) {
      return undefined;
    }
    return schedules.find((s) => s.dayOfWeek === day);
  };

  const openEditModal = (day: DayOfWeek) => {
    const schedule = getScheduleForDay(day);

    if (schedule) {
      setIsAvailable(schedule.isAvailable);
      setStartTime(schedule.startTime);
      setEndTime(schedule.endTime);
      setHasLunchBreak(!!schedule.lunchBreak);
      if (schedule.lunchBreak) {
        setLunchStart(schedule.lunchBreak.start);
        setLunchEnd(schedule.lunchBreak.end);
      }
    } else {
      // Valores padrão para novo horário
      setIsAvailable(true);
      setStartTime("08:00");
      setEndTime("18:00");
      setHasLunchBreak(false);
      setLunchStart("12:00");
      setLunchEnd("13:00");
    }

    setEditingDay(day);
  };

  const closeEditModal = () => {
    setEditingDay(null);
  };

  const validateTime = (time: string): boolean => {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(time);
  };

  const handleSaveSchedule = async () => {
    if (!editingDay) return;

    // Validações
    if (!validateTime(startTime)) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Horário de início inválido. Use formato HH:mm",
      });
      return;
    }

    if (!validateTime(endTime)) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Horário de término inválido. Use formato HH:mm",
      });
      return;
    }

    if (startTime >= endTime) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Horário de término deve ser após o horário de início",
      });
      return;
    }

    if (hasLunchBreak) {
      if (!validateTime(lunchStart) || !validateTime(lunchEnd)) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Horários de almoço inválidos. Use formato HH:mm",
        });
        return;
      }

      if (lunchStart >= lunchEnd) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Horário de fim do almoço deve ser após o início",
        });
        return;
      }

      if (lunchStart < startTime || lunchEnd > endTime) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Horário de almoço deve estar dentro do expediente",
        });
        return;
      }
    }

    try {
      setSaving(true);

      const existingSchedule = getScheduleForDay(editingDay);

      if (existingSchedule) {
        // Atualizar horário existente
        const updateData: UpdateWeeklyScheduleDto = {
          isAvailable,
          startTime,
          endTime,
          lunchBreak: hasLunchBreak
            ? { start: lunchStart, end: lunchEnd }
            : null,
        };

        await availabilityService.updateWeeklySchedule(editingDay, updateData);
      } else {
        // Criar novo horário
        const createData: CreateWeeklyScheduleDto = {
          dayOfWeek: editingDay,
          isAvailable,
          startTime,
          endTime,
          lunchBreak: hasLunchBreak
            ? { start: lunchStart, end: lunchEnd }
            : undefined,
        };

        await availabilityService.createWeeklySchedule(createData);
      }

      await loadSchedules();
      closeEditModal();
      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: "Horário salvo com sucesso!",
      });
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

  const handleDeleteSchedule = async (day: DayOfWeek) => {
    const scheduleToDelete = getScheduleForDay(day);
    if (!scheduleToDelete) return;

    setDayToDelete(day);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSchedule = async () => {
    if (!dayToDelete) return;

    try {
      await availabilityService.deleteWeeklySchedule(dayToDelete);
      await loadSchedules();
      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: "Horário removido com sucesso!",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message,
      });
    } finally {
      setShowDeleteConfirm(false);
      setDayToDelete(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando horários...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasConfig) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Configuração Necessária</Text>
          <Text style={styles.emptyText}>
            Você precisa configurar sua disponibilidade antes de definir os
            horários semanais.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.emptyButtonText}>Voltar para Configuração</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Horários Semanais</Text>
            <Text style={styles.headerSubtitle}>
              Configure os dias e horários que você atende
            </Text>
          </View>

          {DAYS_ORDER.map((day) => {
            const schedule = getScheduleForDay(day);

            return (
              <View key={day} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{DayOfWeekLabels[day]}</Text>
                  {schedule && (
                    <View
                      style={[
                        styles.statusBadge,
                        schedule.isAvailable
                          ? styles.statusAvailable
                          : styles.statusUnavailable,
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {schedule.isAvailable ? "Disponível" : "Indisponível"}
                      </Text>
                    </View>
                  )}
                </View>

                {schedule ? (
                  <>
                    {schedule.isAvailable && (
                      <>
                        <Text style={styles.scheduleInfo}>
                          🕐 {schedule.startTime} às {schedule.endTime}
                        </Text>
                        {schedule.lunchBreak && (
                          <Text style={styles.scheduleInfo}>
                            🍽️ Almoço: {schedule.lunchBreak.start} às{" "}
                            {schedule.lunchBreak.end}
                          </Text>
                        )}
                      </>
                    )}

                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        style={[styles.button, styles.editButton]}
                        onPress={() => openEditModal(day)}
                      >
                        <Text style={styles.buttonText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button, styles.deleteButton]}
                        onPress={() => handleDeleteSchedule(day)}
                      >
                        <Text style={styles.buttonText}>Remover</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => openEditModal(day)}
                  >
                    <Text style={styles.addButtonText}>
                      + Adicionar Horário
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        visible={showDeleteConfirm}
        title="Confirmar Remoção"
        message={
          dayToDelete
            ? `Deseja remover o horário de ${DayOfWeekLabels[dayToDelete]}?`
            : ""
        }
        confirmText="Remover"
        cancelText="Cancelar"
        icon="trash-outline"
        iconColor="#F44336"
        confirmColor="#F44336"
        onConfirm={confirmDeleteSchedule}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDayToDelete(null);
        }}
      />

      {/* Modal de Edição */}
      <Modal
        visible={editingDay !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingDay ? DayOfWeekLabels[editingDay] : ""}
            </Text>

            <View style={styles.switchField}>
              <Text style={styles.label}>Disponível para atendimento</Text>
              <Switch
                value={isAvailable}
                onValueChange={setIsAvailable}
                trackColor={{ false: "#767577", true: "#81C784" }}
                thumbColor={isAvailable ? "#4CAF50" : "#f4f3f4"}
              />
            </View>

            {isAvailable && (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>Horário de início</Text>
                  <TextInput
                    style={styles.input}
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="08:00"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Horário de término</Text>
                  <TextInput
                    style={styles.input}
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="18:00"
                  />
                </View>

                <View style={styles.switchField}>
                  <Text style={styles.label}>Intervalo para almoço</Text>
                  <Switch
                    value={hasLunchBreak}
                    onValueChange={setHasLunchBreak}
                    trackColor={{ false: "#767577", true: "#81C784" }}
                    thumbColor={hasLunchBreak ? "#4CAF50" : "#f4f3f4"}
                  />
                </View>

                {hasLunchBreak && (
                  <>
                    <View style={styles.field}>
                      <Text style={styles.label}>Início do almoço</Text>
                      <TextInput
                        style={styles.input}
                        value={lunchStart}
                        onChangeText={setLunchStart}
                        placeholder="12:00"
                      />
                    </View>

                    <View style={styles.field}>
                      <Text style={styles.label}>Fim do almoço</Text>
                      <TextInput
                        style={styles.input}
                        value={lunchEnd}
                        onChangeText={setLunchEnd}
                        placeholder="13:00"
                      />
                    </View>
                  </>
                )}
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeEditModal}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveModalButton]}
                onPress={handleSaveSchedule}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveModalButtonText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={showDeleteConfirm}
        title="Remover Horário"
        message={`Deseja remover o horário de ${
          dayToDelete ? DayOfWeekLabels[dayToDelete] : ""
        }?`}
        icon="trash-outline"
        confirmColor="#F44336"
        onConfirm={confirmDeleteSchedule}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: "#8b5a9f",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  dayCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dayName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusAvailable: {
    backgroundColor: "#E8F5E9",
  },
  statusUnavailable: {
    backgroundColor: "#FFEBEE",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  scheduleInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#2196F3",
  },
  deleteButton: {
    backgroundColor: "#F44336",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  addButton: {
    padding: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
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
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  switchField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  saveModalButton: {
    backgroundColor: "#4CAF50",
  },
  saveModalButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
