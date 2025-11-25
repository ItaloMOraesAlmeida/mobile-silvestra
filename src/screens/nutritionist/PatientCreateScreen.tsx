import React, { useState, useCallback } from "react";
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
  Modal,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as Clipboard from "expo-clipboard";
import { lightTheme } from "../../theme";
import { api } from "../../services/api";
import { useNotificationStore } from "../../stores/notification.store";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "../../types/notification.types";
import { notificationService } from "../../services/notification.service";
import { generateAccessCode } from "../../utils/access-code.utils";
import {
  applyPhoneMask,
  removePhoneMask,
  applyCpfMask,
  removeCpfMask,
  applyDateMask,
  dateToISO,
} from "../../utils/mask.utils";

type FormData = {
  email: string;
  name?: string;
  phone?: string;
  cpf?: string;
  birthDate?: string;
  gender?: string;
  biologicalSex?: string;
  notes?: string;
};

export function PatientCreateScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [existingUser, setExistingUser] = useState<any | null>(null);
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "searching" | "found" | "linked" | "available" | "error"
  >("idle");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados para código de acesso
  const [accessCode, setAccessCode] = useState<string>("");
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(false);
  const [createdPatientData, setCreatedPatientData] = useState<any>(null);

  // Notification store
  const { setPreferences } = useNotificationStore();

  const { control, handleSubmit, setValue, watch } = useForm<FormData>({
    defaultValues: {
      email: "",
      name: "",
      phone: "",
      cpf: "",
      birthDate: "",
      gender: "",
      biologicalSex: "",
      notes: "",
    },
  });

  const email = watch("email");

  const onSearchEmail = useCallback(
    async (emailToSearch: string) => {
      if (!emailToSearch || emailToSearch.trim().length === 0) return;
      setSearching(true);
      setEmailError(null);
      setEmailStatus("searching");

      try {
        // Tenta endpoint robusto -- alguns backends expõem /users/by-email
        let response: any = null;
        try {
          response = await api.get(
            `/users/by-email?email=${encodeURIComponent(emailToSearch)}`
          );
        } catch {
          // fallback para /users?email=...
          try {
            response = await api.get(
              `/users?email=${encodeURIComponent(emailToSearch)}`
            );
          } catch {
            response = null;
          }
        }

        if (response && response.data) {
          const user = response.data;

          // Se o usuário já tiver um nutritionist vinculado, avisar
          const nutritionistId =
            (user as any).nutritionistProfileId ||
            (user as any).nutritionistId ||
            null;
          if (nutritionistId) {
            // Usuário já vinculado a outro nutricionista
            setExistingUser(null);
            setEmailStatus("linked");
            setEmailError(
              "Este usuário já está vinculado a outro nutricionista."
            );
            return;
          }

          // Prefill fields
          setExistingUser(user);
          setValue("name", user.name || "");
          setValue("phone", user.phone || user.phoneNumber || "");
          setValue("cpf", user.cpf || "");
          setEmailStatus("found");
        } else {
          // Não encontrado -> limpar estado para criar novo
          setExistingUser(null);
          // deixe os campos vazios (usuario novo)
          setValue("name", "");
          setValue("phone", "");
          setValue("cpf", "");
          setEmailStatus("available");
        }
      } catch (err: any) {
        console.error("Erro ao buscar usuário por email:", err);
        setEmailStatus("error");
        setEmailError("Não foi possível buscar o email. Tente novamente.");
      } finally {
        setSearching(false);
      }
    },
    [setValue]
  );

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setSubmitError(null);
    try {
      // Gera código de acesso único para o paciente
      const generatedCode = generateAccessCode(8);

      // Remove máscaras e converte data
      const cleanedData = {
        ...data,
        phone: data.phone ? removePhoneMask(data.phone) : undefined,
        cpf: data.cpf ? removeCpfMask(data.cpf) : undefined,
        birthDate: data.birthDate ? dateToISO(data.birthDate) : undefined,
      };

      // Monta payload: se existingUser existe, usa userId; senão envia dados para criação.
      const payload: any = existingUser
        ? {
            userId: existingUser.id,
            profile: { notes: cleanedData.notes },
            accessCode: generatedCode,
          }
        : {
            user: {
              email: cleanedData.email,
              name: cleanedData.name,
              phone: cleanedData.phone,
              cpf: cleanedData.cpf,
              birthDate: cleanedData.birthDate,
              gender: cleanedData.gender || undefined,
              biologicalSex: cleanedData.biologicalSex || undefined,
            },
            notes: cleanedData.notes,
            accessCode: generatedCode,
          };

      // Chamada ao backend (assumimos contrato: POST /patients)
      const response = await api.post("/patients", payload);

      const createdPatient = response.data;

      // 🔔 Configurar notificações padrão para o novo paciente
      if (createdPatient?.id) {
        try {
          // Salvar preferências padrão
          setPreferences(createdPatient.id, DEFAULT_NOTIFICATION_PREFERENCES);

          // Agendar notificações baseadas nas preferências padrão
          await notificationService.rescheduleAllNotifications(
            createdPatient.id,
            DEFAULT_NOTIFICATION_PREFERENCES
          );
        } catch (notifError) {
          console.error("⚠️ Erro ao configurar notificações:", notifError);
          console.error("Stack:", notifError);
          // Não bloqueia o cadastro se notificações falharem
        }
      }

      // Sucesso: salvar código e dados do paciente, exibir modal
      setAccessCode(generatedCode);
      setCreatedPatientData({
        ...createdPatient,
        patientName: data.name || existingUser?.name || data.email,
      });
      setSuccessMessage("Paciente cadastrado com sucesso!");
      setShowAccessCodeModal(true);
    } catch (err: any) {
      console.error("❌ [PATIENT_CREATE] Erro ao cadastrar paciente:", err);
      console.error("❌ Detalhes do erro:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        stack: err.stack,
      });
      setSubmitError(
        err?.response?.data?.message ||
          err.message ||
          "Erro ao cadastrar paciente"
      );
    } finally {
      setLoading(false);
    }
  };

  // Função para copiar código para clipboard
  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(accessCode);
  };

  // Função para compartilhar código
  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Seu código de acesso ao Silvestra: ${accessCode}\n\nUse este código para completar seu cadastro no aplicativo.`,
        title: "Código de Acesso Silvestra",
      });
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
    }
  };

  // Função para fechar modal e navegar
  const handleCloseModal = () => {
    setShowAccessCodeModal(false);
    // Navegar com parâmetro para forçar refresh da lista
    navigation.navigate("Patients", { refresh: true, timestamp: Date.now() });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Card de busca de email */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={lightTheme.colors.primary}
            />
            <Text style={styles.cardTitle}>Buscar por E-mail</Text>
          </View>

          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <View style={styles.emailInputWrapper}>
                  <Ionicons
                    name="at"
                    size={20}
                    color={lightTheme.colors.gray[400]}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.emailInput}
                    placeholder="Digite o e-mail do paciente"
                    placeholderTextColor={lightTheme.colors.gray[400]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                  />
                  {searching && (
                    <ActivityIndicator
                      size="small"
                      color={lightTheme.colors.primary}
                      style={styles.searchingIndicator}
                    />
                  )}
                </View>
              )}
            />

            <TouchableOpacity
              style={[
                styles.searchButton,
                searching && styles.searchButtonDisabled,
              ]}
              onPress={() => onSearchEmail(email)}
              disabled={searching}
            >
              <Ionicons
                name="search"
                size={20}
                color={lightTheme.colors.white}
              />
              <Text style={styles.searchButtonText}>Buscar</Text>
            </TouchableOpacity>
          </View>

          {/* Status messages com ícones */}
          {emailStatus === "searching" && (
            <View style={styles.statusMessage}>
              <ActivityIndicator
                size="small"
                color={lightTheme.colors.primary}
              />
              <Text style={styles.statusTextInfo}>Pesquisando e-mail...</Text>
            </View>
          )}
          {emailStatus === "found" && (
            <View style={[styles.statusMessage, styles.statusSuccess]}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={lightTheme.colors.success}
              />
              <Text style={styles.statusTextSuccess}>
                Usuário encontrado! Dados preenchidos automaticamente.
              </Text>
            </View>
          )}
          {emailStatus === "available" && (
            <View style={[styles.statusMessage, styles.statusInfo]}>
              <Ionicons
                name="information-circle"
                size={20}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.statusTextInfo}>
                E-mail disponível. Preencha os dados para criar novo usuário.
              </Text>
            </View>
          )}
          {emailStatus === "linked" && (
            <View style={[styles.statusMessage, styles.statusError]}>
              <Ionicons
                name="alert-circle"
                size={20}
                color={lightTheme.colors.error}
              />
              <Text style={styles.statusTextError}>{emailError}</Text>
            </View>
          )}
          {emailStatus === "error" && (
            <View style={[styles.statusMessage, styles.statusError]}>
              <Ionicons
                name="alert-circle"
                size={20}
                color={lightTheme.colors.error}
              />
              <Text style={styles.statusTextError}>{emailError}</Text>
            </View>
          )}
        </View>

        {/* Card de dados pessoais */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="person-outline"
              size={20}
              color={lightTheme.colors.primary}
            />
            <Text style={styles.cardTitle}>Dados Pessoais</Text>
          </View>

          {/* Campo Email (read-only para visualização) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { value } }) => (
                <View style={[styles.inputWrapper, styles.inputDisabled]}>
                  <Ionicons
                    name="mail"
                    size={18}
                    color={lightTheme.colors.gray[400]}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="E-mail do paciente"
                    placeholderTextColor={lightTheme.colors.gray[400]}
                    value={value}
                    editable={false}
                  />
                </View>
              )}
            />
            <Text style={styles.helperText}>
              O e-mail foi definido na busca acima
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome Completo</Text>
            <Controller
              control={control}
              name="name"
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
                    <Picker.Item label="Selecione o sexo biológico" value="" />
                    <Picker.Item label="Masculino" value="MALE" />
                    <Picker.Item label="Feminino" value="FEMALE" />
                  </Picker>
                </View>
              )}
            />
          </View>
        </View>

        {/* Card de observações */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="document-text-outline"
              size={20}
              color={lightTheme.colors.primary}
            />
            <Text style={styles.cardTitle}>Observações Iniciais</Text>
          </View>

          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.textArea}
                placeholder="Preferências alimentares, restrições, histórico médico, objetivos..."
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

        {/* Mensagens de erro/sucesso */}
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

        {successMessage && (
          <View style={[styles.statusMessage, styles.statusSuccess]}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={lightTheme.colors.success}
            />
            <Text style={styles.statusTextSuccess}>{successMessage}</Text>
          </View>
        )}

        {/* Botão de salvar */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
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
              <Text style={styles.submitText}>Salvar Paciente</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de Código de Acesso */}
      <Modal
        visible={showAccessCodeModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {/* Header do Modal */}
              <View style={styles.modalHeader}>
                <View style={styles.modalIconContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={36}
                    color={lightTheme.colors.success}
                  />
                </View>
                <Text style={styles.modalTitle}>Paciente Cadastrado!</Text>
                <Text style={styles.modalSubtitle}>
                  {createdPatientData?.patientName || "Paciente"} foi cadastrado
                  com sucesso.
                </Text>
              </View>

              {/* Código de Acesso */}
              <View style={styles.accessCodeSection}>
                <View style={styles.accessCodeLabel}>
                  <Ionicons
                    name="key"
                    size={20}
                    color={lightTheme.colors.primary}
                  />
                  <Text style={styles.accessCodeLabelText}>
                    Código de Acesso do Paciente
                  </Text>
                </View>

                <View style={styles.accessCodeBox}>
                  <Text style={styles.accessCodeText}>{accessCode}</Text>
                </View>

                <Text style={styles.accessCodeInstructions}>
                  Compartilhe este código com o paciente. Ele será necessário
                  para completar o cadastro e criar a senha de acesso ao
                  aplicativo.
                </Text>
              </View>

              {/* Botões de Ação */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopyCode}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="copy-outline"
                    size={20}
                    color={lightTheme.colors.white}
                  />
                  <Text style={styles.copyButtonText}>Copiar Código</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={handleShareCode}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="share-outline"
                    size={20}
                    color={lightTheme.colors.primary}
                  />
                  <Text style={styles.shareButtonText}>Compartilhar</Text>
                </TouchableOpacity>
              </View>

              {/* Botão de Fechar */}
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={handleCloseModal}
                activeOpacity={0.8}
              >
                <Text style={styles.closeModalButtonText}>Concluir</Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={lightTheme.colors.white}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: lightTheme.spacing.lg,
    paddingBottom: 32,
    paddingTop: lightTheme.spacing.lg,
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
  inputContainer: {
    marginTop: lightTheme.spacing.md,
  },
  emailInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: lightTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    paddingHorizontal: lightTheme.spacing.md,
    marginBottom: lightTheme.spacing.md,
  },
  inputIcon: {
    marginRight: lightTheme.spacing.sm,
  },
  emailInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[800],
  },
  searchingIndicator: {
    marginLeft: lightTheme.spacing.sm,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: lightTheme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: lightTheme.spacing.lg,
    borderRadius: lightTheme.borderRadius.lg,
    gap: lightTheme.spacing.sm,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
  },
  statusMessage: {
    flexDirection: "row",
    alignItems: "center",
    padding: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.md,
    marginTop: lightTheme.spacing.md,
    gap: lightTheme.spacing.sm,
  },
  statusInfo: {
    backgroundColor: `${lightTheme.colors.primary}15`,
  },
  statusSuccess: {
    backgroundColor: `${lightTheme.colors.success}15`,
  },
  statusError: {
    backgroundColor: `${lightTheme.colors.error}15`,
  },
  statusTextInfo: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.primary,
  },
  statusTextSuccess: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.success,
  },
  statusTextError: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.error,
  },
  inputGroup: {
    marginBottom: lightTheme.spacing.lg,
  },
  label: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[700],
    marginBottom: lightTheme.spacing.sm,
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
  inputDisabled: {
    backgroundColor: lightTheme.colors.gray[100],
    opacity: 0.7,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[800],
  },
  helperText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginTop: 4,
    fontStyle: "italic",
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
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: lightTheme.colors.primary,
    borderRadius: lightTheme.borderRadius.lg,
    paddingVertical: 16,
    marginTop: lightTheme.spacing.md,
    gap: lightTheme.spacing.sm,
    ...lightTheme.shadows.md,
  },
  submitButtonDisabled: {
    backgroundColor: lightTheme.colors.gray[400],
    opacity: 0.6,
  },
  submitText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
  },
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 450,
  },
  modalContent: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing.lg,
    ...lightTheme.shadows.lg,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: lightTheme.spacing.lg,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${lightTheme.colors.success}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: lightTheme.spacing.sm,
  },
  modalTitle: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing.xs,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
    lineHeight: 20,
  },
  accessCodeSection: {
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.md,
    marginBottom: lightTheme.spacing.lg,
  },
  accessCodeLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: lightTheme.spacing.sm,
    gap: lightTheme.spacing.xs,
  },
  accessCodeLabelText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[700],
  },
  accessCodeBox: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.md,
    paddingVertical: lightTheme.spacing.md,
    paddingHorizontal: lightTheme.spacing.lg,
    marginBottom: lightTheme.spacing.sm,
    borderWidth: 2,
    borderColor: lightTheme.colors.primary,
    borderStyle: "dashed",
  },
  accessCodeText: {
    fontSize: 28,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.primary,
    textAlign: "center",
    letterSpacing: 3,
  },
  accessCodeInstructions: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: "row",
    gap: lightTheme.spacing.sm,
    marginBottom: lightTheme.spacing.md,
  },
  copyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: lightTheme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: lightTheme.spacing.sm,
    borderRadius: lightTheme.borderRadius.md,
    gap: 6,
  },
  copyButtonText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
  },
  shareButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: lightTheme.colors.white,
    paddingVertical: 10,
    paddingHorizontal: lightTheme.spacing.sm,
    borderRadius: lightTheme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: lightTheme.colors.primary,
    gap: 6,
  },
  shareButtonText: {
    color: lightTheme.colors.primary,
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
  },
  closeModalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: lightTheme.colors.success,
    paddingVertical: 12,
    borderRadius: lightTheme.borderRadius.md,
    gap: lightTheme.spacing.xs,
  },
  closeModalButtonText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
  },
});
