import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Ícone */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={["#8b5a9f", "#572363"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Ionicons name="construct-outline" size={64} color="#ffffff" />
          </LinearGradient>
        </View>

        {/* Título */}
        <Text style={styles.title}>Em Desenvolvimento</Text>

        {/* Descrição */}
        <Text style={styles.description}>
          Esta funcionalidade está sendo desenvolvida.{"\n"}
          Em breve estará disponível!
        </Text>

        {/* Informação adicional */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#8b5a9f" />
          <Text style={styles.infoText}>
            Acompanhe as atualizações do aplicativo
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#8b5a9f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3e8f7",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8b5a9f",
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: "#572363",
    marginLeft: 8,
    fontWeight: "500",
  },
});
