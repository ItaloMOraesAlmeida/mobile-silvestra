import axios from "axios";
import { tokenService } from "./token.service";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

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

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const tokens = tokenService.getTokens();

    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para refresh token automático
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se o erro for 401 e não for uma retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (!refreshTokenCallback) {
          throw new Error("Refresh token callback não registrado");
        }

        await refreshTokenCallback();

        // Retry a requisição original
        const tokens = tokenService.getTokens();
        originalRequest.headers.Authorization = `Bearer ${tokens?.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Se o refresh falhar, fazer logout
        if (logoutCallback) {
          logoutCallback();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
