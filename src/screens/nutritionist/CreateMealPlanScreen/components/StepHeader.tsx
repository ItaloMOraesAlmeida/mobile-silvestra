import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../../../theme";

interface StepHeaderProps {
  currentStep: 1 | 2;
  totalSteps: 2;
  title: string;
  onBackPress?: () => void;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
}

export const StepHeader: React.FC<StepHeaderProps> = ({
  currentStep,
  totalSteps,
  title,
  onBackPress,
  rightAction,
}) => {
  return (
    <View style={styles.stepHeader}>
      {/* Left: Back button (only on step 2+) */}
      {currentStep > 1 && onBackPress ? (
        <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={lightTheme.colors.primary}
          />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.backButtonPlaceholder} />
      )}

      {/* Center: Step title */}
      <Text style={styles.stepHeaderText}>
        Passo {currentStep} de {totalSteps} - {title}
      </Text>

      {/* Right: Action button or placeholder */}
      {rightAction ? (
        <TouchableOpacity
          onPress={rightAction.onPress}
          style={styles.actionButton}
          disabled={rightAction.disabled || rightAction.loading}
        >
          {rightAction.loading ? (
            <ActivityIndicator size="small" color={lightTheme.colors.primary} />
          ) : (
            <Ionicons
              name={rightAction.icon}
              size={24}
              color={lightTheme.colors.primary}
            />
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.backButtonPlaceholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  stepHeader: {
    backgroundColor: lightTheme.colors.white,
    paddingHorizontal: lightTheme.spacing[4],
    paddingVertical: lightTheme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepHeaderText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[600],
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: lightTheme.spacing[2],
    minWidth: 80, // Garante espaço consistente
  },
  backButtonText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.primary,
    fontWeight: lightTheme.typography.fontWeight.medium,
    marginLeft: lightTheme.spacing[1],
  },
  backButtonPlaceholder: {
    width: 80, // Mesmo tamanho do botão para simetria
  },
  actionButton: {
    padding: lightTheme.spacing[2],
    alignItems: "center",
    justifyContent: "center",
    minWidth: 48,
  },
});
