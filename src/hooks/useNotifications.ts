import { useEffect, useRef, useCallback } from "react";
import * as Notifications from "expo-notifications";
import { useNavigation } from "@react-navigation/native";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import type { MainDrawerParamList } from "../navigation/MainDrawerNavigator";
import { notificationService } from "../services/notification.service";
import type { NotificationData } from "../types/notification.types";

type NavigationProp = DrawerNavigationProp<MainDrawerParamList>;

/**
 * Hook para gerenciar notificações no app
 * Configura listeners para notificações recebidas e interações do usuário
 */
export const useNotifications = () => {
  const navigation = useNavigation<NavigationProp>();
  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  /**
   * Navega para a tela apropriada baseado nos dados da notificação
   */
  const handleNotificationNavigation = useCallback(
    (data: NotificationData) => {
      const { action, patientId, goalId, screen } = data;

      switch (action) {
        case "add-measurement":
          // Navegar para PatientDetails e abrir modal de adicionar medição
          navigation.navigate("Home" as any, {
            patientId,
            openAddMeasurement: true,
          });
          break;

        case "view-goal":
          if (goalId) {
            // Navegar para detalhes da meta específica
            navigation.navigate("Home" as any, {
              patientId,
              goalId,
            });
          }
          break;

        case "view-goals":
          // Navegar para PatientDetails na aba de metas
          navigation.navigate("Home" as any, {
            patientId,
            initialTab: "goals",
          });
          break;

        case "navigate":
          if (screen) {
            // Navegação genérica para qualquer tela
            navigation.navigate(screen as any, { patientId });
          }
          break;

        default:
          console.warn("Unknown notification action:", action);
      }
    },
    [navigation]
  );

  useEffect(() => {
    // Listener para notificações recebidas enquanto app está aberto
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
        // Aqui você pode adicionar lógica adicional se necessário
      });

    // Listener para quando usuário interage com a notificação
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);

        const data = response.notification.request.content.data as unknown;

        // Navegar baseado na ação da notificação
        if (data && typeof data === "object") {
          handleNotificationNavigation(data as NotificationData);
        }
      });

    return () => {
      // Cleanup dos listeners
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [handleNotificationNavigation]);

  /**
   * Solicita permissões de notificação
   */
  const requestPermissions = async (): Promise<boolean> => {
    return await notificationService.requestPermissions();
  };

  /**
   * Verifica se permissões foram concedidas
   */
  const hasPermissions = async (): Promise<boolean> => {
    return await notificationService.hasPermissions();
  };

  /**
   * Agenda todas as notificações de um paciente
   */
  const schedulePatientNotifications = async (
    patientId: string,
    preferences: any
  ): Promise<void> => {
    await notificationService.rescheduleAllNotifications(
      patientId,
      preferences
    );
  };

  /**
   * Cancela todas as notificações de um paciente
   */
  const cancelPatientNotifications = async (
    patientId: string
  ): Promise<void> => {
    await notificationService.cancelPatientNotifications(patientId);
  };

  /**
   * Envia notificação de teste
   */
  const sendTestNotification = async (): Promise<void> => {
    await notificationService.sendTestNotification();
  };

  /**
   * Lista todas as notificações agendadas
   */
  const listScheduledNotifications = async () => {
    return await notificationService.listScheduledNotifications();
  };

  return {
    requestPermissions,
    hasPermissions,
    schedulePatientNotifications,
    cancelPatientNotifications,
    sendTestNotification,
    listScheduledNotifications,
  };
};
