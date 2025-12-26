import { useEffect, useCallback } from "react";
import * as Notifications from "expo-notifications";

import {
  requestNotificationPermissions,
  scheduleWaterReminders,
  cancelAllWaterReminders,
  setupNotificationCategories,
} from "../../services/water/notifications";
import {
  registerBackgroundTask,
  setupNotificationResponseHandler,
  setupNotificationReceivedHandler,
} from "../../services/water/notifications/backgroundService";
import { createWaterLogOffline } from "../../services/water/offlineService";

interface WaterReminderConfig {
  enabled: boolean;
  startTime: string;
  endTime: string;
  interval: number;
}

/**
 * Hook para gerenciar sistema de lembretes de água
 */
export const useWaterReminders = (onWaterAdded?: () => void) => {
  useEffect(() => {
    // Configurar handler de notificações
    setupNotificationCategories();
    setupNotificationReceivedHandler();

    // Handler para Quick Actions
    const handleQuickAdd = async (amount: number) => {
      try {
        await createWaterLogOffline(amount);
        console.log(`[Quick Action] Adicionado ${amount}ml`);

        // Callback opcional
        if (onWaterAdded) {
          onWaterAdded();
        }

        // Mostrar notificação de sucesso
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "✅ Água registrada!",
            body: `${amount}ml adicionado ao seu consumo diário`,
            sound: "default",
            data: { type: "success" },
          },
          trigger: null,
        });
      } catch (error) {
        console.error("[Quick Action] Erro ao adicionar água:", error);
      }
    };

    setupNotificationResponseHandler(handleQuickAdd);

    // Registrar tarefa de background
    registerBackgroundTask().catch(console.error);

    // Cleanup
    return () => {
      // Não cancelar tarefas no unmount para manter funcionando
    };
  }, [onWaterAdded]);

  /**
   * Configurar lembretes
   */
  const configureReminders = useCallback(
    async (config: WaterReminderConfig): Promise<boolean> => {
      try {
        if (config.enabled) {
          // Solicitar permissões
          const hasPermission = await requestNotificationPermissions();
          if (!hasPermission) {
            console.log("[Reminders] Permissão negada");
            return false;
          }

          // Configurar categorias
          await setupNotificationCategories();

          // Agendar lembretes
          const notificationIds = await scheduleWaterReminders(
            config.startTime,
            config.endTime,
            config.interval
          );

          console.log(
            `[Reminders] ${notificationIds.length} lembretes agendados`
          );
          return true;
        } else {
          // Cancelar todos os lembretes
          await cancelAllWaterReminders();
          console.log("[Reminders] Todos os lembretes cancelados");
          return true;
        }
      } catch (error) {
        console.error("[Reminders] Erro ao configurar:", error);
        return false;
      }
    },
    []
  );

  /**
   * Cancelar todos os lembretes
   */
  const cancelReminders = useCallback(async (): Promise<void> => {
    await cancelAllWaterReminders();
  }, []);

  /**
   * Verificar permissões
   */
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  }, []);

  return {
    configureReminders,
    cancelReminders,
    checkPermissions,
  };
};
