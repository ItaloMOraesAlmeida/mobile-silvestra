import { useEffect, useState } from "react";
import {
  createStackNavigator,
  CardStyleInterpolators,
} from "@react-navigation/stack";
import { OnboardingScreen } from "../screens/auth/OnboardingScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { ForgotPasswordScreen } from "../screens/auth/ForgotPasswordScreen";
import { VerifyCodeScreen } from "../screens/auth/VerifyCodeScreen";
import { ResetPasswordScreen } from "../screens/auth/ResetPasswordScreen";
import { TermsOfServiceScreen } from "../screens/legal/TermsOfServiceScreen";
import { PrivacyPolicyScreen } from "../screens/legal/PrivacyPolicyScreen";
import { StorageService } from "../services/storage";

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyCode: { identifier: string };
  ResetPassword: { code: string };
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const [initialRoute, setInitialRoute] = useState<
    "Onboarding" | "Login" | null
  >(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await StorageService.hasCompletedOnboarding();
        setInitialRoute(completed ? "Login" : "Onboarding");
      } catch (error) {
        console.error("Erro ao verificar onboarding:", error);
        // Em caso de erro, vai direto pro login
        setInitialRoute("Login");
      }
    };
    checkOnboarding();
  }, []);

  // Retorna null ao invés de loading para evitar flash de tela branca
  if (!initialRoute) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#FFFFFF" },
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
      initialRouteName={initialRoute}
    >
      {initialRoute === "Onboarding" && (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      )}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </Stack.Navigator>
  );
}
