/**
 * Step1BasicInfo - Formulário de Informações Básicas do Plano
 *
 * Responsabilidades:
 * - Coleta de informações básicas do plano (nome, descrição, período)
 * - Seleção de paciente
 * - Definição de metas nutricionais (manual ou automática)
 * - Validação e navegação para Step 2
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { lightTheme } from "../../../../theme";
import { useMealPlansStore } from "../../../../stores/meal-plans.store";
import { usePatientsStore } from "../../../../stores/patients.store";
import {
  PLAN_STATUS_INFO,
  validatePlanData,
} from "../../../../utils/meal-plan.utils";
import { GOAL_TYPES } from "../utils/constants";
import { StepHeader } from "../components/StepHeader";
import { useMealPlans, type MealPlan } from "../../../../hooks/useMealPlans";

interface Step1BasicInfoProps {
  onNext: () => void;
  navigation: any;
  route?: {
    params?: {
      patientId?: string;
      patientName?: string;
    };
  };
}

export default function Step1BasicInfo({
  onNext,
  navigation,
  route,
}: Step1BasicInfoProps) {
  const { initBuilder, updateBuilderField, loading, builderState } =
    useMealPlansStore();

  // Usar selector explícito para garantir que sempre pegue um array
  const patientsData = usePatientsStore((state) => state.patients);
  const loadPatients = usePatientsStore((state) => state.loadPatients);

  // Garantir que patients seja sempre um array
  const patients = Array.isArray(patientsData) ? patientsData : [];

  // Form state - usar builderState quando disponível
  const [name, setName] = useState(builderState?.planName || "");
  const [description, setDescription] = useState(
    builderState?.description || ""
  );
  const [selectedPatientId, setSelectedPatientId] = useState(
    builderState?.patientId || ""
  );
  const [startDate, setStartDate] = useState(
    builderState?.startDate ? new Date(builderState.startDate) : new Date()
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    builderState?.endDate ? new Date(builderState.endDate) : undefined
  );
  const [hasEndDate, setHasEndDate] = useState(!!builderState?.endDate);
  const [status, setStatus] = useState<
    "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED"
  >(builderState?.status || "DRAFT");

  // Metas nutricionais
  const [targetCalories, setTargetCalories] = useState(
    builderState?.targetCalories?.toString() || ""
  );
  const [targetProtein, setTargetProtein] = useState(
    builderState?.targetProtein?.toString() || ""
  );
  const [targetCarbs, setTargetCarbs] = useState(
    builderState?.targetCarbs?.toString() || ""
  );
  const [targetFat, setTargetFat] = useState(
    builderState?.targetFat?.toString() || ""
  );
  const [targetFiber, setTargetFiber] = useState(
    builderState?.targetFiber?.toString() || ""
  );
  const [notes, setNotes] = useState(builderState?.notes || "");
  const [isTemplate, setIsTemplate] = useState(
    builderState?.isTemplate || false
  );

  // Date pickers
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Safe area insets for Android navigation bar
  const insets = useSafeAreaInsets();

  // Modal state
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [calculatedGoalType, setCalculatedGoalType] = useState<
    (typeof GOAL_TYPES)[number] | null
  >(null);

  // Template state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<MealPlan[]>([]);
  const [templateSearch, setTemplateSearch] = useState("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const { listTemplates, getMealPlanById } = useMealPlans();

  // Selected patient
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  useEffect(() => {
    loadPatients().catch((err) => {
      console.error("Error loading patients:", err);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível carregar os pacientes.",
        position: "bottom",
        visibilityTime: 3000,
      });
    });
  }, [loadPatients]);

  // Preencher patientId se vier da navegação
  useEffect(() => {
    if (route?.params?.patientId) {
      setSelectedPatientId(route.params.patientId);
    }
  }, [route?.params?.patientId]);

  // Sincronizar com builderState quando voltar do Step2
  useEffect(() => {
    if (builderState) {
      setName(builderState.planName || "");
      setDescription(builderState.description || "");
      setSelectedPatientId(builderState.patientId || "");
      setStartDate(
        builderState.startDate ? new Date(builderState.startDate) : new Date()
      );
      setEndDate(
        builderState.endDate ? new Date(builderState.endDate) : undefined
      );
      setHasEndDate(!!builderState.endDate);
      setStatus(builderState.status || "DRAFT");
      setTargetCalories(builderState.targetCalories?.toString() || "");
      setTargetProtein(builderState.targetProtein?.toString() || "");
      setTargetCarbs(builderState.targetCarbs?.toString() || "");
      setTargetFat(builderState.targetFat?.toString() || "");
      setTargetFiber(builderState.targetFiber?.toString() || "");
      setNotes(builderState.notes || "");
      setIsTemplate(builderState.isTemplate || false);
    }
  }, [builderState]);

  // Função para calcular metas nutricionais automaticamente
  const calculateNutritionalGoals = async (
    goalType: (typeof GOAL_TYPES)[number]
  ) => {
    if (!selectedPatientId && !route?.params?.patientId) {
      Toast.show({
        type: "error",
        text1: "Atenção",
        text2: "Selecione um paciente primeiro",
        position: "bottom",
        visibilityTime: 3000,
      });
      return;
    }

    setLoadingGoals(true);
    try {
      // TODO: Buscar última avaliação do paciente
      // const lastMeasurement = await fetchLastMeasurement(patientId);
      // TODO: Buscar último plano alimentar
      // const lastPlan = await fetchLastPlan(patientId);

      // Por enquanto, vamos usar valores exemplo baseados em um peso médio
      // Em produção, isso virá das medidas reais do paciente
      const estimatedWeight = 70; // kg (virá da última avaliação)
      // const estimatedTMB = 1800; // kcal (virá do cálculo da última avaliação)

      // Calcular macros baseado no tipo de meta
      const protein = Math.round(
        estimatedWeight * goalType.multipliers.protein
      );
      const carbs = Math.round(estimatedWeight * goalType.multipliers.carbs);
      const fat = Math.round(estimatedWeight * goalType.multipliers.fat);
      const fiber = Math.round(estimatedWeight * 0.35); // ~25-30g padrão

      // Calcular calorias totais (1g proteína = 4kcal, 1g carbo = 4kcal, 1g gordura = 9kcal)
      const calories = Math.round(protein * 4 + carbs * 4 + fat * 9);

      // Preencher os campos
      setTargetCalories(calories.toString());
      setTargetProtein(protein.toString());
      setTargetCarbs(carbs.toString());
      setTargetFat(fat.toString());
      setTargetFiber(fiber.toString());

      setShowGoalsModal(false);
      setCalculatedGoalType(goalType);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Erro ao calcular metas:", error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível calcular as metas automaticamente",
        position: "bottom",
        visibilityTime: 3000,
      });
    } finally {
      setLoadingGoals(false);
    }
  };

  // Função para carregar templates
  const loadTemplatesList = async () => {
    setLoadingTemplates(true);
    try {
      const templatesData = await listTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error("Erro ao carregar templates:", error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível carregar os templates",
        position: "bottom",
        visibilityTime: 3000,
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Função para selecionar template
  const handleSelectTemplate = async (templateSummary: MealPlan) => {
    try {
      // Buscar o template completo com todos os dados
      const templateFull = await getMealPlanById(templateSummary.id);

      // Preencher campos básicos
      setName(templateFull.name ? `${templateFull.name} (Cópia)` : "");
      setDescription(templateFull.description || "");

      // Acessar os campos de nutrição do objeto nutrition
      const nutrition = (templateFull as any).nutrition;
      if (nutrition) {
        setTargetCalories(nutrition.targetCalories?.toString() || "");
        setTargetProtein(nutrition.targetProtein?.toString() || "");
        setTargetCarbs(nutrition.targetCarbs?.toString() || "");
        setTargetFat(nutrition.targetFat?.toString() || "");
        setTargetFiber(nutrition.targetFiber?.toString() || "");
      }

      setNotes(templateFull.notes || "");
      setIsTemplate(false); // Nova cópia não é template por padrão

      // Fechar modal
      setShowTemplateModal(false);
      setTemplateSearch("");

      Toast.show({
        type: "success",
        text1: "Template carregado!",
        text2:
          "Os dados foram preenchidos. Selecione um paciente para continuar.",
        position: "bottom",
        visibilityTime: 3000,
      });
    } catch (error) {
      console.error("Erro ao carregar template:", error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível carregar o template",
        position: "bottom",
        visibilityTime: 3000,
      });
    }
  };

  const handleNext = async () => {
    // Validar dados
    const validation = validatePlanData({
      name,
      patientId: selectedPatientId,
      startDate,
    });

    if (!validation.valid) {
      Toast.show({
        type: "error",
        text1: "Erro de Validação",
        text2: validation.errors.join(" • "),
        position: "bottom",
        visibilityTime: 4000,
      });
      return;
    }

    // Iniciar builder apenas se não existir
    if (!builderState) {
      await initBuilder(selectedPatientId);
    }

    // Atualizar campos do builder (sempre atualiza com os valores do formulário)
    updateBuilderField("planName", name);
    updateBuilderField("description", description);
    updateBuilderField("patientId", selectedPatientId);
    updateBuilderField("startDate", startDate);
    updateBuilderField("endDate", endDate);
    updateBuilderField("status", status as any);
    updateBuilderField(
      "targetCalories",
      targetCalories ? parseFloat(targetCalories) : undefined
    );
    updateBuilderField(
      "targetProtein",
      targetProtein ? parseFloat(targetProtein) : undefined
    );
    updateBuilderField(
      "targetCarbs",
      targetCarbs ? parseFloat(targetCarbs) : undefined
    );
    updateBuilderField(
      "targetFat",
      targetFat ? parseFloat(targetFat) : undefined
    );
    updateBuilderField(
      "targetFiber",
      targetFiber ? parseFloat(targetFiber) : undefined
    );
    updateBuilderField("notes", notes);
    updateBuilderField("isTemplate", isTemplate);

    onNext();
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        {/* Step Header */}
        <StepHeader
          currentStep={1}
          totalSteps={2}
          title="Informações Básicas"
        />

        <KeyboardAvoidingView
          style={styles.flex1}
          behavior="padding"
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {/* Step Progress Bar */}
            <View style={styles.stepIndicator}>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarActive} />
                <View style={styles.progressBarInactive} />
              </View>
            </View>

            {/* Nome do Plano */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Nome do Plano <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                placeholder="Ex: Plano de Emagrecimento - Semana 1"
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Botão Usar Template */}
            <TouchableOpacity
              style={styles.useTemplateButton}
              onPress={() => {
                loadTemplatesList();
                setShowTemplateModal(true);
              }}
            >
              <Ionicons
                name="copy-outline"
                size={20}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.useTemplateButtonText}>Usar Template</Text>
            </TouchableOpacity>

            {/* Descrição */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                placeholder="Adicione uma descrição (opcional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textArea]}
                placeholderTextColor="#9CA3AF"
                textAlignVertical="top"
              />
            </View>

            {/* Seleção de Paciente */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Paciente <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                onPress={() => {
                  // Se veio de PatientDetails, não permite alterar o paciente
                  if (!route?.params?.patientId) {
                    setShowPatientModal(true);
                  }
                }}
                style={[
                  styles.selectButton,
                  route?.params?.patientId && styles.selectButtonDisabled,
                ]}
                disabled={!!route?.params?.patientId}
              >
                <View style={styles.selectButtonContent}>
                  <View style={styles.selectButtonText}>
                    {(() => {
                      if (
                        route?.params?.patientId &&
                        route?.params?.patientName
                      ) {
                        return (
                          <View>
                            <Text
                              style={[
                                styles.selectedPatientName,
                                styles.selectedPatientNameDisabled,
                              ]}
                            >
                              {route.params.patientName}
                            </Text>
                          </View>
                        );
                      } else if (builderState?.patientName) {
                        return (
                          <View>
                            <Text style={styles.selectedPatientName}>
                              {builderState.patientName}
                            </Text>
                          </View>
                        );
                      } else if (selectedPatient) {
                        return (
                          <View>
                            <Text style={styles.selectedPatientName}>
                              {selectedPatient.name}
                            </Text>
                            {selectedPatient.email && (
                              <Text style={styles.selectedPatientEmail}>
                                {selectedPatient.email}
                              </Text>
                            )}
                          </View>
                        );
                      } else {
                        return (
                          <Text style={styles.placeholder}>
                            Selecionar paciente
                          </Text>
                        );
                      }
                    })()}
                  </View>
                  {!route?.params?.patientId && (
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#9CA3AF"
                    />
                  )}
                </View>
              </TouchableOpacity>
              {route?.params?.patientId && (
                <Text style={styles.fieldHint}>
                  Paciente selecionado automaticamente
                </Text>
              )}
            </View>

            {/* Período */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Período</Text>

              {/* Data de Início */}
              <View style={styles.dateGroup}>
                <Text style={styles.dateLabel}>Data de Início</Text>
                <TouchableOpacity
                  onPress={() => setShowStartDatePicker(true)}
                  style={styles.dateButton}
                >
                  <Text style={styles.dateButtonText}>
                    {startDate.toLocaleDateString("pt-BR")}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={lightTheme.colors.secondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Toggle Data de Fim */}
              <TouchableOpacity
                onPress={() => {
                  const newHasEndDate = !hasEndDate;
                  setHasEndDate(newHasEndDate);
                  if (newHasEndDate) {
                    // Definir data de término como startDate + 45 dias (1 mês e meio)
                    const futureDate = new Date(startDate);
                    futureDate.setDate(futureDate.getDate() + 45);
                    setEndDate(futureDate);
                  }
                }}
                style={styles.checkboxContainer}
              >
                <View
                  style={[
                    styles.checkbox,
                    hasEndDate && styles.checkboxChecked,
                  ]}
                >
                  {hasEndDate && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  Definir data de término
                </Text>
              </TouchableOpacity>

              {/* Data de Fim */}
              {hasEndDate && (
                <View style={styles.dateGroup}>
                  <Text style={styles.dateLabel}>Data de Término</Text>
                  <TouchableOpacity
                    onPress={() => setShowEndDatePicker(true)}
                    style={styles.dateButton}
                  >
                    <Text style={styles.dateButtonText}>
                      {endDate?.toLocaleDateString("pt-BR") || "Selecionar"}
                    </Text>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={lightTheme.colors.secondary}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Status */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusGrid}>
                {Object.values(PLAN_STATUS_INFO).map((statusInfo) => {
                  const isSelected = status === statusInfo.status;
                  return (
                    <TouchableOpacity
                      key={statusInfo.status}
                      onPress={() => setStatus(statusInfo.status)}
                      style={[
                        styles.statusButton,
                        isSelected
                          ? styles.statusButtonSelected
                          : styles.statusButtonUnselected,
                      ]}
                    >
                      <Ionicons
                        name={statusInfo.icon as any}
                        size={16}
                        color={
                          isSelected
                            ? lightTheme.colors.secondary
                            : statusInfo.color
                        }
                      />
                      <Text
                        style={[
                          styles.statusButtonText,
                          isSelected
                            ? styles.statusButtonTextSelected
                            : styles.statusButtonTextUnselected,
                        ]}
                      >
                        {statusInfo.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Metas Nutricionais */}
            <View style={styles.formGroup}>
              <View style={styles.goalsHeader}>
                <View style={styles.goalsHeaderText}>
                  <Text style={styles.label}>
                    Metas Nutricionais (Opcional)
                  </Text>
                  <Text style={styles.goalsDescription}>
                    Defina as metas diárias para acompanhamento
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowGoalsModal(true)}
                  style={styles.autoCalculateButton}
                >
                  <Ionicons
                    name="calculator-outline"
                    size={20}
                    color={lightTheme.colors.white}
                  />
                  <Text style={styles.autoCalculateButtonText}>Auto</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.goalsContainer}>
                {/* Calorias */}
                <View style={styles.goalInputContainer}>
                  <Text style={styles.inputLabel}>Calorias (kcal)</Text>
                  <TextInput
                    placeholder="Ex: 2000"
                    value={targetCalories}
                    onChangeText={setTargetCalories}
                    keyboardType="decimal-pad"
                    style={styles.input}
                    placeholderTextColor={lightTheme.colors.gray[400]}
                  />
                </View>

                {/* Macros em Grid */}
                <View style={styles.macrosGrid}>
                  <View style={styles.macroInputWrapper}>
                    <Text style={styles.inputLabel}>Proteínas (g)</Text>
                    <TextInput
                      placeholder="150"
                      value={targetProtein}
                      onChangeText={setTargetProtein}
                      keyboardType="decimal-pad"
                      style={styles.input}
                      placeholderTextColor={lightTheme.colors.gray[400]}
                    />
                  </View>

                  <View style={styles.macroInputWrapper}>
                    <Text style={styles.inputLabel}>Carbos (g)</Text>
                    <TextInput
                      placeholder="200"
                      value={targetCarbs}
                      onChangeText={setTargetCarbs}
                      keyboardType="decimal-pad"
                      style={styles.input}
                      placeholderTextColor={lightTheme.colors.gray[400]}
                    />
                  </View>
                </View>

                <View style={styles.macrosGrid}>
                  <View style={styles.macroInputWrapper}>
                    <Text style={styles.inputLabel}>Gorduras (g)</Text>
                    <TextInput
                      placeholder="60"
                      value={targetFat}
                      onChangeText={setTargetFat}
                      keyboardType="decimal-pad"
                      style={styles.input}
                      placeholderTextColor={lightTheme.colors.gray[400]}
                    />
                  </View>

                  <View style={styles.macroInputWrapper}>
                    <Text style={styles.inputLabel}>Fibras (g)</Text>
                    <TextInput
                      placeholder="25"
                      value={targetFiber}
                      onChangeText={setTargetFiber}
                      keyboardType="decimal-pad"
                      style={styles.input}
                      placeholderTextColor={lightTheme.colors.gray[400]}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Observações */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Observações Privadas</Text>
              <TextInput
                placeholder="Observações que apenas você verá"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textArea]}
                placeholderTextColor={lightTheme.colors.gray[400]}
                textAlignVertical="top"
              />
            </View>

            {/* Template Toggle */}
            <TouchableOpacity
              onPress={() => setIsTemplate(!isTemplate)}
              style={styles.templateContainer}
            >
              <View
                style={[styles.checkbox, isTemplate && styles.checkboxChecked]}
              >
                {isTemplate && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
              <View style={styles.templateTextContainer}>
                <Text style={styles.templateLabel}>Salvar como template</Text>
                <Text style={styles.templateDescription}>
                  Poderá reutilizar este plano para outros pacientes
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            onPress={handleNext}
            disabled={loading || !name || !selectedPatientId}
            style={[
              styles.nextButton,
              (loading || !name || !selectedPatientId) &&
                styles.nextButtonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  Próximo: Criar Refeições
                </Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowStartDatePicker(false);
              if (date) {
                setStartDate(date);
                // Se hasEndDate estiver ativo, atualizar automaticamente a data de término
                if (hasEndDate) {
                  const futureDate = new Date(date);
                  futureDate.setDate(futureDate.getDate() + 45);
                  setEndDate(futureDate);
                }
              }
            }}
          />
        )}

        {showEndDatePicker && endDate && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            minimumDate={startDate}
            onChange={(event, date) => {
              setShowEndDatePicker(false);
              if (date) setEndDate(date);
            }}
          />
        )}
      </SafeAreaView>

      {/* Modal de Seleção de Paciente */}
      <Modal
        visible={showPatientModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPatientModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header do Modal */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Paciente</Text>
            <TouchableOpacity onPress={() => setShowPatientModal(false)}>
              <Ionicons
                name="close"
                size={24}
                color={lightTheme.colors.gray[900]}
              />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.modalSearchContainer}>
            <View style={styles.modalSearchBar}>
              <Ionicons
                name="search"
                size={20}
                color={lightTheme.colors.gray[400]}
              />
              <TextInput
                placeholder="Buscar paciente..."
                value={patientSearch}
                onChangeText={setPatientSearch}
                style={styles.modalSearchInput}
                placeholderTextColor={lightTheme.colors.gray[400]}
              />
            </View>
          </View>

          {/* Lista de Pacientes */}
          <FlatList
            data={patients.filter(
              (p) =>
                p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                p.email?.toLowerCase().includes(patientSearch.toLowerCase())
            )}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setSelectedPatientId(item.id);
                  setShowPatientModal(false);
                  setPatientSearch("");
                }}
                style={styles.patientItem}
              >
                <View style={styles.patientItemContent}>
                  <View style={styles.patientAvatar}>
                    <Text style={styles.patientAvatarText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{item.name}</Text>
                    {item.email && (
                      <Text style={styles.patientEmail}>{item.email}</Text>
                    )}
                    {item.phone && (
                      <Text style={styles.patientPhone}>{item.phone}</Text>
                    )}
                  </View>
                  {selectedPatientId === item.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#10B981"
                    />
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons
                  name="people-outline"
                  size={64}
                  color={lightTheme.colors.gray[300]}
                />
                <Text style={styles.emptyStateText}>
                  {patientSearch
                    ? "Nenhum paciente encontrado"
                    : "Nenhum paciente cadastrado"}
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* Modal de Seleção de Meta Nutricional */}
      <Modal
        visible={showGoalsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGoalsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header do Modal */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Calcular Metas Automáticas</Text>
              <Text style={styles.modalSubtitle}>
                Escolha um perfil de meta nutricional
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowGoalsModal(false)}>
              <Ionicons
                name="close"
                size={24}
                color={lightTheme.colors.gray[900]}
              />
            </TouchableOpacity>
          </View>

          {/* Lista de Tipos de Meta */}
          <ScrollView style={styles.goalsModalContent}>
            {GOAL_TYPES.map((goalType) => (
              <TouchableOpacity
                key={goalType.id}
                onPress={() => calculateNutritionalGoals(goalType)}
                style={styles.goalTypeCard}
                disabled={loadingGoals}
              >
                <View style={styles.goalTypeIcon}>
                  <Ionicons
                    name={goalType.icon as any}
                    size={32}
                    color={lightTheme.colors.white}
                  />
                </View>
                <View style={styles.goalTypeInfo}>
                  <Text style={styles.goalTypeLabel}>{goalType.label}</Text>
                  <Text style={styles.goalTypeDescription}>
                    {goalType.description}
                  </Text>
                  <View style={styles.goalTypeMultipliers}>
                    <View style={styles.multiplierBadge}>
                      <Text style={styles.multiplierText}>
                        Proteína: {goalType.multipliers.protein}x
                      </Text>
                    </View>
                    <View style={styles.multiplierBadge}>
                      <Text style={styles.multiplierText}>
                        Carbos: {goalType.multipliers.carbs}x
                      </Text>
                    </View>
                    <View style={styles.multiplierBadge}>
                      <Text style={styles.multiplierText}>
                        Gordura: {goalType.multipliers.fat}x
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={lightTheme.colors.gray[400]}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loadingGoals && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator
                size="large"
                color={lightTheme.colors.primary}
              />
              <Text style={styles.loadingText}>Calculando metas...</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Modal de Sucesso - Metas Calculadas */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalCard}>
            {/* Ícone de Sucesso */}
            <View style={styles.successIconContainer}>
              <View style={styles.successIcon}>
                <Ionicons
                  name="checkmark-circle"
                  size={64}
                  color={lightTheme.colors.success}
                />
              </View>
            </View>

            {/* Título e Descrição */}
            <Text style={styles.successTitle}>Metas Calculadas!</Text>
            {calculatedGoalType && (
              <View style={styles.successProfileContainer}>
                <View style={styles.successProfileBadge}>
                  <Ionicons
                    name={calculatedGoalType.icon as any}
                    size={20}
                    color={lightTheme.colors.white}
                  />
                  <Text style={styles.successProfileName}>
                    {calculatedGoalType.label}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.successProfileEditButton}
                  onPress={() => {
                    setShowSuccessModal(false);
                    setShowGoalsModal(true);
                  }}
                >
                  <Ionicons
                    name="reload"
                    size={20}
                    color={lightTheme.colors.white}
                  />
                </TouchableOpacity>
              </View>
            )}
            <Text style={styles.successDescription}>
              As metas foram calculadas com base no perfil selecionado
            </Text>

            {/* Valores Calculados */}
            <View style={styles.successValuesContainer}>
              <View style={styles.successValueRow}>
                <View style={styles.successValueItem}>
                  <Ionicons
                    name="flame-outline"
                    size={24}
                    color={lightTheme.colors.primary}
                  />
                  <Text style={styles.successValueLabel}>Calorias</Text>
                  <Text style={styles.successValueNumber}>
                    {targetCalories || "0"} kcal
                  </Text>
                </View>

                <View style={styles.successValueItem}>
                  <Ionicons name="fitness-outline" size={24} color="#EF4444" />
                  <Text style={styles.successValueLabel}>Proteínas</Text>
                  <Text style={styles.successValueNumber}>
                    {targetProtein || "0"}g
                  </Text>
                </View>
              </View>

              <View style={styles.successValueRow}>
                <View style={styles.successValueItem}>
                  <Ionicons
                    name="nutrition-outline"
                    size={24}
                    color="#F59E0B"
                  />
                  <Text style={styles.successValueLabel}>Carboidratos</Text>
                  <Text style={styles.successValueNumber}>
                    {targetCarbs || "0"}g
                  </Text>
                </View>

                <View style={styles.successValueItem}>
                  <Ionicons name="water-outline" size={24} color="#3B82F6" />
                  <Text style={styles.successValueLabel}>Gorduras</Text>
                  <Text style={styles.successValueNumber}>
                    {targetFat || "0"}g
                  </Text>
                </View>
              </View>
            </View>

            {/* Botão Fechar */}
            <TouchableOpacity
              onPress={() => setShowSuccessModal(false)}
              style={styles.successCloseButton}
            >
              <Text style={styles.successCloseButtonText}>Entendi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Templates */}
      <Modal
        visible={showTemplateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecionar Template</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowTemplateModal(false);
                    setTemplateSearch("");
                  }}
                  style={styles.modalCloseButton}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={lightTheme.colors.text}
                  />
                </TouchableOpacity>
              </View>

              {/* Search */}
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color={lightTheme.colors.textSecondary}
                  style={styles.searchIcon}
                />
                <TextInput
                  placeholder="Buscar template..."
                  value={templateSearch}
                  onChangeText={setTemplateSearch}
                  style={styles.searchInput}
                  placeholderTextColor={lightTheme.colors.textSecondary}
                />
                {templateSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setTemplateSearch("")}>
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={lightTheme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Lista de Templates */}
              {loadingTemplates ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator
                    size="large"
                    color={lightTheme.colors.primary}
                  />
                  <Text style={styles.modalLoadingText}>
                    Carregando templates...
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={templates.filter((t) =>
                    t.name.toLowerCase().includes(templateSearch.toLowerCase())
                  )}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.templateItem}
                      onPress={() => handleSelectTemplate(item)}
                    >
                      <View style={styles.templateItemIcon}>
                        <Ionicons
                          name="document-text"
                          size={24}
                          color={lightTheme.colors.primary}
                        />
                      </View>
                      <View style={styles.templateItemContent}>
                        <Text style={styles.templateItemName}>{item.name}</Text>
                        {item.description && (
                          <Text
                            style={styles.templateItemDescription}
                            numberOfLines={2}
                          >
                            {item.description}
                          </Text>
                        )}
                        <View style={styles.templateItemFooter}>
                          {item.totalMeals && (
                            <Text style={styles.templateItemMeta}>
                              {item.totalMeals} refeições
                            </Text>
                          )}
                          {item.totalCalories && (
                            <Text style={styles.templateItemMeta}>
                              {Math.round(item.totalCalories)} kcal
                            </Text>
                          )}
                        </View>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={lightTheme.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                      <Ionicons
                        name="document-outline"
                        size={48}
                        color={lightTheme.colors.textSecondary}
                      />
                      <Text style={styles.emptyText}>
                        {templateSearch
                          ? "Nenhum template encontrado"
                          : "Você ainda não possui templates"}
                      </Text>
                      <Text style={styles.emptyDescription}>
                        Crie um plano e marque como template
                      </Text>
                    </View>
                  )}
                  contentContainerStyle={
                    templates.length === 0 ? styles.flex1 : undefined
                  }
                />
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.white,
  },
  flex1: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: lightTheme.spacing[5],
    paddingBottom: 100,
  },
  stepIndicator: {
    paddingVertical: lightTheme.spacing[5],
  },
  progressBarContainer: {
    flexDirection: "row",
    gap: lightTheme.spacing[2],
  },
  progressBarActive: {
    flex: 1,
    height: 4,
    backgroundColor: lightTheme.colors.primary,
    borderRadius: 2,
  },
  progressBarInactive: {
    flex: 1,
    height: 4,
    backgroundColor: lightTheme.colors.gray[200],
    borderRadius: 2,
  },
  formGroup: {
    marginBottom: lightTheme.spacing[5],
  },
  label: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[700],
    marginBottom: lightTheme.spacing[2],
  },
  required: {
    color: lightTheme.colors.error,
  },
  input: {
    backgroundColor: lightTheme.colors.gray[50],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    borderRadius: lightTheme.borderRadius.md,
    paddingHorizontal: lightTheme.spacing[3],
    paddingVertical: lightTheme.spacing[3],
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[900],
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  selectButton: {
    backgroundColor: lightTheme.colors.gray[50],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    borderRadius: lightTheme.borderRadius.md,
    padding: lightTheme.spacing[3],
  },
  selectButtonDisabled: {
    backgroundColor: lightTheme.colors.gray[100],
    opacity: 0.6,
  },
  selectButtonContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectButtonText: {
    flex: 1,
  },
  selectedPatientName: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
  },
  selectedPatientNameDisabled: {
    color: lightTheme.colors.gray[600],
  },
  selectedPatientEmail: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
    marginTop: 2,
  },
  placeholder: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[400],
  },
  fieldHint: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
    marginTop: lightTheme.spacing[1],
  },
  dateGroup: {
    marginBottom: lightTheme.spacing[3],
  },
  dateLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing[2],
  },
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: lightTheme.colors.gray[50],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    borderRadius: lightTheme.borderRadius.md,
    padding: lightTheme.spacing[3],
  },
  dateButtonText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[900],
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: lightTheme.spacing[3],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: lightTheme.borderRadius.sm,
    borderWidth: 2,
    borderColor: lightTheme.colors.gray[300],
    justifyContent: "center",
    alignItems: "center",
    marginRight: lightTheme.spacing[2],
  },
  checkboxChecked: {
    backgroundColor: lightTheme.colors.primary,
    borderColor: lightTheme.colors.primary,
  },
  checkboxLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[700],
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: lightTheme.spacing[2],
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[2],
    paddingHorizontal: lightTheme.spacing[3],
    paddingVertical: lightTheme.spacing[2],
    borderRadius: lightTheme.borderRadius.md,
    borderWidth: 1,
  },
  statusButtonSelected: {
    backgroundColor: `${lightTheme.colors.primary}10`,
    borderColor: lightTheme.colors.primary,
  },
  statusButtonUnselected: {
    backgroundColor: lightTheme.colors.white,
    borderColor: lightTheme.colors.gray[200],
  },
  statusButtonText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
  },
  statusButtonTextSelected: {
    color: lightTheme.colors.secondary,
  },
  statusButtonTextUnselected: {
    color: lightTheme.colors.gray[600],
  },
  goalsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: lightTheme.spacing[3],
  },
  goalsHeaderText: {
    flex: 1,
  },
  goalsDescription: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
    marginTop: 2,
  },
  autoCalculateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[2],
    backgroundColor: lightTheme.colors.primary,
    paddingHorizontal: lightTheme.spacing[3],
    paddingVertical: lightTheme.spacing[2],
    borderRadius: lightTheme.borderRadius.md,
  },
  autoCalculateButtonText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.white,
  },
  goalsContainer: {
    gap: lightTheme.spacing[3],
  },
  goalInputContainer: {
    marginBottom: lightTheme.spacing[1],
  },
  inputLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing[2],
  },
  macrosGrid: {
    flexDirection: "row",
    gap: lightTheme.spacing[3],
  },
  macroInputWrapper: {
    flex: 1,
  },
  templateContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: lightTheme.spacing[3],
    paddingHorizontal: lightTheme.spacing[4],
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: lightTheme.borderRadius.md,
  },
  templateTextContainer: {
    flex: 1,
  },
  templateLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[700],
    marginBottom: 2,
  },
  templateDescription: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: lightTheme.colors.white,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[200],
    paddingHorizontal: lightTheme.spacing[5],
    paddingTop: lightTheme.spacing[3],
    paddingBottom: lightTheme.spacing[3],
  },
  nextButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: lightTheme.spacing[2],
    backgroundColor: lightTheme.colors.primary,
    paddingVertical: 14,
    borderRadius: lightTheme.borderRadius.md,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: lightTheme.colors.white,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: lightTheme.spacing[5],
    paddingVertical: lightTheme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  modalTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
  },
  modalSubtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginTop: lightTheme.spacing[1],
  },
  modalSearchContainer: {
    paddingHorizontal: lightTheme.spacing[5],
    paddingVertical: lightTheme.spacing[3],
    backgroundColor: lightTheme.colors.gray[50],
  },
  modalSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[2],
    backgroundColor: lightTheme.colors.white,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    borderRadius: lightTheme.borderRadius.md,
    paddingHorizontal: lightTheme.spacing[3],
    paddingVertical: 10,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[900],
  },
  patientItem: {
    paddingHorizontal: lightTheme.spacing[5],
    paddingVertical: lightTheme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  patientItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[3],
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: lightTheme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  patientAvatarText: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.white,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
    marginBottom: 2,
  },
  patientEmail: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
  },
  patientPhone: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[400],
    marginTop: lightTheme.spacing[4],
  },
  goalsModalContent: {
    flex: 1,
    padding: lightTheme.spacing[5],
  },
  goalTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[4],
    backgroundColor: lightTheme.colors.white,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[3],
  },
  goalTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: lightTheme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  goalTypeInfo: {
    flex: 1,
  },
  goalTypeLabel: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing[1],
  },
  goalTypeDescription: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing[2],
  },
  goalTypeMultipliers: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: lightTheme.spacing[2],
  },
  multiplierBadge: {
    backgroundColor: lightTheme.colors.gray[100],
    paddingHorizontal: lightTheme.spacing[2],
    paddingVertical: lightTheme.spacing[1],
    borderRadius: lightTheme.borderRadius.sm,
  },
  multiplierText: {
    fontSize: 11,
    color: lightTheme.colors.gray[600],
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: lightTheme.spacing[3],
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.white,
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: lightTheme.spacing[5],
  },
  successModalCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing[6],
    width: "100%",
    maxWidth: 400,
  },
  successIconContainer: {
    alignItems: "center",
    marginBottom: lightTheme.spacing[4],
  },
  successIcon: {},
  successTitle: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
    textAlign: "center",
    marginBottom: lightTheme.spacing[2],
  },
  successProfileContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: lightTheme.spacing[2],
    marginBottom: lightTheme.spacing[2],
  },
  successProfileBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[2],
    backgroundColor: lightTheme.colors.primary,
    paddingHorizontal: lightTheme.spacing[3],
    paddingVertical: lightTheme.spacing[2],
    borderRadius: lightTheme.borderRadius.full,
  },
  successProfileName: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.white,
  },
  successProfileEditButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: lightTheme.colors.gray[600],
    justifyContent: "center",
    alignItems: "center",
  },
  successDescription: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
    marginBottom: lightTheme.spacing[6],
  },
  successValuesContainer: {
    gap: lightTheme.spacing[3],
    marginBottom: lightTheme.spacing[6],
  },
  successValueRow: {
    flexDirection: "row",
    gap: lightTheme.spacing[3],
  },
  successValueItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: lightTheme.colors.gray[50],
    padding: lightTheme.spacing[4],
    borderRadius: lightTheme.borderRadius.lg,
  },
  successValueLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
    marginTop: lightTheme.spacing[2],
    marginBottom: lightTheme.spacing[1],
  },
  successValueNumber: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[900],
  },
  successCloseButton: {
    backgroundColor: lightTheme.colors.primary,
    paddingVertical: 14,
    borderRadius: lightTheme.borderRadius.md,
    alignItems: "center",
  },
  successCloseButtonText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.white,
  },
  // Template Button Styles
  useTemplateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: lightTheme.spacing[2],
    paddingVertical: 12,
    paddingHorizontal: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[4],
    borderRadius: lightTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: lightTheme.colors.primary,
    backgroundColor: lightTheme.colors.primaryBackground,
  },
  useTemplateButtonText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.primary,
  },
  // Template Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalSafeArea: {
    height: "50%",
  },
  modalContent: {
    backgroundColor: lightTheme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 1,
    paddingTop: lightTheme.spacing[4],
  },
  modalCloseButton: {
    padding: lightTheme.spacing[1],
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: lightTheme.borderRadius.md,
    paddingHorizontal: lightTheme.spacing[3],
    marginHorizontal: lightTheme.spacing[4],
    marginTop: lightTheme.spacing[3],
    marginBottom: lightTheme.spacing[3],
    height: 44,
  },
  searchIcon: {
    marginRight: lightTheme.spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[900],
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: lightTheme.spacing[8],
  },
  modalLoadingText: {
    marginTop: lightTheme.spacing[3],
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
  },
  templateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[3],
    paddingVertical: lightTheme.spacing[3],
    paddingHorizontal: lightTheme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  templateItemIcon: {
    width: 48,
    height: 48,
    borderRadius: lightTheme.borderRadius.md,
    backgroundColor: lightTheme.colors.primaryBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  templateItemContent: {
    flex: 1,
  },
  templateItemName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing[1],
  },
  templateItemDescription: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing[1],
  },
  templateItemFooter: {
    flexDirection: "row",
    gap: lightTheme.spacing[3],
  },
  templateItemMeta: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: lightTheme.spacing[12],
    paddingHorizontal: lightTheme.spacing[6],
  },
  emptyText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[900],
    marginTop: lightTheme.spacing[3],
    marginBottom: lightTheme.spacing[1],
  },
  emptyDescription: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
  },
});
