import api from "./api";
import { ApiResponse, AuthTokens, User } from "../types";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role: "patient" | "nutritionist";
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export const authService = {
  // Login com email e senha
  async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  // Registro de novo usuário
  async register(
    data: RegisterData
  ): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  // Logout
  async logout(): Promise<ApiResponse<void>> {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  // Refresh token
  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthTokens>> {
    const response = await api.post("/auth/refresh", { refreshToken });
    return response.data;
  },

  // Solicitar reset de senha
  async forgotPassword(data: ForgotPasswordData): Promise<ApiResponse<void>> {
    const response = await api.post("/auth/forgot-password", data);
    return response.data;
  },

  // Resetar senha com token
  async resetPassword(data: ResetPasswordData): Promise<ApiResponse<void>> {
    const response = await api.post("/auth/reset-password", data);
    return response.data;
  },

  // Obter perfil do usuário autenticado
  async getProfile(): Promise<ApiResponse<User>> {
    const response = await api.get("/auth/profile");
    return response.data;
  },

  // Login com Google OAuth
  async loginWithGoogle(
    idToken: string
  ): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await api.post("/auth/google", { idToken });
    return response.data;
  },
};

export default authService;
