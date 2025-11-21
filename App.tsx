import "react-native-gesture-handler";
import React, { useState, useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import type { NavigationContainerRef } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { toastConfig } from "./src/config/toast.config";
import { SplashScreen } from "./src/components/SplashScreen";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { notificationService } from "./src/services/notification.service";
import { ThemeProvider } from "./src/theme/ThemeContext";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_900Black,
} from "@expo-google-fonts/poppins";

// Token cache para o Clerk usar SecureStore
const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error("Erro ao buscar token do SecureStore:", error);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error("Erro ao salvar token no SecureStore:", error);
    }
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY não encontrado no .env");
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_900Black,
  });

  // Inicializar notificações
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Solicitar permissões
        const hasPermissions = await notificationService.requestPermissions();

        if (hasPermissions) {
          console.log("📱 Permissões de notificação concedidas");
        } else {
          console.warn("⚠️  Permissões de notificação negadas");
        }
      } catch (error) {
        console.error("❌ Erro ao inicializar notificações:", error);
      }
    };

    initializeNotifications();
  }, []);

  // Listener para quando usuário clicar na notificação
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as any;
        console.log("🔔 Notificação clicada:", data);

        // Navegação baseada na action
        if (navigationRef.current?.isReady()) {
          if (data.action === "add-measurement" && data.patientId) {
            // Navegar para tela de adicionar medição
            navigationRef.current?.navigate("Main", {
              screen: "PatientsTab",
              params: {
                screen: "PatientDetails",
                params: {
                  patientId: data.patientId,
                  openAddMeasurement: true,
                },
              },
            });
          } else if (data.action === "view-goal" && data.goalId) {
            // Navegar para detalhes da meta
            navigationRef.current?.navigate("Main", {
              screen: "PatientsTab",
              params: {
                screen: "GoalDetails",
                params: {
                  patientId: data.patientId,
                  goalId: data.goalId,
                },
              },
            });
          } else if (data.action === "view-goals" && data.patientId) {
            // Navegar para lista de metas
            navigationRef.current?.navigate("Main", {
              screen: "PatientsTab",
              params: {
                screen: "PatientDetails",
                params: {
                  patientId: data.patientId,
                  initialTab: "goals",
                },
              },
            });
          }
        }
      }
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // Aguarda as fontes carregarem
        if (fontsLoaded) {
          // Pequeno delay para garantir transição suave
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setIsReady(true);
        }
      } catch (error) {
        console.error("Erro ao preparar app:", error);
        setIsReady(true); // Continua mesmo com erro
      }
    };

    prepareApp();
  }, [fontsLoaded]);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <ClerkLoaded>
            <SafeAreaProvider>
              <NavigationContainer ref={navigationRef}>
                <RootNavigator />
                <StatusBar style="auto" />
              </NavigationContainer>
              <Toast config={toastConfig} />
            </SafeAreaProvider>
          </ClerkLoaded>
        </ClerkProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
