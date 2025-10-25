import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { useAuthStore } from "@/src/stores/auth.store";
import { Ionicons } from "@expo/vector-icons";

export default function AcceptInvitationScreen() {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [nutritionistName, setNutritionistName] = useState<string>("");

  // Form fields for completing registration
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const { register } = useAuthStore();

  const validateCode = async () => {
    if (!code || code.length !== 6) {
      Alert.alert("Erro", "Digite um código válido de 6 caracteres");
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch(
        `http://localhost:3000/invitations/validate/${code}`
      );

      if (response.ok) {
        const data = await response.json();
        setIsValid(true);
        setNutritionistName(data.nutritionistName || "Nutricionista");
        setEmail(data.email || "");
      } else {
        setIsValid(false);
        Alert.alert(
          "Código Inválido",
          "O código informado não existe ou já expirou"
        );
      }
    } catch (error) {
      console.error("Validation error:", error);
      Alert.alert("Erro", "Falha ao validar código");
    } finally {
      setIsValidating(false);
    }
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

    return true;
  };

  const handleAcceptInvitation = async () => {
    if (!validateForm()) return;

    setIsRegistering(true);
    try {
      await register({
        name,
        email,
        password,
        role: "patient",
        phone: phone || undefined,
        invitationCode: code,
      });

      Alert.alert(
        "Sucesso!",
        `Você agora está vinculado(a) com ${nutritionistName}`,
        [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)" as any),
          },
        ]
      );
    } catch (error: any) {
      console.error("Accept invitation error:", error);
      Alert.alert(
        "Erro",
        error?.response?.data?.message || "Falha ao aceitar convite"
      );
    } finally {
      setIsRegistering(false);
    }
  };

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
              <TouchableOpacity onPress={() => router.back()} className="mb-6">
                <Ionicons name="arrow-back" size={24} color="#572363" />
              </TouchableOpacity>
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                Aceitar Convite
              </Text>
              <Text className="text-base text-gray-600">
                Digite o código do convite para se vincular a um nutricionista
              </Text>
            </View>

            {/* Code Input Section */}
            {!isValid && (
              <View className="gap-4 mb-6">
                <Input
                  placeholder="Código do convite (6 caracteres)"
                  value={code}
                  onChangeText={(text) => setCode(text.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={6}
                  leftIcon={
                    <Ionicons name="key-outline" size={20} color="#9CA3AF" />
                  }
                />

                <Button
                  title={isValidating ? "Validando..." : "Validar Código"}
                  onPress={validateCode}
                  isLoading={isValidating}
                  disabled={code.length !== 6}
                />
              </View>
            )}

            {/* Registration Form (shown after valid code) */}
            {isValid && (
              <>
                {/* Success Message */}
                <View className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <View className="flex-row items-center mb-2">
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#10B981"
                    />
                    <Text className="text-green-800 font-semibold ml-2 text-lg">
                      Código Válido!
                    </Text>
                  </View>
                  <Text className="text-green-700">
                    Você será vinculado(a) com{" "}
                    <Text className="font-semibold">{nutritionistName}</Text>
                  </Text>
                  <Text className="text-green-600 text-sm mt-1">
                    Complete seu cadastro abaixo para continuar.
                  </Text>
                </View>

                {/* Registration Form */}
                <View className="gap-4 mb-6">
                  <Input
                    placeholder="Nome completo"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    leftIcon={
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color="#9CA3AF"
                      />
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
                          name={
                            showPassword ? "eye-off-outline" : "eye-outline"
                          }
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
                        onPress={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        <Ionicons
                          name={
                            showConfirmPassword
                              ? "eye-off-outline"
                              : "eye-outline"
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
                  title="Concluir Cadastro"
                  onPress={handleAcceptInvitation}
                  isLoading={isRegistering}
                />

                {/* Change Code */}
                <TouchableOpacity
                  onPress={() => {
                    setIsValid(null);
                    setCode("");
                    setNutritionistName("");
                  }}
                  className="mt-4"
                >
                  <Text className="text-center text-[#572363] font-semibold">
                    Usar outro código
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Help Text */}
            <View className="mt-8 bg-gray-50 rounded-lg p-4">
              <View className="flex-row items-start">
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#6B7280"
                />
                <View className="flex-1 ml-2">
                  <Text className="text-gray-700 text-sm font-semibold mb-1">
                    Como funciona?
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    1. Digite o código de 6 caracteres recebido{"\n"}
                    2. Complete seu cadastro{"\n"}
                    3. Pronto! Você estará vinculado ao seu nutricionista
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
