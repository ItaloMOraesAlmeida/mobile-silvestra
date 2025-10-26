import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../stores/auth.store";
import { LinearGradient } from "expo-linear-gradient";
import { lightTheme } from "../theme";

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const user = useAuthStore((state) => state.user);

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
        {/* Avatar com iniciais */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
        </View>

        {/* Nome e Email */}
        <Text style={styles.userName}>{getUserName()}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
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
    paddingTop: lightTheme.spacing["2xl"] + lightTheme.spacing.md,
    paddingBottom: lightTheme.spacing.lg + lightTheme.spacing.sm,
    paddingHorizontal: lightTheme.spacing.screenPaddingLarge,
    alignItems: "center",
  },
  avatarContainer: {
    marginBottom: lightTheme.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 3,
    borderColor: lightTheme.colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: lightTheme.typography.fontSize["4xl"],
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.white,
  },
  userName: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.white,
    marginBottom: lightTheme.spacing.xs,
    textAlign: "center",
  },
  userEmail: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
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
