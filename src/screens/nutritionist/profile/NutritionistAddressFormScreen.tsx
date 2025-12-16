import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { nutritionistAddressService } from "../../../services/nutritionist/address.service";
import type { CreateNutritionistAddressDto } from "../../../types/nutritionist/address";

interface NutritionistAddressFormScreenProps {
  navigation: any;
  route?: {
    params?: {
      addressId?: string;
      returnTo?: string;
    };
  };
}

interface FormData {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isPrimary: boolean;
  isServiceLocation: boolean;
}

const INITIAL_FORM_DATA: FormData = {
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  zipCode: "",
  isPrimary: false,
  isServiceLocation: true,
};

export function NutritionistAddressFormScreen({
  navigation,
  route,
}: NutritionistAddressFormScreenProps) {
  const addressId = route?.params?.addressId;
  const returnTo = route?.params?.returnTo;
  const isEditing = !!addressId;

  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );

  useEffect(() => {
    if (addressId) {
      loadAddress();
    } else {
      // Limpa o formulário quando não está editando
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressId]);

  // Limpa o formulário ao desmontar o componente
  useEffect(() => {
    return () => {
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
    };
  }, []);

  const loadAddress = async () => {
    try {
      setLoadingAddress(true);
      const address = await nutritionistAddressService.findOne(addressId!);
      setFormData({
        street: address.street,
        number: address.number,
        complement: address.complement || "",
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        isPrimary: address.isPrimary,
        isServiceLocation: address.isServiceLocation,
      });
    } catch (error: any) {
      console.error("Erro ao carregar endereço:", error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2:
          error.response?.data?.message ||
          "Não foi possível carregar o endereço",
      });
      navigation.goBack();
    } finally {
      setLoadingAddress(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.street.trim()) {
      newErrors.street = "Rua é obrigatória";
    }
    if (!formData.number.trim()) {
      newErrors.number = "Número é obrigatório";
    }
    if (!formData.neighborhood.trim()) {
      newErrors.neighborhood = "Bairro é obrigatório";
    }
    if (!formData.city.trim()) {
      newErrors.city = "Cidade é obrigatória";
    }
    if (!formData.state.trim()) {
      newErrors.state = "Estado é obrigatório";
    } else if (formData.state.trim().length !== 2) {
      newErrors.state = "Estado deve ter 2 letras (ex: SP)";
    }
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = "CEP é obrigatório";
    } else if (!/^\d{5}-?\d{3}$/.test(formData.zipCode.trim())) {
      newErrors.zipCode = "CEP inválido (ex: 12345-678)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Por favor, corrija os erros do formulário",
      });
      return;
    }

    try {
      setLoading(true);

      const payload: CreateNutritionistAddressDto = {
        street: formData.street.trim(),
        number: formData.number.trim(),
        complement: formData.complement.trim() || undefined,
        neighborhood: formData.neighborhood.trim(),
        city: formData.city.trim(),
        state: formData.state.trim().toUpperCase(),
        zipCode: formData.zipCode.trim().replace("-", ""),
        isPrimary: formData.isPrimary,
        isServiceLocation: formData.isServiceLocation,
      };

      if (isEditing) {
        await nutritionistAddressService.update(addressId!, payload);
        Toast.show({
          type: "success",
          text1: "Sucesso",
          text2: "Endereço atualizado com sucesso",
        });
      } else {
        await nutritionistAddressService.create(payload);
        Toast.show({
          type: "success",
          text1: "Sucesso",
          text2: "Endereço cadastrado com sucesso",
        });
      }

      // Limpa o formulário antes de navegar
      setFormData(INITIAL_FORM_DATA);
      setErrors({});

      // Se veio do agendamento, volta direto para lá
      if (returnTo) {
        navigation.navigate(returnTo as never);
      } else {
        navigation.navigate("NutritionistAddressList" as never);
      }
    } catch (error: any) {
      console.error("Erro ao salvar endereço:", error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2:
          error.response?.data?.message || "Não foi possível salvar o endereço",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatZipCode = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length <= 5) {
      return cleaned;
    }
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
  };

  if (loadingAddress) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5a9f" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* CEP */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              CEP <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.zipCode && styles.inputError]}
              value={formData.zipCode}
              onChangeText={(text) => {
                const formatted = formatZipCode(text);
                setFormData({ ...formData, zipCode: formatted });
                if (errors.zipCode) {
                  setErrors({ ...errors, zipCode: undefined });
                }
              }}
              placeholder="12345-678"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={9}
            />
            {errors.zipCode && (
              <Text style={styles.errorText}>{errors.zipCode}</Text>
            )}
          </View>

          {/* Rua */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Rua <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.street && styles.inputError]}
              value={formData.street}
              onChangeText={(text) => {
                setFormData({ ...formData, street: text });
                if (errors.street) {
                  setErrors({ ...errors, street: undefined });
                }
              }}
              placeholder="Nome da rua"
              placeholderTextColor="#999"
            />
            {errors.street && (
              <Text style={styles.errorText}>{errors.street}</Text>
            )}
          </View>

          {/* Número e Complemento */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>
                Número <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.number && styles.inputError]}
                value={formData.number}
                onChangeText={(text) => {
                  setFormData({ ...formData, number: text });
                  if (errors.number) {
                    setErrors({ ...errors, number: undefined });
                  }
                }}
                placeholder="123"
                placeholderTextColor="#999"
              />
              {errors.number && (
                <Text style={styles.errorText}>{errors.number}</Text>
              )}
            </View>

            <View style={[styles.inputGroup, styles.flex2]}>
              <Text style={styles.label}>Complemento</Text>
              <TextInput
                style={styles.input}
                value={formData.complement}
                onChangeText={(text) =>
                  setFormData({ ...formData, complement: text })
                }
                placeholder="Apto 101"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Bairro */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Bairro <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.neighborhood && styles.inputError]}
              value={formData.neighborhood}
              onChangeText={(text) => {
                setFormData({ ...formData, neighborhood: text });
                if (errors.neighborhood) {
                  setErrors({ ...errors, neighborhood: undefined });
                }
              }}
              placeholder="Nome do bairro"
              placeholderTextColor="#999"
            />
            {errors.neighborhood && (
              <Text style={styles.errorText}>{errors.neighborhood}</Text>
            )}
          </View>

          {/* Cidade e Estado */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex2]}>
              <Text style={styles.label}>
                Cidade <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.city && styles.inputError]}
                value={formData.city}
                onChangeText={(text) => {
                  setFormData({ ...formData, city: text });
                  if (errors.city) {
                    setErrors({ ...errors, city: undefined });
                  }
                }}
                placeholder="Nome da cidade"
                placeholderTextColor="#999"
              />
              {errors.city && (
                <Text style={styles.errorText}>{errors.city}</Text>
              )}
            </View>

            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>
                UF <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.state && styles.inputError]}
                value={formData.state}
                onChangeText={(text) => {
                  setFormData({ ...formData, state: text.toUpperCase() });
                  if (errors.state) {
                    setErrors({ ...errors, state: undefined });
                  }
                }}
                placeholder="SP"
                placeholderTextColor="#999"
                maxLength={2}
                autoCapitalize="characters"
              />
              {errors.state && (
                <Text style={styles.errorText}>{errors.state}</Text>
              )}
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Configurações */}
          <View style={styles.settingsGroup}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="star" size={20} color="#f59e0b" />
                <View style={styles.settingTexts}>
                  <Text style={styles.settingLabel}>Endereço Principal</Text>
                  <Text style={styles.settingDescription}>
                    Será exibido como endereço padrão no seu perfil
                  </Text>
                </View>
              </View>
              <Switch
                value={formData.isPrimary}
                onValueChange={(value) =>
                  setFormData({ ...formData, isPrimary: value })
                }
                trackColor={{ false: "#d1d5db", true: "#9b6cb0" }}
                thumbColor={formData.isPrimary ? "#8b5a9f" : "#f4f3f4"}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="medical" size={20} color="#8b5a9f" />
                <View style={styles.settingTexts}>
                  <Text style={styles.settingLabel}>Local de Atendimento</Text>
                  <Text style={styles.settingDescription}>
                    Disponível para agendamento de consultas presenciais
                  </Text>
                </View>
              </View>
              <Switch
                value={formData.isServiceLocation}
                onValueChange={(value) =>
                  setFormData({ ...formData, isServiceLocation: value })
                }
                trackColor={{ false: "#d1d5db", true: "#9b6cb0" }}
                thumbColor={formData.isServiceLocation ? "#8b5a9f" : "#f4f3f4"}
              />
            </View>
          </View>

          {/* Info */}
          {!isEditing && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#8b5a9f" />
              <Text style={styles.infoText}>
                O primeiro endereço cadastrado será automaticamente marcado como
                principal e local de atendimento.
              </Text>
            </View>
          )}

          {/* Botão Salvar */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditing ? "Atualizar" : "Cadastrar"}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  required: {
    color: "#d32f2f",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  inputError: {
    borderColor: "#d32f2f",
  },
  errorText: {
    fontSize: 12,
    color: "#d32f2f",
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 24,
  },
  settingsGroup: {
    gap: 16,
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingTexts: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#f3e8f7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: "#8b5a9f",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 32,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
