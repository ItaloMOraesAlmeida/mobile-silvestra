import axios from "axios";
import { useAuthStore } from "../stores/auth.store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

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
    const { tokens } = useAuthStore.getState();

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
        const { refreshAccessToken } = useAuthStore.getState();
        await refreshAccessToken();

        // Retry a requisição original
        const { tokens } = useAuthStore.getState();
        originalRequest.headers.Authorization = `Bearer ${tokens?.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Se o refresh falhar, redirecionar para login
        const { logout } = useAuthStore.getState();
        logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
