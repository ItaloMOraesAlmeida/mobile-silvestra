import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { StackScreenProps } from "@react-navigation/stack";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import type { Theme } from "../../theme";
import type { BodyMeasurement } from "../../types/patient-details.types";
import { bodyMeasurementsService } from "../../services/patient-details.service";
import { PhotoGalleryEnhanced } from "../../components/patient";
import {
  ComparisonView,
  CircumferencesGrid,
} from "../../components/measurements";
import { EditMeasurementModal } from "../../components/modals/EditMeasurementModal";

type RootStackParamList = {
  MeasurementDetails: {
    measurementId: string;
    patientId: string;
    patientName?: string;
  };
};

type Props = StackScreenProps<RootStackParamList, "MeasurementDetails">;

export const MeasurementDetailsScreen: React.FC<Props> = ({
  route,
  navigation,
}) => {
  const { measurementId, patientId, patientName } = route.params;
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();

  const [measurement, setMeasurement] = useState<BodyMeasurement | null>(null);
  const [previousMeasurement, setPreviousMeasurement] =
    useState<BodyMeasurement | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const loadMeasurementDetails = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bodyMeasurementsService.findOne(
        patientId,
        measurementId
      );
      setMeasurement(data);
    } catch (error) {
      console.error("Erro ao carregar detalhes da medição:", error);
      Alert.alert("Erro", "Não foi possível carregar os detalhes da medição.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [patientId, measurementId, navigation]);

  /**
   * Carrega a medição anterior para comparação
   */
  const loadPreviousMeasurement = useCallback(async () => {
    if (!measurement) return;

    try {
      setLoadingPrevious(true);
      // Busca todas as medições do paciente
      const response = await bodyMeasurementsService.findAll(patientId);
      const allMeasurements = response.data;

      // Filtra medições anteriores à atual e ordena por data (mais recente primeiro)
      const previousMeasurements = allMeasurements
        .filter(
          (m: BodyMeasurement) =>
            new Date(m.createdAt) < new Date(measurement.createdAt)
        )
        .sort(
          (a: BodyMeasurement, b: BodyMeasurement) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      // Pega a mais recente (primeira da lista)
      const previous = previousMeasurements[0] || null;
      setPreviousMeasurement(previous);
    } catch (error) {
      console.error("Erro ao carregar medição anterior:", error);
      // Não bloqueia a tela, apenas não mostra comparação
    } finally {
      setLoadingPrevious(false);
    }
  }, [patientId, measurement]);

  useEffect(() => {
    loadMeasurementDetails();
  }, [loadMeasurementDetails]);

  useEffect(() => {
    if (measurement) {
      loadPreviousMeasurement();
    }
  }, [measurement, loadPreviousMeasurement]);

  const handleEditPress = useCallback(() => {
    setIsEditModalVisible(true);
  }, []);

  const handleEditSubmit = useCallback(
    async (measurementId: string, data: any) => {
      try {
        await bodyMeasurementsService.update(patientId, measurementId, data);
        setIsEditModalVisible(false);
        await loadMeasurementDetails(); // Recarrega os dados
        Alert.alert("Sucesso", "Medição atualizada com sucesso!");
      } catch (error) {
        console.error("Erro ao atualizar medição:", error);
        Alert.alert(
          "Erro",
          "Não foi possível atualizar a medição. Tente novamente."
        );
      }
    },
    [patientId, loadMeasurementDetails]
  );

  const handleDeletePress = useCallback(() => {
    if (!measurement) return;

    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir esta medição? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await bodyMeasurementsService.remove(patientId, measurementId);
              Alert.alert("Sucesso", "Medição excluída com sucesso!");
              navigation.goBack();
            } catch (error) {
              console.error("Erro ao excluir medição:", error);
              Alert.alert(
                "Erro",
                "Não foi possível excluir a medição. Tente novamente."
              );
            }
          },
        },
      ]
    );
  }, [measurement, patientId, measurementId, navigation]);

  useEffect(() => {
    // Configurar header com botões de ação
    navigation.setOptions({
      headerTitle: "Detalhes da Medição",
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={styles.headerIconColor.color}
          />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleEditPress}
            style={styles.headerButton}
          >
            <Ionicons
              name="create-outline"
              size={24}
              color={styles.headerIconColor.color}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeletePress}
            style={styles.headerButton}
          >
            <Ionicons
              name="trash-outline"
              size={24}
              color={styles.headerDeleteIcon.color}
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, styles, handleEditPress, handleDeletePress]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatValue = (value?: number | null, unit: string = "") => {
    if (value === null || value === undefined) {
      return "Não informado";
    }
    return `${value.toFixed(1)} ${unit}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={styles.loadingIndicator.color} />
        <Text style={styles.loadingText}>Carregando detalhes...</Text>
      </View>
    );
  }

  if (!measurement) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={styles.errorIcon.color}
        />
        <Text style={styles.errorText}>Medição não encontrada</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Informações Gerais */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons
            name="information-circle"
            size={24}
            color={styles.cardHeaderIcon.color}
          />
          <Text style={styles.cardTitle}>Informações Gerais</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data da Medição:</Text>
            <Text style={styles.infoValue}>
              {formatDate(measurement.createdAt)}
            </Text>
          </View>
          {patientName && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Paciente:</Text>
              <Text style={styles.infoValue}>{patientName}</Text>
            </View>
          )}
          {measurement.updatedAt !== measurement.createdAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Última atualização:</Text>
              <Text style={styles.infoValue}>
                {formatDate(measurement.updatedAt)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Medidas Principais */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons
            name="fitness"
            size={24}
            color={styles.cardHeaderIcon.color}
          />
          <Text style={styles.cardTitle}>Medidas Principais</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Peso</Text>
              <Text style={styles.metricValue}>
                {formatValue(measurement.weight, "kg")}
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Altura</Text>
              <Text style={styles.metricValue}>
                {formatValue(measurement.height, "cm")}
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>IMC</Text>
              <Text style={styles.metricValue}>
                {formatValue(measurement.bmi)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Circunferências */}
      {(measurement.neckCirc ||
        measurement.shoulderCirc ||
        measurement.rightArmCirc ||
        measurement.leftArmCirc ||
        measurement.forearmCirc ||
        measurement.chestCirc ||
        measurement.waistCirc ||
        measurement.abdomenCirc ||
        measurement.hipCirc ||
        measurement.thighCirc ||
        measurement.calfCirc) && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="resize"
              size={24}
              color={styles.cardHeaderIcon.color}
            />
            <Text style={styles.cardTitle}>Circunferências</Text>
          </View>
          <View style={styles.cardContent}>
            <CircumferencesGrid measurement={measurement} />
          </View>
        </View>
      )}

      {/* Dobras Cutâneas */}
      {(measurement.tricepsSkinfold ||
        measurement.subscapularSkinfold ||
        measurement.pectoralSkinfold ||
        measurement.midaxillarySkinfold ||
        measurement.suprailiacSkinfold ||
        measurement.abdominalSkinfold ||
        measurement.thighSkinfold) && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="analytics"
              size={24}
              color={styles.cardHeaderIcon.color}
            />
            <Text style={styles.cardTitle}>Dobras Cutâneas (Pollock)</Text>
          </View>
          <View style={styles.cardContent}>
            {measurement.tricepsSkinfold && (
              <View style={styles.measurementRow}>
                <Text style={styles.measurementLabel}>Tríceps:</Text>
                <Text style={styles.measurementValue}>
                  {formatValue(measurement.tricepsSkinfold, "mm")}
                </Text>
              </View>
            )}
            {measurement.subscapularSkinfold && (
              <View style={styles.measurementRow}>
                <Text style={styles.measurementLabel}>Subescapular:</Text>
                <Text style={styles.measurementValue}>
                  {formatValue(measurement.subscapularSkinfold, "mm")}
                </Text>
              </View>
            )}
            {measurement.pectoralSkinfold && (
              <View style={styles.measurementRow}>
                <Text style={styles.measurementLabel}>Peitoral:</Text>
                <Text style={styles.measurementValue}>
                  {formatValue(measurement.pectoralSkinfold, "mm")}
                </Text>
              </View>
            )}
            {measurement.midaxillarySkinfold && (
              <View style={styles.measurementRow}>
                <Text style={styles.measurementLabel}>Axilar Média:</Text>
                <Text style={styles.measurementValue}>
                  {formatValue(measurement.midaxillarySkinfold, "mm")}
                </Text>
              </View>
            )}
            {measurement.suprailiacSkinfold && (
              <View style={styles.measurementRow}>
                <Text style={styles.measurementLabel}>Suprailíaca:</Text>
                <Text style={styles.measurementValue}>
                  {formatValue(measurement.suprailiacSkinfold, "mm")}
                </Text>
              </View>
            )}
            {measurement.abdominalSkinfold && (
              <View style={styles.measurementRow}>
                <Text style={styles.measurementLabel}>Abdominal:</Text>
                <Text style={styles.measurementValue}>
                  {formatValue(measurement.abdominalSkinfold, "mm")}
                </Text>
              </View>
            )}
            {measurement.thighSkinfold && (
              <View style={styles.measurementRow}>
                <Text style={styles.measurementLabel}>Coxa:</Text>
                <Text style={styles.measurementValue}>
                  {formatValue(measurement.thighSkinfold, "mm")}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Composição Corporal */}
      {(measurement.bodyFatPercent ||
        measurement.muscleMass ||
        measurement.fatMass) && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="body"
              size={24}
              color={styles.cardHeaderIcon.color}
            />
            <Text style={styles.cardTitle}>Composição Corporal</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.metricsGrid}>
              {measurement.bodyFatPercent && (
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>% Gordura</Text>
                  <Text style={styles.metricValue}>
                    {formatValue(measurement.bodyFatPercent, "%")}
                  </Text>
                </View>
              )}
              {measurement.muscleMass && (
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Massa Muscular</Text>
                  <Text style={styles.metricValue}>
                    {formatValue(measurement.muscleMass, "kg")}
                  </Text>
                </View>
              )}
              {measurement.fatMass && (
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Massa Gorda</Text>
                  <Text style={styles.metricValue}>
                    {formatValue(measurement.fatMass, "kg")}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Observações */}
      {measurement.notes && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="document-text"
              size={24}
              color={styles.cardHeaderIcon.color}
            />
            <Text style={styles.cardTitle}>Observações</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.notesText}>{measurement.notes}</Text>
          </View>
        </View>
      )}

      {/* Comparação com Medição Anterior */}
      {previousMeasurement && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="git-compare"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.cardTitle}>
              Comparação com Medição Anterior
            </Text>
          </View>
          <View style={styles.cardContent}>
            <ComparisonView
              currentMeasurement={measurement}
              previousMeasurement={previousMeasurement}
              loading={loadingPrevious}
            />
          </View>
        </View>
      )}

      {/* Fotos de Progresso */}
      {(measurement.photoFront ||
        measurement.photoSide ||
        measurement.photoBack) && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="images"
              size={24}
              color={styles.cardHeaderIcon.color}
            />
            <Text style={styles.cardTitle}>Fotos de Progresso</Text>
          </View>
          <View style={styles.cardContent}>
            <PhotoGalleryEnhanced
              photoFront={measurement.photoFront}
              photoSide={measurement.photoSide}
              photoBack={measurement.photoBack}
            />
          </View>
        </View>
      )}

      {/* Modal de Edição */}
      {measurement && (
        <EditMeasurementModal
          visible={isEditModalVisible}
          measurement={measurement}
          patientId={patientId}
          onClose={() => setIsEditModalVisible(false)}
          onSubmit={handleEditSubmit}
        />
      )}
    </ScrollView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
    },
    headerButton: {
      padding: theme.spacing.sm,
      marginLeft: theme.spacing.sm,
    },
    headerIconColor: {
      color: theme.colors.text,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      marginRight: theme.spacing.sm,
    },
    headerDeleteIcon: {
      color: theme.colors.error,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.background,
    },
    loadingIndicator: {
      color: theme.colors.primary,
    },
    loadingText: {
      marginTop: theme.spacing.md,
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.background,
      padding: theme.spacing.xl,
    },
    errorIcon: {
      color: theme.colors.error,
    },
    errorText: {
      marginTop: theme.spacing.md,
      fontSize: theme.typography.fontSize.lg,
      color: theme.colors.text,
      textAlign: "center",
    },
    errorButton: {
      marginTop: theme.spacing.lg,
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.borderRadius.md,
    },
    errorButtonText: {
      color: theme.colors.white,
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.md,
      ...theme.shadows.sm,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: theme.spacing.sm,
    },
    cardHeaderIcon: {
      color: theme.colors.primary,
    },
    cardTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
    },
    cardContent: {
      padding: theme.spacing.md,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: theme.spacing.sm,
    },
    infoLabel: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textSecondary,
      flex: 1,
    },
    infoValue: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text,
      flex: 1,
      textAlign: "right",
    },
    metricsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.md,
    },
    metricBox: {
      flex: 1,
      minWidth: "30%",
      backgroundColor: theme.colors.primaryBackground,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      alignItems: "center",
    },
    metricLabel: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
      textAlign: "center",
    },
    metricValue: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.primary,
      textAlign: "center",
    },
    measurementRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + "30",
    },
    measurementLabel: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textSecondary,
    },
    measurementValue: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text,
    },
    notesText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text,
      lineHeight: 22,
    },
  });
