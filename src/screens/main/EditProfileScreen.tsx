import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";
import { useAuthStore } from "../../stores/auth.store";
import { api } from "../../services/api.service";
import Toast from "react-native-toast-message";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { nutritionistAddressService } from "../../services/nutritionist/address.service";
import type { NutritionistAddress } from "../../types/nutritionist/address";

interface FormData {
  // Dados básicos (User)
  name: string;
  phone: string;

  // Dados de paciente
  cpf?: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  birthDate?: string;
  biologicalSex?: "MALE" | "FEMALE";

  // Dados de nutricionista
  crn?: string;
  specialization?: string;
  bio?: string;
}

export function EditProfileScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [isSaving, setIsSaving] = useState(false);
  const [addresses, setAddresses] = useState<NutritionistAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
  });

  const loadUserData = React.useCallback(() => {
    if (!user) return;

    const data: FormData = {
      name: user.name || "",
      phone: user.phone || "",
      // Campos agora estão diretamente no User (não mais no PatientProfile)
      cpf: user.cpf || "",
      gender: user.gender as any,
      birthDate: user.birthDate ? formatDateForDisplay(user.birthDate) : "",
      biologicalSex: user.biologicalSex as any,
    };

    // Se for nutricionista, carregar dados do perfil de nutricionista
    if (user.nutritionistProfile) {
      data.crn = user.nutritionistProfile.crn || "";
      data.specialization = user.nutritionistProfile.specialization || "";
      data.bio = user.nutritionistProfile.bio || "";
    }

    setFormData(data);
  }, [user]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const loadAddresses = React.useCallback(async () => {
    if (!user?.nutritionistProfile) return;

    try {
      setLoadingAddresses(true);
      const data = await nutritionistAddressService.findAll();
      setAddresses(data);
    } catch (error) {
      console.error("Erro ao carregar endereços:", error);
    } finally {
      setLoadingAddresses(false);
    }
  }, [user]);

  // Recarrega endereços quando a tela ganha foco
  useFocusEffect(
    React.useCallback(() => {
      if (user?.nutritionistProfile) {
        loadAddresses();
      }
    }, [user, loadAddresses])
  );

  const formatDateForDisplay = (isoDate: string): string => {
    try {
      // Pegar apenas a data sem considerar horário (evita problema de fuso horário)
      const [datePart] = isoDate.split("T");
      const [year, month, day] = datePart.split("-");
      return `${day}/${month}/${year}`;
    } catch {
      return "";
    }
  };

  const formatDateForAPI = (displayDate: string): string => {
    try {
      const [day, month, year] = displayDate.split("/");
      // Usar meio-dia (12:00) para evitar problema de fuso horário
      return new Date(`${year}-${month}-${day}T12:00:00.000Z`).toISOString();
    } catch {
      return "";
    }
  };

  const handleDateChange = (text: string) => {
    // Remove tudo que não é número
    let cleaned = text.replace(/\D/g, "");

    // Limita a 8 dígitos (DDMMYYYY)
    cleaned = cleaned.substring(0, 8);

    // Formata como DD/MM/YYYY
    let formatted = cleaned;
    if (cleaned.length >= 3) {
      formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2)}`;
    }
    if (cleaned.length >= 5) {
      formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(
        2,
        4
      )}/${cleaned.substring(4)}`;
    }

    setFormData({ ...formData, birthDate: formatted });
  };

  const handlePhoneChange = (text: string) => {
    // Remove tudo que não é número
    let cleaned = text.replace(/\D/g, "");

    // Limita a 11 dígitos
    cleaned = cleaned.substring(0, 11);

    // Formata como (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    let formatted = cleaned;
    if (cleaned.length >= 3) {
      formatted = `(${cleaned.substring(0, 2)}) ${cleaned.substring(2)}`;
    }
    if (cleaned.length >= 7) {
      const part1 = cleaned.substring(0, 2);
      const part2 = cleaned.substring(2, cleaned.length === 11 ? 7 : 6);
      const part3 = cleaned.substring(cleaned.length === 11 ? 7 : 6);
      formatted = `(${part1}) ${part2}-${part3}`;
    }

    setFormData({ ...formData, phone: formatted });
  };

  const handleCpfChange = (text: string) => {
    // Remove tudo que não é número
    let cleaned = text.replace(/\D/g, "");

    // Limita a 11 dígitos
    cleaned = cleaned.substring(0, 11);

    // Formata como XXX.XXX.XXX-XX
    let formatted = cleaned;
    if (cleaned.length >= 4) {
      formatted = `${cleaned.substring(0, 3)}.${cleaned.substring(3)}`;
    }
    if (cleaned.length >= 7) {
      formatted = `${cleaned.substring(0, 3)}.${cleaned.substring(
        3,
        6
      )}.${cleaned.substring(6)}`;
    }
    if (cleaned.length >= 10) {
      formatted = `${cleaned.substring(0, 3)}.${cleaned.substring(
        3,
        6
      )}.${cleaned.substring(6, 9)}-${cleaned.substring(9)}`;
    }

    setFormData({ ...formData, cpf: formatted });
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Toast.show({
        type: "error",
        text1: "Nome obrigatório",
        text2: "Por favor, preencha seu nome",
        position: "top",
        visibilityTime: 3000,
      });
      return false;
    }

    // Validar data de nascimento se preenchida
    if (formData.birthDate && formData.birthDate.length === 10) {
      const [day, month, year] = formData.birthDate.split("/").map(Number);
      const date = new Date(year, month - 1, day);

      if (isNaN(date.getTime()) || date > new Date()) {
        Toast.show({
          type: "error",
          text1: "Data inválida",
          text2: "Por favor, insira uma data de nascimento válida",
          position: "top",
          visibilityTime: 3000,
        });
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);

    try {
      // 1. Atualizar dados do usuário (agora incluindo cpf, gender, birthDate, biologicalSex)
      const userData: any = {
        name: formData.name.trim(),
        phone: formData.phone.replace(/\D/g, ""), // Remove formatação
      };

      // Adicionar campos pessoais (disponíveis para todos os usuários)
      if (formData.cpf) {
        userData.cpf = formData.cpf.replace(/\D/g, "");
      }
      if (formData.gender) {
        userData.gender = formData.gender;
      }
      if (formData.birthDate && formData.birthDate.length === 10) {
        userData.birthDate = formatDateForAPI(formData.birthDate);
      }
      if (formData.biologicalSex) {
        userData.biologicalSex = formData.biologicalSex;
      }

      await api.patch("/users/me", userData);

      // 2. Se for nutricionista, atualizar perfil de nutricionista
      if (user?.nutritionistProfile) {
        const nutritionistData: any = {};

        if (formData.crn) {
          nutritionistData.crn = formData.crn.trim();
        }
        if (formData.specialization) {
          nutritionistData.specialization = formData.specialization.trim();
        }
        if (formData.bio) {
          nutritionistData.bio = formData.bio.trim();
        }

        if (Object.keys(nutritionistData).length > 0) {
          await api.patch("/users/me/nutritionist", nutritionistData);
        }
      }

      // 3. Recarregar perfil atualizado
      const response = await api.get("/users/me");
      setUser(response.data);

      Toast.show({
        type: "success",
        text1: "Sucesso!",
        text2: "Perfil atualizado com sucesso",
        position: "top",
        visibilityTime: 3000,
      });

      // Voltar para o perfil
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao salvar",
        text2:
          error.response?.data?.message ||
          "Não foi possível salvar as alterações",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={lightTheme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Dados Básicos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados Básicos</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Nome Completo <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Seu nome completo"
              placeholderTextColor={lightTheme.colors.gray[400]}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user.email}
              editable={false}
              placeholderTextColor={lightTheme.colors.gray[400]}
            />
            <Text style={styles.helperText}>O email não pode ser alterado</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={handlePhoneChange}
              placeholder="(00) 00000-0000"
              placeholderTextColor={lightTheme.colors.gray[400]}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>
        </View>

        {/* Informações Pessoais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CPF</Text>
            <TextInput
              style={styles.input}
              value={formData.cpf}
              onChangeText={handleCpfChange}
              placeholder="000.000.000-00"
              placeholderTextColor={lightTheme.colors.gray[400]}
              keyboardType="numeric"
              maxLength={14}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data de Nascimento</Text>
            <TextInput
              style={styles.input}
              value={formData.birthDate}
              onChangeText={handleDateChange}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={lightTheme.colors.gray[400]}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gênero</Text>
            <View style={styles.radioGroup}>
              {[
                { value: "MALE", label: "Masculino" },
                { value: "FEMALE", label: "Feminino" },
                { value: "OTHER", label: "Outro" },
                { value: "PREFER_NOT_TO_SAY", label: "Prefiro não dizer" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.radioOption}
                  onPress={() => {
                    const newFormData = {
                      ...formData,
                      gender: option.value as any,
                    };
                    // Se gênero for masculino ou feminino, preenche automaticamente o sexo biológico
                    if (option.value === "MALE" || option.value === "FEMALE") {
                      newFormData.biologicalSex = option.value as any;
                    }
                    setFormData(newFormData);
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      formData.gender === option.value &&
                        styles.radioCircleSelected,
                    ]}
                  >
                    {formData.gender === option.value && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sexo Biológico</Text>
            <View style={styles.radioGroup}>
              {[
                { value: "MALE", label: "Masculino" },
                { value: "FEMALE", label: "Feminino" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.radioOption}
                  onPress={() =>
                    setFormData({
                      ...formData,
                      biologicalSex: option.value as any,
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      formData.biologicalSex === option.value &&
                        styles.radioCircleSelected,
                    ]}
                  >
                    {formData.biologicalSex === option.value && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Dados do Nutricionista */}
        {user.nutritionistProfile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados Profissionais</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CRN</Text>
              <TextInput
                style={styles.input}
                value={formData.crn}
                onChangeText={(text) => setFormData({ ...formData, crn: text })}
                placeholder="Número do CRN"
                placeholderTextColor={lightTheme.colors.gray[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Especialização</Text>
              <TextInput
                style={styles.input}
                value={formData.specialization}
                onChangeText={(text) =>
                  setFormData({ ...formData, specialization: text })
                }
                placeholder="Ex: Nutrição Esportiva"
                placeholderTextColor={lightTheme.colors.gray[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Biografia</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                placeholder="Conte um pouco sobre você e sua experiência..."
                placeholderTextColor={lightTheme.colors.gray[400]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Endereços Cadastrados */}
            {loadingAddresses ? (
              <View style={styles.addressLoadingContainer}>
                <ActivityIndicator size="small" color="#8b5a9f" />
                <Text style={styles.addressLoadingText}>
                  Carregando endereços...
                </Text>
              </View>
            ) : addresses.length > 0 ? (
              <View style={styles.addressesSection}>
                <Text style={styles.addressesSectionTitle}>Meus Endereços</Text>
                {(() => {
                  const primaryAddress = addresses.find((a) => a.isPrimary);
                  const serviceAddress = addresses.find(
                    (a) => a.isServiceLocation
                  );
                  const isSameAddress =
                    primaryAddress &&
                    serviceAddress &&
                    primaryAddress.id === serviceAddress.id;

                  return (
                    <View style={styles.addressesContainer}>
                      {primaryAddress && (
                        <View style={styles.addressCard}>
                          <View style={styles.addressCardHeader}>
                            <Ionicons name="home" size={18} color="#8b5a9f" />
                            <Text style={styles.addressCardTitle}>
                              {isSameAddress
                                ? "Endereço Principal e de Atendimento"
                                : "Endereço Principal"}
                            </Text>
                          </View>
                          <Text style={styles.addressCardText}>
                            {primaryAddress.street}, {primaryAddress.number}
                          </Text>
                          <Text style={styles.addressCardText}>
                            {primaryAddress.neighborhood} -{" "}
                            {primaryAddress.city}/{primaryAddress.state}
                          </Text>
                          <Text style={styles.addressCardText}>
                            CEP: {primaryAddress.zipCode}
                          </Text>
                        </View>
                      )}

                      {!isSameAddress && serviceAddress && (
                        <View style={styles.addressCard}>
                          <View style={styles.addressCardHeader}>
                            <Ionicons
                              name="medical"
                              size={18}
                              color="#8b5a9f"
                            />
                            <Text style={styles.addressCardTitle}>
                              Local de Atendimento
                            </Text>
                          </View>
                          <Text style={styles.addressCardText}>
                            {serviceAddress.street}, {serviceAddress.number}
                          </Text>
                          <Text style={styles.addressCardText}>
                            {serviceAddress.neighborhood} -{" "}
                            {serviceAddress.city}/{serviceAddress.state}
                          </Text>
                          <Text style={styles.addressCardText}>
                            CEP: {serviceAddress.zipCode}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })()}
              </View>
            ) : null}

            {/* Gerenciamento de Endereços */}
            <TouchableOpacity
              style={styles.manageAddressButton}
              onPress={() =>
                navigation.navigate("NutritionistAddressList" as never)
              }
              activeOpacity={0.7}
            >
              <View style={styles.manageAddressContent}>
                <View style={styles.manageAddressIconContainer}>
                  <Ionicons name="location" size={20} color="#ffffff" />
                </View>
                <View style={styles.manageAddressTextContainer}>
                  <Text style={styles.manageAddressTitle}>
                    Locais de Atendimento
                  </Text>
                  <Text style={styles.manageAddressSubtitle}>
                    {addresses.length > 0
                      ? `${addresses.length} endereço${
                          addresses.length > 1 ? "s" : ""
                        } cadastrado${addresses.length > 1 ? "s" : ""}`
                      : "Gerencie seus endereços"}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        )}

        {/* Botão Salvar */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={lightTheme.colors.primary} />
          ) : (
            <Text style={styles.saveButtonText}>Salvar</Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: lightTheme.colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: lightTheme.spacing.xl,
    paddingTop: lightTheme.spacing.lg,
    paddingBottom: lightTheme.spacing.xl,
  },
  section: {
    marginBottom: lightTheme.spacing.xl,
  },
  sectionTitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[600],
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: lightTheme.spacing.md,
  },
  inputGroup: {
    marginBottom: lightTheme.spacing.lg,
  },
  label: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[700],
    marginBottom: lightTheme.spacing.xs,
  },
  required: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: lightTheme.colors.white,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    borderRadius: lightTheme.borderRadius.lg,
    paddingHorizontal: lightTheme.spacing.lg,
    paddingVertical: lightTheme.spacing.md,
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[900],
  },
  inputDisabled: {
    backgroundColor: lightTheme.colors.gray[100],
    color: lightTheme.colors.gray[500],
  },
  textArea: {
    minHeight: 120,
    paddingTop: lightTheme.spacing.md,
  },
  helperText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginTop: lightTheme.spacing.xs,
  },
  radioGroup: {
    gap: lightTheme.spacing.sm,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: lightTheme.spacing.sm,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: lightTheme.colors.gray[300],
    alignItems: "center",
    justifyContent: "center",
    marginRight: lightTheme.spacing.sm,
  },
  radioCircleSelected: {
    borderColor: lightTheme.colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: lightTheme.colors.primary,
  },
  radioLabel: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[700],
  },
  addressLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: lightTheme.spacing.lg,
    backgroundColor: lightTheme.colors.white,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    borderRadius: lightTheme.borderRadius.lg,
    marginTop: lightTheme.spacing.md,
  },
  addressLoadingText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
  },
  addressesSection: {
    marginTop: lightTheme.spacing.md,
  },
  addressesSectionTitle: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing.sm,
  },
  addressesContainer: {
    gap: lightTheme.spacing.sm,
  },
  addressCard: {
    backgroundColor: lightTheme.colors.white,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.md,
  },
  addressCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: lightTheme.spacing.xs,
  },
  addressCardTitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.primary,
  },
  addressCardText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[700],
    lineHeight: 20,
  },
  manageAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: lightTheme.colors.white,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.lg,
    marginTop: lightTheme.spacing.md,
  },
  manageAddressContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.md,
    flex: 1,
  },
  manageAddressIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: lightTheme.colors.primaryLight,
    borderRadius: lightTheme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  manageAddressTextContainer: {
    flex: 1,
  },
  manageAddressTitle: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[900],
    marginBottom: 2,
  },
  manageAddressSubtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
  },
  saveButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: lightTheme.colors.white,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: lightTheme.spacing.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.primary,
    shadowColor: lightTheme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600" as any,
    color: lightTheme.colors.primary,
    letterSpacing: 0.3,
  },
  bottomSpacer: {
    height: lightTheme.spacing.xl,
  },
});
