import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { LinearGradient } from "expo-linear-gradient";
import { lightTheme } from "../theme";

interface CustomHeaderProps {
  title: string;
  navigation: DrawerNavigationProp<any>;
  isDrawerOpen?: boolean;
}

export function CustomHeader({
  title,
  navigation,
  isDrawerOpen,
}: CustomHeaderProps) {
  const toggleDrawer = () => {
    if (isDrawerOpen) {
      navigation.closeDrawer();
    } else {
      navigation.openDrawer();
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
          {/* Botão Hamburguer / Close */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={toggleDrawer}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isDrawerOpen ? "close" : "menu"}
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
