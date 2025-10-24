import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/src/stores/auth.store";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Loading } from "@/src/components/ui/Loading";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/services/api";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

interface NutritionistProfile {
  id: string;
  crn?: string;
  specialization?: string;
  bio?: string;
  phone?: string;
  avatarUrl?: string;
}

interface PatientProfile {
  id: string;
  name: string;
  gender?: string;
  birthDate?: string;
  phone?: string;
  biologicalSex?: string;
  avatarUrl?: string;
}

interface UserProfile {
  id: string;
  email: string;
  role: string;
  provider: string;
  isActive: boolean;
  createdAt: string;
  nutritionistProfile?: NutritionistProfile;
  patientProfile?: PatientProfile;
}

export default function ProfileScreen() {
  const { tokens, logout } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchProfile = React.useCallback(async () => {
    if (!tokens?.accessToken) return;

    try {
      const response = await api.get(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      setProfile(response.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Erro", "Falha ao carregar perfil");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [tokens?.accessToken]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProfile();
  };

  const handleLogout = async () => {
    Alert.alert("Sair", "Deseja realmente sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await logout();
          // TODO: Navigate to auth/login when route is available
          router.replace("/(tabs)");
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    // TODO: Navigate to profile/edit when route is available
    Alert.alert(
      "Em desenvolvimento",
      "A edição de perfil será implementada em breve"
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Loading size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
        <Text className="text-lg text-gray-600 mt-4 text-center">
          Não foi possível carregar o perfil
        </Text>
        <Button
          title="Tentar novamente"
          onPress={fetchProfile}
          className="mt-6"
        />
      </View>
    );
  }

  const isNutritionist = profile.role === "nutritionist";
  const profileData = isNutritionist
    ? profile.nutritionistProfile
    : profile.patientProfile;
  const avatarUrl = profileData?.avatarUrl;
  const displayName = isNutritionist
    ? profile.email.split("@")[0]
    : profile.patientProfile?.name || profile.email.split("@")[0];

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header with gradient background */}
        <View className="bg-[#572363] pt-16 pb-24 px-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-white">Meu Perfil</Text>
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Card (overlapping header) */}
        <View className="px-6 -mt-16">
          <Card className="p-6">
            {/* Avatar and Name */}
            <View className="items-center mb-6">
              <View className="relative mb-4">
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    className="w-24 h-24 rounded-full"
                  />
                ) : (
                  <View className="w-24 h-24 rounded-full bg-purple-100 items-center justify-center">
                    <Ionicons name="person" size={48} color="#572363" />
                  </View>
                )}
                <View className="absolute bottom-0 right-0 bg-[#572363] rounded-full p-2">
                  <Ionicons name="camera" size={16} color="white" />
                </View>
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-1">
                {displayName}
              </Text>
              <View className="flex-row items-center bg-purple-50 px-3 py-1 rounded-full">
                <Ionicons
                  name={isNutritionist ? "medkit" : "person"}
                  size={14}
                  color="#572363"
                />
                <Text className="text-sm text-[#572363] font-semibold ml-1">
                  {isNutritionist ? "Nutricionista" : "Paciente"}
                </Text>
              </View>
            </View>

            {/* Edit Profile Button */}
            <Button
              title="Editar Perfil"
              onPress={handleEditProfile}
              variant="outline"
              leftIcon={
                <Ionicons name="create-outline" size={20} color="#572363" />
              }
            />
          </Card>

          {/* Information Section */}
          <Card className="p-6 mt-4">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Informações Pessoais
            </Text>

            {/* Email */}
            <View className="flex-row items-center py-3 border-b border-gray-100">
              <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center mr-3">
                <Ionicons name="mail-outline" size={20} color="#572363" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Email</Text>
                <Text className="text-base text-gray-900">{profile.email}</Text>
              </View>
            </View>

            {/* Phone */}
            {profileData?.phone && (
              <View className="flex-row items-center py-3 border-b border-gray-100">
                <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center mr-3">
                  <Ionicons name="call-outline" size={20} color="#572363" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Telefone</Text>
                  <Text className="text-base text-gray-900">
                    {profileData.phone}
                  </Text>
                </View>
              </View>
            )}

            {/* Nutritionist specific fields */}
            {isNutritionist && profile.nutritionistProfile && (
              <>
                {profile.nutritionistProfile.crn && (
                  <View className="flex-row items-center py-3 border-b border-gray-100">
                    <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center mr-3">
                      <Ionicons name="card-outline" size={20} color="#572363" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 mb-1">CRN</Text>
                      <Text className="text-base text-gray-900">
                        {profile.nutritionistProfile.crn}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.nutritionistProfile.specialization && (
                  <View className="flex-row items-center py-3 border-b border-gray-100">
                    <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center mr-3">
                      <Ionicons
                        name="school-outline"
                        size={20}
                        color="#572363"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 mb-1">
                        Especialização
                      </Text>
                      <Text className="text-base text-gray-900">
                        {profile.nutritionistProfile.specialization}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.nutritionistProfile.bio && (
                  <View className="py-3">
                    <Text className="text-xs text-gray-500 mb-2">Bio</Text>
                    <Text className="text-base text-gray-700 leading-6">
                      {profile.nutritionistProfile.bio}
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Patient specific fields */}
            {!isNutritionist && profile.patientProfile && (
              <>
                {profile.patientProfile.gender && (
                  <View className="flex-row items-center py-3 border-b border-gray-100">
                    <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center mr-3">
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color="#572363"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 mb-1">Gênero</Text>
                      <Text className="text-base text-gray-900">
                        {profile.patientProfile.gender}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.patientProfile.birthDate && (
                  <View className="flex-row items-center py-3 border-b border-gray-100">
                    <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center mr-3">
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#572363"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 mb-1">
                        Data de Nascimento
                      </Text>
                      <Text className="text-base text-gray-900">
                        {new Date(
                          profile.patientProfile.birthDate
                        ).toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                  </View>
                )}

                {profile.patientProfile.biologicalSex && (
                  <View className="flex-row items-center py-3">
                    <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center mr-3">
                      <Ionicons
                        name="fitness-outline"
                        size={20}
                        color="#572363"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 mb-1">
                        Sexo Biológico
                      </Text>
                      <Text className="text-base text-gray-900">
                        {profile.patientProfile.biologicalSex}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </Card>

          {/* Account Information */}
          <Card className="p-6 mt-4 mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Informações da Conta
            </Text>

            <View className="flex-row items-center py-3 border-b border-gray-100">
              <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center mr-3">
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color="#572363"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Status</Text>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  <Text className="text-base text-gray-900">
                    {profile.isActive ? "Ativa" : "Inativa"}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center py-3 border-b border-gray-100">
              <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center mr-3">
                <Ionicons name="logo-google" size={20} color="#572363" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">
                  Método de Login
                </Text>
                <Text className="text-base text-gray-900 capitalize">
                  {profile.provider === "google" ? "Google" : profile.provider}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center py-3">
              <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center mr-3">
                <Ionicons name="time-outline" size={20} color="#572363" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Membro desde</Text>
                <Text className="text-base text-gray-900">
                  {new Date(profile.createdAt).toLocaleDateString("pt-BR")}
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
