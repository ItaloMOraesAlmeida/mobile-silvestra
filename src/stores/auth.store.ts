import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api.service";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

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

  // Actions
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

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setTokens: (tokens: AuthTokens) => {
        set({ tokens });
      },

      loginWithGoogle: async (idToken: string) => {
        set({ isLoading: true });

        try {
          const response = await api.post(`${API_URL}/auth/google`, {
            idToken,
          });

          const { user, tokens } = response.data;

          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        const { tokens } = get();

        if (tokens?.refreshToken && tokens?.accessToken) {
          try {
            await api.post(
              `${API_URL}/auth/logout`,
              { refreshToken: tokens.refreshToken },
              {
                headers: {
                  Authorization: `Bearer ${tokens.accessToken}`,
                },
              }
            );
          } catch (error) {
            console.error("Erro ao fazer logout na API:", error);
          }
        }

        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
        });
      },

      refreshAccessToken: async () => {
        const { tokens } = get();

        if (!tokens?.refreshToken) {
          throw new Error("Refresh token não encontrado");
        }

        try {
          const response = await api.post(`${API_URL}/auth/refresh`, {
            refreshToken: tokens.refreshToken,
          });

          const newTokens = response.data;

          set({
            tokens: newTokens,
          });
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
    }
  )
);
