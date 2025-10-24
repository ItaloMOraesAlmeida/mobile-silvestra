import "react-native-gesture-handler";
import "./global.css";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { useColorScheme } from "./src/hooks/useTheme";
import { RootNavigator } from "./src/navigation";

export default function App() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
