import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/src/stores/auth.store";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/services/api";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

interface NutritionistInfo {
  id: string;
  email: string;
  nutritionistProfile?: {
    crn?: string;
    specialization?: string;
    avatarUrl?: string;
  };
}

export default function AcceptInvitationScreen() {
  const { setUser, setTokens } = useAuthStore();
  const [step, setStep] = useState<"code" | "form">("code");

  // Code validation
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [nutritionistInfo, setNutritionistInfo] =
    useState<NutritionistInfo | null>(null);

  // Registration form
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleValidateCode = async () => {
    if (!code) {
      Alert.alert("Erro", "Digite o código do convite");
      return;
    }

    if (code.length !== 8) {
      Alert.alert("Erro", "O código deve ter 8 caracteres");
      return;
    }

    setIsValidating(true);

    try {
      const response = await api.get(
        `${API_URL}/invitations/validate/${code.toUpperCase()}`
      );

      setNutritionistInfo(response.data);
      setStep("form");
    } catch (error: any) {
      console.error("Error validating code:", error);

      const errorMessage =
        error?.response?.data?.message ||
        "Código inválido ou expirado. Verifique o código e tente novamente.";

      Alert.alert("Erro", errorMessage);
    } finally {
      setIsValidating(false);
    }
  };

  const validateForm = () => {
    if (!name || !password || !confirmPassword) {
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

    return true;
  };

  const handleAcceptInvitation = async () => {
    if (!validateForm()) return;

    setIsRegistering(true);

    try {
      const response = await api.post(`${API_URL}/invitations/accept`, {
        code: code.toUpperCase(),
        name,
        password,
        gender: gender || undefined,
        birthDate: birthDate || undefined,
        phone: phone || undefined,
      });

      const { user, tokens } = response.data;

      // Update auth store
      setUser(user);
      setTokens(tokens);

      Alert.alert(
        "Bem-vindo!",
        `Sua conta foi criada com sucesso! Você agora está vinculado ao nutricionista ${nutritionistInfo?.email}.`,
        [
          {
            text: "Começar",
            onPress: () => router.replace("/(tabs)"),
          },
        ]
      );
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      Alert.alert(
        "Erro",
        error?.response?.data?.message || "Falha ao aceitar convite"
      );
    } finally {
      setIsRegistering(false);
    }
  };

  if (step === "code") {
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
                  Aceitar Convite
                </Text>
                <Text className="text-base text-gray-600">
                  Digite o código que você recebeu do seu nutricionista
                </Text>
              </View>

              {/* Code Input Card */}
              <Card className="p-6 mb-6">
                <View className="items-center mb-6">
                  <View className="w-20 h-20 bg-purple-100 rounded-full items-center justify-center mb-4">
                    <Ionicons name="key" size={40} color="#572363" />
                  </View>
                  <Text className="text-lg font-semibold text-gray-900 mb-2">
                    Código do Convite
                  </Text>
                  <Text className="text-sm text-gray-500 text-center">
                    O código tem 8 caracteres e foi enviado pelo seu
                    nutricionista
                  </Text>
                </View>

                <Input
                  placeholder="Exemplo: ABC12XYZ"
                  value={code}
                  onChangeText={(text) => setCode(text.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={8}
                  leftIcon={
                    <Ionicons name="key-outline" size={20} color="#9CA3AF" />
                  }
                  className="mb-4"
                  style={{ letterSpacing: 2, fontSize: 18, fontWeight: "600" }}
                />

                <Button
                  title="Validar Código"
                  onPress={handleValidateCode}
                  isLoading={isValidating}
                  disabled={code.length !== 8}
                  leftIcon={
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                  }
                />
              </Card>

              {/* Info Card */}
              <Card className="p-4 bg-blue-50 border border-blue-200">
                <View className="flex-row">
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color="#3B82F6"
                  />
                  <Text className="flex-1 ml-2 text-xs text-blue-800 leading-5">
                    Não tem um código? Entre em contato com seu nutricionista
                    para receber o convite por email ou código.
                  </Text>
                </View>
              </Card>
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
                onPress={() => setStep("code")}
                className="mb-6"
              >
                <Ionicons name="arrow-back" size={24} color="#572363" />
              </TouchableOpacity>
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                Complete seu Cadastro
              </Text>
              <Text className="text-base text-gray-600">
                Preencha seus dados para finalizar
              </Text>
            </View>

            {/* Nutritionist Info */}
            {nutritionistInfo && (
              <Card className="p-4 mb-6 bg-purple-50 border border-purple-200">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-purple-200 rounded-full items-center justify-center mr-3">
                    <Ionicons name="person" size={24} color="#572363" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-purple-700 mb-1">
                      Seu nutricionista
                    </Text>
                    <Text className="text-sm font-semibold text-purple-900">
                      {nutritionistInfo.email}
                    </Text>
                    {nutritionistInfo.nutritionistProfile?.crn && (
                      <Text className="text-xs text-purple-700">
                        CRN: {nutritionistInfo.nutritionistProfile.crn}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
                </View>
              </Card>
            )}

            {/* Form Fields */}
            <View className="gap-4 mb-6">
              <Input
                placeholder="Nome completo *"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                leftIcon={
                  <Ionicons name="person-outline" size={20} color="#9CA3AF" />
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

              <Input
                placeholder="Gênero (opcional)"
                value={gender}
                onChangeText={setGender}
                leftIcon={
                  <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                }
              />

              <Input
                placeholder="Data de Nascimento (opcional)"
                value={birthDate}
                onChangeText={setBirthDate}
                leftIcon={
                  <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                }
              />

              <Input
                placeholder="Senha *"
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
                placeholder="Confirmar senha *"
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

            {/* Submit Button */}
            <Button
              title="Criar Conta"
              onPress={handleAcceptInvitation}
              isLoading={isRegistering}
              className="mb-4"
            />

            {/* Terms */}
            <Text className="text-xs text-gray-500 text-center leading-5">
              Ao criar uma conta, você concorda com nossos{" "}
              <Text className="text-[#572363] font-semibold">
                Termos de Uso
              </Text>{" "}
              e{" "}
              <Text className="text-[#572363] font-semibold">
                Política de Privacidade
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
