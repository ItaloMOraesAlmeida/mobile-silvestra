/**
 * Tela de Definir Senha - Paciente
 * Permite que o paciente defina sua senha após validar o código de acesso
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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { lightTheme } from "../../theme";
import { api } from "../../services/api";
import { BiometricService } from "../../services/biometric";
import { BiometricAuthService } from "../../services/biometric-auth";
import { BiometricPromptModal } from "../../components/BiometricPromptModal";
import { useAuthStore } from "../../stores/auth.store";

interface Props {
  navigation: any;
  route: {
    params: {
      patientData: {
        id: string;
        name: string;
        email: string;
        phone?: string;
      };
      nutritionistData?: {
        id: string;
        name: string;
        email: string;
        phone?: string;
        avatarUrl?: string;
        crn?: string;
        specialization?: string;
      };
      accessCode: string;
    };
  };
}

export function PatientSetPasswordScreen({ navigation, route }: Props) {
  const { patientData, nutritionistData, accessCode } = route.params;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para biometria
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [biometricType, setBiometricType] = useState("");
  const [pendingAuth, setPendingAuth] = useState<{
    email: string;
    accessToken: string;
    refreshToken: string;
  } | null>(null);

  // Validação de senha
  const validatePassword = (
    pwd: string
  ): { valid: boolean; message?: string } => {
    if (pwd.length < 6) {
      return {
        valid: false,
        message: "A senha deve ter no mínimo 6 caracteres",
      };
    }
    if (!/[A-Z]/.test(pwd)) {
      return {
        valid: false,
        message: "A senha deve conter pelo menos uma letra maiúscula",
      };
    }
    if (!/[0-9]/.test(pwd)) {
      return {
        valid: false,
        message: "A senha deve conter pelo menos um número",
      };
    }
    return { valid: true };
  };

  const handleSubmit = async () => {
    // Validações
    if (!password || !confirmPassword) {
      setError("Preencha todos os campos");
      return;
    }

    const validation = validatePassword(password);
    if (!validation.valid) {
      setError(validation.message || "Senha inválida");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Envia senha para o backend e recebe tokens de autenticação
      const response = await api.post("/auth/complete-patient-registration", {
        accessCode,
        password,
      });

      const { accessToken, refreshToken, user } = response.data;

      // Verifica se biometria está disponível
      const biometricAvailable = await BiometricService.isAvailable();

      if (biometricAvailable) {
        const biometricType = await BiometricService.getBiometricName();

        // Salva dados para biometria e exibe modal
        setPendingAuth({
          email: user.email || patientData.email,
          accessToken,
          refreshToken,
        });
        setBiometricType(biometricType);
        setShowBiometricPrompt(true);
      } else {
        // Se biometria não está disponível, completa a autenticação direto
        const { skipBiometricSetup } = useAuthStore.getState();
        skipBiometricSetup();

        Toast.show({
          type: "success",
          text1: "Cadastro Completo!",
          text2: "Bem-vindo ao Silvestra!",
          position: "top",
          visibilityTime: 3000,
          topOffset: 60,
        });

        // Redireciona para tela principal
        navigation.reset({ index: 0, routes: [{ name: "Main" } as any] });
      }
    } catch (err: any) {
      console.error("Erro ao definir senha:", err);
      setError(
        err?.response?.data?.message ||
          "Erro ao definir senha. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricAccept = async () => {
    try {
      if (pendingAuth) {
        // Salva os tokens para autenticação biométrica
        await BiometricAuthService.saveBiometricCredentials(
          pendingAuth.email,
          pendingAuth.accessToken,
          pendingAuth.refreshToken
        );
      }

      // Fecha o modal
      setShowBiometricPrompt(false);
      setPendingAuth(null);

      // Marca como autenticado e redireciona para Main
      const { completeBiometricSetup } = useAuthStore.getState();
      completeBiometricSetup();

      Toast.show({
        type: "success",
        text1: "Biometria Habilitada!",
        text2: "Agora você pode entrar usando sua biometria.",
        position: "top",
        visibilityTime: 3000,
        topOffset: 60,
      });

      navigation.reset({ index: 0, routes: [{ name: "Main" } as any] });
    } catch {
      Toast.show({
        type: "error",
        text1: "Erro ao Habilitar Biometria",
        text2: "Não foi possível configurar a biometria. Tente novamente.",
        position: "top",
        visibilityTime: 4000,
        topOffset: 60,
      });
    }
  };

  const handleBiometricDecline = () => {
    // Usuário optou por não usar biometria
    setShowBiometricPrompt(false);
    setPendingAuth(null);

    // Pula setup de biometria
    const { skipBiometricSetup } = useAuthStore.getState();
    skipBiometricSetup();

    Toast.show({
      type: "success",
      text1: "Cadastro Completo!",
      text2: "Bem-vindo ao Silvestra!",
      position: "top",
      visibilityTime: 3000,
      topOffset: 60,
    });

    // Redireciona para tela principal
    navigation.reset({ index: 0, routes: [{ name: "Main" } as any] });
  };

  // Indicadores de força da senha
  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const strength = getPasswordStrength(password);
  const strengthColor =
    strength < 2
      ? lightTheme.colors.error
      : strength < 4
      ? "#F59E0B"
      : lightTheme.colors.success;

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
            <View style={styles.iconContainer}>
              <Ionicons
                name="shield-checkmark"
                size={48}
                color={lightTheme.colors.primary}
              />
            </View>
            <Text style={styles.title}>Defina sua Senha</Text>
            <Text style={styles.subtitle}>
              Confirme seus dados e crie uma senha segura para acessar o
              aplicativo.
            </Text>
          </View>

          {/* Card de Dados do Paciente */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="person"
                size={22}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.cardTitle}>Seus Dados</Text>
            </View>

            <View style={styles.dataRow}>
              <Ionicons
                name="person-outline"
                size={18}
                color={lightTheme.colors.gray[600]}
              />
              <Text style={styles.dataLabel}>Nome:</Text>
              <Text style={styles.dataValue}>{patientData.name}</Text>
            </View>

            <View style={styles.dataRow}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={lightTheme.colors.gray[600]}
              />
              <Text style={styles.dataLabel}>E-mail:</Text>
              <Text style={styles.dataValue}>{patientData.email}</Text>
            </View>

            {patientData.phone && (
              <View style={styles.dataRow}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={lightTheme.colors.gray[600]}
                />
                <Text style={styles.dataLabel}>Telefone:</Text>
                <Text style={styles.dataValue}>{patientData.phone}</Text>
              </View>
            )}

            <View style={styles.confirmMessage}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={lightTheme.colors.success}
              />
              <Text style={styles.confirmText}>
                Verifique se os dados estão corretos antes de continuar.
              </Text>
            </View>
          </View>

          {/* Card do Nutricionista */}
          {nutritionistData && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons
                  name="medical"
                  size={22}
                  color={lightTheme.colors.primary}
                />
                <Text style={styles.cardTitle}>Seu Nutricionista</Text>
              </View>

              <View style={styles.nutritionistCard}>
                <View style={styles.avatarContainer}>
                  {nutritionistData.avatarUrl ? (
                    <Image
                      source={{ uri: nutritionistData.avatarUrl }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons
                        name="person"
                        size={32}
                        color={lightTheme.colors.primary}
                      />
                    </View>
                  )}
                </View>

                <View style={styles.nutritionistInfo}>
                  <Text style={styles.nutritionistName}>
                    {nutritionistData.name}
                  </Text>
                  {nutritionistData.specialization && (
                    <Text style={styles.nutritionistSpecialization}>
                      {nutritionistData.specialization}
                    </Text>
                  )}
                  {nutritionistData.crn && (
                    <View style={styles.crnBadge}>
                      <Ionicons
                        name="ribbon"
                        size={14}
                        color={lightTheme.colors.primary}
                      />
                      <Text style={styles.crnText}>
                        CRN: {nutritionistData.crn}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.contactInfo}>
                {nutritionistData.email && (
                  <View style={styles.contactRow}>
                    <Ionicons
                      name="mail-outline"
                      size={16}
                      color={lightTheme.colors.gray[600]}
                    />
                    <Text style={styles.contactText}>
                      {nutritionistData.email}
                    </Text>
                  </View>
                )}
                {nutritionistData.phone && (
                  <View style={styles.contactRow}>
                    <Ionicons
                      name="call-outline"
                      size={16}
                      color={lightTheme.colors.gray[600]}
                    />
                    <Text style={styles.contactText}>
                      {nutritionistData.phone}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Card de Senha */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="lock-closed"
                size={22}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.cardTitle}>Criar Senha</Text>
            </View>

            {/* Campo de Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Senha</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={lightTheme.colors.gray[400]}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Digite sua senha"
                  placeholderTextColor={lightTheme.colors.gray[400]}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError(null);
                  }}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={lightTheme.colors.gray[500]}
                  />
                </TouchableOpacity>
              </View>

              {/* Indicador de Força */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.strengthSegment,
                          level <= strength && {
                            backgroundColor: strengthColor,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthText, { color: strengthColor }]}>
                    {strength < 2 ? "Fraca" : strength < 4 ? "Média" : "Forte"}
                  </Text>
                </View>
              )}
            </View>

            {/* Campo de Confirmar Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirmar Senha</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={lightTheme.colors.gray[400]}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Digite sua senha novamente"
                  placeholderTextColor={lightTheme.colors.gray[400]}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setError(null);
                  }}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={22}
                    color={lightTheme.colors.gray[500]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Requisitos de Senha */}
            <View style={styles.requirementsBox}>
              <Text style={styles.requirementsTitle}>A senha deve conter:</Text>
              <View style={styles.requirement}>
                <Ionicons
                  name={
                    password.length >= 6
                      ? "checkmark-circle"
                      : "ellipse-outline"
                  }
                  size={16}
                  color={
                    password.length >= 6
                      ? lightTheme.colors.success
                      : lightTheme.colors.gray[400]
                  }
                />
                <Text style={styles.requirementText}>
                  Mínimo de 6 caracteres
                </Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={
                    /[A-Z]/.test(password)
                      ? "checkmark-circle"
                      : "ellipse-outline"
                  }
                  size={16}
                  color={
                    /[A-Z]/.test(password)
                      ? lightTheme.colors.success
                      : lightTheme.colors.gray[400]
                  }
                />
                <Text style={styles.requirementText}>Uma letra maiúscula</Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={
                    /[0-9]/.test(password)
                      ? "checkmark-circle"
                      : "ellipse-outline"
                  }
                  size={16}
                  color={
                    /[0-9]/.test(password)
                      ? lightTheme.colors.success
                      : lightTheme.colors.gray[400]
                  }
                />
                <Text style={styles.requirementText}>Um número</Text>
              </View>
            </View>

            {/* Mensagem de Erro */}
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

            {/* Botão de Confirmar */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (loading || !password || !confirmPassword) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading || !password || !confirmPassword}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={lightTheme.colors.white} />
              ) : (
                <>
                  <Text style={styles.submitText}>Confirmar Senha</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={lightTheme.colors.white}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Biometria */}
      <BiometricPromptModal
        visible={showBiometricPrompt}
        biometricType={biometricType}
        onAccept={handleBiometricAccept}
        onDecline={handleBiometricDecline}
      />
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
    padding: lightTheme.spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: lightTheme.spacing.xl,
    marginTop: lightTheme.spacing.lg,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${lightTheme.colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: lightTheme.spacing.md,
  },
  title: {
    fontSize: lightTheme.typography.fontSize["2xl"],
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
    padding: lightTheme.spacing.lg,
    marginBottom: lightTheme.spacing.lg,
    ...lightTheme.shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: lightTheme.spacing.md,
    gap: lightTheme.spacing.sm,
  },
  cardTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[800],
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: lightTheme.spacing.sm,
    gap: lightTheme.spacing.sm,
  },
  dataLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[600],
  },
  dataValue: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[900],
  },
  confirmMessage: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${lightTheme.colors.success}10`,
    padding: lightTheme.spacing.sm,
    borderRadius: lightTheme.borderRadius.md,
    marginTop: lightTheme.spacing.md,
    gap: lightTheme.spacing.sm,
  },
  confirmText: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[700],
  },
  inputGroup: {
    marginBottom: lightTheme.spacing.md,
  },
  inputLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[700],
    marginBottom: lightTheme.spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: lightTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    paddingHorizontal: lightTheme.spacing.md,
  },
  inputIcon: {
    marginRight: lightTheme.spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[900],
  },
  eyeIcon: {
    padding: lightTheme.spacing.sm,
  },
  strengthContainer: {
    marginTop: lightTheme.spacing.sm,
  },
  strengthBar: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    backgroundColor: lightTheme.colors.gray[200],
    borderRadius: 2,
  },
  strengthText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
  },
  requirementsBox: {
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: lightTheme.borderRadius.md,
    padding: lightTheme.spacing.md,
    marginTop: lightTheme.spacing.sm,
  },
  requirementsTitle: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[700],
    marginBottom: lightTheme.spacing.xs,
  },
  requirement: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: lightTheme.spacing.xs,
    gap: lightTheme.spacing.xs,
  },
  requirementText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
  },
  errorMessage: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${lightTheme.colors.error}10`,
    padding: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.md,
    marginTop: lightTheme.spacing.md,
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
    marginTop: lightTheme.spacing.lg,
    gap: lightTheme.spacing.sm,
    ...lightTheme.shadows.md,
  },
  submitButtonDisabled: {
    backgroundColor: lightTheme.colors.gray[400],
    opacity: 0.5,
    ...lightTheme.shadows.none,
  },
  submitText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
  },
  // Estilos do Card do Nutricionista
  nutritionistCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: lightTheme.spacing.md,
    gap: lightTheme.spacing.md,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: `${lightTheme.colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  nutritionistInfo: {
    flex: 1,
  },
  nutritionistName: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[900],
    marginBottom: 2,
  },
  nutritionistSpecialization: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing.xs,
  },
  crnBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${lightTheme.colors.primary}10`,
    paddingHorizontal: lightTheme.spacing.sm,
    paddingVertical: 4,
    borderRadius: lightTheme.borderRadius.md,
    alignSelf: "flex-start",
    gap: 4,
    marginTop: 4,
  },
  crnText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.primary,
  },
  contactInfo: {
    marginTop: lightTheme.spacing.sm,
    paddingTop: lightTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[100],
    gap: lightTheme.spacing.sm,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.sm,
  },
  contactText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[700],
  },
});
