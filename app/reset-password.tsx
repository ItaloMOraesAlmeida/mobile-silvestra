import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async () => {
    // Validações
    if (!newPassword || !confirmPassword) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Erro", "A senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3000/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Sucesso", "Senha alterada com sucesso!", [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)" as any),
          },
        ]);
      } else {
        Alert.alert("Erro", data.message || "Não foi possível alterar a senha");
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível conectar ao servidor");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Nova senha</Text>
          <Text style={styles.subtitle}>
            Digite sua nova senha e confirme para continuar
          </Text>
        </View>

        {/* Input Nova Senha */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nova senha"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
          </TouchableOpacity>
        </View>

        {/* Input Confirmar Senha */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Confirmar senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Text style={styles.eyeIcon}>
              {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Requisitos de Senha */}
        <View style={styles.requirements}>
          <Text style={styles.requirementsText}>• Mínimo 6 caracteres</Text>
          <Text
            style={[
              styles.requirementsText,
              newPassword === confirmPassword &&
                newPassword.length > 0 &&
                styles.requirementMet,
            ]}
          >
            • Senhas devem coincidir
          </Text>
        </View>

        {/* Botão Redefinir */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Redefinir senha</Text>
          )}
        </TouchableOpacity>

        {/* Link Voltar */}
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#572363",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 24,
  },
  inputContainer: {
    position: "relative",
    marginBottom: 16,
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 50,
    fontSize: 16,
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 4,
  },
  eyeIcon: {
    fontSize: 20,
  },
  requirements: {
    marginBottom: 24,
  },
  requirementsText: {
    fontSize: 14,
    color: "#999999",
    marginBottom: 4,
  },
  requirementMet: {
    color: "#4CAF50",
  },
  button: {
    height: 56,
    backgroundColor: "#572363",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  backLink: {
    alignItems: "center",
  },
  backLinkText: {
    color: "#666666",
    fontSize: 14,
  },
});
