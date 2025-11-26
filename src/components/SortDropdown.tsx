import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles, useTheme } from "../hooks/useTheme";
import type { Theme } from "../theme";

export enum SortField {
  NAME_ASC = "name_asc",
  NAME_DESC = "name_desc",
  CREATED_AT_ASC = "created_asc",
  CREATED_AT_DESC = "created_desc",
  UPDATED_AT_ASC = "updated_asc",
  UPDATED_AT_DESC = "updated_desc",
  LAST_CONTACT_ASC = "last_contact_asc",
  LAST_CONTACT_DESC = "last_contact_desc",
}

interface SortOption {
  value: SortField;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SORT_OPTIONS: SortOption[] = [
  {
    value: SortField.NAME_ASC,
    label: "Nome (A-Z)",
    icon: "arrow-up",
  },
  {
    value: SortField.NAME_DESC,
    label: "Nome (Z-A)",
    icon: "arrow-down",
  },
  {
    value: SortField.UPDATED_AT_DESC,
    label: "Mais recente",
    icon: "time",
  },
  {
    value: SortField.UPDATED_AT_ASC,
    label: "Mais antigo",
    icon: "time-outline",
  },
  {
    value: SortField.LAST_CONTACT_DESC,
    label: "Último contato (recente)",
    icon: "chatbox",
  },
  {
    value: SortField.LAST_CONTACT_ASC,
    label: "Último contato (antigo)",
    icon: "chatbox-outline",
  },
  {
    value: SortField.CREATED_AT_DESC,
    label: "Cadastro (recente)",
    icon: "person-add",
  },
  {
    value: SortField.CREATED_AT_ASC,
    label: "Cadastro (antigo)",
    icon: "person-add-outline",
  },
];

interface SortDropdownProps {
  value: SortField;
  onChange: (sort: SortField) => void;
}

/**
 * SortDropdown Component
 *
 * Dropdown para seleção de ordenação da lista de pacientes
 *
 * Opções:
 * - Nome (A-Z / Z-A)
 * - Mais recente / Mais antigo
 * - Último contato (recente / antigo)
 * - Cadastro (recente / antigo)
 */
export const SortDropdown: React.FC<SortDropdownProps> = ({
  value,
  onChange,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  const selectedOption =
    SORT_OPTIONS.find((opt) => opt.value === value) || SORT_OPTIONS[2]; // Default: Mais recente

  const handleSelect = (option: SortOption) => {
    onChange(option.value);
    setVisible(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="swap-vertical" size={18} color="#666666" />
        <Text style={styles.triggerText}>{selectedOption.label}</Text>
        <Ionicons name="chevron-down" size={18} color="#666666" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={visible} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <View style={styles.dropdown}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Ordenar por</Text>
              <TouchableOpacity
                onPress={() => setVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <View style={styles.options}>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    value === option.value && styles.optionSelected,
                  ]}
                  onPress={() => handleSelect(option)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={
                      value === option.value ? theme.colors.primary : "#666666"
                    }
                  />
                  <Text
                    style={[
                      styles.optionText,
                      value === option.value && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {value === option.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    trigger: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md, // Aumentado para md
      backgroundColor: "#FFFFFF", // Sempre branco
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: "#E0E0E0", // Sempre cinza claro
      gap: theme.spacing.xs,
      minHeight: 44, // Altura mínima para boa usabilidade
      ...theme.shadows.sm,
    },
    triggerText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.medium,
      color: "#1A1A1A", // Sempre texto escuro
      marginHorizontal: theme.spacing.xs, // Espaçamento entre ícones
    },
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: theme.spacing.lg,
    },
    dropdown: {
      backgroundColor: "#FFFFFF", // Sempre branco para melhor legibilidade
      borderRadius: theme.borderRadius.xl,
      width: "100%",
      maxWidth: 400,
      ...theme.shadows.lg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: "#E0E0E0", // Sempre cinza claro
    },
    title: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.bold,
      color: "#1A1A1A", // Sempre texto escuro para contraste com fundo branco
    },
    options: {
      padding: theme.spacing.md,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.xs,
    },
    optionSelected: {
      backgroundColor: theme.colors.primary + "10",
    },
    optionText: {
      flex: 1,
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.medium,
      color: "#666666", // Sempre cinza médio para contraste
    },
    optionTextSelected: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamily.semibold,
    },
  });
