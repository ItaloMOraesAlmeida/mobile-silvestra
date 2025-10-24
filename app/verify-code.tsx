import React, { useState, useRef } from "react";
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
import { useRouter } from "expo-router";

export default function VerifyCodeScreen() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    // Aceitar apenas números
    if (!/^\d*$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Avançar para próximo input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Voltar para input anterior ao pressionar backspace
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const fullCode = code.join("");

    if (fullCode.length !== 6) {
      Alert.alert("Erro", "Por favor, insira o código completo de 6 dígitos");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3000/auth/verify-reset-code",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: fullCode }),
        }
      );

      const data = await response.json();

      if (response.ok && data.valid) {
        // Código válido, redirecionar para tela de nova senha
        router.push({
          pathname: "/reset-password" as any,
          params: { code: fullCode },
        });
      } else {
        Alert.alert("Erro", data.message || "Código inválido ou expirado");
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível verificar o código");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    Alert.alert(
      "Reenviar código",
      "Você precisará informar seu email/CPF novamente",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Digite o código</Text>
          <Text style={styles.subtitle}>
            Enviamos um código de 6 dígitos para seu email
          </Text>
        </View>

        {/* Inputs do Código */}
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={styles.codeInput}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={({ nativeEvent: { key } }) =>
                handleKeyPress(key, index)
              }
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!loading}
            />
          ))}
        </View>

        {/* Botão Verificar */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Verificar código</Text>
          )}
        </TouchableOpacity>

        {/* Link Reenviar Código */}
        <TouchableOpacity style={styles.resendLink} onPress={handleResendCode}>
          <Text style={styles.resendLinkText}>
            Não recebeu o código? Reenviar
          </Text>
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
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#572363",
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
  resendLink: {
    alignItems: "center",
    marginBottom: 16,
  },
  resendLinkText: {
    color: "#572363",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  backLink: {
    alignItems: "center",
  },
  backLinkText: {
    color: "#666666",
    fontSize: 14,
  },
});
