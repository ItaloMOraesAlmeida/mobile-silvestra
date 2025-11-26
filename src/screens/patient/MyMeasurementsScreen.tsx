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
import { bodyMeasurementsService } from "../../services/patient-details.service";
import type {
  BodyMeasurement,
  CreateBodyMeasurementDto,
} from "../../types/patient-details.types";

interface MyMeasurementsScreenProps {
  navigation: any;
}

export function MyMeasurementsScreen({
  navigation,
}: MyMeasurementsScreenProps) {
  const user = useAuthStore((s) => s.user);
  const patientId = user?.patientProfile?.id;

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [measurements, setMeasurements] = React.useState<BodyMeasurement[]>([]);
  const [latest, setLatest] = React.useState<BodyMeasurement | null>(null);

  // Form state
  const [weight, setWeight] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);

  const fetchMeasurements = React.useCallback(async () => {
    if (!patientId) {
      setError("Perfil de paciente não encontrado");
      setLoading(false);
      return;
    }

    try {
      const response = await bodyMeasurementsService.findAll(patientId, {
        limit: 10,
        sortOrder: "desc",
      });

      setMeasurements(response.data || []);

      try {
        const latestData = await bodyMeasurementsService.findLatest(patientId);
        setLatest(latestData);
      } catch {
        // Sem medições ainda
        setLatest(null);
      }

      setError(null);
    } catch (err: any) {
      console.error("Erro ao buscar medições:", err);
      setError(err?.response?.data?.message || "Erro ao carregar medições");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  React.useEffect(() => {
    fetchMeasurements();
  }, [fetchMeasurements]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchMeasurements();
  }, [fetchMeasurements]);

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
      const data: CreateBodyMeasurementDto = {
        weight: weightValue,
        height: latest?.height || 170, // Usa altura da última medição ou padrão
        notes: notes.trim() || undefined,
      };

      await bodyMeasurementsService.create(patientId, data);

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
      console.error("Erro ao registrar peso:", err);
      Alert.alert(
        "Erro",
        err?.response?.data?.message || "Erro ao registrar peso"
      );
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
            <View>
              <Text style={styles.headerTitle}>Minhas Medições</Text>
              <Text style={styles.headerSubtitle}>Acompanhe sua evolução</Text>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons
                name="analytics-outline"
                size={32}
                color={lightTheme.colors.white}
              />
            </View>
          </View>

          {/* Latest Weight Card */}
          {latest && (
            <View style={styles.latestCard}>
              <Text style={styles.latestLabel}>Peso Atual</Text>
              <Text style={styles.latestValue}>{latest.weight} kg</Text>
              <Text style={styles.latestDate}>
                {formatDate(latest.createdAt)}
              </Text>
            </View>
          )}
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
                {measurements.map((measurement, index) => {
                  const previous = measurements[index + 1];
                  const diff = previous
                    ? calculateDifference(measurement.weight, previous.weight)
                    : null;

                  return (
                    <View key={measurement.id} style={styles.measurementCard}>
                      <View style={styles.measurementHeader}>
                        <View style={styles.measurementIcon}>
                          <Ionicons
                            name="scale-outline"
                            size={24}
                            color={lightTheme.colors.white}
                          />
                        </View>
                        <View style={styles.measurementInfo}>
                          <View style={styles.measurementTitleRow}>
                            <Text style={styles.measurementWeight}>
                              {measurement.weight} kg
                            </Text>
                            {diff && (
                              <View
                                style={[
                                  styles.diffBadge,
                                  diff.isIncrease && styles.diffBadgeIncrease,
                                  diff.isDecrease && styles.diffBadgeDecrease,
                                ]}
                              >
                                <Ionicons
                                  name={
                                    diff.isIncrease
                                      ? "trending-up"
                                      : "trending-down"
                                  }
                                  size={12}
                                  color={
                                    diff.isIncrease
                                      ? lightTheme.colors.error
                                      : lightTheme.colors.success
                                  }
                                />
                                <Text
                                  style={[
                                    styles.diffText,
                                    diff.isIncrease && styles.diffTextIncrease,
                                    diff.isDecrease && styles.diffTextDecrease,
                                  ]}
                                >
                                  {diff.value} kg
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.measurementDate}>
                            {formatDateTime(measurement.createdAt)}
                          </Text>
                        </View>
                      </View>

                      {measurement.notes && (
                        <Text style={styles.measurementNotes}>
                          {measurement.notes}
                        </Text>
                      )}
                    </View>
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
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: lightTheme.colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: lightTheme.colors.white,
    opacity: 0.9,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  latestCard: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  latestLabel: {
    fontSize: 14,
    color: lightTheme.colors.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  latestValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: lightTheme.colors.white,
    marginBottom: 4,
  },
  latestDate: {
    fontSize: 13,
    color: lightTheme.colors.white,
    opacity: 0.8,
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
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  measurementHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  measurementInfo: {
    flex: 1,
  },
  measurementTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  measurementWeight: {
    fontSize: 20,
    fontWeight: "bold",
    color: lightTheme.colors.gray[900],
  },
  diffBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  diffBadgeIncrease: {
    backgroundColor: lightTheme.colors.error + "20",
  },
  diffBadgeDecrease: {
    backgroundColor: lightTheme.colors.success + "20",
  },
  diffText: {
    fontSize: 12,
    fontWeight: "600",
  },
  diffTextIncrease: {
    color: lightTheme.colors.error,
  },
  diffTextDecrease: {
    color: lightTheme.colors.success,
  },
  measurementDate: {
    fontSize: 14,
    color: lightTheme.colors.gray[600],
    marginBottom: 2,
  },
  measurementRegisteredBy: {
    fontSize: 12,
    color: lightTheme.colors.gray[500],
    fontStyle: "italic",
  },
  measurementNotes: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[200],
    fontSize: 14,
    color: lightTheme.colors.gray[600],
    lineHeight: 20,
  },
});
