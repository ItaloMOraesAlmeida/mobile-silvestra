import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import Toast from "react-native-toast-message";
import { lightTheme } from "../../theme";
import { formulaService } from "../../services";
import BottomSheetPicker from "../../components/BottomSheetPicker";
import type {
  CreateFormulaDto,
  UpdateFormulaDto,
  FormulaVariableType,
} from "../../types/formula.types";
import {
  FormulaOutputType,
  FormulaVariableTypeLabels,
  FormulaOutputTypeLabels,
  FormulaCategories,
} from "../../types/formula.types";

interface FormulaEditorScreenProps {
  navigation: any;
  route: {
    params?: {
      formulaId?: string;
    };
  };
}

interface FormulaFormData {
  name: string;
  description: string;
  formula: string;
}

export default function FormulaEditorScreen({
  navigation,
  route,
}: FormulaEditorScreenProps) {
  const isEditing = !!route.params?.formulaId;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // React Hook Form
  const {
    control,
    handleSubmit,
    setValue: setFormValue,
    formState: { errors },
  } = useForm<FormulaFormData>({
    defaultValues: {
      name: "",
      description: "",
      formula: "",
    },
  });

  // Form state (mantendo para compatibilidade com lógica existente)
  const [formula, setFormula] = useState("");
  const [outputType, setOutputType] = useState<FormulaOutputType>(
    FormulaOutputType.CUSTOM
  );
  const [outputUnit, setOutputUnit] = useState("");
  const [category, setCategory] = useState("");
  const [reference, setReference] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedVariables, setSelectedVariables] = useState<
    FormulaVariableType[]
  >([]);
  const [showVariablesPicker, setShowVariablesPicker] = useState(false);
  const [showOutputPicker, setShowOutputPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showOperatorsModal, setShowOperatorsModal] = useState(false);

  // Test state
  const [testValues, setTestValues] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<{
    success: boolean;
    result?: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (isEditing && route.params?.formulaId) {
      loadFormula(route.params.formulaId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, route.params?.formulaId]);

  const loadFormula = async (id: string) => {
    try {
      const response = await formulaService.getById(id);
      // Unwrap the API response wrapper
      const data = (response as any).data || response;
      setFormValue("name", data.name);
      setFormValue("description", data.description || "");
      setFormula(data.formula);
      setFormValue("formula", data.formula);
      setOutputType(data.outputType);
      setOutputUnit(data.outputUnit || "");
      setCategory(data.category || "");
      setReference(data.reference || "");
      setIsPublic(data.isPublic);
      setSelectedVariables(data.variables || []);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message || "Não foi possível carregar a fórmula",
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    // Reseta resultado anterior
    setTestResult(null);

    if (!formula.trim()) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Digite uma fórmula para testar",
      });
      return;
    }

    // Verifica se há variáveis selecionadas
    if (selectedVariables.length === 0) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Selecione pelo menos uma variável antes de testar",
      });
      return;
    }

    // Validação básica: verificar se variáveis estão separadas por operadores
    const formulaLower = formula.toLowerCase();
    const commonVars = [
      "weight",
      "height",
      "age",
      "waist",
      "hip",
      "chest",
      "arm",
      "thigh",
      "calf",
      "neck",
    ];

    for (let i = 0; i < commonVars.length; i++) {
      for (let j = 0; j < commonVars.length; j++) {
        if (i !== j) {
          const concatenated = commonVars[i] + commonVars[j];
          if (formulaLower.includes(concatenated)) {
            Toast.show({
              type: "error",
              text1: "Erro na Fórmula",
              text2: `Detectado "${concatenated}". Use operadores entre variáveis (ex: ${commonVars[i]}*${commonVars[j]} ou ${commonVars[i]}+${commonVars[j]})`,
              visibilityTime: 6000,
            });
            return;
          }
        }
      }
    }

    // Converte valores de string para número
    const numericValues: Record<string, number> = {};
    let hasAtLeastOneValue = false;

    selectedVariables.forEach((variable) => {
      const value = testValues[variable];
      if (value && value.trim()) {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          numericValues[variable] = num;
          hasAtLeastOneValue = true;
        }
      }
    });

    if (!hasAtLeastOneValue) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2:
          "Preencha pelo menos um valor de teste para as variáveis selecionadas",
      });
      return;
    }

    setTesting(true);
    try {
      // Converte as chaves para minúsculas (as variáveis na fórmula devem estar em minúsculas)
      const lowercaseValues: Record<string, number> = {};
      Object.entries(numericValues).forEach(([key, value]) => {
        lowercaseValues[key.toLowerCase()] = value;
      });

      const result = await formulaService.testFormula({
        formula,
        testValues: lowercaseValues,
      });

      // A API retorna { success: true, data: { success, result, error } }
      // Precisamos acessar o objeto interno
      const actualResult = (result as any).data || result;

      setTestResult(actualResult);

      if (actualResult.success) {
        const resultValue = actualResult.result ?? 0;
        Toast.show({
          type: "success",
          text1: "Teste bem-sucedido",
          text2: `Resultado: ${resultValue.toFixed(2)}`,
        });
      } else {
        const errorMessage = actualResult.error || "Fórmula inválida";

        // Detecta erro de variáveis concatenadas
        if (errorMessage.includes("Variáveis não permitidas:")) {
          const match = errorMessage.match(
            /Variáveis não permitidas: ([a-z]+)/
          );
          if (match) {
            const invalidVar = match[1];
            Toast.show({
              type: "error",
              text1: "Erro na Fórmula",
              text2: `"${invalidVar}" não é válido. Esqueceu operador entre variáveis? Use *, +, -, / ou ^`,
              visibilityTime: 6000,
            });
          } else {
            Toast.show({
              type: "error",
              text1: "Erro no teste",
              text2:
                errorMessage.length > 80
                  ? errorMessage.substring(0, 80) + "..."
                  : errorMessage,
              visibilityTime: 5000,
            });
          }
        } else {
          Toast.show({
            type: "error",
            text1: "Erro no teste",
            text2: errorMessage,
            visibilityTime: 4000,
          });
        }
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message || "Não foi possível testar a fórmula",
      });
    } finally {
      setTesting(false);
    }
  };

  const onSubmit = async (formData: FormulaFormData) => {
    // Validação adicional de variáveis
    if (selectedVariables.length === 0) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Selecione pelo menos uma variável",
      });
      return;
    }

    setSaving(true);
    try {
      const data: CreateFormulaDto | UpdateFormulaDto = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        formula: formData.formula.trim(),
        outputType,
        outputUnit: outputUnit.trim() || undefined,
        variables: selectedVariables,
        category: category.trim() || undefined,
        reference: reference.trim() || undefined,
        isPublic,
        isActive: true,
      };

      if (isEditing && route.params?.formulaId) {
        await formulaService.update(route.params.formulaId, data);
        Toast.show({
          type: "success",
          text1: "Sucesso",
          text2: "Fórmula atualizada com sucesso",
        });
        // Ao editar, volta para a tela de detalhes
        navigation.navigate("FormulaDetails", {
          formulaId: route.params.formulaId,
        });
      } else {
        const response = await formulaService.create(data as CreateFormulaDto);
        const createdFormula = (response as any).data || response;
        Toast.show({
          type: "success",
          text1: "Sucesso",
          text2: "Fórmula criada com sucesso",
        });
        // Ao criar, navega para os detalhes da nova fórmula
        navigation.replace("FormulaDetails", { formulaId: createdFormula.id });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message || "Não foi possível salvar a fórmula",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleVariable = (variable: FormulaVariableType) => {
    setSelectedVariables((prev) =>
      prev.includes(variable)
        ? prev.filter((v) => v !== variable)
        : [...prev, variable]
    );
  };

  const handleSave = handleSubmit(onSubmit);

  if (loading) {
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
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={lightTheme.colors.background}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Nome */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Nome da Fórmula <Text style={styles.required}>*</Text>
            </Text>
            <Controller
              control={control}
              name="name"
              rules={{ required: "Digite um nome para a fórmula" }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="Ex: Protocolo de Pollock 7 Dobras"
                  value={value}
                  onChangeText={onChange}
                  placeholderTextColor={lightTheme.colors.gray[400]}
                />
              )}
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name.message}</Text>
            )}
          </View>

          {/* Descrição */}
          <View style={styles.section}>
            <Text style={styles.label}>Descrição</Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descreva o propósito e contexto desta fórmula..."
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor={lightTheme.colors.gray[400]}
                />
              )}
            />
          </View>

          {/* Categoria */}
          <View style={styles.section}>
            <Text style={styles.label}>Categoria</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowCategoryPicker(true)}
            >
              <Text
                style={[
                  styles.pickerText,
                  !category && styles.pickerPlaceholder,
                ]}
              >
                {category || "Selecione uma categoria"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={lightTheme.colors.gray[400]}
              />
            </TouchableOpacity>
          </View>

          {/* Bottom Sheet - Categoria */}
          <BottomSheetPicker
            visible={showCategoryPicker}
            onClose={() => setShowCategoryPicker(false)}
            title="Selecione uma Categoria"
            options={FormulaCategories.map((cat) => ({
              label: cat,
              value: cat,
            }))}
            selectedValue={category}
            onSelect={setCategory}
          />

          {/* Tipo de Resultado */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Tipo de Resultado <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowOutputPicker(true)}
            >
              <Text style={styles.pickerText}>
                {FormulaOutputTypeLabels[outputType]}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={lightTheme.colors.gray[400]}
              />
            </TouchableOpacity>
          </View>

          {/* Bottom Sheet - Tipo de Resultado */}
          <BottomSheetPicker
            visible={showOutputPicker}
            onClose={() => setShowOutputPicker(false)}
            title="Tipo de Resultado"
            options={Object.entries(FormulaOutputTypeLabels).map(
              ([key, label]) => ({
                label,
                value: key,
              })
            )}
            selectedValue={outputType}
            onSelect={(value) => setOutputType(value as FormulaOutputType)}
          />

          {/* Unidade */}
          <View style={styles.section}>
            <Text style={styles.label}>Unidade de Medida</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: %, kg, kcal/dia, g/cm³"
              value={outputUnit}
              onChangeText={setOutputUnit}
              placeholderTextColor={lightTheme.colors.gray[400]}
            />
          </View>

          {/* Variáveis */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>
                Variáveis Usadas <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity onPress={() => setShowVariablesPicker(true)}>
                <Text style={styles.linkText}>Selecionar</Text>
              </TouchableOpacity>
            </View>

            {selectedVariables.length > 0 && (
              <View style={styles.selectedVariables}>
                {selectedVariables.map((variable) => (
                  <TouchableOpacity
                    key={variable}
                    style={styles.variableChip}
                    onPress={() => {
                      const newFormula = formula + variable.toLowerCase();
                      setFormula(newFormula);
                      setFormValue("formula", newFormula);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="add-circle"
                      size={14}
                      color={lightTheme.colors.white}
                    />
                    <Text style={styles.variableChipText}>
                      {FormulaVariableTypeLabels[variable]}
                    </Text>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleVariable(variable);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color={lightTheme.colors.white}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Bottom Sheet - Variáveis */}
          <BottomSheetPicker
            visible={showVariablesPicker}
            onClose={() => setShowVariablesPicker(false)}
            title="Selecione as Variáveis"
            options={Object.entries(FormulaVariableTypeLabels).map(
              ([key, label]) => ({
                label,
                value: key,
              })
            )}
            selectedValues={selectedVariables}
            onSelect={(value) => toggleVariable(value as FormulaVariableType)}
            multiSelect
          />

          {/* Modal de Operadores Matemáticos */}
          <Modal
            visible={showOperatorsModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowOperatorsModal(false)}
          >
            <View style={styles.modalOverlay}>
              <TouchableOpacity
                style={styles.modalBackdrop}
                activeOpacity={1}
                onPress={() => setShowOperatorsModal(false)}
              />
              <View style={styles.operatorsModal}>
                <View style={styles.operatorsModalHeader}>
                  <Text style={styles.operatorsModalTitle}>
                    Operadores Matemáticos
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowOperatorsModal(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={lightTheme.colors.gray[600]}
                    />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.operatorsModalContent}
                  contentContainerStyle={styles.operatorsModalContentContainer}
                  showsVerticalScrollIndicator={true}
                >
                  {[
                    {
                      operator: "+",
                      name: "Adição",
                      description: "Soma dois valores",
                      example: "weight + 10",
                      result: "Se weight = 70, resultado = 80",
                    },
                    {
                      operator: "-",
                      name: "Subtração",
                      description: "Subtrai o segundo valor do primeiro",
                      example: "weight - 5",
                      result: "Se weight = 70, resultado = 65",
                    },
                    {
                      operator: "*",
                      name: "Multiplicação",
                      description: "Multiplica dois valores",
                      example: "weight * age",
                      result: "Se weight = 70 e age = 25, resultado = 1750",
                    },
                    {
                      operator: "/",
                      name: "Divisão",
                      description: "Divide o primeiro valor pelo segundo",
                      example: "weight / height",
                      result: "Se weight = 70 e height = 1.75, resultado ≈ 40",
                    },
                    {
                      operator: "^",
                      name: "Potência",
                      description:
                        "Eleva o primeiro valor à potência do segundo",
                      example: "height^2",
                      result: "Se height = 1.75, resultado ≈ 3.06",
                    },
                    {
                      operator: "sqrt()",
                      name: "Raiz Quadrada",
                      description: "Calcula a raiz quadrada de um valor",
                      example: "sqrt(weight)",
                      result: "Se weight = 64, resultado = 8",
                    },
                    {
                      operator: "abs()",
                      name: "Valor Absoluto",
                      description: "Retorna o valor absoluto (sempre positivo)",
                      example: "abs(weight - 80)",
                      result: "Se weight = 70, resultado = 10",
                    },
                    {
                      operator: "round()",
                      name: "Arredondamento",
                      description: "Arredonda para o inteiro mais próximo",
                      example: "round(weight / 3)",
                      result: "Se weight = 70, resultado = 23",
                    },
                    {
                      operator: "ceil()",
                      name: "Arredondar para Cima",
                      description: "Arredonda sempre para cima",
                      example: "ceil(weight / 3)",
                      result: "Se weight = 70, resultado = 24",
                    },
                    {
                      operator: "floor()",
                      name: "Arredondar para Baixo",
                      description: "Arredonda sempre para baixo",
                      example: "floor(weight / 3)",
                      result: "Se weight = 70, resultado = 23",
                    },
                    {
                      operator: "max()",
                      name: "Valor Máximo",
                      description: "Retorna o maior valor entre os argumentos",
                      example: "max(weight, 60)",
                      result: "Se weight = 70, resultado = 70",
                    },
                    {
                      operator: "min()",
                      name: "Valor Mínimo",
                      description: "Retorna o menor valor entre os argumentos",
                      example: "min(weight, 80)",
                      result: "Se weight = 70, resultado = 70",
                    },
                    {
                      operator: "log()",
                      name: "Logaritmo Natural",
                      description: "Calcula o logaritmo natural (base e)",
                      example: "log(weight)",
                      result: "Se weight = 70, resultado ≈ 4.248",
                    },
                    {
                      operator: "log10()",
                      name: "Logaritmo Base 10",
                      description: "Calcula o logaritmo na base 10",
                      example: "log10(weight)",
                      result: "Se weight = 100, resultado = 2",
                    },
                    {
                      operator: "exp()",
                      name: "Exponencial",
                      description: "Calcula e elevado ao valor (e^x)",
                      example: "exp(2)",
                      result: "resultado ≈ 7.389",
                    },
                    {
                      operator: "( )",
                      name: "Agrupamento",
                      description:
                        "Define a ordem de precedência nas operações",
                      example: "(weight + 10) * 2",
                      result: "Se weight = 70, resultado = 160",
                    },
                  ].map((op, index) => (
                    <View key={index} style={styles.operatorCard}>
                      <View style={styles.operatorHeader}>
                        <View style={styles.operatorBadge}>
                          <Text style={styles.operatorSymbol}>
                            {op.operator}
                          </Text>
                        </View>
                        <Text style={styles.operatorName}>{op.name}</Text>
                      </View>
                      <Text style={styles.operatorDescription}>
                        {op.description}
                      </Text>
                      <View style={styles.operatorExample}>
                        <Text style={styles.exampleLabel}>Exemplo:</Text>
                        <Text style={styles.exampleCode}>{op.example}</Text>
                      </View>
                      <Text style={styles.exampleResult}>{op.result}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Fórmula */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>
                Fórmula Matemática <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                onPress={() => setShowOperatorsModal(true)}
                style={styles.helpButton}
              >
                <Ionicons
                  name="help-circle-outline"
                  size={22}
                  color={lightTheme.colors.primary}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              Clique nas tags azuis acima para adicionar variáveis (em
              minúsculas) na fórmula.
            </Text>
            <Controller
              control={control}
              name="formula"
              rules={{ required: "Digite a fórmula matemática" }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    styles.formulaInput,
                    errors.formula && styles.inputError,
                  ]}
                  placeholder="Digite a fórmula..."
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    setFormula(text);
                  }}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor={lightTheme.colors.gray[400]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            />
            {errors.formula && (
              <Text style={styles.errorText}>{errors.formula.message}</Text>
            )}
          </View>

          {/* Teste da Fórmula */}
          <View style={styles.section}>
            <Text style={styles.label}>Valores das Variáveis da Fórmula</Text>
            <Text style={styles.helperText}>
              Preencha valores de teste para validar a fórmula
            </Text>

            {selectedVariables.map((variable) => (
              <View key={variable} style={styles.testValueRow}>
                <Text style={styles.testValueLabel}>
                  {FormulaVariableTypeLabels[variable]}:
                </Text>
                <TextInput
                  style={styles.testValueInput}
                  placeholder="0"
                  value={testValues[variable] || ""}
                  onChangeText={(text) =>
                    setTestValues((prev) => ({ ...prev, [variable]: text }))
                  }
                  keyboardType="numeric"
                  placeholderTextColor={lightTheme.colors.gray[400]}
                />
              </View>
            ))}

            <TouchableOpacity
              onPress={handleTest}
              disabled={testing || !formula.trim()}
              style={[styles.testButton, styles.testButtonFull]}
              activeOpacity={0.8}
            >
              {testing ? (
                <ActivityIndicator
                  size="small"
                  color={lightTheme.colors.white}
                />
              ) : (
                <>
                  <Ionicons
                    name="play"
                    size={18}
                    color={lightTheme.colors.white}
                  />
                  <Text style={styles.testButtonText}>Testar Fórmula</Text>
                </>
              )}
            </TouchableOpacity>

            {testResult && (
              <View
                style={[
                  styles.testResult,
                  testResult.success
                    ? styles.testResultSuccess
                    : styles.testResultError,
                ]}
              >
                {testResult.success ? (
                  <>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={lightTheme.colors.success}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.testResultSuccessText}>
                        Resultado:{" "}
                        {testResult.result !== undefined &&
                        testResult.result !== null
                          ? testResult.result.toFixed(2)
                          : "0.00"}{" "}
                        {outputUnit || ""}
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={lightTheme.colors.error}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.testResultErrorText}>
                        {testResult.error || "Erro desconhecido"}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>

          {/* Referência */}
          <View style={styles.section}>
            <Text style={styles.label}>Referência Bibliográfica</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Pollock ML, et al. (1980)"
              value={reference}
              onChangeText={setReference}
              placeholderTextColor={lightTheme.colors.gray[400]}
            />
          </View>

          {/* Opções */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsPublic(!isPublic)}
            >
              <View
                style={[styles.checkbox, isPublic && styles.checkboxChecked]}
              >
                {isPublic && (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={lightTheme.colors.white}
                  />
                )}
              </View>
              <View style={styles.checkboxContent}>
                <Text style={styles.checkboxLabel}>Fórmula Pública</Text>
                <Text style={styles.checkboxHelper}>
                  Permitir que outros nutricionistas vejam e usem esta fórmula
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Botão Salvar */}
          <TouchableOpacity
            style={[
              styles.saveButtonBottom,
              saving && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <>
                <ActivityIndicator
                  size="small"
                  color={lightTheme.colors.white}
                />
                <Text style={styles.saveButtonText}>Salvando...</Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={lightTheme.colors.white}
                />
                <Text style={styles.saveButtonText}>
                  {isEditing ? "Atualizar Fórmula" : "Criar Fórmula"}
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,

    color: lightTheme.colors.text,
    marginBottom: 8,
  },
  required: {
    color: lightTheme.colors.error,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  linkText: {
    fontSize: 14,

    color: lightTheme.colors.primary,
  },
  helperText: {
    fontSize: 12,

    color: lightTheme.colors.gray[500],
    marginBottom: 8,
  },
  input: {
    backgroundColor: lightTheme.colors.white,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,

    color: lightTheme.colors.text,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  formulaInput: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 14,
  },
  picker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: lightTheme.colors.white,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerText: {
    fontSize: 16,

    color: lightTheme.colors.text,
  },
  pickerPlaceholder: {
    color: lightTheme.colors.gray[400],
  },
  selectedVariables: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  variableChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  variableChipText: {
    fontSize: 13,

    color: lightTheme.colors.white,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  testButtonFull: {
    width: "100%",
    justifyContent: "center",
    paddingVertical: 14,
    marginTop: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  testButtonText: {
    fontSize: 14,

    color: lightTheme.colors.white,
  },
  testValueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  testValueLabel: {
    flex: 1,
    fontSize: 14,

    color: lightTheme.colors.text,
  },
  testValueInput: {
    width: 100,
    backgroundColor: lightTheme.colors.white,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,

    color: lightTheme.colors.text,
    textAlign: "right",
  },
  testResult: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  testResultSuccess: {
    backgroundColor: `${lightTheme.colors.success}15`,
  },
  testResultError: {
    backgroundColor: `${lightTheme.colors.error}15`,
  },
  testResultSuccessText: {
    flex: 1,
    fontSize: 14,

    color: lightTheme.colors.success,
  },
  testResultErrorText: {
    flex: 1,
    fontSize: 14,

    color: lightTheme.colors.error,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: lightTheme.colors.gray[300],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: lightTheme.colors.primary,
    borderColor: lightTheme.colors.primary,
  },
  checkboxContent: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,

    color: lightTheme.colors.text,
    marginBottom: 4,
  },
  checkboxHelper: {
    fontSize: 13,

    color: lightTheme.colors.gray[600],
  },
  saveButtonBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: lightTheme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.white,
  },
  inputError: {
    borderColor: lightTheme.colors.error,
    borderWidth: 2,
  },
  errorText: {
    color: lightTheme.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  helpButton: {
    padding: 4,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  operatorsModal: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: 16,
    width: "100%",
    maxWidth: 500,
    height: "80%",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  operatorsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  operatorsModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: lightTheme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  operatorsModalContent: {
    flex: 1,
  },
  operatorsModalContentContainer: {
    padding: 20,
  },
  operatorCard: {
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
  },
  operatorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  operatorBadge: {
    backgroundColor: lightTheme.colors.primary,
    minWidth: 52,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  operatorSymbol: {
    fontSize: 14,
    fontWeight: "700",
    color: lightTheme.colors.white,
  },
  operatorName: {
    fontSize: 18,
    fontWeight: "600",
    color: lightTheme.colors.text,
  },
  operatorDescription: {
    fontSize: 14,
    color: lightTheme.colors.gray[600],
    marginBottom: 12,
    lineHeight: 20,
  },
  operatorExample: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: lightTheme.colors.gray[500],
    marginBottom: 4,
    textTransform: "uppercase",
  },
  exampleCode: {
    fontSize: 16,
    fontWeight: "500",
    color: lightTheme.colors.primary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  exampleResult: {
    fontSize: 13,
    color: lightTheme.colors.gray[600],
    fontStyle: "italic",
  },
});
