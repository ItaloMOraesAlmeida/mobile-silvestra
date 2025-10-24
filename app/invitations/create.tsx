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
import * as Clipboard from "expo-clipboard";
import { useAuthStore } from "@/src/stores/auth.store";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/services/api";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

type InviteTab = "email" | "code";

export default function InvitePatientScreen() {
  const { tokens, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<InviteTab>("email");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const handleCreateEmailInvitation = async () => {
    if (!email) {
      Alert.alert("Erro", "Digite o email do paciente");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erro", "Digite um email válido");
      return;
    }

    if (!tokens?.accessToken) return;

    setIsLoading(true);

    try {
      const response = await api.post(
        `${API_URL}/invitations/email`,
        { email },
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );

      const { code } = response.data;

      Alert.alert(
        "Convite Enviado!",
        `Um email foi enviado para ${email} com o código de convite:\n\n${code}\n\nO paciente também pode usar este código para se cadastrar.`,
        [
          {
            text: "Copiar Código",
            onPress: () => {
              Clipboard.setStringAsync(code);
              Alert.alert(
                "Copiado!",
                "Código copiado para a área de transferência"
              );
            },
          },
          { text: "OK" },
        ]
      );

      setEmail("");
      setGeneratedCode(code);
    } catch (error: any) {
      console.error("Error creating email invitation:", error);
      Alert.alert(
        "Erro",
        error?.response?.data?.message || "Falha ao criar convite"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCodeInvitation = async () => {
    if (!tokens?.accessToken) return;

    setIsLoading(true);

    try {
      const response = await api.post(
        `${API_URL}/invitations/code`,
        {},
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );

      const { code } = response.data;
      setGeneratedCode(code);

      Alert.alert(
        "Código Gerado!",
        `Compartilhe este código com seu paciente:\n\n${code}\n\nO código é válido por 7 dias.`,
        [
          {
            text: "Copiar Código",
            onPress: () => {
              Clipboard.setStringAsync(code);
              Alert.alert(
                "Copiado!",
                "Código copiado para a área de transferência"
              );
            },
          },
          { text: "OK" },
        ]
      );
    } catch (error: any) {
      console.error("Error creating code invitation:", error);
      Alert.alert(
        "Erro",
        error?.response?.data?.message || "Falha ao gerar código"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copiado!", "Código copiado para a área de transferência");
  };

  // Check if user is nutritionist
  if (user?.role !== "nutritionist") {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
        <Text className="text-lg text-gray-600 mt-4 text-center">
          Apenas nutricionistas podem convidar pacientes
        </Text>
        <Button title="Voltar" onPress={() => router.back()} className="mt-6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="bg-[#572363] pt-16 pb-8 px-6">
            <View className="flex-row items-center mb-4">
              <TouchableOpacity onPress={() => router.back()} className="mr-4">
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-white">
                Convidar Paciente
              </Text>
            </View>
            <Text className="text-purple-100 text-sm">
              Envie um convite por email ou gere um código para compartilhar
            </Text>
          </View>

          <View className="px-6 -mt-4">
            {/* Tab Selector */}
            <Card className="p-2 mb-4 flex-row">
              <TouchableOpacity
                onPress={() => setActiveTab("email")}
                className={`flex-1 py-3 rounded-lg ${
                  activeTab === "email" ? "bg-[#572363]" : ""
                }`}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={activeTab === "email" ? "white" : "#572363"}
                  />
                  <Text
                    className={`ml-2 font-semibold ${
                      activeTab === "email" ? "text-white" : "text-[#572363]"
                    }`}
                  >
                    Email
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab("code")}
                className={`flex-1 py-3 rounded-lg ${
                  activeTab === "code" ? "bg-[#572363]" : ""
                }`}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons
                    name="key-outline"
                    size={20}
                    color={activeTab === "code" ? "white" : "#572363"}
                  />
                  <Text
                    className={`ml-2 font-semibold ${
                      activeTab === "code" ? "text-white" : "text-[#572363]"
                    }`}
                  >
                    Código
                  </Text>
                </View>
              </TouchableOpacity>
            </Card>

            {/* Email Tab */}
            {activeTab === "email" && (
              <Card className="p-6 mb-4">
                <View className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="mail" size={24} color="#572363" />
                    <Text className="text-lg font-semibold text-gray-900 ml-2">
                      Convite por Email
                    </Text>
                  </View>
                  <Text className="text-gray-600 text-sm leading-5">
                    Digite o email do paciente. Enviaremos um email com o código
                    de convite e instruções para criar a conta.
                  </Text>
                </View>

                <Input
                  placeholder="email@exemplo.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={
                    <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                  }
                  className="mb-4"
                />

                <Button
                  title="Enviar Convite"
                  onPress={handleCreateEmailInvitation}
                  isLoading={isLoading}
                  leftIcon={<Ionicons name="send" size={20} color="white" />}
                />

                {generatedCode && activeTab === "email" && (
                  <View className="mt-4 p-4 bg-purple-50 rounded-lg">
                    <Text className="text-xs text-gray-600 mb-1">
                      Último código gerado:
                    </Text>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xl font-bold text-[#572363]">
                        {generatedCode}
                      </Text>
                      <TouchableOpacity
                        onPress={() => copyToClipboard(generatedCode)}
                      >
                        <Ionicons
                          name="copy-outline"
                          size={24}
                          color="#572363"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </Card>
            )}

            {/* Code Tab */}
            {activeTab === "code" && (
              <Card className="p-6 mb-4">
                <View className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="key" size={24} color="#572363" />
                    <Text className="text-lg font-semibold text-gray-900 ml-2">
                      Gerar Código
                    </Text>
                  </View>
                  <Text className="text-gray-600 text-sm leading-5">
                    Gere um código único para compartilhar com seu paciente. O
                    paciente pode usar este código ao criar a conta.
                  </Text>
                </View>

                <Button
                  title="Gerar Novo Código"
                  onPress={handleCreateCodeInvitation}
                  isLoading={isLoading}
                  leftIcon={<Ionicons name="refresh" size={20} color="white" />}
                />

                {generatedCode && activeTab === "code" && (
                  <View className="mt-4 p-6 bg-purple-50 rounded-lg border-2 border-dashed border-[#572363]">
                    <Text className="text-center text-sm text-gray-600 mb-3">
                      Compartilhe este código com seu paciente
                    </Text>
                    <View className="items-center mb-4">
                      <Text className="text-3xl font-bold text-[#572363] tracking-wider">
                        {generatedCode}
                      </Text>
                    </View>
                    <Button
                      title="Copiar Código"
                      onPress={() => copyToClipboard(generatedCode)}
                      variant="outline"
                      leftIcon={
                        <Ionicons
                          name="copy-outline"
                          size={20}
                          color="#572363"
                        />
                      }
                    />
                  </View>
                )}
              </Card>
            )}

            {/* Info Card */}
            <Card className="p-6 mb-6 bg-blue-50 border border-blue-200">
              <View className="flex-row">
                <Ionicons name="information-circle" size={24} color="#3B82F6" />
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-semibold text-blue-900 mb-2">
                    Como funciona?
                  </Text>
                  <Text className="text-xs text-blue-800 leading-5">
                    • O código é válido por 7 dias{"\n"}• Cada código pode ser
                    usado apenas uma vez{"\n"}• O paciente precisa usar o código
                    ao criar sua conta{"\n"}• Você pode cancelar convites
                    pendentes a qualquer momento
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
