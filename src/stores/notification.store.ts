import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NotificationPreferences } from "../types/notification.types";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "../types/notification.types";

/**
 * State da store de notificações
 */
interface NotificationState {
  // Preferências de notificação por paciente
  preferences: Record<string, NotificationPreferences>;

  // IDs de notificações agendadas por paciente
  scheduledNotifications: Record<string, string[]>;

  // Actions
  getPreferences: (patientId: string) => NotificationPreferences;
  setPreferences: (
    patientId: string,
    preferences: NotificationPreferences
  ) => void;
  updatePreferences: (
    patientId: string,
    updates: Partial<NotificationPreferences>
  ) => void;
  resetPreferences: (patientId: string) => void;

  addScheduledNotification: (patientId: string, notificationId: string) => void;
  removeScheduledNotification: (
    patientId: string,
    notificationId: string
  ) => void;
  clearScheduledNotifications: (patientId: string) => void;
  getScheduledNotifications: (patientId: string) => string[];
}

/**
 * Store para gerenciar preferências de notificação
 */
export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      preferences: {},
      scheduledNotifications: {},

      /**
       * Obtém as preferências de um paciente
       */
      getPreferences: (patientId: string) => {
        const state = get();
        return (
          state.preferences[patientId] || {
            ...DEFAULT_NOTIFICATION_PREFERENCES,
          }
        );
      },

      /**
       * Define as preferências de um paciente
       */
      setPreferences: (
        patientId: string,
        preferences: NotificationPreferences
      ) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            [patientId]: preferences,
          },
        }));
      },

      /**
       * Atualiza preferências parcialmente
       */
      updatePreferences: (
        patientId: string,
        updates: Partial<NotificationPreferences>
      ) => {
        const currentPrefs = get().getPreferences(patientId);
        const newPrefs = {
          ...currentPrefs,
          ...updates,
        };
        get().setPreferences(patientId, newPrefs);
      },

      /**
       * Reseta preferências para o padrão
       */
      resetPreferences: (patientId: string) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            [patientId]: { ...DEFAULT_NOTIFICATION_PREFERENCES },
          },
        }));
      },

      /**
       * Adiciona ID de notificação agendada
       */
      addScheduledNotification: (patientId: string, notificationId: string) => {
        set((state) => {
          const existing = state.scheduledNotifications[patientId] || [];
          return {
            scheduledNotifications: {
              ...state.scheduledNotifications,
              [patientId]: [...existing, notificationId],
            },
          };
        });
      },

      /**
       * Remove ID de notificação agendada
       */
      removeScheduledNotification: (
        patientId: string,
        notificationId: string
      ) => {
        set((state) => {
          const existing = state.scheduledNotifications[patientId] || [];
          return {
            scheduledNotifications: {
              ...state.scheduledNotifications,
              [patientId]: existing.filter((id) => id !== notificationId),
            },
          };
        });
      },

      /**
       * Limpa todas as notificações agendadas de um paciente
       */
      clearScheduledNotifications: (patientId: string) => {
        set((state) => ({
          scheduledNotifications: {
            ...state.scheduledNotifications,
            [patientId]: [],
          },
        }));
      },

      /**
       * Obtém IDs de notificações agendadas
       */
      getScheduledNotifications: (patientId: string) => {
        const state = get();
        return state.scheduledNotifications[patientId] || [];
      },
    }),
    {
      name: "notification-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
