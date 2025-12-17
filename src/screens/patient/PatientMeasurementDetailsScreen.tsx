import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { StackScreenProps } from "@react-navigation/stack";
import { lightTheme } from "../../theme";
import { useBodyMeasurements } from "../../hooks/useBodyMeasurements";
import type { BodyMeasurement } from "../../hooks/useBodyMeasurements";

type RootStackParamList = {
  PatientMeasurementDetails: {
    measurement: BodyMeasurement;
  };
};

type Props = StackScreenProps<RootStackParamList, "PatientMeasurementDetails">;

export const PatientMeasurementDetailsScreen: React.FC<Props> = ({
  route,
  navigation,
}) => {
  const { measurement: initialMeasurement } = route.params;
  const [previousMeasurement, setPreviousMeasurement] =
    useState<BodyMeasurement | null>(null);
  const [loading, setLoading] = useState(false);
  const { listMeasurements } = useBodyMeasurements();

  const loadPreviousMeasurement = async () => {
    try {
      setLoading(true);
      const response = await listMeasurements(initialMeasurement.patientId);

      if (!response) return;

      const allMeasurements = response.measurements;
      const previousMeasurements = allMeasurements
        .filter(
          (m: BodyMeasurement) =>
            new Date(m.createdAt) < new Date(initialMeasurement.createdAt)
        )
        .sort(
          (a: BodyMeasurement, b: BodyMeasurement) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      const previous = previousMeasurements[0] || null;
      setPreviousMeasurement(previous);
    } catch (error) {
      console.error("Erro ao carregar medição anterior:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreviousMeasurement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const calculateDifference = (
    current?: number | null,
    previous?: number | null
  ) => {
    if (!current || !previous) return null;
    const diff = current - previous;
    return {
      value: Math.abs(diff).toFixed(1),
      isIncrease: diff > 0,
      isDecrease: diff < 0,
    };
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={lightTheme.colors.white}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Medição</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Data e Hora */}
        <View style={styles.dateCard}>
          <Ionicons
            name="calendar-outline"
            size={24}
            color={lightTheme.colors.primary}
          />
          <Text style={styles.dateText}>
            {formatDate(initialMeasurement.createdAt)}
          </Text>
        </View>

        {/* Métricas Principais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Métricas Principais</Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons
                  name="scale-outline"
                  size={28}
                  color={lightTheme.colors.primary}
                />
                {previousMeasurement &&
                  (() => {
                    const diff = calculateDifference(
                      initialMeasurement.weight,
                      previousMeasurement.weight
                    );
                    return diff ? (
                      <View
                        style={[
                          styles.badge,
                          diff.isIncrease
                            ? styles.badgeWarning
                            : styles.badgeSuccess,
                        ]}
                      >
                        <Ionicons
                          name={
                            diff.isIncrease ? "trending-up" : "trending-down"
                          }
                          size={12}
                          color={lightTheme.colors.white}
                        />
                        <Text style={styles.badgeText}>{diff.value} kg</Text>
                      </View>
                    ) : null;
                  })()}
              </View>
              <Text style={styles.metricValue}>
                {formatValue(initialMeasurement.weight, "kg")}
              </Text>
              <Text style={styles.metricLabel}>Peso</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons
                  name="analytics-outline"
                  size={28}
                  color={lightTheme.colors.primary}
                />
                {previousMeasurement &&
                  (() => {
                    const diff = calculateDifference(
                      initialMeasurement.bmi,
                      previousMeasurement.bmi
                    );
                    return diff ? (
                      <View
                        style={[
                          styles.badge,
                          diff.isIncrease
                            ? styles.badgeWarning
                            : styles.badgeSuccess,
                        ]}
                      >
                        <Ionicons
                          name={
                            diff.isIncrease ? "trending-up" : "trending-down"
                          }
                          size={12}
                          color={lightTheme.colors.white}
                        />
                        <Text style={styles.badgeText}>{diff.value}</Text>
                      </View>
                    ) : null;
                  })()}
              </View>
              <Text style={styles.metricValue}>
                {formatValue(initialMeasurement.bmi)}
              </Text>
              <Text style={styles.metricLabel}>IMC</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons
                  name="water-outline"
                  size={28}
                  color={lightTheme.colors.primary}
                />
                {previousMeasurement &&
                  (() => {
                    const diff = calculateDifference(
                      initialMeasurement.bodyFatPercent,
                      previousMeasurement.bodyFatPercent
                    );
                    return diff ? (
                      <View
                        style={[
                          styles.badge,
                          diff.isIncrease
                            ? styles.badgeWarning
                            : styles.badgeSuccess,
                        ]}
                      >
                        <Ionicons
                          name={
                            diff.isIncrease ? "trending-up" : "trending-down"
                          }
                          size={12}
                          color={lightTheme.colors.white}
                        />
                        <Text style={styles.badgeText}>{diff.value}%</Text>
                      </View>
                    ) : null;
                  })()}
              </View>
              <Text style={styles.metricValue}>
                {formatValue(initialMeasurement.bodyFatPercent, "%")}
              </Text>
              <Text style={styles.metricLabel}>Gordura Corporal</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons
                  name="fitness-outline"
                  size={28}
                  color={lightTheme.colors.primary}
                />
                {previousMeasurement &&
                  (() => {
                    const diff = calculateDifference(
                      initialMeasurement.muscleMass,
                      previousMeasurement.muscleMass
                    );
                    return diff ? (
                      <View
                        style={[
                          styles.badge,
                          diff.isIncrease
                            ? styles.badgeSuccess
                            : styles.badgeWarning,
                        ]}
                      >
                        <Ionicons
                          name={
                            diff.isIncrease ? "trending-up" : "trending-down"
                          }
                          size={12}
                          color={lightTheme.colors.white}
                        />
                        <Text style={styles.badgeText}>{diff.value} kg</Text>
                      </View>
                    ) : null;
                  })()}
              </View>
              <Text style={styles.metricValue}>
                {formatValue(initialMeasurement.muscleMass, "kg")}
              </Text>
              <Text style={styles.metricLabel}>Massa Muscular</Text>
            </View>
          </View>
        </View>

        {/* Composição Corporal */}
        {(initialMeasurement.fatMass || initialMeasurement.height) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Composição Corporal</Text>
            <View style={styles.infoGrid}>
              {initialMeasurement.height && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Altura</Text>
                  <Text style={styles.infoValue}>
                    {formatValue(initialMeasurement.height, "cm")}
                  </Text>
                </View>
              )}
              {initialMeasurement.fatMass && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Massa Gorda</Text>
                  <Text style={styles.infoValue}>
                    {formatValue(initialMeasurement.fatMass, "kg")}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Circunferências */}
        {(initialMeasurement.waistCirc ||
          initialMeasurement.hipCirc ||
          initialMeasurement.chestCirc) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Circunferências</Text>
            <View style={styles.infoGrid}>
              {initialMeasurement.waistCirc && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Cintura</Text>
                  <Text style={styles.infoValue}>
                    {formatValue(initialMeasurement.waistCirc, "cm")}
                  </Text>
                </View>
              )}
              {initialMeasurement.hipCirc && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Quadril</Text>
                  <Text style={styles.infoValue}>
                    {formatValue(initialMeasurement.hipCirc, "cm")}
                  </Text>
                </View>
              )}
              {initialMeasurement.chestCirc && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tórax</Text>
                  <Text style={styles.infoValue}>
                    {formatValue(initialMeasurement.chestCirc, "cm")}
                  </Text>
                </View>
              )}
              {initialMeasurement.abdomenCirc && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Abdômen</Text>
                  <Text style={styles.infoValue}>
                    {formatValue(initialMeasurement.abdomenCirc, "cm")}
                  </Text>
                </View>
              )}
              {initialMeasurement.neckCirc && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Pescoço</Text>
                  <Text style={styles.infoValue}>
                    {formatValue(initialMeasurement.neckCirc, "cm")}
                  </Text>
                </View>
              )}
              {initialMeasurement.forearmCirc && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Antebraço</Text>
                  <Text style={styles.infoValue}>
                    {formatValue(initialMeasurement.forearmCirc, "cm")}
                  </Text>
                </View>
              )}
              {initialMeasurement.thighCirc && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Coxa</Text>
                  <Text style={styles.infoValue}>
                    {formatValue(initialMeasurement.thighCirc, "cm")}
                  </Text>
                </View>
              )}
              {initialMeasurement.calfCirc && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Panturrilha</Text>
                  <Text style={styles.infoValue}>
                    {formatValue(initialMeasurement.calfCirc, "cm")}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Dobras Cutâneas */}
        {(initialMeasurement.tricepsFold ||
          initialMeasurement.subscapularFold ||
          initialMeasurement.suprailiacFold ||
          initialMeasurement.abdominalFold ||
          initialMeasurement.thighFold ||
          initialMeasurement.pectoralFold ||
          initialMeasurement.axillarFold) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dobras Cutâneas</Text>
            <View style={styles.infoGrid}>
              {initialMeasurement.tricepsFold && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tríceps</Text>
                  <Text style={styles.infoValue}>
                    {formatValue(initialMeasurement.tricepsFold, "mm")}
                  </Text>
                </View>
              )}
              {initialMeasurement.subscapularFold && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Subescapular</Text>
                  <Text style={styles.infoValue}>
                    {formatValue(initialMeasurement.subscapularFold, "mm")}
                  </Text>
                </View>
              )}
              {initialMeasurement.suprailiacFold && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Supraíliaca</Text>
                  <Text style={styles.infoValue}>
                    {formatValue(initialMeasurement.suprailiacFold, "mm")}
                  </Text>
                </View>
              )}
              {initialMeasurement.abdominalFold && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Abdominal</Text>
                  <Text style={styles.infoValue}>
                    {formatValue(initialMeasurement.abdominalFold, "mm")}
                  </Text>
                </View>
              )}
              {initialMeasurement.thighFold && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Coxa</Text>
                  <Text style={styles.infoValue}>
                    {formatValue(initialMeasurement.thighFold, "mm")}
                  </Text>
                </View>
              )}
              {initialMeasurement.pectoralFold && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Peitoral</Text>
                  <Text style={styles.infoValue}>
                    {formatValue(initialMeasurement.pectoralFold, "mm")}
                  </Text>
                </View>
              )}
              {initialMeasurement.axillarFold && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Axilar Média</Text>
                  <Text style={styles.infoValue}>
                    {formatValue(initialMeasurement.axillarFold, "mm")}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Observações */}
        {initialMeasurement.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Observações do Nutricionista
            </Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{initialMeasurement.notes}</Text>
            </View>
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={lightTheme.colors.primary} />
            <Text style={styles.loadingText}>Carregando comparação...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: lightTheme.colors.primary,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: lightTheme.colors.white,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: lightTheme.colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    ...lightTheme.shadows.sm,
  },
  dateText: {
    fontSize: 15,
    color: lightTheme.colors.gray[700],
    fontWeight: "500",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: lightTheme.colors.gray[900],
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: lightTheme.colors.white,
    padding: 16,
    borderRadius: 12,
    ...lightTheme.shadows.sm,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeSuccess: {
    backgroundColor: lightTheme.colors.success,
  },
  badgeWarning: {
    backgroundColor: lightTheme.colors.warning,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: lightTheme.colors.white,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: lightTheme.colors.gray[900],
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: lightTheme.colors.gray[600],
  },
  infoGrid: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: 12,
    padding: 16,
    ...lightTheme.shadows.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  infoLabel: {
    fontSize: 14,
    color: lightTheme.colors.gray[600],
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: lightTheme.colors.gray[900],
  },
  notesCard: {
    backgroundColor: lightTheme.colors.white,
    padding: 16,
    borderRadius: 12,
    ...lightTheme.shadows.sm,
  },
  notesText: {
    fontSize: 14,
    color: lightTheme.colors.gray[700],
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: lightTheme.colors.gray[600],
  },
});
