/**
 * Tela de Login com Código de Acesso - Paciente
 * Permite que pacientes façam login usando o código fornecido pelo nutricionista
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";
import { api } from "../../services/api";
import {
  formatAccessCode,
  validateAccessCodeFormat,
} from "../../utils/access-code.utils";

interface Props {
  navigation: any;
}

export function PatientCodeLoginScreen({ navigation }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCodeChange = (text: string) => {
    // Formata automaticamente o código enquanto digita
    const formatted = formatAccessCode(text);
    setCode(formatted);
    setError(null);
  };

  const handleSubmit = async () => {
    // Valida formato
    if (!validateAccessCodeFormat(code)) {
      setError("Código inválido. Use o formato: XXXX-XXXX");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Valida código no backend
      const response = await api.post("/auth/validate-access-code", {
        accessCode: code.replace("-", ""),
      });

      const { patient, nutritionist, hasPassword } = response.data;

      if (!patient) {
        setError("Código de acesso não encontrado.");
        return;
      }

      // Se já tem senha, redireciona para login normal
      if (hasPassword) {
        setError("Este paciente já completou o cadastro. Use o login normal.");
        setTimeout(() => {
          navigation.navigate("Login");
        }, 2000);
        return;
      }

      // Redireciona para tela de definir senha
      navigation.navigate("PatientSetPassword", {
        patientData: patient,
        nutritionistData: nutritionist,
        accessCode: code.replace("-", ""),
      });
    } catch (err: any) {
      console.error("Erro ao validar código:", err);
      setError(
        err?.response?.data?.message ||
          "Erro ao validar código. Verifique e tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons
                name="key"
                size={64}
                color={lightTheme.colors.primary}
              />
            </View>
            <Text style={styles.title}>Bem-vindo ao Silvestra</Text>
            <Text style={styles.subtitle}>
              Digite o código de acesso fornecido pelo seu nutricionista para
              completar seu cadastro.
            </Text>
          </View>

          {/* Card de Entrada de Código */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="shield-checkmark"
                size={24}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.cardTitle}>Código de Acesso</Text>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="key-outline"
                size={22}
                color={lightTheme.colors.gray[400]}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="XXXX-XXXX"
                placeholderTextColor={lightTheme.colors.gray[400]}
                value={code}
                onChangeText={handleCodeChange}
                maxLength={9} // 8 caracteres + 1 hífen
                autoCapitalize="characters"
                autoCorrect={false}
                keyboardType="default"
              />
            </View>

            {/* Mensagem de erro */}
            {error && (
              <View style={styles.errorMessage}>
                <Ionicons
                  name="alert-circle"
                  size={18}
                  color={lightTheme.colors.error}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Botão de Continuar */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (loading || code.length < 9) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading || code.length < 9}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={lightTheme.colors.white} />
              ) : (
                <>
                  <Text style={styles.submitText}>Continuar</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={lightTheme.colors.white}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Informações Adicionais */}
          <View style={styles.infoCard}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={lightTheme.colors.primary}
            />
            <Text style={styles.infoText}>
              O código de acesso é fornecido pelo seu nutricionista no momento
              do cadastro. Entre em contato caso não tenha recebido.
            </Text>
          </View>

          {/* Link para Login Normal */}
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.7}
          >
            <Text style={styles.loginLinkText}>
              Já completou o cadastro?{" "}
              <Text style={styles.loginLinkBold}>Fazer Login</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: lightTheme.spacing.xl,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: lightTheme.spacing.xl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${lightTheme.colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: lightTheme.spacing.lg,
  },
  title: {
    fontSize: lightTheme.typography.fontSize["3xl"],
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: lightTheme.spacing.md,
  },
  card: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing.xl,
    marginBottom: lightTheme.spacing.lg,
    ...lightTheme.shadows.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: lightTheme.spacing.lg,
    gap: lightTheme.spacing.sm,
  },
  cardTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[800],
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: lightTheme.borderRadius.lg,
    borderWidth: 2,
    borderColor: lightTheme.colors.gray[200],
    paddingHorizontal: lightTheme.spacing.md,
    marginBottom: lightTheme.spacing.md,
  },
  inputIcon: {
    marginRight: lightTheme.spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[900],
    letterSpacing: 4,
    textAlign: "center",
  },
  errorMessage: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${lightTheme.colors.error}10`,
    padding: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.md,
    marginBottom: lightTheme.spacing.md,
    gap: lightTheme.spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.error,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: lightTheme.colors.primary,
    paddingVertical: 16,
    borderRadius: lightTheme.borderRadius.lg,
    gap: lightTheme.spacing.sm,
    ...lightTheme.shadows.sm,
  },
  submitButtonDisabled: {
    backgroundColor: lightTheme.colors.gray[300],
    opacity: 0.6,
  },
  submitText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: `${lightTheme.colors.primary}10`,
    padding: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.lg,
    gap: lightTheme.spacing.sm,
    marginBottom: lightTheme.spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[700],
    lineHeight: 20,
  },
  loginLink: {
    paddingVertical: lightTheme.spacing.md,
    alignItems: "center",
  },
  loginLinkText: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[600],
  },
  loginLinkBold: {
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.primary,
  },
});
