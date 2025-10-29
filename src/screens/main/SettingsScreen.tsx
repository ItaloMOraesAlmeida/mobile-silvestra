import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { lightTheme } from "../../theme";
import { useAuthStore } from "../../stores/auth.store";
import { BiometricService } from "../../services/biometric";
import { BiometricAuthService } from "../../services/biometric-auth";

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
  const { logout, user } = useAuthStore();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
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
    }
  };

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
            Alert.alert("Sucesso!", `${biometricType} habilitada com sucesso.`);
          }
        }
      } else {
        // Desabilitar biometria
        Alert.alert(
          "Desabilitar Biometria?",
          `Deseja realmente desabilitar ${biometricType}? Você precisará fazer login com email e senha novamente.`,
          [
            {
              text: "Cancelar",
              style: "cancel",
            },
            {
              text: "Desabilitar",
              style: "destructive",
              onPress: async () => {
                await BiometricAuthService.removeBiometricCredentials();
                setBiometricEnabled(false);
                Alert.alert(
                  "Desabilitada",
                  `${biometricType} foi desabilitada.`
                );
              },
            },
          ]
        );
      }
    } catch {
      Alert.alert("Erro", "Não foi possível alterar as configurações.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCredentials = () => {
    Alert.alert(
      "Limpar Credenciais?",
      "Isso irá remover suas credenciais salvas e você precisará fazer login novamente.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Limpar",
          style: "destructive",
          onPress: async () => {
            await BiometricAuthService.removeBiometricCredentials();
            setBiometricEnabled(false);
            Alert.alert("Sucesso", "Credenciais removidas com sucesso.");
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Sair da Conta?",
      "Você precisará fazer login novamente para acessar o aplicativo.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              // Limpar biometria se estiver habilitada
              if (biometricEnabled) {
                await BiometricAuthService.removeBiometricCredentials();
              }

              // Fazer logout
              await logout();

              // Navegar para tela de autenticação
              navigation.reset({
                index: 0,
                routes: [{ name: "Auth" as never }],
              });
            } catch {
              Alert.alert("Erro", "Não foi possível fazer logout.");
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* User Info Card */}
      <View style={styles.userCard}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name || "Usuário"}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </View>

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
            onPress={() => {
              Alert.alert(
                "Em Desenvolvimento",
                "Esta função será implementada em breve!"
              );
            }}
            showChevron
          />
        </View>
      </View>

      {/* App Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aplicativo</Text>
        <View style={styles.card}>
          <SettingItem
            icon="notifications-outline"
            title="Notificações"
            subtitle="Gerenciar preferências de notificação"
            onPress={() => {
              Alert.alert(
                "Em Desenvolvimento",
                "Esta função será implementada em breve!"
              );
            }}
            showChevron
          />
          <View style={styles.divider} />
          <SettingItem
            icon="moon-outline"
            title="Tema Escuro"
            subtitle="Ativar modo escuro (em breve)"
            rightElement={
              <Switch
                value={false}
                disabled
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
            showChevron
          />
          <View style={styles.divider} />
          <SettingItem
            icon="document-text-outline"
            title="Termos de Uso"
            onPress={() => {
              Alert.alert(
                "Em Desenvolvimento",
                "Esta função será implementada em breve!"
              );
            }}
            showChevron
          />
          <View style={styles.divider} />
          <SettingItem
            icon="shield-outline"
            title="Política de Privacidade"
            onPress={() => {
              Alert.alert(
                "Em Desenvolvimento",
                "Esta função será implementada em breve!"
              );
            }}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[50],
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.white,
    marginHorizontal: lightTheme.spacing.xl,
    marginTop: lightTheme.spacing.xl,
    marginBottom: lightTheme.spacing.lg,
    padding: lightTheme.spacing.lg,
    borderRadius: lightTheme.borderRadius.lg,
    ...lightTheme.shadows.sm,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: lightTheme.colors.primaryBackground,
    alignItems: "center",
    justifyContent: "center",
    marginRight: lightTheme.spacing.md,
  },
  userAvatarText: {
    fontSize: lightTheme.typography.fontSize["2xl"],
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[800],
    marginBottom: lightTheme.spacing.xs - 2,
  },
  userEmail: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
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
});
