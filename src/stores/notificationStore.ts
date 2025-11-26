import { create } from "zustand";
import {
  notificationApiService,
  type NotificationResponse,
  type CreateNotificationInput,
  type UpdateNotificationInput,
  type QueryNotificationParams,
} from "../services/notification-api.service";

interface NotificationState {
  notifications: NotificationResponse[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: (params?: QueryNotificationParams) => Promise<void>;
  fetchNotification: (id: string) => Promise<NotificationResponse | null>;
  createNotification: (data: CreateNotificationInput) => Promise<void>;
  updateNotification: (
    id: string,
    data: UpdateNotificationInput
  ) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  toggleNotification: (id: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,

  /**
   * Buscar todas as notificações com filtros opcionais
   */
  fetchNotifications: async (params?: QueryNotificationParams) => {
    try {
      set({ loading: true, error: null });
      const notifications = await notificationApiService.list(params);
      set({ notifications, loading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Erro ao buscar notificações",
        loading: false,
      });
    }
  },

  /**
   * Buscar uma notificação específica por ID
   */
  fetchNotification: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const notification = await notificationApiService.getById(id);
      set({ loading: false });
      return notification;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Erro ao buscar notificação",
        loading: false,
      });
      return null;
    }
  },

  /**
   * Criar uma nova notificação
   */
  createNotification: async (data: CreateNotificationInput) => {
    try {
      set({ loading: true, error: null });
      const newNotification = await notificationApiService.create(data);
      set((state) => ({
        notifications: [...state.notifications, newNotification],
        loading: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Erro ao criar notificação",
        loading: false,
      });
      throw error;
    }
  },

  /**
   * Atualizar uma notificação existente
   */
  updateNotification: async (id: string, data: UpdateNotificationInput) => {
    try {
      set({ loading: true, error: null });
      const updatedNotification = await notificationApiService.update(id, data);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? updatedNotification : n
        ),
        loading: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar notificação",
        loading: false,
      });
      throw error;
    }
  },

  /**
   * Deletar uma notificação
   */
  deleteNotification: async (id: string) => {
    try {
      set({ loading: true, error: null });
      await notificationApiService.delete(id);
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Erro ao deletar notificação",
        loading: false,
      });
      throw error;
    }
  },

  /**
   * Alternar status ativo/inativo de uma notificação
   */
  toggleNotification: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const updatedNotification = await notificationApiService.toggle(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? updatedNotification : n
        ),
        loading: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Erro ao alternar status da notificação",
        loading: false,
      });
      throw error;
    }
  },

  /**
   * Limpar erro
   */
  clearError: () => set({ error: null }),

  /**
   * Resetar estado
   */
  reset: () =>
    set({
      notifications: [],
      loading: false,
      error: null,
    }),
}));
