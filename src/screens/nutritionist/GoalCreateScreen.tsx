import React, { useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { lightTheme } from "../../theme";
import { GoalType } from "../../types/patient-details.types";
import type { CreateGoalDto } from "../../types/patient-details.types";
import {
  goalsService,
  bodyMeasurementsService,
} from "../../services/patient-details.service";

interface GoalCreateScreenProps {
  route: {
    params: {
      patientId: string;
      patientName: string;
      goalToEdit?: any;
      isEditing?: boolean;
    };
  };
  navigation: any;
}

// Extendendo os tipos de meta
enum ExtendedGoalType {
  WEIGHT = "WEIGHT",
  BODY_FAT = "BODY_FAT",
  MUSCLE_MASS = "MUSCLE_MASS",
  WAIST_CIRC = "WAIST_CIRC",
  HIP_CIRC = "HIP_CIRC",
  CHEST_CIRC = "CHEST_CIRC",
  ARM_CIRC = "ARM_CIRC",
  THIGH_CIRC = "THIGH_CIRC",
  BMI = "BMI",
  HYDRATION = "HYDRATION",
  OTHER = "OTHER",
}

export function GoalCreateScreen({ route, navigation }: GoalCreateScreenProps) {
  const { patientId, goalToEdit, isEditing } = route.params;
  const [loading, setLoading] = useState(false);
  const [loadingMeasurement, setLoadingMeasurement] = useState(false);
  const [latestMeasurement, setLatestMeasurement] = useState<any>(null);

  const [name, setName] = useState("");
  const [selectedType, setSelectedType] = useState<string>(
    ExtendedGoalType.WEIGHT
  );
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");

  // Estados para o DatePicker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Preencher dados quando estiver em modo de edição
  useEffect(() => {
    if (isEditing && goalToEdit) {
      console.log("=== Modo de Edição - Preenchendo dados ===");
      console.log("Goal para editar:", goalToEdit);

      // Mapear o tipo da API para o tipo estendido
      const typeMap: Record<string, string> = {
        WEIGHT: ExtendedGoalType.WEIGHT,
        BODY_FAT: ExtendedGoalType.BODY_FAT,
        MUSCLE_MASS: ExtendedGoalType.MUSCLE_MASS,
        WAIST: ExtendedGoalType.WAIST_CIRC,
      };

      setName(goalToEdit.name || "");
      setSelectedType(typeMap[goalToEdit.type] || ExtendedGoalType.OTHER);
      setTarget(goalToEdit.target?.toString() || "");
      setCurrent(goalToEdit.current?.toString() || "");
      setNotes(goalToEdit.notes || "");

      if (goalToEdit.deadline) {
        const deadlineDate = new Date(goalToEdit.deadline);
        const formattedDate = `${String(deadlineDate.getDate()).padStart(
          2,
          "0"
        )}/${String(deadlineDate.getMonth() + 1).padStart(
          2,
          "0"
        )}/${deadlineDate.getFullYear()}`;
        setDeadline(formattedDate);
        setSelectedDate(deadlineDate);
      }
    }
  }, [isEditing, goalToEdit]);

  // Limpar formulário e carregar última medição quando a tela recebe foco
  useFocusEffect(
    React.useCallback(() => {
      console.log("=== Tela GoalCreate recebeu foco ===");

      // Só limpar formulário se NÃO estiver editando
      if (!isEditing) {
        console.log("Limpando formulário...");
        setName("");
        setSelectedType(ExtendedGoalType.WEIGHT);
        setTarget("");
        setCurrent("");
        setDeadline("");
        setNotes("");
      } else {
        console.log("Modo de edição - mantendo dados");
      }

      // Carregar última medição
      const loadLatestMeasurement = async () => {
        try {
          console.log(
            "Iniciando carregamento da última medição para patientId:",
            patientId
          );
          setLoadingMeasurement(true);
          const response = await bodyMeasurementsService.findLatest(patientId);
          console.log("=== Última medição carregada com sucesso ===");
          console.log("Response completa:", JSON.stringify(response, null, 2));

          // Usar a resposta diretamente (já retorna BodyMeasurement)
          const measurement = response;
          console.log(
            "Dados extraídos da medição:",
            JSON.stringify(measurement, null, 2)
          );
          console.log("Verificando campos:");
          console.log("- weight existe?", measurement?.weight);
          console.log("- bodyFatPercent existe?", measurement?.bodyFatPercent);
          console.log("- muscleMass existe?", measurement?.muscleMass);

          setLatestMeasurement(measurement);
        } catch (error: any) {
          console.log("=== Erro ao carregar última medição ===");
          console.log("Erro:", error);
          console.log("Mensagem:", error?.message);
          console.log("Response:", error?.response?.data);
          setLatestMeasurement(null);
        } finally {
          setLoadingMeasurement(false);
          console.log("Carregamento finalizado");
        }
      };

      loadLatestMeasurement();

      return () => {
        console.log("=== Tela GoalCreate perdeu foco - limpando dados ===");
      };
    }, [patientId, isEditing])
  );

  // Atualizar valor atual quando o tipo de meta mudar
  useEffect(() => {
    console.log("\n=== useEffect: Atualizar valor atual ===");
    console.log("Tipo selecionado:", selectedType);
    console.log("Tem última medição?", !!latestMeasurement);

    if (!latestMeasurement) {
      console.log("Sem última medição - limpando campo atual");
      setCurrent("");
      return;
    }

    console.log("Campos disponíveis na medição:");
    console.log("- weight:", latestMeasurement.weight);
    console.log("- bodyFatPercent:", latestMeasurement.bodyFatPercent);
    console.log("- muscleMass:", latestMeasurement.muscleMass);
    console.log("- waistCirc:", latestMeasurement.waistCirc);
    console.log("- hipCirc:", latestMeasurement.hipCirc);
    console.log("- chestCirc:", latestMeasurement.chestCirc);
    console.log("- rightArmCirc:", latestMeasurement.rightArmCirc);
    console.log("- leftArmCirc:", latestMeasurement.leftArmCirc);
    console.log("- thighCirc:", latestMeasurement.thighCirc);
    console.log("- bmi:", latestMeasurement.bmi);

    let currentValue = "";

    switch (selectedType) {
      case ExtendedGoalType.WEIGHT:
        currentValue = latestMeasurement.weight?.toString() || "";
        console.log(
          `Buscando WEIGHT: ${latestMeasurement.weight} -> ${currentValue}`
        );
        break;
      case ExtendedGoalType.BODY_FAT:
        currentValue = latestMeasurement.bodyFatPercent?.toString() || "";
        console.log(
          `Buscando BODY_FAT: ${latestMeasurement.bodyFatPercent} -> ${currentValue}`
        );
        break;
      case ExtendedGoalType.MUSCLE_MASS:
        currentValue = latestMeasurement.muscleMass?.toString() || "";
        console.log(
          `Buscando MUSCLE_MASS: ${latestMeasurement.muscleMass} -> ${currentValue}`
        );
        break;
      case ExtendedGoalType.WAIST_CIRC:
        currentValue = latestMeasurement.waistCirc?.toString() || "";
        console.log(
          `Buscando WAIST_CIRC: ${latestMeasurement.waistCirc} -> ${currentValue}`
        );
        break;
      case ExtendedGoalType.HIP_CIRC:
        currentValue = latestMeasurement.hipCirc?.toString() || "";
        console.log(
          `Buscando HIP_CIRC: ${latestMeasurement.hipCirc} -> ${currentValue}`
        );
        break;
      case ExtendedGoalType.CHEST_CIRC:
        currentValue = latestMeasurement.chestCirc?.toString() || "";
        console.log(
          `Buscando CHEST_CIRC: ${latestMeasurement.chestCirc} -> ${currentValue}`
        );
        break;
      case ExtendedGoalType.ARM_CIRC:
        currentValue =
          latestMeasurement.rightArmCirc?.toString() ||
          latestMeasurement.leftArmCirc?.toString() ||
          "";
        console.log(
          `Buscando ARM_CIRC: right=${latestMeasurement.rightArmCirc}, left=${latestMeasurement.leftArmCirc} -> ${currentValue}`
        );
        break;
      case ExtendedGoalType.THIGH_CIRC:
        currentValue = latestMeasurement.thighCirc?.toString() || "";
        console.log(
          `Buscando THIGH_CIRC: ${latestMeasurement.thighCirc} -> ${currentValue}`
        );
        break;
      case ExtendedGoalType.BMI:
        currentValue = latestMeasurement.bmi?.toString() || "";
        console.log(
          `Buscando BMI: ${latestMeasurement.bmi} -> ${currentValue}`
        );
        break;
      case ExtendedGoalType.HYDRATION:
        currentValue = "";
        console.log("HYDRATION - não tem campo na medição");
        break;
      default:
        currentValue = "";
        console.log("Tipo não reconhecido ou OTHER");
    }

    console.log("Valor final calculado para setCurrent:", currentValue);
    setCurrent(currentValue);
    console.log("=== Fim useEffect ===\n");
  }, [selectedType, latestMeasurement]);

  const getUnitForType = (type: string): string => {
    const units: Record<string, string> = {
      [ExtendedGoalType.WEIGHT]: "kg",
      [ExtendedGoalType.BODY_FAT]: "%",
      [ExtendedGoalType.MUSCLE_MASS]: "kg",
      [ExtendedGoalType.WAIST_CIRC]: "cm",
      [ExtendedGoalType.HIP_CIRC]: "cm",
      [ExtendedGoalType.CHEST_CIRC]: "cm",
      [ExtendedGoalType.ARM_CIRC]: "cm",
      [ExtendedGoalType.THIGH_CIRC]: "cm",
      [ExtendedGoalType.BMI]: "",
      [ExtendedGoalType.HYDRATION]: "%",
      [ExtendedGoalType.OTHER]: "",
    };
    return units[type] || "";
  };

  const getGoalTypeInfo = (type: string) => {
    const info: Record<
      string,
      { icon: keyof typeof Ionicons.glyphMap; label: string }
    > = {
      [ExtendedGoalType.WEIGHT]: { icon: "scale", label: "Peso" },
      [ExtendedGoalType.BODY_FAT]: { icon: "water", label: "% Gordura" },
      [ExtendedGoalType.MUSCLE_MASS]: {
        icon: "fitness",
        label: "Massa Muscular",
      },
      [ExtendedGoalType.WAIST_CIRC]: { icon: "ellipse", label: "Cintura" },
      [ExtendedGoalType.HIP_CIRC]: {
        icon: "ellipse-outline",
        label: "Quadril",
      },
      [ExtendedGoalType.CHEST_CIRC]: { icon: "body", label: "Peitoral" },
      [ExtendedGoalType.ARM_CIRC]: { icon: "hand-left", label: "Braço" },
      [ExtendedGoalType.THIGH_CIRC]: { icon: "walk", label: "Coxa" },
      [ExtendedGoalType.BMI]: { icon: "calculator", label: "IMC" },
      [ExtendedGoalType.HYDRATION]: {
        icon: "water-outline",
        label: "Hidratação",
      },
      [ExtendedGoalType.OTHER]: { icon: "flag", label: "Outro" },
    };
    return info[type] || { icon: "flag", label: "Outro" };
  };

  const handleReset = () => {
    setName("");
    setSelectedType(ExtendedGoalType.WEIGHT);
    setTarget("");
    setCurrent("");
    setDeadline("");
    setNotes("");
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!name.trim()) {
      Alert.alert("Campo obrigatório", "Nome da meta é obrigatório");
      return;
    }

    if (!target) {
      Alert.alert("Campo obrigatório", "Valor da meta é obrigatório");
      return;
    }

    const targetNum = parseFloat(target);

    if (isNaN(targetNum) || targetNum <= 0) {
      Alert.alert("Erro", "Meta deve ser um número válido maior que zero");
      return;
    }

    const currentNum = current ? parseFloat(current) : undefined;
    if (current && (isNaN(currentNum!) || currentNum! < 0)) {
      Alert.alert("Erro", "Valor atual deve ser um número válido");
      return;
    }

    // Validate deadline format (DD/MM/YYYY)
    let deadlineISO: string | undefined = undefined;
    if (deadline) {
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = deadline.match(dateRegex);

      if (!match) {
        Alert.alert("Erro", "Prazo deve estar no formato DD/MM/AAAA");
        return;
      }

      const [, day, month, year] = match;
      const dateObj = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );

      if (dateObj <= new Date()) {
        Alert.alert("Erro", "Prazo deve ser uma data futura");
        return;
      }

      deadlineISO = dateObj.toISOString();
    }

    // Mapear tipos estendidos para tipos da API
    const apiTypeMap: Record<string, GoalType> = {
      [ExtendedGoalType.WEIGHT]: GoalType.WEIGHT,
      [ExtendedGoalType.BODY_FAT]: GoalType.BODY_FAT,
      [ExtendedGoalType.MUSCLE_MASS]: GoalType.MUSCLE_MASS,
      [ExtendedGoalType.WAIST_CIRC]: GoalType.WAIST_CIRC,
      [ExtendedGoalType.HIP_CIRC]: GoalType.WAIST_CIRC, // Usando WAIST_CIRC como fallback
      [ExtendedGoalType.CHEST_CIRC]: GoalType.WAIST_CIRC,
      [ExtendedGoalType.ARM_CIRC]: GoalType.WAIST_CIRC,
      [ExtendedGoalType.THIGH_CIRC]: GoalType.WAIST_CIRC,
      [ExtendedGoalType.BMI]: GoalType.OTHER,
      [ExtendedGoalType.HYDRATION]: GoalType.OTHER,
      [ExtendedGoalType.OTHER]: GoalType.OTHER,
    };

    const data: CreateGoalDto = {
      name: name.trim(),
      type: apiTypeMap[selectedType] || GoalType.OTHER,
      target: targetNum,
      current: currentNum,
      unit: getUnitForType(selectedType),
      deadline: deadlineISO,
      notes: notes.trim() || undefined,
    };

    console.log("🎯 [GoalCreateScreen] Dados preparados para envio:", {
      selectedType,
      target,
      current,
      deadline,
      notes,
      deadlineISO,
      data,
      dataKeys: Object.keys(data),
    });

    try {
      setLoading(true);

      let result;
      if (isEditing && goalToEdit) {
        // Atualizar meta existente
        console.log("🎯 [GoalCreateScreen] Atualizando meta:", goalToEdit.id);
        result = await goalsService.update(patientId, goalToEdit.id, data);
      } else {
        // Criar nova meta
        console.log("🎯 [GoalCreateScreen] Criando nova meta");
        result = await goalsService.create(patientId, data);
      }

      console.log("🎯 [GoalCreateScreen] Resposta da API:", result);
      handleReset();

      Toast.show({
        type: "success",
        text1: "Sucesso!",
        text2: isEditing
          ? "Meta atualizada com sucesso"
          : "Meta criada com sucesso",
        position: "bottom",
        visibilityTime: 2000,
      });

      navigation.navigate("PatientDetails", {
        patientId,
        initialTab: "goals",
        shouldReload: true,
      });
    } catch (error) {
      console.error("Error adding goal:", error);
      Alert.alert("Erro", "Não foi possível adicionar a meta");
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    unit?: string,
    required = false,
    keyboardType: "default" | "decimal-pad" = "decimal-pad"
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, unit ? { flex: 1 } : { width: "100%" }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={lightTheme.colors.gray[400]}
          keyboardType={keyboardType}
          editable={!loading}
        />
        {unit && <Text style={styles.unitText}>{unit}</Text>}
      </View>
    </View>
  );

  // Handler para mudança de data
  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (date) {
      setSelectedDate(date);
      // Formatar data no formato DD/MM/AAAA
      const formattedDate = date.toLocaleDateString("pt-BR");
      setDeadline(formattedDate);
    }
  };

  // Função para formatar a data para exibição
  const formatDateDisplay = (dateString: string): string => {
    if (!dateString) return "Selecionar data";
    return dateString;
  };

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
        {/* Tipo de Meta */}
        {/* Nome da Meta */}
        <View style={styles.fullWidthInput}>
          {renderInput(
            "Nome da Meta",
            name,
            setName,
            "Ex: Reduzir peso para o verão",
            undefined,
            true,
            "default"
          )}
        </View>

        <View style={styles.sectionDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Tipo de Meta</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.typeGrid}>
          {Object.values(ExtendedGoalType).map((type) => {
            const typeInfo = getGoalTypeInfo(type);
            const isSelected = selectedType === type;

            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeOption,
                  isSelected && styles.typeOptionSelected,
                ]}
                onPress={() => setSelectedType(type)}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Ionicons
                  name={typeInfo.icon}
                  size={24}
                  color={
                    isSelected
                      ? lightTheme.colors.primary
                      : lightTheme.colors.gray[600]
                  }
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    isSelected && styles.typeOptionTextSelected,
                  ]}
                >
                  {typeInfo.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Valores */}
        <View style={styles.sectionDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Valores</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.row}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Atual</Text>
            <View style={styles.inputRow}>
              {loadingMeasurement ? (
                <View
                  style={[
                    styles.input,
                    { justifyContent: "center", alignItems: "center" },
                  ]}
                >
                  <ActivityIndicator
                    size="small"
                    color={lightTheme.colors.primary}
                  />
                </View>
              ) : (
                <TextInput
                  style={[
                    styles.input,
                    { flex: 1 },
                    latestMeasurement && current && styles.inputDisabled,
                  ]}
                  value={current}
                  onChangeText={setCurrent}
                  placeholder={
                    latestMeasurement ? "Carregado da última medição" : "Ex: 75"
                  }
                  placeholderTextColor={lightTheme.colors.gray[400]}
                  keyboardType="decimal-pad"
                  editable={!loading && (!latestMeasurement || !current)}
                />
              )}
              {getUnitForType(selectedType) && (
                <Text style={styles.unitText}>
                  {getUnitForType(selectedType)}
                </Text>
              )}
            </View>
          </View>
          {renderInput(
            "Meta",
            target,
            setTarget,
            `Ex: 70`,
            getUnitForType(selectedType),
            true
          )}
        </View>

        {/* Prazo */}
        <View style={styles.sectionDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Prazo</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Data limite</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Ionicons
              name="calendar"
              size={20}
              color={lightTheme.colors.primary}
            />
            <Text style={styles.dateButtonText}>
              {formatDateDisplay(deadline)}
            </Text>
            <Ionicons
              name="chevron-down"
              size={20}
              color={lightTheme.colors.gray[400]}
            />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Observações */}
        <View style={styles.sectionDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Observações</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.fullWidthInput}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Adicione observações sobre esta meta..."
              placeholderTextColor={lightTheme.colors.gray[400]}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              editable={!loading}
            />
          </View>
        </View>

        {/* Botão de Salvar */}
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
              <Text style={styles.submitButtonText}>Salvar Meta</Text>
            </>
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
    backgroundColor: lightTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: lightTheme.spacing.xl,
    paddingBottom: lightTheme.spacing.xl,
  },
  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: lightTheme.spacing.xl,
    marginBottom: lightTheme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: lightTheme.colors.gray[200],
  },
  dividerText: {
    fontSize: 14,
    fontWeight: "600",
    color: lightTheme.colors.gray[600],
    marginHorizontal: lightTheme.spacing.md,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -lightTheme.spacing.xs,
  },
  typeOption: {
    width: "48%",
    margin: "1%",
    backgroundColor: lightTheme.colors.white,
    borderWidth: 1.5,
    borderColor: lightTheme.colors.gray[300],
    borderRadius: lightTheme.borderRadius.md,
    padding: lightTheme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
  },
  typeOptionSelected: {
    borderColor: lightTheme.colors.primary,
    backgroundColor: lightTheme.colors.primaryBackground,
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: "500",
    color: lightTheme.colors.text,
    textAlign: "center",
    marginTop: lightTheme.spacing.xs,
  },
  typeOptionTextSelected: {
    color: lightTheme.colors.primary,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: lightTheme.spacing.md,
  },
  fullWidthInput: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: lightTheme.spacing.md,
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing.xs,
  },
  required: {
    color: lightTheme.colors.error,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.sm,
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
  inputDisabled: {
    backgroundColor: lightTheme.colors.gray[100],
    color: lightTheme.colors.gray[600],
    borderColor: lightTheme.colors.gray[200],
  },
  unitText: {
    fontSize: 15,
    fontWeight: "500",
    color: lightTheme.colors.gray[600],
    paddingHorizontal: lightTheme.spacing.sm,
  },
  inputWithIcon: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: lightTheme.spacing.md,
    top: 13,
    zIndex: 1,
  },
  inputWithIconPadding: {
    paddingLeft: 40,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: lightTheme.colors.white,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    borderRadius: lightTheme.borderRadius.md,
    paddingVertical: lightTheme.spacing.sm,
    paddingHorizontal: lightTheme.spacing.md,
    height: 44,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 15,
    color: lightTheme.colors.text,
    marginLeft: lightTheme.spacing.sm,
  },
  textArea: {
    height: 120,
    paddingTop: lightTheme.spacing.sm,
    textAlignVertical: "top",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: lightTheme.spacing.sm,
    backgroundColor: lightTheme.colors.primary,
    paddingVertical: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.lg,
    marginTop: lightTheme.spacing.lg,
    ...lightTheme.shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomSpacer: {
    height: 20,
  },
});
