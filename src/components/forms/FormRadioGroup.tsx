import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { useTheme } from "../../hooks/useTheme";

export interface RadioOption {
  label: string;
  value: string | number;
}

interface FormRadioGroupProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  options: RadioOption[];
  disabled?: boolean;
  direction?: "row" | "column";
}

export function FormRadioGroup<T extends FieldValues>({
  name,
  control,
  label,
  options,
  disabled = false,
  direction = "column",
}: FormRadioGroupProps<T>) {
  const theme = useTheme();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={styles.container}>
          {label && (
            <Text
              style={[
                styles.label,
                {
                  color: theme.colors.text,
                  fontFamily: theme.typography.medium,
                },
              ]}
            >
              {label}
            </Text>
          )}

          <View
            style={[
              styles.optionsContainer,
              direction === "row" && styles.optionsRow,
            ]}
          >
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <Pressable
                  key={String(option.value)}
                  style={[
                    styles.option,
                    direction === "row" && styles.optionRow,
                    { opacity: disabled ? 0.5 : 1 },
                  ]}
                  onPress={() => !disabled && onChange(option.value)}
                  disabled={disabled}
                >
                  <View
                    style={[
                      styles.radio,
                      {
                        borderColor: error
                          ? theme.colors.error
                          : isSelected
                          ? theme.colors.primary
                          : theme.colors.border,
                      },
                    ]}
                  >
                    {isSelected && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.optionLabel,
                      {
                        color: theme.colors.text,
                        fontFamily: isSelected
                          ? theme.typography.medium
                          : theme.typography.regular,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

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
  label: {
    fontSize: 14,
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 12,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionRow: {
    marginRight: 24,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionLabel: {
    fontSize: 14,
  },
  error: {
    fontSize: 12,
    marginTop: 8,
  },
});
