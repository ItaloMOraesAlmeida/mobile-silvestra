import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import {
  getWaterSettings,
  updateWaterSettings,
} from "../../services/water/waterService";
import { UpdateWaterSettingsDto } from "../../types/water";
import { lightTheme } from "../../theme";
import {
  requestNotificationPermissions,
  scheduleWaterReminders,
  cancelAllWaterReminders,
  setupNotificationCategories,
} from "../../services/water/notifications";

export default function WaterSettingsScreen() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dailyGoal, setDailyGoal] = useState("2000");
  const [cupSize, setCupSize] = useState("250");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("22:00");
  const [interval, setInterval] = useState("90");
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getWaterSettings();

      setDailyGoal(data.dailyGoal.toString());
      setCupSize(data.cupSize.toString());
      setStartTime(data.startTime);
      setEndTime(data.endTime);
      setInterval(data.interval.toString());
      setRemindersEnabled(data.remindersEnabled);
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      Alert.alert("Erro", "Não foi possível carregar as configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validações
    const goalNum = parseInt(dailyGoal);
    if (isNaN(goalNum) || goalNum < 500 || goalNum > 5000) {
      Alert.alert("Erro", "Meta diária deve estar entre 500ml e 5000ml");
      return;
    }

    const cupNum = parseInt(cupSize);
    if (isNaN(cupNum) || cupNum < 100 || cupNum > 1000) {
      Alert.alert("Erro", "Tamanho do copo deve estar entre 100ml e 1000ml");
      return;
    }

    const intervalNum = parseInt(interval);
    if (isNaN(intervalNum) || intervalNum < 30 || intervalNum > 480) {
      Alert.alert("Erro", "Intervalo deve estar entre 30 e 480 minutos");
      return;
    }

    // Validar formato de horário (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      Alert.alert("Erro", "Formato de horário inválido (use HH:mm)");
      return;
    }

    setSaving(true);
    try {
      const dto: UpdateWaterSettingsDto = {
        dailyGoal: goalNum,
        cupSize: cupNum,
        startTime,
        endTime,
        interval: intervalNum,
        remindersEnabled,
      };

      await updateWaterSettings(dto);

      // Configurar notificações
      if (remindersEnabled) {
        const hasPermission = await requestNotificationPermissions();

        if (hasPermission) {
          // Configurar categorias (Quick Actions)
          await setupNotificationCategories();

          // Agendar lembretes
          await scheduleWaterReminders(startTime, endTime, intervalNum);

          Alert.alert("Sucesso", "Configurações salvas e lembretes agendados!");
        } else {
          Alert.alert(
            "Aviso",
            "Configurações salvas, mas você precisa permitir notificações nas configurações do dispositivo para receber lembretes."
          );
        }
      } else {
        // Cancelar todos os lembretes
        await cancelAllWaterReminders();
        Alert.alert("Sucesso", "Configurações salvas e lembretes cancelados");
      }

      navigation.goBack();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      Alert.alert("Erro", "Não foi possível salvar as configurações");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={lightTheme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Goal Settings Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Ionicons
                name="flag"
                size={20}
                color={lightTheme.colors.primary}
              />
            </View>
            <Text style={styles.cardTitle}>Metas de Consumo</Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Meta Diária</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={dailyGoal}
                onChangeText={setDailyGoal}
                keyboardType="numeric"
                placeholder="2000"
                placeholderTextColor={lightTheme.colors.textSecondary}
              />
              <Text style={styles.inputUnit}>ml</Text>
            </View>
            <Text style={styles.hint}>Recomendado: 2000ml - 2500ml</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Tamanho do Copo Padrão</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={cupSize}
                onChangeText={setCupSize}
                keyboardType="numeric"
                placeholder="250"
                placeholderTextColor={lightTheme.colors.textSecondary}
              />
              <Text style={styles.inputUnit}>ml</Text>
            </View>
            <Text style={styles.hint}>
              Usado nos botões de adicionar rapidamente
            </Text>
          </View>
        </View>

        {/* Reminders Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Ionicons
                name="notifications"
                size={20}
                color={lightTheme.colors.primary}
              />
            </View>
            <Text style={styles.cardTitle}>Lembretes</Text>
          </View>

          <View style={styles.switchContainer}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Ativar Lembretes</Text>
              <Text style={styles.switchSubtext}>
                Receber notificações para beber água
              </Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={setRemindersEnabled}
              trackColor={{
                false: lightTheme.colors.gray[300],
                true: lightTheme.colors.primary,
              }}
              thumbColor="#FFF"
              ios_backgroundColor={lightTheme.colors.gray[300]}
            />
          </View>

          {remindersEnabled && (
            <>
              <View style={styles.divider} />

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Horário de Início</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={lightTheme.colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="08:00"
                    placeholderTextColor={lightTheme.colors.textSecondary}
                  />
                </View>
                <Text style={styles.hint}>Formato: HH:mm (ex: 08:00)</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Horário de Término</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={lightTheme.colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="22:00"
                    placeholderTextColor={lightTheme.colors.textSecondary}
                  />
                </View>
                <Text style={styles.hint}>Formato: HH:mm (ex: 22:00)</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>
                  Intervalo entre Lembretes
                </Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={interval}
                    onChangeText={setInterval}
                    keyboardType="numeric"
                    placeholder="90"
                    placeholderTextColor={lightTheme.colors.textSecondary}
                  />
                  <Text style={styles.inputUnit}>minutos</Text>
                </View>
                <Text style={styles.hint}>
                  Intervalo recomendado: 60 - 120 minutos
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[lightTheme.colors.primary, lightTheme.colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButtonGradient}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                <Text style={styles.saveButtonText}>Salvar Configurações</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    backgroundColor: lightTheme.colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
    ...lightTheme.shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${lightTheme.colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: lightTheme.colors.text,
  },
  settingItem: {
    marginBottom: 0,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: lightTheme.colors.text,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: lightTheme.colors.text,
    padding: 0,
  },
  inputUnit: {
    fontSize: 14,
    fontWeight: "500",
    color: lightTheme.colors.textSecondary,
  },
  hint: {
    fontSize: 12,
    color: lightTheme.colors.textSecondary,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: lightTheme.colors.border,
    marginVertical: 20,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.text,
    marginBottom: 4,
  },
  switchSubtext: {
    fontSize: 14,
    color: lightTheme.colors.textSecondary,
  },
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
    ...lightTheme.shadows.md,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomSpacing: {
    height: 32,
  },
});
