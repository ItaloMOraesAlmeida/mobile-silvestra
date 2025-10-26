import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../stores/auth.store";
import { LinearGradient } from "expo-linear-gradient";

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const user = useAuthStore((state) => state.user);

  // Extrai iniciais do nome do usuário
  const getInitials = () => {
    if (user?.patientProfile?.name) {
      const names = user.patientProfile.name.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    // Fallback para email
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const getUserName = () => {
    return (
      user?.patientProfile?.name || user?.email?.split("@")[0] || "Usuário"
    );
  };

  return (
    <View style={styles.container}>
      {/* Header do Drawer com Gradiente */}
      <LinearGradient
        colors={["#8b5a9f", "#572363", "#3d1a4a"]}
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
            color={props.state.index === 0 ? "#8b5a9f" : "#6b7280"}
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
    backgroundColor: "#ffffff",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 3,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
    textAlign: "center",
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 8,
  },
  drawerContent: {
    paddingTop: 8,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  drawerItemActive: {
    backgroundColor: "#f3e8f7",
  },
  drawerIcon: {
    marginRight: 16,
  },
  drawerLabel: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
  drawerLabelActive: {
    color: "#8b5a9f",
    fontWeight: "600",
  },
});
