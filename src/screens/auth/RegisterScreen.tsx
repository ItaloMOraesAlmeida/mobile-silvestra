import React, { useState, useRef, useEffect } from "react";
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
  Switch,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
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
import { EmailExistsModal } from "../../components/EmailExistsModal";
import { BiometricService } from "../../services/biometric";
import { BiometricAuthService } from "../../services/biometric-auth";
import { BiometricPromptModal } from "../../components/BiometricPromptModal";
import { lightTheme } from "../../theme";

// Schema para cadastro normal (todos os campos)
const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Nome é obrigatório")
      .min(3, "Nome deve ter pelo menos 3 caracteres"),
    email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
    password: z
      .string()
      .min(1, "Senha é obrigatória")
      .min(8, "Senha deve ter pelo menos 8 caracteres")
      .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
      .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
      .regex(/[0-9]/, "Senha deve conter pelo menos um número"),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
    crn: z.string().optional(),
    isNutritionist: z.boolean(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Você deve aceitar os termos de uso e política de privacidade",
    }),
  })
  .superRefine((data, ctx) => {
    // Valida se as senhas coincidem
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "As senhas não coincidem",
        path: ["confirmPassword"],
      });
    }

    // Se for nutricionista, CRN é obrigatório
    if (data.isNutritionist) {
      if (!data.crn || data.crn.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CRN é obrigatório para nutricionistas",
          path: ["crn"],
        });
      }
    }
  });

// Schema para completar perfil após login com Clerk (campos reduzidos)
const clerkCompleteSchema = z
  .object({
    name: z
      .string()
      .min(1, "Nome é obrigatório")
      .min(3, "Nome deve ter pelo menos 3 caracteres"),
    crn: z.string().optional(),
    isNutritionist: z.boolean(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Você deve aceitar os termos de uso e política de privacidade",
    }),
  })
  .superRefine((data, ctx) => {
    // Se for nutricionista, CRN é obrigatório
    if (data.isNutritionist) {
      if (!data.crn || data.crn.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CRN é obrigatório para nutricionistas",
          path: ["crn"],
        });
      }
    }
  });

type RegisterFormData = z.infer<typeof registerSchema>;
type ClerkCompleteFormData = z.infer<typeof clerkCompleteSchema>;

type RegisterScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  "Register"
>;

