/**
 * Token Service
 *
 * Camada de abstração para gerenciar tokens de autenticação
 * sem dependência circular com o auth store.
 */

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

class TokenService {
  private tokens: AuthTokens | null = null;
  private listeners: Set<(tokens: AuthTokens | null) => void> = new Set();

  /**
   * Obtém os tokens atuais
   */
  getTokens(): AuthTokens | null {
    return this.tokens;
  }

  /**
   * Define os tokens
   */
  setTokens(tokens: AuthTokens | null): void {
    this.tokens = tokens;
    this.notifyListeners();
  }

  /**
   * Limpa os tokens
   */
  clearTokens(): void {
    this.tokens = null;
    this.notifyListeners();
  }

  /**
   * Registra um listener para mudanças de token
   */
  subscribe(listener: (tokens: AuthTokens | null) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notifica todos os listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.tokens));
  }
}

export const tokenService = new TokenService();
