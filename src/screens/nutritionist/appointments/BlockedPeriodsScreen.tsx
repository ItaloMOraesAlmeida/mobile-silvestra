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
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { ConfirmModal } from "../../../components/ui/confirm-modal";
import DateTimePicker from "@react-native-community/datetimepicker";
import { availabilityService } from "../../../services/appointments";
import {
  BlockedPeriod,
  CreateBlockedPeriodDto,
} from "../../../types/appointments";

export default function BlockedPeriodsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [hasConfig, setHasConfig] = useState(false);
  const [periods, setPeriods] = useState<BlockedPeriod[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [periodToDelete, setPeriodToDelete] = useState<string | null>(null);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState("");
  const [isAllDay, setIsAllDay] = useState(true);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      setLoading(true);
      await availabilityService.getConfig();
      setHasConfig(true);
      const response = await availabilityService.getBlockedPeriods();
      const data = (response as any)?.data || response;
      setPeriods(Array.isArray(data) ? data : []);
    } catch (error: any) {
      if (error.message?.includes("não encontrada")) {
        setHasConfig(false);
      } else {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setStartDate(new Date());
    setEndDate(new Date());
    setReason("");
    setIsAllDay(true);
    setShowModal(true);
  };

  const openEditModal = (period: BlockedPeriod) => {
    setEditingId(period.id);
    setStartDate(new Date(period.startDate));
    setEndDate(new Date(period.endDate));
    setReason(period.reason || "");
    setIsAllDay(period.isAllDay);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    // Validações
    if (endDate < startDate) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Data de término deve ser posterior à data de início",
      });
      return;
    }

    try {
      setSaving(true);

      const data: CreateBlockedPeriodDto = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: reason || undefined,
        isAllDay,
      };

      if (editingId) {
        await availabilityService.updateBlockedPeriod(editingId, data);
        Toast.show({
          type: "success",
          text1: "Sucesso",
          text2: "Período bloqueado atualizado!",
        });
      } else {
        await availabilityService.createBlockedPeriod(data);
        Toast.show({
          type: "success",
          text1: "Sucesso",
          text2: "Período bloqueado criado!",
        });
      }

      await loadPeriods();
      closeModal();
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

  const handleDelete = async (id: string) => {
    setPeriodToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeletePeriod = async () => {
    if (!periodToDelete) return;

    try {
      await availabilityService.deleteBlockedPeriod(periodToDelete);
      await loadPeriods();
      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: "Período bloqueado removido!",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message,
      });
    } finally {
      setShowDeleteConfirm(false);
      setPeriodToDelete(null);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const calculateDuration = (start: string, end: string): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const days =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
    return days === 1 ? "1 dia" : `${days} dias`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando períodos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasConfig) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyConfigContainer}>
          <Text style={styles.emptyConfigTitle}>Configuração Necessária</Text>
          <Text style={styles.emptyConfigText}>
            Você precisa configurar sua disponibilidade antes de bloquear
            períodos.
          </Text>
          <TouchableOpacity
            style={styles.emptyConfigButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.emptyConfigButtonText}>
              Voltar para Configuração
            </Text>
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
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Períodos Bloqueados</Text>
            <Text style={styles.headerSubtitle}>
              Férias, feriados e outros períodos sem atendimento
            </Text>
          </View>

          <ScrollView style={styles.content}>
            {periods.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyTitle}>Nenhum período bloqueado</Text>
                <Text style={styles.emptyText}>
                  Adicione férias ou feriados para bloquear agendamentos
                </Text>
              </View>
            ) : (
              periods.map((period) => (
                <View key={period.id} style={styles.periodCard}>
                  <View style={styles.periodHeader}>
                    <Text style={styles.periodDates}>
                      {formatDate(period.startDate)} -{" "}
                      {formatDate(period.endDate)}
                    </Text>
                    <Text style={styles.periodDuration}>
                      {calculateDuration(period.startDate, period.endDate)}
                    </Text>
                  </View>

                  {period.reason && (
                    <Text style={styles.periodReason}>{period.reason}</Text>
                  )}

                  <View style={styles.periodFooter}>
                    <View style={styles.periodType}>
                      <Text style={styles.periodTypeText}>
                        {period.isAllDay
                          ? "🌙 Dia inteiro"
                          : "⏰ Horário específico"}
                      </Text>
                    </View>

                    <View style={styles.periodActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.editActionButton]}
                        onPress={() => openEditModal(period)}
                      >
                        <Text style={styles.actionButtonText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteActionButton]}
                        onPress={() => handleDelete(period.id)}
                      >
                        <Text style={styles.actionButtonText}>Remover</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <TouchableOpacity style={styles.fab} onPress={openAddModal}>
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        visible={showDeleteConfirm}
        title="Confirmar Remoção"
        message="Deseja remover este período bloqueado?"
        confirmText="Remover"
        cancelText="Cancelar"
        icon="trash-outline"
        iconColor="#F44336"
        confirmColor="#F44336"
        onConfirm={confirmDeletePeriod}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setPeriodToDelete(null);
        }}
      />

      {/* Modal de Criação/Edição */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? "Editar Período" : "Novo Período Bloqueado"}
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Data de Início</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {formatDate(startDate.toISOString())}
                </Text>
              </TouchableOpacity>
            </View>

            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedDate) => {
                  setShowStartPicker(Platform.OS === "ios");
                  if (selectedDate) {
                    setStartDate(selectedDate);
                    if (selectedDate > endDate) {
                      setEndDate(selectedDate);
                    }
                  }
                }}
              />
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Data de Término</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {formatDate(endDate.toISOString())}
                </Text>
              </TouchableOpacity>
            </View>

            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={startDate}
                onChange={(event, selectedDate) => {
                  setShowEndPicker(Platform.OS === "ios");
                  if (selectedDate) {
                    setEndDate(selectedDate);
                  }
                }}
              />
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Motivo (opcional)</Text>
              <TextInput
                style={styles.input}
                value={reason}
                onChangeText={setReason}
                placeholder="Ex: Férias, Feriado Nacional, Evento..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.switchField}>
              <Text style={styles.label}>Dia inteiro</Text>
              <TouchableOpacity
                style={[styles.toggle, isAllDay && styles.toggleActive]}
                onPress={() => setIsAllDay(!isAllDay)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    isAllDay && styles.toggleTextActive,
                  ]}
                >
                  {isAllDay ? "Sim" : "Não"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeModal}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveModalButton]}
                onPress={handleSave}
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
        title="Remover Período"
        message="Deseja remover este período bloqueado?"
        icon="trash-outline"
        confirmColor="#F44336"
        onConfirm={confirmDeletePeriod}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyConfigContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyConfigTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyConfigText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyConfigButton: {
    backgroundColor: "#8b5a9f",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyConfigButtonText: {
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
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  periodCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  periodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  periodDates: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  periodDuration: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  periodReason: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  periodFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  periodType: {
    flex: 1,
  },
  periodTypeText: {
    fontSize: 12,
    color: "#666",
  },
  periodActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editActionButton: {
    backgroundColor: "#2196F3",
  },
  deleteActionButton: {
    backgroundColor: "#F44336",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "bold",
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
    textAlignVertical: "top",
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#333",
  },
  switchField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  toggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  toggleActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  toggleTextActive: {
    color: "#fff",
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
