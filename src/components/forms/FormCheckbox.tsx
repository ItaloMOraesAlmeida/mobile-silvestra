import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { useTheme } from "../../hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";

interface FormCheckboxProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  disabled?: boolean;
}

export function FormCheckbox<T extends FieldValues>({
  name,
  control,
  label,
  disabled = false,
}: FormCheckboxProps<T>) {
  const theme = useTheme();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={styles.container}>
          <Pressable
            style={[styles.checkboxContainer, { opacity: disabled ? 0.5 : 1 }]}
            onPress={() => !disabled && onChange(!value)}
            disabled={disabled}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: error ? theme.colors.error : theme.colors.border,
                  backgroundColor: value ? theme.colors.primary : "transparent",
                },
              ]}
            >
              {value && (
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={theme.colors.surface}
                />
              )}
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: theme.colors.text,
                  fontFamily: theme.typography.regular,
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
          {error && (
            <Text
              style={[
                styles.error,
                {
                  color: theme.colors.error,
                  fontFamily: theme.typography.regular,
                },
              ]}
            >
              {error.message}
            </Text>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  label: {
    fontSize: 14,
    flex: 1,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 36,
  },
});
