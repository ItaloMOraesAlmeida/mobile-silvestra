import React, { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useForm, Controller } from "react-hook-form";
import { availabilityService } from "../../../services/appointments";
import {
  CreateAvailabilityConfigDto,
  CreateWeeklyScheduleDto,
  UpdateWeeklyScheduleDto,
  CreateBlockedPeriodDto,
  DayOfWeek,
  DayOfWeekLabels,
  WeeklySchedule,
  BlockedPeriod,
} from "../../../types/appointments";
import { ApiResponse } from "../../../types";

const DAYS_ORDER = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

// Helper para extrair dados do ApiResponse wrapper
const extractData = <T,>(response: ApiResponse<T> | T): T => {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    "success" in response
  ) {
    return (response as ApiResponse<T>).data as T;
  }
  return response as T;
};

// Componente Skeleton Animado
const SkeletonBox = ({ style }: { style?: any }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return <Animated.View style={[style, { opacity }]} />;
};

export default function AvailabilitySetupWizard() {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Step 1 - Configuração Geral
  const [defaultDuration, setDefaultDuration] = useState("60");
  const [bufferTime, setBufferTime] = useState("0");
  const [allowSameDay, setAllowSameDay] = useState(false);
  const [minAdvanceHours, setMinAdvanceHours] = useState("24");
  const [maxAdvanceDays, setMaxAdvanceDays] = useState("90");
  const [cancellationPolicy, setCancellationPolicy] = useState("");

  // Estados para comparar se houve alterações
  const [originalConfig, setOriginalConfig] = useState({
    defaultDuration: "60",
    bufferTime: "0",
    allowSameDay: false,
    minAdvanceHours: "24",
    maxAdvanceDays: "90",
    cancellationPolicy: "",
  });

  // Step 2 - Horários Semanais
  const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");
  const [hasLunchBreak, setHasLunchBreak] = useState(false);
  const [lunchStart, setLunchStart] = useState("12:00");
  const [lunchEnd, setLunchEnd] = useState("13:00");
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Step 3 - Períodos Bloqueados
  const [periods, setPeriods] = useState<BlockedPeriod[]>([]);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // React Hook Form para modal de período bloqueado
  const {
    control: periodControl,
    handleSubmit: handlePeriodSubmit,
    formState: { errors: periodErrors },
    watch: watchPeriod,
    reset: resetPeriodForm,
  } = useForm({
    defaultValues: {
      reason: "",
      isAllDay: true,
      startDate: new Date(),
      endDate: new Date(),
      periodStartTime: "08:00",
      periodEndTime: "18:00",
    },
  });

  const isAllDay = watchPeriod("isAllDay");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await availabilityService.getConfig();

      // Extrai os dados do response (pode vir com wrapper ou direto)
      const config = extractData(response);

      // Carrega configuração com valores padrão se undefined/null
      const loadedDefaultDuration =
        config.defaultDuration != null ? String(config.defaultDuration) : "60";
      const loadedBufferTime =
        config.bufferTime != null ? String(config.bufferTime) : "0";
      const loadedAllowSameDay = config.allowSameDay ?? false;
      const loadedMinAdvanceHours =
        config.minAdvanceHours != null ? String(config.minAdvanceHours) : "24";
      const loadedMaxAdvanceDays =
        config.maxAdvanceDays != null ? String(config.maxAdvanceDays) : "90";
      const loadedCancellationPolicy = config.cancellationPolicy || "";

      setDefaultDuration(loadedDefaultDuration);
      setBufferTime(loadedBufferTime);
      setAllowSameDay(loadedAllowSameDay);
      setMinAdvanceHours(loadedMinAdvanceHours);
      setMaxAdvanceDays(loadedMaxAdvanceDays);
      setCancellationPolicy(loadedCancellationPolicy);

      // Salva valores originais para comparação
      setOriginalConfig({
        defaultDuration: loadedDefaultDuration,
        bufferTime: loadedBufferTime,
        allowSameDay: loadedAllowSameDay,
        minAdvanceHours: loadedMinAdvanceHours,
        maxAdvanceDays: loadedMaxAdvanceDays,
        cancellationPolicy: loadedCancellationPolicy,
      });

      // Carrega horários
      setSchedules(config.weeklySchedules || []);

      // Carrega períodos bloqueados
      const periodsResponse = await availabilityService.getBlockedPeriods();
      const periodsData = extractData(periodsResponse);
      setPeriods(periodsData);
    } finally {
      setLoading(false);
    }
  };

  // ============= HELPERS =============
  // Máscara para horário (HH:MM)
  const formatTimeInput = (text: string) => {
    // Remove tudo que não é número
    const numbers = text.replace(/\D/g, "");

    // Aplica máscara
    if (numbers.length <= 2) {
      return numbers;
    }
    return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`;
  };

  // Valida e corrige horário
  const validateAndFixTime = (time: string): string => {
    if (!time || time.length < 5) return time;

    const [hours, minutes] = time.split(":").map(Number);

    // Corrige horas (0-23)
    let fixedHours = hours;
    if (hours > 23) fixedHours = 23;
    if (hours < 0) fixedHours = 0;

    // Corrige minutos (0-59)
    let fixedMinutes = minutes;
    if (minutes > 59) fixedMinutes = 59;
    if (minutes < 0) fixedMinutes = 0;

    return `${String(fixedHours).padStart(2, "0")}:${String(
      fixedMinutes
    ).padStart(2, "0")}`;
  };

  // ============= STEP 1 - Configuração =============
  const handleSaveConfig = async () => {
    try {
      // Verifica se houve alterações
      const hasChanges =
        defaultDuration !== originalConfig.defaultDuration ||
        bufferTime !== originalConfig.bufferTime ||
        allowSameDay !== originalConfig.allowSameDay ||
        minAdvanceHours !== originalConfig.minAdvanceHours ||
        maxAdvanceDays !== originalConfig.maxAdvanceDays ||
        cancellationPolicy !== originalConfig.cancellationPolicy;

      // Se não houve alterações, apenas avança para o próximo passo
      if (!hasChanges) {
        setCurrentStep(2);
        return;
      }

      const duration = parseInt(defaultDuration);
      if (isNaN(duration) || duration < 15 || duration > 240) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Duração padrão deve estar entre 15 e 240 minutos",
        });
        return;
      }

      const buffer = parseInt(bufferTime);
      if (isNaN(buffer) || buffer < 0 || buffer > 120) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Tempo de intervalo deve estar entre 0 e 120 minutos",
        });
        return;
      }

      const minHours = parseInt(minAdvanceHours);
      if (isNaN(minHours) || minHours < 0 || minHours > 168) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Antecedência mínima deve estar entre 0 e 168 horas",
        });
        return;
      }

      const maxDays = parseInt(maxAdvanceDays);
      if (isNaN(maxDays) || maxDays < 1 || maxDays > 365) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Antecedência máxima deve estar entre 1 e 365 dias",
        });
        return;
      }

      setSaving(true);

      const data: CreateAvailabilityConfigDto = {
        defaultDuration: duration,
        bufferTime: buffer,
        allowSameDay,
        minAdvanceHours: minHours,
        maxAdvanceDays: maxDays,
        cancellationPolicy: cancellationPolicy || undefined,
      };

      await availabilityService.createOrUpdateConfig(data);

      Toast.show({
        type: "success",
        text1: "Passo 1 Concluído",
        text2: "Configuração salva! Agora defina seus horários semanais.",
      });

      setCurrentStep(2);
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

  // ============= STEP 2 - Horários Semanais =============
  const getScheduleForDay = (day: DayOfWeek): WeeklySchedule | undefined => {
    return schedules.find((s) => s.dayOfWeek === day);
  };

  const openScheduleModal = (day: DayOfWeek) => {
    const schedule = getScheduleForDay(day);

    if (schedule) {
      setIsAvailable(schedule.isAvailable);
      setStartTime(schedule.startTime);
      setEndTime(schedule.endTime);
      setHasLunchBreak(!!schedule.lunchBreak);
      setLunchStart(schedule.lunchBreak?.start || "12:00");
      setLunchEnd(schedule.lunchBreak?.end || "13:00");
    } else {
      setIsAvailable(true);
      setStartTime("08:00");
      setEndTime("18:00");
      setHasLunchBreak(false);
      setLunchStart("12:00");
      setLunchEnd("13:00");
    }

    setEditingDay(day);
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async () => {
    if (!editingDay) return;

    // Validações
    if (!isAvailable) {
      try {
        setSaving(true);
        const existingSchedule = getScheduleForDay(editingDay);

        if (existingSchedule) {
          await availabilityService.updateWeeklySchedule(editingDay, {
            isAvailable: false,
          });
        } else {
          await availabilityService.createWeeklySchedule({
            dayOfWeek: editingDay,
            isAvailable: false,
            startTime: "00:00",
            endTime: "00:00",
          });
        }

        const response = await availabilityService.getConfig();
        const config = extractData(response);
        setSchedules(config.weeklySchedules || []);

        Toast.show({
          type: "success",
          text1: "Sucesso",
          text2: `${DayOfWeekLabels[editingDay]} marcado como indisponível`,
        });

        setShowScheduleModal(false);
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: error.message,
        });
      } finally {
        setSaving(false);
      }
      return;
    }

    if (startTime >= endTime) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Horário de término deve ser após o horário de início",
      });
      return;
    }

    if (
      hasLunchBreak &&
      (lunchStart >= lunchEnd || lunchStart < startTime || lunchEnd > endTime)
    ) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Horários de almoço inválidos",
      });
      return;
    }

    try {
      setSaving(true);
      const existingSchedule = getScheduleForDay(editingDay);

      if (existingSchedule) {
        const updateData: UpdateWeeklyScheduleDto = {
          isAvailable,
          startTime,
          endTime,
          lunchBreak: hasLunchBreak
            ? { start: lunchStart, end: lunchEnd }
            : null,
        };
        await availabilityService.updateWeeklySchedule(editingDay, updateData);
      } else {
        const createData: CreateWeeklyScheduleDto = {
          dayOfWeek: editingDay,
          isAvailable,
          startTime,
          endTime,
          lunchBreak: hasLunchBreak
            ? { start: lunchStart, end: lunchEnd }
            : undefined,
        };
        await availabilityService.createWeeklySchedule(createData);
      }

      const response = await availabilityService.getConfig();
      const config = extractData(response);
      setSchedules(config.weeklySchedules || []);

      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: "Horário salvo!",
      });

      setShowScheduleModal(false);
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

  const handleNextToStep3 = () => {
    const hasSchedules = schedules.some((s) => s.isAvailable);
    if (!hasSchedules) {
      Toast.show({
        type: "error",
        text1: "Atenção",
        text2: "Configure pelo menos um dia de atendimento antes de continuar",
      });
      return;
    }

    Toast.show({
      type: "success",
      text1: "Passo 2 Concluído",
      text2: "Horários salvos! Agora bloqueie períodos se necessário.",
    });

    setCurrentStep(3);
  };

  // ============= STEP 3 - Períodos Bloqueados =============
  const openPeriodModal = () => {
    setEditingPeriodId(null);
    resetPeriodForm({
      reason: "",
      isAllDay: true,
      startDate: new Date(),
      endDate: new Date(),
      periodStartTime: "08:00",
      periodEndTime: "18:00",
    });
    setShowPeriodModal(true);
  };

  const openEditPeriodModal = (period: BlockedPeriod) => {
    setEditingPeriodId(period.id);

    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);
    const startTime = `${startDate
      .getHours()
      .toString()
      .padStart(2, "0")}:${startDate.getMinutes().toString().padStart(2, "0")}`;
    const endTime = `${endDate.getHours().toString().padStart(2, "0")}:${endDate
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    resetPeriodForm({
      reason: period.reason || "",
      isAllDay: period.isAllDay,
      startDate: startDate,
      endDate: endDate,
      periodStartTime: startTime,
      periodEndTime: endTime,
    });

    setShowPeriodModal(true);
  };

  const handleDeletePeriod = async (periodId: string) => {
    try {
      setSaving(true);

      await availabilityService.deleteBlockedPeriod(periodId);

      const periodsResponse = await availabilityService.getBlockedPeriods();
      const periodsData = extractData(periodsResponse);
      setPeriods(periodsData);

      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: "Período bloqueado excluído!",
      });
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

  const onSubmitPeriod = async (formData: any) => {
    try {
      setSaving(true);

      let finalStartDate: string;
      let finalEndDate: string;

      if (formData.isAllDay) {
        // Dia inteiro: startDate às 00:00 até endDate às 23:59
        const start = new Date(formData.startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(formData.endDate);
        end.setHours(23, 59, 59, 999);

        finalStartDate = start.toISOString();
        finalEndDate = end.toISOString();
      } else {
        // Horário específico: mesma data com horários diferentes
        const [startHour, startMinute] = formData.periodStartTime
          .split(":")
          .map(Number);
        const [endHour, endMinute] = formData.periodEndTime
          .split(":")
          .map(Number);

        const start = new Date(formData.startDate);
        start.setHours(startHour, startMinute, 0, 0);

        const end = new Date(formData.startDate);
        end.setHours(endHour, endMinute, 0, 0);

        finalStartDate = start.toISOString();
        finalEndDate = end.toISOString();
      }

      const data: CreateBlockedPeriodDto = {
        startDate: finalStartDate,
        endDate: finalEndDate,
        reason: formData.reason,
        isAllDay: formData.isAllDay,
      };

      if (editingPeriodId) {
        await availabilityService.updateBlockedPeriod(editingPeriodId, data);
      } else {
        await availabilityService.createBlockedPeriod(data);
      }

      const periodsResponse = await availabilityService.getBlockedPeriods();
      const periodsData = extractData(periodsResponse);
      setPeriods(periodsData);

      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: editingPeriodId
          ? "Período bloqueado atualizado!"
          : "Período bloqueado adicionado!",
      });

      setShowPeriodModal(false);
      setEditingPeriodId(null);
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

  const handleFinish = () => {
    Toast.show({
      type: "success",
      text1: "Configuração Completa!",
      text2: "Sua disponibilidade foi configurada com sucesso.",
    });

    navigation.goBack();
  };

  // ============= RENDER =============
  // Skeleton para Step 1
  const renderStep1Skeleton = () => (
    <View style={styles.section}>
      <SkeletonBox
        style={[styles.skeleton, styles.skeletonTitle, { width: "60%" }]}
      />
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.field}>
          <SkeletonBox
            style={[styles.skeleton, styles.skeletonLabel, { width: "40%" }]}
          />
          <SkeletonBox style={[styles.skeleton, styles.skeletonInput]} />
        </View>
      ))}
    </View>
  );

  // Skeleton para Step 2
  const renderStep2Skeleton = () => (
    <View style={styles.section}>
      <SkeletonBox
        style={[styles.skeleton, styles.skeletonTitle, { width: "50%" }]}
      />
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <SkeletonBox
          key={i}
          style={[styles.skeleton, styles.skeletonCard, { marginBottom: 12 }]}
        />
      ))}
    </View>
  );

  // Skeleton para Step 3
  const renderStep3Skeleton = () => (
    <View style={styles.section}>
      <SkeletonBox
        style={[styles.skeleton, styles.skeletonTitle, { width: "55%" }]}
      />
      {[1, 2, 3].map((i) => (
        <SkeletonBox
          key={i}
          style={[styles.skeleton, styles.skeletonCard, { marginBottom: 12 }]}
        />
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Progress Steps */}
          <View style={styles.stepsContainer}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep >= 1 && styles.stepCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    currentStep >= 1 && styles.stepNumberActive,
                  ]}
                >
                  1
                </Text>
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  currentStep === 1 && styles.stepLabelActive,
                ]}
              >
                Configuração
              </Text>
            </View>
            <View
              style={[
                styles.stepLine,
                currentStep >= 2 && styles.stepLineActive,
              ]}
            />
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep >= 2 && styles.stepCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    currentStep >= 2 && styles.stepNumberActive,
                  ]}
                >
                  2
                </Text>
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  currentStep === 2 && styles.stepLabelActive,
                ]}
              >
                Horários
              </Text>
            </View>
            <View
              style={[
                styles.stepLine,
                currentStep >= 3 && styles.stepLineActive,
              ]}
            />
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep >= 3 && styles.stepCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    currentStep >= 3 && styles.stepNumberActive,
                  ]}
                >
                  3
                </Text>
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  currentStep === 3 && styles.stepLabelActive,
                ]}
              >
                Períodos
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
          >
            {currentStep === 1 && renderStep1Skeleton()}
            {currentStep === 2 && renderStep2Skeleton()}
            {currentStep === 3 && renderStep3Skeleton()}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Progress Steps */}
        <View style={styles.stepsContainer}>
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                currentStep >= 1 && styles.stepCircleActive,
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  currentStep >= 1 && styles.stepNumberActive,
                ]}
              >
                1
              </Text>
            </View>
            <Text
              style={[
                styles.stepLabel,
                currentStep === 1 && styles.stepLabelActive,
              ]}
            >
              Configuração
            </Text>
          </View>
          <View
            style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]}
          />
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                currentStep >= 2 && styles.stepCircleActive,
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  currentStep >= 2 && styles.stepNumberActive,
                ]}
              >
                2
              </Text>
            </View>
            <Text
              style={[
                styles.stepLabel,
                currentStep === 2 && styles.stepLabelActive,
              ]}
            >
              Horários
            </Text>
          </View>
          <View
            style={[styles.stepLine, currentStep >= 3 && styles.stepLineActive]}
          />
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                currentStep >= 3 && styles.stepCircleActive,
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  currentStep >= 3 && styles.stepNumberActive,
                ]}
              >
                3
              </Text>
            </View>
            <Text
              style={[
                styles.stepLabel,
                currentStep === 3 && styles.stepLabelActive,
              ]}
            >
              Bloqueios
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
        >
          {/* STEP 1 - Configuração Geral */}
          {currentStep === 1 && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Configurações Gerais</Text>

                <View style={styles.field}>
                  <Text style={styles.label}>
                    Duração padrão da consulta (minutos)
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={defaultDuration}
                    onChangeText={setDefaultDuration}
                    keyboardType="numeric"
                    placeholder="60"
                  />
                  <Text style={styles.hint}>Entre 15 e 240 minutos</Text>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>
                    Intervalo entre consultas (minutos)
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={bufferTime}
                    onChangeText={setBufferTime}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Text style={styles.hint}>Entre 0 e 120 minutos</Text>
                </View>

                <View style={styles.switchField}>
                  <View style={styles.switchLabelContainer}>
                    <Text style={styles.label}>
                      Permitir agendamento no mesmo dia
                    </Text>
                    <Text style={styles.hint}>
                      Se desativado, pacientes não podem agendar para hoje
                    </Text>
                  </View>
                  <Switch
                    value={allowSameDay}
                    onValueChange={setAllowSameDay}
                    trackColor={{ false: "#767577", true: "#c19fd1" }}
                    thumbColor={allowSameDay ? "#8b5a9f" : "#f4f3f4"}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Antecedência mínima (horas)</Text>
                  <TextInput
                    style={styles.input}
                    value={minAdvanceHours}
                    onChangeText={setMinAdvanceHours}
                    keyboardType="numeric"
                    placeholder="24"
                  />
                  <Text style={styles.hint}>
                    Tempo mínimo necessário antes da consulta (0-168 horas)
                  </Text>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Antecedência máxima (dias)</Text>
                  <TextInput
                    style={styles.input}
                    value={maxAdvanceDays}
                    onChangeText={setMaxAdvanceDays}
                    keyboardType="numeric"
                    placeholder="90"
                  />
                  <Text style={styles.hint}>
                    Até quantos dias no futuro pode agendar (1-365 dias)
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Política de Cancelamento
                </Text>

                <View style={styles.field}>
                  <Text style={styles.label}>Política (opcional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={cancellationPolicy}
                    onChangeText={setCancellationPolicy}
                    multiline
                    numberOfLines={4}
                    placeholder="Ex: Cancelamentos devem ser feitos com pelo menos 24h de antecedência..."
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  styles.primaryButtonFullWidth,
                  saving && styles.buttonDisabled,
                ]}
                onPress={handleSaveConfig}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>
                      Salvar e Continuar
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* STEP 2 - Horários Semanais */}
          {currentStep === 2 && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Horários Semanais</Text>
                <Text style={styles.sectionSubtitle}>
                  Configure os dias e horários que você atende
                </Text>

                {DAYS_ORDER.map((day) => {
                  const schedule = getScheduleForDay(day);

                  return (
                    <View key={day} style={styles.dayCard}>
                      <View style={styles.dayHeader}>
                        <Text style={styles.dayName}>
                          {DayOfWeekLabels[day]}
                        </Text>
                        {schedule && (
                          <View
                            style={[
                              styles.statusBadge,
                              schedule.isAvailable
                                ? styles.statusAvailable
                                : styles.statusUnavailable,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                {
                                  color: schedule.isAvailable
                                    ? "#2E7D32"
                                    : "#C62828",
                                },
                              ]}
                            >
                              {schedule.isAvailable
                                ? "Disponível"
                                : "Indisponível"}
                            </Text>
                          </View>
                        )}
                      </View>

                      {schedule?.isAvailable && (
                        <View style={styles.scheduleInfo}>
                          <Text style={styles.scheduleInfoText}>
                            {schedule.startTime} - {schedule.endTime}
                          </Text>
                          {schedule.lunchBreak && (
                            <Text style={styles.scheduleInfoText}>
                              Almoço: {schedule.lunchBreak.start} -{" "}
                              {schedule.lunchBreak.end}
                            </Text>
                          )}
                        </View>
                      )}

                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => openScheduleModal(day)}
                      >
                        <Ionicons
                          name={
                            schedule ? "create-outline" : "add-circle-outline"
                          }
                          size={18}
                          color="#8b5a9f"
                        />
                        <Text style={styles.editButtonText}>
                          {schedule ? "Editar" : "Configurar"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setCurrentStep(1)}
                >
                  <Ionicons name="arrow-back" size={20} color="#8b5a9f" />
                  <Text style={styles.secondaryButtonText}>Voltar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleNextToStep3}
                >
                  <Text style={styles.primaryButtonText}>Continuar</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* STEP 3 - Períodos Bloqueados */}
          {currentStep === 3 && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Períodos Bloqueados</Text>
                <Text style={styles.sectionSubtitle}>
                  Bloqueie férias, feriados e outros períodos sem atendimento
                </Text>

                {periods.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyStateText}>
                      Nenhum período bloqueado
                    </Text>
                    <Text style={styles.emptyStateHint}>
                      Adicione férias ou feriados para bloquear agendamentos
                    </Text>
                  </View>
                ) : (
                  periods.map((period) => {
                    const startDate = new Date(period.startDate);
                    const endDate = new Date(period.endDate);
                    const startTime = `${startDate
                      .getHours()
                      .toString()
                      .padStart(2, "0")}:${startDate
                      .getMinutes()
                      .toString()
                      .padStart(2, "0")}`;
                    const endTime = `${endDate
                      .getHours()
                      .toString()
                      .padStart(2, "0")}:${endDate
                      .getMinutes()
                      .toString()
                      .padStart(2, "0")}`;

                    return (
                      <View key={period.id} style={styles.periodCard}>
                        <View style={styles.periodContent}>
                          <View style={styles.periodInfo}>
                            <View style={styles.periodHeader}>
                              <Ionicons
                                name="calendar"
                                size={20}
                                color="#8b5a9f"
                              />
                              <Text style={styles.periodDates}>
                                {period.isAllDay
                                  ? `${formatDate(
                                      period.startDate
                                    )} - ${formatDate(period.endDate)}`
                                  : `${formatDate(
                                      period.startDate
                                    )} (${startTime} - ${endTime})`}
                              </Text>
                            </View>
                            <Text style={styles.periodReason}>
                              {period.reason}
                            </Text>
                            <Text style={styles.periodType}>
                              {period.isAllDay
                                ? "Dia inteiro"
                                : "Horário específico"}
                            </Text>
                          </View>
                          <View style={styles.periodActions}>
                            <TouchableOpacity
                              style={styles.iconButton}
                              onPress={() => openEditPeriodModal(period)}
                              disabled={saving}
                            >
                              <Ionicons
                                name="create-outline"
                                size={20}
                                color="#8b5a9f"
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.iconButton}
                              onPress={() => handleDeletePeriod(period.id)}
                              disabled={saving}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={20}
                                color="#d32f2f"
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={openPeriodModal}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color="#8b5a9f"
                  />
                  <Text style={styles.addButtonText}>
                    Adicionar Período Bloqueado
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setCurrentStep(2)}
                >
                  <Ionicons name="arrow-back" size={20} color="#8b5a9f" />
                  <Text style={styles.secondaryButtonText}>Voltar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleFinish}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Concluir</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Horário Semanal */}
      {showScheduleModal && editingDay && (
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior="padding"
            style={styles.modalKeyboardAvoid}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Configurar {DayOfWeekLabels[editingDay]}
              </Text>
              <ScrollView style={styles.modalScrollView}>
                <View style={styles.switchField}>
                  <Text style={styles.label}>Disponível neste dia</Text>
                  <Switch
                    value={isAvailable}
                    onValueChange={setIsAvailable}
                    trackColor={{ false: "#767577", true: "#c19fd1" }}
                    thumbColor={isAvailable ? "#8b5a9f" : "#f4f3f4"}
                  />
                </View>

                {isAvailable && (
                  <>
                    <View style={styles.field}>
                      <Text style={styles.label}>Horário de Início</Text>
                      <TextInput
                        style={styles.input}
                        value={startTime}
                        onChangeText={(text) =>
                          setStartTime(formatTimeInput(text))
                        }
                        onBlur={() =>
                          setStartTime(validateAndFixTime(startTime))
                        }
                        placeholder="08:00"
                        keyboardType="numeric"
                        maxLength={5}
                      />
                    </View>

                    <View style={styles.field}>
                      <Text style={styles.label}>Horário de Término</Text>
                      <TextInput
                        style={styles.input}
                        value={endTime}
                        onChangeText={(text) =>
                          setEndTime(formatTimeInput(text))
                        }
                        onBlur={() => setEndTime(validateAndFixTime(endTime))}
                        placeholder="18:00"
                        keyboardType="numeric"
                        maxLength={5}
                      />
                    </View>

                    <View style={styles.switchField}>
                      <Text style={styles.label}>Intervalo para almoço</Text>
                      <Switch
                        value={hasLunchBreak}
                        onValueChange={setHasLunchBreak}
                        trackColor={{ false: "#767577", true: "#c19fd1" }}
                        thumbColor={hasLunchBreak ? "#8b5a9f" : "#f4f3f4"}
                      />
                    </View>

                    {hasLunchBreak && (
                      <>
                        <View style={styles.field}>
                          <Text style={styles.label}>Início do Almoço</Text>
                          <TextInput
                            style={styles.input}
                            value={lunchStart}
                            onChangeText={(text) =>
                              setLunchStart(formatTimeInput(text))
                            }
                            onBlur={() =>
                              setLunchStart(validateAndFixTime(lunchStart))
                            }
                            placeholder="12:00"
                            keyboardType="numeric"
                            maxLength={5}
                          />
                        </View>

                        <View style={styles.field}>
                          <Text style={styles.label}>Fim do Almoço</Text>
                          <TextInput
                            style={styles.input}
                            value={lunchEnd}
                            onChangeText={(text) =>
                              setLunchEnd(formatTimeInput(text))
                            }
                            onBlur={() =>
                              setLunchEnd(validateAndFixTime(lunchEnd))
                            }
                            placeholder="13:00"
                            keyboardType="numeric"
                            maxLength={5}
                          />
                        </View>
                      </>
                    )}
                  </>
                )}
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setShowScheduleModal(false)}
                  disabled={saving}
                >
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleSaveSchedule}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Salvar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Modal Período Bloqueado */}
      {showPeriodModal && (
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior="padding"
            style={styles.modalKeyboardAvoid}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingPeriodId
                  ? "Editar Período Bloqueado"
                  : "Adicionar Período Bloqueado"}
              </Text>
              <ScrollView style={styles.modalScrollView}>
                <View style={styles.field}>
                  <Text style={styles.label}>
                    Motivo <Text style={styles.required}>*</Text>
                  </Text>
                  <Controller
                    control={periodControl}
                    name="reason"
                    rules={{
                      required: "O motivo é obrigatório",
                      minLength: {
                        value: 3,
                        message: "O motivo deve ter no mínimo 3 caracteres",
                      },
                    }}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={[
                          styles.input,
                          periodErrors.reason && styles.inputError,
                        ]}
                        value={value}
                        onChangeText={onChange}
                        placeholder="Ex: Férias, Feriado, Congresso..."
                      />
                    )}
                  />
                  {periodErrors.reason && (
                    <Text style={styles.errorText}>
                      {periodErrors.reason.message}
                    </Text>
                  )}
                </View>

                <View style={styles.switchField}>
                  <Text style={styles.label}>Dia inteiro</Text>
                  <Controller
                    control={periodControl}
                    name="isAllDay"
                    render={({ field: { onChange, value } }) => (
                      <Switch
                        value={value}
                        onValueChange={onChange}
                        trackColor={{ false: "#767577", true: "#c19fd1" }}
                        thumbColor={value ? "#8b5a9f" : "#f4f3f4"}
                      />
                    )}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Data de Início</Text>
                  <Controller
                    control={periodControl}
                    name="startDate"
                    render={({ field: { onChange, value } }) => (
                      <>
                        <TouchableOpacity
                          style={styles.dateButton}
                          onPress={() => setShowStartPicker(true)}
                        >
                          <Text>{formatDate(value.toISOString())}</Text>
                          <Ionicons
                            name="calendar-outline"
                            size={20}
                            color="#666"
                          />
                        </TouchableOpacity>
                        {showStartPicker && (
                          <DateTimePicker
                            value={value}
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                              setShowStartPicker(false);
                              if (selectedDate) onChange(selectedDate);
                            }}
                          />
                        )}
                      </>
                    )}
                  />
                </View>

                {isAllDay ? (
                  <View style={styles.field}>
                    <Text style={styles.label}>Data de Término</Text>
                    <Controller
                      control={periodControl}
                      name="endDate"
                      render={({ field: { onChange, value } }) => (
                        <>
                          <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowEndPicker(true)}
                          >
                            <Text>{formatDate(value.toISOString())}</Text>
                            <Ionicons
                              name="calendar-outline"
                              size={20}
                              color="#666"
                            />
                          </TouchableOpacity>
                          {showEndPicker && (
                            <DateTimePicker
                              value={value}
                              mode="date"
                              display="default"
                              onChange={(event, selectedDate) => {
                                setShowEndPicker(false);
                                if (selectedDate) onChange(selectedDate);
                              }}
                            />
                          )}
                        </>
                      )}
                    />
                  </View>
                ) : (
                  <>
                    <View style={styles.field}>
                      <Text style={styles.label}>
                        Horário de Início <Text style={styles.required}>*</Text>
                      </Text>
                      <Controller
                        control={periodControl}
                        name="periodStartTime"
                        rules={{
                          required: "O horário de início é obrigatório",
                          pattern: {
                            value: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
                            message: "Formato inválido (HH:MM)",
                          },
                        }}
                        render={({ field: { onChange, value } }) => (
                          <TextInput
                            style={[
                              styles.input,
                              periodErrors.periodStartTime && styles.inputError,
                            ]}
                            value={value}
                            onChangeText={(text) =>
                              onChange(formatTimeInput(text))
                            }
                            onBlur={() => onChange(validateAndFixTime(value))}
                            placeholder="08:00"
                            keyboardType="numeric"
                            maxLength={5}
                          />
                        )}
                      />
                      {periodErrors.periodStartTime && (
                        <Text style={styles.errorText}>
                          {periodErrors.periodStartTime.message}
                        </Text>
                      )}
                    </View>

                    <View style={styles.field}>
                      <Text style={styles.label}>
                        Horário de Término{" "}
                        <Text style={styles.required}>*</Text>
                      </Text>
                      <Controller
                        control={periodControl}
                        name="periodEndTime"
                        rules={{
                          required: "O horário de término é obrigatório",
                          pattern: {
                            value: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
                            message: "Formato inválido (HH:MM)",
                          },
                          validate: (value) => {
                            const startTime = watchPeriod("periodStartTime");
                            if (value <= startTime) {
                              return "Horário de término deve ser após o horário de início";
                            }
                            return true;
                          },
                        }}
                        render={({ field: { onChange, value } }) => (
                          <TextInput
                            style={[
                              styles.input,
                              periodErrors.periodEndTime && styles.inputError,
                            ]}
                            value={value}
                            onChangeText={(text) =>
                              onChange(formatTimeInput(text))
                            }
                            onBlur={() => onChange(validateAndFixTime(value))}
                            placeholder="18:00"
                            keyboardType="numeric"
                            maxLength={5}
                          />
                        )}
                      />
                      {periodErrors.periodEndTime && (
                        <Text style={styles.errorText}>
                          {periodErrors.periodEndTime.message}
                        </Text>
                      )}
                    </View>
                  </>
                )}
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setShowPeriodModal(false)}
                  disabled={saving}
                >
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handlePeriodSubmit(onSubmitPeriod)}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Salvar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },

  // Steps
  stepsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  stepItem: {
    alignItems: "center",
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: "#8b5a9f",
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#999",
  },
  stepNumberActive: {
    color: "#fff",
  },
  stepLabel: {
    fontSize: 12,
    color: "#999",
  },
  stepLabelActive: {
    color: "#8b5a9f",
    fontWeight: "600",
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 8,
    marginBottom: 20,
  },
  stepLineActive: {
    backgroundColor: "#8b5a9f",
  },

  // Section
  section: {
    backgroundColor: "#fff",
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },

  // Form
  field: {
    marginBottom: 16,
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
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  hint: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  inputError: {
    borderColor: "#d32f2f",
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    color: "#d32f2f",
    marginTop: 4,
  },
  required: {
    color: "#d32f2f",
  },
  switchField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },

  // Day Card
  dayCard: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dayName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusAvailable: {
    backgroundColor: "#E8F5E9",
  },
  statusUnavailable: {
    backgroundColor: "#FFEBEE",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  scheduleInfo: {
    marginBottom: 8,
  },
  scheduleInfoText: {
    fontSize: 14,
    color: "#666",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    color: "#8b5a9f",
    fontWeight: "600",
  },

  // Period Card
  periodCard: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  periodContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  periodInfo: {
    flex: 1,
    marginRight: 12,
  },
  periodHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  periodDates: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  periodReason: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  periodType: {
    fontSize: 12,
    color: "#999",
  },
  periodActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
    marginTop: 12,
  },
  emptyStateHint: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 4,
  },

  // Buttons
  primaryButton: {
    flex: 1,
    backgroundColor: "#8b5a9f",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonFullWidth: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#8b5a9f",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#8b5a9f",
    fontSize: 16,
    fontWeight: "bold",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#8b5a9f",
    borderStyle: "dashed",
    marginTop: 8,
    gap: 8,
  },
  addButtonText: {
    color: "#8b5a9f",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },

  // Modal
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalKeyboardAvoid: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxHeight: "85%",
    flexDirection: "column",
  },
  modalScrollView: {
    flexGrow: 1,
    flexShrink: 1,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
  },

  // Skeleton styles
  skeleton: {
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  skeletonTitle: {
    height: 24,
    marginBottom: 20,
  },
  skeletonLabel: {
    height: 16,
    marginBottom: 8,
  },
  skeletonInput: {
    height: 48,
    width: "100%",
    borderRadius: 8,
  },
  skeletonCard: {
    height: 80,
    borderRadius: 8,
  },
});
