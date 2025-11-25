import React, { useState } from "react";
import {
  View,
  Image,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";

/**
 * Props do componente ProgressiveImage
 */
export interface ProgressiveImageProps {
  /** URI da imagem a ser carregada */
  uri: string;
  /** Blurhash da imagem (placeholder blur) */
  blurhash?: string;
  /** Largura da imagem */
  width: number;
  /** Altura da imagem */
  height: number;
  /** Callback quando imagem carrega */
  onLoad?: () => void;
  /** Callback quando ocorre erro */
  onError?: (error: Error) => void;
  /** URI de thumbnail (carrega primeiro) */
  thumbnailUri?: string;
  /** Número máximo de tentativas (default 3) */
  maxRetries?: number;
  /** Estilo customizado do container */
  style?: any;
  /** Mostra indicador de carregamento */
  showLoadingIndicator?: boolean;
  /** Permite retry manual */
  allowRetry?: boolean;
}

/**
 * Componente de imagem com carregamento progressivo
 *
 * Características:
 * - Blurhash placeholder enquanto carrega
 * - Thumbnail → imagem completa (progressivo)
 * - Retry automático em caso de erro (até 3x)
 * - Fallback para placeholder em caso de falha total
 * - Loading indicator durante carregamento
 * - Botão de retry manual
 */
export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  uri,
  blurhash,
  width,
  height,
  onLoad,
  onError,
  thumbnailUri,
  maxRetries = 3,
  style,
  showLoadingIndicator = true,
  allowRetry = true,
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [fullImageLoaded, setFullImageLoaded] = useState(false);

  /**
   * Handler quando thumbnail carrega
   */
  const handleThumbnailLoad = () => {
    setThumbnailLoaded(true);
  };

  /**
   * Handler quando imagem completa carrega
   */
  const handleFullImageLoad = () => {
    setFullImageLoaded(true);
    setLoading(false);
    setError(false);
    onLoad?.();
  };

  /**
   * Handler de erro no carregamento
   */
  const handleImageError = () => {
    if (retryCount < maxRetries) {
      // Retry automático
      console.log(
        `Image load failed, retrying (${retryCount + 1}/${maxRetries})...`
      );
      setRetryCount((prev) => prev + 1);
      setLoading(true);
      setError(false);
    } else {
      // Falha total
      console.error("Image load failed after all retries");
      setLoading(false);
      setError(true);
      onError?.(new Error("Failed to load image after retries"));
    }
  };

  /**
   * Retry manual
   */
  const handleRetry = () => {
    setRetryCount(0);
    setLoading(true);
    setError(false);
    setThumbnailLoaded(false);
    setFullImageLoaded(false);
  };

  const imageStyles = [styles.image, { width, height }, style];

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Blurhash Placeholder (se disponível) */}
      {blurhash && !thumbnailLoaded && !fullImageLoaded && (
        <View
          style={[
            styles.placeholder,
            { width, height, backgroundColor: theme.colors.surface },
          ]}
        >
          {/* TODO: Usar react-native-blurhash para renderizar blurhash real */}
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: theme.colors.surface },
            ]}
          />
        </View>
      )}

      {/* Thumbnail (carrega primeiro) */}
      {thumbnailUri && !fullImageLoaded && (
        <Image
          source={{ uri: thumbnailUri }}
          style={[imageStyles, styles.thumbnail]}
          onLoad={handleThumbnailLoad}
          onError={() => setThumbnailLoaded(true)} // Continua mesmo se thumbnail falhar
          blurRadius={1}
        />
      )}

      {/* Imagem completa */}
      {!error && (
        <Image
          source={{ uri: `${uri}?retry=${retryCount}` }} // Query param força reload
          style={[
            imageStyles,
            fullImageLoaded ? styles.visible : styles.hidden,
          ]}
          onLoad={handleFullImageLoad}
          onError={handleImageError}
          resizeMode="cover"
        />
      )}

      {/* Loading Indicator */}
      {loading && showLoadingIndicator && !error && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}

      {/* Error State */}
      {error && (
        <View
          style={[
            styles.errorContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Ionicons
            name="image-outline"
            size={48}
            color={theme.colors.textSecondary}
          />
          <Text
            style={[styles.errorText, { color: theme.colors.textSecondary }]}
          >
            Falha ao carregar imagem
          </Text>
          {allowRetry && (
            <TouchableOpacity
              style={[
                styles.retryButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleRetry}
            >
              <Ionicons
                name="refresh-outline"
                size={20}
                color={theme.colors.white}
              />
              <Text style={[styles.retryText, { color: theme.colors.white }]}>
                Tentar novamente
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 8,
  },
  placeholder: {
    position: "absolute",
    top: 0,
    left: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  thumbnail: {
    opacity: 0.8,
  },
  visible: {
    opacity: 1,
  },
  hidden: {
    opacity: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
