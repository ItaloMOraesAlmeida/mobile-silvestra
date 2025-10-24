import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { useAuthStore } from "@/src/stores/auth.store";
import {
  useGoogleAuth,
  handleGoogleResponse,
} from "@/src/services/google-auth.service";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle } = useAuthStore();
  const { promptAsync } = useGoogleAuth();

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert(
        "Erro",
        error?.response?.data?.message || "Falha ao fazer login"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await promptAsync();
      const googleAuthResponse = await handleGoogleResponse(result);

      if (googleAuthResponse?.idToken) {
        await loginWithGoogle(googleAuthResponse.idToken);
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error("Google login error:", error);
      Alert.alert("Erro", "Falha ao fazer login com Google");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 24,
          justifyContent: "center",
        }}
        style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      >
        <View style={{ marginBottom: 48 }}>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "bold",
              color: "#572363",
              marginBottom: 8,
            }}
          >
            Bem-vindo!
          </Text>
          <Text style={{ fontSize: 16, color: "#666666" }}>
            Entre com sua conta para continuar
          </Text>
        </View>

        <View style={{ gap: 16, marginBottom: 24 }}>
          <Input
            label="Email"
            placeholder="seu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={
              <Ionicons name="mail-outline" size={20} color="#666666" />
            }
          />

          <Input
            label="Senha"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            leftIcon={
              <Ionicons name="lock-closed-outline" size={20} color="#666666" />
            }
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#666666"
                />
              </TouchableOpacity>
            }
          />

          <TouchableOpacity>
            <Text
              style={{
                textAlign: "right",
                color: "#572363",
                fontWeight: "600",
              }}
            >
              Esqueceu a senha?
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ gap: 12, marginBottom: 32 }}>
          <Button
            title="Entrar"
            onPress={handleEmailLogin}
            isLoading={isLoading}
            fullWidth
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 16,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: "#E0E0E0" }} />
            <Text style={{ marginHorizontal: 16, color: "#666666" }}>ou</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "#E0E0E0" }} />
          </View>

          <Button
            title="Entrar com Google"
            variant="outline"
            onPress={handleGoogleLogin}
            leftIcon={<Ionicons name="logo-google" size={20} color="#572363" />}
            fullWidth
          />
        </View>

        <View
          style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}
        >
          <Text style={{ color: "#666666" }}>Não tem uma conta?</Text>
          <TouchableOpacity>
            <Text style={{ color: "#572363", fontWeight: "600" }}>
              Criar conta
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
