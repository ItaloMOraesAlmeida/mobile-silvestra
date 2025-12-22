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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";
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
      { icon: keyof typeof Ionicons.glyphMap; label: string }
    > = {
      [GoalType.WEIGHT]: { icon: "scale", label: "Peso" },
      [GoalType.BODY_FAT]: { icon: "water", label: "Gordura Corporal" },
      [GoalType.MUSCLE_MASS]: { icon: "fitness", label: "Massa Muscular" },
      [GoalType.WAIST_CIRC]: { icon: "ellipse", label: "Circunferência" },
      [GoalType.OTHER]: { icon: "flag", label: "Outro" },
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
      name: `Meta de ${getGoalTypeInfo(selectedType).label}`,
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

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    unit?: string,
    required = false
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, unit && { flex: 1 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={lightTheme.colors.gray[400]}
          keyboardType="decimal-pad"
          editable={!loading}
        />
        {unit && <Text style={styles.unitBadge}>{unit}</Text>}
      </View>
    </View>
  );

  const renderDateInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWithIcon}>
        <Ionicons
          name="calendar"
          size={18}
          color={lightTheme.colors.gray[400]}
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, styles.inputWithIconPadding]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={lightTheme.colors.gray[400]}
          keyboardType="numeric"
          maxLength={10}
          editable={!loading}
        />
      </View>
    </View>
  );

  const renderSection = (
    title: string,
    icon: keyof typeof Ionicons.glyphMap,
    children: React.ReactNode
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name={icon} size={20} color={lightTheme.colors.primary} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={styles.headerInfo}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Ionicons name="close" size={28} color={lightTheme.colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Nova Meta</Text>
              <Text style={styles.headerSubtitle}>Definir objetivo</Text>
            </View>
            <View style={styles.closeButton} />
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Goal Type */}
            {renderSection(
              "Tipo de Meta",
              "flag",
              <View style={styles.protocolContainer}>
                {Object.values(GoalType).map((type) => {
                  const typeInfo = getGoalTypeInfo(type);
                  const isSelected = selectedType === type;

                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.protocolOption,
                        isSelected && styles.protocolOptionSelected,
                      ]}
                      onPress={() => setSelectedType(type)}
                      activeOpacity={0.7}
                      disabled={loading}
                    >
                      <View style={styles.protocolOptionContent}>
                        <Ionicons
                          name={
                            isSelected ? "radio-button-on" : "radio-button-off"
                          }
                          size={24}
                          color={
                            isSelected
                              ? lightTheme.colors.primary
                              : lightTheme.colors.gray[400]
                          }
                        />
                        <Ionicons
                          name={typeInfo.icon}
                          size={20}
                          color={
                            isSelected
                              ? lightTheme.colors.primary
                              : lightTheme.colors.gray[600]
                          }
                          style={{ marginLeft: 8 }}
                        />
                        <Text
                          style={[
                            styles.protocolOptionText,
                            isSelected && styles.protocolOptionTextSelected,
                          ]}
                        >
                          {typeInfo.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Goal Values */}
            {renderSection(
              "Valores",
              "analytics",
              <View style={styles.row}>
                {renderInput(
                  "Meta",
                  target,
                  setTarget,
                  "Ex: 70",
                  getUnitForType(selectedType),
                  true
                )}
                {renderInput(
                  "Atual",
                  current,
                  setCurrent,
                  "Ex: 82",
                  getUnitForType(selectedType)
                )}
              </View>
            )}

            {/* Deadline */}
            {renderSection(
              "Prazo",
              "time",
              renderDateInput(
                "Data limite",
                deadline,
                setDeadline,
                "DD/MM/AAAA"
              )
            )}

            {/* Notes */}
            {renderSection(
              "Observações",
              "document-text",
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Adicione observações sobre esta meta..."
                  placeholderTextColor={lightTheme.colors.gray[400]}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  editable={!loading}
                />
              </View>
            )}

            <View style={styles.bottomSpacer} />
          </ScrollView>

          {/* Fixed Bottom Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <Text style={styles.submitButtonText}>Salvando...</Text>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.submitButtonText}>Salvar Meta</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: lightTheme.spacing.xl,
    backgroundColor: lightTheme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: lightTheme.colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: lightTheme.colors.gray[600],
  },
  section: {
    marginTop: lightTheme.spacing.lg,
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    marginHorizontal: lightTheme.spacing.xl,
    overflow: "hidden",
    ...lightTheme.shadows.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: lightTheme.spacing.lg,
    backgroundColor: lightTheme.colors.white,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.text,
  },
  sectionContent: {
    padding: lightTheme.spacing.lg,
    paddingTop: 0,
  },
  protocolContainer: {
    gap: lightTheme.spacing.sm,
  },
  protocolOption: {
    backgroundColor: lightTheme.colors.white,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    borderRadius: lightTheme.borderRadius.md,
    padding: lightTheme.spacing.md,
    marginBottom: lightTheme.spacing.sm,
  },
  protocolOptionSelected: {
    borderColor: lightTheme.colors.primary,
    backgroundColor: lightTheme.colors.primaryBackground,
  },
  protocolOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.sm,
  },
  protocolOptionText: {
    fontSize: 15,
    fontWeight: "500",
    color: lightTheme.colors.text,
    flex: 1,
  },
  protocolOptionTextSelected: {
    color: lightTheme.colors.primary,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: lightTheme.spacing.md,
  },
  inputContainer: {
    marginBottom: lightTheme.spacing.md,
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing.xs,
  },
  required: {
    color: lightTheme.colors.error,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    borderRadius: lightTheme.borderRadius.md,
    paddingVertical: lightTheme.spacing.sm,
    paddingHorizontal: lightTheme.spacing.md,
    fontSize: 15,
    color: lightTheme.colors.text,
    backgroundColor: lightTheme.colors.white,
    height: 44,
  },
  unitBadge: {
    fontSize: 14,
    fontWeight: "600",
    color: lightTheme.colors.primary,
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.sm,
    backgroundColor: lightTheme.colors.primaryBackground,
    borderRadius: lightTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: lightTheme.colors.primary + "30",
    height: 44,
    lineHeight: 28,
  },
  inputWithIcon: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: lightTheme.spacing.md,
    top: 13,
    zIndex: 1,
  },
  inputWithIconPadding: {
    paddingLeft: 40,
  },
  textArea: {
    height: 100,
    paddingTop: lightTheme.spacing.sm,
    textAlignVertical: "top",
  },
  bottomSpacer: {
    height: 40,
  },
  footer: {
    padding: lightTheme.spacing.lg,
    backgroundColor: lightTheme.colors.white,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[200],
    ...lightTheme.shadows.md,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: lightTheme.spacing.sm,
    backgroundColor: lightTheme.colors.primary,
    paddingVertical: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.lg,
    ...lightTheme.shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
