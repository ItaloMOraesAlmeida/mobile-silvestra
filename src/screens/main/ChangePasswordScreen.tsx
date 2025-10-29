import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { lightTheme } from "../../theme";
import { api } from "../../services/api.service";
import Toast from "react-native-toast-message";
import { BiometricService } from "../../services/biometric";

export function ChangePasswordScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState<"verify" | "code" | "password">("verify");
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  React.useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const available = await BiometricService.isAvailable();
    setBiometricAvailable(available);
  };

  const handleBiometricVerification = async () => {
    setIsLoading(true);
    try {
      const isAuthenticated = await BiometricService.authenticate(
        "Confirme sua identidade para alterar a senha"
      );

      if (isAuthenticated) {
        // Se autenticou com biometria, pula direto para a tela de senha
        setStep("password");
        Toast.show({
          type: "success",
          text1: "Autenticado",
          text2: "Agora defina sua nova senha",
          position: "top",
          visibilityTime: 3000,
        });
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Falha na autenticação biométrica",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailVerification = async () => {
    await requestCode();
  };

  const requestCode = async () => {
    setIsLoading(true);
    try {
      await api.post("/auth/request-password-change");
      setStep("code");
      Toast.show({
        type: "success",
        text1: "Código Enviado",
        text2: "Verifique seu email",
        position: "top",
        visibilityTime: 3000,
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2:
          error.response?.data?.message || "Não foi possível enviar o código",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      Toast.show({
        type: "error",
        text1: "Código Inválido",
        text2: "O código deve ter 6 dígitos",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    setStep("password");
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      Toast.show({
        type: "error",
        text1: "Senha Inválida",
        text2: "A senha deve ter no mínimo 6 caracteres",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Senhas não Coincidem",
        text2: "As senhas devem ser iguais",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/change-password", {
        code,
        newPassword,
        confirmPassword,
      });

      Toast.show({
        type: "success",
        text1: "Sucesso!",
        text2: "Senha alterada com sucesso",
        position: "top",
        visibilityTime: 3000,
      });

      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2:
          error.response?.data?.message || "Não foi possível alterar a senha",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderVerifyStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons
          name="shield-checkmark"
          size={64}
          color={lightTheme.colors.primary}
        />
      </View>

      <Text style={styles.title}>Verificação de Identidade</Text>
      <Text style={styles.subtitle}>
        Para alterar sua senha, precisamos verificar sua identidade
      </Text>

      {biometricAvailable && (
        <>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleBiometricVerification}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator color={lightTheme.colors.white} />
            ) : (
              <>
                <Ionicons
                  name="finger-print"
                  size={24}
                  color={lightTheme.colors.white}
                />
                <Text style={styles.primaryButtonText}>Usar Biometria</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>
        </>
      )}

      <TouchableOpacity
        style={
          biometricAvailable ? styles.secondaryButton : styles.primaryButton
        }
        onPress={handleEmailVerification}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator
            color={
              biometricAvailable
                ? lightTheme.colors.primary
                : lightTheme.colors.white
            }
          />
        ) : (
          <>
            <Ionicons
              name="mail"
              size={24}
              color={
                biometricAvailable
                  ? lightTheme.colors.primary
                  : lightTheme.colors.white
              }
            />
            <Text
              style={
                biometricAvailable
                  ? styles.secondaryButtonText
                  : styles.primaryButtonText
              }
            >
              Enviar Código por Email
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderCodeStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons
          name="mail-open"
          size={64}
          color={lightTheme.colors.primary}
        />
      </View>

      <Text style={styles.title}>Digite o Código</Text>
      <Text style={styles.subtitle}>
        Enviamos um código de 6 dígitos para seu email
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.codeInput}
          value={code}
          onChangeText={setCode}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
          autoFocus
        />
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          code.length !== 6 && styles.disabledButton,
        ]}
        onPress={handleVerifyCode}
        disabled={code.length !== 6 || isLoading}
        activeOpacity={0.7}
      >
        <Text style={styles.primaryButtonText}>Continuar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={requestCode} disabled={isLoading}>
        <Text style={styles.linkText}>Reenviar código</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPasswordStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons
          name="lock-closed"
          size={64}
          color={lightTheme.colors.primary}
        />
      </View>

      <Text style={styles.title}>Nova Senha</Text>
      <Text style={styles.subtitle}>Digite sua nova senha</Text>

      <View style={styles.inputContainer}>
        <View style={styles.passwordInputContainer}>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Nova senha"
            secureTextEntry={!showNewPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setShowNewPassword(!showNewPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showNewPassword ? "eye-off" : "eye"}
              size={24}
              color={lightTheme.colors.gray[400]}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.passwordInputContainer}>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirmar senha"
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off" : "eye"}
              size={24}
              color={lightTheme.colors.gray[400]}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (!newPassword || !confirmPassword) && styles.disabledButton,
        ]}
        onPress={handleChangePassword}
        disabled={!newPassword || !confirmPassword || isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator color={lightTheme.colors.white} />
        ) : (
          <Text style={styles.primaryButtonText}>Alterar Senha</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressDot,
            step === "verify" && styles.progressDotActive,
          ]}
        />
        <View
          style={[
            styles.progressDot,
            step === "code" && styles.progressDotActive,
          ]}
        />
        <View
          style={[
            styles.progressDot,
            step === "password" && styles.progressDotActive,
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === "verify" && renderVerifyStep()}
        {step === "code" && renderCodeStep()}
        {step === "password" && renderPasswordStep()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.white,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: lightTheme.spacing.lg,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: lightTheme.colors.gray[300],
  },
  progressDotActive: {
    backgroundColor: lightTheme.colors.primary,
    width: 24,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: lightTheme.spacing.xl,
    paddingBottom: lightTheme.spacing.xl,
  },
  stepContainer: {
    flex: 1,
    justifyContent: "center",
  },
  iconContainer: {
    alignSelf: "center",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${lightTheme.colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: lightTheme.spacing.xl,
  },
  title: {
    fontSize: lightTheme.typography.fontSize["2xl"],
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[900],
    textAlign: "center",
    marginBottom: lightTheme.spacing.sm,
  },
  subtitle: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
    marginBottom: lightTheme.spacing.xl * 2,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: lightTheme.spacing.xl,
  },
  codeInput: {
    fontSize: 32,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    letterSpacing: 8,
    color: lightTheme.colors.gray[900],
    borderWidth: 2,
    borderColor: lightTheme.colors.gray[300],
    borderRadius: lightTheme.borderRadius.lg,
    paddingVertical: lightTheme.spacing.lg,
    backgroundColor: lightTheme.colors.gray[50],
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    borderRadius: lightTheme.borderRadius.lg,
    marginBottom: lightTheme.spacing.md,
    backgroundColor: lightTheme.colors.white,
  },
  input: {
    flex: 1,
    paddingHorizontal: lightTheme.spacing.lg,
    paddingVertical: lightTheme.spacing.md + 2,
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[900],
  },
  eyeIcon: {
    padding: lightTheme.spacing.md,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: lightTheme.colors.primary,
    paddingVertical: lightTheme.spacing.lg,
    borderRadius: lightTheme.borderRadius.lg,
    marginBottom: lightTheme.spacing.md,
    gap: lightTheme.spacing.sm,
  },
  primaryButtonText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.white,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: lightTheme.colors.gray[100],
    paddingVertical: lightTheme.spacing.lg,
    borderRadius: lightTheme.borderRadius.lg,
    gap: lightTheme.spacing.sm,
  },
  secondaryButtonText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: lightTheme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: lightTheme.colors.gray[300],
  },
  dividerText: {
    marginHorizontal: lightTheme.spacing.md,
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
  },
  linkText: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.primary,
    textAlign: "center",
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
  },
});
