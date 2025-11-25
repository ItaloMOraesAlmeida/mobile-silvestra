import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles } from "../../hooks/useTheme";
import type { Theme } from "../../theme";

interface PhotoGalleryProps {
  photoFront?: string | null;
  photoSide?: string | null;
  photoBack?: string | null;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_SIZE = SCREEN_WIDTH - 80; // Padding lateral

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photoFront,
  photoSide,
  photoBack,
}) => {
  const styles = useThemedStyles(createStyles);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const photos = [
    { uri: photoFront, label: "Frente" },
    { uri: photoSide, label: "Lado" },
    { uri: photoBack, label: "Costas" },
  ].filter((photo) => photo.uri);

  if (photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="images-outline"
          size={48}
          color={styles.emptyIcon.color}
        />
        <Text style={styles.emptyText}>Nenhuma foto disponível</Text>
      </View>
    );
  }

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / PHOTO_SIZE);
    setActiveIndex(index);
  };

  return (
    <>
      <View style={styles.container}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
        >
          {photos.map((photo, index) => (
            <TouchableOpacity
              key={index}
              style={styles.photoContainer}
              onPress={() => setSelectedPhoto(photo.uri!)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: photo.uri! }}
                style={styles.photo}
                resizeMode="cover"
              />
              <View style={styles.labelContainer}>
                <Text style={styles.label}>{photo.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Indicadores de página */}
        {photos.length > 1 && (
          <View style={styles.indicators}>
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
      </View>

      {/* Modal de visualização expandida */}
      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setSelectedPhoto(null)}
          >
            <Ionicons
              name="close-circle"
              size={40}
              color={styles.modalCloseIcon.color}
            />
          </TouchableOpacity>
          {selectedPhoto && (
            <Image
              source={{ uri: selectedPhoto }}
              style={styles.modalPhoto}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: "100%",
    },
    scrollContent: {
      alignItems: "center",
    },
    photoContainer: {
      width: PHOTO_SIZE,
      height: PHOTO_SIZE,
      marginHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      overflow: "hidden",
      backgroundColor: theme.colors.surface,
      ...theme.shadows.md,
    },
    photo: {
      width: "100%",
      height: "100%",
    },
    labelContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    label: {
      color: theme.colors.white,
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      textAlign: "center",
    },
    indicators: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    indicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.border,
    },
    activeIndicator: {
      backgroundColor: theme.colors.primary,
      width: 24,
    },
    emptyContainer: {
      paddingVertical: theme.spacing.xl,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyIcon: {
      color: theme.colors.textSecondary,
    },
    emptyText: {
      marginTop: theme.spacing.sm,
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
    modalContainer: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.95)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalCloseButton: {
      position: "absolute",
      top: 50,
      right: 20,
      zIndex: 10,
    },
    modalCloseIcon: {
      color: theme.colors.white,
    },
    modalPhoto: {
      width: SCREEN_WIDTH,
      height: SCREEN_WIDTH,
    },
  });
