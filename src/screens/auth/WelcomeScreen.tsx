import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";

type WelcomeScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  "Welcome"
>;

export function WelcomeScreen() {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();

  return (
    <View style={styles.container}>
      {/* Logo e Tagline */}
      <View style={styles.header}>
        <Text style={styles.logo}>🌟 Silvestra</Text>
        <Text style={styles.tagline}>Nutrição personalizada com IA</Text>
      </View>

      {/* Botões de Ação */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.primaryButtonText}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.secondaryButtonText}>Criar Conta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={() => {
            // TODO: Implementar Google Sign-In
            console.log("Google Sign-In");
          }}
        >
          <Text style={styles.googleButtonText}>🔐 Continuar com Google</Text>
        </TouchableOpacity>
      </View>

      {/* Link para Esqueci Senha */}
      <TouchableOpacity
        style={styles.forgotPasswordLink}
        onPress={() => navigation.navigate("ForgotPassword")}
      >
        <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 60,
  },
  logo: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#572363",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    gap: 16,
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: "#572363",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#572363",
  },
  secondaryButtonText: {
    color: "#572363",
    fontSize: 16,
    fontWeight: "600",
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  googleButtonText: {
    color: "#333333",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotPasswordLink: {
    marginTop: 24,
  },
  forgotPasswordText: {
    color: "#572363",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
