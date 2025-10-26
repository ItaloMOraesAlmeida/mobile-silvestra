import { tokenService } from "./token.service";

// URL base da API (já inclui /api/v1 no .env)
const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// Referência para a função de refresh token (será definida pelo auth store)
let refreshTokenCallback: (() => Promise<void>) | null = null;
let logoutCallback: (() => Promise<void>) | null = null;

/**
 * Registra callbacks do auth store para evitar dependência circular
 */
export function registerAuthCallbacks(
  refreshToken: () => Promise<void>,
  logout: () => Promise<void>
) {
  refreshTokenCallback = refreshToken;
  logoutCallback = logout;
}

/**
 * Interface para a resposta da API
 */
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
}

/**
 * Interface para configuração de requisição
 */
interface RequestConfig {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
}

/**
 * Função auxiliar para fazer requisições HTTP com fetch
 */
async function request<T = any>(
  endpoint: string,
  config: RequestConfig
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const tokens = tokenService.getTokens();

  // Headers padrão
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...config.headers,
  };

  // Adicionar token de autenticação se existir
  if (tokens?.accessToken) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  try {
    const response = await fetch(url, {
      method: config.method,
      headers,
      body: config.body ? JSON.stringify(config.body) : undefined,
    });

    const data = await response.json();

    // Se a resposta não for OK e for 401, tentar refresh token
    if (!response.ok) {
      // Não tentar refresh token para endpoints de autenticação
      const isAuthEndpoint =
        endpoint.includes("/auth/login") ||
        endpoint.includes("/auth/register") ||
        endpoint.includes("/auth/refresh") ||
        endpoint.includes("/auth/logout");

      if (response.status === 401 && !isAuthEndpoint && refreshTokenCallback) {
        try {
          await refreshTokenCallback();
          // Tentar novamente após refresh
          return request<T>(endpoint, config);
        } catch {
          // Se o refresh falhar, fazer logout
          if (logoutCallback) {
            await logoutCallback();
          }
          throw new Error("Sessão expirada. Faça login novamente.");
        }
      }

      // Para outros erros, extrair mensagem apropriada
      let errorMessage = data.message;

      // Se for um erro de validação do Zod (array de erros)
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        // Pegar a primeira mensagem de erro
        errorMessage = data.errors[0].message;
      } else if (Array.isArray(data.message)) {
        // Se message for um array (formato antigo do ValidationPipe)
        errorMessage = data.message[0];
      }

      throw new Error(
        errorMessage || `Erro ${response.status}: ${response.statusText}`
      );
    }

    return data;
  } catch (error) {
    // Re-lançar o erro para ser tratado pelo componente
    throw error;
  }
}

/**
 * API service com métodos HTTP
 */
export const api = {
  get: <T = any>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: "GET", headers }),

  post: <T = any>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ) => request<T>(endpoint, { method: "POST", body, headers }),

  put: <T = any>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ) => request<T>(endpoint, { method: "PUT", body, headers }),

  patch: <T = any>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ) => request<T>(endpoint, { method: "PATCH", body, headers }),

  delete: <T = any>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: "DELETE", headers }),
};
