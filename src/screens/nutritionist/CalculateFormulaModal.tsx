import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { lightTheme } from "../../theme";
import { formulaService } from "../../services";
import { getPatients } from "../../services/patient.service";
import { bodyMeasurementsService } from "../../services/patient-details.service";
import type { BodyMeasurement } from "../../types/patient-details.types";
import type {
  CustomFormula,
  CalculateFormulaDto,
  FormulaVariableType,
} from "../../types/formula.types";
import {
  FormulaVariableTypeLabels,
  FormulaOutputTypeLabels,
} from "../../types/formula.types";

interface CalculateFormulaModalProps {
  navigation: any;
  route: {
    params: {
      formulaId: string;
      patientId?: string;
    };
  };
}

interface Patient {
  id: string; // ID do PatientProfile
  relationshipId: string; // ID do relacionamento (Patient.id)
  name: string;
  email: string;
  birthDate?: string; // Data de nascimento para cálculo de idade
}

interface VariableValue {
  variable: FormulaVariableType;
  value: string;
}

export default function CalculateFormulaModal({
  navigation,
  route,
}: CalculateFormulaModalProps) {
  const { formulaId, patientId: initialPatientId } = route.params;

  const [formula, setFormula] = useState<CustomFormula | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    initialPatientId || ""
  );
  const [variableValues, setVariableValues] = useState<VariableValue[]>([]);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const [formulaResponse] = await Promise.all([
        formulaService.getById(formulaId),
        loadPatients(),
      ]);

      // Unwrap the API response wrapper
      const formulaData = (formulaResponse as any).data || formulaResponse;
      setFormula(formulaData);

      // Inicializar valores das variáveis
      const initialValues: VariableValue[] = (formulaData.variables || []).map(
        (variable: FormulaVariableType) => ({
          variable,
          value: "",
        })
      );
      setVariableValues(initialValues);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message || "Não foi possível carregar os dados",
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await getPatients();

      // Unwrap API response - cuidado com double nesting data.data
      let patientsData = (response as any).data || response;

      // Se ainda tem outra camada de data, desembrulhar novamente
      if (patientsData.data && Array.isArray(patientsData.data)) {
        patientsData = patientsData.data;
      }

      // Filtrar apenas relacionamentos ativos
      const activeRelationships = Array.isArray(patientsData)
        ? patientsData.filter((relationship: any) => {
            return relationship.status === "ACTIVE" && relationship.patient;
          })
        : [];

      // Mapear para o formato esperado com birthDate
      const mappedPatients = activeRelationships.map((relationship: any) => ({
        id: relationship.patient.id, // ID do PatientProfile
        relationshipId: relationship.id, // ID do relacionamento
        name: relationship.patient.name,
        email: relationship.patient.email,
        birthDate: relationship.patient.birthDate, // Para cálculo de idade
      }));

      setPatients(mappedPatients);
    } catch (error) {
      console.error("❌ Erro ao carregar pacientes:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao carregar pacientes",
        text2: error instanceof Error ? error.message : "Erro desconhecido",
        position: "top",
      });
      setPatients([]);
    }
  };

  const handleVariableChange = (
    variable: FormulaVariableType,
    value: string
  ) => {
    setVariableValues((prev) =>
      prev.map((v) => (v.variable === variable ? { ...v, value } : v))
    );
    // Limpar resultado quando valores mudarem
    setResult(null);
  };

  const handleCalculate = async () => {
    if (!selectedPatientId) {
      Toast.show({
        type: "error",
        text1: "Paciente Obrigatório",
        text2: "Selecione um paciente para calcular",
      });
      return;
    }

    // Validar que todos os valores foram preenchidos
    const emptyValues = variableValues.filter((v) => !v.value.trim());
    if (emptyValues.length > 0) {
      Toast.show({
        type: "error",
        text1: "Valores Incompletos",
        text2: `Preencha todos os valores das variáveis (${emptyValues.length} faltando)`,
      });
      return;
    }

    // Validar que todos os valores são numéricos
    const invalidValues = variableValues.filter((v) => isNaN(Number(v.value)));
    if (invalidValues.length > 0) {
      Toast.show({
        type: "error",
        text1: "Valores Inválidos",
        text2: "Todos os valores devem ser numéricos",
      });
      return;
    }

    setCalculating(true);

    try {
      // Buscar o relationshipId do paciente selecionado
      const selectedPatient = patients.find((p) => p.id === selectedPatientId);
      const relationshipId =
        selectedPatient?.relationshipId || selectedPatientId;

      // Converter valores para objeto com chaves em lowercase
      const values: Record<string, number> = {};
      variableValues.forEach((v) => {
        // Backend espera variáveis em lowercase (weight, height, age, etc)
        const variableKey = v.variable.toLowerCase();
        values[variableKey] = Number(v.value);
      });

      const dto: CalculateFormulaDto = {
        formulaId,
        patientId: relationshipId, // Usar relationshipId para API
        inputValues: values,
        notes: notes.trim() || undefined,
      };

      const response = await formulaService.calculate(formulaId, dto);

      // Unwrap API response
      const calculatedResult = (response as any).data || response;

      // Verificar se o resultado existe
      if (calculatedResult && typeof calculatedResult.result === "number") {
        setResult(calculatedResult.result);

        Toast.show({
          type: "success",
          text1: "Cálculo Realizado",
          text2: "Resultado salvo com sucesso",
        });

        // Usuário permanece na tela para visualizar o resultado
      } else {
        throw new Error("Resultado do cálculo não foi retornado corretamente");
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro no Cálculo",
        text2: error.message || "Não foi possível calcular a fórmula",
      });
    } finally {
      setCalculating(false);
    }
  };

  const getSelectedPatient = () => {
    return patients.find((p) => p.id === selectedPatientId);
  };

  // Mapear variável da fórmula para campo da medição
  const getVariableValueFromMeasurement = (
    variable: FormulaVariableType,
    measurement: BodyMeasurement,
    patient: Patient
  ): number | null => {
    switch (variable) {
      case "AGE":
        if (!patient.birthDate) return null;
        try {
          const birthDate = new Date(patient.birthDate);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ) {
            age--;
          }
          return age;
        } catch (error) {
          console.error("Erro ao calcular idade:", error);
          return null;
        }
      case "WEIGHT":
        return measurement.weight;
      case "HEIGHT":
        return measurement.height;
      case "BMI":
        return measurement.bmi;
      case "WAIST":
        return measurement.waistCirc || null;
      case "HIP":
        return measurement.hipCirc || null;
      case "CHEST":
        return measurement.chestCirc || null;
      case "ARM":
        return measurement.rightArmCirc || measurement.leftArmCirc || null;
      case "THIGH":
        return measurement.thighCirc || null;
      case "CALF":
        return measurement.calfCirc || null;
      case "NECK":
        return measurement.neckCirc || null;
      case "ABDOMINAL":
        return measurement.abdomenCirc || null;
      case "TRICEPS_SKINFOLD":
        return measurement.tricepsSkinfold || null;
      case "SUBSCAPULAR_SKINFOLD":
        return measurement.subscapularSkinfold || null;
      case "PECTORAL_SKINFOLD":
        return measurement.pectoralSkinfold || null;
      case "SUPRAILIAC_SKINFOLD":
        return measurement.suprailiacSkinfold || null;
      case "THIGH_SKINFOLD":
        return measurement.thighSkinfold || null;
      case "ABDOMINAL_SKINFOLD":
        return measurement.abdominalSkinfold || null;
      default:
        return null;
    }
  };

  // Carregar última medição do paciente e preencher variáveis
  const loadPatientMeasurements = useCallback(
    async (patientId: string) => {
      setLoadingMeasurements(true);
      try {
        // Buscar o relationshipId do paciente selecionado
        const selectedPatient = patients.find((p) => p.id === patientId);
        const relationshipId = selectedPatient?.relationshipId || patientId;

        const response = await bodyMeasurementsService.findLatest(
          relationshipId
        );
        const measurement = (response as any).data || response;

        setVariableValues((prev) =>
          prev.map((v) => {
            if (!selectedPatient) return v;

            const value = getVariableValueFromMeasurement(
              v.variable,
              measurement,
              selectedPatient
            );

            return {
              ...v,
              value: value !== null ? value.toString() : "",
            };
          })
        );

        Toast.show({
          type: "success",
          text1: "Dados carregados",
          text2: "Valores preenchidos com a última medição",
          position: "top",
        });
      } catch (error: any) {
        console.error("❌ Erro ao carregar medições:", error);

        const errorMessage = error?.message || "";

        // Limpar os campos para preenchimento manual
        setVariableValues((prev) =>
          prev.map((v) => ({
            ...v,
            value: "",
          }))
        );

        // Verificar tipo de erro
        if (errorMessage.includes("Nenhuma medida encontrada")) {
          // Paciente sem medições - situação normal para primeira avaliação
          Toast.show({
            type: "info",
            text1: "Primeira avaliação",
            text2: "Paciente ainda não possui medições cadastradas",
            position: "top",
            visibilityTime: 2500,
          });
        } else if (
          errorMessage.includes("não pertence") ||
          errorMessage.includes("não encontrado")
        ) {
          // Erro de permissão/acesso
          Toast.show({
            type: "warning",
            text1: "Acesso negado",
            text2:
              "Você não tem permissão para acessar os dados deste paciente",
            position: "top",
            visibilityTime: 3000,
          });
        } else {
          // Outros erros
          Toast.show({
            type: "info",
            text1: "Dados não disponíveis",
            text2: "Preencha os valores manualmente",
            position: "top",
            visibilityTime: 2500,
          });
        }
      } finally {
        setLoadingMeasurements(false);
      }
    },
    [patients]
  );

  // Efeito para carregar medições quando paciente é selecionado
  useEffect(() => {
    if (selectedPatientId && formula) {
      loadPatientMeasurements(selectedPatientId);
    }
  }, [selectedPatientId, formula, loadPatientMeasurements]);

  // Resetar estado ao entrar/sair da tela
  useEffect(() => {
    return () => {
      // Cleanup ao desmontar o componente
      setSelectedPatientId("");
      setVariableValues([]);
      setNotes("");
      setResult(null);
      setShowPatientPicker(false);
    };
  }, []);

  if (loading || !formula) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={lightTheme.colors.primary} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={lightTheme.colors.background}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "android" ? "height" : "padding"}
        keyboardVerticalOffset={Platform.OS === "android" ? 0 : 64}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card da Fórmula */}
          <View style={styles.formulaCard}>
            <Text style={styles.formulaName}>{formula.name}</Text>
            {formula.description && (
              <Text style={styles.formulaDescription}>
                {formula.description}
              </Text>
            )}
            <View style={styles.formulaInfo}>
              <View style={styles.formulaInfoBadge}>
                <Ionicons
                  name="flag"
                  size={14}
                  color={lightTheme.colors.primary}
                />
                <Text style={styles.formulaInfoText}>
                  {FormulaOutputTypeLabels[formula.outputType]}
                </Text>
              </View>
              {formula.outputUnit && (
                <View style={styles.formulaInfoBadge}>
                  <Ionicons
                    name="analytics"
                    size={14}
                    color={lightTheme.colors.success}
                  />
                  <Text style={styles.formulaInfoText}>
                    {formula.outputUnit}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Seleção de Paciente */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Paciente <Text style={styles.required}>*</Text>
            </Text>

            <TouchableOpacity
              style={styles.patientSelector}
              onPress={() => setShowPatientPicker(!showPatientPicker)}
            >
              <View style={styles.patientSelectorContent}>
                <Ionicons
                  name="person"
                  size={20}
                  color={lightTheme.colors.gray[600]}
                />
                <Text
                  style={[
                    styles.patientSelectorText,
                    !selectedPatientId && styles.patientSelectorPlaceholder,
                  ]}
                >
                  {getSelectedPatient()?.name || "Selecione um paciente"}
                </Text>
              </View>
              <Ionicons
                name={showPatientPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color={lightTheme.colors.gray[600]}
              />
            </TouchableOpacity>

            {showPatientPicker && (
              <View style={styles.patientPicker}>
                {patients.map((patient) => (
                  <TouchableOpacity
                    key={patient.id}
                    style={[
                      styles.patientOption,
                      selectedPatientId === patient.id &&
                        styles.patientOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedPatientId(patient.id);
                      setShowPatientPicker(false);
                    }}
                  >
                    <View style={styles.patientOptionContent}>
                      <Text style={styles.patientOptionName}>
                        {patient.name}
                      </Text>
                      <Text style={styles.patientOptionEmail}>
                        {patient.email}
                      </Text>
                    </View>
                    {selectedPatientId === patient.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={lightTheme.colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Valores das Variáveis */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Valores das Variáveis <Text style={styles.required}>*</Text>
            </Text>
            {loadingMeasurements ? (
              <View style={styles.loadingMeasurementsContainer}>
                <ActivityIndicator
                  size="small"
                  color={lightTheme.colors.primary}
                />
                <Text style={styles.loadingMeasurementsText}>
                  Carregando última medição do paciente...
                </Text>
              </View>
            ) : (
              <Text style={styles.sectionHint}>
                Valores preenchidos automaticamente com a última medição
              </Text>
            )}

            {variableValues.map(({ variable, value }) => (
              <View key={variable} style={styles.variableInput}>
                <Text style={styles.variableLabel}>
                  {FormulaVariableTypeLabels[variable]}
                </Text>
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={(text) => handleVariableChange(variable, text)}
                  placeholder="Ex: 75.5"
                  placeholderTextColor={lightTheme.colors.gray[400]}
                  keyboardType="decimal-pad"
                  editable={!calculating && !loadingMeasurements}
                />
              </View>
            ))}
          </View>

          {/* Observações */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Observações (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Adicione observações sobre este cálculo..."
              placeholderTextColor={lightTheme.colors.gray[400]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!calculating}
            />
          </View>

          {/* Resultado */}
          {result !== null && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={lightTheme.colors.success}
                />
                <Text style={styles.resultLabel}>Resultado do Cálculo</Text>
              </View>
              <View style={styles.resultContent}>
                <Text style={styles.resultValue}>{result.toFixed(2)}</Text>
                {formula.outputUnit && (
                  <Text style={styles.resultUnit}>{formula.outputUnit}</Text>
                )}
              </View>
              <View style={styles.resultFooter}>
                <Ionicons
                  name="information-circle-outline"
                  size={14}
                  color={lightTheme.colors.gray[500]}
                />
                <Text style={styles.resultFooterText}>
                  Resultado salvo na evolução do paciente
                </Text>
              </View>
            </View>
          )}

          {/* Botão Calcular */}
          <TouchableOpacity
            style={[
              styles.calculateButton,
              (calculating || result !== null) &&
                styles.calculateButtonDisabled,
            ]}
            onPress={handleCalculate}
            disabled={calculating || result !== null}
          >
            {calculating ? (
              <ActivityIndicator size="small" color={lightTheme.colors.white} />
            ) : (
              <>
                <Ionicons
                  name="calculator"
                  size={20}
                  color={lightTheme.colors.white}
                />
                <Text style={styles.calculateButtonText}>
                  {result !== null
                    ? "Calculado com Sucesso"
                    : "Calcular Fórmula"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Espaçamento inferior */}
          <View style={{ height: 40 }} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: lightTheme.colors.gray[600],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: lightTheme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,

    color: lightTheme.colors.text,
    textAlign: "center",
    marginHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  formulaCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  formulaName: {
    fontSize: 20,

    color: lightTheme.colors.text,
    marginBottom: 8,
  },
  formulaDescription: {
    fontSize: 14,

    color: lightTheme.colors.gray[600],
    lineHeight: 20,
    marginBottom: 12,
  },
  formulaInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  formulaInfoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.gray[100],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  formulaInfoText: {
    fontSize: 12,

    color: lightTheme.colors.gray[700],
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,

    color: lightTheme.colors.text,
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 13,

    color: lightTheme.colors.gray[600],
    marginBottom: 12,
  },
  loadingMeasurementsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: `${lightTheme.colors.primary}10`,
    borderRadius: 8,
    marginBottom: 12,
  },
  loadingMeasurementsText: {
    fontSize: 13,

    color: lightTheme.colors.primary,
  },
  required: {
    color: lightTheme.colors.error,
  },
  patientSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: lightTheme.colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
  },
  patientSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  patientSelectorText: {
    fontSize: 15,

    color: lightTheme.colors.text,
    flex: 1,
  },
  patientSelectorPlaceholder: {
    color: lightTheme.colors.gray[400],
  },
  patientPicker: {
    marginTop: 8,
    backgroundColor: lightTheme.colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    overflow: "hidden",
  },
  patientOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  patientOptionSelected: {
    backgroundColor: `${lightTheme.colors.primary}10`,
  },
  patientOptionContent: {
    flex: 1,
  },
  patientOptionName: {
    fontSize: 15,

    color: lightTheme.colors.text,
    marginBottom: 2,
  },
  patientOptionEmail: {
    fontSize: 13,

    color: lightTheme.colors.gray[600],
  },
  variableInput: {
    marginBottom: 16,
  },
  variableLabel: {
    fontSize: 14,

    color: lightTheme.colors.gray[700],
    marginBottom: 6,
  },
  input: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,

    color: lightTheme.colors.text,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
  },
  textArea: {
    height: 100,
    paddingTop: 16,
  },
  resultCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  resultLabel: {
    fontSize: 15,

    color: lightTheme.colors.gray[700],
  },
  resultContent: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 6,
    marginVertical: 16,
  },
  resultValue: {
    fontSize: 32,

    color: lightTheme.colors.primary,
    letterSpacing: 0.5,
  },
  resultUnit: {
    fontSize: 18,

    color: lightTheme.colors.gray[600],
  },
  resultFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[100],
  },
  resultFooterText: {
    fontSize: 12,

    color: lightTheme.colors.gray[600],
  },
  calculateButton: {
    backgroundColor: lightTheme.colors.primary,
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: lightTheme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  calculateButtonDisabled: {
    backgroundColor: lightTheme.colors.gray[400],
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  calculateButtonText: {
    fontSize: 16,

    color: lightTheme.colors.white,
  },
});