export function RegisterScreen({ route }: any) {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const register = useAuthStore((state) => state.register);
  const completeProfile = useAuthStore((state) => state.completeProfile);
  const scrollViewRef = useRef<ScrollView>(null);
  const nameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const crnInputRef = useRef<TextInput>(null);

  // Detectar o modo: 'normal' (padrão) ou 'clerk-complete'
  const mode: "normal" | "clerk-complete" = route?.params?.mode || "normal";
  const isClerkMode = mode === "clerk-complete";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailExistsModal, setShowEmailExistsModal] = useState(false);
  const [existingEmail, setExistingEmail] = useState("");
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [biometricType, setBiometricType] = useState("");
  const [pendingAuth, setPendingAuth] = useState<{
    email: string;
    accessToken: string;
    refreshToken: string;
  } | null>(null);

  // Usar schema apropriado baseado no modo
  const schema = isClerkMode ? clerkCompleteSchema : registerSchema;

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterFormData | ClerkCompleteFormData>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: isClerkMode
      ? {
          name: "",
          crn: "",
          isNutritionist: false,
          acceptTerms: false,
        }
      : {
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          crn: "",
          isNutritionist: false,
          acceptTerms: false,
        },
  });

  const isNutritionist = watch("isNutritionist");
  const acceptTerms = watch("acceptTerms");

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
        // Volta ao topo suavemente quando o teclado fecha
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

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

  const onSubmit = async (data: RegisterFormData | ClerkCompleteFormData) => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      if (isClerkMode) {
        // Modo Clerk: completar perfil após login do Clerk
        const clerkData = data as ClerkCompleteFormData;

        await completeProfile({
          name: clerkData.name,
          isNutritionist: clerkData.isNutritionist,
          crn: clerkData.crn,
          acceptTerms: clerkData.acceptTerms,
        });

        Toast.show({
          type: "success",
          text1: "Perfil Completado!",
          text2: "Seu cadastro foi finalizado com sucesso!",
          position: "top",
          visibilityTime: 3000,
          topOffset: 60,
        });

        // Verificar se biometria está disponível
        const biometricAvailable = await BiometricService.isAvailable();

        if (biometricAvailable) {
          // Obtém o nome da biometria (Face ID, Touch ID, Digital)
          const biometricName = await BiometricService.getBiometricName();

          // Armazena os dados temporariamente para salvar caso o usuário aceite
          const { user, tokens } = useAuthStore.getState();
          if (user && tokens) {
            setPendingAuth({
              email: user.email,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
            });
            setBiometricType(biometricName);
            setShowBiometricPrompt(true);
          } else {
            // Sem tokens, apenas redireciona (auth store já marcou isAuthenticated=true)
            // RootNavigator vai redirecionar automaticamente
          }
        } else {
          // Biometria não disponível, apenas completa o processo
          // O auth store já marcou isAuthenticated=true
          // RootNavigator vai redirecionar automaticamente
        }
      } else {
        // Modo normal: cadastro completo com email/senha
        const registerData = data as RegisterFormData;

        // Determinar o role baseado na seleção do usuário
        let role: "normal" | "patient" | "nutritionist" = "normal";

        if (registerData.isNutritionist) {
          role = "nutritionist";
        } else {
          // Por padrão, usuários que se cadastram sem ser nutricionista
          // são "normal" até receberem um convite de nutricionista
          role = "normal";
        }

        // Preparar dados para envio
        const apiData = {
          name: registerData.name,
          email: registerData.email,
          password: registerData.password,
          role,
          ...(registerData.isNutritionist && registerData.crn
            ? { crn: registerData.crn }
            : {}),
        };

        // Chamar API de registro
        await register(apiData);

        Toast.show({
          type: "success",
          text1: "Cadastro Realizado!",
          text2: "Sua conta foi criada com sucesso. Bem-vindo!",
          position: "top",
          visibilityTime: 3000,
          topOffset: 60,
        });

        // Aguardar um pouco para o usuário ver o toast e então navegar
        setTimeout(() => {
          navigation.replace("Login", { email: apiData.email });
        }, 1500);
      }
    } catch (error: any) {
      if (isClerkMode) {
        // Erro ao completar perfil Clerk
        Toast.show({
          type: "error",
          text1: "Erro ao Completar Perfil",
          text2:
            error.message ||
            "Não foi possível completar seu cadastro. Tente novamente.",
          position: "top",
          visibilityTime: 4000,
          topOffset: 60,
        });
      } else {
        // Erro no cadastro normal
        const registerData = data as RegisterFormData;
        const errorMessage = error.message || "";
        const isEmailExists =
          errorMessage.toLowerCase().includes("já cadastrado") ||
          errorMessage.toLowerCase().includes("já existe") ||
          errorMessage.toLowerCase().includes("already exists") ||
          errorMessage.toLowerCase().includes("duplicate");

        if (isEmailExists) {
          // Mostra o modal customizado
          setExistingEmail(registerData.email);
          setShowEmailExistsModal(true);
        } else {
          // Mostra toast de erro genérico
          Toast.show({
            type: "error",
            text1: "Erro no Cadastro",
            text2:
              error.message ||
              "Não foi possível criar sua conta. Tente novamente.",
            position: "top",
            visibilityTime: 4000,
            topOffset: 60,
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    setShowEmailExistsModal(false);
    // Navega para login passando o email
    navigation.navigate("Login", { email: existingEmail } as any);
  };

  const handleRecoverPassword = () => {
    setShowEmailExistsModal(false);
    // Navega para recuperar senha passando o email
    navigation.navigate("ForgotPassword", { email: existingEmail } as any);
  };

  const handleCloseModal = () => {
    setShowEmailExistsModal(false);
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

        // Completa a configuração de biometria no auth store
        const { completeBiometricSetup, user } = useAuthStore.getState();
        completeBiometricSetup();

        setShowBiometricPrompt(false);

        Toast.show({
          type: "success",
          text1: "Biometria Ativada!",
          text2: `${biometricType} foi configurado com sucesso!`,
          position: "top",
          visibilityTime: 3000,
          topOffset: 60,
        });

        // Redireciona para a pilha Main (RoleBasedHome decide a tela específica)
        setTimeout(() => {
          navigation.reset({ index: 0, routes: [{ name: "Main" } as any] });
        }, 500); // Aguarda meio segundo para o toast aparecer
      }
    } catch (error) {
      console.error("Erro ao salvar biometria:", error);
      setShowBiometricPrompt(false);

      // Mesmo com erro, redireciona (biometria é opcional)
      const { user } = useAuthStore.getState();
      // Mesmo com erro, redireciona para Main
      setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: "Main" } as any] });
      }, 500);
    }
  };

  const handleBiometricDecline = () => {
    setShowBiometricPrompt(false);

    // Usuário recusou biometria, mas continua autenticado
    const { skipBiometricSetup, user } = useAuthStore.getState();
    skipBiometricSetup();

    // Redireciona para a pilha Main (RoleBasedHome decide a tela específica)
    setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: "Main" } as any] });
    }, 300); // Aguarda um pouco antes de redirecionar
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <EmailExistsModal
        visible={showEmailExistsModal}
        email={existingEmail}
        onClose={handleCloseModal}
        onGoToLogin={handleGoToLogin}
        onRecoverPassword={handleRecoverPassword}
      />

      <BiometricPromptModal
        visible={showBiometricPrompt}
        biometricType={biometricType}
        onAccept={handleBiometricAccept}
        onDecline={handleBiometricDecline}
      />

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
              keyboardHeight > 0 && {
                paddingBottom: keyboardHeight > 0 ? 30 : 30,
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="arrow-back"
                    size={24}
                    color={lightTheme.colors.white}
                  />
                </TouchableOpacity>
                <Text
                  style={[styles.title, isClerkMode && styles.titleSmaller]}
                >
                  {isClerkMode ? "Complete seu Cadastro" : "Criar Conta"}
                </Text>
              </View>
              <Text style={styles.subtitle}>
                {isClerkMode
                  ? "Informe seus dados para finalizar"
                  : "Preencha os dados para começar"}
              </Text>
            </View>

            {/* Form Container */}
            <View style={styles.formContainer}>
              {/* Name Input */}
              <View style={styles.inputWrapper}>
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "name" && styles.inputFocused,
                    errors.name && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={
                      focusedInput === "name"
                        ? lightTheme.colors.white
                        : "rgba(255, 255, 255, 0.6)"
                    }
                  />
                  <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        ref={nameInputRef}
                        style={styles.input}
                        placeholder="Nome completo"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={value}
                        onChangeText={onChange}
                        autoCapitalize="words"
                        autoComplete="name"
                        onFocus={() => {
                          setFocusedInput("name");
                          handleInputFocus(nameInputRef);
                        }}
                        onBlur={() => setFocusedInput(null)}
                      />
                    )}
                  />
                </View>
                {errors.name && (
                  <Text style={styles.errorText}>{errors.name.message}</Text>
                )}
              </View>

              {/* Email Input - Apenas no modo normal */}
              {!isClerkMode && (
                <View style={styles.inputWrapper}>
                  <View
                    style={[
                      styles.inputContainer,
                      focusedInput === "email" && styles.inputFocused,
                      (errors as any).email && styles.inputError,
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={
                        focusedInput === "email"
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
                          onFocus={() => {
                            setFocusedInput("email");
                            handleInputFocus(emailInputRef);
                          }}
                          onBlur={() => setFocusedInput(null)}
                        />
                      )}
                    />
                  </View>
                  {(errors as any).email && (
                    <Text style={styles.errorText}>
                      {(errors as any).email.message}
                    </Text>
                  )}
                </View>
              )}

              {/* Password Input - Apenas no modo normal */}
              {!isClerkMode && (
                <View style={styles.inputWrapper}>
                  <View
                    style={[
                      styles.inputContainer,
                      focusedInput === "password" && styles.inputFocused,
                      (errors as any).password && styles.inputError,
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={
                        focusedInput === "password"
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
                  {(errors as any).password && (
                    <Text style={styles.errorText}>
                      {(errors as any).password.message}
                    </Text>
                  )}
                </View>
              )}

              {/* Confirm Password Input - Apenas no modo normal */}
              {!isClerkMode && (
                <View style={styles.inputWrapper}>
                  <View
                    style={[
                      styles.inputContainer,
                      focusedInput === "confirmPassword" && styles.inputFocused,
                      (errors as any).confirmPassword && styles.inputError,
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={
                        focusedInput === "confirmPassword"
                          ? lightTheme.colors.white
                          : "rgba(255, 255, 255, 0.6)"
                      }
                    />
                    <Controller
                      control={control}
                      name="confirmPassword"
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          ref={confirmPasswordInputRef}
                          style={styles.input}
                          placeholder="Confirmar senha"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          value={value}
                          onChangeText={onChange}
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          autoComplete="password"
                          onFocus={() => {
                            setFocusedInput("confirmPassword");
                            handleInputFocus(confirmPasswordInputRef);
                          }}
                          onBlur={() => setFocusedInput(null)}
                        />
                      )}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? "eye-outline"
                            : "eye-off-outline"
                        }
                        size={20}
                        color="rgba(255, 255, 255, 0.6)"
                      />
                    </TouchableOpacity>
                  </View>
                  {(errors as any).confirmPassword && (
                    <Text style={styles.errorText}>
                      {(errors as any).confirmPassword.message}
                    </Text>
                  )}
                </View>
              )}

              {/* Nutritionist Toggle */}
              <View style={styles.nutritionistContainer}>
                <View style={styles.nutritionistToggle}>
                  <Ionicons
                    name="medical-outline"
                    size={20}
                    color={lightTheme.colors.white}
                    style={styles.nutritionistIcon}
                  />
                  <Text style={styles.nutritionistLabel}>
                    Sou nutricionista
                  </Text>
                  <Switch
                    value={isNutritionist}
                    onValueChange={(value) => setValue("isNutritionist", value)}
                    trackColor={{
                      false: "rgba(255, 255, 255, 0.2)",
                      true: lightTheme.colors.primaryLighter,
                    }}
                    thumbColor={
                      isNutritionist
                        ? lightTheme.colors.primaryDark
                        : lightTheme.colors.gray[100]
                    }
                    ios_backgroundColor="rgba(255, 255, 255, 0.2)"
                  />
                </View>
              </View>

              {/* CRN Input (only if nutritionist) */}
              {isNutritionist && (
                <View style={styles.inputWrapper}>
                  <View
                    style={[
                      styles.inputContainer,
                      focusedInput === "crn" && styles.inputFocused,
                      errors.crn && styles.inputError,
                    ]}
                  >
                    <Ionicons
                      name="ribbon-outline"
                      size={20}
                      color={
                        focusedInput === "crn"
                          ? lightTheme.colors.white
                          : "rgba(255, 255, 255, 0.6)"
                      }
                    />
                    <Controller
                      control={control}
                      name="crn"
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          ref={crnInputRef}
                          style={styles.input}
                          placeholder="CRN (Ex: 12345/SP)"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          value={value}
                          onChangeText={onChange}
                          autoCapitalize="characters"
                          onFocus={() => {
                            setFocusedInput("crn");
                            handleInputFocus(crnInputRef);
                          }}
                          onBlur={() => setFocusedInput(null)}
                        />
                      )}
                    />
                  </View>
                  {errors.crn && (
                    <Text style={styles.errorText}>{errors.crn.message}</Text>
                  )}
                </View>
              )}

              {/* Terms and Conditions */}
              <View style={styles.termsContainer}>
                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    onPress={() => setValue("acceptTerms", !acceptTerms)}
                    activeOpacity={0.7}
                    style={styles.checkboxTouchable}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        acceptTerms && styles.checkboxChecked,
                      ]}
                    >
                      {acceptTerms && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={lightTheme.colors.white}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.termsText}>
                    Eu aceito os{" "}
                    <Text
                      style={styles.termsLink}
                      onPress={() => navigation.navigate("TermsOfService")}
                    >
                      Termos de Uso
                    </Text>{" "}
                    e a{" "}
                    <Text
                      style={styles.termsLink}
                      onPress={() => navigation.navigate("PrivacyPolicy")}
                    >
                      Política de Privacidade
                    </Text>
                  </Text>
                </View>
                {errors.acceptTerms && (
                  <Text style={styles.errorText}>
                    {errors.acceptTerms.message}
                  </Text>
                )}
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[
                  styles.registerButton,
                  isLoading && styles.registerButtonDisabled,
                ]}
                onPress={handleSubmit(onSubmit)}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[
                    lightTheme.colors.primaryLight,
                    lightTheme.colors.primaryDark,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.registerButtonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator
                      color={lightTheme.colors.white}
                      size="small"
                    />
                  ) : (
                    <Text style={styles.registerButtonText}>
                      {isClerkMode ? "Finalizar Cadastro" : "Criar Conta"}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Login Link - Apenas no modo normal */}
              {!isClerkMode && (
                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Já tem uma conta? </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Login")}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.loginLink}>Entrar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
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
    paddingHorizontal:
      lightTheme.spacing.screenPaddingLarge + lightTheme.spacing.xs,
    paddingTop: lightTheme.spacing["2xl"] + lightTheme.spacing.md,
    paddingBottom:
      lightTheme.spacing.screenPaddingLarge + lightTheme.spacing.xs,
  },
  header: {
    marginBottom: lightTheme.spacing.screenPaddingLarge + lightTheme.spacing.xs,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: lightTheme.spacing.md,
    gap: lightTheme.spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize["4xl"],
    fontFamily: "Poppins_800ExtraBold",
    color: lightTheme.colors.white,
    textAlign: "center",
    marginRight: 44,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: lightTheme.typography.fontSize.base - 1,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255, 255, 255, 0.85)",
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
  nutritionistContainer: {
    marginVertical: lightTheme.spacing.md,
  },
  nutritionistToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: lightTheme.borderRadius.md + 2,
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.md - 2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  nutritionistIcon: {
    marginRight: lightTheme.spacing.md - 6,
  },
  nutritionistLabel: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.base - 1,
    fontFamily: "Poppins_600SemiBold",
    color: lightTheme.colors.white,
  },
  crnHint: {
    fontSize: lightTheme.typography.fontSize.xs - 1,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: lightTheme.spacing.xs,
    marginLeft: lightTheme.spacing.xs,
  },
  termsContainer: {
    marginTop: lightTheme.spacing.md,
    marginBottom: lightTheme.spacing.md - 6,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkboxTouchable: {
    marginRight: lightTheme.spacing.md - 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: lightTheme.borderRadius.xs,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: lightTheme.spacing.md - 6,
    marginTop: lightTheme.spacing.xs - 2,
  },
  checkboxChecked: {
    backgroundColor: lightTheme.colors.primaryLight,
    borderColor: lightTheme.colors.primaryLight,
  },
  termsText: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.sm - 1,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight:
      lightTheme.typography.lineHeight.normal *
      lightTheme.typography.fontSize.sm,
  },
  termsLink: {
    color: lightTheme.colors.primaryLighter,
    fontFamily: "Poppins_600SemiBold",
    textDecorationLine: "underline",
  },
  registerButton: {
    borderRadius: lightTheme.borderRadius.md + 2,
    overflow: "hidden",
    marginTop: lightTheme.spacing.md - 6,
    marginBottom: lightTheme.spacing.lg - 4,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  registerButtonText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.base,
    fontFamily: "Poppins_700Bold",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: lightTheme.typography.fontSize.sm,
    fontFamily: "Poppins_400Regular",
  },
  loginLink: {
    color: lightTheme.colors.primaryLighter,
    fontSize: lightTheme.typography.fontSize.sm,
    fontFamily: "Poppins_700Bold",
  },
  inputError: {
    borderColor: lightTheme.colors.error,
    borderWidth: 2,
  },
  errorText: {
    color: lightTheme.colors.error,
    fontSize: lightTheme.typography.fontSize.xs,
    fontFamily: "Poppins_400Regular",
    marginTop: lightTheme.spacing.xs,
    marginLeft: lightTheme.spacing.xs,
  },
  titleSmaller: {
    fontSize: lightTheme.typography.fontSize["2xl"], // Menor para texto mais longo
  },
});
