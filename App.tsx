import "react-native-gesture-handler";
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { toastConfig } from "./src/config/toast.config";
import { SplashScreen } from "./src/components/SplashScreen";
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
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_900Black,
  });

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
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <SafeAreaProvider>
          <NavigationContainer>
            <RootNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
          <Toast config={toastConfig} />
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
