import { create } from "zustand";
import { User, AuthTokens } from "../types";

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setLoading: (isLoading: boolean) => void;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user: User | null) => set({ user, isAuthenticated: !!user }),

  setTokens: (tokens: AuthTokens | null) => set({ tokens }),

  setLoading: (isLoading: boolean) => set({ isLoading }),

  login: (user: User, tokens: AuthTokens) =>
    set({
      user,
      tokens,
      isAuthenticated: true,
      isLoading: false,
    }),

  logout: () =>
    set({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));

export default useAuthStore;
