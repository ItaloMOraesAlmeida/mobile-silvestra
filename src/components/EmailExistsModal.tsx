import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { lightTheme } from "../theme";

interface EmailExistsModalProps {
  visible: boolean;
  email: string;
  onClose: () => void;
  onGoToLogin: () => void;
  onRecoverPassword: () => void;
}

export function EmailExistsModal({
  visible,
  email,
  onClose,
  onGoToLogin,
  onRecoverPassword,
}: EmailExistsModalProps) {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[lightTheme.colors.primary, lightTheme.colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={24}
                color={lightTheme.colors.white}
              />
            </TouchableOpacity>

            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name="mail"
                  size={40}
                  color={lightTheme.colors.primaryDark}
                />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>Email Já Cadastrado</Text>

            {/* Message */}
            <Text style={styles.message}>
              O email <Text style={styles.emailText}>{email}</Text> já está
              cadastrado em nosso sistema.
            </Text>

            <Text style={styles.subMessage}>
              Você pode fazer login ou recuperar sua senha caso tenha esquecido.
            </Text>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              {/* Login Button */}
              <TouchableOpacity
                style={styles.button}
                onPress={onGoToLogin}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[
                    lightTheme.colors.primaryLight,
                    lightTheme.colors.primaryMedium,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Ionicons
                    name="log-in-outline"
                    size={20}
                    color={lightTheme.colors.white}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>Ir para Login</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Recover Password Button */}
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onRecoverPassword}
                activeOpacity={0.8}
              >
                <View style={styles.secondaryButtonContent}>
                  <Ionicons
                    name="key-outline"
                    size={20}
                    color={lightTheme.colors.primaryLighter}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.secondaryButtonText}>
                    Recuperar Senha
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: width - 40,
    maxWidth: 400,
    borderRadius: 20,
    overflow: "hidden",
  },
  gradient: {
    padding: 24,
    paddingTop: 16,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: lightTheme.colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: lightTheme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: lightTheme.colors.white,
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 12,
  },
  emailText: {
    fontFamily: "Poppins_600SemiBold",
    color: lightTheme.colors.primaryLighter,
  },
  subMessage: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonsContainer: {
    gap: 12,
  },
  button: {
    borderRadius: 14,
    overflow: "hidden",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    paddingHorizontal: 20,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: lightTheme.colors.white,
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  secondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(230, 164, 240, 0.5)",
  },
  secondaryButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    color: lightTheme.colors.primaryLighter,
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
});
