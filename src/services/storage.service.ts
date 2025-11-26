import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { api } from "./api";

/**
 * Tipo de foto que está sendo enviada
 */
export type PhotoType = "front" | "side" | "back" | "other";

/**
 * Resultado do upload para Backblaze B2 via API
 */
export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  error?: string;
  fallbackBase64?: string;
}

/**
 * Progress do upload
 */
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Callback para progresso do upload
 */
export type UploadProgressCallback = (progress: UploadProgress) => void;

/**
 * Opções de upload
 */
export interface UploadOptions {
  onProgress?: UploadProgressCallback;
  compress?: boolean;
  fallbackToBase64?: boolean;
  maxRetries?: number;
}

/**
 * Serviço de armazenamento de fotos usando Backblaze B2
 *
 * ✨ IMPORTANTE: Este serviço usa a API backend (/api/upload/measurement-photo)
 * que já está configurada com Backblaze B2. NÃO acessa o B2 diretamente.
 *
 * Características:
 * - Upload via API backend (mais seguro, credenciais no server)
 * - Compressão automática de imagens (max 1920x1920, 80% quality)
 * - Retry automático com backoff exponencial
 * - Progress callbacks em tempo real
 * - Fallback para base64 se upload falhar após todas as tentativas
 * - Validação de tipo e tamanho de arquivo
 */
