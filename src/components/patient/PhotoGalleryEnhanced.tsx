import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import { usePhotoUrls } from "../../hooks/usePhotoUrl";
import type { Theme } from "../../theme";

interface Photo {
  uri: string;
  label: string;
}

interface PhotoGalleryEnhancedProps {
  photoFront?: string | null;
  photoSide?: string | null;
  photoBack?: string | null;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;

/**
 * Galeria de fotos avançada com zoom, pinch, pan e gestos
 */
export const PhotoGalleryEnhanced: React.FC<PhotoGalleryEnhancedProps> = ({
  photoFront,
  photoSide,
  photoBack,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();

  // Auto-refresh de URLs expiradas
  const photoUrls = usePhotoUrls([photoFront, photoSide, photoBack]);

  const [modalVisible, setModalVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: number]: boolean }>({});

  // Animated values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  const photos: Photo[] = [
    { uri: photoUrls.urls[0] || "", label: "Frente" },
    { uri: photoUrls.urls[1] || "", label: "Lado" },
    { uri: photoUrls.urls[2] || "", label: "Costas" },
  ].filter((photo) => photo.uri);

  /**
   * Reset zoom e posição
   */
  const resetZoom = () => {
    "worklet";
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    offsetX.value = 0;
    offsetY.value = 0;
  };

