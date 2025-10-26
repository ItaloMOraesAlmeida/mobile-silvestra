import {
  createStackNavigator,
  CardStyleInterpolators,
} from "@react-navigation/stack";
import { AuthNavigator } from "./AuthNavigator";
import { TabsNavigator } from "./TabsNavigator";
import { PatientNavigator } from "./PatientNavigator";
import { NutritionistNavigator } from "./NutritionistNavigator";

export type RootStackParamList = {
  Auth: undefined;
  Tabs: undefined;
  Patient: undefined;
  Nutritionist: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
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
      {/* SEMPRE mostra Auth primeiro - LoginScreen decide se redireciona */}
      <Stack.Screen name="Auth" component={AuthNavigator} />

      {/* Stacks autenticadas - só acessíveis via navigate() */}
      <Stack.Screen name="Nutritionist" component={NutritionistNavigator} />
      <Stack.Screen name="Patient" component={PatientNavigator} />
      <Stack.Screen name="Tabs" component={TabsNavigator} />
    </Stack.Navigator>
  );
}
