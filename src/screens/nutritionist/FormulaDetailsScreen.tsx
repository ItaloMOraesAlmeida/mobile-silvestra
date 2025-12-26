import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { lightTheme } from "../../theme";
import { formulaService } from "../../services";
import type { CustomFormula } from "../../types/formula.types";
import {
  FormulaVariableTypeLabels,
  FormulaOutputTypeLabels,
} from "../../types/formula.types";

interface FormulaDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      formulaId: string;
    };
  };
}

export default function FormulaDetailsScreen({
  navigation,
  route,
}: FormulaDetailsScreenProps) {
  const { formulaId } = route.params;

  const [formula, setFormula] = useState<CustomFormula | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFormula, setShowFormula] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadFormula();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formulaId])
  );

  const loadFormula = async () => {
    try {
      const response = await formulaService.getById(formulaId);
      // Unwrap the API response wrapper
      const data = (response as any).data || response;
      setFormula(data);
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

  const handleDelete = () => {
    if (formula?.isPublic) {
      Toast.show({
        type: "info",
        text1: "Fórmula Pública",
        text2: "Fórmulas públicas não podem ser excluídas",
      });
      return;
    }

    Alert.alert(
      "Excluir Fórmula",
      `Tem certeza que deseja excluir "${formula?.name}"?\n\nTodos os resultados calculados também serão excluídos.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await formulaService.delete(formulaId);
              Toast.show({
                type: "success",
                text1: "Sucesso",
                text2: "Fórmula excluída com sucesso",
              });
              navigation.goBack();
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "Erro",
                text2: error.message || "Não foi possível excluir a fórmula",
              });
            }
          },
        },
      ]
    );
  };

  const handleClone = async () => {
    if (!formula?.isPublic) {
      Toast.show({
        type: "info",
        text1: "Fórmula Privada",
        text2: "Apenas fórmulas públicas podem ser clonadas",
      });
      return;
    }

    try {
      await formulaService.clonePublicFormula(formulaId);
      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: "Fórmula clonada com sucesso",
      });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message || "Não foi possível clonar a fórmula",
      });
    }
  };

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

  if (loading || !formula) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={lightTheme.colors.background}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={lightTheme.colors.primary} />
          <Text style={styles.loadingText}>Carregando fórmula...</Text>
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Título e Badge */}
        <View style={styles.titleRow}>
          <View style={styles.titleContent}>
            <Text style={styles.formulaName}>{formula.name}</Text>
            {formula.isPublic && (
              <View style={styles.publicBadge}>
                <Ionicons
                  name="globe"
                  size={14}
                  color={lightTheme.colors.primary}
                />
                <Text style={styles.publicBadgeText}>Pública</Text>
              </View>
            )}
          </View>
        </View>

        {/* Descrição */}
        {formula.description && (
          <Text style={styles.description}>{formula.description}</Text>
        )}

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          {formula.outputType && (
            <View style={styles.infoCard}>
              <Ionicons
                name="flag-outline"
                size={20}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.infoLabel}>Tipo</Text>
              <Text style={styles.infoValue}>
                {FormulaOutputTypeLabels[formula.outputType]}
              </Text>
            </View>
          )}

          {formula.outputUnit && (
            <View style={styles.infoCard}>
              <Ionicons
                name="analytics-outline"
                size={20}
                color={lightTheme.colors.success}
              />
              <Text style={styles.infoLabel}>Unidade</Text>
              <Text style={styles.infoValue}>{formula.outputUnit}</Text>
            </View>
          )}

          <View style={styles.infoCard}>
            <Ionicons
              name="play-circle-outline"
              size={20}
              color={lightTheme.colors.warning}
            />
            <Text style={styles.infoLabel}>Usos</Text>
            <Text style={styles.infoValue}>{formula.usageCount || 0}</Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons
              name="bar-chart-outline"
              size={20}
              color={lightTheme.colors.info}
            />
            <Text style={styles.infoLabel}>Resultados</Text>
            <Text style={styles.infoValue}>{formula._count?.results || 0}</Text>
          </View>
        </View>

        {/* Categoria */}
        {formula.category && (
          <View style={styles.categorySection}>
            <Text style={styles.sectionLabel}>Categoria</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{formula.category}</Text>
            </View>
          </View>
        )}

        {/* Variáveis */}
        <View style={styles.variablesSection}>
          <Text style={styles.sectionLabel}>
            Variáveis Utilizadas ({formula.variables?.length || 0})
          </Text>
          <View style={styles.variablesGrid}>
            {formula.variables && formula.variables.length > 0 ? (
              formula.variables.map((variable) => (
                <View key={variable} style={styles.variableChip}>
                  <Ionicons
                    name="code-outline"
                    size={14}
                    color={lightTheme.colors.primary}
                  />
                  <Text style={styles.variableChipText}>
                    {FormulaVariableTypeLabels[variable]}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Nenhuma variável</Text>
            )}
          </View>
        </View>

        {/* Fórmula */}
        <View style={styles.formulaSection}>
          <TouchableOpacity
            style={styles.formulaSectionHeader}
            onPress={() => {
              setShowFormula(!showFormula);
            }}
          >
            <Text style={styles.sectionLabel}>Fórmula Matemática</Text>
            <Ionicons
              name={showFormula ? "chevron-up" : "chevron-down"}
              size={20}
              color={lightTheme.colors.gray[600]}
            />
          </TouchableOpacity>

          {showFormula && (
            <View style={styles.formulaBox}>
              <Text style={styles.formulaText}>
                {formula.formula || "Fórmula não encontrada"}
              </Text>
            </View>
          )}
        </View>

        {/* Referência */}
        {formula.reference && (
          <View style={styles.referenceSection}>
            <Text style={styles.sectionLabel}>Referência</Text>
            <Text style={styles.referenceText}>{formula.reference}</Text>
          </View>
        )}

        {/* Datas */}
        {formula.createdAt && (
          <View style={styles.datesSection}>
            <View style={styles.dateRow}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={lightTheme.colors.gray[500]}
              />
              <Text style={styles.dateText}>
                Criada em{" "}
                {format(new Date(formula.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </Text>
            </View>
            {formula.updatedAt && formula.updatedAt !== formula.createdAt && (
              <View style={styles.dateRow}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={lightTheme.colors.gray[500]}
                />
                <Text style={styles.dateText}>
                  Atualizada em{" "}
                  {format(
                    new Date(formula.updatedAt),
                    "dd/MM/yyyy 'às' HH:mm",
                    {
                      locale: ptBR,
                    }
                  )}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Ações */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate("CalculateFormula", { formulaId: formula.id })
            }
          >
            <View style={styles.actionButtonContent}>
              <Ionicons
                name="calculator"
                size={24}
                color={lightTheme.colors.white}
              />
              <Text style={styles.actionButtonText}>
                Calcular para Paciente
              </Text>
            </View>
          </TouchableOpacity>

          {formula.isPublic ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={handleClone}
            >
              <View style={styles.actionButtonContent}>
                <Ionicons
                  name="copy-outline"
                  size={24}
                  color={lightTheme.colors.primary}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    styles.actionButtonTextSecondary,
                  ]}
                >
                  Clonar Fórmula
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSecondary]}
                onPress={() =>
                  navigation.navigate("FormulaEditor", {
                    formulaId: formula.id,
                  })
                }
              >
                <View style={styles.actionButtonContent}>
                  <Ionicons
                    name="create-outline"
                    size={24}
                    color={lightTheme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.actionButtonText,
                      styles.actionButtonTextSecondary,
                    ]}
                  >
                    Editar Fórmula
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonDanger]}
                onPress={handleDelete}
              >
                <View style={styles.actionButtonContent}>
                  <Ionicons
                    name="trash-outline"
                    size={24}
                    color={lightTheme.colors.error}
                  />
                  <Text
                    style={[
                      styles.actionButtonText,
                      styles.actionButtonTextDanger,
                    ]}
                  >
                    Excluir Fórmula
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Espaçamento inferior */}
        <View style={{ height: 40 }} />
      </ScrollView>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,

    color: lightTheme.colors.text,
    textAlign: "center",
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  titleRow: {
    marginBottom: 12,
  },
  titleContent: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  formulaName: {
    fontSize: 22,

    color: lightTheme.colors.text,
    flex: 1,
  },
  publicBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${lightTheme.colors.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  publicBadgeText: {
    fontSize: 12,

    color: lightTheme.colors.primary,
  },
  description: {
    fontSize: 15,

    color: lightTheme.colors.gray[700],
    lineHeight: 22,
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,

    color: lightTheme.colors.gray[600],
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: lightTheme.colors.text,
    textAlign: "center",
  },
  categorySection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,

    color: lightTheme.colors.text,
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: lightTheme.colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 14,

    color: lightTheme.colors.gray[700],
  },
  variablesSection: {
    marginBottom: 20,
  },
  variablesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  variableChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${lightTheme.colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  variableChipText: {
    fontSize: 13,

    color: lightTheme.colors.primary,
  },
  formulaSection: {
    marginBottom: 20,
  },
  formulaSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  formulaBox: {
    marginTop: 12,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    borderRadius: 12,
    padding: 16,
  },
  formulaText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 15,
    fontWeight: "600",
    color: lightTheme.colors.gray[900],
    lineHeight: 22,
  },
  referenceSection: {
    marginBottom: 20,
  },
  referenceText: {
    fontSize: 14,

    color: lightTheme.colors.gray[700],
    fontStyle: "italic",
  },
  datesSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[200],
    gap: 8,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    fontSize: 13,

    color: lightTheme.colors.gray[600],
  },
  actionsSection: {
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    backgroundColor: lightTheme.colors.primary,
    borderRadius: 8,
    padding: 14,
  },
  actionButtonSecondary: {
    backgroundColor: lightTheme.colors.gray[50],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
  },
  actionButtonDanger: {
    backgroundColor: lightTheme.colors.gray[50],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
  },
  actionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: lightTheme.colors.white,
  },
  actionButtonTextSecondary: {
    color: lightTheme.colors.text,
  },
  actionButtonTextDanger: {
    color: lightTheme.colors.error,
  },
  emptyText: {
    fontSize: 14,
    color: lightTheme.colors.gray[500],
    fontStyle: "italic",
  },
});
