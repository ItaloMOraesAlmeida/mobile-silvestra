/**
 * CompleteGoalModal
 * Modal para concluir uma meta informando o valor final
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { lightTheme } from "../theme";
import { type PatientGoal } from "../services/meal-consumption.service";

interface CompleteGoalModalProps {
  visible: boolean;
  goal: PatientGoal | null;
  onClose: () => void;
  onComplete: (
    goalId: string,
    finalValue: number,
    notes?: string
  ) => Promise<void>;
}

// Schema de validação
const createCompleteSchema = (targetValue: number, unit: string) =>
  z.object({
    value: z
      .string()
      .min(1, "Por favor, insira o valor final")
      .refine((val) => !isNaN(Number(val)), {
        message: "Por favor, insira um valor numérico válido",
      })
      .refine((val) => Number(val) > 0, {
        message: "O valor deve ser maior que zero",
      })
      .refine((val) => Number(val) <= targetValue * 3, {
        message: `O valor parece muito alto. Meta: ${targetValue} ${unit}`,
      }),
    notes: z.string().max(500).optional(),
  });

type CompleteFormData = {
  value: string;
  notes?: string;
};

export function CompleteGoalModal({
  visible,
  goal,
  onClose,
  onComplete,
}: CompleteGoalModalProps) {
  const [loading, setLoading] = useState(false);

  const completeSchema = goal
    ? createCompleteSchema(goal.targetValue, goal.unit)
    : z.object({ value: z.string(), notes: z.string().optional() });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CompleteFormData>({
    resolver: zodResolver(completeSchema),
    mode: "onChange",
    defaultValues: {
      value: "",
      notes: "",
    },
  });

  const valueWatch = watch("value");

  // Reset form quando o modal abrir
  useEffect(() => {
    if (visible && goal) {
      reset({
        value: "",
        notes: "",
      });
    }
  }, [visible, goal, reset]);

  const handleComplete = async (data: CompleteFormData) => {
    if (!goal) return;

    const finalValue = parseFloat(data.value);

    try {
      setLoading(true);
      await onComplete(goal.id, finalValue, data.notes);
      reset();
      onClose();
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.response?.data?.message || "Erro ao concluir meta"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      onClose();
    }
  };

  if (!goal) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
        keyboardVerticalOffset={0}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Ionicons
                name="checkmark-circle"
                size={28}
                color={lightTheme.colors.success}
              />
              <View style={styles.headerText}>
                <Text style={styles.title}>Concluir Meta</Text>
                <Text style={styles.subtitle}>{goal.name}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              disabled={loading}
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={24}
                color={lightTheme.colors.gray[600]}
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Info da meta */}
            <View style={styles.goalInfo}>
              <Text style={styles.infoLabel}>Meta a alcançar</Text>
              <Text style={styles.infoValue}>
                {goal.targetValue} {goal.unit}
              </Text>
            </View>

            {/* Valores de referência */}
            <View style={styles.valuesReference}>
              <View style={styles.referenceItem}>
                <Text style={styles.referenceLabel}>Valor Inicial</Text>
                <Text style={styles.referenceValue}>
                  {goal.initialValue} {goal.unit}
                </Text>
              </View>
              <View style={styles.referenceItem}>
                <Text style={styles.referenceLabel}>Valor Atual</Text>
                <Text style={styles.referenceValue}>
                  {goal.currentValue} {goal.unit}
                </Text>
              </View>
            </View>

            {/* Input de valor final */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Valor final alcançado</Text>
              <Controller
                control={control}
                name="value"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.value && styles.inputWrapperError,
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="decimal-pad"
                      placeholder={`Ex: ${goal.targetValue.toFixed(1)}`}
                      placeholderTextColor={lightTheme.colors.gray[400]}
                      editable={!loading}
                      autoFocus
                    />
                    <Text style={styles.unitText}>{goal.unit}</Text>
                  </View>
                )}
              />

              {/* Mensagem de erro */}
              {errors.value && (
                <View style={styles.errorContainer}>
                  <Ionicons
                    name="alert-circle"
                    size={16}
                    color={lightTheme.colors.error}
                  />
                  <Text style={styles.errorText}>{errors.value.message}</Text>
                </View>
              )}
            </View>

            {/* Campo de observações */}
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Observações (opcional)</Text>
                  <TextInput
                    style={styles.notesInput}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Adicione observações sobre a conquista..."
                    placeholderTextColor={lightTheme.colors.gray[400]}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    editable={!loading}
                  />
                </View>
              )}
            />

            {errors.notes && (
              <View style={styles.errorContainer}>
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color={lightTheme.colors.error}
                />
                <Text style={styles.errorText}>{errors.notes.message}</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.completeButton,
                (loading || !valueWatch || !!errors.value) &&
                  styles.completeButtonDisabled,
              ]}
              onPress={handleSubmit(handleComplete)}
              disabled={loading || !valueWatch || !!errors.value}
            >
              {loading ? (
                <Text style={styles.completeButtonText}>Concluindo...</Text>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.completeButtonText}>Concluir Meta</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 500,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: lightTheme.colors.success + "10",
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: lightTheme.colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: lightTheme.colors.gray[600],
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  goalInfo: {
    backgroundColor: lightTheme.colors.primary + "10",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 13,
    color: lightTheme.colors.gray[600],
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 24,
    fontWeight: "700",
    color: lightTheme.colors.primary,
  },
  valuesReference: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  referenceItem: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[100],
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  referenceLabel: {
    fontSize: 12,
    color: lightTheme.colors.gray[600],
    marginBottom: 4,
  },
  referenceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: lightTheme.colors.gray[900],
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: lightTheme.colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: lightTheme.colors.gray[300],
    paddingHorizontal: 16,
  },
  inputWrapperError: {
    borderColor: lightTheme.colors.error,
    backgroundColor: `${lightTheme.colors.error}05`,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    color: lightTheme.colors.text,
    paddingVertical: 12,
  },
  unitText: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.gray[600],
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: `${lightTheme.colors.error}15`,
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: lightTheme.colors.error,
  },
  progressPreview: {
    marginTop: 12,
    gap: 6,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: lightTheme.colors.gray[200],
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: lightTheme.colors.gray[600],
    textAlign: "right",
  },
  notesContainer: {
    marginTop: 4,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: lightTheme.colors.text,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: lightTheme.colors.gray[300],
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: lightTheme.colors.text,
    minHeight: 100,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: lightTheme.colors.gray[300],
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: lightTheme.colors.text,
  },
  completeButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    backgroundColor: lightTheme.colors.success,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  completeButtonDisabled: {
    backgroundColor: lightTheme.colors.gray[300],
    shadowOpacity: 0,
    elevation: 0,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
