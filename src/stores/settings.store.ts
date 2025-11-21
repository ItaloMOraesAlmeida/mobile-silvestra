import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";

/**
 * Tipos de Configurações
 */

export type ThemeMode = "light" | "dark" | "auto";
export type Language = "pt-BR" | "en";
export type UnitsSystem = "metric" | "imperial";

export interface NotificationSettings {
  enabled: boolean;
  reminders: boolean;
  messages: boolean;
  appointments: boolean;
  reports: boolean;
  marketing: boolean;
  sound: boolean;
  vibration: boolean;
}

export interface PrivacySettings {
  shareUsageData: boolean;
  personalizedExperience: boolean;
}

export interface AppSettings {
  theme: ThemeMode;
  language: Language;
  units: UnitsSystem;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

/**
 * Store de Configurações
 */

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;

  // Theme
  setTheme: (theme: ThemeMode) => void;
  getCurrentTheme: () => "light" | "dark";

  // Language
  setLanguage: (language: Language) => void;

  // Units
  setUnits: (units: UnitsSystem) => void;

  // Notifications
  updateNotifications: (notifications: Partial<NotificationSettings>) => void;
  toggleNotifications: (enabled: boolean) => void;

  // Privacy
  updatePrivacy: (privacy: Partial<PrivacySettings>) => void;

  // Bulk operations
  resetSettings: () => void;
  importSettings: (settings: AppSettings) => void;
}

/**
 * Configurações padrão
 */
const DEFAULT_SETTINGS: AppSettings = {
  theme: "auto",
  language: "pt-BR",
  units: "metric",
  notifications: {
    enabled: true,
    reminders: true,
    messages: true,
    appointments: true,
    reports: true,
    marketing: false,
    sound: true,
    vibration: true,
  },
  privacy: {
    shareUsageData: false,
    personalizedExperience: true,
  },
};

/**
 * Hook de Configurações
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      isLoading: false,

      /**
       * Altera o tema do app
       */
      setTheme: (theme: ThemeMode) => {
        set((state) => ({
          settings: {
            ...state.settings,
            theme,
          },
        }));
      },

      /**
       * Retorna o tema atual baseado na preferência e no sistema
       */
      getCurrentTheme: () => {
        const { theme } = get().settings;

        if (theme === "auto") {
          const colorScheme = Appearance.getColorScheme();
          return colorScheme === "dark" ? "dark" : "light";
        }

        return theme;
      },

      /**
       * Altera o idioma do app
       */
      setLanguage: (language: Language) => {
        set((state) => ({
          settings: {
            ...state.settings,
            language,
          },
        }));
      },

      /**
       * Altera o sistema de unidades
       */
      setUnits: (units: UnitsSystem) => {
        set((state) => ({
          settings: {
            ...state.settings,
            units,
          },
        }));
      },

      /**
       * Atualiza configurações de notificações (parcial)
       */
      updateNotifications: (notifications: Partial<NotificationSettings>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            notifications: {
              ...state.settings.notifications,
              ...notifications,
            },
          },
        }));
      },

      /**
       * Liga/desliga todas as notificações
       */
      toggleNotifications: (enabled: boolean) => {
        set((state) => ({
          settings: {
            ...state.settings,
            notifications: {
              ...state.settings.notifications,
              enabled,
            },
          },
        }));
      },

      /**
       * Atualiza configurações de privacidade
       */
      updatePrivacy: (privacy: Partial<PrivacySettings>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            privacy: {
              ...state.settings.privacy,
              ...privacy,
            },
          },
        }));
      },

      /**
       * Reseta todas as configurações para os padrões
       */
      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS });
      },

      /**
       * Importa configurações completas (útil para backup/restore)
       */
      importSettings: (settings: AppSettings) => {
        set({ settings });
      },
    }),
    {
      name: "silvestra-settings",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Seletores otimizados (evita re-renders desnecessários)
 */
export const selectTheme = (state: SettingsState) => state.settings.theme;
export const selectLanguage = (state: SettingsState) => state.settings.language;
export const selectUnits = (state: SettingsState) => state.settings.units;
export const selectNotifications = (state: SettingsState) =>
  state.settings.notifications;
export const selectPrivacy = (state: SettingsState) => state.settings.privacy;
