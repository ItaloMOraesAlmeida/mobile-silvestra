import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "@/src/stores/auth.store";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Loading } from "@/src/components/ui/Loading";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/services/api";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

interface NutritionistProfile {
  crn?: string;
  specialization?: string;
  bio?: string;
  phone?: string;
  avatarUrl?: string;
}

interface PatientProfile {
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
  nutritionistProfile?: NutritionistProfile;
  patientProfile?: PatientProfile;
}

export default function EditProfileScreen() {
  const { tokens } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Patient fields
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [biologicalSex, setBiologicalSex] = useState("");
  const [phone, setPhone] = useState("");

  // Nutritionist fields
  const [crn, setCrn] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [bio, setBio] = useState("");

  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

  const fetchProfile = React.useCallback(async () => {
    if (!tokens?.accessToken) return;

    try {
      const response = await api.get(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      const profileData: UserProfile = response.data;
      setProfile(profileData);

      // Load existing data
      if (profileData.role === "patient" && profileData.patientProfile) {
        setName(profileData.patientProfile.name || "");
        setGender(profileData.patientProfile.gender || "");
        setBirthDate(profileData.patientProfile.birthDate || "");
        setBiologicalSex(profileData.patientProfile.biologicalSex || "");
        setPhone(profileData.patientProfile.phone || "");
        setAvatarUrl(profileData.patientProfile.avatarUrl);
      } else if (
        profileData.role === "nutritionist" &&
        profileData.nutritionistProfile
      ) {
        setCrn(profileData.nutritionistProfile.crn || "");
        setSpecialization(profileData.nutritionistProfile.specialization || "");
        setBio(profileData.nutritionistProfile.bio || "");
        setPhone(profileData.nutritionistProfile.phone || "");
        setAvatarUrl(profileData.nutritionistProfile.avatarUrl);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Erro", "Falha ao carregar perfil");
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [tokens?.accessToken]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handlePickAvatar = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permissão necessária",
        "Precisamos de permissão para acessar suas fotos"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!tokens?.accessToken) return;

    setIsUploadingAvatar(true);

    try {
      // Create form data
      const formData = new FormData();
      const filename = uri.split("/").pop() || "avatar.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("file", {
        uri,
        name: filename,
        type,
      } as any);

      const response = await api.post(`${API_URL}/users/me/avatar`, formData, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setAvatarUrl(response.data.avatarUrl);
      Alert.alert("Sucesso", "Avatar atualizado com sucesso!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      Alert.alert("Erro", "Falha ao fazer upload do avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!profile || !tokens?.accessToken) return;

    setIsSaving(true);

    try {
      const isNutritionist = profile.role === "nutritionist";

      if (isNutritionist) {
        await api.patch(
          `${API_URL}/users/me/nutritionist`,
          {
            crn: crn || undefined,
            specialization: specialization || undefined,
            bio: bio || undefined,
            phone: phone || undefined,
          },
          {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          }
        );
      } else {
        if (!name) {
          Alert.alert("Erro", "Nome é obrigatório");
          setIsSaving(false);
          return;
        }

        await api.patch(
          `${API_URL}/users/me/patient`,
          {
            name,
            gender: gender || undefined,
            birthDate: birthDate || undefined,
            biologicalSex: biologicalSex || undefined,
            phone: phone || undefined,
          },
          {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          }
        );
      }

      // Refresh profile
      await fetchProfile();

      Alert.alert("Sucesso", "Perfil atualizado com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert(
        "Erro",
        error?.response?.data?.message || "Falha ao atualizar perfil"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Loading size="large" />
      </View>
    );
  }

  if (!profile) {
    return null;
  }

  const isNutritionist = profile.role === "nutritionist";

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
                Editar Perfil
              </Text>
            </View>
          </View>

          <View className="px-6 -mt-4">
            {/* Avatar Section */}
            <Card className="p-6 mb-4">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Foto de Perfil
              </Text>

              <View className="items-center">
                <View className="relative mb-4">
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      className="w-32 h-32 rounded-full"
                    />
                  ) : (
                    <View className="w-32 h-32 rounded-full bg-purple-100 items-center justify-center">
                      <Ionicons name="person" size={64} color="#572363" />
                    </View>
                  )}

                  {isUploadingAvatar && (
                    <View className="absolute inset-0 bg-black/50 rounded-full items-center justify-center">
                      <Loading size="small" color="white" />
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={handlePickAvatar}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 bg-[#572363] rounded-full p-3"
                  >
                    <Ionicons name="camera" size={20} color="white" />
                  </TouchableOpacity>
                </View>

                <Text className="text-sm text-gray-500 text-center">
                  Toque no ícone da câmera para alterar sua foto
                </Text>
              </View>
            </Card>

            {/* Patient Form */}
            {!isNutritionist && (
              <Card className="p-6 mb-4">
                <Text className="text-lg font-semibold text-gray-900 mb-4">
                  Informações Pessoais
                </Text>

                <View className="gap-4">
                  <Input
                    placeholder="Nome completo *"
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
                    placeholder="Gênero"
                    value={gender}
                    onChangeText={setGender}
                    leftIcon={
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color="#9CA3AF"
                      />
                    }
                  />

                  <Input
                    placeholder="Data de Nascimento (DD/MM/AAAA)"
                    value={birthDate}
                    onChangeText={setBirthDate}
                    leftIcon={
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#9CA3AF"
                      />
                    }
                  />

                  <Input
                    placeholder="Sexo Biológico"
                    value={biologicalSex}
                    onChangeText={setBiologicalSex}
                    leftIcon={
                      <Ionicons
                        name="fitness-outline"
                        size={20}
                        color="#9CA3AF"
                      />
                    }
                  />

                  <Input
                    placeholder="Telefone"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    leftIcon={
                      <Ionicons name="call-outline" size={20} color="#9CA3AF" />
                    }
                  />
                </View>
              </Card>
            )}

            {/* Nutritionist Form */}
            {isNutritionist && (
              <Card className="p-6 mb-4">
                <Text className="text-lg font-semibold text-gray-900 mb-4">
                  Informações Profissionais
                </Text>

                <View className="gap-4">
                  <Input
                    placeholder="CRN"
                    value={crn}
                    onChangeText={setCrn}
                    autoCapitalize="characters"
                    leftIcon={
                      <Ionicons name="card-outline" size={20} color="#9CA3AF" />
                    }
                  />

                  <Input
                    placeholder="Especialização"
                    value={specialization}
                    onChangeText={setSpecialization}
                    leftIcon={
                      <Ionicons
                        name="school-outline"
                        size={20}
                        color="#9CA3AF"
                      />
                    }
                  />

                  <Input
                    placeholder="Telefone"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    leftIcon={
                      <Ionicons name="call-outline" size={20} color="#9CA3AF" />
                    }
                  />

                  <View>
                    <Text className="text-sm text-gray-600 mb-2">Bio</Text>
                    <Input
                      placeholder="Conte um pouco sobre você..."
                      value={bio}
                      onChangeText={setBio}
                      multiline
                      numberOfLines={4}
                      style={{ height: 100, textAlignVertical: "top" }}
                    />
                  </View>
                </View>
              </Card>
            )}

            {/* Save Button */}
            <Button
              title="Salvar Alterações"
              onPress={handleSave}
              isLoading={isSaving}
              className="mb-6"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
