import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { MainDrawerParamList } from "../../navigation/MainDrawerNavigator";
import { lightTheme } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import {
  useBodyMeasurements,
  BodyMeasurement,
} from "../../hooks/useBodyMeasurements";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type PatientAssessmentDetailsScreenRouteProp = RouteProp<
  MainDrawerParamList,
  "PatientAssessmentDetails"
>;
type NavigationProp = DrawerNavigationProp<MainDrawerParamList>;

export const PatientAssessmentDetailsScreen: React.FC = () => {
  const route = useRoute<PatientAssessmentDetailsScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const patientId = route?.params?.patientId;
  const measurementId = route?.params?.measurementId;

  const { getMeasurementById, deleteMeasurement, listMeasurements } =
    useBodyMeasurements();

  const [loading, setLoading] = useState(true);
  const [measurement, setMeasurement] = useState<BodyMeasurement | null>(null);
  const [previousMeasurement, setPreviousMeasurement] =
    useState<BodyMeasurement | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadMeasurementData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measurementId]);

  const loadMeasurementData = async () => {
    try {
      setLoading(true);

      // Buscar medição atual
      const measurementData = await getMeasurementById(
        patientId,
        measurementId
      );
      setMeasurement(measurementData);

      // Buscar todas as medições para encontrar a anterior
      const allMeasurements = await listMeasurements(patientId, {
        sortOrder: "desc",
        limit: 50,
      });

      // Encontrar a medição anterior (mais recente antes da atual)
      if (allMeasurements && measurementData) {
        const currentDate = new Date(measurementData.createdAt);
        const previous = allMeasurements.measurements.find(
          (m: BodyMeasurement) => {
            const mDate = new Date(m.createdAt);
            return mDate < currentDate && m.id !== measurementId;
          }
        );

        if (previous) {
          setPreviousMeasurement(previous);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar avaliação:", error);
      Alert.alert(
        "Erro",
        "Não foi possível carregar os dados da avaliação. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteMeasurement(patientId, measurementId);
      setDeleteModalVisible(false);
      Alert.alert("Sucesso", "Avaliação excluída com sucesso!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Erro ao excluir avaliação:", error);
      Alert.alert(
        "Erro",
        "Não foi possível excluir a avaliação. Tente novamente."
      );
      setDeleting(false);
    }
  };

  const calculateDifference = (
    current: number | undefined,
    previous: number | undefined
  ): string | null => {
    if (!current || !previous) return null;
    const diff = current - previous;
    const sign = diff > 0 ? "+" : "";
    return `${sign}${diff.toFixed(2)}`;
  };

  const getBMIClassification = (bmi: number | undefined): string => {
    if (!bmi) return "Não calculado";
    if (bmi < 18.5) return "Abaixo do peso";
    if (bmi < 25) return "Peso normal";
    if (bmi < 30) return "Sobrepeso";
    if (bmi < 35) return "Obesidade Grau I";
    if (bmi < 40) return "Obesidade Grau II";
    return "Obesidade Grau III";
  };

  // ==================== FUNÇÕES DE CÁLCULO ADICIONAIS ====================

  // RCQ (Relação Cintura-Quadril)
  const calculateRCQ = (waist?: number, hip?: number): number | null => {
    if (!waist || !hip) return null;
    return waist / hip;
  };

  const getRCQRisk = (rcq: number, isMale: boolean = true): string => {
    if (isMale) {
      if (rcq < 0.95) return "Baixo risco";
      if (rcq <= 1.0) return "Risco moderado";
      return "Risco alto";
    } else {
      if (rcq < 0.8) return "Baixo risco";
      if (rcq <= 0.85) return "Risco moderado";
      return "Risco alto";
    }
  };

  // RCE (Relação Cintura-Estatura)
  const calculateRCE = (waist?: number, height?: number): number | null => {
    if (!waist || !height) return null;
    return waist / height;
  };

  const getRCERisk = (rce: number): string => {
    if (rce < 0.5) return "Baixo risco";
    if (rce <= 0.6) return "Risco aumentado";
    return "Risco muito alto";
  };

  // TMB (Taxa Metabólica Basal) - Fórmula de Mifflin-St Jeor
  const calculateTMB = (
    weight?: number,
    height?: number,
    age: number = 30, // Idade padrão se não disponível
    isMale: boolean = true
  ): number | null => {
    if (!weight || !height) return null;
    const base = 10 * weight + 6.25 * height - 5 * age;
    return isMale ? base + 5 : base - 161;
  };

  // Análise de Simetria
  const calculateSymmetry = (right?: number, left?: number): number | null => {
    if (!right || !left) return null;
    const maior = Math.max(right, left);
    const menor = Math.min(right, left);
    return ((maior - menor) / maior) * 100;
  };

  // Área Muscular do Braço (AMB)
  const calculateAMB = (
    armCirc?: number,
    tricepsFold?: number
  ): number | null => {
    if (!armCirc || !tricepsFold) return null;
    const tricepsInCm = tricepsFold / 10;
    const cb = armCirc - 3.1416 * tricepsInCm;
    return (cb * cb) / (4 * 3.1416);
  };

  // ==================== FIM DAS FUNÇÕES DE CÁLCULO ====================

  const renderMetricCard = (
    label: string,
    value: number | undefined,
    unit: string,
    previousValue?: number | undefined
  ) => {
    const difference =
      previousValue !== undefined
        ? calculateDifference(value, previousValue)
        : null;

    return (
      <View style={styles.metricCard}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>
          {value !== undefined
            ? `${value.toFixed(2)} ${unit}`
            : "Não informado"}
        </Text>
        {difference && (
          <View style={styles.differenceContainer}>
            <Ionicons
              name={
                parseFloat(difference) > 0 ? "trending-up" : "trending-down"
              }
              size={16}
              color={
                parseFloat(difference) > 0
                  ? lightTheme.colors.error
                  : lightTheme.colors.success
              }
            />
            <Text
              style={[
                styles.differenceText,
                {
                  color:
                    parseFloat(difference) > 0
                      ? lightTheme.colors.error
                      : lightTheme.colors.success,
                },
              ]}
            >
              {difference} {unit}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderSection = (
    title: string,
    icon: string,
    children: React.ReactNode
  ) => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons
            name={icon as any}
            size={24}
            color={lightTheme.colors.primary}
          />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={styles.sectionContent}>{children}</View>
      </View>
    );
  };

  // Validação de parâmetros
  if (!patientId || !measurementId) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={lightTheme.colors.error}
        />
        <Text style={styles.errorText}>
          Parâmetros inválidos. Por favor, retorne e tente novamente.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={lightTheme.colors.primary} />
        <Text style={styles.loadingText}>Carregando avaliação...</Text>
      </SafeAreaView>
    );
  }

  if (!measurement) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={lightTheme.colors.error}
        />
        <Text style={styles.errorText}>Avaliação não encontrada</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView style={styles.scrollView}>
        {/* Header com data */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Ionicons
              name="clipboard-outline"
              size={40}
              color={lightTheme.colors.primary}
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerDate}>
              {format(
                new Date(measurement.createdAt),
                "dd 'de' MMMM 'de' yyyy",
                {
                  locale: ptBR,
                }
              )}
            </Text>
            <Text style={styles.headerTime}>
              {format(new Date(measurement.createdAt), "HH:mm", {
                locale: ptBR,
              })}
            </Text>
          </View>
        </View>

        {/* Card de Protocolo e Composição Corporal */}
        {measurement.protocol && (
          <View style={styles.protocolCard}>
            <View style={styles.protocolHeader}>
              <View style={styles.protocolBadge}>
                <Ionicons
                  name="analytics"
                  size={18}
                  color={lightTheme.colors.primary}
                />
                <Text style={styles.protocolTitle}>
                  {(() => {
                    const protocolMap: Record<string, string> = {
                      POLLOCK_7: "Pollock 7 Dobras",
                      POLLOCK_3_MALE: "Pollock 3 Dobras (Masculino)",
                      POLLOCK_3_FEMALE: "Pollock 3 Dobras (Feminino)",
                      GUEDES_3: "Guedes 3 Dobras",
                      FAULKNER_4: "Faulkner 4 Dobras",
                    };
                    return (
                      protocolMap[measurement.protocol!] || measurement.protocol
                    );
                  })()}
                </Text>
              </View>
              <Text style={styles.protocolSubtitle}>
                Protocolo de Composição Corporal
              </Text>
            </View>

            {/* Métricas de Composição */}
            {(measurement.bodyFatPercent ||
              measurement.muscleMass ||
              measurement.fatMass) && (
              <View style={styles.compositionMetrics}>
                {measurement.bodyFatPercent && (
                  <View style={styles.compositionMetric}>
                    <View
                      style={[
                        styles.compositionIcon,
                        { backgroundColor: lightTheme.colors.warning + "20" },
                      ]}
                    >
                      <Ionicons
                        name="water"
                        size={24}
                        color={lightTheme.colors.warning}
                      />
                    </View>
                    <Text style={styles.compositionValue}>
                      {measurement.bodyFatPercent.toFixed(1)}%
                    </Text>
                    <Text style={styles.compositionLabel}>% Gordura</Text>
                    {previousMeasurement?.bodyFatPercent && (
                      <View style={styles.compositionChange}>
                        {(() => {
                          const diff =
                            measurement.bodyFatPercent -
                            previousMeasurement.bodyFatPercent;
                          const isImprovement = diff < 0;
                          return (
                            <>
                              <Ionicons
                                name={
                                  isImprovement
                                    ? "trending-down"
                                    : "trending-up"
                                }
                                size={14}
                                color={
                                  isImprovement
                                    ? lightTheme.colors.success
                                    : lightTheme.colors.error
                                }
                              />
                              <Text
                                style={[
                                  styles.compositionChangeText,
                                  {
                                    color: isImprovement
                                      ? lightTheme.colors.success
                                      : lightTheme.colors.error,
                                  },
                                ]}
                              >
                                {Math.abs(diff).toFixed(1)}%
                              </Text>
                            </>
                          );
                        })()}
                      </View>
                    )}
                  </View>
                )}

                {measurement.muscleMass && (
                  <View style={styles.compositionMetric}>
                    <View
                      style={[
                        styles.compositionIcon,
                        { backgroundColor: lightTheme.colors.success + "20" },
                      ]}
                    >
                      <Ionicons
                        name="barbell"
                        size={24}
                        color={lightTheme.colors.success}
                      />
                    </View>
                    <Text style={styles.compositionValue}>
                      {measurement.muscleMass.toFixed(1)} kg
                    </Text>
                    <Text style={styles.compositionLabel}>Massa Magra</Text>
                    {previousMeasurement?.muscleMass && (
                      <View style={styles.compositionChange}>
                        {(() => {
                          const diff =
                            measurement.muscleMass -
                            previousMeasurement.muscleMass;
                          const isImprovement = diff > 0;
                          return (
                            <>
                              <Ionicons
                                name={
                                  isImprovement
                                    ? "trending-up"
                                    : "trending-down"
                                }
                                size={14}
                                color={
                                  isImprovement
                                    ? lightTheme.colors.success
                                    : lightTheme.colors.error
                                }
                              />
                              <Text
                                style={[
                                  styles.compositionChangeText,
                                  {
                                    color: isImprovement
                                      ? lightTheme.colors.success
                                      : lightTheme.colors.error,
                                  },
                                ]}
                              >
                                {Math.abs(diff).toFixed(1)} kg
                              </Text>
                            </>
                          );
                        })()}
                      </View>
                    )}
                  </View>
                )}

                {measurement.fatMass && (
                  <View style={styles.compositionMetric}>
                    <View
                      style={[
                        styles.compositionIcon,
                        { backgroundColor: lightTheme.colors.error + "20" },
                      ]}
                    >
                      <Ionicons
                        name="nutrition"
                        size={24}
                        color={lightTheme.colors.error}
                      />
                    </View>
                    <Text style={styles.compositionValue}>
                      {measurement.fatMass.toFixed(1)} kg
                    </Text>
                    <Text style={styles.compositionLabel}>Massa Gorda</Text>
                    {previousMeasurement?.fatMass && (
                      <View style={styles.compositionChange}>
                        {(() => {
                          const diff =
                            measurement.fatMass - previousMeasurement.fatMass;
                          const isImprovement = diff < 0;
                          return (
                            <>
                              <Ionicons
                                name={
                                  isImprovement
                                    ? "trending-down"
                                    : "trending-up"
                                }
                                size={14}
                                color={
                                  isImprovement
                                    ? lightTheme.colors.success
                                    : lightTheme.colors.error
                                }
                              />
                              <Text
                                style={[
                                  styles.compositionChangeText,
                                  {
                                    color: isImprovement
                                      ? lightTheme.colors.success
                                      : lightTheme.colors.error,
                                  },
                                ]}
                              >
                                {Math.abs(diff).toFixed(1)} kg
                              </Text>
                            </>
                          );
                        })()}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Dados Básicos */}
        {renderSection(
          "Dados Básicos",
          "fitness-outline",
          <>
            <View style={styles.metricsRow}>
              {renderMetricCard(
                "Peso",
                measurement.weight,
                "kg",
                previousMeasurement?.weight
              )}
              {renderMetricCard(
                "Altura",
                measurement.height,
                "cm",
                previousMeasurement?.height
              )}
            </View>
            <View style={styles.metricsRow}>
              {renderMetricCard(
                "IMC",
                measurement.bmi,
                "kg/m²",
                previousMeasurement?.bmi
              )}
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Classificação</Text>
                <Text style={styles.metricValue}>
                  {getBMIClassification(measurement.bmi)}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Circunferências */}
        {(measurement.waistCirc ||
          measurement.hipCirc ||
          measurement.chestCirc ||
          measurement.abdomenCirc ||
          measurement.armCirc ||
          measurement.forearmCirc ||
          measurement.thighCirc ||
          measurement.calfCirc ||
          measurement.neckCirc ||
          measurement.shoulderCirc ||
          measurement.wristCirc) &&
          renderSection(
            "Circunferências",
            "resize-outline",
            <>
              {/* Linha 1: Cintura + Quadril */}
              <View style={styles.metricsRow}>
                {measurement.waistCirc &&
                  renderMetricCard(
                    "Cintura",
                    measurement.waistCirc,
                    "cm",
                    previousMeasurement?.waistCirc
                  )}
                {measurement.hipCirc &&
                  renderMetricCard(
                    "Quadril",
                    measurement.hipCirc,
                    "cm",
                    previousMeasurement?.hipCirc
                  )}
              </View>

              {/* Linha 2: Peitoral + Abdômen */}
              {(measurement.chestCirc || measurement.abdomenCirc) && (
                <View style={styles.metricsRow}>
                  {measurement.chestCirc &&
                    renderMetricCard(
                      "Peitoral",
                      measurement.chestCirc,
                      "cm",
                      previousMeasurement?.chestCirc
                    )}
                  {measurement.abdomenCirc &&
                    renderMetricCard(
                      "Abdômen",
                      measurement.abdomenCirc,
                      "cm",
                      previousMeasurement?.abdomenCirc
                    )}
                </View>
              )}

              {/* Linha 3: Braço + Antebraço */}
              {(measurement.armCirc || measurement.forearmCirc) && (
                <View style={styles.metricsRow}>
                  {measurement.armCirc &&
                    renderMetricCard(
                      "Braço",
                      measurement.armCirc,
                      "cm",
                      previousMeasurement?.armCirc
                    )}
                  {measurement.forearmCirc &&
                    renderMetricCard(
                      "Antebraço",
                      measurement.forearmCirc,
                      "cm",
                      previousMeasurement?.forearmCirc
                    )}
                </View>
              )}

              {/* Linha 4: Coxa + Panturrilha */}
              {(measurement.thighCirc || measurement.calfCirc) && (
                <View style={styles.metricsRow}>
                  {measurement.thighCirc &&
                    renderMetricCard(
                      "Coxa",
                      measurement.thighCirc,
                      "cm",
                      previousMeasurement?.thighCirc
                    )}
                  {measurement.calfCirc &&
                    renderMetricCard(
                      "Panturrilha",
                      measurement.calfCirc,
                      "cm",
                      previousMeasurement?.calfCirc
                    )}
                </View>
              )}

              {/* Linha 5: Pescoço + Ombro */}
              {(measurement.neckCirc || measurement.shoulderCirc) && (
                <View style={styles.metricsRow}>
                  {measurement.neckCirc &&
                    renderMetricCard(
                      "Pescoço",
                      measurement.neckCirc,
                      "cm",
                      previousMeasurement?.neckCirc
                    )}
                  {measurement.shoulderCirc &&
                    renderMetricCard(
                      "Ombro",
                      measurement.shoulderCirc,
                      "cm",
                      previousMeasurement?.shoulderCirc
                    )}
                </View>
              )}

              {/* Linha 6: Pulso (sozinho se necessário) */}
              {measurement.wristCirc && (
                <View style={styles.metricsRow}>
                  {renderMetricCard(
                    "Pulso",
                    measurement.wristCirc,
                    "cm",
                    previousMeasurement?.wristCirc
                  )}
                </View>
              )}
            </>
          )}

        {/* Dobras Cutâneas */}
        {(measurement.tricepsFold ||
          measurement.subscapularFold ||
          measurement.suprailiacFold ||
          measurement.abdominalFold ||
          measurement.thighFold) &&
          renderSection(
            "Dobras Cutâneas",
            "water-outline",
            <>
              {/* Linha 1: Tríceps + Subescapular */}
              <View style={styles.metricsRow}>
                {measurement.tricepsFold &&
                  renderMetricCard(
                    "Tríceps",
                    measurement.tricepsFold,
                    "mm",
                    previousMeasurement?.tricepsFold
                  )}
                {measurement.subscapularFold &&
                  renderMetricCard(
                    "Subescapular",
                    measurement.subscapularFold,
                    "mm",
                    previousMeasurement?.subscapularFold
                  )}
              </View>

              {/* Linha 2: Supra-ilíaca + Abdominal */}
              {(measurement.suprailiacFold || measurement.abdominalFold) && (
                <View style={styles.metricsRow}>
                  {measurement.suprailiacFold &&
                    renderMetricCard(
                      "Supra-ilíaca",
                      measurement.suprailiacFold,
                      "mm",
                      previousMeasurement?.suprailiacFold
                    )}
                  {measurement.abdominalFold &&
                    renderMetricCard(
                      "Abdominal",
                      measurement.abdominalFold,
                      "mm",
                      previousMeasurement?.abdominalFold
                    )}
                </View>
              )}

              {/* Linha 3: Coxa (sozinha se necessário) */}
              {measurement.thighFold && (
                <View style={styles.metricsRow}>
                  {renderMetricCard(
                    "Coxa",
                    measurement.thighFold,
                    "mm",
                    previousMeasurement?.thighFold
                  )}
                </View>
              )}
            </>
          )}

        {/* Circunferências Bilaterais */}
        {(measurement.armCircRelaxedRight ||
          measurement.armCircRelaxedLeft ||
          measurement.armCircContractedRight ||
          measurement.armCircContractedLeft ||
          measurement.thighCircRight ||
          measurement.thighCircLeft ||
          measurement.calfCircRight ||
          measurement.calfCircLeft) &&
          renderSection(
            "Circunferências Bilaterais",
            "swap-horizontal-outline",
            <>
              {(measurement.armCircRelaxedRight ||
                measurement.armCircRelaxedLeft) && (
                <View style={styles.metricsRow}>
                  {measurement.armCircRelaxedRight &&
                    renderMetricCard(
                      "Braço Relaxado (D)",
                      measurement.armCircRelaxedRight,
                      "cm",
                      previousMeasurement?.armCircRelaxedRight
                    )}
                  {measurement.armCircRelaxedLeft &&
                    renderMetricCard(
                      "Braço Relaxado (E)",
                      measurement.armCircRelaxedLeft,
                      "cm",
                      previousMeasurement?.armCircRelaxedLeft
                    )}
                </View>
              )}
              {(measurement.armCircContractedRight ||
                measurement.armCircContractedLeft) && (
                <View style={styles.metricsRow}>
                  {measurement.armCircContractedRight &&
                    renderMetricCard(
                      "Braço Contraído (D)",
                      measurement.armCircContractedRight,
                      "cm",
                      previousMeasurement?.armCircContractedRight
                    )}
                  {measurement.armCircContractedLeft &&
                    renderMetricCard(
                      "Braço Contraído (E)",
                      measurement.armCircContractedLeft,
                      "cm",
                      previousMeasurement?.armCircContractedLeft
                    )}
                </View>
              )}
              {(measurement.thighCircRight || measurement.thighCircLeft) && (
                <View style={styles.metricsRow}>
                  {measurement.thighCircRight &&
                    renderMetricCard(
                      "Coxa (D)",
                      measurement.thighCircRight,
                      "cm",
                      previousMeasurement?.thighCircRight
                    )}
                  {measurement.thighCircLeft &&
                    renderMetricCard(
                      "Coxa (E)",
                      measurement.thighCircLeft,
                      "cm",
                      previousMeasurement?.thighCircLeft
                    )}
                </View>
              )}
              {(measurement.calfCircRight || measurement.calfCircLeft) && (
                <View style={styles.metricsRow}>
                  {measurement.calfCircRight &&
                    renderMetricCard(
                      "Panturrilha (D)",
                      measurement.calfCircRight,
                      "cm",
                      previousMeasurement?.calfCircRight
                    )}
                  {measurement.calfCircLeft &&
                    renderMetricCard(
                      "Panturrilha (E)",
                      measurement.calfCircLeft,
                      "cm",
                      previousMeasurement?.calfCircLeft
                    )}
                </View>
              )}
            </>
          )}

        {/* Dobras Adicionais */}
        {(measurement.bicepsFold || measurement.calfMedialFold) &&
          renderSection(
            "Dobras Cutâneas Adicionais",
            "water",
            <>
              {/* Linha 1: Bíceps + Panturrilha Medial */}
              <View style={styles.metricsRow}>
                {measurement.bicepsFold &&
                  renderMetricCard(
                    "Bíceps",
                    measurement.bicepsFold,
                    "mm",
                    previousMeasurement?.bicepsFold
                  )}
                {measurement.calfMedialFold &&
                  renderMetricCard(
                    "Panturrilha Medial",
                    measurement.calfMedialFold,
                    "mm",
                    previousMeasurement?.calfMedialFold
                  )}
              </View>
            </>
          )}

        {/* Diâmetros Ósseos */}
        {(measurement.wristDiameter ||
          measurement.femurDiameter ||
          measurement.humerusDiameter) &&
          renderSection(
            "Diâmetros Ósseos",
            "resize",
            <>
              {/* Linha 1: Pulso + Fêmur */}
              <View style={styles.metricsRow}>
                {measurement.wristDiameter &&
                  renderMetricCard(
                    "Diâmetro do Punho",
                    measurement.wristDiameter,
                    "cm",
                    previousMeasurement?.wristDiameter
                  )}
                {measurement.femurDiameter &&
                  renderMetricCard(
                    "Fêmur",
                    measurement.femurDiameter,
                    "cm",
                    previousMeasurement?.femurDiameter
                  )}
              </View>

              {/* Linha 2: Úmero (sozinho se necessário) */}
              {measurement.humerusDiameter &&
                !measurement.wristDiameter &&
                !measurement.femurDiameter && (
                  <View style={styles.metricsRow}>
                    {renderMetricCard(
                      "Úmero",
                      measurement.humerusDiameter,
                      "cm",
                      previousMeasurement?.humerusDiameter
                    )}
                  </View>
                )}
            </>
          )}

        {/* Composição Corporal */}
        {(measurement.bodyFatPercent ||
          measurement.muscleMass ||
          measurement.fatMass) &&
          renderSection(
            "Composição Corporal",
            "analytics-outline",
            <>
              <View style={styles.metricsRow}>
                {measurement.bodyFatPercent &&
                  renderMetricCard(
                    "% Gordura",
                    measurement.bodyFatPercent,
                    "%",
                    previousMeasurement?.bodyFatPercent
                  )}
                {measurement.muscleMass &&
                  renderMetricCard(
                    "Massa Magra",
                    measurement.muscleMass,
                    "kg",
                    previousMeasurement?.muscleMass
                  )}
              </View>
              {measurement.fatMass && (
                <View style={styles.metricsRow}>
                  {renderMetricCard(
                    "Massa Gorda",
                    measurement.fatMass,
                    "kg",
                    previousMeasurement?.fatMass
                  )}
                </View>
              )}
            </>
          )}

        {/* Índices de Saúde e Risco Metabólico */}
        {(measurement.waistCirc || measurement.hipCirc) &&
          (() => {
            const rcq = calculateRCQ(
              measurement.waistCirc,
              measurement.hipCirc
            );
            const rce = calculateRCE(measurement.waistCirc, measurement.height);

            return renderSection(
              "Índices de Saúde e Risco",
              "pulse-outline",
              <>
                {/* Linha 1: RCQ + RCE */}
                <View style={styles.metricsRow}>
                  {rcq && (
                    <View style={styles.metricCard}>
                      <Text style={styles.metricLabel}>
                        RCQ (Cintura/Quadril)
                      </Text>
                      <Text style={styles.metricValue}>{rcq.toFixed(2)}</Text>
                      <View
                        style={[
                          styles.riskBadge,
                          {
                            backgroundColor: getRCQRisk(rcq, true).includes(
                              "Baixo"
                            )
                              ? lightTheme.colors.success + "20"
                              : getRCQRisk(rcq, true).includes("Moderado")
                              ? lightTheme.colors.warning + "20"
                              : lightTheme.colors.error + "20",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.riskBadgeText,
                            {
                              color: getRCQRisk(rcq, true).includes("Baixo")
                                ? lightTheme.colors.success
                                : getRCQRisk(rcq, true).includes("Moderado")
                                ? lightTheme.colors.warning
                                : lightTheme.colors.error,
                            },
                          ]}
                        >
                          {getRCQRisk(rcq, true)}
                        </Text>
                      </View>
                    </View>
                  )}
                  {rce && (
                    <View style={styles.metricCard}>
                      <Text style={styles.metricLabel}>
                        RCE (Cintura/Estatura)
                      </Text>
                      <Text style={styles.metricValue}>{rce.toFixed(2)}</Text>
                      <View
                        style={[
                          styles.riskBadge,
                          {
                            backgroundColor: getRCERisk(rce).includes("Baixo")
                              ? lightTheme.colors.success + "20"
                              : getRCERisk(rce).includes("aumentado")
                              ? lightTheme.colors.warning + "20"
                              : lightTheme.colors.error + "20",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.riskBadgeText,
                            {
                              color: getRCERisk(rce).includes("Baixo")
                                ? lightTheme.colors.success
                                : getRCERisk(rce).includes("aumentado")
                                ? lightTheme.colors.warning
                                : lightTheme.colors.error,
                            },
                          ]}
                        >
                          {getRCERisk(rce)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </>
            );
          })()}

        {/* Gasto Energético */}
        {measurement.weight &&
          measurement.height &&
          (() => {
            const tmb = calculateTMB(measurement.weight, measurement.height);

            return renderSection(
              "Metabolismo e Gasto Energético",
              "flame-outline",
              <>
                {tmb && (
                  <View style={styles.energyCard}>
                    <View style={styles.energyHeader}>
                      <Ionicons
                        name="fitness"
                        size={32}
                        color={lightTheme.colors.primary}
                      />
                      <Text style={styles.energyTitle}>
                        Taxa Metabólica Basal (TMB)
                      </Text>
                    </View>
                    <Text style={styles.energyValue}>
                      {tmb.toFixed(0)} kcal/dia
                    </Text>
                    <Text style={styles.energySubtitle}>
                      Gasto energético em repouso
                    </Text>

                    <View style={styles.energyLevels}>
                      <View style={styles.energyLevel}>
                        <Text style={styles.energyLevelLabel}>
                          Sedentário (1.2x)
                        </Text>
                        <Text style={styles.energyLevelValue}>
                          {(tmb * 1.2).toFixed(0)} kcal
                        </Text>
                      </View>
                      <View style={styles.energyLevel}>
                        <Text style={styles.energyLevelLabel}>
                          Leve (1.375x)
                        </Text>
                        <Text style={styles.energyLevelValue}>
                          {(tmb * 1.375).toFixed(0)} kcal
                        </Text>
                      </View>
                      <View style={styles.energyLevel}>
                        <Text style={styles.energyLevelLabel}>
                          Moderado (1.55x)
                        </Text>
                        <Text style={styles.energyLevelValue}>
                          {(tmb * 1.55).toFixed(0)} kcal
                        </Text>
                      </View>
                      <View style={styles.energyLevel}>
                        <Text style={styles.energyLevelLabel}>
                          Intenso (1.725x)
                        </Text>
                        <Text style={styles.energyLevelValue}>
                          {(tmb * 1.725).toFixed(0)} kcal
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </>
            );
          })()}

        {/* Análises Avançadas */}
        {(measurement.armCircRelaxedRight ||
          measurement.armCircRelaxedLeft ||
          measurement.armCircContractedRight ||
          measurement.armCircContractedLeft ||
          measurement.thighCircRight ||
          measurement.thighCircLeft ||
          measurement.armCirc) &&
          (() => {
            const symmetryArmRelaxed = calculateSymmetry(
              measurement.armCircRelaxedRight,
              measurement.armCircRelaxedLeft
            );
            const symmetryArmContracted = calculateSymmetry(
              measurement.armCircContractedRight,
              measurement.armCircContractedLeft
            );
            const symmetryThigh = calculateSymmetry(
              measurement.thighCircRight,
              measurement.thighCircLeft
            );
            const amb = calculateAMB(
              measurement.armCirc,
              measurement.tricepsFold
            );

            return renderSection(
              "Análises Avançadas",
              "analytics",
              <>
                {/* Simetria */}
                {(symmetryArmRelaxed !== null ||
                  symmetryArmContracted !== null ||
                  symmetryThigh !== null) && (
                  <View style={styles.symmetrySection}>
                    <Text style={styles.symmetryTitle}>
                      Análise de Simetria
                    </Text>

                    {/* Primeira linha: Braços */}
                    {(symmetryArmRelaxed !== null ||
                      symmetryArmContracted !== null) && (
                      <View style={styles.metricsRow}>
                        {symmetryArmRelaxed !== null && (
                          <View style={styles.metricCard}>
                            <Text style={styles.metricLabel}>
                              Braço Relaxado
                            </Text>
                            <Text style={styles.metricValue}>
                              {symmetryArmRelaxed.toFixed(1)}%
                            </Text>
                            <Text style={styles.symmetryNote}>
                              {symmetryArmRelaxed < 5
                                ? "Excelente"
                                : symmetryArmRelaxed < 10
                                ? "Boa"
                                : "Assimetria significativa"}
                            </Text>
                          </View>
                        )}
                        {symmetryArmContracted !== null && (
                          <View style={styles.metricCard}>
                            <Text style={styles.metricLabel}>
                              Braço Contraído
                            </Text>
                            <Text style={styles.metricValue}>
                              {symmetryArmContracted.toFixed(1)}%
                            </Text>
                            <Text style={styles.symmetryNote}>
                              {symmetryArmContracted < 5
                                ? "Excelente"
                                : symmetryArmContracted < 10
                                ? "Boa"
                                : "Assimetria significativa"}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Segunda linha: Coxas */}
                    {symmetryThigh !== null && (
                      <View style={styles.metricsRow}>
                        <View style={styles.metricCard}>
                          <Text style={styles.metricLabel}>Coxas</Text>
                          <Text style={styles.metricValue}>
                            {symmetryThigh.toFixed(1)}%
                          </Text>
                          <Text style={styles.symmetryNote}>
                            {symmetryThigh < 5
                              ? "Excelente"
                              : symmetryThigh < 10
                              ? "Boa"
                              : "Assimetria significativa"}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Área Muscular do Braço */}
                {amb !== null && (
                  <View style={styles.metricsRow}>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricLabel}>
                        Área Muscular do Braço (AMB)
                      </Text>
                      <Text style={styles.metricValue}>
                        {amb.toFixed(2)} cm²
                      </Text>
                      <Text style={styles.symmetryNote}>
                        Indicador de massa muscular
                      </Text>
                    </View>
                  </View>
                )}
              </>
            );
          })()}

        {/* Observações */}
        {measurement.notes &&
          renderSection(
            "Observações",
            "document-text-outline",
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{measurement.notes}</Text>
            </View>
          )}

        {/* Informações de criação */}
        <View style={styles.metadataContainer}>
          <Text style={styles.metadataText}>
            Criado em:{" "}
            {format(new Date(measurement.createdAt), "dd/MM/yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          </Text>
        </View>
      </ScrollView>

      {/* Botões de ação */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => setDeleteModalVisible(true)}
        >
          <Ionicons name="trash-outline" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Excluir</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => {
            Alert.alert(
              "Em desenvolvimento",
              "Funcionalidade de edição será implementada em breve."
            );
          }}
        >
          <Ionicons name="create-outline" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de confirmação de exclusão */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons
              name="warning-outline"
              size={48}
              color={lightTheme.colors.error}
            />
            <Text style={styles.modalTitle}>Excluir Avaliação</Text>
            <Text style={styles.modalText}>
              Tem certeza que deseja excluir esta avaliação? Esta ação não pode
              ser desfeita.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deleting}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Excluir</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: lightTheme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: lightTheme.colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: lightTheme.colors.background,
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 18,
    fontWeight: "600",
    color: lightTheme.colors.text,
    textAlign: "center",
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: lightTheme.colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.border,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${lightTheme.colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerDate: {
    fontSize: 20,
    fontWeight: "700",
    color: lightTheme.colors.text,
    marginBottom: 4,
  },
  headerTime: {
    fontSize: 14,
    color: lightTheme.colors.textSecondary,
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: lightTheme.colors.text,
    marginLeft: 12,
  },
  sectionContent: {
    gap: 12,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    backgroundColor: lightTheme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
  },
  metricLabel: {
    fontSize: 12,
    color: lightTheme.colors.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
    color: lightTheme.colors.text,
    marginBottom: 4,
  },
  differenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  differenceText: {
    fontSize: 12,
    fontWeight: "600",
  },
  notesContainer: {
    padding: 16,
    backgroundColor: lightTheme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    color: lightTheme.colors.text,
  },
  metadataContainer: {
    padding: 20,
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    color: lightTheme.colors.textSecondary,
    fontStyle: "italic",
  },
  actionsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  deleteButton: {
    backgroundColor: lightTheme.colors.error,
  },
  editButton: {
    backgroundColor: lightTheme.colors.primary,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
    backgroundColor: lightTheme.colors.error,
  },
  modalCancelButtonText: {
    color: lightTheme.colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  modalConfirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  protocolCard: {
    backgroundColor: lightTheme.colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    ...lightTheme.shadows.md,
  },
  protocolHeader: {
    marginBottom: 16,
  },
  protocolBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  protocolTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: lightTheme.colors.primary,
  },
  protocolSubtitle: {
    fontSize: 13,
    color: lightTheme.colors.gray[500],
    fontWeight: "500",
  },
  compositionMetrics: {
    flexDirection: "row",
    gap: 12,
  },
  compositionMetric: {
    flex: 1,
    alignItems: "center",
  },
  compositionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  compositionValue: {
    fontSize: 20,
    fontWeight: "700",
    color: lightTheme.colors.text,
    marginBottom: 4,
  },
  compositionLabel: {
    fontSize: 12,
    color: lightTheme.colors.gray[500],
    textAlign: "center",
  },
  compositionChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  compositionChangeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  // Estilos para Índices de Risco
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Estilos para Metabolismo
  energyCard: {
    padding: 20,
    backgroundColor: lightTheme.colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
  },
  energyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  energyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: lightTheme.colors.text,
    flex: 1,
  },
  energyValue: {
    fontSize: 32,
    fontWeight: "700",
    color: lightTheme.colors.primary,
    textAlign: "center",
    marginVertical: 8,
  },
  energySubtitle: {
    fontSize: 14,
    color: lightTheme.colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
  energyLevels: {
    gap: 12,
  },
  energyLevel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: lightTheme.colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
  },
  energyLevelLabel: {
    fontSize: 14,
    color: lightTheme.colors.text,
    fontWeight: "500",
  },
  energyLevelValue: {
    fontSize: 14,
    fontWeight: "700",
    color: lightTheme.colors.primary,
  },
  // Estilos para Análises Avançadas
  symmetrySection: {
    marginBottom: 16,
    gap: 12, // Espaçamento entre as linhas de cards
  },
  symmetryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: lightTheme.colors.text,
    marginBottom: 12,
  },
  symmetryNote: {
    fontSize: 11,
    color: lightTheme.colors.textSecondary,
    marginTop: 4,
    fontStyle: "italic",
  },
});
