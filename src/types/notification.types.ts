/**
 * Tipos de notificações do sistema Silvestra
 */

export enum NotificationType {
  MEASUREMENT_REMINDER = "measurement_reminder",
  GOAL_DEADLINE_NEAR = "goal_deadline_near",
  GOAL_ACHIEVED = "goal_achieved",
  GENERAL = "general",
}

export enum NotificationFrequency {
  WEEKLY = "weekly",
  BIWEEKLY = "biweekly",
  MONTHLY = "monthly",
}

export interface NotificationData {
  patientId: string;
  action: "add-measurement" | "view-goal" | "view-goals" | "navigate";
  goalId?: string;
  screen?: string;
}

export interface ScheduledNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: NotificationData;
  trigger: NotificationTrigger;
  scheduledAt: Date;
}

export interface NotificationTrigger {
  // Para notificações recorrentes
  weekday?: number; // 1 = Sunday, 2 = Monday, ..., 7 = Saturday
  hour?: number; // 0-23
  minute?: number; // 0-59
  repeats?: boolean;

  // Para notificações únicas
  date?: Date;
  seconds?: number;
}

export interface NotificationPreferences {
  enabled: boolean;
  measurementReminder: {
    enabled: boolean;
    frequency: NotificationFrequency;
    weekday: number; // 1-7 (1 = Domingo, 2 = Segunda, ...)
    hour: number; // 0-23
    minute: number; // 0-59
  };
  goalAlerts: {
    enabled: boolean;
    daysBeforeDeadline: number; // Ex: 3 dias antes
  };
  celebrations: {
    enabled: boolean;
  };
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  measurementReminder: {
    enabled: true,
    frequency: NotificationFrequency.WEEKLY,
    weekday: 2, // Segunda-feira
    hour: 9,
    minute: 0,
  },
  goalAlerts: {
    enabled: true,
    daysBeforeDeadline: 3,
  },
  celebrations: {
    enabled: true,
  },
};

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export const FREQUENCY_LABELS: Record<NotificationFrequency, string> = {
  [NotificationFrequency.WEEKLY]: "Semanal",
  [NotificationFrequency.BIWEEKLY]: "Quinzenal",
  [NotificationFrequency.MONTHLY]: "Mensal",
};
