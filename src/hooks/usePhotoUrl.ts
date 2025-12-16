import { useState, useEffect, useCallback } from "react";
import { storageService } from "../services/storage.service";

/**
 * Hook para auto-refresh de URLs de fotos do Backblaze B2
 *
 * URLs assinadas do B2 expiram em 7 dias. Este hook detecta URLs expiradas
 * e automaticamente gera novas, mantendo as fotos sempre acessíveis.
 *
 * @param initialUrl - URL inicial da foto (pode ser assinada ou não)
 * @param autoRefresh - Se true, atualiza automaticamente URLs expiradas (padrão: true)
 * @returns { url, isRefreshing, refresh, error }
 *
 * Uso:
 * ```tsx
 * const { url, isRefreshing } = usePhotoUrl(measurement.photoFront);
 *
 * <Image source={{ uri: url }} />
 * {isRefreshing && <ActivityIndicator />}
 * ```
 */
export const usePhotoUrl = (
  initialUrl: string | null | undefined,
  autoRefresh = true
) => {
  const [url, setUrl] = useState<string | null>(initialUrl || null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Atualiza a URL manualmente
   */
  const refresh = useCallback(async () => {
    if (!url) return;

    try {
      setIsRefreshing(true);
      setError(null);

      // Extrair key da URL
      const key = storageService.extractKeyFromUrl(url);
      if (!key) {
        throw new Error("Não foi possível extrair a key da URL");
      }

      // Gerar nova URL assinada
      const newUrl = await storageService.refreshSignedUrl(key);
      setUrl(newUrl);
    } catch (err: any) {
      console.error("❌ Erro ao atualizar URL:", err);
      setError(err.message || "Erro ao atualizar URL");
    } finally {
      setIsRefreshing(false);
    }
  }, [url]);

  /**
   * Verifica se a URL está expirada e atualiza automaticamente
   */
  useEffect(() => {
    if (!url || !autoRefresh) return;

    const checkAndRefresh = async () => {
      const isExpired = storageService.isUrlExpired(url);

      if (isExpired) {
        await refresh();
      }
    };

    checkAndRefresh();

    // Verifica a cada 1 hora
    const interval = setInterval(checkAndRefresh, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [url, autoRefresh, refresh]);

  /**
   * Atualiza URL quando initialUrl mudar
   */
  useEffect(() => {
    setUrl(initialUrl || null);
  }, [initialUrl]);

  return {
    url,
    isRefreshing,
    refresh,
    error,
  };
};

/**
 * Hook para auto-refresh de múltiplas URLs de fotos
 *
 * @param urls - Array de URLs de fotos
 * @returns { urls, isRefreshing, refreshAll, errors }
 *
 * Uso:
 * ```tsx
 * const photoUrls = usePhotoUrls([
 *   measurement.photoFront,
 *   measurement.photoSide,
 *   measurement.photoBack
 * ]);
 *
 * photoUrls.urls.forEach((url, i) => (
 *   <Image key={i} source={{ uri: url }} />
 * ));
 * ```
 */
export const usePhotoUrls = (
  initialUrls: (string | null | undefined)[],
  autoRefresh = true
) => {
  const [urls, setUrls] = useState<(string | null)[]>(
    initialUrls.map((url) => url || null)
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errors, setErrors] = useState<(string | null)[]>([]);

  /**
   * Atualiza todas as URLs
   */
  const refreshAll = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setErrors([]);

      const newUrls = await Promise.all(
        urls.map(async (url, index) => {
          if (!url) return null;

          try {
            const key = storageService.extractKeyFromUrl(url);
            if (!key) {
              throw new Error(`Não foi possível extrair key da URL ${index}`);
            }

            const newUrl = await storageService.refreshSignedUrl(key);
            return newUrl;
          } catch (err: any) {
            console.error(`❌ Erro ao atualizar URL ${index}:`, err);
            setErrors((prev) => {
              const newErrors = [...prev];
              newErrors[index] = err.message || "Erro ao atualizar URL";
              return newErrors;
            });
            return url; // Mantém URL antiga se falhar
          }
        })
      );

      setUrls(newUrls);
    } catch (err: any) {
      console.error("❌ Erro ao atualizar URLs:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [urls]);

  /**
   * Verifica URLs expiradas e atualiza automaticamente
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const checkAndRefresh = async () => {
      const hasExpired = urls.some(
        (url) => url && storageService.isUrlExpired(url)
      );

      if (hasExpired) {
        await refreshAll();
      }
    };

    checkAndRefresh();

    // Verifica a cada 1 hora
    const interval = setInterval(checkAndRefresh, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [urls, autoRefresh, refreshAll]);

  /**
   * Atualiza URLs quando initialUrls mudar
   */
  useEffect(() => {
    setUrls(initialUrls.map((url) => url || null));
  }, [initialUrls]);

  return {
    urls,
    isRefreshing,
    refreshAll,
    errors,
  };
};
