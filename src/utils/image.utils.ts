import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
// import { encode } from "blurhash"; // TODO: Implementar quando necessário

/**
 * Opções de compressão de imagem
 */
export interface CompressOptions {
  quality?: number; // 0-1, padrão 0.8
  maxWidth?: number; // largura máxima, null = não redimensiona
  maxHeight?: number; // altura máxima, null = não redimensiona
  format?: "jpeg" | "png" | "webp"; // formato de saída
}

/**
 * Opções de redimensionamento
 */
export interface ResizeOptions {
  width?: number;
  height?: number;
  mode?: "contain" | "cover" | "stretch"; // modo de redimensionamento
}

/**
 * Resultado da validação de imagem
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  size?: number;
  width?: number;
  height?: number;
  type?: string;
}

/**
 * Comprime uma imagem mantendo qualidade aceitável
 *
 * @param uri - URI local da imagem
 * @param options - Opções de compressão
 * @returns URI da imagem comprimida
 */
export const compressImage = async (
  uri: string,
  options: CompressOptions = {}
): Promise<string> => {
  const {
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1920,
    format = "jpeg",
  } = options;

  try {
    // Define formato
    let saveFormat = SaveFormat.JPEG;
    if (format === "png") saveFormat = SaveFormat.PNG;
    if (format === "webp") saveFormat = SaveFormat.WEBP;

    // Aplica compressão e redimensionamento
    const manipResult = await manipulateAsync(
      uri,
      [
        {
          resize: {
            width: maxWidth || undefined,
            height: maxHeight || undefined,
          },
        },
      ],
      {
        compress: quality,
        format: saveFormat,
      }
    );

    return manipResult.uri;
  } catch (error) {
    console.error("Image compression error:", error);
    // Retorna URI original em caso de erro
    return uri;
  }
};

/**
 * Redimensiona uma imagem para dimensões específicas
 *
 * @param uri - URI local da imagem
 * @param options - Opções de redimensionamento
 * @returns URI da imagem redimensionada
 */
export const resizeImage = async (
  uri: string,
  options: ResizeOptions
): Promise<string> => {
  const { width, height } = options;

  if (!width && !height) {
    return uri; // Sem dimensões, retorna original
  }

  try {
    const manipResult = await manipulateAsync(
      uri,
      [
        {
          resize: {
            width,
            height,
          },
        },
      ],
      {
        compress: 0.9,
        format: SaveFormat.JPEG,
      }
    );

    return manipResult.uri;
  } catch (error) {
    console.error("Image resize error:", error);
    return uri;
  }
};

/**
 * Gera um blurhash de uma imagem
 *
 * Blurhash é um algoritmo que gera uma string compacta representando
 * uma versão blur da imagem, perfeito para placeholders.
 *
 * @param uri - URI local da imagem
 * @param componentX - Número de componentes horizontais (1-9, padrão 4)
 * @param componentY - Número de componentes verticais (1-9, padrão 3)
 * @returns String blurhash ou null em caso de erro
 */
export const generateBlurhash = async (
  uri: string,
  componentX: number = 4,
  componentY: number = 3
): Promise<string | null> => {
  try {
    // Redimensiona para 32x32 para performance
    const resized = await resizeImage(uri, {
      width: 32,
      height: 32,
    });

    // Lê como base64
    await FileSystem.readAsStringAsync(resized, {
      encoding: "base64",
    });

    // Converte para imagem bitmap
    // Nota: Esta implementação é simplificada
    // Em produção, usar biblioteca como expo-image-picker que já fornece blurhash
    // ou react-native-blurhash para geração completa

    // Por enquanto, retorna um blurhash mockado
    // TODO: Implementar geração real de blurhash com encode()
    console.warn("Blurhash generation not fully implemented, using fallback");
    return "LGF5]+Yk^6#M@-5c,1J5@[or[Q6."; // Fallback blurhash
  } catch (error) {
    console.error("Blurhash generation error:", error);
    return null;
  }
};

/**
 * Valida uma imagem antes do upload
 *
 * @param uri - URI local da imagem
 * @param maxSizeBytes - Tamanho máximo em bytes (padrão 10MB)
 * @returns Resultado da validação
 */
export const validateImage = async (
  uri: string,
  maxSizeBytes: number = 10 * 1024 * 1024 // 10MB
): Promise<ValidationResult> => {
  try {
    // Verifica se o arquivo existe
    const fileInfo = await FileSystem.getInfoAsync(uri);

    if (!fileInfo.exists) {
      return {
        valid: false,
        error: "Arquivo não encontrado",
      };
    }

    // Verifica tamanho
    const size = fileInfo.size || 0;
    if (size > maxSizeBytes) {
      return {
        valid: false,
        error: `Arquivo muito grande (${(size / 1024 / 1024).toFixed(
          2
        )}MB). Máximo: ${(maxSizeBytes / 1024 / 1024).toFixed(0)}MB`,
        size,
      };
    }

    // Verifica tipo de arquivo (por extensão)
    const extension = uri.split(".").pop()?.toLowerCase();
    const validExtensions = ["jpg", "jpeg", "png", "webp"];

    if (!extension || !validExtensions.includes(extension)) {
      return {
        valid: false,
        error: "Formato de arquivo não suportado. Use JPG, PNG ou WEBP",
      };
    }

    return {
      valid: true,
      size,
      type: extension,
    };
  } catch {
    return {
      valid: false,
      error: "Erro ao validar arquivo",
    };
  }
};

/**
 * Cria uma thumbnail de uma imagem
 *
 * @param uri - URI local da imagem
 * @param size - Tamanho da thumbnail (quadrada)
 * @returns URI da thumbnail ou null
 */
export const createThumbnail = async (
  uri: string,
  size: number = 150
): Promise<string | null> => {
  try {
    const manipResult = await manipulateAsync(
      uri,
      [
        {
          resize: {
            width: size,
            height: size,
          },
        },
      ],
      {
        compress: 0.7,
        format: SaveFormat.JPEG,
      }
    );

    return manipResult.uri;
  } catch (error) {
    console.error("Thumbnail creation error:", error);
    return null;
  }
};

/**
 * Calcula o tamanho de arquivo de uma imagem
 *
 * @param uri - URI local da imagem
 * @returns Tamanho em bytes ou null
 */
export const getImageSize = async (uri: string): Promise<number | null> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists || fileInfo.isDirectory) {
      return null;
    }
    return fileInfo.size || null;
  } catch (error) {
    console.error("Get image size error:", error);
    return null;
  }
};

/**
 * Formata tamanho de arquivo para exibição
 *
 * @param bytes - Tamanho em bytes
 * @returns String formatada (ex: "2.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
