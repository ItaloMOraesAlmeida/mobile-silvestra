/**
 * AssessmentDetailsModal Component
 *
 * Modal para exibir detalhes completos de uma avaliação antropométrica.
 *
 * Features:
 * - Todas as medidas da avaliação
 * - Comparação com avaliação anterior
 * - Gráficos de composição corporal
 * - IMC e classificação
 * - Fotos da avaliação (se disponíveis)
 * - Notas do nutricionista
 * - Data da avaliação
 *
 * Layout:
 * - Header com título e botão fechar
 * - ScrollView com seções organizadas
 * - Cards por categoria de medida
 */

import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles, useTheme } from "../../../hooks/useTheme";
import type { Theme } from "../../../theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Tipos baseados no schema
interface AssessmentData {
  id: string;
  date: string;

  // Medidas básicas
  weight: number;
  height: number;

  // Circunferências (cm)
  neck?: number | null;
  shoulder?: number | null;
  chest?: number | null;
  waist?: number | null;
  abdomen?: number | null;
  hip?: number | null;
  rightThigh?: number | null;
  leftThigh?: number | null;
  rightCalf?: number | null;
  leftCalf?: number | null;
  rightArm?: number | null;
  leftArm?: number | null;
  rightForearm?: number | null;
  leftForearm?: number | null;

  // Composição corporal
  bodyFatPercent?: number | null;
  muscleMass?: number | null;
  leanMass?: number | null;
  visceralFat?: number | null;
  boneMass?: number | null;
  waterPercent?: number | null;
  bmr?: number | null;

  // Dobras cutâneas (mm)
  tricepsFold?: number | null;
  bicepsFold?: number | null;
  subscapularFold?: number | null;
  suprailiacFold?: number | null;
  abdominalFold?: number | null;
  thighFold?: number | null;
  calfFold?: number | null;

  // Notas e fotos
  notes?: string | null;
  frontPhotoUrl?: string | null;
  sidePhotoUrl?: string | null;
  backPhotoUrl?: string | null;
}

export interface AssessmentDetailsModalProps {
  visible: boolean;
  assessment: AssessmentData | null;
  previousAssessment?: AssessmentData | null;
  onClose: () => void;
}

