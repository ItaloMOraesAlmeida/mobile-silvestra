import { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useAuthStore } from "../store/authStore";
import { AuthNavigator } from "./AuthNavigator";
import { PatientNavigator } from "./PatientNavigator";
import { NutritionistNavigator } from "./NutritionistNavigator";
import { Loading } from "../components/ui/Loading";
import { View } from "react-native";

export type RootStackParamList = {
  Auth: undefined;
  Patient: undefined;
  Nutritionist: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular verificação de autenticação persistida
    const checkAuth = async () => {
      // Aqui você pode verificar AsyncStorage para token persistido
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Loading text="Carregando..." />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : user?.role === "nutritionist" ? (
        <Stack.Screen name="Nutritionist" component={NutritionistNavigator} />
      ) : (
        <Stack.Screen name="Patient" component={PatientNavigator} />
      )}
    </Stack.Navigator>
  );
}
