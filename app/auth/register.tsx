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
import { Card } from "@/src/components/ui/Card";
import { useAuthStore } from "@/src/stores/auth.store";
import {
  useGoogleAuth,
  handleGoogleResponse,
} from "@/src/services/google-auth.service";
import { Ionicons } from "@expo/vector-icons";

type UserType = "patient" | "nutritionist" | null;

export default function RegisterScreen() {
  const [selectedType, setSelectedType] = useState<UserType>(null);
  const [step, setStep] = useState<"select" | "form">("select");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [crn, setCrn] = useState(""); // Only for nutritionist
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const { loginWithGoogle, register } = useAuthStore();
  const { promptAsync } = useGoogleAuth();

  const handleTypeSelection = (type: UserType) => {
    setSelectedType(type);
    setStep("form");
  };

  const validateForm = () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios");
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem");
      return false;
    }

    if (password.length < 8) {
      Alert.alert("Erro", "A senha deve ter no mínimo 8 caracteres");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erro", "Digite um email válido");
      return false;
    }

    if (selectedType === "nutritionist" && !crn) {
      Alert.alert("Erro", "O CRN é obrigatório para nutricionistas");
      return false;
    }

    if (!acceptTerms || !acceptPrivacy) {
      Alert.alert(
        "Erro",
        "Você deve aceitar os Termos de Uso e a Política de Privacidade para continuar"
      );
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register({
        name,
        email,
        password,
        role: selectedType!,
        phone: phone || undefined,
        crn: selectedType === "nutritionist" ? crn : undefined,
      });

      // Get the access token from the store after successful registration
      const currentTokens = useAuthStore.getState().tokens;

      // Register legal acceptance after successful registration
      if (currentTokens?.accessToken) {
        try {
          await fetch("http://localhost:3000/legal/accept", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${currentTokens.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              acceptTerms: true,
              acceptPrivacy: true,
            }),
          });
        } catch (legalError) {
          console.error("Failed to register legal acceptance:", legalError);
          // Don't block the user from continuing even if this fails
        }
      }

      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Registration error:", error);
      Alert.alert(
        "Erro",
        error?.response?.data?.message || "Falha ao fazer cadastro"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    // Verify terms acceptance before Google login
    if (!acceptTerms || !acceptPrivacy) {
      Alert.alert(
        "Erro",
        "Você deve aceitar os Termos de Uso e a Política de Privacidade para continuar"
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await promptAsync();
      const googleAuthResult = await handleGoogleResponse(response);

      if (googleAuthResult?.idToken) {
        await loginWithGoogle(googleAuthResult.idToken);

        // Get the access token from the store after successful login
        const currentTokens = useAuthStore.getState().tokens;

        // Register legal acceptance after successful Google login
        if (currentTokens?.accessToken) {
          try {
            await fetch("http://localhost:3000/legal/accept", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${currentTokens.accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                acceptTerms: true,
                acceptPrivacy: true,
              }),
            });
          } catch (legalError) {
            console.error("Failed to register legal acceptance:", legalError);
            // Don't block the user from continuing even if this fails
          }
        }

        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error("Google registration error:", error);
      Alert.alert("Erro", "Falha ao cadastrar com Google");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "select") {
    return (
      <View className="flex-1 bg-white">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-1 px-6 pt-16 pb-8">
              {/* Header */}
              <View className="mb-12">
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="mb-6"
                >
                  <Ionicons name="arrow-back" size={24} color="#572363" />
                </TouchableOpacity>
                <Text className="text-3xl font-bold text-gray-900 mb-2">
                  Criar conta
                </Text>
                <Text className="text-base text-gray-600">
                  Escolha como deseja se cadastrar
                </Text>
              </View>

              {/* Type Selection Cards */}
              <View className="gap-4 mb-8">
                <TouchableOpacity
                  onPress={() => handleTypeSelection("patient")}
                  activeOpacity={0.7}
                >
                  <Card className="p-6 border-2 border-gray-200">
                    <View className="flex-row items-center mb-3">
                      <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mr-4">
                        <Ionicons name="person" size={24} color="#572363" />
                      </View>
                      <Text className="text-xl font-semibold text-gray-900">
                        Paciente
                      </Text>
                    </View>
                    <Text className="text-gray-600 leading-5">
                      Receba acompanhamento nutricional personalizado e atinja
                      seus objetivos de saúde
                    </Text>
                  </Card>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleTypeSelection("nutritionist")}
                  activeOpacity={0.7}
                >
                  <Card className="p-6 border-2 border-gray-200">
                    <View className="flex-row items-center mb-3">
                      <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mr-4">
                        <Ionicons name="medkit" size={24} color="#572363" />
                      </View>
                      <Text className="text-xl font-semibold text-gray-900">
                        Nutricionista
                      </Text>
                    </View>
                    <Text className="text-gray-600 leading-5">
                      Gerencie seus pacientes, crie planos alimentares e
                      acompanhe resultados
                    </Text>
                  </Card>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View className="flex-row items-center my-6">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="px-4 text-gray-500 text-sm">ou</Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>

              {/* Terms and Privacy Checkboxes */}
              <View className="gap-3 mb-6">
                <TouchableOpacity
                  onPress={() => setAcceptTerms(!acceptTerms)}
                  className="flex-row items-start"
                  activeOpacity={0.7}
                >
                  <View
                    className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 items-center justify-center ${
                      acceptTerms
                        ? "bg-[#572363] border-[#572363]"
                        : "border-gray-300"
                    }`}
                  >
                    {acceptTerms && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-700">
                      Eu li e aceito os{" "}
                      <Text
                        className="text-[#572363] font-semibold"
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push("../terms" as any);
                        }}
                      >
                        Termos de Uso
                      </Text>
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setAcceptPrivacy(!acceptPrivacy)}
                  className="flex-row items-start"
                  activeOpacity={0.7}
                >
                  <View
                    className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 items-center justify-center ${
                      acceptPrivacy
                        ? "bg-[#572363] border-[#572363]"
                        : "border-gray-300"
                    }`}
                  >
                    {acceptPrivacy && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-700">
                      Eu li e aceito a{" "}
                      <Text
                        className="text-[#572363] font-semibold"
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push("../privacy" as any);
                        }}
                      >
                        Política de Privacidade
                      </Text>
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Google Sign Up */}
              <Button
                title="Continuar com Google"
                onPress={handleGoogleRegister}
                variant="outline"
                isLoading={isLoading}
                className="mb-6"
                leftIcon={
                  <Ionicons name="logo-google" size={20} color="#572363" />
                }
              />

              {/* Login Link */}
              <View className="flex-row justify-center items-center mt-4">
                <Text className="text-gray-600">Já tem uma conta? </Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text className="text-[#572363] font-semibold">
                    Fazer login
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Invitation Link */}
              <View className="flex-row justify-center items-center mt-3">
                <Text className="text-gray-600">
                  Tem um código de convite?{" "}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push("../auth/accept-invitation" as any)
                  }
                >
                  <Text className="text-[#572363] font-semibold">
                    Aceitar convite
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // Form step
  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-16 pb-8">
            {/* Header */}
            <View className="mb-8">
              <TouchableOpacity
                onPress={() => setStep("select")}
                className="mb-6"
              >
                <Ionicons name="arrow-back" size={24} color="#572363" />
              </TouchableOpacity>
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                {selectedType === "patient"
                  ? "Cadastro de Paciente"
                  : "Cadastro de Nutricionista"}
              </Text>
              <Text className="text-base text-gray-600">
                Preencha seus dados para criar sua conta
              </Text>
            </View>

            {/* Form Fields */}
            <View className="gap-4 mb-6">
              <Input
                placeholder="Nome completo"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                leftIcon={
                  <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                }
              />

              <Input
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={
                  <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                }
              />

              <Input
                placeholder="Telefone (opcional)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                leftIcon={
                  <Ionicons name="call-outline" size={20} color="#9CA3AF" />
                }
              />

              {selectedType === "nutritionist" && (
                <Input
                  placeholder="CRN (Registro profissional)"
                  value={crn}
                  onChangeText={setCrn}
                  autoCapitalize="characters"
                  leftIcon={
                    <Ionicons name="card-outline" size={20} color="#9CA3AF" />
                  }
                />
              )}

              <Input
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                leftIcon={
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#9CA3AF"
                  />
                }
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                }
              />

              <Input
                placeholder="Confirmar senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                leftIcon={
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#9CA3AF"
                  />
                }
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? "eye-off-outline" : "eye-outline"
                      }
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                }
              />
            </View>

            {/* Terms and Privacy Checkboxes */}
            <View className="gap-3 mb-6">
              <TouchableOpacity
                onPress={() => setAcceptTerms(!acceptTerms)}
                className="flex-row items-start"
                activeOpacity={0.7}
              >
                <View
                  className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 items-center justify-center ${
                    acceptTerms
                      ? "bg-[#572363] border-[#572363]"
                      : "border-gray-300"
                  }`}
                >
                  {acceptTerms && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-gray-700">
                    Eu li e aceito os{" "}
                    <Text
                      className="text-[#572363] font-semibold"
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push("../terms" as any);
                      }}
                    >
                      Termos de Uso
                    </Text>
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAcceptPrivacy(!acceptPrivacy)}
                className="flex-row items-start"
                activeOpacity={0.7}
              >
                <View
                  className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 items-center justify-center ${
                    acceptPrivacy
                      ? "bg-[#572363] border-[#572363]"
                      : "border-gray-300"
                  }`}
                >
                  {acceptPrivacy && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-gray-700">
                    Eu li e aceito a{" "}
                    <Text
                      className="text-[#572363] font-semibold"
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push("../privacy" as any);
                      }}
                    >
                      Política de Privacidade
                    </Text>
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Register Button */}
            <Button
              title="Criar conta"
              onPress={handleRegister}
              isLoading={isLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
