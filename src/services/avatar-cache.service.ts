import AsyncStorage from "@react-native-async-storage/async-storage";

interface CachedAvatar {
  signedUrl: string;
  cachedAt: number; // timestamp
  key: string; // chave do arquivo (avatars/xxx.jpg)
}

const CACHE_PREFIX = "@silvestra:avatar:";
const CACHE_DURATION = 6 * 24 * 60 * 60 * 1000; // 6 dias em milissegundos

class AvatarCacheService {
  /**
   * Salva uma URL assinada no cache
   */
  async set(key: string, signedUrl: string): Promise<void> {
    try {
      const cached: CachedAvatar = {
        signedUrl,
        cachedAt: Date.now(),
        key,
      };

      await AsyncStorage.setItem(
        `${CACHE_PREFIX}${key}`,
        JSON.stringify(cached)
      );
    } catch (error) {
      console.error("❌ [AvatarCache] Erro ao salvar cache:", error);
    }
  }

  /**
   * Recupera uma URL assinada do cache (se ainda válida)
   */
  async get(key: string): Promise<string | null> {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);

      if (!cached) {
        return null;
      }

      const data: CachedAvatar = JSON.parse(cached);

      // Verificar se o cache ainda é válido
      const now = Date.now();
      const age = now - data.cachedAt;
      const isValid = age < CACHE_DURATION;

      if (!isValid) {
        // Remover cache expirado
        await this.remove(key);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error("❌ [AvatarCache] Erro ao ler cache:", error);
      return null;
    }
  }

  /**
   * Remove uma URL do cache
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (error) {
      console.error("❌ [AvatarCache] Erro ao remover cache:", error);
    }
  }

  /**
   * Limpa todo o cache de avatares
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const avatarKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));

      if (avatarKeys.length > 0) {
        await AsyncStorage.multiRemove(avatarKeys);
      }
    } catch (error) {
      console.error("❌ [AvatarCache] Erro ao limpar cache:", error);
    }
  }

  /**
   * Verifica se uma KEY tem cache válido
   */
  async has(key: string): Promise<boolean> {
    const url = await this.get(key);
    return url !== null;
  }
}

export const avatarCacheService = new AvatarCacheService();
