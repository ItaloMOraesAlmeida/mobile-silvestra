import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import { useModalAnimation } from "../../hooks/useAnimations";
import type { Theme } from "../../theme";
import { GoalType } from "../../types/patient-details.types";
import type { Goal, UpdateGoalDto } from "../../types/patient-details.types";

interface EditGoalModalProps {
  visible: boolean;
  patientId: string;
  goal: Goal | null;
  onClose: () => void;
  onSubmit: (goalId: string, data: UpdateGoalDto) => Promise<void>;
}

export const EditGoalModal: React.FC<EditGoalModalProps> = ({
  visible,
  patientId,
  goal,
  onClose,
  onSubmit,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const modalAnim = useModalAnimation(visible);
  const [loading, setLoading] = useState(false);

  const [selectedType, setSelectedType] = useState<GoalType>(GoalType.WEIGHT);
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");

  // Pre-fill form when goal changes
  useEffect(() => {
    if (goal && visible) {
      setSelectedType(goal.type);
      setTarget(goal.target?.toString() || "");
      setCurrent(goal.current?.toString() || "");

      // Format deadline from ISO to DD/MM/YYYY
      if (goal.deadline) {
        const date = new Date(goal.deadline);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        setDeadline(`${day}/${month}/${year}`);
      } else {
        setDeadline("");
      }

      setNotes(goal.notes || "");
    }
  }, [goal, visible]);

  const getUnitForType = (type: GoalType): string => {
    const units: Record<GoalType, string> = {
      [GoalType.WEIGHT]: "kg",
      [GoalType.BODY_FAT]: "%",
      [GoalType.MUSCLE_MASS]: "kg",
      [GoalType.WAIST_CIRC]: "cm",
      [GoalType.OTHER]: "",
    };
    return units[type];
  };

  const getGoalTypeInfo = (type: GoalType) => {
    const info: Record<
      GoalType,
      { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }
    > = {
      [GoalType.WEIGHT]: {
        icon: "scale",
        label: "Peso",
        color: theme.colors.primary,
      },
      [GoalType.BODY_FAT]: {
        icon: "water",
        label: "Gordura Corporal",
        color: theme.colors.warning,
      },
      [GoalType.MUSCLE_MASS]: {
        icon: "fitness",
        label: "Massa Muscular",
        color: theme.colors.success,
      },
      [GoalType.WAIST_CIRC]: {
        icon: "ellipse",
        label: "Circunferência da Cintura",
        color: theme.colors.info,
      },
      [GoalType.OTHER]: {
        icon: "flag",
        label: "Outro",
        color: theme.colors.textSecondary,
      },
    };
    return info[type];
  };

  const handleReset = () => {
    setSelectedType(GoalType.WEIGHT);
    setTarget("");
    setCurrent("");
    setDeadline("");
    setNotes("");
  };

  const handleClose = () => {
    if (!loading) {
      handleReset();
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!goal) {
      Alert.alert("Erro", "Nenhuma meta selecionada");
      return;
    }

    // Validate required fields
    if (!target) {
      Alert.alert("Campo obrigatório", "Meta é obrigatória");
      return;
    }

    const targetNum = parseFloat(target);

    if (isNaN(targetNum) || targetNum <= 0) {
      Alert.alert("Erro", "Meta deve ser um número válido maior que zero");
      return;
    }

    const currentNum = current ? parseFloat(current) : undefined;
    if (current && (isNaN(currentNum!) || currentNum! < 0)) {
      Alert.alert("Erro", "Valor atual deve ser um número válido");
      return;
    }

    // Validate deadline format (DD/MM/YYYY)
    let deadlineISO: string | undefined = undefined;
    if (deadline) {
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = deadline.match(dateRegex);

      if (!match) {
        Alert.alert("Erro", "Prazo deve estar no formato DD/MM/AAAA");
        return;
      }

      const [, day, month, year] = match;
      const dateObj = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );

      // Allow extending deadline to future date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateObj < today) {
        Alert.alert("Erro", "Prazo não pode ser uma data passada");
        return;
      }

      deadlineISO = dateObj.toISOString();
    }

    const data: UpdateGoalDto = {
      type: selectedType,
      target: targetNum,
      current: currentNum,
      unit: getUnitForType(selectedType),
      deadline: deadlineISO,
      notes: notes.trim() || undefined,
    };

    try {
      setLoading(true);
      await onSubmit(goal.id, data);
      handleReset();
      onClose();
      Alert.alert("Sucesso", "Meta atualizada com sucesso!");
    } catch (error) {
      console.error("Error updating goal:", error);
      Alert.alert("Erro", "Não foi possível atualizar a meta");
    } finally {
      setLoading(false);
    }
  };

  const renderTypeButton = (type: GoalType) => {
    const typeInfo = getGoalTypeInfo(type);
    const isSelected = selectedType === type;

    return (
      <TouchableOpacity
        key={type}
        style={[
          styles.typeButton,
          isSelected && styles.typeButtonActive,
          { borderColor: typeInfo.color },
        ]}
        onPress={() => setSelectedType(type)}
        activeOpacity={0.7}
        disabled={loading}
      >
        <Ionicons
          name={typeInfo.icon}
          size={24}
          color={isSelected ? theme.colors.white : typeInfo.color}
        />
        <Text
          style={[
            styles.typeButtonText,
            isSelected && styles.typeButtonTextActive,
          ]}
        >
          {typeInfo.label}
        </Text>
      </TouchableOpacity>
    );
  };

  if (!goal) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      transparent
    >
      <Animated.View
        style={[
          styles.modalOverlay,
          {
            opacity: modalAnim.opacity,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.modalContent,
            {
              opacity: modalAnim.opacity,
              transform: [
                { translateY: modalAnim.translateY },
                { scale: modalAnim.scale },
              ],
            },
          ]}
        >
          <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                disabled={loading}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Editar Meta</Text>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  loading && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? "Salvando..." : "Salvar"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Type Selection */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="apps-outline"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.sectionTitle}>Tipo de Meta</Text>
                </View>
                <View style={styles.typeGrid}>
                  {Object.values(GoalType).map((type) =>
                    renderTypeButton(type)
                  )}
                </View>
              </View>

              {/* Goal Values */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="stats-chart"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.sectionTitle}>Valores</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    Meta <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.inputWithUnit}>
                    <TextInput
                      style={[styles.input, styles.inputWithUnitInput]}
                      value={target}
                      onChangeText={setTarget}
                      placeholder="Ex: 70"
                      placeholderTextColor={theme.colors.textSecondary}
                      keyboardType="decimal-pad"
                      editable={!loading}
                    />
                    <View style={styles.unitContainer}>
                      <Text style={styles.unitText}>
                        {getUnitForType(selectedType)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Valor Atual (Progresso)</Text>
                  <View style={styles.inputWithUnit}>
                    <TextInput
                      style={[styles.input, styles.inputWithUnitInput]}
                      value={current}
                      onChangeText={setCurrent}
                      placeholder="Ex: 72"
                      placeholderTextColor={theme.colors.textSecondary}
                      keyboardType="decimal-pad"
                      editable={!loading}
                    />
                    <View style={styles.unitContainer}>
                      <Text style={styles.unitText}>
                        {getUnitForType(selectedType)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.inputHint}>
                    Atualize este valor para acompanhar o progresso
                  </Text>
                </View>
              </View>

              {/* Deadline */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="calendar-outline"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.sectionTitle}>Prazo</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Data Limite</Text>
                  <TextInput
                    style={styles.input}
                    value={deadline}
                    onChangeText={setDeadline}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="numeric"
                    maxLength={10}
                    editable={!loading}
                  />
                  <Text style={styles.inputHint}>
                    Você pode estender o prazo para uma data futura
                  </Text>
                </View>
              </View>

              {/* Notes */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="document-text-outline"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.sectionTitle}>Observações</Text>
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Adicione observações sobre esta meta..."
                    placeholderTextColor={theme.colors.textSecondary}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.bottomSpacer} />
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      overflow: "hidden",
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      ...theme.shadows.sm,
    },
    closeButton: {
      padding: theme.spacing.xs,
      width: 70,
    },
    headerTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
    },
    submitButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      width: 100,
      alignItems: "center",
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.white,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: theme.spacing.md,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
    },
    typeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
    },
    typeButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 2,
      backgroundColor: theme.colors.card,
    },
    typeButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    typeButtonText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text,
    },
    typeButtonTextActive: {
      color: theme.colors.white,
    },
    inputContainer: {
      marginBottom: theme.spacing.md,
    },
    inputLabel: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    required: {
      color: theme.colors.error,
    },
    input: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text,
    },
    inputWithUnit: {
      flexDirection: "row",
      alignItems: "center",
    },
    inputWithUnitInput: {
      flex: 1,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      borderRightWidth: 0,
    },
    unitContainer: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderLeftWidth: 0,
      borderTopRightRadius: theme.borderRadius.md,
      borderBottomRightRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      minWidth: 60,
      alignItems: "center",
      justifyContent: "center",
    },
    unitText: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.textSecondary,
    },
    inputHint: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
      fontStyle: "italic",
    },
    textArea: {
      minHeight: 100,
      paddingTop: theme.spacing.sm,
    },
    bottomSpacer: {
      height: theme.spacing.xl,
    },
  });