export const AssessmentDetailsModal: React.FC<AssessmentDetailsModalProps> = ({
  visible,
  assessment,
  previousAssessment,
  onClose,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();

  // Calcular IMC
  const bmi = useMemo(() => {
    if (!assessment) return null;
    return assessment.weight / (assessment.height * assessment.height);
  }, [assessment]);

  // Classificação do IMC
  const bmiClassification = useMemo(() => {
    if (!bmi) return null;

    if (bmi < 18.5)
      return { label: "Abaixo do peso", color: theme.colors.info };
    if (bmi < 25) return { label: "Peso normal", color: theme.colors.success };
    if (bmi < 30) return { label: "Sobrepeso", color: theme.colors.warning };
    if (bmi < 35)
      return { label: "Obesidade Grau I", color: theme.colors.error };
    if (bmi < 40)
      return { label: "Obesidade Grau II", color: theme.colors.error };
    return { label: "Obesidade Grau III", color: theme.colors.error };
  }, [bmi, theme]);

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (!assessment) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <SafeAreaView style={styles.modalContent} edges={["bottom"]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dragIndicator} />

            <View style={styles.titleContainer}>
              <View style={styles.titleContent}>
                <Text style={styles.title}>Avaliação Antropométrica</Text>
                <Text style={styles.subtitle}>
                  {formatDate(assessment.date)}
                </Text>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* IMC Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons
                  name="fitness"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={styles.cardTitle}>Índice de Massa Corporal</Text>
              </View>

              <View style={styles.bmiContainer}>
                <View style={styles.bmiValue}>
                  <Text style={styles.bmiNumber}>{bmi?.toFixed(1)}</Text>
                  <Text style={styles.bmiUnit}>kg/m²</Text>
                </View>

                {bmiClassification && (
                  <View
                    style={[
                      styles.bmiClassification,
                      { backgroundColor: `${bmiClassification.color}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.bmiClassificationText,
                        { color: bmiClassification.color },
                      ]}
                    >
                      {bmiClassification.label}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Medidas Básicas */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="body" size={20} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>Medidas Básicas</Text>
              </View>

              <MeasurementRow
                label="Peso"
                value={assessment.weight}
                unit="kg"
                previousValue={previousAssessment?.weight}
                theme={theme}
              />
              <MeasurementRow
                label="Altura"
                value={assessment.height}
                unit="m"
                previousValue={previousAssessment?.height}
                theme={theme}
                decimals={2}
              />
            </View>

            {/* Composição Corporal */}
            {(assessment.bodyFatPercent ||
              assessment.muscleMass ||
              assessment.leanMass ||
              assessment.waterPercent ||
              assessment.bmr) && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="analytics"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.cardTitle}>Composição Corporal</Text>
                </View>

                {assessment.bodyFatPercent && (
                  <MeasurementRow
                    label="Gordura Corporal"
                    value={assessment.bodyFatPercent}
                    unit="%"
                    previousValue={previousAssessment?.bodyFatPercent}
                    theme={theme}
                  />
                )}
                {assessment.muscleMass && (
                  <MeasurementRow
                    label="Massa Muscular"
                    value={assessment.muscleMass}
                    unit="kg"
                    previousValue={previousAssessment?.muscleMass}
                    theme={theme}
                  />
                )}
                {assessment.leanMass && (
                  <MeasurementRow
                    label="Massa Magra"
                    value={assessment.leanMass}
                    unit="kg"
                    previousValue={previousAssessment?.leanMass}
                    theme={theme}
                  />
                )}
                {assessment.waterPercent && (
                  <MeasurementRow
                    label="Água Corporal"
                    value={assessment.waterPercent}
                    unit="%"
                    previousValue={previousAssessment?.waterPercent}
                    theme={theme}
                  />
                )}
                {assessment.bmr && (
                  <MeasurementRow
                    label="Taxa Metabólica Basal"
                    value={assessment.bmr}
                    unit="kcal"
                    previousValue={previousAssessment?.bmr}
                    theme={theme}
                    decimals={0}
                  />
                )}
                {assessment.visceralFat && (
                  <MeasurementRow
                    label="Gordura Visceral"
                    value={assessment.visceralFat}
                    unit="nível"
                    previousValue={previousAssessment?.visceralFat}
                    theme={theme}
                    decimals={0}
                  />
                )}
              </View>
            )}

            {/* Circunferências */}
            {(assessment.neck ||
              assessment.chest ||
              assessment.waist ||
              assessment.hip ||
              assessment.rightArm ||
              assessment.rightThigh) && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="resize"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.cardTitle}>Circunferências</Text>
                </View>

                {assessment.neck && (
                  <MeasurementRow
                    label="Pescoço"
                    value={assessment.neck}
                    unit="cm"
                    previousValue={previousAssessment?.neck}
                    theme={theme}
                  />
                )}
                {assessment.shoulder && (
                  <MeasurementRow
                    label="Ombro"
                    value={assessment.shoulder}
                    unit="cm"
                    previousValue={previousAssessment?.shoulder}
                    theme={theme}
                  />
                )}
                {assessment.chest && (
                  <MeasurementRow
                    label="Peitoral"
                    value={assessment.chest}
                    unit="cm"
                    previousValue={previousAssessment?.chest}
                    theme={theme}
                  />
                )}
                {assessment.waist && (
                  <MeasurementRow
                    label="Cintura"
                    value={assessment.waist}
                    unit="cm"
                    previousValue={previousAssessment?.waist}
                    theme={theme}
                  />
                )}
                {assessment.abdomen && (
                  <MeasurementRow
                    label="Abdômen"
                    value={assessment.abdomen}
                    unit="cm"
                    previousValue={previousAssessment?.abdomen}
                    theme={theme}
                  />
                )}
                {assessment.hip && (
                  <MeasurementRow
                    label="Quadril"
                    value={assessment.hip}
                    unit="cm"
                    previousValue={previousAssessment?.hip}
                    theme={theme}
                  />
                )}
                {assessment.rightArm && (
                  <MeasurementRow
                    label="Braço Direito"
                    value={assessment.rightArm}
                    unit="cm"
                    previousValue={previousAssessment?.rightArm}
                    theme={theme}
                  />
                )}
                {assessment.leftArm && (
                  <MeasurementRow
                    label="Braço Esquerdo"
                    value={assessment.leftArm}
                    unit="cm"
                    previousValue={previousAssessment?.leftArm}
                    theme={theme}
                  />
                )}
                {assessment.rightForearm && (
                  <MeasurementRow
                    label="Antebraço Direito"
                    value={assessment.rightForearm}
                    unit="cm"
                    previousValue={previousAssessment?.rightForearm}
                    theme={theme}
                  />
                )}
                {assessment.leftForearm && (
                  <MeasurementRow
                    label="Antebraço Esquerdo"
                    value={assessment.leftForearm}
                    unit="cm"
                    previousValue={previousAssessment?.leftForearm}
                    theme={theme}
                  />
                )}
                {assessment.rightThigh && (
                  <MeasurementRow
                    label="Coxa Direita"
                    value={assessment.rightThigh}
                    unit="cm"
                    previousValue={previousAssessment?.rightThigh}
                    theme={theme}
                  />
                )}
                {assessment.leftThigh && (
                  <MeasurementRow
                    label="Coxa Esquerda"
                    value={assessment.leftThigh}
                    unit="cm"
                    previousValue={previousAssessment?.leftThigh}
                    theme={theme}
                  />
                )}
                {assessment.rightCalf && (
                  <MeasurementRow
                    label="Panturrilha Direita"
                    value={assessment.rightCalf}
                    unit="cm"
                    previousValue={previousAssessment?.rightCalf}
                    theme={theme}
                  />
                )}
                {assessment.leftCalf && (
                  <MeasurementRow
                    label="Panturrilha Esquerda"
                    value={assessment.leftCalf}
                    unit="cm"
                    previousValue={previousAssessment?.leftCalf}
                    theme={theme}
                  />
                )}
              </View>
            )}

            {/* Dobras Cutâneas */}
            {(assessment.tricepsFold ||
              assessment.subscapularFold ||
              assessment.suprailiacFold ||
              assessment.abdominalFold) && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="layers"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.cardTitle}>Dobras Cutâneas</Text>
                </View>

                {assessment.tricepsFold && (
                  <MeasurementRow
                    label="Tríceps"
                    value={assessment.tricepsFold}
                    unit="mm"
                    previousValue={previousAssessment?.tricepsFold}
                    theme={theme}
                  />
                )}
                {assessment.bicepsFold && (
                  <MeasurementRow
                    label="Bíceps"
                    value={assessment.bicepsFold}
                    unit="mm"
                    previousValue={previousAssessment?.bicepsFold}
                    theme={theme}
                  />
                )}
                {assessment.subscapularFold && (
                  <MeasurementRow
                    label="Subescapular"
                    value={assessment.subscapularFold}
                    unit="mm"
                    previousValue={previousAssessment?.subscapularFold}
                    theme={theme}
                  />
                )}
                {assessment.suprailiacFold && (
                  <MeasurementRow
                    label="Suprailíaca"
                    value={assessment.suprailiacFold}
                    unit="mm"
                    previousValue={previousAssessment?.suprailiacFold}
                    theme={theme}
                  />
                )}
                {assessment.abdominalFold && (
                  <MeasurementRow
                    label="Abdominal"
                    value={assessment.abdominalFold}
                    unit="mm"
                    previousValue={previousAssessment?.abdominalFold}
                    theme={theme}
                  />
                )}
                {assessment.thighFold && (
                  <MeasurementRow
                    label="Coxa"
                    value={assessment.thighFold}
                    unit="mm"
                    previousValue={previousAssessment?.thighFold}
                    theme={theme}
                  />
                )}
                {assessment.calfFold && (
                  <MeasurementRow
                    label="Panturrilha"
                    value={assessment.calfFold}
                    unit="mm"
                    previousValue={previousAssessment?.calfFold}
                    theme={theme}
                  />
                )}
              </View>
            )}

            {/* Fotos */}
            {(assessment.frontPhotoUrl ||
              assessment.sidePhotoUrl ||
              assessment.backPhotoUrl) && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="camera"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.cardTitle}>Fotos da Avaliação</Text>
                </View>

                <View style={styles.photosContainer}>
                  {assessment.frontPhotoUrl && (
                    <View style={styles.photoItem}>
                      <Image
                        source={{ uri: assessment.frontPhotoUrl }}
                        style={styles.photo}
                      />
                      <Text style={styles.photoLabel}>Frente</Text>
                    </View>
                  )}
                  {assessment.sidePhotoUrl && (
                    <View style={styles.photoItem}>
                      <Image
                        source={{ uri: assessment.sidePhotoUrl }}
                        style={styles.photo}
                      />
                      <Text style={styles.photoLabel}>Lateral</Text>
                    </View>
                  )}
                  {assessment.backPhotoUrl && (
                    <View style={styles.photoItem}>
                      <Image
                        source={{ uri: assessment.backPhotoUrl }}
                        style={styles.photo}
                      />
                      <Text style={styles.photoLabel}>Costas</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Notas */}
            {assessment.notes && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="document-text"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.cardTitle}>Observações</Text>
                </View>

                <Text style={styles.notesText}>{assessment.notes}</Text>
              </View>
            )}

            {/* Espaço final */}
            <View style={{ height: 32 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

// Componente auxiliar para linha de medida
interface MeasurementRowProps {
  label: string;
  value: number;
  unit: string;
  previousValue?: number | null;
  theme: Theme;
  decimals?: number;
}

const MeasurementRow: React.FC<MeasurementRowProps> = ({
  label,
  value,
  unit,
  previousValue,
  theme,
  decimals = 1,
}) => {
  const change = previousValue ? value - previousValue : null;
  const hasChange = change !== null && Math.abs(change) > 0.01;

  return (
    <View style={measurementRowStyles(theme).container}>
      <Text style={measurementRowStyles(theme).label}>{label}</Text>

      <View style={measurementRowStyles(theme).valueContainer}>
        <Text style={measurementRowStyles(theme).value}>
          {value.toFixed(decimals)} {unit}
        </Text>

        {hasChange && (
          <View style={measurementRowStyles(theme).changeContainer}>
            <Ionicons
              name={change! > 0 ? "arrow-up" : "arrow-down"}
              size={14}
              color={change! > 0 ? theme.colors.error : theme.colors.success}
            />
            <Text
              style={[
                measurementRowStyles(theme).changeText,
                {
                  color:
                    change! > 0 ? theme.colors.error : theme.colors.success,
                },
              ]}
            >
              {Math.abs(change!).toFixed(decimals)} {unit}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const measurementRowStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    label: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
    },
    valueContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    value: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
      marginRight: 8,
    },
    changeContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    changeText: {
      fontSize: 12,
      fontWeight: "500",
      marginLeft: 2,
    },
  });

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalBackdrop: {
      flex: 1,
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: SCREEN_HEIGHT * 0.9,
      minHeight: SCREEN_HEIGHT * 0.5,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    dragIndicator: {
      width: 40,
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: 12,
    },
    titleContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    titleContent: {
      flex: 1,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    closeButton: {
      padding: 4,
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 20,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
      marginLeft: 8,
    },
    bmiContainer: {
      alignItems: "center",
    },
    bmiValue: {
      flexDirection: "row",
      alignItems: "baseline",
      marginBottom: 12,
    },
    bmiNumber: {
      fontSize: 48,
      fontWeight: "700",
      color: theme.colors.text,
    },
    bmiUnit: {
      fontSize: 18,
      fontWeight: "500",
      color: theme.colors.textSecondary,
      marginLeft: 4,
    },
    bmiClassification: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    bmiClassificationText: {
      fontSize: 14,
      fontWeight: "600",
    },
    photosContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      flexWrap: "wrap",
    },
    photoItem: {
      alignItems: "center",
      marginBottom: 12,
    },
    photo: {
      width: 100,
      height: 150,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
    },
    photoLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 6,
    },
    notesText: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.text,
    },
  });
