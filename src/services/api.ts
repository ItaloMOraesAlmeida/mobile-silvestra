import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import { useAuthStore } from "../store/authStore";
import { ApiResponse, AuthTokens } from "../types";

// Configuração base da API
const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// Criar instância do Axios
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor - Adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const { tokens } = useAuthStore.getState();

    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Tratar erros e refresh token
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Se o erro for 401 (não autorizado) e não for uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { tokens } = useAuthStore.getState();

        if (!tokens?.refreshToken) {
          throw new Error("No refresh token available");
        }

        // Tentar fazer refresh do token
        const response = await axios.post<ApiResponse<AuthTokens>>(
          `${API_URL}/auth/refresh`,
          { refreshToken: tokens.refreshToken }
        );

        const newTokens = response.data.data;

        if (!newTokens) {
          throw new Error("Failed to refresh token");
        }

        // Atualizar tokens no store
        useAuthStore.getState().login(useAuthStore.getState().user!, newTokens);

        // Repetir a requisição original com o novo token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        // Se o refresh falhar, fazer logout
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
