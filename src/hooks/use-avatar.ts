import { useState, useEffect, useCallback } from "react";
import { avatarCacheService } from "../services/avatar-cache.service";
import { api } from "../services/api.service";

interface UseAvatarResult {
  avatarUrl: string | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook para buscar avatar com cache inteligente
 * - Verifica cache primeiro (válido por 6 dias)
 * - Se não houver cache ou expirado, busca URL assinada da API
 * - Salva nova URL no cache
 * @param key - A KEY do arquivo no bucket (ex: avatars/user-123.jpg)
 * @param refreshTrigger - Número que quando muda, força re-fetch do avatar
 */
export function useAvatar(
  key: string | null | undefined,
  refreshTrigger: number = 0
): UseAvatarResult {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAvatar = useCallback(
    async (forceRefresh = false) => {
      if (!key) {
        setAvatarUrl(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Verificar cache (se não for refresh forçado)
        if (!forceRefresh) {
          const cachedUrl = await avatarCacheService.get(key);
          if (cachedUrl) {
            setAvatarUrl(cachedUrl);
            setIsLoading(false);
            return;
          }
        }

        // Buscar URL assinada da API
        const response = await api.post("/upload/signed-url", { key });
        const signedUrl = response.data.signedUrl;

        // Salvar no cache
        await avatarCacheService.set(key, signedUrl);

        // Atualizar estado
        setAvatarUrl(signedUrl);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Erro ao buscar avatar")
        );
        setAvatarUrl(null);
      } finally {
        setIsLoading(false);
      }
    },
    [key]
  );

  useEffect(() => {
    fetchAvatar();
  }, [fetchAvatar, key, refreshTrigger]);

  const refresh = async () => {
    await fetchAvatar(true);
  };

  return {
    avatarUrl,
    isLoading,
    error,
    refresh,
  };
}
