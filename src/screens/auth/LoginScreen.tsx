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
  Keyboard,
  ActivityIndicator,
  Image,
} from "react-native";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
  RouteProp,
} from "@react-navigation/native";
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
import { useAuthStore } from "../../stores/auth.store";
import { BiometricService } from "../../services/biometric";
import { BiometricAuthService } from "../../services/biometric-auth";
import { BiometricPromptModal } from "../../components/BiometricPromptModal";
import { lightTheme } from "../../theme";
import { useOAuth, useClerk } from "@clerk/clerk-expo";

// Schema mínimo para login
const loginSchema = z.object({
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
  accessCode: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

type LoginScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  "Login"
>;

export function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const route = useRoute<RouteProp<AuthStackParamList, "Login">>();
  const scrollViewRef = useRef<ScrollView>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const accessCodeInputRef = useRef<TextInput>(null);

  // Hooks do Clerk para OAuth com Google
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const clerk = useClerk();

  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [biometricType, setBiometricType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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
    setValue,
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

  // Preenche o email se vier dos parâmetros da navegação
  useEffect(() => {
    if (route.params?.email) {
      setValue("email", route.params.email);
      // Foca no campo de senha após um pequeno delay
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 500);
    }
  }, [route.params?.email, setValue]);

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

  // Verifica ao carregar a tela:
  // 1. Se já está autenticado → redireciona
  // 2. Se tem biometria salva → pede biometria
  useFocusEffect(
    useCallback(() => {
      const checkAuthAndBiometric = async () => {
        try {
          const { isAuthenticated, user } = useAuthStore.getState();

          // Se já está autenticado, redireciona para a tela apropriada
          if (isAuthenticated && user) {
            // Depois da consolidação de navegadores, sempre resetamos para
            // a rota raiz `Main`. O componente responsável (`MainDrawerNavigator`)
            // decide qual tela interna renderizar com base no role do usuário.
            navigation.reset({ index: 0, routes: [{ name: "Main" } as any] });
            return;
          }

          // Se não está autenticado, verifica se tem biometria salva
          const result = await BiometricAuthService.authenticateWithBiometric();

          if (result.success) {
            // Autenticação biométrica bem-sucedida
            Toast.show({
              type: "success",
              text1: "Login com Biometria",
              text2: "Bem-vindo de volta!",
              position: "top",
              visibilityTime: 3000,
              topOffset: 60,
            });

            // Completa a autenticação e redireciona para Main
            const { completeBiometricSetup } = useAuthStore.getState();
            completeBiometricSetup();

            navigation.reset({ index: 0, routes: [{ name: "Main" } as any] });
          } else {
            // Falhou ou não tem biometria salva
            if (result.reason === "token_expired") {
              Toast.show({
                type: "warning",
                text1: "Sessão Expirada",
                text2: "Sua sessão expirou. Por favor, faça login novamente.",
                position: "top",
                visibilityTime: 5000,
                topOffset: 60,
              });
            }
            // Para outros casos (no_credentials, biometric_failed, cancelled),
            // apenas mantém na tela de login sem mostrar mensagem
          }
        } catch (error) {
          console.error("Erro ao verificar autenticação:", error);
        }
      };

      checkAuthAndBiometric();
    }, [navigation])
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
    if (isLoading) return;

    setIsLoading(true);

    try {
      const { login } = useAuthStore.getState();

      // IMPORTANTE: O login() agora retorna {user, tokens} mas NÃO define isAuthenticated = true
      // Em vez disso, define pendingBiometricSetup no store
      const { user, tokens } = await login(
        data.email || "",
        data.password || ""
      );

      // Verifica se biometria está disponível
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
        // Se biometria não está disponível, completa a autenticação direto
        const { skipBiometricSetup } = useAuthStore.getState();
        skipBiometricSetup();

        Toast.show({
          type: "success",
          text1: "Login Realizado!",
          text2: "Bem-vindo de volta!",
          position: "top",
          visibilityTime: 3000,
          topOffset: 60,
        });
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
    } finally {
      setIsLoading(false);
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

      // AGORA SIM: Marca como autenticado e redireciona para Main
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

    // AGORA SIM: Marca como autenticado (mesmo sem biometria)
    const { skipBiometricSetup } = useAuthStore.getState();
    skipBiometricSetup();

    Toast.show({
      type: "info",
      text1: "Login Realizado!",
      text2: "Você pode habilitar a biometria depois nas configurações.",
      position: "top",
      visibilityTime: 3000,
      topOffset: 60,
    });

    // Navega manualmente para a tela apropriada
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      // Normaliza para `Main` e deixa o drawer decidir a tela correta.
      navigation.reset({ index: 0, routes: [{ name: "Main" } as any] });
    }
  };

  const handleGoogleLogin = async () => {
    if (isGoogleLoading) return;

    try {
      setIsGoogleLoading(true);

      // Verifica se já existe uma sessão ativa do Clerk
      let clerkUser = clerk.user;

      if (!clerkUser) {
        // Inicia o fluxo de OAuth com Google
        const { createdSessionId, setActive } = await startOAuthFlow();

        if (createdSessionId) {
          // Ativa a sessão do Clerk
          await setActive!({ session: createdSessionId });

          // Aguarda um momento para o Clerk carregar os dados do usuário
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Busca os dados do usuário do Clerk
          clerkUser = clerk.user;
        }
      }

      // Se chegou aqui sem clerkUser, algo deu errado
      if (!clerkUser) {
        throw new Error("Usuário não encontrado após autenticação");
      }

      // Extrai os dados necessários
      const userId = clerkUser.id;
      const emailData = clerkUser.emailAddresses?.[0]?.emailAddress;
      const firstName = clerkUser.firstName || "";
      const lastName = clerkUser.lastName || "";
      const fullName =
        firstName && lastName
          ? `${firstName} ${lastName}`
          : firstName || lastName || undefined;
      const imageUrl = clerkUser.imageUrl;

      if (!userId || !emailData) {
        throw new Error("Dados do usuário incompletos");
      }

      // Sincroniza com o backend
      const { syncClerkUser } = useAuthStore.getState();
      const { needsProfileCompletion } = await syncClerkUser(
        userId,
        emailData,
        fullName,
        imageUrl
      );

      if (needsProfileCompletion) {
        // Usuário precisa completar o cadastro
        Toast.show({
          type: "info",
          text1: "Complete seu Cadastro",
          text2: "Precisamos de mais algumas informações",
          position: "top",
          visibilityTime: 3000,
          topOffset: 60,
        });
        navigation.navigate("Register", { mode: "clerk-complete" });
      } else {
        // Usuário já tem cadastro completo - verifica biometria
        const biometricAvailable = await BiometricService.isAvailable();

        if (biometricAvailable) {
          const biometricName = await BiometricService.getBiometricName();
          setBiometricType(biometricName);
          setShowBiometricPrompt(true);

          // Armazena dados para caso aceite biometria
          const { user: backendUser, tokens } = useAuthStore.getState();
          if (backendUser && tokens) {
            setPendingAuth({
              email: backendUser.email,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
            });
          }
        } else {
          // Sem biometria disponível - completa autenticação direto
          Toast.show({
            type: "success",
            text1: "Login Realizado!",
            text2: "Bem-vindo de volta!",
            position: "top",
            visibilityTime: 3000,
            topOffset: 60,
          });
        }
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro no Google Login",
        text2: error.message || "Não foi possível fazer login com Google",
        position: "top",
        visibilityTime: 4000,
        topOffset: 60,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[
          lightTheme.colors.primary,
          lightTheme.colors.primaryDark,
          lightTheme.colors.primaryDarker,
        ]}
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
                        ? lightTheme.colors.white
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
                        ? lightTheme.colors.white
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
                        ? lightTheme.colors.white
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
                style={[
                  styles.loginButton,
                  isLoading && styles.loginButtonDisabled,
                ]}
                onPress={handleSubmit(onSubmit)}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[
                    lightTheme.colors.primaryLight,
                    lightTheme.colors.primaryMedium,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.loginButtonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator
                      color={lightTheme.colors.white}
                      size="small"
                    />
                  ) : (
                    <Text style={styles.loginButtonText}>Entrar</Text>
                  )}
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
                disabled={isGoogleLoading}
                activeOpacity={0.8}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator color={lightTheme.colors.white} />
                ) : (
                  <>
                    <Ionicons
                      name="logo-google"
                      size={20}
                      color={lightTheme.colors.white}
                    />
                    <Text style={styles.googleButtonText}>
                      Continuar com Google
                    </Text>
                  </>
                )}
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
    backgroundColor: lightTheme.colors.black,
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
    paddingHorizontal:
      lightTheme.spacing.screenPaddingLarge + lightTheme.spacing.xs,
    paddingVertical:
      lightTheme.spacing.screenPaddingLarge + lightTheme.spacing.xs,
  },
  header: {
    alignItems: "center",
    marginBottom: lightTheme.spacing.lg + lightTheme.spacing.xs,
  },
  logoImage: {
    width: 280,
    height: 100,
    marginBottom: lightTheme.spacing.md - 2,
  },
  appName: {
    fontSize: lightTheme.typography.fontSize["6xl"] - 4,
    fontFamily: "Poppins_800ExtraBold",
    color: lightTheme.colors.white,
    letterSpacing: 3,
    marginBottom: lightTheme.spacing.xs + 2,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  logo: {
    fontSize: lightTheme.typography.fontSize["5xl"] + 6,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.white,
    letterSpacing: 1,
    marginBottom: lightTheme.spacing.sm,
  },
  subtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
  },
  inputWrapper: {
    marginBottom: lightTheme.spacing.md - 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: lightTheme.borderRadius.md + 2,
    paddingHorizontal: lightTheme.spacing.md - 2,
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  inputFocused: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderColor: lightTheme.colors.primaryLighter,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.base - 1,
    fontFamily: "Poppins_400Regular",
    marginLeft: lightTheme.spacing.md - 6,
    paddingVertical: 0,
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginBottom: lightTheme.spacing.xs + 1,
    marginTop: lightTheme.spacing.xs - 2,
  },
  forgotPasswordText: {
    color: lightTheme.colors.primaryLighter,
    fontSize: lightTheme.typography.fontSize.sm - 1,
    fontFamily: "Poppins_600SemiBold",
  },
  accessCodeWrapper: {
    marginBottom: lightTheme.spacing.md - 2,
  },
  accessCodeHint: {
    fontSize: lightTheme.typography.fontSize.xs - 1,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: lightTheme.spacing.xs,
    marginLeft: lightTheme.spacing.xs,
  },
  loginButton: {
    borderRadius: lightTheme.borderRadius.md + 2,
    overflow: "hidden",
    marginBottom: lightTheme.spacing.md - 2,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    gap: lightTheme.spacing.sm,
  },
  loginButtonText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.base,
    fontFamily: "Poppins_700Bold",
    marginTop: lightTheme.spacing.xs,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: lightTheme.spacing.md - 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  dividerText: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: lightTheme.typography.fontSize.sm - 1,
    fontFamily: "Poppins_400Regular",
    marginHorizontal: lightTheme.spacing.md - 2,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: lightTheme.borderRadius.md + 2,
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    gap: lightTheme.spacing.md - 6,
    marginBottom: lightTheme.spacing.lg - 4,
  },
  googleButtonText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.base - 1,
    fontFamily: "Poppins_600SemiBold",
    marginTop: lightTheme.spacing.xs,
  },
  createAccountContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  createAccountText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: lightTheme.typography.fontSize.sm,
    fontFamily: "Poppins_400Regular",
  },
  createAccountLink: {
    color: lightTheme.colors.primaryLighter,
    fontSize: lightTheme.typography.fontSize.sm,
    fontFamily: "Poppins_700Bold",
  },
  inputError: {
    borderColor: lightTheme.colors.error,
    borderWidth: 2,
  },
  inputDisabled: {
    opacity: 0.5,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  errorText: {
    color: lightTheme.colors.error,
    fontSize: lightTheme.typography.fontSize.xs,
    fontFamily: "Poppins_400Regular",
    marginTop: lightTheme.spacing.xs,
    marginLeft: lightTheme.spacing.xs,
  },
});
