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
              colors={["#9b6cb0", "#6b3d7a"]}
              style={styles.iconGradient}
            >
              <Ionicons name={getIconName()} size={48} color="#FFFFFF" />
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
                colors={["#9b6cb0", "#6b3d7a"]}
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
    paddingHorizontal: 24,
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: "#333333",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#666666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    overflow: "hidden",
  },
  declineButton: {
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  declineText: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: "#666666",
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
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
  },
});
