import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import {
  appointmentsService,
  availabilityService,
} from "../../../services/appointments";
import { nutritionistAddressService } from "../../../services/nutritionist";
import {
  AppointmentType,
  AppointmentTypeLabels,
} from "../../../types/appointments";

export default function RequestAppointmentScreen({ navigation }: any) {
  const [saving, setSaving] = useState(false);
  const [loadingNutritionist, setLoadingNutritionist] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Nutritionist info
  const [nutritionist, setNutritionist] = useState<any>(null);

  // Form state
  const [type, setType] = useState<AppointmentType>(AppointmentType.FOLLOW_UP);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [duration] = useState("60");
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState("");
  const [title, setTitle] = useState("");
  const [description] = useState("");
  const [patientNotes, setPatientNotes] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Available slots
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // Carregar nutricionista ao montar o componente
  useEffect(() => {
    loadNutritionist();
  }, []);

  // Carregar horários quando mudar a data
  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Carregar endereços quando mudar para presencial
  useEffect(() => {
    if (!isOnline) {
      loadAddresses();
    }
  }, [isOnline]);

  const loadNutritionist = async () => {
    try {
      setLoadingNutritionist(true);
      const data = await appointmentsService.findMyNutritionist();
      setNutritionist(data);
    } catch {
      // Não mostrar Toast de erro, apenas log, pois pode ser que o paciente não tenha nutricionista ainda
      setNutritionist(null);
    } finally {
      setLoadingNutritionist(false);
    }
  };

  const loadAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      const dateString = selectedDate.toISOString().split("T")[0];

      const slots = await availabilityService.getPatientAvailableSlots(
        dateString
      );

      setAvailableSlots(slots);
    } catch (error: unknown) {
      console.error(
        "❌ [RequestAppointment] Erro ao carregar horários:",
        error
      );
      const message =
        error instanceof Error ? error.message : "Tente novamente mais tarde";
      Toast.show({
        type: "error",
        text1: "Erro ao carregar horários",
        text2: message,
      });
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const loadAddresses = async () => {
    try {
      const serviceLocations =
        await nutritionistAddressService.findPatientNutritionistServiceLocations();

      // Selecionar endereço de atendimento (isServiceLocation=true) ou principal automaticamente
      const serviceAddress =
        serviceLocations.find((addr: any) => addr.isServiceLocation) ||
        serviceLocations.find((addr: any) => addr.isPrimary) ||
        serviceLocations[0];

      if (serviceAddress) {
        const addressString = `${serviceAddress.street}, ${
          serviceAddress.number
        }${
          serviceAddress.complement ? ` - ${serviceAddress.complement}` : ""
        } - ${serviceAddress.neighborhood}, ${serviceAddress.city}/${
          serviceAddress.state
        }`;
        setLocation(addressString);
      }
    } catch (error: unknown) {
      console.error(
        "❌ [RequestAppointment] Erro ao carregar endereços:",
        error
      );
      setLocation("");
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleSubmit = async () => {
    // Validações
    if (!selectedTime) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Por favor, informe o horário",
      });
      return;
    }

    // Validar formato HH:mm
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(selectedTime)) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Horário inválido. Use o formato HH:mm (ex: 14:30)",
      });
      return;
    }

    try {
      setSaving(true);

      const data = {
        type,
        scheduledDate: selectedDate.toISOString().split("T")[0],
        scheduledTime: selectedTime,
        duration: parseInt(duration) || 60,
        isOnline,
        location: !isOnline ? location : undefined,
        title: title || `Consulta ${AppointmentTypeLabels[type]}`,
        description,
        patientNotes,
      };

      await appointmentsService.requestAppointment(data);

      Toast.show({
        type: "success",
        text1: "Sucesso!",
        text2: "Solicitação enviada ao nutricionista",
      });

      navigation.goBack();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao solicitar consulta";
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 80}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutricionista</Text>

            {loadingNutritionist ? (
              <View style={styles.nutritionistCard}>
                <ActivityIndicator size="small" color="#8b5a9f" />
                <Text style={styles.loadingText}>Carregando...</Text>
              </View>
            ) : (
              <View style={styles.nutritionistCard}>
                <View style={styles.nutritionistAvatar}>
                  <Ionicons name="person" size={32} color="#8b5a9f" />
                </View>
                <View style={styles.nutritionistInfo}>
                  <Text style={styles.nutritionistName}>
                    {nutritionist?.user?.name || "Seu Nutricionista"}
                  </Text>
                  <Text style={styles.nutritionistCRN}>
                    {nutritionist?.crn
                      ? `CRN: ${nutritionist.crn}`
                      : "Profissional Responsável"}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações Básicas</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Tipo de Consulta *</Text>
              <View style={styles.typeButtons}>
                {Object.values(AppointmentType).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeButton,
                      type === t && styles.typeButtonActive,
                    ]}
                    onPress={() => setType(t)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        type === t && styles.typeButtonTextActive,
                      ]}
                    >
                      {AppointmentTypeLabels[t]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data e Horário</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Data *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {formatDate(selectedDate)}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={new Date()}
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === "ios");
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
              />
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Horário *</Text>
              {loadingSlots ? (
                <View style={styles.slotsGrid}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <View key={i} style={styles.slotButtonSkeleton}>
                      <ActivityIndicator size="small" color="#8b5a9f" />
                    </View>
                  ))}
                </View>
              ) : availableSlots.length === 0 ? (
                <View style={styles.noSlots}>
                  <Text style={styles.noSlotsText}>
                    Nenhum horário disponível para esta data
                  </Text>
                </View>
              ) : (
                <View style={styles.slotsGrid}>
                  {availableSlots.map((slot) => (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        styles.slotButton,
                        selectedTime === slot && styles.slotButtonActive,
                      ]}
                      onPress={() => setSelectedTime(slot)}
                    >
                      <Text
                        style={[
                          styles.slotButtonText,
                          selectedTime === slot && styles.slotButtonTextActive,
                        ]}
                      >
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Local da Consulta</Text>

            <View style={styles.field}>
              <View style={styles.switchField}>
                <View style={styles.switchLabelContainer}>
                  <Text style={styles.label}>Consulta Online</Text>
                  <Text style={styles.hint}>
                    {isOnline
                      ? "O link será fornecido pelo nutricionista"
                      : "Atendimento presencial no consultório"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.switchButton,
                    isOnline && styles.switchButtonActive,
                  ]}
                  onPress={() => setIsOnline(!isOnline)}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      isOnline && styles.switchThumbActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {!isOnline && location && (
              <View style={styles.addressCard}>
                <Ionicons name="location" size={20} color="#8b5a9f" />
                <Text style={styles.addressText}>{location}</Text>
              </View>
            )}
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Detalhes Adicionais (Opcional)
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Título</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Revisão do plano alimentar"
                placeholderTextColor="#999"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Observações</Text>
              <Text style={styles.hint}>
                Adicione informações que possam ajudar na consulta
              </Text>
              <TextInput
                style={styles.textArea}
                placeholder="Ex: Gostaria de discutir mudanças na dieta..."
                placeholderTextColor="#999"
                value={patientNotes}
                onChangeText={setPatientNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Enviar Solicitação</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: "#999",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
    minHeight: 100,
    textAlignVertical: "top",
  },
  typeButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  typeButtonActive: {
    backgroundColor: "#8b5a9f",
    borderColor: "#8b5a9f",
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  typeButtonTextActive: {
    color: "#fff",
  },
  dateButton: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#333",
  },
  switchField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchButton: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: "#ddd",
    padding: 2,
    justifyContent: "center",
  },
  switchButtonActive: {
    backgroundColor: "#8b5a9f",
  },
  switchThumb: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
  },
  switchThumbActive: {
    alignSelf: "flex-end",
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#f3e8f7",
    borderWidth: 1,
    borderColor: "#9b6cb0",
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  nutritionistCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#f3e8f7",
    borderWidth: 1,
    borderColor: "#9b6cb0",
  },
  nutritionistAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  nutritionistInfo: {
    flex: 1,
  },
  nutritionistName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  nutritionistCRN: {
    fontSize: 14,
    color: "#666",
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slotButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    minWidth: 80,
    alignItems: "center",
  },
  slotButtonActive: {
    backgroundColor: "#8b5a9f",
    borderColor: "#8b5a9f",
  },
  slotButtonSkeleton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f5f5f5",
    minWidth: 80,
    alignItems: "center",
    height: 40,
    justifyContent: "center",
  },
  slotButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  slotButtonTextActive: {
    color: "#fff",
  },
  noSlots: {
    padding: 20,
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
  },
  noSlotsText: {
    fontSize: 14,
    color: "#F57C00",
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 15,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    backgroundColor: "#8b5a9f",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
