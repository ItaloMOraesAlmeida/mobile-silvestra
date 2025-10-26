import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, registerAuthCallbacks } from "../services/api.service";
import { tokenService } from "../services/token.service";
import type { RegisterData } from "../types";

interface User {
  id: string;
  email: string;
  role: string;
  provider: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  patientProfile?: {
    id: string;
    name: string;
    avatarUrl?: string;
    phone?: string;
  };
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Novo: Controla se deve mostrar o modal de biometria
  pendingBiometricSetup: {
    email: string;
    accessToken: string;
    refreshToken: string;
  } | null;

  // Actions
  login: (
    email: string,
    password: string
  ) => Promise<{ user: User; tokens: AuthTokens }>;
  completeBiometricSetup: () => void;
  skipBiometricSetup: () => void;
  register: (data: RegisterData) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      pendingBiometricSetup: null,

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setTokens: (tokens: AuthTokens) => {
        set({ tokens });
        // Sincroniza com o tokenService
        tokenService.setTokens(tokens);
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });

        try {
          const response = await api.post("/auth/login", {
            email,
            password,
          });

          const { user, tokens } = response.data;

          // NÃO define isAuthenticated = true ainda!
          // Apenas salva os dados temporariamente para o modal de biometria
          set({
            user,
            tokens,
            isAuthenticated: false, // Mantém false até confirmar biometria
            isLoading: false,
            pendingBiometricSetup: {
              email: user.email,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
            },
          });

          // Sincroniza com o tokenService
          tokenService.setTokens(tokens);

          return { user, tokens };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      completeBiometricSetup: () => {
        // Usuário aceitou configurar biometria
        // Agora sim, marca como autenticado
        set({
          isAuthenticated: true,
          pendingBiometricSetup: null,
        });
      },

      skipBiometricSetup: () => {
        // Usuário recusou biometria
        // Marca como autenticado mesmo assim
        set({
          isAuthenticated: true,
          pendingBiometricSetup: null,
        });
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true });

        try {
          const response = await api.post("/auth/register", data);

          const { user, tokens } = response.data;

          // Para registro, autenticamos direto (sem modal de biometria)
          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            pendingBiometricSetup: null,
          });

          // Sincroniza com o tokenService
          tokenService.setTokens(tokens);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithGoogle: async (idToken: string) => {
        set({ isLoading: true });

        try {
          const response = await api.post("/auth/google", {
            idToken,
          });

          const { user, tokens } = response.data;

          // Para Google, autenticamos direto (sem modal de biometria)
          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            pendingBiometricSetup: null,
          });

          // Sincroniza com o tokenService
          tokenService.setTokens(tokens);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        const { tokens } = get();

        if (tokens?.refreshToken && tokens?.accessToken) {
          try {
            await api.post("/auth/logout", {
              refreshToken: tokens.refreshToken,
            });
          } catch (error) {
            console.error("Erro ao fazer logout na API:", error);
          }
        }

        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          pendingBiometricSetup: null,
        });

        // Limpa o tokenService
        tokenService.clearTokens();
      },

      refreshAccessToken: async () => {
        const { tokens } = get();

        if (!tokens?.refreshToken) {
          throw new Error("Refresh token não encontrado");
        }

        try {
          const response = await api.post("/auth/refresh", {
            refreshToken: tokens.refreshToken,
          });

          const newTokens = response.data;

          set({
            tokens: newTokens,
          });

          // Sincroniza com o tokenService
          tokenService.setTokens(newTokens);
        } catch (error) {
          // Se o refresh falhar, fazer logout
          get().logout();
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // NÃO persiste isAuthenticated - sempre começa como false ao abrir o app
      // Isso força a verificação de biometria
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        // isAuthenticated: NÃO persiste (sempre false ao reabrir)
        // isLoading: NÃO persiste
        // pendingBiometricSetup: NÃO persiste
      }),
    }
  )
);

// Registra os callbacks no api.service para evitar dependência circular
registerAuthCallbacks(
  () => useAuthStore.getState().refreshAccessToken(),
  () => useAuthStore.getState().logout()
);

// Sincroniza tokens iniciais com o tokenService ao carregar do storage
useAuthStore.subscribe((state) => {
  tokenService.setTokens(state.tokens);
});
