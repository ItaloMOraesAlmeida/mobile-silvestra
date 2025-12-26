import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Switch,
  Modal,
  KeyboardAvoidingView,
  FlatList,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
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
  CreateAppointmentDto,
} from "../../../types/appointments";
import { usePatients, Patient } from "../../../hooks/usePatients";
import { NutritionistAddress } from "../../../types/nutritionist";

export default function AppointmentFormScreen({ route, navigation }: any) {
  const { appointmentId, patientId: defaultPatientId } = route.params || {};
  const isEditing = !!appointmentId;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Patient search modal state
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const {
    patients,
    loading: searchLoading,
    meta,
    getPatients,
    searchPatients,
  } = usePatients();
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Form state
  const [patientId, setPatientId] = useState(defaultPatientId || "");
  const [type, setType] = useState<AppointmentType>(AppointmentType.FOLLOW_UP);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [patientNotes, setPatientNotes] = useState("");
  const [price, setPrice] = useState("");

  // Address selection state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddress, setSelectedAddress] =
    useState<NutritionistAddress | null>(null);
  const [addresses, setAddresses] = useState<NutritionistAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Available slots
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Refs para funções
  const getPatientsRef = useRef(getPatients);
  const searchPatientsRef = useRef(searchPatients);

  useEffect(() => {
    getPatientsRef.current = getPatients;
    searchPatientsRef.current = searchPatients;
  }, [getPatients, searchPatients]);

  const loadAppointment = useCallback(async () => {
    try {
      setLoading(true);
      const appointment = await appointmentsService.findOne(appointmentId);

      // Configurar paciente completo
      if (appointment.patient) {
        setSelectedPatient(appointment.patient as any);
        setPatientId(appointment.patientId);
      }

      setType(appointment.type);

      // Extrair apenas a data (YYYY-MM-DD)
      const dateOnly = appointment.scheduledDate.includes("T")
        ? appointment.scheduledDate.split("T")[0]
        : appointment.scheduledDate;

      // Extrair ano, mês e dia
      const [year, month, day] = dateOnly.split("-").map(Number);

      // Criar data local SEM ajuste
      const parsedDate = new Date(year, month - 1, day);

      setSelectedDate(parsedDate);
      setSelectedTime(appointment.scheduledTime);
      setDuration(String(appointment.duration));
      setIsOnline(appointment.isOnline);
      setLocation(appointment.location || "");
      setMeetingUrl(appointment.meetingUrl || "");
      setTitle(appointment.title || "");
      setDescription(appointment.description || "");
      setPatientNotes(appointment.patientNotes || "");
      setPrice(appointment.price ? String(appointment.price) : "");

      // Carregar endereços se for presencial
      if (!appointment.isOnline) {
        const serviceLocations =
          await nutritionistAddressService.findServiceLocations();
        setAddresses(serviceLocations);

        // Se tiver location, tentar encontrar o endereço correspondente
        if (appointment.location && serviceLocations.length > 0) {
          const matchingAddress = serviceLocations.find((addr) => {
            const addrString = `${addr.street}, ${addr.number}${
              addr.complement ? ` - ${addr.complement}` : ""
            } - ${addr.neighborhood}, ${addr.city}/${addr.state}`;
            return addrString === appointment.location;
          });
          if (matchingAddress) {
            setSelectedAddress(matchingAddress);
          }
        }
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message,
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [appointmentId, navigation]);

  const loadAvailableSlots = useCallback(async () => {
    try {
      setLoadingSlots(true);
      const dateString = selectedDate.toISOString().split("T")[0];
      const slots = await availabilityService.getAvailableSlots(dateString);

      setAvailableSlots(slots);
    } catch (error: any) {
      console.error("❌ [loadAvailableSlots] Erro:", error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message,
      });
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (isEditing) {
      loadAppointment();
    }
  }, [isEditing, loadAppointment]);

  useEffect(() => {
    // Só carregar slots disponíveis se não estiver editando
    // Ao editar, o horário já está definido e não precisa validação
    if (selectedDate && !isEditing) {
      loadAvailableSlots();
    }
  }, [selectedDate, loadAvailableSlots, isEditing]);

  // Carregar endereços quando mudar para presencial
  useEffect(() => {
    if (!isOnline && !isEditing) {
      loadAddresses();
    }
  }, [isOnline, isEditing]);

  // Recarregar endereços quando a tela ganhar foco (para atualizar após cadastro)
  useFocusEffect(
    useCallback(() => {
      if (!isOnline && !isEditing) {
        loadAddresses();
      }
    }, [isOnline, isEditing])
  );

  // Limpar formulário ao voltar para a tela (apenas se não estiver editando)
  useFocusEffect(
    useCallback(() => {
      // Quando a tela recebe foco
      const currentAppointmentId = route.params?.appointmentId;
      const currentDefaultPatientId = route.params?.patientId;

      if (!currentAppointmentId && !currentDefaultPatientId) {
        setSelectedPatient(null);
        setPatientId("");
        setType(AppointmentType.FOLLOW_UP);
        setSelectedDate(new Date());
        setSelectedTime("");
        setDuration("60");
        setIsOnline(false);
        setLocation("");
        setMeetingUrl("");
        setTitle("");
        setDescription("");
        setPatientNotes("");
        setPrice("");
        setAvailableSlots([]);
        setSelectedAddress(null);
        setAddresses([]); // Limpar lista de endereços
      }

      return () => {
        // Cleanup ao sair da tela - limpar endereços para evitar cache desatualizado
        setAddresses([]);
        setSelectedAddress(null);
      };
    }, [route.params])
  );

  // Carregar pacientes ao abrir o modal
  useEffect(() => {
    if (showPatientModal && !hasSearched) {
      setCurrentPage(1);
      getPatientsRef.current({ page: 1, limit: 20 }).catch((error) => {
        console.error("❌ Erro ao carregar pacientes:", error);
      });
      setHasSearched(true);
    }
    if (!showPatientModal) {
      setHasSearched(false);
    }
  }, [showPatientModal, hasSearched]);

  // Debounce patient search (2 seconds)
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery.trim()) {
        setCurrentPage(1);
      } else if (hasSearched && showPatientModal) {
        // Se limpar a busca, recarrega todos os pacientes
        setCurrentPage(1);
        getPatientsRef.current({ page: 1, limit: 20 });
      }
    }, 2000);

    return () => clearTimeout(debounce);
  }, [searchQuery, hasSearched, showPatientModal]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientId(patient.id); // ID da relação Patient (nutritionist-patient)
    setShowPatientModal(false);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleRemovePatient = () => {
    setSelectedPatient(null);
    setPatientId("");
  };

  // Address functions
  const loadAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const serviceLocations =
        await nutritionistAddressService.findServiceLocations();
      setAddresses(serviceLocations);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message,
      });
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleSelectAddress = (address: NutritionistAddress) => {
    setSelectedAddress(address);
    setLocation(
      `${address.street}, ${address.number}${
        address.complement ? ` - ${address.complement}` : ""
      } - ${address.neighborhood}, ${address.city}/${address.state}`
    );
    setShowAddressModal(false);
  };

  const handleRemoveAddress = () => {
    setSelectedAddress(null);
    setLocation("");
  };

  const handleLoadMore = async () => {
    if (loadingMore || searchLoading || !meta) return;

    const nextPage = currentPage + 1;
    if (nextPage > meta.totalPages) return;

    try {
      setLoadingMore(true);
      const filters = searchQuery.trim()
        ? { search: searchQuery, page: nextPage, limit: 20 }
        : { page: nextPage, limit: 20 };

      await getPatients(filters, true); // true = append
      setCurrentPage(nextPage);
    } catch (error) {
      console.error("Erro ao carregar mais pacientes:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSave = async () => {
    // Validações
    if (!patientId) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Selecione um paciente",
      });
      return;
    }

    if (!selectedTime) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Selecione um horário",
      });
      return;
    }

    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum < 15 || durationNum > 240) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Duração deve estar entre 15 e 240 minutos",
      });
      return;
    }

    if (isOnline && !meetingUrl) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Informe a URL da reunião para consultas online",
      });
      return;
    }

    if (!isOnline && !location) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Informe o local da consulta presencial",
      });
      return;
    }

    try {
      setSaving(true);

      const data: CreateAppointmentDto = {
        patientId,
        type,
        scheduledDate: selectedDate.toISOString().split("T")[0],
        scheduledTime: selectedTime,
        duration: durationNum,
        isOnline,
        location: !isOnline ? location : undefined,
        meetingUrl: isOnline ? meetingUrl : undefined,
        title: title || undefined,
        description: description || undefined,
        patientNotes: patientNotes || undefined,
        price: price ? parseFloat(price) : undefined,
      };

      if (isEditing) {
        await appointmentsService.update(appointmentId, data);
        Toast.show({
          type: "success",
          text1: "Sucesso",
          text2: "Consulta atualizada com sucesso!",
        });
      } else {
        await appointmentsService.create(data);
        Toast.show({
          type: "success",
          text1: "Sucesso",
          text2: "Consulta criada com sucesso!",
        });
      }

      navigation.navigate("AppointmentCalendar" as never);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5a9f" />
        <Text style={styles.loadingText}>Carregando consulta...</Text>
      </View>
    );
  }

  // Skeleton component
  const SkeletonBox = ({ style }: any) => {
    const animatedValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }, [animatedValue]);

    const opacity = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    });

    return (
      <Animated.View
        style={[
          { backgroundColor: "#e0e0e0", borderRadius: 4, opacity },
          style,
        ]}
      />
    );
  };

  const PatientSearchSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.skeletonItem}>
          <SkeletonBox style={styles.skeletonAvatar} />
          <View style={styles.skeletonInfo}>
            <SkeletonBox style={styles.skeletonName} />
            <SkeletonBox style={styles.skeletonEmail} />
          </View>
        </View>
      ))}
    </View>
  );

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
            <Text style={styles.sectionTitle}>Informações Básicas</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Paciente *</Text>

              {!isEditing ? (
                !selectedPatient ? (
                  <TouchableOpacity
                    style={styles.selectPatientButton}
                    onPress={() => setShowPatientModal(true)}
                  >
                    <Ionicons name="person-add" size={20} color="#8b5a9f" />
                    <Text style={styles.selectPatientButtonText}>
                      Selecionar Paciente
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.selectedPatientCard}>
                    <View style={styles.selectedPatientInfo}>
                      <Text style={styles.selectedPatientName}>
                        {(selectedPatient as any)?.patient?.name ||
                          (selectedPatient as any)?.name ||
                          "Carregando..."}
                      </Text>
                      <Text style={styles.selectedPatientEmail}>
                        {(selectedPatient as any)?.patient?.email ||
                          (selectedPatient as any)?.email ||
                          ""}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removePatientButton}
                      onPress={handleRemovePatient}
                    >
                      <Ionicons name="close-circle" size={24} color="#d32f2f" />
                    </TouchableOpacity>
                  </View>
                )
              ) : (
                <View style={styles.selectedPatientCard}>
                  <View style={styles.selectedPatientInfo}>
                    <Text style={styles.selectedPatientName}>
                      {(selectedPatient as any)?.patient?.name ||
                        (selectedPatient as any)?.name ||
                        "Carregando..."}
                    </Text>
                    <Text style={styles.selectedPatientEmail}>
                      {(selectedPatient as any)?.patient?.email ||
                        (selectedPatient as any)?.email ||
                        ""}
                    </Text>
                  </View>
                  <View style={styles.lockIcon}>
                    <Ionicons name="lock-closed" size={20} color="#757575" />
                  </View>
                </View>
              )}
            </View>

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
                minimumDate={isEditing ? undefined : new Date()}
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === "ios");
                  if (date) {
                    setSelectedDate(date);
                    setSelectedTime(""); // Reset time when date changes
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
                      <SkeletonBox style={styles.slotSkeletonContent} />
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

            <View style={styles.field}>
              <Text style={styles.label}>Duração (minutos)</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholder="60"
                placeholderTextColor="#999"
              />
              <Text style={styles.hint}>Entre 15 e 240 minutos</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Modalidade</Text>

            <View style={styles.switchField}>
              <Text style={styles.label}>Consulta Online</Text>
              <Switch
                value={isOnline}
                onValueChange={setIsOnline}
                trackColor={{ false: "#767577", true: "#9b6cb0" }}
                thumbColor={isOnline ? "#8b5a9f" : "#f4f3f4"}
              />
            </View>

            {isOnline ? (
              <View style={styles.field}>
                <Text style={styles.label}>URL da Reunião *</Text>
                <TextInput
                  style={styles.input}
                  value={meetingUrl}
                  onChangeText={setMeetingUrl}
                  placeholder="https://meet.google.com/..."
                  placeholderTextColor="#999"
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
            ) : (
              <View style={styles.field}>
                <Text style={styles.label}>Local de Atendimento *</Text>

                {!selectedAddress ? (
                  <TouchableOpacity
                    style={styles.selectPatientButton}
                    onPress={() => setShowAddressModal(true)}
                  >
                    <Ionicons name="location" size={20} color="#8b5a9f" />
                    <Text style={styles.selectPatientButtonText}>
                      Selecionar Endereço
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.selectedPatientCard}>
                    <View style={styles.selectedPatientInfo}>
                      <Text style={styles.selectedPatientName}>
                        {selectedAddress.street}, {selectedAddress.number}
                      </Text>
                      <Text style={styles.selectedPatientEmail}>
                        {selectedAddress.neighborhood} - {selectedAddress.city}/
                        {selectedAddress.state}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleRemoveAddress}
                      style={styles.removePatientButton}
                    >
                      <Ionicons name="close-circle" size={24} color="#d32f2f" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalhes Adicionais</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Título (opcional)</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Primeira Consulta - Avaliação Completa"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Descrição (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Informações sobre a consulta..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Notas do Paciente (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={patientNotes}
                onChangeText={setPatientNotes}
                placeholder="Observações fornecidas pelo paciente..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Valor (R$) (opcional)</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => navigation.goBack()}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  saving && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {isEditing ? "Atualizar" : "Agendar Consulta"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Patient Search Modal */}
      <Modal
        visible={showPatientModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPatientModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={["top", "bottom"]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalKeyboardView}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Paciente</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPatientModal(false)}
              >
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#999"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.modalSearchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar por nome ou email"
                placeholderTextColor="#999"
                editable={!searchLoading}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  style={styles.clearSearchButton}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.modalContent}>
              {searchLoading ? (
                <PatientSearchSkeleton />
              ) : patients.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={64}
                    color="#ccc"
                  />
                  <Text style={styles.emptyStateTitle}>
                    {searchQuery.trim()
                      ? "Nenhum paciente encontrado"
                      : "Nenhum paciente cadastrado"}
                  </Text>
                  <Text style={styles.emptyStateSubtitle}>
                    {searchQuery.trim()
                      ? "Tente buscar com outro termo"
                      : "Cadastre pacientes para começar"}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={patients}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.patientItem}
                      onPress={() => handleSelectPatient(item)}
                    >
                      <View style={styles.patientItemAvatar}>
                        <Ionicons name="person" size={24} color="#8b5a9f" />
                      </View>
                      <View style={styles.patientItemInfo}>
                        <Text style={styles.patientItemName}>
                          {item.patient.name}
                        </Text>
                        <Text style={styles.patientItemEmail}>
                          {item.patient.email}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => (
                    <View style={styles.separator} />
                  )}
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={
                    loadingMore ? (
                      <View style={styles.footerLoading}>
                        <ActivityIndicator size="small" color="#8b5a9f" />
                        <Text style={styles.footerLoadingText}>
                          Carregando mais...
                        </Text>
                      </View>
                    ) : null
                  }
                />
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Address Selection Modal */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={["top", "bottom"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Endereço</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAddressModal(false)}
            >
              <Ionicons name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {loadingAddresses ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color="#8b5a9f" />
                <Text style={styles.emptyStateSubtitle}>
                  Carregando endereços...
                </Text>
              </View>
            ) : addresses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="location-outline" size={64} color="#ccc" />
                <Text style={styles.emptyStateTitle}>
                  Nenhum endereço cadastrado
                </Text>
                <Text style={styles.emptyStateSubtitle}>
                  Cadastre um endereço de atendimento para começar
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => {
                    setShowAddressModal(false);
                    navigation.navigate("NutritionistAddressForm", {
                      returnTo: "AppointmentForm",
                    });
                  }}
                >
                  <Text style={styles.emptyStateButtonText}>
                    Cadastrar Endereço
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={addresses}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.patientItem}
                    onPress={() => handleSelectAddress(item)}
                  >
                    <View style={styles.patientItemAvatar}>
                      <Ionicons name="location" size={24} color="#8b5a9f" />
                    </View>
                    <View style={styles.patientItemInfo}>
                      <Text style={styles.patientItemName}>
                        {item.street}, {item.number}
                        {item.isPrimary && " ⭐"}
                      </Text>
                      <Text style={styles.patientItemEmail}>
                        {item.neighborhood} - {item.city}/{item.state}
                      </Text>
                      {item.complement && (
                        <Text style={styles.patientItemEmail}>
                          {item.complement}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === "android" ? 100 : 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
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
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  inputDisabled: {
    backgroundColor: "#f5f5f5",
    color: "#999",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  hint: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
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
    color: "#666",
    fontWeight: "600",
  },
  typeButtonTextActive: {
    color: "#fff",
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#333",
  },
  slotsLoading: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  slotsLoadingText: {
    fontSize: 14,
    color: "#666",
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
  slotSkeletonContent: {
    width: 50,
    height: 16,
  },
  slotButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  slotButtonTextActive: {
    color: "#fff",
  },
  switchField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  // Patient selection button
  selectPatientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#8b5a9f",
    borderStyle: "dashed",
    backgroundColor: "#f3e8f7",
    gap: 8,
  },
  selectPatientButtonText: {
    fontSize: 16,
    color: "#8b5a9f",
    fontWeight: "600",
  },
  // Selected patient card
  selectedPatientCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#f3e8f7",
    borderWidth: 1,
    borderColor: "#9b6cb0",
  },
  selectedPatientInfo: {
    flex: 1,
    marginRight: 12,
  },
  selectedPatientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  selectedPatientEmail: {
    fontSize: 14,
    color: "#666",
  },
  removePatientButton: {
    padding: 4,
  },
  lockIcon: {
    padding: 4,
    opacity: 0.7,
  },
  // Modal styles
  modalSafeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalKeyboardView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  searchIcon: {
    marginRight: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    padding: 0,
  },
  clearSearchButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingBottom: Platform.OS === "android" ? 24 : 0,
  },
  // Patient list item
  patientItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  patientItemAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f3e8f7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  patientItemInfo: {
    flex: 1,
  },
  patientItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  patientItemEmail: {
    fontSize: 14,
    color: "#666",
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginLeft: 76,
  },
  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateButton: {
    backgroundColor: "#8b5a9f",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Skeleton loading
  skeletonContainer: {
    padding: 16,
  },
  skeletonItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  skeletonInfo: {
    flex: 1,
  },
  skeletonName: {
    height: 16,
    width: "70%",
    marginBottom: 8,
    borderRadius: 4,
  },
  skeletonEmail: {
    height: 14,
    width: "50%",
    borderRadius: 4,
  },
  // Footer loading
  footerLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  footerLoadingText: {
    fontSize: 14,
    color: "#666",
  },
});
