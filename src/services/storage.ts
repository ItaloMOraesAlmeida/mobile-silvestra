import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: "@silvestra:onboarding_completed",
  BIOMETRIC_ENABLED: "@silvestra:biometric_enabled",
  USER_CREDENTIALS: "@silvestra:user_credentials",
  AUTH_TOKENS: "@silvestra:auth_tokens",
  USER_DATA: "@silvestra:user_data",
};

export const StorageService = {
  // Onboarding
  async setOnboardingCompleted(completed: boolean): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.ONBOARDING_COMPLETED,
      JSON.stringify(completed)
    );
  },

  async hasCompletedOnboarding(): Promise<boolean> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    return value === "true";
  },

  // Biometric
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.BIOMETRIC_ENABLED,
      JSON.stringify(enabled)
    );
  },

  async isBiometricEnabled(): Promise<boolean> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
    return value === "true";
  },

  // User Credentials (para autenticação biométrica) - DEPRECATED: usar saveAuthTokens
  async saveUserCredentials(email: string, token: string): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_CREDENTIALS,
      JSON.stringify({ email, token })
    );
  },

  async getUserCredentials(): Promise<{ email: string; token: string } | null> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.USER_CREDENTIALS);
    return value ? JSON.parse(value) : null;
  },

  async clearUserCredentials(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_CREDENTIALS);
  },

  // Auth Tokens (access + refresh)
  async saveAuthTokens(
    email: string,
    accessToken: string,
    refreshToken: string
  ): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.AUTH_TOKENS,
      JSON.stringify({ email, accessToken, refreshToken })
    );
  },

  async getAuthTokens(): Promise<{
    email: string;
    accessToken: string;
    refreshToken: string;
  } | null> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKENS);
    return value ? JSON.parse(value) : null;
  },

  async clearAuthTokens(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKENS);
  },

  // User Data (dados completos do usuário para restaurar sessão)
  async saveUserData(user: any): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  },

  async getUserData(): Promise<any | null> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return value ? JSON.parse(value) : null;
  },

  async clearUserData(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  },

  // Clear all data (logout)
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.BIOMETRIC_ENABLED,
      STORAGE_KEYS.USER_CREDENTIALS,
      STORAGE_KEYS.AUTH_TOKENS,
      STORAGE_KEYS.USER_DATA,
    ]);
  },
};
