import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../theme";

interface BottomSheetPickerProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: { label: string; value: string }[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  multiSelect?: boolean;
  selectedValues?: string[];
}

export default function BottomSheetPicker({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
  multiSelect = false,
  selectedValues = [],
}: BottomSheetPickerProps) {
  const handleSelect = (value: string) => {
    onSelect(value);
    if (!multiSelect) {
      onClose();
    }
  };

  const isSelected = (value: string) => {
    if (multiSelect) {
      return selectedValues.includes(value);
    }
    return selectedValue === value;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.container}>
          <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons
                  name="close"
                  size={24}
                  color={lightTheme.colors.gray[600]}
                />
              </TouchableOpacity>
            </View>

            {/* Options List */}
            <ScrollView
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            >
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    isSelected(option.value) && styles.optionSelected,
                  ]}
                  onPress={() => handleSelect(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected(option.value) && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected(option.value) && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={lightTheme.colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {multiSelect && (
              <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            )}
          </SafeAreaView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: lightTheme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  safeArea: {
    backgroundColor: lightTheme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: lightTheme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    maxHeight: 400,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  optionSelected: {
    backgroundColor: `${lightTheme.colors.primary}10`,
  },
  optionText: {
    fontSize: 16,
    color: lightTheme.colors.text,
    flex: 1,
  },
  optionTextSelected: {
    color: lightTheme.colors.primary,
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: lightTheme.colors.primary,
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.white,
  },
});
