import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

export const BiometricService = {
  async isAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  },

  async getSupportedTypes(): Promise<string[]> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const typeNames: string[] = [];

    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      typeNames.push("Digital");
    }
    if (
      types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
    ) {
      typeNames.push("Face ID");
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      typeNames.push("Íris");
    }

    return typeNames;
  },

  async authenticate(reason?: string): Promise<boolean> {
    try {
      const defaultReason = Platform.select({
        ios: "Autentique-se para continuar",
        android: "Use sua digital para continuar",
      });

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || defaultReason || "Autentique-se",
        fallbackLabel: "Usar senha",
        cancelLabel: "Cancelar",
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error("Erro na autenticação biométrica:", error);
      return false;
    }
  },

  async getBiometricName(): Promise<string> {
    const types = await this.getSupportedTypes();

    if (Platform.OS === "ios") {
      if (types.includes("Face ID")) {
        return "Face ID";
      } else if (types.includes("Digital")) {
        return "Touch ID";
      }
    } else {
      if (types.includes("Digital")) {
        return "Digital";
      }
    }

    return "Biometria";
  },
};
