import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import type { Theme } from "../../theme";
import { storageService, PhotoType } from "../../services/storage.service";

interface PhotoPickerProps {
  label: string;
  value?: string; // base64 string or URL
  onPhotoSelected: (value: string, key?: string) => void;
  onPhotoRemoved?: () => void;
  disabled?: boolean;
  patientId?: string; // Required for B2 upload
  photoType?: PhotoType; // 'front' | 'side' | 'back' | 'other'
  useCloudStorage?: boolean; // If true, upload to B2; if false, use base64
}

export const PhotoPicker: React.FC<PhotoPickerProps> = ({
  label,
  value,
  onPhotoSelected,
  onPhotoRemoved,
  disabled = false,
  patientId,
  photoType = "other",
  useCloudStorage = false,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const requestPermissions = async (): Promise<boolean> => {
    try {
      // Request camera permission
      const cameraPermission =
        await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPermission.status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Precisamos de acesso à câmera para tirar fotos."
        );
        return false;
      }

      // Request media library permission
      const mediaPermission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (mediaPermission.status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Precisamos de acesso à galeria para selecionar fotos."
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error requesting permissions:", error);
      return false;
    }
  };

  const handlePickImage = async (useCamera: boolean) => {
    if (disabled) return;

    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      setLoading(true);
      setUploadProgress(0);

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        base64: !useCloudStorage, // Only request base64 if NOT using cloud storage
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const imageUri = result.assets[0].uri;

      // Upload to cloud storage (Backblaze B2) if enabled
      if (useCloudStorage && patientId) {
        const uploadResult = await storageService.uploadPhoto(
          imageUri,
          patientId,
          photoType,
          {
            onProgress: (progress) => {
              setUploadProgress(progress.percentage);
            },
            fallbackToBase64: true, // Fallback to base64 if upload fails
          }
        );

        if (!uploadResult.success) {
          Alert.alert(
            "Erro no upload",
            uploadResult.error || "Não foi possível fazer upload da foto"
          );
          return;
        }

        // If uploaded to B2, return the signed URL + key
        if (uploadResult.url && uploadResult.key) {
          onPhotoSelected(uploadResult.url, uploadResult.key);
        }
        // If fallback to base64
        else if (uploadResult.fallbackBase64) {
          onPhotoSelected(
            `data:image/jpeg;base64,${uploadResult.fallbackBase64}`
          );
          Alert.alert(
            "Upload offline",
            "Foto salva localmente. Será enviada para a nuvem quando houver conexão."
          );
        }
      }
      // Use base64 (legacy mode)
      else {
        if (result.assets[0].base64) {
          onPhotoSelected(`data:image/jpeg;base64,${result.assets[0].base64}`);
        } else {
          Alert.alert("Erro", "Não foi possível processar a foto");
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Erro", "Não foi possível selecionar a foto");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleRemovePhoto = () => {
    if (disabled) return;

    Alert.alert("Remover foto", "Deseja remover esta foto?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => onPhotoRemoved?.(),
      },
    ]);
  };

  const showImageSourceOptions = () => {
    if (disabled) return;

    Alert.alert(
      "Selecionar foto",
      "Escolha uma opção",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Câmera",
          onPress: () => handlePickImage(true),
        },
        {
          text: "Galeria",
          onPress: () => handlePickImage(false),
        },
      ],
      { cancelable: true }
    );
  };

  const getImageSource = () => {
    if (!value) return null;

    // Check if it's a base64 string
    if (value.startsWith("data:")) {
      return { uri: value };
    }

    // Check if it's already base64 without prefix
    if (!value.startsWith("http")) {
      return { uri: `data:image/jpeg;base64,${value}` };
    }

    // It's a URL
    return { uri: value };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {value ? (
        <View style={styles.photoContainer}>
          <Image source={getImageSource()!} style={styles.photo} />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <Text style={styles.progressText}>
                  {Math.round(uploadProgress)}%
                </Text>
              )}
            </View>
          )}
          <View style={styles.photoActions}>
            <TouchableOpacity
              style={styles.photoActionButton}
              onPress={showImageSourceOptions}
              disabled={disabled || loading}
            >
              <Ionicons name="camera" size={20} color={theme.colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.photoActionButton, styles.removeButton]}
              onPress={handleRemovePhoto}
              disabled={disabled || loading}
            >
              <Ionicons name="trash" size={20} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.placeholderContainer,
            disabled && styles.placeholderDisabled,
          ]}
          onPress={showImageSourceOptions}
          disabled={disabled || loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <Text style={styles.progressText}>
                  Enviando... {Math.round(uploadProgress)}%
                </Text>
              )}
            </View>
          ) : (
            <>
              <Ionicons
                name="camera"
                size={40}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.placeholderText}>Adicionar foto</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    label: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    placeholderContainer: {
      height: 200,
      backgroundColor: theme.colors.card,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderStyle: "dashed",
      borderRadius: theme.borderRadius.lg,
      justifyContent: "center",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    placeholderDisabled: {
      opacity: 0.5,
    },
    placeholderText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      fontWeight: theme.typography.fontWeight.medium,
    },
    photoContainer: {
      position: "relative",
      height: 200,
      borderRadius: theme.borderRadius.lg,
      overflow: "hidden",
      backgroundColor: theme.colors.card,
    },
    photo: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    loadingContent: {
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    progressText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.white,
      fontWeight: theme.typography.fontWeight.semibold,
      marginTop: theme.spacing.xs,
    },
    photoActions: {
      position: "absolute",
      bottom: theme.spacing.sm,
      right: theme.spacing.sm,
      flexDirection: "row",
      gap: theme.spacing.sm,
    },
    photoActionButton: {
      width: 40,
      height: 40,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
      ...theme.shadows.md,
    },
    removeButton: {
      backgroundColor: theme.colors.error,
    },
  });
