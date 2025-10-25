import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
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
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  );
}
