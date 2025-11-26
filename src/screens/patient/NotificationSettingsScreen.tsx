import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import type { MainDrawerParamList } from "../../navigation/MainDrawerNavigator";
import { useNotificationStore } from "../../stores/notification.store";
import { useNotifications } from "../../hooks/useNotifications";
import type {
  NotificationPreferences,
  NotificationFrequency,
} from "../../types/notification.types";
import {
  WEEKDAY_LABELS,
  FREQUENCY_LABELS,
} from "../../types/notification.types";

type NotificationSettingsRouteProp = RouteProp<
  MainDrawerParamList,
  "NotificationSettings"
>;
type NotificationSettingsNavigationProp = DrawerNavigationProp<
  MainDrawerParamList,
  "NotificationSettings"
>;

/**
 * Tela de configurações de notificações por paciente
 */
export const NotificationSettingsScreen: React.FC = () => {
  const route = useRoute<NotificationSettingsRouteProp>();
  const navigation = useNavigation<NotificationSettingsNavigationProp>();

  const { patientId } = route.params;
  const { getPreferences, setPreferences, resetPreferences } =
    useNotificationStore();
  const { schedulePatientNotifications, sendTestNotification } =
    useNotifications();

  const [preferences, setLocalPreferences] = useState<NotificationPreferences>(
    getPreferences(patientId)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [showWeekdayPicker, setShowWeekdayPicker] = useState(false);

  // Carrega preferências ao montar
  useEffect(() => {
    setLocalPreferences(getPreferences(patientId));
  }, [patientId, getPreferences]);

  /**
   * Salva as preferências
   */
  const handleSave = React.useCallback(async () => {
    try {
      setIsSaving(true);

      // Salva na store
      setPreferences(patientId, preferences);

      // Reagenda notificações
      await schedulePatientNotifications(patientId, preferences);

      Alert.alert(
        "Sucesso",
        "Configurações de notificações salvas com sucesso!"
      );

      navigation.goBack();
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      Alert.alert(
        "Erro",
        "Não foi possível salvar as configurações de notificações."
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    patientId,
    preferences,
    setPreferences,
    schedulePatientNotifications,
    navigation,
  ]);

  /**
   * Reseta para configurações padrão
   */
  const handleReset = React.useCallback(() => {
    Alert.alert(
      "Resetar Configurações",
      "Deseja restaurar as configurações padrão de notificações?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Resetar",
          style: "destructive",
          onPress: () => {
            resetPreferences(patientId);
            setLocalPreferences(getPreferences(patientId));
          },
        },
      ]
    );
  }, [patientId, resetPreferences, getPreferences]);

  /**
   * Envia notificação de teste
   */
  const handleTestNotification = React.useCallback(async () => {
    try {
      await sendTestNotification();
      Alert.alert(
        "Notificação Enviada",
        "Você receberá uma notificação de teste em alguns segundos."
      );
    } catch (error) {
      console.error("Error sending test notification:", error);
      Alert.alert("Erro", "Não foi possível enviar a notificação de teste.");
    }
  }, [sendTestNotification]);

  /**
   * Atualiza uma preferência específica
   */
  const updatePreference = React.useCallback(
    <K extends keyof NotificationPreferences>(
      key: K,
      value: NotificationPreferences[K]
    ) => {
      setLocalPreferences((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Global Enable */}
        <View className="bg-white mt-4 px-4 py-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-base font-semibold text-gray-900">
                Habilitar Notificações
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                Receber lembretes e alertas no aplicativo
              </Text>
            </View>
            <Switch
              value={preferences.enabled}
              onValueChange={(value) => updatePreference("enabled", value)}
              trackColor={{ false: "#d1d5db", true: "#10b981" }}
              thumbColor="#ffffff"
              accessibilityLabel="Habilitar notificações"
              accessibilityHint="Ativa ou desativa todas as notificações do aplicativo"
              accessibilityRole="switch"
            />
          </View>
        </View>

        {/* Measurement Reminder Section */}
        <View className="bg-white mt-4">
          <View className="px-4 py-3 border-b border-gray-100">
            <Text className="text-lg font-semibold text-gray-900">
              📏 Lembrete de Medição
            </Text>
          </View>

          {/* Enable Measurement Reminder */}
          <View className="px-4 py-4 border-b border-gray-100">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-base font-medium text-gray-900">
                  Ativar Lembretes
                </Text>
                <Text className="text-sm text-gray-600 mt-1">
                  Receber lembretes para registrar medidas
                </Text>
              </View>
              <Switch
                value={preferences.measurementReminder.enabled}
                onValueChange={(value) =>
                  updatePreference("measurementReminder", {
                    ...preferences.measurementReminder,
                    enabled: value,
                  })
                }
                disabled={!preferences.enabled}
                trackColor={{ false: "#d1d5db", true: "#10b981" }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {/* Frequency */}
          <TouchableOpacity
            className="px-4 py-4 border-b border-gray-100 flex-row items-center justify-between"
            onPress={() => setShowFrequencyPicker(!showFrequencyPicker)}
            disabled={
              !preferences.enabled || !preferences.measurementReminder.enabled
            }
          >
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-900">
                Frequência
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                {FREQUENCY_LABELS[preferences.measurementReminder.frequency]}
              </Text>
            </View>
            <Ionicons
              name={showFrequencyPicker ? "chevron-up" : "chevron-down"}
              size={20}
              color="#6b7280"
            />
          </TouchableOpacity>

          {showFrequencyPicker && (
            <View className="px-4 py-2 bg-gray-50">
              {(Object.keys(FREQUENCY_LABELS) as NotificationFrequency[]).map(
                (freq) => (
                  <TouchableOpacity
                    key={freq}
                    className="py-3 flex-row items-center"
                    onPress={() => {
                      updatePreference("measurementReminder", {
                        ...preferences.measurementReminder,
                        frequency: freq,
                      });
                      setShowFrequencyPicker(false);
                    }}
                  >
                    <Ionicons
                      name={
                        preferences.measurementReminder.frequency === freq
                          ? "radio-button-on"
                          : "radio-button-off"
                      }
                      size={20}
                      color={
                        preferences.measurementReminder.frequency === freq
                          ? "#10b981"
                          : "#9ca3af"
                      }
                    />
                    <Text className="text-base text-gray-900 ml-3">
                      {FREQUENCY_LABELS[freq]}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          )}

          {/* Weekday */}
          <TouchableOpacity
            className="px-4 py-4 border-b border-gray-100 flex-row items-center justify-between"
            onPress={() => setShowWeekdayPicker(!showWeekdayPicker)}
            disabled={
              !preferences.enabled || !preferences.measurementReminder.enabled
            }
          >
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-900">
                Dia da Semana
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                {WEEKDAY_LABELS[preferences.measurementReminder.weekday - 1]}
              </Text>
            </View>
            <Ionicons
              name={showWeekdayPicker ? "chevron-up" : "chevron-down"}
              size={20}
              color="#6b7280"
            />
          </TouchableOpacity>

          {showWeekdayPicker && (
            <View className="px-4 py-2 bg-gray-50">
              {WEEKDAY_LABELS.map((day, index) => (
                <TouchableOpacity
                  key={day}
                  className="py-3 flex-row items-center"
                  onPress={() => {
                    updatePreference("measurementReminder", {
                      ...preferences.measurementReminder,
                      weekday: index + 1,
                    });
                    setShowWeekdayPicker(false);
                  }}
                >
                  <Ionicons
                    name={
                      preferences.measurementReminder.weekday === index + 1
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={20}
                    color={
                      preferences.measurementReminder.weekday === index + 1
                        ? "#10b981"
                        : "#9ca3af"
                    }
                  />
                  <Text className="text-base text-gray-900 ml-3">{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Time */}
          <View className="px-4 py-4">
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-900">
                Horário
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                {String(preferences.measurementReminder.hour).padStart(2, "0")}:
                {String(preferences.measurementReminder.minute).padStart(
                  2,
                  "0"
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* Goal Alerts Section */}
        <View className="bg-white mt-4">
          <View className="px-4 py-3 border-b border-gray-100">
            <Text className="text-lg font-semibold text-gray-900">
              🎯 Alertas de Metas
            </Text>
          </View>

          <View className="px-4 py-4 border-b border-gray-100">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-base font-medium text-gray-900">
                  Ativar Alertas
                </Text>
                <Text className="text-sm text-gray-600 mt-1">
                  Receber avisos quando meta estiver próxima do prazo
                </Text>
              </View>
              <Switch
                value={preferences.goalAlerts.enabled}
                onValueChange={(value) =>
                  updatePreference("goalAlerts", {
                    ...preferences.goalAlerts,
                    enabled: value,
                  })
                }
                disabled={!preferences.enabled}
                trackColor={{ false: "#d1d5db", true: "#10b981" }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          <View className="px-4 py-4">
            <Text className="text-base font-medium text-gray-900">
              Dias antes do prazo
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              {preferences.goalAlerts.daysBeforeDeadline} dias
            </Text>
          </View>
        </View>

        {/* Celebrations Section */}
        <View className="bg-white mt-4 mb-4">
          <View className="px-4 py-3 border-b border-gray-100">
            <Text className="text-lg font-semibold text-gray-900">
              🎉 Celebrações
            </Text>
          </View>

          <View className="px-4 py-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-base font-medium text-gray-900">
                  Ativar Celebrações
                </Text>
                <Text className="text-sm text-gray-600 mt-1">
                  Receber notificação ao alcançar uma meta
                </Text>
              </View>
              <Switch
                value={preferences.celebrations.enabled}
                onValueChange={(value) =>
                  updatePreference("celebrations", {
                    ...preferences.celebrations,
                    enabled: value,
                  })
                }
                disabled={!preferences.enabled}
                trackColor={{ false: "#d1d5db", true: "#10b981" }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Test Notification Button */}
        <View className="px-4 mb-6">
          <TouchableOpacity
            className="bg-blue-500 py-3 px-4 rounded-lg flex-row items-center justify-center"
            onPress={handleTestNotification}
            disabled={!preferences.enabled}
          >
            <Ionicons name="notifications-outline" size={20} color="#ffffff" />
            <Text className="text-white font-semibold text-base ml-2">
              Enviar Notificação de Teste
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="bg-white border-t border-gray-200 px-4 py-3">
        <View className="flex-row gap-3">
          {/* Reset Button */}
          <TouchableOpacity
            className="flex-1 py-3 px-4 rounded-lg bg-gray-200"
            onPress={handleReset}
            disabled={isSaving}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="refresh" size={20} color="#4b5563" />
              <Text className="text-gray-700 font-semibold text-base ml-2">
                Resetar
              </Text>
            </View>
          </TouchableOpacity>

          {/* Save Button */}
          <TouchableOpacity
            className={`flex-1 py-3 px-4 rounded-lg ${
              isSaving ? "bg-gray-400" : "bg-green-500"
            }`}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text className="text-white font-semibold text-center text-base">
              {isSaving ? "Salvando..." : "Salvar"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
