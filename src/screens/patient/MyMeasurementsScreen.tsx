/**
 * MyMeasurementsScreen
 * Feature #4 - App do Paciente
 *
 * Tela para auto-registro de peso e visualização de histórico
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";
import { useAuthStore } from "../../stores/auth.store";
import { useBodyMeasurements } from "../../hooks/useBodyMeasurements";
import type {
  BodyMeasurement,
  CreateBodyMeasurementDto,
} from "../../hooks/useBodyMeasurements";

interface MyMeasurementsScreenProps {
  navigation: any;
}

export function MyMeasurementsScreen({
  navigation,
}: MyMeasurementsScreenProps) {
  const user = useAuthStore((s) => s.user);
  // ID do relacionamento Patient (paciente-nutricionista)
  const patientId = user?.patientProfile?.patients?.[0]?.id;

  const { listMeasurements, createMeasurement } = useBodyMeasurements();

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [measurements, setMeasurements] = React.useState<BodyMeasurement[]>([]);

  // Form state
  const [weight, setWeight] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);

  const fetchMeasurements = async () => {
    if (!patientId) {
      setError("Perfil de paciente não encontrado");
      setLoading(false);
      return;
    }

    try {
      const response = await listMeasurements(patientId, {
        limit: 10,
        sortOrder: "desc",
      });

      // O hook retorna { measurements: [], total, page, limit }
      setMeasurements(response?.measurements || []);
      setError(null);
    } catch (err: any) {
      console.error("❌ [MyMeasurements] Erro ao buscar medições:", err);
      setError(err?.message || "Erro ao carregar medições");
      setMeasurements([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchMeasurements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMeasurements();
  };

  const handleSubmit = async () => {
    if (!weight.trim()) {
      Alert.alert("Atenção", "Informe o peso atual");
      return;
    }

    const weightValue = parseFloat(weight.replace(",", "."));
    if (isNaN(weightValue) || weightValue <= 0 || weightValue > 500) {
      Alert.alert(
        "Atenção",
        "Peso inválido. Informe um valor entre 1 e 500 kg"
      );
      return;
    }

    if (!patientId) {
      Alert.alert("Erro", "Perfil de paciente não encontrado");
      return;
    }

    setSubmitting(true);

    try {
      // Pegar altura da última medição ou usar padrão
      const lastHeight = measurements.length > 0 ? measurements[0].height : 170;

      const data: CreateBodyMeasurementDto = {
        weight: weightValue,
        height: lastHeight,
        notes: notes.trim() || undefined,
      };

      await createMeasurement(patientId, data);

      Alert.alert("Sucesso! 🎉", "Peso registrado com sucesso", [
        {
          text: "OK",
          onPress: () => {
            setWeight("");
            setNotes("");
            setShowForm(false);
            fetchMeasurements();
          },
        },
      ]);
    } catch (err: any) {
      console.error("❌ [MyMeasurements] Erro ao registrar peso:", err);
      Alert.alert("Erro", err?.message || "Erro ao registrar peso");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDifference = (current: number, previous: number) => {
    const diff = current - previous;
    return {
      value: Math.abs(diff).toFixed(1),
      isIncrease: diff > 0,
      isDecrease: diff < 0,
    };
  };

  if (!patientId) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={lightTheme.colors.gray[400]}
          />
          <Text style={styles.errorText}>
            Perfil de paciente não encontrado
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={[lightTheme.colors.primary, lightTheme.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Minhas Medições</Text>
              <Text style={styles.headerSubtitle}>Acompanhe sua evolução</Text>
            </View>
            {measurements.length > 0 && (
              <View style={styles.headerWeightBadge}>
                <Ionicons
                  name="scale-outline"
                  size={20}
                  color={lightTheme.colors.white}
                />
                <Text style={styles.headerWeightValue}>
                  {measurements[0].weight} kg
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[lightTheme.colors.primary]}
              tintColor={lightTheme.colors.primary}
            />
          }
        >
          {/* Add New Weight Button */}
          {!showForm && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowForm(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="add-circle"
                size={24}
                color={lightTheme.colors.white}
              />
              <Text style={styles.addButtonText}>Registrar Novo Peso</Text>
            </TouchableOpacity>
          )}

          {/* Form */}
          {showForm && (
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Registrar Peso</Text>
                <TouchableOpacity onPress={() => setShowForm(false)}>
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={lightTheme.colors.gray[500]}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.formContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Peso (kg) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 75.5"
                    placeholderTextColor={lightTheme.colors.gray[400]}
                    keyboardType="decimal-pad"
                    value={weight}
                    onChangeText={setWeight}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Observações (opcional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Como está se sentindo?"
                    placeholderTextColor={lightTheme.colors.gray[400]}
                    multiline
                    numberOfLines={3}
                    value={notes}
                    onChangeText={setNotes}
                    maxLength={200}
                  />
                  <Text style={styles.characterCount}>{notes.length}/200</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    submitting && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={lightTheme.colors.white} />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={lightTheme.colors.white}
                      />
                      <Text style={styles.submitButtonText}>Salvar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* History */}
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Histórico</Text>

            {loading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="large"
                  color={lightTheme.colors.primary}
                />
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons
                  name="alert-circle-outline"
                  size={48}
                  color={lightTheme.colors.error}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : measurements.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="scale-outline"
                  size={64}
                  color={lightTheme.colors.gray[400]}
                />
                <Text style={styles.emptyText}>Nenhuma medição registrada</Text>
                <Text style={styles.emptySubtext}>
                  Comece registrando seu peso atual
                </Text>
              </View>
            ) : (
              <View style={styles.measurementsList}>
                {Array.isArray(measurements) &&
                  measurements.map((measurement, index) => {
                    const previous = measurements[index + 1];
                    const diff = previous
                      ? calculateDifference(measurement.weight, previous.weight)
                      : null;

                    return (
                      <TouchableOpacity
                        key={measurement.id}
                        style={styles.measurementCard}
                        activeOpacity={0.7}
                        onPress={() =>
                          navigation.navigate("PatientMeasurementDetails", {
                            measurement: measurement,
                          })
                        }
                      >
                        <View style={styles.measurementHighlights}>
                          <View style={styles.measurementHighlight}>
                            <Ionicons
                              name="scale-outline"
                              size={24}
                              color={lightTheme.colors.primary}
                            />
                            <Text style={styles.measurementValue}>
                              {measurement.weight?.toFixed(1) || "--"} kg
                            </Text>
                            <Text style={styles.measurementLabel}>Peso</Text>
                          </View>

                          {measurement.bmi && (
                            <View style={styles.measurementHighlight}>
                              <Ionicons
                                name="analytics-outline"
                                size={24}
                                color={lightTheme.colors.primary}
                              />
                              <Text style={styles.measurementValue}>
                                {measurement.bmi.toFixed(1)}
                              </Text>
                              <Text style={styles.measurementLabel}>IMC</Text>
                            </View>
                          )}

                          {measurement.bodyFatPercent && (
                            <View style={styles.measurementHighlight}>
                              <Ionicons
                                name="water-outline"
                                size={24}
                                color={lightTheme.colors.primary}
                              />
                              <Text style={styles.measurementValue}>
                                {measurement.bodyFatPercent.toFixed(1)}%
                              </Text>
                              <Text style={styles.measurementLabel}>
                                Gordura
                              </Text>
                            </View>
                          )}

                          {measurement.muscleMass && (
                            <View style={styles.measurementHighlight}>
                              <Ionicons
                                name="fitness-outline"
                                size={24}
                                color={lightTheme.colors.primary}
                              />
                              <Text style={styles.measurementValue}>
                                {measurement.muscleMass.toFixed(1)} kg
                              </Text>
                              <Text style={styles.measurementLabel}>
                                Músculo
                              </Text>
                            </View>
                          )}
                        </View>

                        {diff && (
                          <View style={styles.measurementComparison}>
                            <Ionicons
                              name={
                                diff.isIncrease
                                  ? "trending-up"
                                  : "trending-down"
                              }
                              size={16}
                              color={
                                diff.isIncrease
                                  ? lightTheme.colors.warning
                                  : lightTheme.colors.success
                              }
                            />
                            <Text style={styles.measurementComparisonText}>
                              {diff.value} kg desde a última medição
                            </Text>
                          </View>
                        )}

                        <View style={styles.measurementFooter}>
                          <Text style={styles.measurementDate}>
                            {formatDateTime(measurement.createdAt)}
                          </Text>
                          <View style={styles.measurementAction}>
                            <Text style={styles.measurementActionText}>
                              Ver detalhes
                            </Text>
                            <Ionicons
                              name="chevron-forward"
                              size={16}
                              color={lightTheme.colors.primary}
                            />
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[50],
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: lightTheme.colors.white,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: lightTheme.colors.white,
    opacity: 0.9,
  },
  headerWeightBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  headerWeightValue: {
    fontSize: 18,
    fontWeight: "700",
    color: lightTheme.colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: lightTheme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: lightTheme.colors.white,
  },
  formCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: lightTheme.colors.gray[900],
  },
  formContent: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: lightTheme.colors.gray[700],
  },
  input: {
    backgroundColor: lightTheme.colors.gray[50],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: lightTheme.colors.gray[900],
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: 12,
    color: lightTheme.colors.gray[500],
    textAlign: "right",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: lightTheme.colors.success,
    paddingVertical: 14,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: lightTheme.colors.white,
  },
  historySection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: lightTheme.colors.gray[900],
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: lightTheme.colors.gray[700],
    textAlign: "center",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: lightTheme.colors.gray[500],
    textAlign: "center",
  },
  measurementsList: {
    gap: 12,
  },
  measurementCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: 16,
    padding: 20,
    ...lightTheme.shadows.md,
  },
  measurementHighlights: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  measurementHighlight: {
    alignItems: "center",
    flex: 1,
    gap: 4,
  },
  measurementValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: lightTheme.colors.gray[900],
  },
  measurementLabel: {
    fontSize: 11,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
  },
  measurementComparison: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: 8,
  },
  measurementComparisonText: {
    fontSize: 13,
    color: lightTheme.colors.gray[700],
    fontWeight: "500",
  },
  measurementFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[100],
  },
  measurementDate: {
    fontSize: 13,
    color: lightTheme.colors.gray[600],
  },
  measurementAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  measurementActionText: {
    fontSize: 13,
    color: lightTheme.colors.primary,
    fontWeight: "600",
  },
  measurementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: lightTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  measurementIconPatient: {
    backgroundColor: lightTheme.colors.success,
  },
});
