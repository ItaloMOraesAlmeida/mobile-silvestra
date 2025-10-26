import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, registerAuthCallbacks } from "../services/api.service";
import { tokenService } from "../services/token.service";
import type { RegisterData } from "../types";

// Flag global para prevenir múltiplas chamadas simultâneas de logout
let isLoggingOut = false;
// Flag global para prevenir múltiplas tentativas simultâneas de refresh
let isRefreshing = false;

interface User {
  id: string;
  name: string;
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
          await api.post("/auth/register", data);

          // NÃO autentica o usuário automaticamente
          // Apenas indica sucesso e deixa o usuário fazer login
          set({
            isLoading: false,
          });
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
        // Prevenir múltiplas chamadas simultâneas de logout
        if (isLoggingOut) {
          return;
        }

        isLoggingOut = true;

        const { tokens } = get();

        // Limpar estado local PRIMEIRO, independente da resposta da API
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          pendingBiometricSetup: null,
        });

        // Limpa o tokenService
        tokenService.clearTokens();

        // Tentar notificar a API (mas não bloquear se falhar)
        if (tokens?.refreshToken && tokens?.accessToken) {
          try {
            await api.post("/auth/logout", {
              refreshToken: tokens.refreshToken,
            });
          } catch {
            // Silenciosamente ignora erros de logout na API
            // (é normal falhar se a sessão já expirou)
          }
        }

        isLoggingOut = false;
      },

      refreshAccessToken: async () => {
        // Prevenir múltiplas tentativas simultâneas de refresh
        if (isRefreshing) {
          throw new Error("Refresh já em andamento");
        }

        const { tokens } = get();

        if (!tokens?.refreshToken) {
          throw new Error("Refresh token não encontrado");
        }

        isRefreshing = true;

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
        } finally {
          isRefreshing = false;
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
