import React, { useState } from "react";
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
  ActivityIndicator,
  Image,
} from "react-native";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { api } from "../../services/api.service";
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

const forgotPasswordSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email ou CPF é obrigatório")
    .refine(
      (value) => {
        // Valida email OU CPF (11 dígitos ou formatado)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const cpfRegex = /^(\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/;
        return emailRegex.test(value) || cpfRegex.test(value);
      },
      { message: "Informe um email ou CPF válido" }
    ),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

type ForgotPasswordScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  "ForgotPassword"
>;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const [focusedInput, setFocusedInput] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onSubmit",
    defaultValues: {
      identifier: "",
    },
  });

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/forgot-password", {
        identifier: data.identifier,
      });

      if (response.status === 200 || response.status === 201) {
        Toast.show({
          type: "success",
          text1: "Código Enviado!",
          text2: "Verifique seu email ou SMS para o código de recuperação.",
          position: "top",
          visibilityTime: 3000,
          topOffset: 60,
        });

        navigation.navigate("VerifyCode", {
          identifier: data.identifier,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Erro ao Enviar Código",
          text2:
            response.data?.message ||
            "Não foi possível enviar o código. Tente novamente.",
          position: "top",
          visibilityTime: 4000,
          topOffset: 60,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro de Conexão",
        text2:
          error.message ||
          "Não foi possível conectar ao servidor. Verifique sua internet.",
        position: "top",
        visibilityTime: 4000,
        topOffset: 60,
      });
    } finally {
      setLoading(false);
    }
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
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
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
                <Text style={styles.title}>Recuperar Senha</Text>
              </View>
              <Text style={styles.subtitle}>
                Informe seu email ou CPF para receber o código de recuperação
              </Text>
            </View>

            {/* Form Container */}
            <View style={styles.formContainer}>
              {/* Image */}
              <View style={styles.imageContainer}>
                <Image
                  source={require("../../../assets/images/ResetPassword/ResetPasswordImage.png")}
                  style={styles.image}
                  resizeMode="contain"
                />
              </View>

              {/* Input */}
              <View style={styles.inputWrapper}>
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput && styles.inputFocused,
                    errors.identifier && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={
                      focusedInput ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)"
                    }
                  />
                  <Controller
                    control={control}
                    name="identifier"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="Email ou CPF"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={value}
                        onChangeText={onChange}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        onFocus={() => setFocusedInput(true)}
                        onBlur={() => setFocusedInput(false)}
                      />
                    )}
                  />
                </View>
                {errors.identifier && (
                  <Text style={styles.errorText}>
                    {errors.identifier.message}
                  </Text>
                )}
              </View>

              {/* Send Button */}
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  loading && styles.sendButtonDisabled,
                ]}
                onPress={handleSubmit(onSubmit)}
                activeOpacity={0.8}
                disabled={loading}
              >
                <LinearGradient
                  colors={
                    loading ? ["#666666", "#444444"] : ["#9b6cb0", "#572363"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.sendButtonText}>Enviar Código</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Back to Login */}
              <TouchableOpacity
                style={styles.backToLoginContainer}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="arrow-back"
                  size={16}
                  color="rgba(255, 255, 255, 0.7)"
                />
                <Text style={styles.backToLoginText}>Voltar para o login</Text>
              </TouchableOpacity>
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
    marginBottom: 40,
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
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255, 255, 255, 0.7)",
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
  },
  imageContainer: {
    alignSelf: "center",
    marginBottom: 40,
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 14,
    height: 56,
    paddingHorizontal: 16,
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
  sendButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 12,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonGradient: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  backToLoginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 6,
  },
  backToLoginText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
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
