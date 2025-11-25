/**
 * Componente de Gerenciamento de Status do Plano Alimentar
 *
 * Permite alterar o status do plano seguindo as regras de negócio:
 * - Para ACTIVE: plano deve estar COMPLETED
 * - Para ACTIVE: só pode haver um plano ativo por paciente
 * - Para ACTIVE: data de início não pode estar no passado
 * - Qualquer status pode voltar para DRAFT
 * - Qualquer status pode ser ARCHIVED
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { lightTheme } from "../theme";
import { PlanStatus } from "../types/meal-plan.types";
import {
  getPlanStatusLabel,
  getPlanStatusColor,
  getPlanStatusIcon,
} from "../utils/meal-plan.utils";

// Helper para renderizar ícone do status
const StatusIcon: React.FC<{
  status: PlanStatus;
  size?: number;
  color: string;
}> = ({ status, size = 16, color }) => {
  const iconName = getPlanStatusIcon(status) as any;
  return <Ionicons name={iconName} size={size} color={color} />;
};

interface Props {
  visible: boolean;
  currentStatus: PlanStatus;
  planId: string;
  patientId: string;
  currentStartDate: Date;
  currentEndDate?: Date;
  onClose: () => void;
  onStatusChange: (
    newStatus: PlanStatus,
    startDate?: Date,
    endDate?: Date
  ) => Promise<void>;
  onCheckActivePlan: () => Promise<boolean>; // Retorna true se já existe plano ativo
}

export const MealPlanStatusManager: React.FC<Props> = ({
  visible,
  currentStatus,
  planId,
  patientId,
  currentStartDate,
  currentEndDate,
  onClose,
  onStatusChange,
  onCheckActivePlan,
}) => {
  const [showDateModal, setShowDateModal] = useState(false);
  const [newStartDate, setNewStartDate] = useState(new Date(currentStartDate));
  const [newEndDate, setNewEndDate] = useState(
    currentEndDate ? new Date(currentEndDate) : undefined
  );
  const [hasEndDate, setHasEndDate] = useState(!!currentEndDate);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<PlanStatus | null>(null);

  // Determinar quais transições de status são permitidas
  const getAvailableStatuses = (): PlanStatus[] => {
    const statuses: PlanStatus[] = [];

    // Todos podem voltar para DRAFT
    if (currentStatus !== PlanStatus.DRAFT) {
      statuses.push(PlanStatus.DRAFT);
    }

    // Para ACTIVE: apenas se estiver COMPLETED ou ARCHIVED
    if (
      currentStatus === PlanStatus.COMPLETED ||
      currentStatus === PlanStatus.ARCHIVED
    ) {
      statuses.push(PlanStatus.ACTIVE);
    }

    // Para COMPLETED: apenas se estiver DRAFT
    if (currentStatus === PlanStatus.DRAFT) {
      statuses.push(PlanStatus.COMPLETED);
    }

    // Todos podem ser ARCHIVED
    if (currentStatus !== PlanStatus.ARCHIVED) {
      statuses.push(PlanStatus.ARCHIVED);
    }

    return statuses;
  };

  const handleStatusPress = async (newStatus: PlanStatus) => {
    try {
      // Se for para ACTIVE, verificar regras
      if (newStatus === PlanStatus.ACTIVE) {
        // Verificar se data de início já passou
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(currentStartDate);
        startDate.setHours(0, 0, 0, 0);

        if (startDate < today) {
          // Data já passou - mostrar modal para editar
          setPendingStatus(newStatus);
          setShowDateModal(true);
          return;
        }

        // Verificar se já existe plano ativo
        const hasActivePlan = await onCheckActivePlan();
        if (hasActivePlan) {
          // Mostrar alerta para confirmar substituição
          Alert.alert(
            "Plano Ativo Existente",
            "Já existe um plano ativo para este paciente. Deseja substituir o plano ativo atual por este?",
            [
              {
                text: "Cancelar",
                style: "cancel",
              },
              {
                text: "Substituir",
                onPress: async () => {
                  await onStatusChange(newStatus);
                  onClose();
                },
              },
            ]
          );
          return;
        }
      }

      // Mudar status diretamente
      await onStatusChange(newStatus);
      onClose();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao alterar status");
    }
  };

  const handleSaveDates = async () => {
    // Validações
    if (!hasEndDate && newEndDate) {
      setNewEndDate(undefined);
    }

    if (hasEndDate && !newEndDate) {
      Alert.alert("Atenção", "Selecione uma data de término");
      return;
    }

    if (hasEndDate && newEndDate) {
      if (newEndDate <= newStartDate) {
        Alert.alert(
          "Atenção",
          "A data de término deve ser posterior à data de início"
        );
        return;
      }
    }

    try {
      // Salvar status com novas datas
      if (pendingStatus) {
        await onStatusChange(
          pendingStatus,
          newStartDate,
          hasEndDate ? newEndDate : undefined
        );
      }
      setShowDateModal(false);
      setPendingStatus(null);
      onClose();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao salvar datas");
    }
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const availableStatuses = getAvailableStatuses();

  return (
    <>
      {/* Modal de Seleção de Status */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alterar Status do Plano</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons
                  name="close"
                  size={24}
                  color={lightTheme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.currentStatusContainer}>
              <Text style={styles.currentStatusLabel}>Status atual:</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getPlanStatusColor(currentStatus) + "20" },
                ]}
              >
                <View style={styles.statusBadgeContent}>
                  <StatusIcon
                    status={currentStatus}
                    size={16}
                    color={getPlanStatusColor(currentStatus)}
                  />
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: getPlanStatusColor(currentStatus) },
                    ]}
                  >
                    {getPlanStatusLabel(currentStatus)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Selecione o novo status:</Text>

            {availableStatuses.length === 0 ? (
              <Text style={styles.noOptionsText}>
                Não há opções de status disponíveis
              </Text>
            ) : (
              availableStatuses.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={styles.statusOption}
                  onPress={() => handleStatusPress(status)}
                >
                  <View
                    style={[
                      styles.statusOptionIcon,
                      { backgroundColor: getPlanStatusColor(status) + "20" },
                    ]}
                  >
                    <StatusIcon
                      status={status}
                      size={24}
                      color={getPlanStatusColor(status)}
                    />
                  </View>
                  <View style={styles.statusOptionContent}>
                    <Text style={styles.statusOptionTitle}>
                      {getPlanStatusLabel(status)}
                    </Text>
                    <Text style={styles.statusOptionDescription}>
                      {getStatusDescription(status)}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={lightTheme.colors.textSecondary}
                  />
                </TouchableOpacity>
              ))
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Edição de Datas */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dateModalContent}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Atualizar Datas do Plano</Text>
                <TouchableOpacity onPress={() => setShowDateModal(false)}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={lightTheme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.dateModalDescription}>
                A data de início do plano já passou. Por favor, atualize as
                datas antes de ativar o plano.
              </Text>

              {/* Data de Início */}
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>Data de Início *</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={lightTheme.colors.textSecondary}
                  />
                  <Text style={styles.dateInputText}>
                    {formatDate(newStartDate)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Checkbox para Data de Término */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => {
                  setHasEndDate(!hasEndDate);
                  if (hasEndDate) {
                    setNewEndDate(undefined);
                  }
                }}
              >
                <Ionicons
                  name={hasEndDate ? "checkbox" : "square-outline"}
                  size={24}
                  color={
                    hasEndDate
                      ? lightTheme.colors.primary
                      : lightTheme.colors.textSecondary
                  }
                />
                <Text style={styles.checkboxLabel}>
                  Definir data de término
                </Text>
              </TouchableOpacity>

              {/* Data de Término (se habilitado) */}
              {hasEndDate && (
                <View style={styles.dateField}>
                  <Text style={styles.dateLabel}>Data de Término *</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={lightTheme.colors.textSecondary}
                    />
                    <Text style={styles.dateInputText}>
                      {newEndDate ? formatDate(newEndDate) : "Selecione a data"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Botões */}
              <View style={styles.dateModalButtons}>
                <TouchableOpacity
                  style={[styles.dateModalButton, styles.dateModalButtonCancel]}
                  onPress={() => {
                    setShowDateModal(false);
                    setPendingStatus(null);
                  }}
                >
                  <Text style={styles.dateModalButtonCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dateModalButton, styles.dateModalButtonSave]}
                  onPress={handleSaveDates}
                >
                  <Text style={styles.dateModalButtonSaveText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={newStartDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowStartDatePicker(false);
              if (date) {
                setNewStartDate(date);
              }
            }}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={newEndDate || new Date()}
            mode="date"
            display="default"
            minimumDate={newStartDate}
            onChange={(event, date) => {
              setShowEndDatePicker(false);
              if (date) {
                setNewEndDate(date);
              }
            }}
          />
        )}
      </Modal>
    </>
  );
};

