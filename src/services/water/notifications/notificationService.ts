import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_STORAGE_KEY = "@silvestra:water_notification_token";
const NOTIFICATION_IDENTIFIER_PREFIX = "water-reminder-";

// Configurar handler padrão de notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Solicitar permissões de notificação
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!Device.isDevice) {
    console.log("Notificações só funcionam em dispositivos físicos");
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Permissão de notificação negada");
    return false;
  }

  // Configurar canal no Android
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("water-reminders", {
      name: "Lembretes de Hidratação",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2196F3",
      sound: "default",
      enableVibrate: true,
      enableLights: true,
    });
  }

  return true;
};

/**
 * Obter token de notificação push (para notificações remotas futuras)
 */
export const getNotificationToken = async (): Promise<string | null> => {
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, token.data);
    return token.data;
  } catch (error) {
    console.error("Erro ao obter token:", error);
    return null;
  }
};

/**
 * Agendar lembrete único
 */
export const scheduleWaterReminder = async (
  trigger: Date | number,
  title: string = "💧 Hora de beber água!",
  body: string = "Que tal um copo de água agora?"
): Promise<string> => {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: "default",
      priority: Notifications.AndroidNotificationPriority.HIGH,
      categoryIdentifier: "WATER_REMINDER",
      data: {
        type: "water_reminder",
        timestamp: Date.now(),
      },
    },
    trigger:
      trigger instanceof Date
        ? {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: trigger,
          }
        : {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: trigger,
          },
  });

  return notificationId;
};

/**
 * Agendar lembretes diários baseados nas configurações
 */
export const scheduleWaterReminders = async (
  startTime: string, // HH:mm
  endTime: string, // HH:mm
  intervalMinutes: number
): Promise<string[]> => {
  // Cancelar notificações antigas
  await cancelAllWaterReminders();

  const notificationIds: string[] = [];

  // Converter horários para minutos
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  // Calcular horários de lembrete
  const reminderTimes: Date[] = [];
  let currentMinutes = startMinutes;

  while (currentMinutes <= endMinutes) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;

    // Criar data para cada dia da semana
    for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
      const triggerDate = new Date();
      triggerDate.setHours(hour, minute, 0, 0);

      // Ajustar para o dia da semana correto
      const currentDay = triggerDate.getDay();
      const daysToAdd = (dayOfWeek - currentDay + 7) % 7;
      triggerDate.setDate(triggerDate.getDate() + daysToAdd);

      // Se já passou hoje, agendar para a próxima semana
      if (triggerDate < new Date()) {
        triggerDate.setDate(triggerDate.getDate() + 7);
      }

      reminderTimes.push(new Date(triggerDate));
    }

    currentMinutes += intervalMinutes;
  }

  // Agendar notificações com repetição semanal
  for (const triggerDate of reminderTimes) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "💧 Hora de se hidratar!",
          body: "Beba um copo de água agora 🥤",
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: "WATER_REMINDER",
          data: {
            type: "water_reminder",
            timestamp: triggerDate.getTime(),
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 24 * 60 * 60, // Repetir a cada 24 horas
          repeats: true,
        },
      });

      notificationIds.push(notificationId);
    } catch (error) {
      console.error("Erro ao agendar notificação:", error);
    }
  }

  console.log(`Agendados ${notificationIds.length} lembretes de água`);
  return notificationIds;
};

/**
 * Cancelar todas as notificações de água
 */
export const cancelAllWaterReminders = async (): Promise<void> => {
  const scheduledNotifications =
    await Notifications.getAllScheduledNotificationsAsync();

  const waterNotifications = scheduledNotifications.filter(
    (notification) =>
      notification.content.data?.type === "water_reminder" ||
      notification.identifier.startsWith(NOTIFICATION_IDENTIFIER_PREFIX)
  );

  for (const notification of waterNotifications) {
    await Notifications.cancelScheduledNotificationAsync(
      notification.identifier
    );
  }

  console.log(`Canceladas ${waterNotifications.length} notificações de água`);
};

/**
 * Cancelar notificação específica
 */
export const cancelWaterReminder = async (
  notificationId: string
): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
};

/**
 * Listar todas as notificações agendadas
 */
export const getScheduledReminders = async (): Promise<
  Notifications.NotificationRequest[]
> => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter(
    (notification) => notification.content.data?.type === "water_reminder"
  );
};

/**
 * Configurar Quick Actions (botões na notificação)
 */
export const setupNotificationCategories = async (): Promise<void> => {
  await Notifications.setNotificationCategoryAsync("WATER_REMINDER", [
    {
      identifier: "QUICK_ADD_200",
      buttonTitle: "➕ 200ml",
      options: {
        opensAppToForeground: false,
      },
    },
    {
      identifier: "QUICK_ADD_500",
      buttonTitle: "➕ 500ml",
      options: {
        opensAppToForeground: false,
      },
    },
    {
      identifier: "SNOOZE_30",
      buttonTitle: "⏰ Lembrar em 30min",
      options: {
        opensAppToForeground: false,
      },
    },
  ]);
};

/**
 * Handler para Quick Actions
 */
export const handleNotificationAction = async (
  actionIdentifier: string,
  onQuickAdd: (amount: number) => Promise<void>
): Promise<void> => {
  switch (actionIdentifier) {
    case "QUICK_ADD_200":
      await onQuickAdd(200);
      await Notifications.dismissNotificationAsync(
        Notifications.DEFAULT_ACTION_IDENTIFIER
      );
      break;

    case "QUICK_ADD_500":
      await onQuickAdd(500);
      await Notifications.dismissNotificationAsync(
        Notifications.DEFAULT_ACTION_IDENTIFIER
      );
      break;

    case "SNOOZE_30":
      // Agendar novo lembrete em 30 minutos
      await scheduleWaterReminder(
        1800, // 30 minutos em segundos
        "💧 Lembrete adiado",
        "Você pediu para ser lembrado de beber água!"
      );
      break;

    default:
      console.log("Ação não reconhecida:", actionIdentifier);
  }
};

/**
 * Mostrar notificação imediata (para testes)
 */
export const showImmediateNotification = async (
  title: string = "💧 Teste de Notificação",
  body: string = "Esta é uma notificação de teste"
): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: "default",
      data: { type: "test" },
    },
    trigger: null, // Imediata
  });
};
