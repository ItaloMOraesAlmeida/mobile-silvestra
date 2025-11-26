import React, { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import type { Theme } from "../../theme";
import { GoalType } from "../../types/patient-details.types";
import type { CreateGoalDto } from "../../types/patient-details.types";

interface AddGoalModalProps {
  visible: boolean;
  patientId: string;
  onClose: () => void;
  onSubmit: (data: CreateGoalDto) => Promise<void>;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
  visible,
  patientId,
  onClose,
  onSubmit,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  const [selectedType, setSelectedType] = useState<GoalType>(GoalType.WEIGHT);
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");

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

      if (dateObj <= new Date()) {
        Alert.alert("Erro", "Prazo deve ser uma data futura");
        return;
      }

      deadlineISO = dateObj.toISOString();
    }

    const data: CreateGoalDto = {
      type: selectedType,
      target: targetNum,
      current: currentNum,
      unit: getUnitForType(selectedType),
      deadline: deadlineISO,
      notes: notes.trim() || undefined,
    };

    try {
      setLoading(true);
      await onSubmit(data);
      handleReset();
      onClose();
      Alert.alert("Sucesso", "Meta adicionada com sucesso!");
    } catch (error) {
      console.error("Error adding goal:", error);
      Alert.alert("Erro", "Não foi possível adicionar a meta");
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
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
          <Text style={styles.headerTitle}>Nova Meta</Text>
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
          {/* Goal Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Meta</Text>
            <View style={styles.typeButtons}>
              {Object.values(GoalType).map((type) => renderTypeButton(type))}
            </View>
          </View>

          {/* Target Value */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Meta <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWithUnit}>
              <TextInput
                style={[styles.input, styles.inputWithUnitInput]}
                value={target}
                onChangeText={setTarget}
                placeholder="Digite a meta"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="decimal-pad"
                editable={!loading}
              />
              {getUnitForType(selectedType) && (
                <View style={styles.unitBadge}>
                  <Text style={styles.unitText}>
                    {getUnitForType(selectedType)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Current Value */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Valor Atual (Opcional)</Text>
            <View style={styles.inputWithUnit}>
              <TextInput
                style={[styles.input, styles.inputWithUnitInput]}
                value={current}
                onChangeText={setCurrent}
                placeholder="Digite o valor atual"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="decimal-pad"
                editable={!loading}
              />
              {getUnitForType(selectedType) && (
                <View style={styles.unitBadge}>
                  <Text style={styles.unitText}>
                    {getUnitForType(selectedType)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Deadline */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prazo (Opcional)</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons
                name="calendar"
                size={20}
                color={theme.colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, styles.inputWithIconInput]}
                value={deadline}
                onChangeText={setDeadline}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                maxLength={10}
                editable={!loading}
              />
            </View>
            <Text style={styles.hint}>Ex: 31/12/2025</Text>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações (Opcional)</Text>
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

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
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
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    required: {
      color: theme.colors.error,
    },
    typeButtons: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
    },
    typeButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 2,
      minWidth: "47%",
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
      gap: theme.spacing.sm,
    },
    inputWithUnitInput: {
      flex: 1,
    },
    unitBadge: {
      backgroundColor: theme.colors.primaryLight,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      minWidth: 50,
      alignItems: "center",
    },
    unitText: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.primary,
    },
    inputWithIcon: {
      flexDirection: "row",
      alignItems: "center",
      position: "relative",
    },
    inputIcon: {
      position: "absolute",
      left: theme.spacing.md,
      zIndex: 1,
    },
    inputWithIconInput: {
      flex: 1,
      paddingLeft: theme.spacing.md * 2 + 20,
    },
    hint: {
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
