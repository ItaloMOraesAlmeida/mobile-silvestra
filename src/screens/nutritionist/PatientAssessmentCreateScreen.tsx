import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { lightTheme } from "../../theme";
import { useBodyMeasurements } from "../../hooks/useBodyMeasurements";

interface PatientAssessmentCreateScreenProps {
  route: {
    params: {
      patientId: string;
      patientName: string;
    };
  };
  navigation: any;
  registerBackHandler?: (callback: () => boolean) => void;
}

// Enum de protocolos (deve corresponder ao backend)
type BodyCompositionProtocol =
  | "POLLOCK_7"
  | "POLLOCK_3_MALE"
  | "POLLOCK_3_FEMALE"
  | "GUEDES_3"
  | "FAULKNER_4";

interface FormData {
  // Dados básicos
  weight: string;
  height: string;

  // Protocolo de avaliação
  protocol: BodyCompositionProtocol | "";

  // Circunferências
  neckCirc: string;
  shoulderCirc: string;
  chestCirc: string;
  armCirc: string; // Legado - mantido para compatibilidade
  armCircRelaxedRight: string;
  armCircRelaxedLeft: string;
  armCircContractedRight: string;
  armCircContractedLeft: string;
  forearmCirc: string;
  waistCirc: string;
  abdomenCirc: string;
  hipCirc: string;
  thighCirc: string; // Legado - mantido para compatibilidade
  thighCircRight: string;
  thighCircLeft: string;
  calfCirc: string; // Legado - mantido para compatibilidade
  calfCircRight: string;
  calfCircLeft: string;
  wristCirc: string;

  // Dobras cutâneas
  tricepsFold: string;
  bicepsFold: string;
  subscapularFold: string;
  pectoralFold: string;
  axillarFold: string;
  suprailiacFold: string;
  abdominalFold: string;
  thighFold: string;
  calfMedialFold: string;

  // Diâmetros ósseos
  wristDiameter: string;
  femurDiameter: string;
  humerusDiameter: string;

  // Composição corporal (calculados automaticamente pelo backend)
  bodyFatPercent: string;
  muscleMass: string;
  fatMass: string;

  // Notas
  notes: string;
}

