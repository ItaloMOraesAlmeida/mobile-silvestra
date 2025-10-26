import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { lightTheme } from "../../theme";

export function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explore</Text>
      <Text style={styles.subtitle}>
        Aqui você verá conteúdos e exploração.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: lightTheme.colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: lightTheme.colors.primaryDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: lightTheme.colors.gray[600],
  },
});
