import { useAuthStore } from "../stores/auth.store";
import { StorageService } from "./storage";
import { BiometricService } from "./biometric";

/**
 * Verifica se um token JWT está expirado
 * @param token - JWT token
 * @returns true se expirado, false caso contrário
 */
function isTokenExpired(token: string): boolean {
  try {
    // Decodifica o payload do JWT (parte do meio: header.payload.signature)
    const payload = JSON.parse(atob(token.split(".")[1]));

    // exp vem em segundos, converte para milissegundos
    const expirationTime = payload.exp * 1000;

    // Adiciona 1 minuto de margem para evitar race conditions
    const now = Date.now() + 60 * 1000;

    return now >= expirationTime;
  } catch (error) {
    console.error("Erro ao decodificar token:", error);
    // Se não conseguir decodificar, assume que está expirado por segurança
    return true;
  }
}

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

      // 4. Verifica expiração dos tokens antes de restaurar
      const { setTokens, setUser, refreshAccessToken, logout } =
        useAuthStore.getState();

      try {
        const accessTokenExpired = isTokenExpired(savedTokens.accessToken);
        const refreshTokenExpired = isTokenExpired(savedTokens.refreshToken);

        // Se ambos estiverem expirados, não há o que fazer
        if (accessTokenExpired && refreshTokenExpired) {
          console.log("🔴 Ambos os tokens expirados - fazendo logout");

          await StorageService.clearAuthTokens();
          await StorageService.clearUserData();
          await StorageService.setBiometricEnabled(false);
          await logout();

          return { success: false, reason: "token_expired" };
        }

        // Restaura os dados do usuário (se salvos)
        const savedUser = await StorageService.getUserData();
        if (savedUser) {
          setUser(savedUser);
        }

        // Se access token expirado mas refresh válido, faz refresh
        if (accessTokenExpired && !refreshTokenExpired) {
          console.log("🟡 Access token expirado - fazendo refresh...");

          // Restaura o refresh token primeiro
          setTokens({
            accessToken: savedTokens.accessToken,
            refreshToken: savedTokens.refreshToken,
          });

          try {
            // Tenta fazer refresh
            await refreshAccessToken();

            // Se bem-sucedido, salva os novos tokens
            const { tokens, user } = useAuthStore.getState();
            if (tokens) {
              await StorageService.saveAuthTokens(
                savedTokens.email,
                tokens.accessToken,
                tokens.refreshToken
              );
            }

            if (user) {
              await StorageService.saveUserData(user);
            }

            console.log("✅ Refresh bem-sucedido");
            return { success: true };
          } catch (refreshError: any) {
            console.error("❌ Erro ao fazer refresh:", refreshError);

            // Diferencia erro de rede de erro de token expirado
            if (
              refreshError.message?.includes("Network request failed") ||
              refreshError.message?.includes("timeout") ||
              refreshError.message?.includes("Failed to fetch")
            ) {
              // Erro de rede - permite continuar offline com tokens antigos
              console.log(
                "🌐 Erro de rede detectado - permitindo acesso offline"
              );

              // Restaura tokens antigos mesmo assim (app pode funcionar offline)
              setTokens({
                accessToken: savedTokens.accessToken,
                refreshToken: savedTokens.refreshToken,
              });

              return { success: true };
            }

            // Se for erro de token, limpa tudo e faz logout
            await StorageService.clearAuthTokens();
            await StorageService.clearUserData();
            await StorageService.setBiometricEnabled(false);
            await logout();

            return { success: false, reason: "token_expired" };
          }
        }

        setTokens({
          accessToken: savedTokens.accessToken,
          refreshToken: savedTokens.refreshToken,
        });

        return { success: true };
      } catch (error: any) {
        console.error("❌ Erro na autenticação biométrica:", error);

        // Diferencia tipos de erro
        if (
          error.message?.includes("Network request failed") ||
          error.message?.includes("timeout") ||
          error.message?.includes("Failed to fetch")
        ) {
          // Erro de rede - tenta restaurar tokens mesmo assim
          console.log("🌐 Erro de rede - restaurando tokens salvos");

          setTokens({
            accessToken: savedTokens.accessToken,
            refreshToken: savedTokens.refreshToken,
          });

          const savedUser = await StorageService.getUserData();
          if (savedUser) {
            setUser(savedUser);
          }

          return { success: true };
        }

        // Outros erros
        return { success: false, reason: "biometric_failed" };
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
