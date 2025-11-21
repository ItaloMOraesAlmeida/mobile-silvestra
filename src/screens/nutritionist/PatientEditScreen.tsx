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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { lightTheme } from "../../theme";
import { api } from "../../services/api";
import {
  applyPhoneMask,
  removePhoneMask,
  applyCpfMask,
  removeCpfMask,
  applyDateMask,
  dateToISO,
  isoToDate,
} from "../../utils/mask.utils";

type FormData = {
  name: string;
  phone?: string;
  cpf?: string;
  birthDate?: string;
  gender?: string;
  biologicalSex?: string;
  notes?: string;
};

interface PatientEditScreenProps {
  route: {
    params: {
      patientId: string;
      patient: any;
    };
  };
  navigation: any;
}

export function PatientEditScreen({
  route,
  navigation,
}: PatientEditScreenProps) {
  const patientId = route?.params?.patientId;
  const patient = route?.params?.patient;
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, setValue } = useForm<FormData>({
    defaultValues: {
      name: "",
      phone: "",
      cpf: "",
      birthDate: "",
      gender: "",
      biologicalSex: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (patient) {
      // Preencher formulário com dados do paciente
      setValue("name", patient.patient?.name || "");
      setValue(
        "phone",
        patient.patient?.phone ? applyPhoneMask(patient.patient.phone) : ""
      );
      setValue(
        "cpf",
        patient.patient?.cpf ? applyCpfMask(patient.patient.cpf) : ""
      );
      setValue(
        "birthDate",
        patient.patient?.birthDate ? isoToDate(patient.patient.birthDate) : ""
      );
      setValue("gender", patient.patient?.gender || "");
      setValue("biologicalSex", patient.patient?.biologicalSex || "");
      setValue("notes", patient.notes || "");
    }
  }, [patient, setValue]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setSubmitError(null);

    try {
      // Remove máscaras e converte data
      const cleanedData = {
        name: data.name,
        phone: data.phone ? removePhoneMask(data.phone) : undefined,
        cpf: data.cpf ? removeCpfMask(data.cpf) : undefined,
        birthDate: data.birthDate ? dateToISO(data.birthDate) : undefined,
        gender: data.gender || undefined,
        biologicalSex: data.biologicalSex || undefined,
        notes: data.notes,
      };

      // Atualizar dados do paciente (usuário + notas) em uma única chamada
      await api.patch(`/patients/${patientId}/user-data`, cleanedData);

      Alert.alert("Sucesso!", "Dados do paciente atualizados com sucesso.", [
        {
          text: "OK",
          onPress: () => {
            navigation.navigate("PatientDetails", { patientId });
          },
        },
      ]);
    } catch (err: any) {
      console.error("❌ [PATIENT_EDIT] Erro ao atualizar paciente:", err);
      setSubmitError(
        err?.response?.data?.message ||
          err.message ||
          "Erro ao atualizar paciente"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card de Dados Pessoais */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="person-outline"
                size={20}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.cardTitle}>Dados Pessoais</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome Completo</Text>
              <Controller
                control={control}
                name="name"
                rules={{ required: "Nome é obrigatório" }}
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="person"
                      size={18}
                      color={lightTheme.colors.gray[400]}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Digite o nome completo"
                      placeholderTextColor={lightTheme.colors.gray[400]}
                      value={value}
                      onChangeText={onChange}
                    />
                  </View>
                )}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefone</Text>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="call"
                      size={18}
                      color={lightTheme.colors.gray[400]}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="(00) 00000-0000"
                      placeholderTextColor={lightTheme.colors.gray[400]}
                      keyboardType="phone-pad"
                      value={value}
                      onChangeText={(text) => onChange(applyPhoneMask(text))}
                      maxLength={15}
                    />
                  </View>
                )}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CPF</Text>
              <Controller
                control={control}
                name="cpf"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="card"
                      size={18}
                      color={lightTheme.colors.gray[400]}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="000.000.000-00"
                      placeholderTextColor={lightTheme.colors.gray[400]}
                      keyboardType="number-pad"
                      value={value}
                      onChangeText={(text) => onChange(applyCpfMask(text))}
                      maxLength={14}
                    />
                  </View>
                )}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Data de Nascimento</Text>
              <Controller
                control={control}
                name="birthDate"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="calendar"
                      size={18}
                      color={lightTheme.colors.gray[400]}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="DD/MM/AAAA"
                      placeholderTextColor={lightTheme.colors.gray[400]}
                      keyboardType="number-pad"
                      value={value}
                      onChangeText={(text) => onChange(applyDateMask(text))}
                      maxLength={10}
                    />
                  </View>
                )}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gênero / Identidade</Text>
              <Controller
                control={control}
                name="gender"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.pickerWrapper}>
                    <Ionicons
                      name="people"
                      size={18}
                      color={lightTheme.colors.gray[400]}
                      style={styles.inputIcon}
                    />
                    <Picker
                      selectedValue={value}
                      onValueChange={onChange}
                      style={styles.picker}
                    >
                      <Picker.Item label="Selecione o gênero" value="" />
                      <Picker.Item label="Masculino" value="MALE" />
                      <Picker.Item label="Feminino" value="FEMALE" />
                      <Picker.Item label="Outro" value="OTHER" />
                      <Picker.Item
                        label="Prefiro não informar"
                        value="PREFER_NOT_TO_SAY"
                      />
                    </Picker>
                  </View>
                )}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sexo Biológico</Text>
              <Controller
                control={control}
                name="biologicalSex"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.pickerWrapper}>
                    <Ionicons
                      name="medical"
                      size={18}
                      color={lightTheme.colors.gray[400]}
                      style={styles.inputIcon}
                    />
                    <Picker
                      selectedValue={value}
                      onValueChange={onChange}
                      style={styles.picker}
                    >
                      <Picker.Item
                        label="Selecione o sexo biológico"
                        value=""
                      />
                      <Picker.Item label="Masculino" value="MALE" />
                      <Picker.Item label="Feminino" value="FEMALE" />
                    </Picker>
                  </View>
                )}
              />
            </View>
          </View>

          {/* Card de Observações */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.cardTitle}>Observações</Text>
            </View>

            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.textArea}
                  placeholder="Observações sobre o paciente..."
                  placeholderTextColor={lightTheme.colors.gray[400]}
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              )}
            />
          </View>

          {/* Mensagem de erro */}
          {submitError && (
            <View style={[styles.statusMessage, styles.statusError]}>
              <Ionicons
                name="alert-circle"
                size={20}
                color={lightTheme.colors.error}
              />
              <Text style={styles.statusTextError}>{submitError}</Text>
            </View>
          )}

          {/* Botões de ação */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => navigation.goBack()}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonTextSecondary}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonPrimary,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={lightTheme.colors.white} />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={lightTheme.colors.white}
                  />
                  <Text style={styles.buttonText}>Salvar Alterações</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: lightTheme.spacing.lg,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.lg,
    marginBottom: lightTheme.spacing.lg,
    ...lightTheme.shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: lightTheme.spacing.md,
    paddingBottom: lightTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  cardTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[800],
    marginLeft: lightTheme.spacing.sm,
  },
  inputGroup: {
    marginBottom: lightTheme.spacing.md,
  },
  label: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[700],
    marginBottom: lightTheme.spacing.xs,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: lightTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    paddingHorizontal: lightTheme.spacing.md,
  },
  inputIcon: {
    marginRight: lightTheme.spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[800],
  },
  pickerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: lightTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    paddingLeft: lightTheme.spacing.md,
    overflow: "hidden",
  },
  picker: {
    flex: 1,
    height: 50,
    color: lightTheme.colors.gray[800],
  },
  textArea: {
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: lightTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    padding: lightTheme.spacing.md,
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[800],
    minHeight: 120,
  },
  statusMessage: {
    flexDirection: "row",
    alignItems: "center",
    padding: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.md,
    marginBottom: lightTheme.spacing.lg,
    gap: lightTheme.spacing.sm,
  },
  statusError: {
    backgroundColor: `${lightTheme.colors.error}15`,
    borderWidth: 1,
    borderColor: lightTheme.colors.error,
  },
  statusTextError: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.error,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: lightTheme.spacing.md,
    marginTop: lightTheme.spacing.md,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: lightTheme.borderRadius.lg,
    gap: lightTheme.spacing.sm,
  },
  buttonPrimary: {
    backgroundColor: lightTheme.colors.primary,
    ...lightTheme.shadows.md,
  },
  buttonSecondary: {
    backgroundColor: lightTheme.colors.gray[100],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
  },
  buttonDisabled: {
    backgroundColor: lightTheme.colors.gray[400],
    opacity: 0.6,
  },
  buttonText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
  },
  buttonTextSecondary: {
    color: lightTheme.colors.gray[700],
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
  },
});
