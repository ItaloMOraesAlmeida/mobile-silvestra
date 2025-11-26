import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { lightTheme } from "../../theme";
import { useAuthStore } from "../../stores/auth.store";
import { useSettingsStore } from "../../stores/settings.store";
import { BiometricService } from "../../services/biometric";
import { BiometricAuthService } from "../../services/biometric-auth";
import { SkeletonSettingItem } from "../../components/ui/skeleton";
import { ConfirmModal } from "../../components/ui/confirm-modal";
import Toast from "react-native-toast-message";

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  showChevron = false,
}: SettingItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress && !rightElement}
      activeOpacity={onPress || rightElement ? 0.7 : 1}
    >
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={20} color={lightTheme.colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement}
      {showChevron && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={lightTheme.colors.gray[400]}
        />
      )}
    </TouchableOpacity>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // Settings Store
  const settings = useSettingsStore((state) => state.settings);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const setUnits = useSettingsStore((state) => state.setUnits);
  const updateNotifications = useSettingsStore(
    (state) => state.updateNotifications
  );

  // Biometric states
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Modals
  const [showDisableBiometricModal, setShowDisableBiometricModal] =
    useState(false);
  const [showClearCredentialsModal, setShowClearCredentialsModal] =
    useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);

  const checkBiometricStatus = async () => {
    setIsInitialLoading(true);
    try {
      const available = await BiometricService.isAvailable();
      setBiometricAvailable(available);

      if (available) {
        const type = await BiometricService.getBiometricName();
        setBiometricType(type);

        // Verificar se biometria está habilitada via AsyncStorage
        const { StorageService } = await import("../../services/storage");
        const hasCredentials = await StorageService.isBiometricEnabled();
        setBiometricEnabled(hasCredentials);
      }
    } catch {
      setBiometricAvailable(false);
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const handleToggleBiometric = async (value: boolean) => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      if (value) {
        // Habilitar biometria
        const isAuthenticated = await BiometricService.authenticate(
          `Autentique-se para habilitar ${biometricType}`
        );

        if (isAuthenticated) {
          // Salvar credenciais
          const { tokens } = useAuthStore.getState();
          if (tokens && user?.email) {
            await BiometricAuthService.saveBiometricCredentials(
              user.email,
              tokens.accessToken,
              tokens.refreshToken
            );
            setBiometricEnabled(true);
            Toast.show({
              type: "success",
              text1: "Sucesso!",
              text2: `${biometricType} habilitada com sucesso.`,
              position: "top",
              visibilityTime: 3000,
            });
          }
        }
      } else {
        // Desabilitar biometria - abre modal
        setShowDisableBiometricModal(true);
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível alterar as configurações.",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCredentials = () => {
    setShowClearCredentialsModal(true);
  };

  const confirmClearCredentials = async () => {
    await BiometricAuthService.removeBiometricCredentials();
    setBiometricEnabled(false);
    setShowClearCredentialsModal(false);
    Toast.show({
      type: "success",
      text1: "Sucesso",
      text2: "Credenciais removidas com sucesso.",
      position: "top",
      visibilityTime: 3000,
    });
  };

  const confirmDisableBiometric = async () => {
    await BiometricAuthService.removeBiometricCredentials();
    setBiometricEnabled(false);
    setShowDisableBiometricModal(false);
    Toast.show({
      type: "success",
      text1: "Desabilitada",
      text2: `${biometricType} foi desabilitada.`,
      position: "top",
      visibilityTime: 3000,
    });
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      // Limpar biometria se estiver habilitada
      if (biometricEnabled) {
        await BiometricAuthService.removeBiometricCredentials();
      }

      // Fazer logout
      await logout();

      setShowLogoutModal(false);

      // Navegar para tela de autenticação
      navigation.reset({
        index: 0,
        routes: [{ name: "Auth" as never }],
      });
    } catch {
      setShowLogoutModal(false);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível fazer logout.",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  if (isInitialLoading) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Security Section Skeleton */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Segurança</Text>
          <View style={styles.card}>
            <SkeletonSettingItem hasSwitch />
            <View style={styles.divider} />
            <SkeletonSettingItem />
            <View style={styles.divider} />
            <SkeletonSettingItem />
          </View>
        </View>

        {/* App Section Skeleton */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplicativo</Text>
          <View style={styles.card}>
            <SkeletonSettingItem />
            <View style={styles.divider} />
            <SkeletonSettingItem hasSwitch />
          </View>
        </View>

        {/* About Section Skeleton */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <View style={styles.card}>
            <SkeletonSettingItem />
            <View style={styles.divider} />
            <SkeletonSettingItem />
            <View style={styles.divider} />
            <SkeletonSettingItem />
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Security Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Segurança</Text>
        <View style={styles.card}>
          {biometricAvailable && (
            <>
              <SettingItem
                icon="finger-print"
                title={biometricType}
                subtitle={
                  biometricEnabled
                    ? `${biometricType} está habilitada`
                    : `Habilite ${biometricType} para login rápido`
                }
                rightElement={
                  <Switch
                    value={biometricEnabled}
                    onValueChange={handleToggleBiometric}
                    disabled={isLoading}
                    trackColor={{
                      false: lightTheme.colors.gray[300],
                      true: lightTheme.colors.primary,
                    }}
                    thumbColor={lightTheme.colors.white}
                    ios_backgroundColor={lightTheme.colors.gray[300]}
                  />
                }
              />
              <View style={styles.divider} />
            </>
          )}
          <SettingItem
            icon="key-outline"
            title="Limpar Credenciais"
            subtitle="Remover credenciais salvas localmente"
            onPress={handleClearCredentials}
            showChevron
          />
          <View style={styles.divider} />
          <SettingItem
            icon="shield-checkmark-outline"
            title="Alterar Senha"
            subtitle="Atualizar senha da conta"
            onPress={() => navigation.navigate("ChangePassword" as never)}
            showChevron
          />
        </View>
      </View>

      {/* Appearance Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aparência</Text>
        <View style={styles.card}>
          <SettingItem
            icon="color-palette-outline"
            title="Tema"
            subtitle={
              settings.theme === "auto"
                ? "Automático (sistema)"
                : settings.theme === "dark"
                ? "Escuro"
                : "Claro"
            }
            onPress={() => setShowThemeModal(true)}
            showChevron
          />
          <View style={styles.divider} />
          <SettingItem
            icon="language-outline"
            title="Idioma"
            subtitle={
              settings.language === "pt-BR" ? "Português (Brasil)" : "English"
            }
            onPress={() => setShowLanguageModal(true)}
            showChevron
          />
          <View style={styles.divider} />
          <SettingItem
            icon="speedometer-outline"
            title="Unidades de Medida"
            subtitle={
              settings.units === "metric"
                ? "Métrico (kg, cm)"
                : "Imperial (lb, in)"
            }
            onPress={() => setShowUnitsModal(true)}
            showChevron
          />
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificações</Text>
        <View style={styles.card}>
          <SettingItem
            icon="notifications-outline"
            title="Notificações"
            subtitle={
              settings.notifications.enabled ? "Ativadas" : "Desativadas"
            }
            rightElement={
              <Switch
                value={settings.notifications.enabled}
                onValueChange={(value) => {
                  updateNotifications({ enabled: value });
                  Toast.show({
                    type: "success",
                    text1: value
                      ? "Notificações ativadas"
                      : "Notificações desativadas",
                    position: "top",
                    visibilityTime: 2000,
                  });
                }}
                trackColor={{
                  false: lightTheme.colors.gray[300],
                  true: lightTheme.colors.primary,
                }}
                thumbColor={lightTheme.colors.white}
                ios_backgroundColor={lightTheme.colors.gray[300]}
              />
            }
          />
          <View style={styles.divider} />
          <SettingItem
            icon="alarm-outline"
            title="Lembretes"
            subtitle="Lembretes de medições e metas"
            rightElement={
              <Switch
                value={settings.notifications.reminders}
                onValueChange={(value) =>
                  updateNotifications({ reminders: value })
                }
                disabled={!settings.notifications.enabled}
                trackColor={{
                  false: lightTheme.colors.gray[300],
                  true: lightTheme.colors.primary,
                }}
                thumbColor={lightTheme.colors.white}
                ios_backgroundColor={lightTheme.colors.gray[300]}
              />
            }
          />
          <View style={styles.divider} />
          <SettingItem
            icon="chatbubble-outline"
            title="Mensagens"
            subtitle="Mensagens do nutricionista"
            rightElement={
              <Switch
                value={settings.notifications.messages}
                onValueChange={(value) =>
                  updateNotifications({ messages: value })
                }
                disabled={!settings.notifications.enabled}
                trackColor={{
                  false: lightTheme.colors.gray[300],
                  true: lightTheme.colors.primary,
                }}
                thumbColor={lightTheme.colors.white}
                ios_backgroundColor={lightTheme.colors.gray[300]}
              />
            }
          />
          <View style={styles.divider} />
          <SettingItem
            icon="volume-high-outline"
            title="Som"
            subtitle="Som das notificações"
            rightElement={
              <Switch
                value={settings.notifications.sound}
                onValueChange={(value) => updateNotifications({ sound: value })}
                disabled={!settings.notifications.enabled}
                trackColor={{
                  false: lightTheme.colors.gray[300],
                  true: lightTheme.colors.primary,
                }}
                thumbColor={lightTheme.colors.white}
                ios_backgroundColor={lightTheme.colors.gray[300]}
              />
            }
          />
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre</Text>
        <View style={styles.card}>
          <SettingItem
            icon="information-circle-outline"
            title="Sobre o App"
            subtitle="Versão 1.0.0"
            onPress={() => navigation.navigate("About" as never)}
            showChevron
          />
          <View style={styles.divider} />
          <SettingItem
            icon="document-text-outline"
            title="Termos de Uso"
            onPress={() => navigation.navigate("Terms" as never)}
            showChevron
          />
          <View style={styles.divider} />
          <SettingItem
            icon="shield-outline"
            title="Política de Privacidade"
            onPress={() => navigation.navigate("Privacy" as never)}
            showChevron
          />
        </View>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color={lightTheme.colors.error}
          />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Spacer */}
      <View style={styles.bottomSpacer} />

      {/* Theme Modal */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowThemeModal(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tema</Text>
              <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={lightTheme.colors.gray[600]}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  settings.theme === "light" && styles.optionItemActive,
                ]}
                onPress={() => {
                  setTheme("light");
                  setShowThemeModal(false);
                  Toast.show({
                    type: "success",
                    text1: "Tema claro ativado",
                    position: "top",
                    visibilityTime: 2000,
                  });
                }}
              >
                <Ionicons
                  name="sunny"
                  size={24}
                  color={
                    settings.theme === "light"
                      ? lightTheme.colors.primary
                      : lightTheme.colors.gray[600]
                  }
                />
                <Text
                  style={[
                    styles.optionText,
                    settings.theme === "light" && styles.optionTextActive,
                  ]}
                >
                  Claro
                </Text>
                {settings.theme === "light" && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={lightTheme.colors.primary}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionItem,
                  settings.theme === "dark" && styles.optionItemActive,
                ]}
                onPress={() => {
                  setTheme("dark");
                  setShowThemeModal(false);
                  Toast.show({
                    type: "success",
                    text1: "Tema escuro ativado",
                    position: "top",
                    visibilityTime: 2000,
                  });
                }}
              >
                <Ionicons
                  name="moon"
                  size={24}
                  color={
                    settings.theme === "dark"
                      ? lightTheme.colors.primary
                      : lightTheme.colors.gray[600]
                  }
                />
                <Text
                  style={[
                    styles.optionText,
                    settings.theme === "dark" && styles.optionTextActive,
                  ]}
                >
                  Escuro
                </Text>
                {settings.theme === "dark" && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={lightTheme.colors.primary}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionItem,
                  settings.theme === "auto" && styles.optionItemActive,
                ]}
                onPress={() => {
                  setTheme("auto");
                  setShowThemeModal(false);
                  Toast.show({
                    type: "success",
                    text1: "Tema automático ativado",
                    text2: "Segue o tema do sistema",
                    position: "top",
                    visibilityTime: 2000,
                  });
                }}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={24}
                  color={
                    settings.theme === "auto"
                      ? lightTheme.colors.primary
                      : lightTheme.colors.gray[600]
                  }
                />
                <Text
                  style={[
                    styles.optionText,
                    settings.theme === "auto" && styles.optionTextActive,
                  ]}
                >
                  Automático
                </Text>
                {settings.theme === "auto" && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={lightTheme.colors.primary}
                  />
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowLanguageModal(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Idioma</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={lightTheme.colors.gray[600]}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  settings.language === "pt-BR" && styles.optionItemActive,
                ]}
                onPress={() => {
                  setLanguage("pt-BR");
                  setShowLanguageModal(false);
                  Toast.show({
                    type: "success",
                    text1: "Idioma alterado",
                    text2: "Português (Brasil)",
                    position: "top",
                    visibilityTime: 2000,
                  });
                }}
              >
                <Text style={styles.optionEmoji}>🇧🇷</Text>
                <Text
                  style={[
                    styles.optionText,
                    settings.language === "pt-BR" && styles.optionTextActive,
                  ]}
                >
                  Português (Brasil)
                </Text>
                {settings.language === "pt-BR" && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={lightTheme.colors.primary}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionItem,
                  settings.language === "en" && styles.optionItemActive,
                ]}
                onPress={() => {
                  setLanguage("en");
                  setShowLanguageModal(false);
                  Toast.show({
                    type: "success",
                    text1: "Language changed",
                    text2: "English",
                    position: "top",
                    visibilityTime: 2000,
                  });
                }}
              >
                <Text style={styles.optionEmoji}>🇺🇸</Text>
                <Text
                  style={[
                    styles.optionText,
                    settings.language === "en" && styles.optionTextActive,
                  ]}
                >
                  English
                </Text>
                {settings.language === "en" && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={lightTheme.colors.primary}
                  />
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Units Modal */}
      <Modal
        visible={showUnitsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUnitsModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowUnitsModal(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Unidades de Medida</Text>
              <TouchableOpacity onPress={() => setShowUnitsModal(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={lightTheme.colors.gray[600]}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  settings.units === "metric" && styles.optionItemActive,
                ]}
                onPress={() => {
                  setUnits("metric");
                  setShowUnitsModal(false);
                  Toast.show({
                    type: "success",
                    text1: "Unidades alteradas",
                    text2: "Sistema Métrico (kg, cm)",
                    position: "top",
                    visibilityTime: 2000,
                  });
                }}
              >
                <Ionicons
                  name="speedometer-outline"
                  size={24}
                  color={
                    settings.units === "metric"
                      ? lightTheme.colors.primary
                      : lightTheme.colors.gray[600]
                  }
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.optionText,
                      settings.units === "metric" && styles.optionTextActive,
                    ]}
                  >
                    Métrico
                  </Text>
                  <Text style={styles.optionSubtext}>kg, cm, m</Text>
                </View>
                {settings.units === "metric" && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={lightTheme.colors.primary}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionItem,
                  settings.units === "imperial" && styles.optionItemActive,
                ]}
                onPress={() => {
                  setUnits("imperial");
                  setShowUnitsModal(false);
                  Toast.show({
                    type: "success",
                    text1: "Units changed",
                    text2: "Imperial System (lb, in)",
                    position: "top",
                    visibilityTime: 2000,
                  });
                }}
              >
                <Ionicons
                  name="speedometer-outline"
                  size={24}
                  color={
                    settings.units === "imperial"
                      ? lightTheme.colors.primary
                      : lightTheme.colors.gray[600]
                  }
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.optionText,
                      settings.units === "imperial" && styles.optionTextActive,
                    ]}
                  >
                    Imperial
                  </Text>
                  <Text style={styles.optionSubtext}>lb, in, ft</Text>
                </View>
                {settings.units === "imperial" && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={lightTheme.colors.primary}
                  />
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modals */}
      <ConfirmModal
        visible={showDisableBiometricModal}
        title="Desabilitar Biometria?"
        message={`Deseja realmente desabilitar ${biometricType}? Você precisará fazer login com email e senha novamente.`}
        confirmText="Desabilitar"
        cancelText="Cancelar"
        confirmColor={lightTheme.colors.error}
        icon="finger-print"
        iconColor={lightTheme.colors.error}
        onConfirm={confirmDisableBiometric}
        onCancel={() => setShowDisableBiometricModal(false)}
      />

      <ConfirmModal
        visible={showClearCredentialsModal}
        title="Limpar Credenciais?"
        message="Isso irá remover suas credenciais salvas e você precisará fazer login novamente."
        confirmText="Limpar"
        cancelText="Cancelar"
        confirmColor={lightTheme.colors.error}
        icon="key-outline"
        iconColor={lightTheme.colors.warning}
        onConfirm={confirmClearCredentials}
        onCancel={() => setShowClearCredentialsModal(false)}
      />

      <ConfirmModal
        visible={showLogoutModal}
        title="Sair da Conta?"
        message="Você precisará fazer login novamente para acessar o aplicativo."
        confirmText="Sair"
        cancelText="Cancelar"
        confirmColor={lightTheme.colors.error}
        icon="log-out-outline"
        iconColor={lightTheme.colors.error}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[50],
  },
  section: {
    paddingHorizontal: lightTheme.spacing.xl,
    marginTop: lightTheme.spacing.md,
  },
  sectionTitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    ...lightTheme.shadows.sm,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: lightTheme.spacing.lg,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: lightTheme.borderRadius.md,
    backgroundColor: lightTheme.colors.primaryBackground,
    alignItems: "center",
    justifyContent: "center",
    marginRight: lightTheme.spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[800],
    marginBottom: lightTheme.spacing.xs - 2,
  },
  settingSubtitle: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
  },
  divider: {
    height: 1,
    backgroundColor: lightTheme.colors.gray[100],
    marginLeft: lightTheme.spacing.lg + 36 + lightTheme.spacing.md,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: lightTheme.colors.white,
    paddingVertical: lightTheme.spacing.lg,
    borderRadius: lightTheme.borderRadius.lg,
    gap: lightTheme.spacing.sm,
    ...lightTheme.shadows.sm,
    borderWidth: 1,
    borderColor: lightTheme.colors.error,
  },
  logoutText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.error,
  },
  bottomSpacer: {
    height: lightTheme.spacing["2xl"],
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: lightTheme.colors.white,
    borderTopLeftRadius: lightTheme.borderRadius.xl,
    borderTopRightRadius: lightTheme.borderRadius.xl,
    paddingBottom: lightTheme.spacing.xl,
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: lightTheme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  modalTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[900],
  },
  modalBody: {
    padding: lightTheme.spacing.lg,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: lightTheme.spacing.lg,
    borderRadius: lightTheme.borderRadius.md,
    marginBottom: lightTheme.spacing.sm,
    gap: lightTheme.spacing.md,
    backgroundColor: lightTheme.colors.gray[50],
  },
  optionItemActive: {
    backgroundColor: lightTheme.colors.primaryBackground,
    borderWidth: 2,
    borderColor: lightTheme.colors.primary,
  },
  optionText: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[700],
  },
  optionTextActive: {
    color: lightTheme.colors.primary,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionSubtext: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginTop: 2,
  },
});
