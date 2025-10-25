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
} from "react-native";
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

type RegisterFormData = z.infer<typeof registerSchema>;

type RegisterScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  "Register"
>;

export function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const scrollViewRef = useRef<ScrollView>(null);
  const nameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const crnInputRef = useRef<TextInput>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onSubmit",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      crn: "",
      isNutritionist: false,
    },
  });

  const isNutritionist = watch("isNutritionist");

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

  const onSubmit = (data: RegisterFormData) => {
    // TODO: Implementar lógica de cadastro
    console.log("Cadastro:", data);
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
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.title}>Criar Conta</Text>
              </View>
              <Text style={styles.subtitle}>
                Preencha os dados para começar
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
                        ? "#FFFFFF"
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

              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "email" && styles.inputFocused,
                    errors.email && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={
                      focusedInput === "email"
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
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={
                      focusedInput === "password"
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

              {/* Confirm Password Input */}
              <View style={styles.inputWrapper}>
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "confirmPassword" && styles.inputFocused,
                    errors.confirmPassword && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={
                      focusedInput === "confirmPassword"
                        ? "#FFFFFF"
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
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? "eye-outline" : "eye-off-outline"
                      }
                      size={20}
                      color="rgba(255, 255, 255, 0.6)"
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>
                    {errors.confirmPassword.message}
                  </Text>
                )}
              </View>

              {/* Nutritionist Toggle */}
              <View style={styles.nutritionistContainer}>
                <View style={styles.nutritionistToggle}>
                  <Ionicons
                    name="medical-outline"
                    size={20}
                    color="#FFFFFF"
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
                      true: "#e6a4f0",
                    }}
                    thumbColor={isNutritionist ? "#572363" : "#f4f3f4"}
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
                          ? "#FFFFFF"
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

              {/* Register Button */}
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleSubmit(onSubmit)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#9b6cb0", "#572363"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.registerButtonGradient}
                >
                  <Text style={styles.registerButtonText}>Criar Conta</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Já tem uma conta? </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Login")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.loginLink}>Entrar</Text>
                </TouchableOpacity>
              </View>
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
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 30,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontSize: 32,
    fontFamily: "Poppins_800ExtraBold",
    color: "#FFFFFF",
    textAlign: "center",
    marginRight: 44,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255, 255, 255, 0.85)",
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
  nutritionistContainer: {
    marginVertical: 16,
  },
  nutritionistToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  nutritionistIcon: {
    marginRight: 10,
  },
  nutritionistLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
  },
  crnHint: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 4,
    marginLeft: 4,
  },
  registerButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 20,
  },
  registerButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  loginLink: {
    color: "#e6a4f0",
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
  },
  inputError: {
    borderColor: "#ff4444",
    borderWidth: 2,
  },
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    marginTop: 4,
    marginLeft: 4,
  },
});
