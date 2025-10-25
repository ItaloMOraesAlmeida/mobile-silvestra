import { useEffect, useState } from "react";
import {
  createStackNavigator,
  CardStyleInterpolators,
} from "@react-navigation/stack";
import { useAuthStore } from "../store/authStore";
import { AuthNavigator } from "./AuthNavigator";
import { TabsNavigator } from "./TabsNavigator";
import { PatientNavigator } from "./PatientNavigator";
import { NutritionistNavigator } from "./NutritionistNavigator";
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

  useEffect(() => {
    // Pequeno delay para garantir que o app carregou
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#572363" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: "horizontal",
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        transitionSpec: {
          open: {
            animation: "spring",
            config: {
              stiffness: 300,
              damping: 30,
              mass: 1,
            },
          },
          close: {
            animation: "spring",
            config: {
              stiffness: 300,
              damping: 30,
              mass: 1,
            },
          },
        },
      }}
    >
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
