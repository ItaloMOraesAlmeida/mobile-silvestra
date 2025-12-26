import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { createWaterLogOffline, syncPendingData } from "../offlineService";
import { scheduleWaterReminder } from "./notificationService";

const BACKGROUND_FETCH_TASK = "WATER_BACKGROUND_SYNC";
const TASK_INTERVAL = 60 * 15; // 15 minutos

/**
 * Definir tarefa em background para sincronização
 */
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log("[Background] Iniciando sincronização de água...");

    // Sincronizar dados pendentes
    const syncResult = await syncPendingData();
    console.log("[Background] Sincronização concluída:", syncResult);

    // Verificar se precisa agendar novos lembretes
    await checkAndScheduleReminders();

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("[Background] Erro na tarefa:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Registrar tarefa de background
 */
export const registerBackgroundTask = async (): Promise<void> => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_FETCH_TASK
    );

    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: TASK_INTERVAL,
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log("[Background] Tarefa registrada com sucesso");
    } else {
      console.log("[Background] Tarefa já estava registrada");
    }
  } catch (error) {
    console.error("[Background] Erro ao registrar tarefa:", error);
  }
};

/**
 * Cancelar tarefa de background
 */
export const unregisterBackgroundTask = async (): Promise<void> => {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log("[Background] Tarefa cancelada");
  } catch (error) {
    console.error("[Background] Erro ao cancelar tarefa:", error);
  }
};

/**
 * Verificar status da tarefa
 */
export const getBackgroundTaskStatus = async (): Promise<any> => {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_FETCH_TASK
  );
  const status = await BackgroundFetch.getStatusAsync();

  return {
    isRegistered,
    status,
    statusText:
      status === BackgroundFetch.BackgroundFetchStatus.Available
        ? "Disponível"
        : status === BackgroundFetch.BackgroundFetchStatus.Denied
        ? "Negado"
        : "Restrito",
  };
};

/**
 * Verificar e agendar lembretes se necessário
 */
const checkAndScheduleReminders = async (): Promise<void> => {
  try {
    // Buscar configurações do AsyncStorage
    const settingsStr = await AsyncStorage.getItem("@silvestra:water_settings");
    if (!settingsStr) return;

    const settings = JSON.parse(settingsStr);
    if (!settings.remindersEnabled) return;

    // Verificar se há lembretes agendados
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const waterReminders = scheduled.filter(
      (n) => n.content.data?.type === "water_reminder"
    );

    // Se não há lembretes, reagendar
    if (waterReminders.length === 0) {
      console.log("[Background] Reagendando lembretes...");
      // Aqui você pode chamar o serviço de agendamento
      // scheduleWaterReminders(settings.startTime, settings.endTime, settings.interval);
    }
  } catch (error) {
    console.error("[Background] Erro ao verificar lembretes:", error);
  }
};

/**
 * Handler para resposta de notificação em background
 */
export const setupNotificationResponseHandler = (
  onQuickAdd: (amount: number) => Promise<void>
): void => {
  Notifications.addNotificationResponseReceivedListener(async (response) => {
    const actionIdentifier = response.actionIdentifier;

    console.log("[Notification] Ação recebida:", actionIdentifier);

    // Quick Actions
    if (actionIdentifier === "QUICK_ADD_200") {
      await createWaterLogOffline(200);
      await onQuickAdd(200);
    } else if (actionIdentifier === "QUICK_ADD_500") {
      await createWaterLogOffline(500);
      await onQuickAdd(500);
    } else if (actionIdentifier === "SNOOZE_30") {
      // Agendar novo lembrete em 30 minutos
      await scheduleWaterReminder(
        1800,
        "💧 Lembrete adiado",
        "Você pediu para ser lembrado!"
      );
    }
  });
};

/**
 * Handler para notificações recebidas enquanto app está aberto
 */
export const setupNotificationReceivedHandler = (): void => {
  Notifications.addNotificationReceivedListener((notification) => {
    console.log("[Notification] Notificação recebida:", notification);
    // Aqui você pode adicionar lógica customizada
    // Por exemplo, atualizar badge, mostrar toast, etc.
  });
};

/**
 * Limpar todas as notificações do centro de notificações
 */
export const clearNotificationBadge = async (): Promise<void> => {
  await Notifications.setBadgeCountAsync(0);
  await Notifications.dismissAllNotificationsAsync();
};
