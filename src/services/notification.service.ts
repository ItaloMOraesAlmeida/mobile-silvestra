import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type {
  NotificationData,
  NotificationType,
  NotificationTrigger,
  NotificationPreferences,
} from "../types/notification.types";

/**
 * Configuração de como as notificações devem ser exibidas
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Serviço de gerenciamento de notificações locais
 */
class NotificationService {
  /**
   * Solicita permissões para notificações
   * @returns true se permissão foi concedida
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === "granted";
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      return false;
    }
  }

  /**
   * Verifica se permissões foram concedidas
   */
  async hasPermissions(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  }

  /**
   * Agenda uma notificação
   */
  async scheduleNotification(
    type: NotificationType,
    title: string,
    body: string,
    trigger: NotificationTrigger,
    data: NotificationData
  ): Promise<string> {
    try {
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        throw new Error("Notification permissions not granted");
      }

      // Converter trigger para formato do expo-notifications
      let notificationTrigger:
        | Notifications.NotificationTriggerInput
        | null
        | undefined = null;

      if (trigger.date) {
        // Notificação única em uma data específica
        notificationTrigger = {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: trigger.date,
        };
      } else if (trigger.seconds) {
        // Notificação após X segundos
        notificationTrigger = {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: trigger.seconds,
          repeats: trigger.repeats ?? false,
        };
      } else if (
        trigger.weekday !== undefined &&
        trigger.hour !== undefined &&
        trigger.minute !== undefined
      ) {
        // Notificação recorrente semanal
        notificationTrigger = {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: trigger.weekday,
          hour: trigger.hour,
          minute: trigger.minute,
        };
      } else {
        // Fallback: notificação imediata
        notificationTrigger = {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
          repeats: false,
        };
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { ...data, type },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: notificationTrigger,
      });

      return notificationId;
    } catch (error) {
      console.error("Error scheduling notification:", error);
      throw error;
    }
  }

  /**
   * Agenda lembrete de medição
   */
  async scheduleMeasurementReminder(
    patientId: string,
    preferences: NotificationPreferences["measurementReminder"]
  ): Promise<string> {
    const title = "📏 Hora de medir!";
    const body =
      "Lembre-se de registrar suas medidas corporais para acompanhar sua evolução.";

    // Calcular trigger baseado na frequência
    let weekday = preferences.weekday;
    const repeats = true;

    // Se for quinzenal ou mensal, ainda usamos semanal mas com lógica diferente
    // (expo-notifications não suporta quinzenal/mensal nativamente)
    // Solução: agendar semanal e no handler verificar a data

    return await this.scheduleNotification(
      "measurement_reminder" as NotificationType,
      title,
      body,
      {
        weekday,
        hour: preferences.hour,
        minute: preferences.minute,
        repeats,
      },
      {
        patientId,
        action: "add-measurement",
      }
    );
  }

  /**
   * Agenda alerta de meta próxima ao prazo
   */
  async scheduleGoalDeadlineAlert(
    patientId: string,
    goalId: string,
    goalTitle: string,
    deadlineDate: Date,
    daysBeforeDeadline: number
  ): Promise<string> {
    const alertDate = new Date(deadlineDate);
    alertDate.setDate(alertDate.getDate() - daysBeforeDeadline);

    // Só agendar se a data ainda não passou
    if (alertDate < new Date()) {
      throw new Error("Alert date is in the past");
    }

    const title = "⏰ Meta próxima ao prazo!";
    const body = `Sua meta "${goalTitle}" vence em ${daysBeforeDeadline} dias. Continue firme!`;

    return await this.scheduleNotification(
      "goal_deadline_near" as NotificationType,
      title,
      body,
      {
        date: alertDate,
      },
      {
        patientId,
        goalId,
        action: "view-goal",
      }
    );
  }

  /**
   * Envia notificação de meta alcançada imediatamente
   */
  async notifyGoalAchieved(
    patientId: string,
    goalId: string,
    goalTitle: string
  ): Promise<string> {
    const title = "🎉 Parabéns!";
    const body = `Você alcançou sua meta: ${goalTitle}! Continue assim!`;

    return await this.scheduleNotification(
      "goal_achieved" as NotificationType,
      title,
      body,
      {
        seconds: 1, // Imediatamente
      },
      {
        patientId,
        goalId,
        action: "view-goal",
      }
    );
  }

  /**
   * Cancela uma notificação específica
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error("Error cancelling notification:", error);
    }
  }

  /**
   * Cancela todas as notificações
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("Error cancelling all notifications:", error);
    }
  }

  /**
   * Lista todas as notificações agendadas
   */
  async listScheduledNotifications(): Promise<
    Notifications.NotificationRequest[]
  > {
    try {
      const notifications =
        await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      console.error("Error listing notifications:", error);
      return [];
    }
  }

  /**
   * Cancela notificações de um paciente específico
   */
  async cancelPatientNotifications(patientId: string): Promise<void> {
    try {
      const notifications = await this.listScheduledNotifications();
      const patientNotifications = notifications.filter(
        (n) => n.content.data?.patientId === patientId
      );

      for (const notification of patientNotifications) {
        await this.cancelNotification(notification.identifier);
      }
    } catch (error) {
      console.error("Error cancelling patient notifications:", error);
    }
  }

  /**
   * Cancela notificações de um tipo específico
   */
  async cancelNotificationsByType(type: NotificationType): Promise<void> {
    try {
      const notifications = await this.listScheduledNotifications();
      const typeNotifications = notifications.filter(
        (n) => n.content.data?.type === type
      );

      for (const notification of typeNotifications) {
        await this.cancelNotification(notification.identifier);
      }
    } catch (error) {
      console.error("Error cancelling notifications by type:", error);
    }
  }

  /**
   * Envia notificação de teste
   */
  async sendTestNotification(): Promise<string> {
    const title = "🔔 Notificação de Teste";
    const body = "Se você está vendo isso, as notificações estão funcionando!";

    return await this.scheduleNotification(
      "general" as NotificationType,
      title,
      body,
      {
        seconds: 2, // 2 segundos
      },
      {
        patientId: "test",
        action: "navigate",
      }
    );
  }

  /**
   * Reagenda todas as notificações baseado nas preferências
   */
  async rescheduleAllNotifications(
    patientId: string,
    preferences: NotificationPreferences
  ): Promise<void> {
    try {
      // Cancelar todas as notificações existentes do paciente
      await this.cancelPatientNotifications(patientId);

      if (!preferences.enabled) {
        return;
      }

      // Reagendar lembrete de medição
      if (preferences.measurementReminder.enabled) {
        await this.scheduleMeasurementReminder(
          patientId,
          preferences.measurementReminder
        );
      }
    } catch (error) {
      console.error("Error rescheduling notifications:", error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
