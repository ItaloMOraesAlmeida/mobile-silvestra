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
  ActivityIndicator,
  Image,
} from "react-native";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
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

type VerifyCodeScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  "VerifyCode"
>;

type VerifyCodeScreenRouteProp = RouteProp<AuthStackParamList, "VerifyCode">;

export function VerifyCodeScreen() {
  const navigation = useNavigation<VerifyCodeScreenNavigationProp>();
  const route = useRoute<VerifyCodeScreenRouteProp>();
  const { identifier } = route.params;

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutos em segundos
  const [canResend, setCanResend] = useState(false); // Controla se pode reenviar
  const [resendTimeLeft, setResendTimeLeft] = useState(5 * 60); // 5 minutos para poder reenviar

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const handleVerifyCode = async (fullCode: string) => {
    if (fullCode.length !== 6) {
      Toast.show({
        type: "warning",
        text1: "Atenção",
        text2: "Por favor, informe o código completo de 6 dígitos.",
        position: "top",
        visibilityTime: 3000,
        topOffset: 60,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/verify-reset-code", {
        code: fullCode,
      });

      const data = response.data;

      // A API sempre retorna status 200, verificar o campo 'valid'
      if (data.valid === true) {
        Toast.show({
          type: "success",
          text1: "Código Válido!",
          text2: "Redirecionando para redefinir sua senha...",
          position: "top",
          visibilityTime: 2000,
          topOffset: 60,
        });

        navigation.navigate("ResetPassword", { code: fullCode });
      } else {
        // Código inválido, expirado ou já usado
        Toast.show({
          type: "error",
          text1: "Código Inválido",
          text2:
            data.message || "Código incorreto ou expirado. Tente novamente.",
          position: "top",
          visibilityTime: 4000,
          topOffset: 60,
        });
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      // Extrai a mensagem de erro da resposta da API
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Não foi possível verificar o código. Tente novamente.";

      Toast.show({
        type: "error",
        text1: "Erro ao Verificar Código",
        text2: errorMessage,
        position: "top",
        visibilityTime: 4000,
        topOffset: 60,
      });
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Timer countdown para expiração do código (15 minutos)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Timer countdown para habilitar botão de reenviar (5 minutos)
  useEffect(() => {
    const resendTimer = setInterval(() => {
      setResendTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true); // Habilita o botão após 5 minutos
          clearInterval(resendTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(resendTimer);
  }, []);

  // Auto-submit quando todos os 6 dígitos forem preenchidos
  useEffect(() => {
    const fullCode = code.join("");
    if (fullCode.length === 6) {
      handleVerifyCode(fullCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (!fontsLoaded) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleCodeChange = (text: string, index: number) => {
    // Aceita apenas números
    if (text && !/^\d+$/.test(text)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-foco no próximo input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (event: any, index: number) => {
    // Backspace: volta para o input anterior
    if (event.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = async () => {
    // Não permite reenviar se ainda não passou 5 minutos
    if (!canResend) {
      Toast.show({
        type: "warning",
        text1: "Aguarde",
        text2: `Você poderá reenviar o código em ${formatTime(
          resendTimeLeft
        )}.`,
        position: "top",
        visibilityTime: 3000,
        topOffset: 60,
      });
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", {
        identifier,
      });

      // Se chegou aqui, o código foi reenviado com sucesso
      Toast.show({
        type: "success",
        text1: "Código Reenviado!",
        text2: "Um novo código foi enviado para seu email.",
        position: "top",
        visibilityTime: 3000,
        topOffset: 60,
      });

      // Reseta os timers
      setTimeLeft(15 * 60); // Novo código expira em 15 minutos
      setResendTimeLeft(5 * 60); // Novo countdown de 5 minutos para reenviar
      setCanResend(false); // Desabilita o botão novamente
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      // Extrai a mensagem de erro da resposta da API
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Não foi possível reenviar o código. Tente novamente.";

      Toast.show({
        type: "error",
        text1: "Erro ao Reenviar",
        text2: errorMessage,
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
                <Text style={styles.title}>Código de Verificação</Text>
              </View>
              <Text style={styles.subtitle}>
                Digite o código de 6 dígitos enviado para seu email
              </Text>
            </View>

            {/* Form Container */}
            <View style={styles.formContainer}>
              {/* Image */}
              <View style={styles.imageContainer}>
                <Image
                  source={require("../../../assets/images/ResetPassword/CodePassword.png")}
                  style={styles.image}
                  resizeMode="cover"
                />
              </View>

              {/* Code Inputs */}
              <View style={styles.codeContainer}>
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={[
                      styles.codeInput,
                      focusedIndex === index && styles.codeInputFocused,
                    ]}
                    value={digit}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onKeyPress={(event) => handleKeyPress(event, index)}
                    onFocus={() => setFocusedIndex(index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              {/* Timer */}
              <View style={styles.timerContainer}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color="rgba(255, 255, 255, 0.7)"
                />
                <Text style={styles.timerText}>
                  Código expira em: {formatTime(timeLeft)}
                </Text>
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  loading && styles.verifyButtonDisabled,
                ]}
                onPress={() => handleVerifyCode(code.join(""))}
                activeOpacity={0.8}
                disabled={loading || code.join("").length !== 6}
              >
                <LinearGradient
                  colors={
                    loading || code.join("").length !== 6
                      ? ["#666666", "#444444"]
                      : ["#9b6cb0", "#572363"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.verifyButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.verifyButtonText}>
                      Verificar Código
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Resend Code */}
              <TouchableOpacity
                style={styles.resendContainer}
                onPress={handleResendCode}
                activeOpacity={0.7}
                disabled={loading || timeLeft === 0 || !canResend}
              >
                <Text style={styles.resendText}>Não recebeu o código?</Text>
                {canResend ? (
                  <Text style={styles.resendLink}>Reenviar</Text>
                ) : (
                  <Text style={[styles.resendLink, styles.resendLinkDisabled]}>
                    Reenviar em {formatTime(resendTimeLeft)}
                  </Text>
                )}
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
    fontSize: 28,
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
    borderRadius: 100,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(230, 164, 240, 0.1)",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 8,
  },
  codeInput: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: "#FFFFFF",
    paddingTop: 0,
    paddingBottom: 0,
    includeFontPadding: false,
  },
  codeInputFocused: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderColor: "#e6a4f0",
    borderWidth: 2,
  },
  timerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    gap: 6,
  },
  timerText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  verifyButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 12,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonGradient: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 4,
  },
  resendText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  resendLink: {
    color: "#e6a4f0",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    textDecorationLine: "underline",
  },
  resendLinkDisabled: {
    color: "rgba(255, 255, 255, 0.4)",
    textDecorationLine: "none",
  },
});
