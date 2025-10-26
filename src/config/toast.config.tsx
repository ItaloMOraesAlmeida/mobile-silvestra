import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BaseToast, ErrorToast, InfoToast } from "react-native-toast-message";
import { lightTheme } from "../theme";

/**
 * Configuração customizada do Toast com design moderno e profissional
 * Tipos: success, error, info, warning
 */

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={styles.successToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      text1NumberOfLines={2}
      text2NumberOfLines={3}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Ionicons
            name="checkmark-circle"
            size={28}
            color={lightTheme.colors.white}
          />
        </View>
      )}
    />
  ),

  error: (props: any) => (
    <ErrorToast
      {...props}
      style={styles.errorToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      text1NumberOfLines={2}
      text2NumberOfLines={3}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Ionicons
            name="close-circle"
            size={28}
            color={lightTheme.colors.white}
          />
        </View>
      )}
    />
  ),

  info: (props: any) => (
    <InfoToast
      {...props}
      style={styles.infoToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      text1NumberOfLines={2}
      text2NumberOfLines={3}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Ionicons
            name="information-circle"
            size={28}
            color={lightTheme.colors.white}
          />
        </View>
      )}
    />
  ),

  warning: (props: any) => (
    <BaseToast
      {...props}
      style={styles.warningToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      text1NumberOfLines={2}
      text2NumberOfLines={3}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Ionicons name="warning" size={28} color={lightTheme.colors.white} />
        </View>
      )}
    />
  ),
};

const styles = StyleSheet.create({
  successToast: {
    height: "auto",
    minHeight: 70,
    borderLeftWidth: 6,
    borderLeftColor: lightTheme.colors.success,
    backgroundColor: lightTheme.colors.success,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: lightTheme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  errorToast: {
    height: "auto",
    minHeight: 70,
    borderLeftWidth: 6,
    borderLeftColor: lightTheme.colors.error,
    backgroundColor: lightTheme.colors.error,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: lightTheme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  infoToast: {
    height: "auto",
    minHeight: 70,
    borderLeftWidth: 6,
    borderLeftColor: lightTheme.colors.info,
    backgroundColor: lightTheme.colors.info,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: lightTheme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  warningToast: {
    height: "auto",
    minHeight: 70,
    borderLeftWidth: 6,
    borderLeftColor: lightTheme.colors.warning,
    backgroundColor: lightTheme.colors.warning,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: lightTheme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  contentContainer: {
    paddingHorizontal: 12,
    flex: 1,
  },

  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 40,
  },

  text1: {
    fontSize: 17,
    fontWeight: "700",
    color: lightTheme.colors.white,
    marginBottom: 4,
    fontFamily: "Poppins_700Bold",
  },

  text2: {
    fontSize: 15,
    fontWeight: "400",
    color: lightTheme.colors.white,
    opacity: 0.95,
    lineHeight: 20,
    fontFamily: "Poppins_400Regular",
  },
});
