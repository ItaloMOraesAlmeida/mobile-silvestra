import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import type { Theme } from "../../theme";

interface UpdateProgressModalProps {
  visible: boolean;
  currentValue: number | null;
  targetValue: number;
  unit: string;
  goalType: string;
  onClose: () => void;
  onUpdate: (newValue: number) => Promise<void>;
}

/**
 * Modal para atualizar o progresso de uma meta
 * Substitui Alert.prompt para funcionar em iOS e Android
 */
export const UpdateProgressModal: React.FC<UpdateProgressModalProps> = ({
  visible,
  currentValue,
  targetValue,
  unit,
  goalType,
  onClose,
  onUpdate,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const [value, setValue] = useState(currentValue?.toString() || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    const numericValue = parseFloat(value);

    // Validações
    if (isNaN(numericValue)) {
      setError("Por favor, insira um valor numérico válido");
      return;
    }

    if (numericValue < 0) {
      setError("O valor não pode ser negativo");
      return;
    }

    if (numericValue > targetValue * 2) {
      setError(`O valor parece muito alto. Meta: ${targetValue} ${unit}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onUpdate(numericValue);
      setValue("");
      onClose();
    } catch (err) {
      console.error("Error updating progress:", err);
      setError("Erro ao atualizar progresso. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setValue("");
      setError(null);
      onClose();
    }
  };

  // Calcula progresso
  const calculateProgress = () => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return 0;
    return Math.min((numericValue / targetValue) * 100, 100);
  };

  const progress = calculateProgress();

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
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="trending-up"
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
              <View>
                <Text style={styles.title}>Atualizar Progresso</Text>
                <Text style={styles.subtitle}>{goalType}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={loading}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Valor Atual:</Text>
              <Text style={styles.infoValue}>
                {currentValue?.toFixed(1) || "—"} {unit}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Meta:</Text>
              <Text style={styles.infoValue}>
                {targetValue.toFixed(1)} {unit}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Progresso:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.primary }]}>
                {((currentValue || 0 / targetValue) * 100).toFixed(0)}%
              </Text>
            </View>
          </View>

          {/* Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Novo valor ({unit})</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={setValue}
                keyboardType="decimal-pad"
                placeholder={`Ex: ${targetValue.toFixed(1)}`}
                placeholderTextColor={theme.colors.textSecondary}
                editable={!loading}
                autoFocus
              />
              <Text style={styles.unitText}>{unit}</Text>
            </View>

            {/* Preview do progresso */}
            {value && !isNaN(parseFloat(value)) && (
              <View style={styles.progressPreview}>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${progress}%`,
                        backgroundColor:
                          progress >= 100
                            ? theme.colors.success
                            : progress >= 75
                            ? theme.colors.info
                            : progress >= 50
                            ? theme.colors.warning
                            : theme.colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color={theme.colors.error}
                />
                <Text style={styles.errorText}>{error}</Text>
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
                styles.updateButton,
                (loading || !value || error) && styles.updateButtonDisabled,
              ]}
              onPress={handleUpdate}
              disabled={loading || !value || !!error}
            >
              {loading ? (
                <Text style={styles.updateButtonText}>Atualizando...</Text>
              ) : (
                <>
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={theme.colors.white}
                  />
                  <Text style={styles.updateButtonText}>Atualizar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
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
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      overflow: "hidden",
      ...theme.shadows.lg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      flex: 1,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primaryBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    closeButton: {
      padding: theme.spacing.xs,
    },
    infoContainer: {
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    infoLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    infoValue: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
    },
    inputContainer: {
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
    },
    input: {
      flex: 1,
      fontSize: 24,
      fontWeight: "700",
      color: theme.colors.text,
      paddingVertical: theme.spacing.md,
    },
    unitText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.sm,
    },
    progressPreview: {
      marginTop: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: theme.colors.border,
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
      color: theme.colors.textSecondary,
      textAlign: "right",
    },
    errorContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.sm,
      padding: theme.spacing.sm,
      backgroundColor: `${theme.colors.error}15`,
      borderRadius: 8,
    },
    errorText: {
      flex: 1,
      fontSize: 12,
      color: theme.colors.error,
    },
    actions: {
      flexDirection: "row",
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
    },
    updateButton: {
      flex: 1,
      flexDirection: "row",
      paddingVertical: theme.spacing.md,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.xs,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      ...theme.shadows.md,
    },
    updateButtonDisabled: {
      backgroundColor: theme.colors.border,
      ...theme.shadows.none,
    },
    updateButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.white,
    },
  });