// Descrições dos status
const getStatusDescription = (status: PlanStatus): string => {
  switch (status) {
    case PlanStatus.DRAFT:
      return "Plano em elaboração, não visível para o paciente";
    case PlanStatus.ACTIVE:
      return "Plano em vigor, sendo seguido pelo paciente";
    case PlanStatus.COMPLETED:
      return "Plano finalizado, pode ser ativado posteriormente";
    case PlanStatus.ARCHIVED:
      return "Plano arquivado para consulta histórica";
    default:
      return "";
  }
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: lightTheme.spacing[4],
  },
  modalContent: {
    backgroundColor: lightTheme.colors.surface,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing[5],
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: lightTheme.spacing[4],
  },
  modalTitle: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.text,
  },
  currentStatusContainer: {
    marginBottom: lightTheme.spacing[4],
  },
  currentStatusLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.textSecondary,
    marginBottom: lightTheme.spacing[2],
  },
  statusBadge: {
    paddingHorizontal: lightTheme.spacing[3],
    paddingVertical: lightTheme.spacing[2],
    borderRadius: lightTheme.borderRadius.md,
    alignSelf: "flex-start",
  },
  statusBadgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[2],
  },
  statusBadgeText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: lightTheme.colors.border,
    marginVertical: lightTheme.spacing[4],
  },
  sectionTitle: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing[3],
  },
  noOptionsText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.textSecondary,
    textAlign: "center",
    paddingVertical: lightTheme.spacing[4],
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: lightTheme.spacing[3],
    borderRadius: lightTheme.borderRadius.md,
    backgroundColor: lightTheme.colors.background,
    marginBottom: lightTheme.spacing[2],
  },
  statusOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: lightTheme.borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: lightTheme.spacing[3],
  },
  statusOptionContent: {
    flex: 1,
  },
  statusOptionTitle: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.text,
    marginBottom: 2,
  },
  statusOptionDescription: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.textSecondary,
  },
  dateModalContent: {
    backgroundColor: lightTheme.colors.surface,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing[5],
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  dateModalDescription: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.textSecondary,
    marginBottom: lightTheme.spacing[4],
    lineHeight: 20,
  },
  dateField: {
    marginBottom: lightTheme.spacing[4],
  },
  dateLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing[2],
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
    borderRadius: lightTheme.borderRadius.md,
    padding: lightTheme.spacing[3],
    backgroundColor: lightTheme.colors.background,
  },
  dateInputText: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.text,
    marginLeft: lightTheme.spacing[2],
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: lightTheme.spacing[4],
  },
  checkboxLabel: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.text,
    marginLeft: lightTheme.spacing[2],
  },
  dateModalButtons: {
    flexDirection: "row",
    gap: lightTheme.spacing[3],
    marginTop: lightTheme.spacing[4],
  },
  dateModalButton: {
    flex: 1,
    paddingVertical: lightTheme.spacing[3],
    borderRadius: lightTheme.borderRadius.md,
    alignItems: "center",
  },
  dateModalButtonCancel: {
    backgroundColor: lightTheme.colors.background,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
  },
  dateModalButtonCancelText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.text,
  },
  dateModalButtonSave: {
    backgroundColor: lightTheme.colors.primary,
  },
  dateModalButtonSaveText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: "#FFFFFF",
  },
});
