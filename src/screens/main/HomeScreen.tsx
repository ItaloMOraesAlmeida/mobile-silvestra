import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { lightTheme } from "../../theme";

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Ícone */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[lightTheme.colors.primary, lightTheme.colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Ionicons
              name="construct-outline"
              size={64}
              color={lightTheme.colors.white}
            />
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
          <Ionicons
            name="information-circle"
            size={20}
            color={lightTheme.colors.primary}
          />
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
    backgroundColor: lightTheme.colors.gray[50],
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: lightTheme.spacing["2xl"] - lightTheme.spacing.md,
  },
  iconContainer: {
    marginBottom: lightTheme.spacing["2xl"] - lightTheme.spacing.md,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: lightTheme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    ...lightTheme.shadows.primary,
  },
  title: {
    fontSize: lightTheme.typography.fontSize["3xl"],
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.gray[800],
    marginBottom: lightTheme.spacing.md,
    textAlign: "center",
  },
  description: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[500],
    textAlign: "center",
    lineHeight:
      lightTheme.typography.lineHeight.relaxed *
      lightTheme.typography.fontSize.base,
    marginBottom: lightTheme.spacing["2xl"] - lightTheme.spacing.md,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.primaryBackground,
    paddingHorizontal: lightTheme.spacing.lg - 4,
    paddingVertical: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: lightTheme.colors.primary,
    marginTop: lightTheme.spacing.md,
  },
  infoText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.primaryDark,
    marginLeft: lightTheme.spacing.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
  },
});
