import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../theme";

interface BiometricPromptModalProps {
  visible: boolean;
  biometricType: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function BiometricPromptModal({
  visible,
  biometricType,
  onAccept,
  onDecline,
}: BiometricPromptModalProps) {
  const getIconName = () => {
    if (Platform.OS === "ios" && biometricType === "Face ID") {
      return "scan-outline";
    }
    return "finger-print-outline";
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[
                lightTheme.colors.primaryLight,
                lightTheme.colors.primaryMedium,
              ]}
              style={styles.iconGradient}
            >
              <Ionicons
                name={getIconName()}
                size={48}
                color={lightTheme.colors.white}
              />
            </LinearGradient>
          </View>

          <Text style={styles.title}>Habilitar {biometricType}?</Text>
          <Text style={styles.message}>
            Use {biometricType} para acessar o aplicativo de forma rápida e
            segura, sem precisar digitar email e senha toda vez.
          </Text>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={onDecline}
              activeOpacity={0.8}
            >
              <Text style={styles.declineText}>Agora não</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={onAccept}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[
                  lightTheme.colors.primaryLight,
                  lightTheme.colors.primaryMedium,
                ]}
                style={styles.acceptGradient}
              >
                <Text style={styles.acceptText}>Habilitar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: lightTheme.spacing.screenPaddingLarge,
  },
  container: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing.screenPaddingLarge,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: lightTheme.spacing.lg - 4,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: lightTheme.borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: lightTheme.typography.fontSize["2xl"] - 2,
    fontFamily: "Poppins_700Bold",
    color: lightTheme.colors.gray[800],
    marginBottom: lightTheme.spacing.md - 4,
    textAlign: "center",
  },
  message: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontFamily: "Poppins_400Regular",
    color: lightTheme.colors.gray[600],
    textAlign: "center",
    lineHeight:
      lightTheme.typography.lineHeight.relaxed *
      lightTheme.typography.fontSize.sm,
    marginBottom: lightTheme.spacing.screenPaddingLarge,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: lightTheme.spacing.md - 4,
    width: "100%",
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: lightTheme.borderRadius.md,
    overflow: "hidden",
  },
  declineButton: {
    backgroundColor: lightTheme.colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  declineText: {
    fontSize: lightTheme.typography.fontSize.base - 1,
    fontFamily: "Poppins_600SemiBold",
    color: lightTheme.colors.gray[600],
  },
  acceptButton: {
    overflow: "hidden",
  },
  acceptGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  acceptText: {
    fontSize: lightTheme.typography.fontSize.base - 1,
    fontFamily: "Poppins_600SemiBold",
    color: lightTheme.colors.white,
  },
});
