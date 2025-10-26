import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { lightTheme } from "../../theme";

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏠 Início</Text>
      <Text style={styles.subtitle}>Bem-vindo ao Silvestra!</Text>
      <Text style={styles.description}>
        Esta é a tela inicial do app. Aqui você verá o resumo do seu dia,
        próximas refeições e progresso de metas.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: lightTheme.colors.white,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: lightTheme.colors.primaryDark,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
    lineHeight: 24,
  },
});
