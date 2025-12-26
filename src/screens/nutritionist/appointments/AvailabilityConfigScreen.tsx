import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { availabilityService } from "../../../services/appointments";
import { CreateAvailabilityConfigDto } from "../../../types/appointments";

export default function AvailabilityConfigScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);

  // Form state
  const [defaultDuration, setDefaultDuration] = useState("60");
  const [bufferTime, setBufferTime] = useState("0");
  const [allowSameDay, setAllowSameDay] = useState(false);
  const [minAdvanceHours, setMinAdvanceHours] = useState("24");
  const [maxAdvanceDays, setMaxAdvanceDays] = useState("90");
  const [cancellationPolicy, setCancellationPolicy] = useState("");

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await availabilityService.getConfig();
      const data = (response as any)?.data || response;

      // Preenche o formulário com os dados existentes
      setDefaultDuration(String(data.defaultDuration));
      setBufferTime(String(data.bufferTime));
      setAllowSameDay(data.allowSameDay);
      setMinAdvanceHours(String(data.minAdvanceHours));
      setMaxAdvanceDays(String(data.maxAdvanceDays));
      setCancellationPolicy(data.cancellationPolicy || "");
      setHasConfig(true);
    } catch (error: any) {
      // Se não existir configuração, mantém os valores padrão
      setHasConfig(false);
      if (!error.message.includes("não encontrada")) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validações
      const duration = parseInt(defaultDuration);
      if (isNaN(duration) || duration < 15 || duration > 240) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Duração padrão deve estar entre 15 e 240 minutos",
        });
        return;
      }

      const buffer = parseInt(bufferTime);
      if (isNaN(buffer) || buffer < 0 || buffer > 120) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Tempo de intervalo deve estar entre 0 e 120 minutos",
        });
        return;
      }

      const minHours = parseInt(minAdvanceHours);
      if (isNaN(minHours) || minHours < 0 || minHours > 168) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Antecedência mínima deve estar entre 0 e 168 horas",
        });
        return;
      }

      const maxDays = parseInt(maxAdvanceDays);
      if (isNaN(maxDays) || maxDays < 1 || maxDays > 365) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Antecedência máxima deve estar entre 1 e 365 dias",
        });
        return;
      }

      setSaving(true);

      const data: CreateAvailabilityConfigDto = {
        defaultDuration: duration,
        bufferTime: buffer,
        allowSameDay,
        minAdvanceHours: minHours,
        maxAdvanceDays: maxDays,
        cancellationPolicy: cancellationPolicy || undefined,
      };

      await availabilityService.createOrUpdateConfig(data);
      setHasConfig(true);
      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: "Configuração salva com sucesso!",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando configuração...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configurações Gerais</Text>

            <View style={styles.field}>
              <Text style={styles.label}>
                Duração padrão da consulta (minutos)
              </Text>
              <TextInput
                style={styles.input}
                value={defaultDuration}
                onChangeText={setDefaultDuration}
                keyboardType="numeric"
                placeholder="60"
              />
              <Text style={styles.hint}>Entre 15 e 240 minutos</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>
                Intervalo entre consultas (minutos)
              </Text>
              <TextInput
                style={styles.input}
                value={bufferTime}
                onChangeText={setBufferTime}
                keyboardType="numeric"
                placeholder="0"
              />
              <Text style={styles.hint}>Entre 0 e 120 minutos</Text>
            </View>

            <View style={styles.switchField}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.label}>
                  Permitir agendamento no mesmo dia
                </Text>
                <Text style={styles.hint}>
                  Se desativado, pacientes não podem agendar para hoje
                </Text>
              </View>
              <Switch
                value={allowSameDay}
                onValueChange={setAllowSameDay}
                trackColor={{ false: "#767577", true: "#81C784" }}
                thumbColor={allowSameDay ? "#4CAF50" : "#f4f3f4"}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Antecedência mínima (horas)</Text>
              <TextInput
                style={styles.input}
                value={minAdvanceHours}
                onChangeText={setMinAdvanceHours}
                keyboardType="numeric"
                placeholder="24"
              />
              <Text style={styles.hint}>
                Tempo mínimo necessário antes da consulta (0-168 horas)
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Antecedência máxima (dias)</Text>
              <TextInput
                style={styles.input}
                value={maxAdvanceDays}
                onChangeText={setMaxAdvanceDays}
                keyboardType="numeric"
                placeholder="90"
              />
              <Text style={styles.hint}>
                Até quantos dias no futuro pode agendar (1-365 dias)
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Política de Cancelamento</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Política (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={cancellationPolicy}
                onChangeText={setCancellationPolicy}
                multiline
                numberOfLines={4}
                placeholder="Ex: Cancelamentos devem ser feitos com pelo menos 24h de antecedência..."
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar Configurações</Text>
            )}
          </TouchableOpacity>

          {hasConfig && (
            <View style={styles.navigationSection}>
              <Text style={styles.navigationTitle}>Próximos Passos</Text>
              <Text style={styles.navigationSubtitle}>
                Configure seus horários de atendimento e períodos bloqueados
              </Text>

              <TouchableOpacity
                style={styles.navigationButton}
                onPress={() => navigation.navigate("WeeklySchedule" as never)}
              >
                <View style={styles.navigationButtonContent}>
                  <Ionicons name="time-outline" size={24} color="#8b5a9f" />
                  <View style={styles.navigationButtonText}>
                    <Text style={styles.navigationButtonTitle}>
                      Horários Semanais
                    </Text>
                    <Text style={styles.navigationButtonDescription}>
                      Defina os dias e horários que você atende
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#999" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navigationButton}
                onPress={() => navigation.navigate("BlockedPeriods" as never)}
              >
                <View style={styles.navigationButtonContent}>
                  <Ionicons
                    name="close-circle-outline"
                    size={24}
                    color="#8b5a9f"
                  />
                  <View style={styles.navigationButtonText}>
                    <Text style={styles.navigationButtonTitle}>
                      Períodos Bloqueados
                    </Text>
                    <Text style={styles.navigationButtonDescription}>
                      Bloqueie férias, feriados e outros períodos
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#999" />
                </View>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  hint: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  switchField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  navigationSection: {
    backgroundColor: "#fff",
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
  },
  navigationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  navigationSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  navigationButton: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  navigationButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  navigationButtonText: {
    flex: 1,
    marginLeft: 12,
  },
  navigationButtonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  navigationButtonDescription: {
    fontSize: 13,
    color: "#666",
  },
});
