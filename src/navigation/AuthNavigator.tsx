import { createStackNavigator } from "@react-navigation/stack";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen name="Login" component={() => null} />
      <Stack.Screen name="Register" component={() => null} />
      <Stack.Screen name="ForgotPassword" component={() => null} />
    </Stack.Navigator>
  );
}
