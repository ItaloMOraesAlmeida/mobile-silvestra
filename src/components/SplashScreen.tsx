import React from "react";
import { View, StyleSheet, Image, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { lightTheme } from "../theme";

export function SplashScreen() {
  return (
    <LinearGradient
      colors={[
        lightTheme.colors.primaryDark,
        lightTheme.colors.primary,
        lightTheme.colors.primaryDark,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator
          size="large"
          color={lightTheme.colors.white}
          style={styles.loader}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});
