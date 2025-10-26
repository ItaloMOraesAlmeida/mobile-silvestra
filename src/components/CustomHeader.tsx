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
      <StatusBar barStyle="light-content" backgroundColor="#3d1a4a" />
      <LinearGradient
        colors={["#8b5a9f", "#572363"]}
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
              color="#ffffff"
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
    paddingBottom: 16,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
    textAlign: "center",
  },
});