class StorageService {
  private readonly MAX_WIDTH = 1920;
  private readonly MAX_HEIGHT = 1920;
  private readonly COMPRESSION_QUALITY = 0.8;
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly RETRY_DELAY_BASE = 1000; // 1 segundo
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  /**
   * Comprime uma imagem para otimizar o upload
   */
  private async compressImage(uri: string): Promise<string> {
    try {
      console.log("📸 Comprimindo imagem...");

      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: this.MAX_WIDTH,
              height: this.MAX_HEIGHT,
            },
          },
        ],
        {
          compress: this.COMPRESSION_QUALITY,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      console.log("✅ Imagem comprimida:", manipulated.uri);
      return manipulated.uri;
    } catch (error) {
      console.error("❌ Erro ao comprimir imagem:", error);
      // Se falhar, retorna URI original
      return uri;
    }
  }

  /**
   * Converte URI local para Blob para FormData
   */
  private async uriToBlob(uri: string): Promise<Blob> {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  }

  /**
   * Converte imagem para base64 (fallback)
   */
  private async convertToBase64(uri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error("❌ Erro ao converter para base64:", error);
      throw error;
    }
  }

  /**
   * Valida o arquivo antes do upload
   */
  private async validateFile(
    uri: string
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);

      if (!fileInfo.exists) {
        return { valid: false, error: "Arquivo não encontrado" };
      }

      if (fileInfo.size && fileInfo.size > this.MAX_FILE_SIZE) {
        return {
          valid: false,
          error: `Arquivo muito grande. Tamanho máximo: ${
            this.MAX_FILE_SIZE / 1024 / 1024
          }MB`,
        };
      }

      return { valid: true };
    } catch {
      return { valid: false, error: "Erro ao validar arquivo" };
    }
  }

  /**
   * Faz upload de uma foto com retry automático via API backend
   */
  async uploadPhoto(
    uri: string,
    patientId: string,
    type: PhotoType,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const {
      onProgress,
      compress = true,
      fallbackToBase64 = true,
      maxRetries = this.DEFAULT_MAX_RETRIES,
    } = options;

    try {
      onProgress?.({ loaded: 0, total: 100, percentage: 0 });

      // 1. Validar arquivo
      const validation = await this.validateFile(uri);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      onProgress?.({ loaded: 5, total: 100, percentage: 5 });

      // 2. Comprimir se solicitado
      let finalUri = uri;
      if (compress) {
        finalUri = await this.compressImage(uri);
        onProgress?.({ loaded: 15, total: 100, percentage: 15 });
      }

      // 3. Tentar upload com retry
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 Tentativa ${attempt}/${maxRetries} de upload...`);

          // Converter para Blob
          const blob = await this.uriToBlob(finalUri);

          // Criar FormData
          const formData = new FormData();
          formData.append(
            "file",
            blob as any,
            `${patientId}-${type}-${Date.now()}.jpg`
          );

          // Upload para API
          const response = await api.post<{
            url: string;
            key: string;
            fileName: string;
            mimeType: string;
            size: number;
          }>("/upload/measurement-photo", formData);

          console.log("✅ Upload concluído com sucesso!");
          onProgress?.({ loaded: 100, total: 100, percentage: 100 });

          return {
            success: true,
            url: response.url,
            key: response.key,
            fileName: response.fileName,
            mimeType: response.mimeType,
            size: response.size,
          };
        } catch (error: any) {
          lastError = error;
          console.error(
            `❌ Erro na tentativa ${attempt}/${maxRetries}:`,
            error.message
          );

          // Se não é a última tentativa, aguarda antes de retry
          if (attempt < maxRetries) {
            const delay = this.RETRY_DELAY_BASE * Math.pow(2, attempt - 1); // Backoff exponencial
            console.log(`⏳ Aguardando ${delay}ms antes de retry...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      // Se chegou aqui, todas as tentativas falharam
      console.error(`❌ Todas as ${maxRetries} tentativas falharam`);

      // Tentar fallback para base64
      if (fallbackToBase64) {
        console.warn("⚠️  Usando fallback base64...");
        const base64 = await this.convertToBase64(finalUri);
        return {
          success: true,
          fallbackBase64: base64,
        };
      }

      return {
        success: false,
        error: `Falha ao fazer upload após ${maxRetries} tentativas: ${
          lastError?.message || "Erro desconhecido"
        }`,
      };
    } catch (error: any) {
      console.error("❌ Erro inesperado no upload:", error);
      return {
        success: false,
        error: error.message || "Erro inesperado",
      };
    }
  }

  /**
   * Faz upload de múltiplas fotos sequencialmente
   */
  async uploadPhotos(
    photos: { uri: string; type: PhotoType }[],
    patientId: string,
    onPhotoProgress?: (photoIndex: number, progress: UploadProgress) => void,
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (let i = 0; i < photos.length; i++) {
      const { uri, type } = photos[i];
      const result = await this.uploadPhoto(uri, patientId, type, {
        ...options,
        onProgress: (progress) => onPhotoProgress?.(i, progress),
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Deleta uma foto do Backblaze usando a key
   */
  async deletePhoto(key: string): Promise<void> {
    try {
      console.log("🗑️  Deletando foto:", key);

      await api.delete(`/upload/${key}`);

      console.log("✅ Foto deletada com sucesso");
    } catch (error) {
      console.error("❌ Erro ao deletar foto:", error);
      throw error;
    }
  }

  /**
   * Deleta múltiplas fotos
   */
  async deletePhotos(keys: string[]): Promise<void> {
    for (const key of keys) {
      try {
        await this.deletePhoto(key);
      } catch (error) {
        console.error(`❌ Erro ao deletar foto ${key}:`, error);
        // Continua deletando outras fotos mesmo se uma falhar
      }
    }
  }

  /**
   * Extrai a key de uma URL assinada do Backblaze
   * Exemplo: https://s3.us-west-004.backblazeb2.com/bucket/measurements/xxx.jpg\?signature\=...
   * Retorna: measurements/xxx.jpg
   */
  extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");

      // Remove primeiro elemento vazio e bucket name
      // Path: /bucket/folder/file.jpg → folder/file.jpg
      const key = pathParts.slice(2).join("/");

      return key || null;
    } catch (error) {
      console.error("❌ Erro ao extrair key da URL:", error);
      return null;
    }
  }

  /**
   * Gera uma nova URL assinada para uma key existente
   */
  async refreshSignedUrl(key: string): Promise<string> {
    try {
      const response = await api.post<{ signedUrl: string }>(
        "/upload/signed-url",
        { key }
      );

      return response.signedUrl;
    } catch (error) {
      console.error("❌ Erro ao gerar nova URL assinada:", error);
      throw error;
    }
  }

  /**
   * Verifica se uma URL de foto está expirada (7 dias)
   * URLs assinadas do B2 expiram, então pode ser necessário gerar nova
   */
  isUrlExpired(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const expiresParam = urlObj.searchParams.get("X-Amz-Expires");

      if (!expiresParam) {
        return false; // Sem expiração ou URL pública
      }

      const expires = parseInt(expiresParam, 10);
      const now = Math.floor(Date.now() / 1000);

      return now > expires;
    } catch {
      return false;
    }
  }
}

// Exporta instância singleton
export const storageService = new StorageService();
