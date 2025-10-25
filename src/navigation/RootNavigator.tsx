import { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../store/authStore";
import { AuthNavigator } from "./AuthNavigator";
import { TabsNavigator } from "./TabsNavigator";
import { PatientNavigator } from "./PatientNavigator";
import { NutritionistNavigator } from "./NutritionistNavigator";
import { Loading } from "../components/ui/Loading";
import { View, ActivityIndicator } from "react-native";

export type RootStackParamList = {
  Auth: undefined;
  Tabs: undefined;
  Patient: undefined;
  Nutritionist: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    // Verificar se já viu onboarding e verificar autenticação
    const checkAuth = async () => {
      try {
        const seen = await AsyncStorage.getItem("hasSeenOnboarding");
        setHasSeenOnboarding(seen === "true");
      } catch (error) {
        console.error("Error checking onboarding:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#572363" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : user?.role === "nutritionist" ? (
        <Stack.Screen name="Nutritionist" component={NutritionistNavigator} />
      ) : user?.role === "patient" ? (
        <Stack.Screen name="Patient" component={PatientNavigator} />
      ) : (
        <Stack.Screen name="Tabs" component={TabsNavigator} />
      )}
    </Stack.Navigator>
  );
}
