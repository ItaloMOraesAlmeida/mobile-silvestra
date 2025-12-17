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
  phone?: string;
  avatarUrl?: string;
  cpf?: string; // Movido de PatientProfile para User
  gender?: string; // Movido de PatientProfile para User
  birthDate?: string; // Movido de PatientProfile para User
  biologicalSex?: string; // Movido de PatientProfile para User
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  patientProfile?: {
    id: string;
    patients?: Array<{
      id: string;
      nutritionistId: string;
      status: string;
    }>;
  };
  nutritionistProfile?: {
    id: string;
    userId: string;
    crn: string;
    specialization?: string;
    bio?: string;
    isVerified: boolean;
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
  syncClerkUser: (
    clerkId: string,
    email: string,
    name?: string,
    avatarUrl?: string
  ) => Promise<{ needsProfileCompletion: boolean }>;
  completeProfile: (data: {
    name: string;
    isNutritionist: boolean;
    crn?: string;
    acceptTerms: boolean;
  }) => Promise<void>;
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
        // Normalize role casing to lowercase for consistent checks across the app
        const normalizedUser = {
          ...user,
          role: user.role?.toLowerCase(),
        } as User;
        set({ user: normalizedUser, isAuthenticated: true });
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

          const { user: rawUser, tokens } = response.data;
          const user = {
            ...rawUser,
            role: rawUser.role?.toLowerCase(),
          } as User;

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

          const { user: rawUser, tokens } = response.data;
          const user = {
            ...rawUser,
            role: rawUser.role?.toLowerCase(),
          } as User;

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

      syncClerkUser: async (
        clerkId: string,
        email: string,
        name?: string,
        avatarUrl?: string
      ) => {
        try {
          // Criar promise com timeout
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(
                new Error("TIMEOUT: Requisição demorou mais de 30 segundos")
              );
            }, 30000);
          });

          const requestPromise = api.post("/auth/clerk/sync", {
            clerkId,
            email,
            name,
            avatarUrl,
          });

          const response: any = await Promise.race([
            requestPromise,
            timeoutPromise,
          ]);

          // A resposta vem com { data: { user, tokens, needsProfileCompletion }, success }
          const {
            user: rawUser,
            tokens,
            needsProfileCompletion,
          } = response.data || response;

          const user = rawUser
            ? ({ ...rawUser, role: rawUser.role?.toLowerCase() } as User)
            : null;

          // Salvar tokens e user no store
          set({
            user,
            tokens,
            // Se needsProfileCompletion = true, NÃO autenticar ainda
            isAuthenticated: !needsProfileCompletion,
          });

          // Sincroniza com o tokenService
          tokenService.setTokens(tokens);

          return { needsProfileCompletion };
        } catch (error: any) {
          console.error("🔴 [AUTH STORE] Erro response:", error.response?.data);
          console.error("🔴 [AUTH STORE] Erro completo:", error);

          if (
            error.name === "AbortError" ||
            error.message?.includes("timeout")
          ) {
            throw new Error(
              "Tempo limite de conexão excedido. Verifique sua internet e tente novamente."
            );
          }

          throw new Error(
            error.response?.data?.message || "Erro ao conectar com o servidor"
          );
        }
      },

      completeProfile: async (data: {
        name: string;
        isNutritionist: boolean;
        crn?: string;
        acceptTerms: boolean;
      }) => {
        try {
          const response = await api.post("/auth/complete-profile", data);

          const { user: rawUser } = response.data;
          const user = {
            ...rawUser,
            role: rawUser.role?.toLowerCase(),
          } as User;

          // Atualizar apenas o usuário
          // NÃO marca como autenticado aqui, pois precisamos mostrar o modal de biometria primeiro
          // A autenticação será confirmada em completeBiometricSetup() ou skipBiometricSetup()
          set({
            user,
            // isAuthenticated permanece false até decisão sobre biometria
          });
        } catch (error: any) {
          console.error("Erro ao completar perfil:", error);
          throw new Error(
            error.response?.data?.message || "Erro ao completar perfil"
          );
        }
      },

      logout: async () => {
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

          // API retorna { user, tokens }
          const { user: rawUser, tokens: newTokens } = response.data;
          const user = {
            ...rawUser,
            role: rawUser.role?.toLowerCase(),
          } as User;

          set({
            user,
            tokens: newTokens,
            isAuthenticated: true,
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
