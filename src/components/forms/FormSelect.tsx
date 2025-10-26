import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { useTheme } from "../../hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";

export interface SelectOption {
  label: string;
  value: string | number;
}

interface FormSelectProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
}

export function FormSelect<T extends FieldValues>({
  name,
  control,
  label,
  placeholder = "Selecione uma opção",
  options,
  disabled = false,
}: FormSelectProps<T>) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const selectedOption = options.find((option) => option.value === value);

        return (
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

            <Pressable
              style={[
                styles.selectButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: error ? theme.colors.error : theme.colors.border,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
              onPress={() => !disabled && setIsOpen(true)}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.selectText,
                  {
                    color: selectedOption
                      ? theme.colors.text
                      : theme.colors.textSecondary,
                    fontFamily: theme.typography.regular,
                  },
                ]}
              >
                {selectedOption ? selectedOption.label : placeholder}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={theme.colors.textSecondary}
              />
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

            <Modal
              visible={isOpen}
              transparent
              animationType="fade"
              onRequestClose={() => setIsOpen(false)}
            >
              <Pressable
                style={styles.modalOverlay}
                onPress={() => setIsOpen(false)}
              >
                <View
                  style={[
                    styles.modalContent,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <View style={styles.modalHeader}>
                    <Text
                      style={[
                        styles.modalTitle,
                        {
                          color: theme.colors.text,
                          fontFamily: theme.typography.semibold,
                        },
                      ]}
                    >
                      {label || "Selecione"}
                    </Text>
                    <TouchableOpacity onPress={() => setIsOpen(false)}>
                      <Ionicons
                        name="close"
                        size={24}
                        color={theme.colors.text}
                      />
                    </TouchableOpacity>
                  </View>

                  <FlatList
                    data={options}
                    keyExtractor={(item) => String(item.value)}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.option,
                          {
                            backgroundColor:
                              item.value === value
                                ? theme.colors.primaryLight
                                : "transparent",
                          },
                        ]}
                        onPress={() => {
                          onChange(item.value);
                          setIsOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            {
                              color:
                                item.value === value
                                  ? theme.colors.primary
                                  : theme.colors.text,
                              fontFamily:
                                item.value === value
                                  ? theme.typography.semibold
                                  : theme.typography.regular,
                            },
                          ]}
                        >
                          {item.label}
                        </Text>
                        {item.value === value && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color={theme.colors.primary}
                          />
                        )}
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </Pressable>
            </Modal>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectText: {
    fontSize: 14,
    flex: 1,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    maxHeight: "60%",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  modalTitle: {
    fontSize: 18,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  optionText: {
    fontSize: 14,
    flex: 1,
  },
});
