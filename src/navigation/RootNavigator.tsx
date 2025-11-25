import {
  createStackNavigator,
  CardStyleInterpolators,
} from "@react-navigation/stack";
import { AuthNavigator } from "./AuthNavigator";
import { MainDrawerNavigator } from "./MainDrawerNavigator";

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
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

      {/* Stacks autenticadas - todas usam o Main Drawer que adapta ao perfil do usuário */}
      <Stack.Screen name="Main" component={MainDrawerNavigator} />
    </Stack.Navigator>
  );
}