  /**
   * Pinch gesture
   */
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newScale = savedScale.value * event.scale;
      scale.value = Math.max(MIN_SCALE, Math.min(newScale, MAX_SCALE));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < MIN_SCALE) {
        scale.value = withSpring(MIN_SCALE);
        savedScale.value = MIN_SCALE;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        offsetX.value = 0;
        offsetY.value = 0;
      } else if (scale.value > MAX_SCALE) {
        scale.value = withSpring(MAX_SCALE);
        savedScale.value = MAX_SCALE;
      }
    });

  /**
   * Pan gesture
   */
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value > 1) {
        const maxTranslateX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
        const maxTranslateY = ((SCREEN_HEIGHT - 200) * (scale.value - 1)) / 2;

        translateX.value = Math.max(
          -maxTranslateX,
          Math.min(offsetX.value + event.translationX, maxTranslateX)
        );
        translateY.value = Math.max(
          -maxTranslateY,
          Math.min(offsetY.value + event.translationY, maxTranslateY)
        );
      }
    })
    .onEnd(() => {
      offsetX.value = translateX.value;
      offsetY.value = translateY.value;
    });

  /**
   * Double tap gesture
   */
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      if (scale.value > 1) {
        // Reset zoom
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        offsetX.value = 0;
        offsetY.value = 0;
      } else {
        // Zoom in
        scale.value = withSpring(DOUBLE_TAP_SCALE);
        savedScale.value = DOUBLE_TAP_SCALE;

        // Zoom para o ponto tocado
        const centerX = SCREEN_WIDTH / 2;
        const centerY = (SCREEN_HEIGHT - 200) / 2;
        const newOffsetX = (event.x - centerX) * (DOUBLE_TAP_SCALE - 1);
        const newOffsetY = (event.y - centerY) * (DOUBLE_TAP_SCALE - 1);

        translateX.value = withSpring(-newOffsetX);
        translateY.value = withSpring(-newOffsetY);
        offsetX.value = -newOffsetX;
        offsetY.value = -newOffsetY;
      }
    });

  /**
   * Composed gesture
   */
  const composedGesture = Gesture.Simultaneous(
    doubleTapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture)
  );

  /**
   * Estilo animado da imagem
   */
  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="images-outline"
          size={48}
          color={theme.colors.textSecondary}
        />
        <Text style={styles.emptyText}>Nenhuma foto disponível</Text>
      </View>
    );
  }

  /**
   * Navegar para foto anterior
   */
  const handlePrevious = () => {
    if (activeIndex > 0) {
      resetZoom();
      setActiveIndex(activeIndex - 1);
    }
  };

  /**
   * Navegar para próxima foto
   */
  const handleNext = () => {
    if (activeIndex < photos.length - 1) {
      resetZoom();
      setActiveIndex(activeIndex + 1);
    }
  };

  /**
   * Abrir modal fullscreen
   */
  const openPhoto = (index: number) => {
    setActiveIndex(index);
    setModalVisible(true);
  };

  /**
   * Fechar modal
   */
  const closeModal = () => {
    resetZoom();
    setModalVisible(false);
  };

  /**
   * Handle image load start
   */
  const handleLoadStart = (index: number) => {
    setLoading((prev) => ({ ...prev, [index]: true }));
  };

  /**
   * Handle image load end
   */
  const handleLoadEnd = (index: number) => {
    setLoading((prev) => ({ ...prev, [index]: false }));
  };

  /**
   * Handle image load error
   */
  const handleError = (index: number) => {
    setLoading((prev) => ({ ...prev, [index]: false }));
    setErrors((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <>
      {/* Thumbnails Grid */}
      <View style={styles.thumbnailsContainer}>
        {photos.map((photo, index) => (
          <TouchableOpacity
            key={index}
            style={styles.thumbnailWrapper}
            onPress={() => openPhoto(index)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: photo.uri }}
              style={styles.thumbnail}
              resizeMode="cover"
              onLoadStart={() => handleLoadStart(index)}
              onLoadEnd={() => handleLoadEnd(index)}
              onError={() => handleError(index)}
            />
            {loading[index] && (
              <View style={styles.thumbnailLoading}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            )}
            {errors[index] && (
              <View style={styles.thumbnailError}>
                <Ionicons
                  name="alert-circle"
                  size={24}
                  color={theme.colors.error}
                />
              </View>
            )}
            <View style={styles.thumbnailLabel}>
              <Text style={styles.thumbnailLabelText}>{photo.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fullscreen Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <GestureHandlerRootView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.photoCounter}>
                  {activeIndex + 1} de {photos.length}
                </Text>
                <Text style={styles.photoLabel}>
                  {photos[activeIndex].label}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Image with Gestures */}
            <View style={styles.imageContainer}>
              <GestureDetector gesture={composedGesture}>
                <Animated.View style={styles.imageWrapper}>
                  <Animated.Image
                    source={{ uri: photos[activeIndex].uri }}
                    style={[styles.fullscreenImage, animatedImageStyle]}
                    resizeMode="contain"
                  />
                </Animated.View>
              </GestureDetector>
            </View>

            {/* Navigation Buttons */}
            {photos.length > 1 && (
              <>
                {activeIndex > 0 && (
                  <TouchableOpacity
                    style={[styles.navButton, styles.navButtonLeft]}
                    onPress={handlePrevious}
                    hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <Ionicons name="chevron-back" size={32} color="#fff" />
                  </TouchableOpacity>
                )}
                {activeIndex < photos.length - 1 && (
                  <TouchableOpacity
                    style={[styles.navButton, styles.navButtonRight]}
                    onPress={handleNext}
                    hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <Ionicons name="chevron-forward" size={32} color="#fff" />
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Page Indicators */}
            {photos.length > 1 && (
              <View style={styles.indicatorsContainer}>
                {photos.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      index === activeIndex && styles.activeIndicator,
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Zoom Hint */}
            {scale.value === 1 && (
              <View style={styles.hintContainer}>
                <Ionicons name="expand-outline" size={20} color="#fff" />
                <Text style={styles.hintText}>
                  Toque duas vezes ou use dois dedos para dar zoom
                </Text>
              </View>
            )}
          </View>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    // Thumbnails
    thumbnailsContainer: {
      flexDirection: "row",
      gap: theme.spacing.md,
      flexWrap: "wrap",
    },
    thumbnailWrapper: {
      flex: 1,
      minWidth: "30%",
      aspectRatio: 3 / 4,
      borderRadius: theme.borderRadius.md,
      overflow: "hidden",
      backgroundColor: theme.colors.surface,
      ...theme.shadows.md,
    },
    thumbnail: {
      width: "100%",
      height: "100%",
    },
    thumbnailLoading: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    thumbnailError: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    thumbnailLabel: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
    },
    thumbnailLabelText: {
      color: "#fff",
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      textAlign: "center",
    },

    // Empty state
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    emptyText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },

    // Modal
    modalContainer: {
      flex: 1,
      backgroundColor: "#000",
    },
    modalContent: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: theme.spacing.md,
      paddingTop: Platform.OS === "ios" ? 50 : theme.spacing.md,
      paddingBottom: theme.spacing.md,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
    },
    modalHeaderLeft: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    photoCounter: {
      color: "#fff",
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    photoLabel: {
      color: "#fff",
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
    },
    closeButton: {
      padding: theme.spacing.xs,
    },

    // Image
    imageContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    imageWrapper: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT - 200,
      justifyContent: "center",
      alignItems: "center",
    },
    fullscreenImage: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT - 200,
    },

    // Navigation
    navButton: {
      position: "absolute",
      top: "50%",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      borderRadius: 25,
      width: 50,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
      marginTop: -25,
    },
    navButtonLeft: {
      left: theme.spacing.md,
    },
    navButtonRight: {
      right: theme.spacing.md,
    },

    // Indicators
    indicatorsContainer: {
      position: "absolute",
      bottom: theme.spacing.xl,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    indicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "rgba(255, 255, 255, 0.5)",
    },
    activeIndicator: {
      backgroundColor: "#fff",
      width: 24,
    },

    // Hint
    hintContainer: {
      position: "absolute",
      bottom: theme.spacing.xl + 30,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xl,
    },
    hintText: {
      color: "rgba(255, 255, 255, 0.8)",
      fontSize: theme.typography.fontSize.sm,
      textAlign: "center",
    },
  });