export function PatientAssessmentCreateScreen({
  route,
  navigation,
  registerBackHandler,
}: PatientAssessmentCreateScreenProps) {
  const patientId = route?.params?.patientId;
  const patientName = route?.params?.patientName;
  const { createMeasurement, loading, getLatestMeasurement } =
    useBodyMeasurements();

  // Estado para controlar o modal de carregar última avaliação
  const [loadLastModalVisible, setLoadLastModalVisible] = useState(false);
  const [loadingLastMeasurement, setLoadingLastMeasurement] = useState(false);

  // Estado para controlar o modal de confirmação ao voltar
  const [backConfirmModalVisible, setBackConfirmModalVisible] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    weight: "",
    height: "",
    protocol: "",
    neckCirc: "",
    shoulderCirc: "",
    chestCirc: "",
    armCirc: "",
    armCircRelaxedRight: "",
    armCircRelaxedLeft: "",
    armCircContractedRight: "",
    armCircContractedLeft: "",
    forearmCirc: "",
    waistCirc: "",
    abdomenCirc: "",
    hipCirc: "",
    thighCirc: "",
    thighCircRight: "",
    thighCircLeft: "",
    calfCirc: "",
    calfCircRight: "",
    calfCircLeft: "",
    wristCirc: "",
    tricepsFold: "",
    bicepsFold: "",
    subscapularFold: "",
    pectoralFold: "",
    axillarFold: "",
    suprailiacFold: "",
    abdominalFold: "",
    thighFold: "",
    calfMedialFold: "",
    wristDiameter: "",
    femurDiameter: "",
    humerusDiameter: "",
    bodyFatPercent: "",
    muscleMass: "",
    fatMass: "",
    notes: "",
  });

  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    protocol: false,
    circumferences: false,
    skinfolds: false,
    diameters: false,
    composition: false,
    notes: false,
  });

  // Calcular IMC automaticamente
  const calculateBMI = (): number | null => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);

    if (weight > 0 && height > 0) {
      const heightInMeters = height / 100;
      return weight / (heightInMeters * heightInMeters);
    }
    return null;
  };

  const bmi = calculateBMI();

  // Registrar callback para interceptar o botão de voltar
  useEffect(() => {
    if (registerBackHandler) {
      registerBackHandler(() => {
        // Verificar se há dados no formulário
        const hasData = Object.entries(formData).some(([key, value]) => {
          if (key === "notes") return false;
          return value !== "";
        });

        if (hasData) {
          // Se há dados, mostra o modal e retorna false para cancelar a navegação
          setBackConfirmModalVisible(true);
          return false;
        }

        return true;
      });
    }
  }, [registerBackHandler, formData]);

  // Determinar quais dobras são necessárias para cada protocolo
  const getRequiredFolds = (
    protocol: BodyCompositionProtocol | ""
  ): string[] => {
    switch (protocol) {
      case "POLLOCK_7":
        return [
          "pectoralFold",
          "axillarFold",
          "tricepsFold",
          "subscapularFold",
          "abdominalFold",
          "suprailiacFold",
          "thighFold",
        ];
      case "POLLOCK_3_MALE":
        return ["pectoralFold", "abdominalFold", "thighFold"];
      case "POLLOCK_3_FEMALE":
        return ["tricepsFold", "suprailiacFold", "thighFold"];
      case "GUEDES_3":
        return ["tricepsFold", "suprailiacFold", "abdominalFold"];
      case "FAULKNER_4":
        return [
          "tricepsFold",
          "subscapularFold",
          "suprailiacFold",
          "abdominalFold",
        ];
      default:
        return [];
    }
  };

  // Obter nome amigável do protocolo
  const getProtocolLabel = (protocol: BodyCompositionProtocol): string => {
    const labels: Record<BodyCompositionProtocol, string> = {
      POLLOCK_7: "Pollock 7 Dobras (Unissex)",
      POLLOCK_3_MALE: "Pollock 3 Dobras (Homens)",
      POLLOCK_3_FEMALE: "Pollock 3 Dobras (Mulheres)",
      GUEDES_3: "Guedes 3 Dobras (Unissex)",
      FAULKNER_4: "Faulkner 4 Dobras (Unissex)",
    };
    return labels[protocol];
  };

  // Calcular soma de dobras baseado no protocolo
  const calculateSumOfFolds = (
    protocol: BodyCompositionProtocol | ""
  ): number | null => {
    if (!protocol) return null;

    const requiredFolds = getRequiredFolds(protocol);
    const values: number[] = [];

    for (const foldName of requiredFolds) {
      const value = parseFloat(formData[foldName as keyof FormData] as string);
      if (isNaN(value) || value <= 0) {
        return null; // Retorna null se algum campo obrigatório estiver vazio
      }
      values.push(value);
    }

    return values.reduce((sum, val) => sum + val, 0);
  };

  // Calcular densidade corporal (fictício - idade padrão 30 anos)
  const calculateBodyDensity = (
    protocol: BodyCompositionProtocol,
    sumOfFolds: number,
    age: number = 30
  ): number | null => {
    let density: number;

    switch (protocol) {
      case "POLLOCK_7":
        density =
          1.112 -
          0.00043499 * sumOfFolds +
          0.00000055 * Math.pow(sumOfFolds, 2) -
          0.00028826 * age;
        break;
      case "POLLOCK_3_MALE":
        density =
          1.10938 -
          0.0008267 * sumOfFolds +
          0.0000016 * Math.pow(sumOfFolds, 2) -
          0.0002574 * age;
        break;
      case "POLLOCK_3_FEMALE":
        density =
          1.0994921 -
          0.0009929 * sumOfFolds +
          0.0000023 * Math.pow(sumOfFolds, 2) -
          0.0001392 * age;
        break;
      case "GUEDES_3":
        density = 1.1714 - 0.0671 * Math.log10(sumOfFolds);
        break;
      case "FAULKNER_4":
        return null; // Faulkner usa cálculo direto
      default:
        return null;
    }

    return density;
  };

  // Calcular composição corporal (preview)
  const calculateBodyCompositionPreview = (): {
    bodyFatPercent: number | null;
    muscleMass: number | null;
    fatMass: number | null;
  } => {
    const weight = parseFloat(formData.weight);

    if (!formData.protocol || isNaN(weight) || weight <= 0) {
      return {
        bodyFatPercent: null,
        muscleMass: null,
        fatMass: null,
      };
    }

    const sumOfFolds = calculateSumOfFolds(formData.protocol);
    if (!sumOfFolds) {
      return {
        bodyFatPercent: null,
        muscleMass: null,
        fatMass: null,
      };
    }

    let bodyFatPercent: number;

    // Faulkner usa cálculo direto
    if (formData.protocol === "FAULKNER_4") {
      bodyFatPercent = sumOfFolds * 0.153 + 5.783;
    } else {
      const density = calculateBodyDensity(formData.protocol, sumOfFolds);
      if (!density) {
        return {
          bodyFatPercent: null,
          muscleMass: null,
          fatMass: null,
        };
      }

      // Fórmula de Siri
      bodyFatPercent = (4.95 / density - 4.5) * 100;
    }

    const fatMass = (weight * bodyFatPercent) / 100;
    const muscleMass = weight - fatMass;

    return {
      bodyFatPercent: Math.round(bodyFatPercent * 10) / 10,
      muscleMass: Math.round(muscleMass * 10) / 10,
      fatMass: Math.round(fatMass * 10) / 10,
    };
  };

  const bodyComposition = calculateBodyCompositionPreview();

  // Verificar se um campo de dobra é obrigatório para o protocolo atual
  const isFoldRequired = (foldName: string): boolean => {
    if (!formData.protocol) return false;
    return getRequiredFolds(formData.protocol).includes(foldName);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateField = (field: keyof FormData, value: string) => {
    // Para o campo de protocolo, não aplicar validação numérica
    if (field === "protocol" || field === "notes") {
      setFormData((prev) => ({ ...prev, [field]: value }));
    } else {
      // Permitir apenas números e ponto decimal para campos numéricos
      const numericValue = value.replace(/[^0-9.]/g, "");
      setFormData((prev) => ({ ...prev, [field]: numericValue }));
    }
  };

  // Função para limpar o formulário
  const clearForm = () => {
    setFormData({
      weight: "",
      height: "",
      protocol: "",
      neckCirc: "",
      shoulderCirc: "",
      chestCirc: "",
      armCirc: "",
      armCircRelaxedRight: "",
      armCircRelaxedLeft: "",
      armCircContractedRight: "",
      armCircContractedLeft: "",
      forearmCirc: "",
      waistCirc: "",
      abdomenCirc: "",
      hipCirc: "",
      thighCirc: "",
      thighCircRight: "",
      thighCircLeft: "",
      calfCirc: "",
      calfCircRight: "",
      calfCircLeft: "",
      wristCirc: "",
      tricepsFold: "",
      bicepsFold: "",
      subscapularFold: "",
      pectoralFold: "",
      axillarFold: "",
      suprailiacFold: "",
      abdominalFold: "",
      thighFold: "",
      calfMedialFold: "",
      wristDiameter: "",
      femurDiameter: "",
      humerusDiameter: "",
      bodyFatPercent: "",
      muscleMass: "",
      fatMass: "",
      notes: "",
    });
  };

  // Função para confirmar e voltar (descartando os dados)
  const handleConfirmBack = () => {
    setBackConfirmModalVisible(false);
    clearForm();

    // Navegar de volta para PatientDetails com o patientId
    navigation.navigate("PatientDetails", {
      patientId,
      initialTab: "assessments",
    });
  };

  // Função para carregar a última avaliação
  const handleLoadLastMeasurement = async () => {
    try {
      setLoadingLastMeasurement(true);
      const lastMeasurement = await getLatestMeasurement(patientId);

      if (lastMeasurement) {
        // Preencher formulário com dados da última avaliação
        setFormData({
          weight: lastMeasurement.weight?.toString() || "",
          height: lastMeasurement.height?.toString() || "",
          protocol: lastMeasurement.protocol || "",
          neckCirc: lastMeasurement.neckCirc?.toString() || "",
          shoulderCirc: lastMeasurement.shoulderCirc?.toString() || "",
          chestCirc: lastMeasurement.chestCirc?.toString() || "",
          armCirc: lastMeasurement.armCirc?.toString() || "",
          armCircRelaxedRight:
            lastMeasurement.armCircRelaxedRight?.toString() || "",
          armCircRelaxedLeft:
            lastMeasurement.armCircRelaxedLeft?.toString() || "",
          armCircContractedRight:
            lastMeasurement.armCircContractedRight?.toString() || "",
          armCircContractedLeft:
            lastMeasurement.armCircContractedLeft?.toString() || "",
          forearmCirc: lastMeasurement.forearmCirc?.toString() || "",
          waistCirc: lastMeasurement.waistCirc?.toString() || "",
          abdomenCirc: lastMeasurement.abdomenCirc?.toString() || "",
          hipCirc: lastMeasurement.hipCirc?.toString() || "",
          thighCirc: lastMeasurement.thighCirc?.toString() || "",
          thighCircRight: lastMeasurement.thighCircRight?.toString() || "",
          thighCircLeft: lastMeasurement.thighCircLeft?.toString() || "",
          calfCirc: lastMeasurement.calfCirc?.toString() || "",
          calfCircRight: lastMeasurement.calfCircRight?.toString() || "",
          calfCircLeft: lastMeasurement.calfCircLeft?.toString() || "",
          wristCirc: lastMeasurement.wristCirc?.toString() || "",
          tricepsFold: lastMeasurement.tricepsFold?.toString() || "",
          bicepsFold: lastMeasurement.bicepsFold?.toString() || "",
          subscapularFold: lastMeasurement.subscapularFold?.toString() || "",
          pectoralFold: lastMeasurement.pectoralFold?.toString() || "",
          axillarFold: lastMeasurement.axillarFold?.toString() || "",
          suprailiacFold: lastMeasurement.suprailiacFold?.toString() || "",
          abdominalFold: lastMeasurement.abdominalFold?.toString() || "",
          thighFold: lastMeasurement.thighFold?.toString() || "",
          calfMedialFold: lastMeasurement.calfMedialFold?.toString() || "",
          wristDiameter: lastMeasurement.wristDiameter?.toString() || "",
          femurDiameter: lastMeasurement.femurDiameter?.toString() || "",
          humerusDiameter: lastMeasurement.humerusDiameter?.toString() || "",
          bodyFatPercent: lastMeasurement.bodyFatPercent?.toString() || "",
          muscleMass: lastMeasurement.muscleMass?.toString() || "",
          fatMass: lastMeasurement.fatMass?.toString() || "",
          notes: lastMeasurement.notes || "",
        });

        Toast.show({
          type: "success",
          text1: "Dados carregados!",
          text2: "Última avaliação carregada com sucesso",
          position: "bottom",
          visibilityTime: 2000,
        });
      } else {
        Toast.show({
          type: "info",
          text1: "Aviso",
          text2: "Não há avaliações anteriores para este paciente",
          position: "bottom",
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar última avaliação:", error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível carregar a última avaliação",
        position: "bottom",
        visibilityTime: 3000,
      });
    } finally {
      setLoadingLastMeasurement(false);
      setLoadLastModalVisible(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      Alert.alert("Erro", "Por favor, informe o peso do paciente");
      return false;
    }

    if (!formData.height || parseFloat(formData.height) <= 0) {
      Alert.alert("Erro", "Por favor, informe a altura do paciente");
      return false;
    }

    // Validar dobras obrigatórias se protocolo foi selecionado
    if (formData.protocol) {
      const requiredFolds = getRequiredFolds(formData.protocol);
      const missingFolds: string[] = [];

      for (const foldName of requiredFolds) {
        const value = formData[foldName as keyof FormData] as string;
        if (!value || parseFloat(value) <= 0) {
          // Nomes amigáveis dos campos
          const friendlyNames: Record<string, string> = {
            pectoralFold: "Peitoral",
            axillarFold: "Axilar Média",
            tricepsFold: "Tríceps",
            bicepsFold: "Bíceps",
            subscapularFold: "Subescapular",
            abdominalFold: "Abdominal",
            suprailiacFold: "Supra-ilíaca",
            thighFold: "Coxa",
            calfMedialFold: "Panturrilha Medial",
          };
          missingFolds.push(friendlyNames[foldName] || foldName);
        }
      }

      if (missingFolds.length > 0) {
        Alert.alert(
          "Campos Obrigatórios",
          `O protocolo ${getProtocolLabel(
            formData.protocol
          )} requer as seguintes dobras cutâneas:\n\n${missingFolds.join(
            "\n"
          )}\n\nPreencha todos os campos necessários ou remova o protocolo.`
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const measurementData: any = {
      weight: parseFloat(formData.weight),
      height: parseFloat(formData.height),
      bmi: bmi || undefined,
      registeredBy: "NUTRITIONIST",
    };

    // Adicionar protocolo se selecionado
    if (formData.protocol) measurementData.protocol = formData.protocol;

    // Adicionar circunferências se preenchidas
    if (formData.neckCirc)
      measurementData.neckCirc = parseFloat(formData.neckCirc);
    if (formData.shoulderCirc)
      measurementData.shoulderCirc = parseFloat(formData.shoulderCirc);
    if (formData.chestCirc)
      measurementData.chestCirc = parseFloat(formData.chestCirc);
    if (formData.armCirc)
      measurementData.armCirc = parseFloat(formData.armCirc);
    if (formData.armCircRelaxedRight)
      measurementData.armCircRelaxedRight = parseFloat(
        formData.armCircRelaxedRight
      );
    if (formData.armCircRelaxedLeft)
      measurementData.armCircRelaxedLeft = parseFloat(
        formData.armCircRelaxedLeft
      );
    if (formData.armCircContractedRight)
      measurementData.armCircContractedRight = parseFloat(
        formData.armCircContractedRight
      );
    if (formData.armCircContractedLeft)
      measurementData.armCircContractedLeft = parseFloat(
        formData.armCircContractedLeft
      );
    if (formData.forearmCirc)
      measurementData.forearmCirc = parseFloat(formData.forearmCirc);
    if (formData.waistCirc)
      measurementData.waistCirc = parseFloat(formData.waistCirc);
    if (formData.abdomenCirc)
      measurementData.abdomenCirc = parseFloat(formData.abdomenCirc);
    if (formData.hipCirc)
      measurementData.hipCirc = parseFloat(formData.hipCirc);
    if (formData.thighCirc)
      measurementData.thighCirc = parseFloat(formData.thighCirc);
    if (formData.thighCircRight)
      measurementData.thighCircRight = parseFloat(formData.thighCircRight);
    if (formData.thighCircLeft)
      measurementData.thighCircLeft = parseFloat(formData.thighCircLeft);
    if (formData.calfCirc)
      measurementData.calfCirc = parseFloat(formData.calfCirc);
    if (formData.calfCircRight)
      measurementData.calfCircRight = parseFloat(formData.calfCircRight);
    if (formData.calfCircLeft)
      measurementData.calfCircLeft = parseFloat(formData.calfCircLeft);
    if (formData.wristCirc)
      measurementData.wristCirc = parseFloat(formData.wristCirc);

    // Adicionar dobras cutâneas se preenchidas
    if (formData.tricepsFold)
      measurementData.tricepsFold = parseFloat(formData.tricepsFold);
    if (formData.bicepsFold)
      measurementData.bicepsFold = parseFloat(formData.bicepsFold);
    if (formData.subscapularFold)
      measurementData.subscapularFold = parseFloat(formData.subscapularFold);
    if (formData.pectoralFold)
      measurementData.pectoralFold = parseFloat(formData.pectoralFold);
    if (formData.axillarFold)
      measurementData.axillarFold = parseFloat(formData.axillarFold);
    if (formData.suprailiacFold)
      measurementData.suprailiacFold = parseFloat(formData.suprailiacFold);
    if (formData.abdominalFold)
      measurementData.abdominalFold = parseFloat(formData.abdominalFold);
    if (formData.thighFold)
      measurementData.thighFold = parseFloat(formData.thighFold);
    if (formData.calfMedialFold)
      measurementData.calfMedialFold = parseFloat(formData.calfMedialFold);

    // Adicionar diâmetros ósseos se preenchidos
    if (formData.wristDiameter)
      measurementData.wristDiameter = parseFloat(formData.wristDiameter);
    if (formData.femurDiameter)
      measurementData.femurDiameter = parseFloat(formData.femurDiameter);
    if (formData.humerusDiameter)
      measurementData.humerusDiameter = parseFloat(formData.humerusDiameter);

    // Adicionar composição corporal se preenchida (será sobrescrita pelo backend se houver protocolo)
    if (formData.bodyFatPercent)
      measurementData.bodyFatPercent = parseFloat(formData.bodyFatPercent);
    if (formData.muscleMass)
      measurementData.muscleMass = parseFloat(formData.muscleMass);
    if (formData.fatMass)
      measurementData.fatMass = parseFloat(formData.fatMass);

    // Adicionar notas
    if (formData.notes.trim()) measurementData.notes = formData.notes.trim();

    const result = await createMeasurement(patientId, measurementData);

    if (result) {
      // Limpar formulário após sucesso
      clearForm();

      // Mostrar toast de sucesso
      Toast.show({
        type: "success",
        text1: "Sucesso!",
        text2: "Avaliação criada com sucesso",
        position: "bottom",
        visibilityTime: 2000,
      });

      // Navegar de volta e forçar reload da lista
      navigation.navigate("PatientDetails", {
        patientId,
        initialTab: "assessments",
        shouldReload: true, // Flag para recarregar a lista
      });
    } else {
      Alert.alert(
        "Erro",
        "Não foi possível criar a avaliação. Tente novamente."
      );
    }
  };

  // Validação de patientId
  if (!patientId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={lightTheme.colors.error}
          />
          <Text style={styles.errorText}>
            ID do paciente não encontrado. Por favor, retorne e tente novamente.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Info */}
        <View style={styles.headerInfo}>
          <Ionicons
            name="person-circle"
            size={48}
            color={lightTheme.colors.primary}
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Nova Avaliação</Text>
            <Text style={styles.headerSubtitle}>{patientName}</Text>
          </View>
          <TouchableOpacity
            style={styles.loadLastButton}
            onPress={() => setLoadLastModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="download-outline"
              size={24}
              color={lightTheme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Modal de confirmação para carregar última avaliação */}
        <Modal
          visible={loadLastModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setLoadLastModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Ionicons
                name="download"
                size={48}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.modalTitle}>Carregar Última Avaliação</Text>
              <Text style={styles.modalText}>
                Deseja carregar os dados da última avaliação deste paciente?
                Isso irá substituir os dados atuais do formulário.
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => setLoadLastModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalConfirmButton]}
                  onPress={handleLoadLastMeasurement}
                  disabled={loadingLastMeasurement}
                  activeOpacity={0.8}
                >
                  {loadingLastMeasurement ? (
                    <ActivityIndicator color={lightTheme.colors.white} />
                  ) : (
                    <Text style={styles.modalConfirmButtonText}>Carregar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de confirmação ao voltar */}
        <Modal
          visible={backConfirmModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setBackConfirmModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Ionicons
                name="warning-outline"
                size={48}
                color={lightTheme.colors.warning}
              />
              <Text style={styles.modalTitle}>Descartar Alterações?</Text>
              <Text style={styles.modalText}>
                Você tem dados não salvos no formulário. Se voltar agora, todas
                as informações serão perdidas.
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => setBackConfirmModalVisible(false)}
                >
                  <Text style={styles.modalCancelButtonText}>
                    Continuar Editando
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalConfirmButton]}
                  onPress={handleConfirmBack}
                >
                  <Text style={styles.modalConfirmButtonText}>Descartar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Seção: Dados Básicos */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("basic")}
            activeOpacity={0.7}
          >
            <View style={styles.sectionTitleContainer}>
              <Ionicons
                name="fitness"
                size={20}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Dados Básicos *</Text>
            </View>
            <Ionicons
              name={expandedSections.basic ? "chevron-up" : "chevron-down"}
              size={20}
              color={lightTheme.colors.gray[500]}
            />
          </TouchableOpacity>

          {expandedSections.basic && (
            <View style={styles.sectionContent}>
              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Peso (kg) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 75.5"
                    keyboardType="decimal-pad"
                    value={formData.weight}
                    onChangeText={(value) => updateField("weight", value)}
                  />
                </View>

                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Altura (cm) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 171 (em centímetros)"
                    keyboardType="decimal-pad"
                    value={formData.height}
                    onChangeText={(value) => updateField("height", value)}
                  />
                </View>
              </View>

              {bmi !== null && (
                <View style={styles.bmiContainer}>
                  <Text style={styles.bmiLabel}>IMC Calculado:</Text>
                  <Text style={styles.bmiValue}>{bmi.toFixed(1)}</Text>
                  <Text style={styles.bmiClassification}>
                    {bmi < 18.5
                      ? "Abaixo do peso"
                      : bmi < 25
                      ? "Peso normal"
                      : bmi < 30
                      ? "Sobrepeso"
                      : "Obesidade"}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Seção: Protocolo de Avaliação */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("protocol")}
            activeOpacity={0.7}
          >
            <View style={styles.sectionTitleContainer}>
              <Ionicons
                name="clipboard"
                size={20}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Protocolo de Avaliação</Text>
            </View>
            <Ionicons
              name={expandedSections.protocol ? "chevron-up" : "chevron-down"}
              size={20}
              color={lightTheme.colors.gray[500]}
            />
          </TouchableOpacity>

          {expandedSections.protocol && (
            <View style={styles.sectionContent}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Protocolo</Text>
                <Text style={styles.inputHelper}>
                  Selecione o protocolo para cálculo automático de composição
                  corporal
                </Text>
                <View style={styles.protocolContainer}>
                  {(
                    [
                      "POLLOCK_7",
                      "POLLOCK_3_MALE",
                      "POLLOCK_3_FEMALE",
                      "GUEDES_3",
                      "FAULKNER_4",
                    ] as BodyCompositionProtocol[]
                  ).map((protocol) => (
                    <TouchableOpacity
                      key={protocol}
                      style={[
                        styles.protocolOption,
                        formData.protocol === protocol &&
                          styles.protocolOptionSelected,
                      ]}
                      onPress={() => updateField("protocol", protocol)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.protocolOptionContent}>
                        <Ionicons
                          name={
                            formData.protocol === protocol
                              ? "radio-button-on"
                              : "radio-button-off"
                          }
                          size={24}
                          color={
                            formData.protocol === protocol
                              ? lightTheme.colors.primary
                              : lightTheme.colors.gray[400]
                          }
                        />
                        <Text
                          style={[
                            styles.protocolOptionText,
                            formData.protocol === protocol &&
                              styles.protocolOptionTextSelected,
                          ]}
                        >
                          {getProtocolLabel(protocol)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {formData.protocol && (
                  <View style={styles.protocolInfo}>
                    <Ionicons
                      name="information-circle"
                      size={20}
                      color={lightTheme.colors.info}
                    />
                    <Text style={styles.protocolInfoText}>
                      Os campos de dobras cutâneas necessários serão destacados
                      automaticamente
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Seção: Circunferências */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("circumferences")}
            activeOpacity={0.7}
          >
            <View style={styles.sectionTitleContainer}>
              <Ionicons
                name="body"
                size={20}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Circunferências (cm)</Text>
            </View>
            <Ionicons
              name={
                expandedSections.circumferences ? "chevron-up" : "chevron-down"
              }
              size={20}
              color={lightTheme.colors.gray[500]}
            />
          </TouchableOpacity>

          {expandedSections.circumferences && (
            <View style={styles.sectionContent}>
              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Pescoço</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 38"
                    keyboardType="decimal-pad"
                    value={formData.neckCirc}
                    onChangeText={(value) => updateField("neckCirc", value)}
                  />
                </View>

                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Ombros</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 110"
                    keyboardType="decimal-pad"
                    value={formData.shoulderCirc}
                    onChangeText={(value) => updateField("shoulderCirc", value)}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Tórax</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 95"
                    keyboardType="decimal-pad"
                    value={formData.chestCirc}
                    onChangeText={(value) => updateField("chestCirc", value)}
                  />
                </View>

                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Braço</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 32"
                    keyboardType="decimal-pad"
                    value={formData.armCirc}
                    onChangeText={(value) => updateField("armCirc", value)}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Antebraço</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 27"
                    keyboardType="decimal-pad"
                    value={formData.forearmCirc}
                    onChangeText={(value) => updateField("forearmCirc", value)}
                  />
                </View>

                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Pulso</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 17"
                    keyboardType="decimal-pad"
                    value={formData.wristCirc}
                    onChangeText={(value) => updateField("wristCirc", value)}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Cintura</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 87"
                    keyboardType="decimal-pad"
                    value={formData.waistCirc}
                    onChangeText={(value) => updateField("waistCirc", value)}
                  />
                </View>

                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Abdômen</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 90"
                    keyboardType="decimal-pad"
                    value={formData.abdomenCirc}
                    onChangeText={(value) => updateField("abdomenCirc", value)}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Quadril</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 98"
                    keyboardType="decimal-pad"
                    value={formData.hipCirc}
                    onChangeText={(value) => updateField("hipCirc", value)}
                  />
                </View>

                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Coxa</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 56"
                    keyboardType="decimal-pad"
                    value={formData.thighCirc}
                    onChangeText={(value) => updateField("thighCirc", value)}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Panturrilha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 37"
                  keyboardType="decimal-pad"
                  value={formData.calfCirc}
                  onChangeText={(value) => updateField("calfCirc", value)}
                />
              </View>

              {/* Medidas Bilaterais */}
              <View style={styles.bilateralSectionHeader}>
                <Ionicons
                  name="git-compare"
                  size={18}
                  color={lightTheme.colors.primary}
                />
                <Text style={styles.bilateralSectionTitle}>
                  Medidas Bilaterais (Análise de Simetria)
                </Text>
              </View>

              <Text style={styles.sectionDescription}>
                Braço Relaxado (Direito/Esquerdo)
              </Text>
              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Direito</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 32"
                    keyboardType="decimal-pad"
                    value={formData.armCircRelaxedRight}
                    onChangeText={(value) =>
                      updateField("armCircRelaxedRight", value)
                    }
                  />
                </View>

                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Esquerdo</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 31.5"
                    keyboardType="decimal-pad"
                    value={formData.armCircRelaxedLeft}
                    onChangeText={(value) =>
                      updateField("armCircRelaxedLeft", value)
                    }
                  />
                </View>
              </View>

              <Text style={styles.sectionDescription}>
                Braço Contraído (Direito/Esquerdo)
              </Text>
              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Direito</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 35"
                    keyboardType="decimal-pad"
                    value={formData.armCircContractedRight}
                    onChangeText={(value) =>
                      updateField("armCircContractedRight", value)
                    }
                  />
                </View>

                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Esquerdo</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 34.5"
                    keyboardType="decimal-pad"
                    value={formData.armCircContractedLeft}
                    onChangeText={(value) =>
                      updateField("armCircContractedLeft", value)
                    }
                  />
                </View>
              </View>

              <Text style={styles.sectionDescription}>
                Coxa (Direita/Esquerda)
              </Text>
              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Direita</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 56"
                    keyboardType="decimal-pad"
                    value={formData.thighCircRight}
                    onChangeText={(value) =>
                      updateField("thighCircRight", value)
                    }
                  />
                </View>

                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Esquerda</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 55.5"
                    keyboardType="decimal-pad"
                    value={formData.thighCircLeft}
                    onChangeText={(value) =>
                      updateField("thighCircLeft", value)
                    }
                  />
                </View>
              </View>

              <Text style={styles.sectionDescription}>
                Panturrilha (Direita/Esquerda)
              </Text>
              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Direita</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 37"
                    keyboardType="decimal-pad"
                    value={formData.calfCircRight}
                    onChangeText={(value) =>
                      updateField("calfCircRight", value)
                    }
                  />
                </View>

                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Esquerda</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 36.5"
                    keyboardType="decimal-pad"
                    value={formData.calfCircLeft}
                    onChangeText={(value) => updateField("calfCircLeft", value)}
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Seção: Dobras Cutâneas */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("skinfolds")}
            activeOpacity={0.7}
          >
            <View style={styles.sectionTitleContainer}>
              <Ionicons
                name="analytics"
                size={20}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Dobras Cutâneas (mm)</Text>
            </View>
            <Ionicons
              name={expandedSections.skinfolds ? "chevron-up" : "chevron-down"}
              size={20}
              color={lightTheme.colors.gray[500]}
            />
          </TouchableOpacity>

          {expandedSections.skinfolds && (
            <View style={styles.sectionContent}>
              {formData.protocol ? (
                <View style={styles.protocolInfo}>
                  <Ionicons
                    name="star"
                    size={18}
                    color={lightTheme.colors.warning}
                  />
                  <Text style={styles.previewNoteText}>
                    Campos marcados com * são obrigatórios para o protocolo{" "}
                    {getProtocolLabel(formData.protocol)}
                  </Text>
                </View>
              ) : (
                <Text style={styles.sectionDescription}>
                  Selecione um protocolo para calcular automaticamente a
                  composição corporal
                </Text>
              )}

              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text
                    style={[
                      styles.inputLabel,
                      isFoldRequired("tricepsFold") &&
                        styles.inputLabelRequired,
                    ]}
                  >
                    Tríceps {isFoldRequired("tricepsFold") && "*"}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      isFoldRequired("tricepsFold") && styles.inputRequired,
                    ]}
                    placeholder="Ex: 12"
                    keyboardType="decimal-pad"
                    value={formData.tricepsFold}
                    onChangeText={(value) => updateField("tricepsFold", value)}
                  />
                </View>

                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text
                    style={[
                      styles.inputLabel,
                      isFoldRequired("subscapularFold") &&
                        styles.inputLabelRequired,
                    ]}
                  >
                    Subescapular {isFoldRequired("subscapularFold") && "*"}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      isFoldRequired("subscapularFold") && styles.inputRequired,
                    ]}
                    placeholder="Ex: 15"
                    keyboardType="decimal-pad"
                    value={formData.subscapularFold}
                    onChangeText={(value) =>
                      updateField("subscapularFold", value)
                    }
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text
                    style={[
                      styles.inputLabel,
                      isFoldRequired("pectoralFold") &&
                        styles.inputLabelRequired,
                    ]}
                  >
                    Peitoral {isFoldRequired("pectoralFold") && "*"}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      isFoldRequired("pectoralFold") && styles.inputRequired,
                    ]}
                    placeholder="Ex: 10"
                    keyboardType="decimal-pad"
                    value={formData.pectoralFold}
                    onChangeText={(value) => updateField("pectoralFold", value)}
                  />
                </View>

                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text
                    style={[
                      styles.inputLabel,
                      isFoldRequired("axillarFold") &&
                        styles.inputLabelRequired,
                    ]}
                  >
                    Axilar Média {isFoldRequired("axillarFold") && "*"}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      isFoldRequired("axillarFold") && styles.inputRequired,
                    ]}
                    placeholder="Ex: 11"
                    keyboardType="decimal-pad"
                    value={formData.axillarFold}
                    onChangeText={(value) => updateField("axillarFold", value)}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text
                    style={[
                      styles.inputLabel,
                      isFoldRequired("suprailiacFold") &&
                        styles.inputLabelRequired,
                    ]}
                  >
                    Supra-ilíaca {isFoldRequired("suprailiacFold") && "*"}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      isFoldRequired("suprailiacFold") && styles.inputRequired,
                    ]}
                    placeholder="Ex: 18"
                    keyboardType="decimal-pad"
                    value={formData.suprailiacFold}
                    onChangeText={(value) =>
                      updateField("suprailiacFold", value)
                    }
                  />
                </View>

                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text
                    style={[
                      styles.inputLabel,
                      isFoldRequired("abdominalFold") &&
                        styles.inputLabelRequired,
                    ]}
                  >
                    Abdominal {isFoldRequired("abdominalFold") && "*"}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      isFoldRequired("abdominalFold") && styles.inputRequired,
                    ]}
                    placeholder="Ex: 20"
                    keyboardType="decimal-pad"
                    value={formData.abdominalFold}
                    onChangeText={(value) =>
                      updateField("abdominalFold", value)
                    }
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text
                    style={[
                      styles.inputLabel,
                      isFoldRequired("thighFold") && styles.inputLabelRequired,
                    ]}
                  >
                    Coxa {isFoldRequired("thighFold") && "*"}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      isFoldRequired("thighFold") && styles.inputRequired,
                    ]}
                    placeholder="Ex: 16"
                    keyboardType="decimal-pad"
                    value={formData.thighFold}
                    onChangeText={(value) => updateField("thighFold", value)}
                  />
                </View>

                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text
                    style={[
                      styles.inputLabel,
                      isFoldRequired("bicepsFold") && styles.inputLabelRequired,
                    ]}
                  >
                    Bíceps {isFoldRequired("bicepsFold") && "*"}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      isFoldRequired("bicepsFold") && styles.inputRequired,
                    ]}
                    placeholder="Ex: 8"
                    keyboardType="decimal-pad"
                    value={formData.bicepsFold}
                    onChangeText={(value) => updateField("bicepsFold", value)}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text
                  style={[
                    styles.inputLabel,
                    isFoldRequired("calfMedialFold") &&
                      styles.inputLabelRequired,
                  ]}
                >
                  Panturrilha Medial {isFoldRequired("calfMedialFold") && "*"}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    isFoldRequired("calfMedialFold") && styles.inputRequired,
                  ]}
                  placeholder="Ex: 10"
                  keyboardType="decimal-pad"
                  value={formData.calfMedialFold}
                  onChangeText={(value) => updateField("calfMedialFold", value)}
                />
              </View>
            </View>
          )}
        </View>

        {/* Seção: Diâmetros Ósseos */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("diameters")}
            activeOpacity={0.7}
          >
            <View style={styles.sectionTitleContainer}>
              <Ionicons
                name="resize"
                size={20}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Diâmetros Ósseos (cm)</Text>
            </View>
            <Ionicons
              name={expandedSections.diameters ? "chevron-up" : "chevron-down"}
              size={20}
              color={lightTheme.colors.gray[500]}
            />
          </TouchableOpacity>

          {expandedSections.diameters && (
            <View style={styles.sectionContent}>
              <Text style={styles.sectionDescription}>
                Para análise de somatotipo (Heath-Carter)
              </Text>

              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Diâmetro do Punho</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 5.5"
                    keyboardType="decimal-pad"
                    value={formData.wristDiameter}
                    onChangeText={(value) =>
                      updateField("wristDiameter", value)
                    }
                  />
                </View>

                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Fêmur (Joelho)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 9.5"
                    keyboardType="decimal-pad"
                    value={formData.femurDiameter}
                    onChangeText={(value) =>
                      updateField("femurDiameter", value)
                    }
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Úmero (Cotovelo)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 7.0"
                  keyboardType="decimal-pad"
                  value={formData.humerusDiameter}
                  onChangeText={(value) =>
                    updateField("humerusDiameter", value)
                  }
                />
              </View>
            </View>
          )}
        </View>

        {/* Seção: Composição Corporal */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("composition")}
            activeOpacity={0.7}
          >
            <View style={styles.sectionTitleContainer}>
              <Ionicons
                name="pie-chart"
                size={20}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Composição Corporal</Text>
            </View>
            <Ionicons
              name={
                expandedSections.composition ? "chevron-up" : "chevron-down"
              }
              size={20}
              color={lightTheme.colors.gray[500]}
            />
          </TouchableOpacity>

          {expandedSections.composition && (
            <View style={styles.sectionContent}>
              {/* Preview de Cálculos Automáticos */}
              {formData.protocol && (
                <View style={styles.compositionPreview}>
                  <View style={styles.previewHeader}>
                    <Ionicons
                      name="calculator"
                      size={20}
                      color={lightTheme.colors.primary}
                    />
                    <Text style={styles.previewHeaderText}>
                      Cálculo Automático ({getProtocolLabel(formData.protocol)})
                    </Text>
                  </View>

                  {bodyComposition.bodyFatPercent !== null ? (
                    <>
                      <View style={styles.previewGrid}>
                        <View style={styles.previewCard}>
                          <Ionicons
                            name="water"
                            size={24}
                            color={lightTheme.colors.warning}
                          />
                          <Text style={styles.previewValue}>
                            {bodyComposition.bodyFatPercent}%
                          </Text>
                          <Text style={styles.previewLabel}>% Gordura</Text>
                        </View>

                        <View style={styles.previewCard}>
                          <Ionicons
                            name="barbell"
                            size={24}
                            color={lightTheme.colors.success}
                          />
                          <Text style={styles.previewValue}>
                            {bodyComposition.muscleMass} kg
                          </Text>
                          <Text style={styles.previewLabel}>Massa Magra</Text>
                        </View>

                        <View style={styles.previewCard}>
                          <Ionicons
                            name="nutrition"
                            size={24}
                            color={lightTheme.colors.error}
                          />
                          <Text style={styles.previewValue}>
                            {bodyComposition.fatMass} kg
                          </Text>
                          <Text style={styles.previewLabel}>Massa Gorda</Text>
                        </View>
                      </View>

                      <View style={styles.previewNote}>
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={lightTheme.colors.success}
                        />
                        <Text style={styles.previewNoteText}>
                          Valores calculados automaticamente
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.previewEmpty}>
                      <Ionicons
                        name="information-circle-outline"
                        size={32}
                        color={lightTheme.colors.gray[400]}
                      />
                      <Text style={styles.previewEmptyText}>
                        Preencha todas as dobras cutâneas necessárias para ver o
                        preview do cálculo
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Campos Manuais (Opcional) */}
              <Text style={styles.sectionDescription}>
                Campos opcionais (serão sobrescritos pelo cálculo automático se
                houver protocolo)
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>% Gordura Corporal</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 18.5"
                  keyboardType="decimal-pad"
                  value={formData.bodyFatPercent}
                  onChangeText={(value) => updateField("bodyFatPercent", value)}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Massa Magra (kg)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 62"
                    keyboardType="decimal-pad"
                    value={formData.muscleMass}
                    onChangeText={(value) => updateField("muscleMass", value)}
                  />
                </View>

                <View style={[styles.inputContainer, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Massa Gorda (kg)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 13.5"
                    keyboardType="decimal-pad"
                    value={formData.fatMass}
                    onChangeText={(value) => updateField("fatMass", value)}
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Seção: Notas */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("notes")}
            activeOpacity={0.7}
          >
            <View style={styles.sectionTitleContainer}>
              <Ionicons
                name="document-text"
                size={20}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Observações</Text>
            </View>
            <Ionicons
              name={expandedSections.notes ? "chevron-up" : "chevron-down"}
              size={20}
              color={lightTheme.colors.gray[500]}
            />
          </TouchableOpacity>

          {expandedSections.notes && (
            <View style={styles.sectionContent}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ex: Paciente relatou estar praticando exercícios regularmente..."
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={formData.notes}
                onChangeText={(value) =>
                  setFormData((prev) => ({ ...prev, notes: value }))
                }
              />
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <Text style={styles.submitButtonText}>Salvando...</Text>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>Salvar Avaliação</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: lightTheme.spacing.xl,
    backgroundColor: lightTheme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  headerTextContainer: {
    marginLeft: lightTheme.spacing.md,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: lightTheme.colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: lightTheme.colors.gray[600],
  },
  section: {
    marginTop: lightTheme.spacing.lg,
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    marginHorizontal: lightTheme.spacing.xl,
    overflow: "hidden",
    ...lightTheme.shadows.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: lightTheme.spacing.lg,
    backgroundColor: lightTheme.colors.white,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.text,
  },
  sectionContent: {
    padding: lightTheme.spacing.lg,
    paddingTop: 0,
  },
  sectionDescription: {
    fontSize: 13,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing.md,
    fontStyle: "italic",
  },
  inputRow: {
    flexDirection: "row",
    gap: lightTheme.spacing.md,
  },
  inputContainer: {
    marginBottom: lightTheme.spacing.md,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    borderRadius: lightTheme.borderRadius.md,
    paddingVertical: lightTheme.spacing.sm,
    paddingHorizontal: lightTheme.spacing.md,
    fontSize: 15,
    color: lightTheme.colors.text,
    backgroundColor: lightTheme.colors.white,
    height: 44,
  },
  textArea: {
    height: 100,
    paddingTop: lightTheme.spacing.sm,
    textAlignVertical: "top",
  },
  bmiContainer: {
    backgroundColor: lightTheme.colors.primaryBackground,
    padding: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.md,
    alignItems: "center",
    marginTop: lightTheme.spacing.md,
  },
  bmiLabel: {
    fontSize: 13,
    color: lightTheme.colors.gray[600],
    marginBottom: 4,
  },
  bmiValue: {
    fontSize: 28,
    fontWeight: "700",
    color: lightTheme.colors.primary,
    marginBottom: 4,
  },
  bmiClassification: {
    fontSize: 13,
    fontWeight: "600",
    color: lightTheme.colors.primary,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: lightTheme.colors.white,
    padding: lightTheme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[200],
    ...lightTheme.shadows.lg,
  },
  submitButton: {
    backgroundColor: lightTheme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: lightTheme.spacing.md,
    paddingHorizontal: lightTheme.spacing.lg,
    borderRadius: lightTheme.borderRadius.lg,
    gap: lightTheme.spacing.sm,
    ...lightTheme.shadows.md,
  },
  submitButtonDisabled: {
    backgroundColor: lightTheme.colors.gray[400],
  },
  submitButtonText: {
    color: lightTheme.colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: lightTheme.spacing.xl,
  },
  errorText: {
    marginTop: lightTheme.spacing.md,
    fontSize: 16,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
  },
  inputHelper: {
    fontSize: 12,
    color: lightTheme.colors.gray[500],
    marginBottom: lightTheme.spacing.sm,
    lineHeight: 16,
  },
  protocolContainer: {
    gap: lightTheme.spacing.sm,
    marginTop: lightTheme.spacing.xs,
  },
  protocolOption: {
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    borderRadius: lightTheme.borderRadius.md,
    padding: lightTheme.spacing.md,
    backgroundColor: lightTheme.colors.white,
  },
  protocolOptionSelected: {
    borderColor: lightTheme.colors.primary,
    borderWidth: 2,
    backgroundColor: lightTheme.colors.primaryBackground,
  },
  protocolOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.sm,
  },
  protocolOptionText: {
    fontSize: 15,
    color: lightTheme.colors.text,
    flex: 1,
  },
  protocolOptionTextSelected: {
    fontWeight: "600",
    color: lightTheme.colors.primary,
  },
  protocolInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: lightTheme.spacing.sm,
    backgroundColor: lightTheme.colors.primaryBackground,
    padding: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.md,
    marginTop: lightTheme.spacing.md,
  },
  protocolInfoText: {
    fontSize: 13,
    color: lightTheme.colors.info,
    flex: 1,
    lineHeight: 18,
  },
  bilateralSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.sm,
    marginTop: lightTheme.spacing.lg,
    marginBottom: lightTheme.spacing.md,
    paddingTop: lightTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[200],
  },
  bilateralSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: lightTheme.colors.primary,
  },
  compositionPreview: {
    backgroundColor: lightTheme.colors.primaryBackground,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.lg,
    marginBottom: lightTheme.spacing.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.primary + "30",
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.sm,
    marginBottom: lightTheme.spacing.md,
  },
  previewHeaderText: {
    fontSize: 15,
    fontWeight: "600",
    color: lightTheme.colors.primary,
  },
  previewGrid: {
    flexDirection: "row",
    gap: lightTheme.spacing.sm,
    marginBottom: lightTheme.spacing.md,
  },
  previewCard: {
    flex: 1,
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.md,
    padding: lightTheme.spacing.sm,
    alignItems: "center",
    gap: lightTheme.spacing.xs,
    ...lightTheme.shadows.sm,
  },
  previewValue: {
    fontSize: 18,
    fontWeight: "700",
    color: lightTheme.colors.text,
    textAlign: "center",
  },
  previewLabel: {
    fontSize: 11,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
  },
  previewNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.xs,
    backgroundColor: lightTheme.colors.white,
    padding: lightTheme.spacing.sm,
    borderRadius: lightTheme.borderRadius.md,
  },
  previewNoteText: {
    fontSize: 12,
    color: lightTheme.colors.success,
    flex: 1,
  },
  previewEmpty: {
    alignItems: "center",
    padding: lightTheme.spacing.xl,
    gap: lightTheme.spacing.sm,
  },
  previewEmptyText: {
    fontSize: 13,
    color: lightTheme.colors.gray[500],
    textAlign: "center",
    lineHeight: 18,
  },
  inputLabelRequired: {
    color: lightTheme.colors.warning,
    fontWeight: "600",
  },
  inputRequired: {
    borderColor: lightTheme.colors.warning,
    borderWidth: 2,
    backgroundColor: lightTheme.colors.warning + "05",
  },
  loadLastButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: lightTheme.colors.primaryBackground,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: lightTheme.spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: lightTheme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: lightTheme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: lightTheme.colors.background,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
  },
  modalConfirmButton: {
    backgroundColor: lightTheme.colors.primary,
  },
  modalCancelButtonText: {
    color: lightTheme.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  modalConfirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
