import { useAuthStore } from "../stores/auth.store";
import { StorageService } from "./storage";
import { BiometricService } from "./biometric";

/**
 * Serviço para gerenciar autenticação biométrica com validação de tokens
 */
export const BiometricAuthService = {
  /**
   * Tenta fazer login usando biometria
   * Valida o access token, tenta refresh se expirado, ou faz logout se refresh também expirou
   */
  async authenticateWithBiometric(): Promise<{
    success: boolean;
    reason?:
      | "cancelled"
      | "token_expired"
      | "no_credentials"
      | "biometric_failed";
  }> {
    try {
      // 1. Verifica se biometria está habilitada
      const biometricEnabled = await StorageService.isBiometricEnabled();

      if (!biometricEnabled) {
        return { success: false, reason: "no_credentials" };
      }

      // 2. Obtém os tokens salvos
      const savedTokens = await StorageService.getAuthTokens();

      if (!savedTokens) {
        return { success: false, reason: "no_credentials" };
      }

      // 3. Solicita autenticação biométrica
      const biometricType = await BiometricService.getBiometricName();

      const biometricSuccess = await BiometricService.authenticate(
        `Use ${biometricType} para acessar`
      );

      if (!biometricSuccess) {
        return { success: false, reason: "biometric_failed" };
      }

      // 4. Tenta validar/restaurar a sessão com os tokens salvos
      const { setTokens, setUser, refreshAccessToken, logout } =
        useAuthStore.getState();

      try {
        // Restaura os tokens no store
        setTokens({
          accessToken: savedTokens.accessToken,
          refreshToken: savedTokens.refreshToken,
        });

        // Restaura os dados do usuário (se salvos)
        const savedUser = await StorageService.getUserData();

        if (savedUser) {
          setUser(savedUser);
        }

        // Tenta fazer uma requisição simples para validar o token
        // Se o token estiver expirado, o interceptor vai tentar fazer refresh automaticamente
        await refreshAccessToken();

        // Se chegou aqui, o refresh foi bem-sucedido
        // Atualiza os tokens salvos com os novos
        const { tokens, user } = useAuthStore.getState();
        if (tokens) {
          await StorageService.saveAuthTokens(
            savedTokens.email,
            tokens.accessToken,
            tokens.refreshToken
          );
        }

        // Atualiza os dados do usuário se mudaram
        if (user) {
          await StorageService.saveUserData(user);
        }

        return { success: true };
      } catch (error) {
        // Se o refresh falhar, significa que o refresh token também expirou
        console.error("Erro ao validar/refresh tokens:", error);

        // Limpa os dados salvos
        await StorageService.clearAuthTokens();
        await StorageService.clearUserData();
        await StorageService.setBiometricEnabled(false);

        // Faz logout
        await logout();

        return { success: false, reason: "token_expired" };
      }
    } catch (error) {
      console.error("Erro na autenticação biométrica:", error);
      return { success: false, reason: "biometric_failed" };
    }
  },

  /**
   * Salva as credenciais após login bem-sucedido
   */
  async saveBiometricCredentials(
    email: string,
    accessToken: string,
    refreshToken: string
  ): Promise<void> {
    await StorageService.saveAuthTokens(email, accessToken, refreshToken);
    await StorageService.setBiometricEnabled(true);

    // Salva também os dados do usuário
    const { user } = useAuthStore.getState();
    if (user) {
      await StorageService.saveUserData(user);
    }
  },

  /**
   * Remove as credenciais biométricas (ao desabilitar ou fazer logout)
   */
  async removeBiometricCredentials(): Promise<void> {
    await StorageService.clearAuthTokens();
    await StorageService.setBiometricEnabled(false);
  },
};
