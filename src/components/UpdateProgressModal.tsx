/**
 * UpdateProgressModal
 * Modal para atualizar o progresso de uma meta
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
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

interface UpdateProgressModalProps {
  visible: boolean;
  goal: PatientGoal | null;
  onClose: () => void;
  onUpdate: (goalId: string, newValue: number, notes?: string) => Promise<void>;
}

// Schema de validação
const createProgressSchema = (targetValue: number, unit: string) =>
  z.object({
    value: z
      .string()
      .min(1, "Por favor, insira um valor")
      .refine((val) => !isNaN(Number(val)), {
        message: "Por favor, insira um valor numérico válido",
      })
      .refine((val) => Number(val) > 0, {
        message: "O valor deve ser maior que zero",
      })
      .refine((val) => Number(val) <= targetValue * 3, {
        message: `O valor parece muito alto. Meta: ${targetValue} ${unit}`,
      }),
    notes: z.string().optional(),
  });

type ProgressFormData = {
  value: string;
  notes?: string;
};

export function UpdateProgressModal({
  visible,
  goal,
  onClose,
  onUpdate,
}: UpdateProgressModalProps) {
  const [loading, setLoading] = useState(false);

  const progressSchema = React.useMemo(
    () => (goal ? createProgressSchema(goal.targetValue, goal.unit) : null),
    [goal]
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProgressFormData>({
    resolver: progressSchema ? zodResolver(progressSchema) : undefined,
    mode: "onChange",
    defaultValues: {
      value: "",
      notes: "",
    },
  });

  React.useEffect(() => {
    if (goal && visible) {
      reset({ value: "", notes: "" });
    }
  }, [goal, visible, reset]);

  const onSubmit = async (data: ProgressFormData) => {
    if (!goal) return;

    const value = parseFloat(data.value);

    try {
      setLoading(true);
      await onUpdate(goal.id, value, data.notes?.trim() || undefined);
      reset();
      onClose();
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.response?.data?.message || "Erro ao atualizar progresso"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!goal) return null;

  const getGoalTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      WEIGHT: "Peso",
      BODY_FAT: "Gordura Corporal",
      MUSCLE_MASS: "Massa Muscular",
      WAIST_CIRC: "Circunferência da Cintura",
      OTHER: "Outro",
    };
    return labels[type] || type;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
        keyboardVerticalOffset={0}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Atualizar Progresso</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={lightTheme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Goal Info */}
          <View style={styles.goalInfo}>
            <Text style={styles.goalName}>{goal.name}</Text>
            <Text style={styles.goalType}>{getGoalTypeLabel(goal.type)}</Text>
          </View>

          {/* Current Values */}
          <View style={styles.valuesContainer}>
            <View style={styles.valueBox}>
              <Text style={styles.valueLabel}>Inicial</Text>
              <Text style={styles.valueText}>
                {goal.initialValue} {goal.unit}
              </Text>
            </View>
            <View style={styles.valueBox}>
              <Text style={styles.valueLabel}>Meta</Text>
              <Text style={styles.valueText}>
                {goal.targetValue} {goal.unit}
              </Text>
            </View>
          </View>

          {/* Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>
              Novo Valor ({goal.unit}) <Text style={styles.required}>*</Text>
            </Text>
            <Controller
              control={control}
              name="value"
              render={({ field: { onChange, value, onBlur } }) => (
                <View
                  style={[
                    styles.inputContainer,
                    errors.value && styles.inputError,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="decimal-pad"
                    placeholder={`Ex: ${goal.targetValue}`}
                    placeholderTextColor={lightTheme.colors.gray[400]}
                    editable={!loading}
                  />
                  <Text style={styles.unitText}>{goal.unit}</Text>
                </View>
              )}
            />
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

          {/* Notes Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Observações (opcional)</Text>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={styles.notesInput}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Adicione uma observação..."
                  placeholderTextColor={lightTheme.colors.gray[400]}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!loading}
                />
              )}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.updateButton,
                (loading || Object.keys(errors).length > 0) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading || Object.keys(errors).length > 0}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.updateButtonText}>Atualizar</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modal: {
    width: "92%",
    maxWidth: 420,
    minHeight: 520,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: lightTheme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  goalInfo: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  goalName: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.text,
    marginBottom: 4,
  },
  goalType: {
    fontSize: 14,
    color: lightTheme.colors.gray[600],
  },
  valuesContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  valueBox: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[50],
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  valueLabel: {
    fontSize: 12,
    color: lightTheme.colors.gray[600],
    marginBottom: 4,
  },
  valueText: {
    fontSize: 18,
    fontWeight: "600",
    color: lightTheme.colors.text,
  },
  inputWrapper: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: lightTheme.colors.text,
    marginBottom: 8,
  },
  required: {
    color: lightTheme.colors.error,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: lightTheme.colors.error,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: lightTheme.colors.text,
  },
  unitText: {
    fontSize: 14,
    fontWeight: "600",
    color: lightTheme.colors.gray[600],
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    color: lightTheme.colors.error,
    flex: 1,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: lightTheme.colors.text,
    height: 150,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: lightTheme.colors.gray[100],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.text,
  },
  updateButton: {
    backgroundColor: lightTheme.colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
