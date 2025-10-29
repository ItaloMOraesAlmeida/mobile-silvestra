import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Linking,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { lightTheme } from "../../theme";
import { useAuthStore } from "../../stores/auth.store";
import { useAvatar } from "../../hooks/use-avatar";
import * as ImagePicker from "expo-image-picker";
import { api } from "../../services/api.service";
import Toast from "react-native-toast-message";

type PermissionModalType = "camera" | "gallery" | null;

export function ProfileScreen() {
  const user = useAuthStore((state) => state.user); // Subscription reativa
  const setUser = useAuthStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] =
    useState<PermissionModalType>(null);

  const getAvatarKey = (): string | null => {
    return user?.avatarUrl || null;
  };

  const { avatarUrl } = useAvatar(getAvatarKey());

  const fetchUserProfile = async () => {
    const response = await api.get("/users/me");
    const updatedUser = response.data;
    setUser(updatedUser);
    return updatedUser;
  };

  const uploadAvatarToBackend = async (imageUri: string) => {
    try {
      const formData = new FormData();

      const filename = imageUri.split("/").pop() || "avatar.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("avatar", {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const response = await api.post("/users/me/avatar", formData);

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao fazer upload da imagem"
      );
    }
  };

  const handleEditProfile = () => {
    // TODO: Navegar para tela de edição de perfil
    Toast.show({
      type: "info",
      text1: "Em Desenvolvimento",
      text2: "A edição de perfil será implementada em breve!",
      position: "top",
      visibilityTime: 3000,
    });
  };

  const checkCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.getCameraPermissionsAsync();

    if (status === "granted") {
      return true;
    }

    if (status === "denied") {
      // Permissão foi negada anteriormente - mostrar modal customizado
      setShowPermissionModal("camera");
      return false;
    }

    // Solicitar permissão
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    return permissionResult.granted;
  };

  const checkGalleryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();

    if (status === "granted") {
      return true;
    }

    if (status === "denied") {
      // Permissão foi negada anteriormente - mostrar modal customizado
      setShowPermissionModal("gallery");
      return false;
    }

    // Solicitar permissão
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    return permissionResult.granted;
  };

  const handleTakePhoto = async () => {
    setShowPhotoModal(false);

    // Aguardar um frame para garantir que o modal fechou
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const hasPermission = await checkCameraPermission();
      if (!hasPermission) {
        return;
      }

      // Abrir câmera com opções de edição
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
        cameraType: ImagePicker.CameraType.front,
      });

      if (result.canceled) {
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        return;
      }

      if (!result.canceled && result.assets[0]) {
        setIsLoading(true);

        try {
          // Upload para o backend
          await uploadAvatarToBackend(result.assets[0].uri);

          // Buscar perfil atualizado do backend (igual ao login)
          // O useAvatar vai automaticamente detectar a mudança de KEY
          // através da assinatura reativa e buscar a nova URL
          await fetchUserProfile();

          Toast.show({
            type: "success",
            text1: "Sucesso!",
            text2: "Avatar atualizado com sucesso",
            position: "top",
            visibilityTime: 3000,
          });
        } catch (error: any) {
          Toast.show({
            type: "error",
            text1: "Erro no Upload",
            text2: error.message || "Não foi possível fazer upload da foto.",
            position: "top",
            visibilityTime: 4000,
          });
        } finally {
          setIsLoading(false);
        }
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível tirar a foto.",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  const handlePickImage = async () => {
    setShowPhotoModal(false);

    try {
      const hasPermission = await checkGalleryPermission();
      if (!hasPermission) {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
      });

      if (result.canceled) {
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        return;
      }
      if (!result.canceled && result.assets[0]) {
        setIsLoading(true);

        try {
          // Upload para o backend
          await uploadAvatarToBackend(result.assets[0].uri);

          // Buscar perfil atualizado do backend (igual ao login)
          // O useAvatar vai automaticamente detectar a mudança de KEY
          // através da assinatura reativa e buscar a nova URL
          await fetchUserProfile();

          Toast.show({
            type: "success",
            text1: "Sucesso!",
            text2: "Avatar atualizado com sucesso",
            position: "top",
            visibilityTime: 3000,
          });
        } catch (error: any) {
          Toast.show({
            type: "error",
            text1: "Erro no Upload",
            text2: error.message || "Não foi possível fazer upload da imagem.",
            position: "top",
            visibilityTime: 4000,
          });
        } finally {
          setIsLoading(false);
        }
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível selecionar a imagem.",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  const handleChangeAvatar = () => {
    setShowPhotoModal(true);
  };

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      nutritionist: "Nutricionista",
      patient: "Paciente",
      normal: "Usuário",
    };
    return roles[role] || "Usuário";
  };

  const getRoleIcon = (role: string): keyof typeof Ionicons.glyphMap => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      nutritionist: "medical",
      patient: "person",
      normal: "person",
    };
    return icons[role] || "person";
  };

  const getInitials = (name: string) => {
    const names = name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const profileSections = [
    {
      title: "Informações Pessoais",
      items: [
        { icon: "person-outline", label: "Nome", value: user?.name },
        { icon: "mail-outline", label: "Email", value: user?.email },
        {
          icon: "briefcase-outline",
          label: "Perfil",
          value: getRoleName(user?.role || ""),
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header com Avatar */}
      <LinearGradient
        colors={[lightTheme.colors.primary, lightTheme.colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            onPress={handleChangeAvatar}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <View style={styles.avatarWrapper}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {getInitials(user?.name || "U")}
                  </Text>
                </View>
              )}

              {/* Loading Overlay */}
              {isLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator
                    size="large"
                    color={lightTheme.colors.white}
                  />
                  <Text style={styles.loadingText}>Salvando...</Text>
                </View>
              )}

              {/* Edit Badge */}
              <View style={styles.editBadge}>
                <LinearGradient
                  colors={[
                    lightTheme.colors.primary,
                    lightTheme.colors.primaryDark,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.editBadgeGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={lightTheme.colors.white}
                    />
                  ) : (
                    <Ionicons
                      name="camera"
                      size={16}
                      color={lightTheme.colors.white}
                    />
                  )}
                </LinearGradient>
              </View>
            </View>
          </TouchableOpacity>

          {/* User Name */}
          <Text style={styles.userName}>{user?.name || "Usuário"}</Text>

          {/* Role Badge */}
          <View style={styles.roleBadge}>
            <Ionicons
              name={getRoleIcon(user?.role || "")}
              size={14}
              color={lightTheme.colors.white}
            />
            <Text style={styles.roleText}>{getRoleName(user?.role || "")}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Edit Button */}
      <View style={styles.editButtonContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditProfile}
          activeOpacity={0.8}
        >
          <Ionicons
            name="create-outline"
            size={20}
            color={lightTheme.colors.primary}
          />
          <Text style={styles.editButtonText}>Editar Perfil</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Sections */}
      {profileSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.card}>
            {section.items.map((item, itemIndex) => (
              <View
                key={itemIndex}
                style={[
                  styles.infoItem,
                  itemIndex !== section.items.length - 1 && styles.itemBorder,
                ]}
              >
                <View style={styles.infoIconContainer}>
                  <Ionicons
                    name={item.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={lightTheme.colors.primary}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value || "—"}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Statistics (Placeholder) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estatísticas</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Dias Ativo</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Check-ins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Objetivos</Text>
          </View>
        </View>
      </View>

      {/* Bottom Spacer */}
      <View style={styles.bottomSpacer} />

      {/* Modal de Seleção de Foto */}
      <Modal
        visible={showPhotoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPhotoModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Escolher Foto</Text>
              <TouchableOpacity
                onPress={() => setShowPhotoModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={lightTheme.colors.gray[500]}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalOptions}>
              {/* Câmera */}
              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleTakePhoto}
                activeOpacity={0.7}
              >
                <View style={styles.modalOptionIcon}>
                  <Ionicons
                    name="camera-outline"
                    size={28}
                    color={lightTheme.colors.primary}
                  />
                </View>
                <View style={styles.modalOptionText}>
                  <Text style={styles.modalOptionTitle}>Usar Câmera</Text>
                  <Text style={styles.modalOptionDescription}>
                    Tirar uma nova foto
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={lightTheme.colors.gray[400]}
                />
              </TouchableOpacity>

              {/* Galeria */}
              <TouchableOpacity
                style={styles.modalOption}
                onPress={handlePickImage}
                activeOpacity={0.7}
              >
                <View style={styles.modalOptionIcon}>
                  <Ionicons
                    name="images-outline"
                    size={28}
                    color={lightTheme.colors.primary}
                  />
                </View>
                <View style={styles.modalOptionText}>
                  <Text style={styles.modalOptionTitle}>
                    Escolher da Galeria
                  </Text>
                  <Text style={styles.modalOptionDescription}>
                    Selecionar foto existente
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={lightTheme.colors.gray[400]}
                />
              </TouchableOpacity>
            </View>

            {/* Botão Cancelar */}
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowPhotoModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Permissão Negada */}
      <Modal
        visible={showPermissionModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPermissionModal(null)}
      >
        <View style={styles.permissionModalOverlay}>
          <View style={styles.permissionModalContent}>
            {/* Ícone de Alerta */}
            <View style={styles.permissionIconContainer}>
              <Ionicons
                name="lock-closed"
                size={48}
                color={lightTheme.colors.primary}
              />
            </View>

            {/* Título */}
            <Text style={styles.permissionModalTitle}>
              Permissão Necessária
            </Text>

            {/* Descrição */}
            <Text style={styles.permissionModalDescription}>
              {showPermissionModal === "camera"
                ? "Para tirar fotos, você precisa permitir o acesso à câmera nas configurações do dispositivo."
                : "Para escolher fotos, você precisa permitir o acesso à galeria nas configurações do dispositivo."}
            </Text>

            {/* Botões */}
            <View style={styles.permissionModalButtons}>
              <TouchableOpacity
                style={styles.permissionButtonPrimary}
                onPress={() => {
                  setShowPermissionModal(null);
                  Linking.openSettings();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.permissionButtonPrimaryText}>
                  Abrir Configurações
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.permissionButtonSecondary}
                onPress={() => setShowPermissionModal(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.permissionButtonSecondaryText}>
                  Agora Não
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[50],
  },
  header: {
    paddingTop: lightTheme.spacing["2xl"] + lightTheme.spacing.xl,
    paddingBottom: lightTheme.spacing["3xl"],
    borderBottomLeftRadius: lightTheme.borderRadius["2xl"],
    borderBottomRightRadius: lightTheme.borderRadius["2xl"],
    alignItems: "center",
  },
  avatarContainer: {
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: lightTheme.spacing.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: lightTheme.borderRadius.full,
    borderWidth: 4,
    borderColor: lightTheme.colors.white,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: lightTheme.colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: lightTheme.colors.white,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: lightTheme.borderRadius.full,
    borderWidth: 4,
    borderColor: lightTheme.colors.white,
    backgroundColor: lightTheme.colors.white, // Evita fundo escuro/transparente
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    gap: lightTheme.spacing.sm,
  },
  loadingText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.white,
  },
  avatarText: {
    fontSize: lightTheme.typography.fontSize["3xl"],
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.primary,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    borderRadius: lightTheme.borderRadius.full,
    ...lightTheme.shadows.lg,
  },
  editBadgeGradient: {
    width: 36,
    height: 36,
    borderRadius: lightTheme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: lightTheme.colors.white,
  },
  userName: {
    fontSize: lightTheme.typography.fontSize["2xl"],
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.white,
    marginBottom: lightTheme.spacing.sm,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.primaryLight,
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.xs,
    borderRadius: lightTheme.borderRadius.full,
    gap: lightTheme.spacing.xs - 2,
    opacity: 0.9,
  },
  roleText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.white,
  },
  editButtonContainer: {
    marginTop: -24,
    paddingHorizontal: lightTheme.spacing.xl,
    marginBottom: lightTheme.spacing.md,
    zIndex: 10,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: lightTheme.colors.white,
    paddingVertical: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.lg,
    gap: lightTheme.spacing.sm,
    ...lightTheme.shadows.md,
  },
  editButtonText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.primary,
  },
  section: {
    paddingHorizontal: lightTheme.spacing.xl,
    marginTop: lightTheme.spacing.xl,
  },
  sectionTitle: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[700],
    marginBottom: lightTheme.spacing.md,
  },
  card: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    ...lightTheme.shadows.sm,
    overflow: "hidden",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: lightTheme.spacing.lg,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: lightTheme.borderRadius.md,
    backgroundColor: lightTheme.colors.primaryBackground,
    alignItems: "center",
    justifyContent: "center",
    marginRight: lightTheme.spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
    marginBottom: lightTheme.spacing.xs - 2,
  },
  infoValue: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[800],
  },
  statsContainer: {
    flexDirection: "row",
    gap: lightTheme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: lightTheme.colors.white,
    padding: lightTheme.spacing.lg,
    borderRadius: lightTheme.borderRadius.lg,
    alignItems: "center",
    ...lightTheme.shadows.sm,
  },
  statValue: {
    fontSize: lightTheme.typography.fontSize["2xl"],
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.primary,
    marginBottom: lightTheme.spacing.xs,
  },
  statLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    textAlign: "center",
  },
  bottomSpacer: {
    height: lightTheme.spacing["2xl"],
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: lightTheme.colors.white,
    borderTopLeftRadius: lightTheme.borderRadius["2xl"],
    borderTopRightRadius: lightTheme.borderRadius["2xl"],
    paddingBottom: lightTheme.spacing["2xl"],
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: lightTheme.spacing.xl,
    paddingTop: lightTheme.spacing.xl,
    paddingBottom: lightTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  modalTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[800],
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOptions: {
    paddingHorizontal: lightTheme.spacing.xl,
    paddingTop: lightTheme.spacing.lg,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: lightTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  modalOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: lightTheme.borderRadius.lg,
    backgroundColor: lightTheme.colors.primaryBackground,
    alignItems: "center",
    justifyContent: "center",
    marginRight: lightTheme.spacing.md,
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[800],
    marginBottom: lightTheme.spacing.xs - 2,
  },
  modalOptionDescription: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
  },
  modalCancelButton: {
    marginHorizontal: lightTheme.spacing.xl,
    marginTop: lightTheme.spacing.lg,
    paddingVertical: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.lg,
    backgroundColor: lightTheme.colors.gray[100],
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[700],
  },
  // Permission Modal Styles
  permissionModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: lightTheme.spacing["2xl"],
  },
  permissionModalContent: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius["2xl"],
    padding: lightTheme.spacing.xl,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    ...lightTheme.shadows.lg,
  },
  permissionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: lightTheme.colors.primaryBackground,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: lightTheme.spacing.lg,
  },
  permissionModalTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[800],
    marginBottom: lightTheme.spacing.sm,
    textAlign: "center",
    paddingHorizontal: lightTheme.spacing.xs,
  },
  permissionModalDescription: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
    lineHeight: lightTheme.typography.fontSize.sm * 1.5,
    marginBottom: lightTheme.spacing.lg,
    paddingHorizontal: lightTheme.spacing.xs,
  },
  permissionModalButtons: {
    flexDirection: "column",
    width: "100%",
    gap: lightTheme.spacing.sm,
  },
  permissionButtonPrimary: {
    width: "100%",
    paddingVertical: lightTheme.spacing.md,
    paddingHorizontal: lightTheme.spacing.lg,
    borderRadius: lightTheme.borderRadius.lg,
    backgroundColor: lightTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionButtonPrimaryText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.white,
    textAlign: "center",
  },
  permissionButtonSecondary: {
    width: "100%",
    paddingVertical: lightTheme.spacing.md,
    paddingHorizontal: lightTheme.spacing.lg,
    borderRadius: lightTheme.borderRadius.lg,
    backgroundColor: lightTheme.colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  permissionButtonSecondaryText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[700],
    textAlign: "center",
  },
});
