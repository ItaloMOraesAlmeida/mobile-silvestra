import { useState, useEffect } from "react";
import { StorageService } from "../services/storage";
import { useAuthStore } from "../stores/auth.store";

interface AppState {
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean;
  userRole?: "nutritionist" | "patient" | null;
}

export function useAppInitialization() {
  const [appState, setAppState] = useState<AppState>({
    isLoading: true,
    hasCompletedOnboarding: false,
    isAuthenticated: false,
    userRole: null,
  });

  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Carrega todas as verificações em paralelo
        const [hasCompletedOnboarding] = await Promise.all([
          StorageService.hasCompletedOnboarding(),
          // Adicione outras verificações necessárias aqui
        ]);

        // Pequeno delay para suavizar a transição (opcional)
        await new Promise((resolve) => setTimeout(resolve, 300));

        setAppState({
          isLoading: false,
          hasCompletedOnboarding,
          isAuthenticated,
          userRole: user?.role as "nutritionist" | "patient" | null,
        });
      } catch (error) {
        console.error("Erro ao inicializar app:", error);
        // Em caso de erro, assume valores padrão seguros
        setAppState({
          isLoading: false,
          hasCompletedOnboarding: true, // Vai direto pro login em caso de erro
          isAuthenticated: false,
          userRole: null,
        });
      }
    };

    initializeApp();
  }, [isAuthenticated, user]);

  return appState;
}
