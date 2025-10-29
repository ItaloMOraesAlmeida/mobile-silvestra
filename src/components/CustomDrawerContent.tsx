import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../stores/auth.store";
import { useAvatar } from "../hooks/use-avatar";
import { LinearGradient } from "expo-linear-gradient";
import { lightTheme } from "../theme";

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const user = useAuthStore((state) => state.user);

  // Extrair a KEY do avatar (agora sempre está em user.avatarUrl)
  const getAvatarKey = (): string | null => {
    return user?.avatarUrl || null;
  };

  // Hook que gerencia cache e busca da URL assinada
  const { avatarUrl } = useAvatar(getAvatarKey());

  // Extrai iniciais do nome do usuário
  const getInitials = () => {
    if (user?.name) {
      const names = user.name.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    // Fallback para email
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const getUserName = () => {
    return user?.name || "Usuário";
  };

  const getRoleName = () => {
    switch (user?.role) {
      case "PATIENT":
        return "Paciente";
      case "NUTRITIONIST":
        return "Nutricionista";
      case "NORMAL":
        return "Usuário";
      default:
        return "Usuário";
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case "PATIENT":
        return "person";
      case "NUTRITIONIST":
        return "medical";
      case "NORMAL":
        return "person-circle";
      default:
        return "person-circle";
    }
  };

  const formatMemberSince = () => {
    if (!user?.createdAt) return "";
    const date = new Date(user.createdAt);
    return `Membro desde ${date.toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
    })}`;
  };

  return (
    <View style={styles.container}>
      {/* Header do Drawer com Gradiente */}
      <LinearGradient
        colors={[
          lightTheme.colors.primary,
          lightTheme.colors.primaryDark,
          lightTheme.colors.primaryDarker,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Avatar com iniciais e badge de status */}
        <View style={styles.avatarWrapper}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <LinearGradient
              colors={[lightTheme.colors.white, lightTheme.colors.white]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </LinearGradient>
          )}
          {/* Badge de status online */}
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
          </View>
        </View>

        {/* Informações do Usuário */}
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {getUserName()}
          </Text>

          {/* Badge de Role - Só aparece para PATIENT e NUTRITIONIST */}
          {(user?.role === "PATIENT" || user?.role === "NUTRITIONIST") && (
            <View style={styles.roleBadge}>
              <Ionicons
                name={getRoleIcon()}
                size={10}
                color={lightTheme.colors.white}
                style={styles.roleBadgeIcon}
              />
              <Text style={styles.roleBadgeText}>{getRoleName()}</Text>
            </View>
          )}

          {/* Email */}
          <Text style={styles.userEmail} numberOfLines={1}>
            {user?.email}
          </Text>

          {/* Membro desde */}
          <Text style={styles.memberSince}>{formatMemberSince()}</Text>
        </View>

        {/* Estatísticas rápidas (opcional) */}
        {user?.role === "PATIENT" && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={lightTheme.colors.white}
              />
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Consultas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons
                name="nutrition-outline"
                size={16}
                color={lightTheme.colors.white}
              />
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>Planos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons
                name="trophy-outline"
                size={16}
                color={lightTheme.colors.white}
              />
              <Text style={styles.statValue}>95%</Text>
              <Text style={styles.statLabel}>Meta</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Menu Items */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.drawerContent}
      >
        <TouchableOpacity
          style={[
            styles.drawerItem,
            props.state.index === 0 && styles.drawerItemActive,
          ]}
          onPress={() => props.navigation.navigate("Home")}
        >
          <Ionicons
            name="home"
            size={24}
            color={
              props.state.index === 0
                ? lightTheme.colors.primary
                : lightTheme.colors.gray[500]
            }
            style={styles.drawerIcon}
          />
          <Text
            style={[
              styles.drawerLabel,
              props.state.index === 0 && styles.drawerLabelActive,
            ]}
          >
            Início
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.drawerItem,
            props.state.index === 1 && styles.drawerItemActive,
          ]}
          onPress={() => props.navigation.navigate("Profile")}
        >
          <Ionicons
            name="person-outline"
            size={24}
            color={
              props.state.index === 1
                ? lightTheme.colors.primary
                : lightTheme.colors.gray[500]
            }
            style={styles.drawerIcon}
          />
          <Text
            style={[
              styles.drawerLabel,
              props.state.index === 1 && styles.drawerLabelActive,
            ]}
          >
            Perfil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.drawerItem,
            props.state.index === 2 && styles.drawerItemActive,
          ]}
          onPress={() => props.navigation.navigate("Settings")}
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color={
              props.state.index === 2
                ? lightTheme.colors.primary
                : lightTheme.colors.gray[500]
            }
            style={styles.drawerIcon}
          />
          <Text
            style={[
              styles.drawerLabel,
              props.state.index === 2 && styles.drawerLabelActive,
            ]}
          >
            Configurações
          </Text>
        </TouchableOpacity>
      </DrawerContentScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.white,
  },
  header: {
    paddingTop: lightTheme.spacing.xl,
    paddingBottom: lightTheme.spacing.lg,
    paddingHorizontal: lightTheme.spacing.lg,
    alignItems: "flex-start",
  },
  // Avatar e Wrapper
  avatarWrapper: {
    alignSelf: "flex-start",
    marginBottom: lightTheme.spacing.sm,
    position: "relative",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: lightTheme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    ...lightTheme.shadows.sm,
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: lightTheme.borderRadius.full,
    ...lightTheme.shadows.sm,
  },
  avatarText: {
    fontSize: lightTheme.typography.fontSize["3xl"],
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.primary,
  },
  // Status Badge Online
  statusBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.full,
    padding: 2,
    ...lightTheme.shadows.sm,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: lightTheme.colors.success,
  },
  // Informações do Usuário
  userInfo: {
    alignItems: "flex-start",
    width: "100%",
    paddingHorizontal: 0,
  },
  userName: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.white,
    marginBottom: lightTheme.spacing.xs,
    textAlign: "left",
    maxWidth: "90%",
  },
  // Badge de Role
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.primaryLight,
    paddingHorizontal: lightTheme.spacing.sm,
    paddingVertical: 3,
    borderRadius: lightTheme.borderRadius.full,
    marginBottom: lightTheme.spacing.xs,
    alignSelf: "flex-start",
    opacity: 0.8,
  },
  roleBadgeIcon: {
    marginRight: 3,
  },
  roleBadgeText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  userEmail: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.white,
    textAlign: "left",
    maxWidth: "90%",
    opacity: 0.85,
  },
  memberSince: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.white,
    textAlign: "left",
    marginTop: lightTheme.spacing.xs,
    opacity: 0.75,
  },
  // Estatísticas
  statsContainer: {
    flexDirection: "row",
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    paddingVertical: lightTheme.spacing.sm,
    paddingHorizontal: lightTheme.spacing.xs,
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: lightTheme.spacing.md,
    opacity: 0.15,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.white,
    marginTop: 2,
  },
  statLabel: {
    fontSize: 10,
    color: lightTheme.colors.white,
    marginTop: 1,
    opacity: 0.9,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: lightTheme.colors.white,
    marginHorizontal: lightTheme.spacing.xs,
    opacity: 0.3,
  },
  // Divider e Conteúdo do Drawer
  divider: {
    height: 1,
    backgroundColor: lightTheme.colors.gray[200],
    marginVertical: lightTheme.spacing.sm,
  },
  drawerContent: {
    paddingTop: lightTheme.spacing.sm,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: lightTheme.spacing.md,
    paddingHorizontal: lightTheme.spacing.lg - 4,
    marginHorizontal: lightTheme.spacing.md - 4,
    borderRadius: lightTheme.borderRadius.md,
    backgroundColor: lightTheme.colors.transparent,
  },
  drawerItemActive: {
    backgroundColor: lightTheme.colors.primaryBackground,
  },
  drawerIcon: {
    marginRight: lightTheme.spacing.md,
  },
  drawerLabel: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[500],
    fontWeight: lightTheme.typography.fontWeight.medium,
  },
  drawerLabelActive: {
    color: lightTheme.colors.primary,
    fontWeight: lightTheme.typography.fontWeight.semibold,
  },
});
