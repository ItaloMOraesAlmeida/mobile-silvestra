import React from "react";
import { View, Text, StyleSheet } from "react-native";

export function ResetPasswordScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password Screen</Text>
      <Text style={styles.subtitle}>Em desenvolvimento</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#572363",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
  },
});
