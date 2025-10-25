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
  Image,
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

type LoginScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  "Login"
>;

export function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleLogin = () => {
    // TODO: Implementar lógica de login
    console.log("Login:", { email, password, accessCode });
  };

  const handleGoogleLogin = () => {
    // TODO: Implementar login com Google
    console.log("Login com Google");
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
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    onFocus={() => setFocusedInput("email")}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "password" && styles.inputFocused,
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
                  <TextInput
                    style={styles.input}
                    placeholder="Senha"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    onFocus={() => setFocusedInput("password")}
                    onBlur={() => setFocusedInput(null)}
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
              <View style={styles.accessCodeWrapper}>
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "accessCode" && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    name="key-outline"
                    size={20}
                    color={
                      focusedInput === "accessCode"
                        ? "#FFFFFF"
                        : "rgba(255, 255, 255, 0.6)"
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Código de acesso (opcional)"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={accessCode}
                    onChangeText={setAccessCode}
                    keyboardType="numeric"
                    autoCapitalize="none"
                    onFocus={() => setFocusedInput("accessCode")}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
                <Text style={styles.accessCodeHint}>
                  Use o código fornecido pelo seu nutricionista
                </Text>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
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
});
