import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NavigationProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { lightTheme } from "../theme";

interface CustomHeaderProps {
  title: string;
  // Pode receber navigation de diferentes navegators (drawer/stack/tab).
  // Usamos um tipo genérico para evitar acoplamento estrito ao DrawerNavigationProp
  navigation: NavigationProp<any> | any;
  isDrawerOpen?: boolean;
  showBackButton?: boolean;
  backTo?: string; // Nome da tela para onde voltar (opcional)
}

export function CustomHeader({
  title,
  navigation,
  isDrawerOpen,
  showBackButton = false,
  backTo,
}: CustomHeaderProps) {
  const toggleDrawer = () => {
    try {
      // Tenta abrir/fechar via parent (útil quando este header está em uma Stack/Tab
      // e o Drawer está em um ancestor)
      const parent = (navigation as any).getParent?.();

      if (parent && typeof parent.openDrawer === "function") {
        if (isDrawerOpen && typeof parent.closeDrawer === "function") {
          parent.closeDrawer();
        } else {
          parent.openDrawer();
        }
        return;
      }

      // Fallback: tenta diretamente no navigation recebido
      if (typeof (navigation as any).openDrawer === "function") {
        if (
          isDrawerOpen &&
          typeof (navigation as any).closeDrawer === "function"
        ) {
          (navigation as any).closeDrawer();
        } else {
          (navigation as any).openDrawer();
        }
        return;
      }

      console.warn(
        "Couldn't find a drawer to toggle (CustomHeader.toggleDrawer)"
      );
    } catch (err) {
      console.warn("Error toggling drawer:", err);
    }
  };

  const handleBackPress = () => {
    if (showBackButton) {
      // Se backTo foi especificado, navega para lá
      if (backTo) {
        navigation.navigate(backTo as never);
      } else {
        // Padrão: voltar para Settings
        navigation.navigate("Settings" as never);
      }
    } else {
      navigation.goBack();
    }
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={lightTheme.colors.primaryDarker}
      />
      <LinearGradient
        colors={[lightTheme.colors.primary, lightTheme.colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {/* Botão Voltar ou Hamburguer / Close */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={showBackButton ? handleBackPress : toggleDrawer}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                showBackButton ? "arrow-back" : isDrawerOpen ? "close" : "menu"
              }
              size={28}
              color={lightTheme.colors.white}
            />
          </TouchableOpacity>

          {/* Título */}
          <Text style={styles.headerTitle}>{title}</Text>

          {/* Espaço vazio para centralizar o título */}
          <View style={styles.menuButton} />
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 44,
    paddingBottom: lightTheme.spacing.md,
    paddingHorizontal: lightTheme.spacing.md,
    ...lightTheme.shadows.sm,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: lightTheme.borderRadius.sm,
  },
  headerTitle: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.white,
    flex: 1,
    textAlign: "center",
  },
});
