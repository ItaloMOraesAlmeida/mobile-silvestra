import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Keyboard,
} from "react-native";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BiometricService } from "../../services/biometric";
import { BiometricPromptModal } from "../../components/BiometricPromptModal";
import { BiometricAuthService } from "../../services/biometric-auth";
import { useAuthStore } from "../../stores/auth.store";

const loginSchema = z
  .object({
    email: z.string().optional().or(z.literal("")),
    password: z.string().optional().or(z.literal("")),
    accessCode: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    // Se código de acesso foi fornecido, valida apenas ele
    if (data.accessCode && data.accessCode.length > 0) {
      if (!/^\d{6}$/.test(data.accessCode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Código deve ter 6 dígitos",
          path: ["accessCode"],
        });
      }
      return;
    }

    // Caso contrário, email e senha são obrigatórios
    if (!data.email || data.email.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email é obrigatório",
        path: ["email"],
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email inválido",
        path: ["email"],
      });
    }

    if (!data.password || data.password.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Senha é obrigatória",
        path: ["password"],
      });
    }
  });

type LoginFormData = z.infer<typeof loginSchema>;

type LoginScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  "Login"
>;

export function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const scrollViewRef = useRef<ScrollView>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const accessCodeInputRef = useRef<TextInput>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [biometricType, setBiometricType] = useState("");
  const [pendingAuth, setPendingAuth] = useState<{
    email: string;
    accessToken: string;
    refreshToken: string;
  } | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    defaultValues: {
      email: "",
      password: "",
      accessCode: "",
    },
  });

  const emailValue = watch("email");
  const passwordValue = watch("password");
  const accessCodeValue = watch("accessCode");

  // Desabilita email/senha se accessCode preenchido
  const isEmailPasswordDisabled = accessCodeValue && accessCodeValue.length > 0;
  // Desabilita accessCode se email ou senha preenchidos
  const isAccessCodeDisabled =
    (emailValue && emailValue.length > 0) ||
    (passwordValue && passwordValue.length > 0);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Verifica se biometria está habilitada e tenta autenticar automaticamente
  // Verifica se biometria está habilitada e tenta autenticar automaticamente
  useFocusEffect(
    useCallback(() => {
      const checkBiometric = async () => {
        try {
          const result = await BiometricAuthService.authenticateWithBiometric();

          if (result.success) {
            // Autenticação bem-sucedida, tokens atualizados
            // TODO: Navegar para a tela principal
            // navigation.replace("MainApp"); // ou o nome da sua tela principal
          } else {
            // Trata os diferentes tipos de falha
            if (result.reason === "token_expired") {
              Toast.show({
                type: "warning",
                text1: "Sessão Expirada",
                text2: "Sua sessão expirou. Por favor, faça login novamente.",
                position: "top",
                visibilityTime: 5000,
                topOffset: 60,
              });
            } else if (result.reason === "biometric_failed") {
              // Autenticação biométrica falhou ou foi cancelada
            }
          }
        } catch {
          // Erro silencioso - biometria não disponível
        }
      };

      checkBiometric();
    }, [])
  );

  if (!fontsLoaded) {
    return null;
  }

  const handleInputFocus = (inputRef: React.RefObject<TextInput | null>) => {
    setTimeout(() => {
      if (inputRef.current && scrollViewRef.current) {
        inputRef.current.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            // Altura visível da tela quando o teclado está aberto (aproximadamente)
            const visibleScreenHeight = 380;
            const inputHeight = 60;
            const spacing = 20; // Espaço mínimo entre input e teclado

            // Posição onde o input deveria ficar (logo acima do teclado)
            const idealPosition = visibleScreenHeight - inputHeight - spacing;

            // Se o input está abaixo da posição ideal, rola apenas o necessário
            if (y > idealPosition) {
              const scrollAmount = y - idealPosition;

              scrollViewRef.current?.scrollTo({
                y: scrollAmount,
                animated: true,
              });
            }
            // Se o input já está visível, não faz nada
          },
          () => {}
        );
      }
    }, 100);
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      const { login } = useAuthStore.getState();

      // Faz login usando o store (que já salva os tokens)
      await login(data.email || "", data.password || "");

      // Obtém os tokens salvos pelo login
      const { tokens, user } = useAuthStore.getState();

      if (!tokens || !user) {
        throw new Error("Erro ao obter tokens após login");
      }

      // Verifica se biometria está disponível no dispositivo
      const biometricAvailable = await BiometricService.isAvailable();

      if (biometricAvailable) {
        // Obtém o nome da biometria (Face ID, Touch ID, Digital)
        const biometricType = await BiometricService.getBiometricName();

        // Armazena os dados temporariamente para salvar caso o usuário aceite
        setPendingAuth({
          email: user.email,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
        setBiometricType(biometricType);
        setShowBiometricPrompt(true);
      } else {
        // Se biometria não está disponível, navega direto para o app
        Toast.show({
          type: "success",
          text1: "Login Realizado!",
          text2: "Bem-vindo de volta!",
          position: "top",
          visibilityTime: 3000,
          topOffset: 60,
        });
        // TODO: Navegar para a tela principal
        // navigation.replace("MainApp"); // ou o nome da sua tela principal
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro no Login",
        text2:
          error.message ||
          "Credenciais inválidas. Verifique seus dados e tente novamente.",
        position: "top",
        visibilityTime: 4000,
        topOffset: 60,
      });
    }
  };

  const handleBiometricAccept = async () => {
    try {
      if (pendingAuth) {
        // Salva os tokens (access + refresh) para autenticação biométrica
        await BiometricAuthService.saveBiometricCredentials(
          pendingAuth.email,
          pendingAuth.accessToken,
          pendingAuth.refreshToken
        );
      }

      // Fecha o modal
      setShowBiometricPrompt(false);
      setPendingAuth(null);

      Toast.show({
        type: "success",
        text1: "Biometria Habilitada!",
        text2: "Agora você pode entrar usando sua biometria.",
        position: "top",
        visibilityTime: 3000,
        topOffset: 60,
      });

      // TODO: Navegar para a tela principal
      // navigation.replace("MainApp"); // ou o nome da sua tela principal
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

    Toast.show({
      type: "info",
      text1: "Login Realizado!",
      text2: "Você pode habilitar a biometria depois nas configurações.",
      position: "top",
      visibilityTime: 3000,
      topOffset: 60,
    });

    // TODO: Navegar para a tela principal
    // navigation.replace("MainApp"); // ou o nome da sua tela principal
  };

  const handleGoogleLogin = () => {
    // TODO: Implementar login com Google
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#8b5a9f", "#572363", "#3d1a4a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={[
              styles.scrollContent,
              keyboardHeight > 0 && { paddingBottom: 30 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Image
                source={require("../../../assets/images/SilvestraLogo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.appName}>Silvestra</Text>
              <Text style={styles.subtitle}>
                Sua jornada para uma vida mais saudável
              </Text>
            </View>

            {/* Form Container */}
            <View style={styles.formContainer}>
              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "email" && styles.inputFocused,
                    errors.email && styles.inputError,
                    isEmailPasswordDisabled && styles.inputDisabled,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={
                      isEmailPasswordDisabled
                        ? "rgba(255, 255, 255, 0.3)"
                        : focusedInput === "email"
                        ? "#FFFFFF"
                        : "rgba(255, 255, 255, 0.6)"
                    }
                  />
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        ref={emailInputRef}
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={value}
                        onChangeText={onChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        editable={!isEmailPasswordDisabled}
                        onFocus={() => {
                          setFocusedInput("email");
                          handleInputFocus(emailInputRef);
                        }}
                        onBlur={() => setFocusedInput(null)}
                      />
                    )}
                  />
                </View>
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email.message}</Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "password" && styles.inputFocused,
                    errors.password && styles.inputError,
                    isEmailPasswordDisabled && styles.inputDisabled,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={
                      isEmailPasswordDisabled
                        ? "rgba(255, 255, 255, 0.3)"
                        : focusedInput === "password"
                        ? "#FFFFFF"
                        : "rgba(255, 255, 255, 0.6)"
                    }
                  />
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        ref={passwordInputRef}
                        style={styles.input}
                        placeholder="Senha"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={value}
                        onChangeText={onChange}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete="password"
                        editable={!isEmailPasswordDisabled}
                        onFocus={() => {
                          setFocusedInput("password");
                          handleInputFocus(passwordInputRef);
                        }}
                        onBlur={() => setFocusedInput(null)}
                      />
                    )}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="rgba(255, 255, 255, 0.6)"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>
                    {errors.password.message}
                  </Text>
                )}
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => navigation.navigate("ForgotPassword")}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
              </TouchableOpacity>

              {/* Access Code */}
              {/* Access Code Input */}
              <View style={styles.inputWrapper}>
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "accessCode" && styles.inputFocused,
                    errors.accessCode && styles.inputError,
                    isAccessCodeDisabled && styles.inputDisabled,
                  ]}
                >
                  <Ionicons
                    name="key-outline"
                    size={20}
                    color={
                      isAccessCodeDisabled
                        ? "rgba(255, 255, 255, 0.3)"
                        : focusedInput === "accessCode"
                        ? "#FFFFFF"
                        : "rgba(255, 255, 255, 0.6)"
                    }
                  />
                  <Controller
                    control={control}
                    name="accessCode"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        ref={accessCodeInputRef}
                        style={styles.input}
                        placeholder="Código de acesso (opcional)"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={value}
                        onChangeText={onChange}
                        keyboardType="numeric"
                        maxLength={6}
                        autoCapitalize="none"
                        editable={!isAccessCodeDisabled}
                        onFocus={() => {
                          setFocusedInput("accessCode");
                          handleInputFocus(accessCodeInputRef);
                        }}
                        onBlur={() => setFocusedInput(null)}
                      />
                    )}
                  />
                </View>
                {errors.accessCode ? (
                  <Text style={styles.errorText}>
                    {errors.accessCode.message}
                  </Text>
                ) : (
                  <Text style={styles.accessCodeHint}>
                    Use o código fornecido pelo seu nutricionista
                  </Text>
                )}
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleSubmit(onSubmit)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#9b6cb0", "#6b3d7a"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.loginButtonGradient}
                >
                  <Text style={styles.loginButtonText}>Entrar</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou continue com</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Button */}
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleLogin}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-google" size={20} color="#FFFFFF" />
                <Text style={styles.googleButtonText}>
                  Continuar com Google
                </Text>
              </TouchableOpacity>

              {/* Create Account */}
              <View style={styles.createAccountContainer}>
                <Text style={styles.createAccountText}>
                  Não tem uma conta?{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Register")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.createAccountLink}>Criar conta</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* Modal para perguntar se o usuário quer habilitar biometria */}
      <BiometricPromptModal
        visible={showBiometricPrompt}
        biometricType={biometricType}
        onAccept={handleBiometricAccept}
        onDecline={handleBiometricDecline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 30,
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoImage: {
    width: 280,
    height: 100,
    marginBottom: 14,
  },
  appName: {
    fontSize: 44,
    fontFamily: "Poppins_800ExtraBold",
    color: "#FFFFFF",
    letterSpacing: 3,
    marginBottom: 6,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  logo: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
  },
  inputWrapper: {
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  inputFocused: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderColor: "#e6a4f0",
    borderWidth: 2,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    marginLeft: 10,
    paddingVertical: 0,
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginBottom: 5,
    marginTop: 2,
  },
  forgotPasswordText: {
    color: "#e6a4f0",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  accessCodeWrapper: {
    marginBottom: 14,
  },
  accessCodeHint: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 4,
    marginLeft: 4,
  },
  loginButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 14,
  },
  loginButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    gap: 8,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    marginTop: 4,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  dividerText: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    marginHorizontal: 14,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 14,
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    gap: 10,
    marginBottom: 20,
  },
  googleButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 4,
  },
  createAccountContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  createAccountText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  createAccountLink: {
    color: "#e6a4f0",
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
  },
  inputError: {
    borderColor: "#ff4444",
    borderWidth: 2,
  },
  inputDisabled: {
    opacity: 0.5,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    marginTop: 4,
    marginLeft: 4,
  },
});
