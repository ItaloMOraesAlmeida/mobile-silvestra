import React, { useState, useEffect, useRef } from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles, useTheme } from "../hooks/useTheme";
import type { Theme } from "../theme";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  debounceMs?: number;
  onFilterPress?: () => void;
  hasActiveFilters?: boolean;
  onSubmitEditing?: () => void;
}

/**
 * SearchBar Component
 *
 * Barra de busca com debounce para otimizar chamadas à API
 *
 * Features:
 * - Debounce configurável (padrão: 500ms)
 * - Botão de limpar busca
 * - Botão de filtros com indicador de filtros ativos
 * - Ícone de busca
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Buscar pacientes...",
  debounceMs = 500,
  onFilterPress,
  hasActiveFilters = false,
  onSubmitEditing,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const [localValue, setLocalValue] = useState(value);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Sincroniza valor externo com valor local
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  /**
   * Handle text change with debounce
   */
  const handleChangeText = (text: string) => {
    setLocalValue(text);

    // Limpa timeout anterior
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Cria novo timeout
    debounceTimeout.current = setTimeout(() => {
      onChangeText(text);
    }, debounceMs);
  };

  /**
   * Limpa a busca
   */
  const handleClear = () => {
    setLocalValue("");
    onChangeText("");

    // Limpa timeout pendente
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.inputContainer}>
        {/* Search Icon */}
        <Ionicons
          name="search"
          size={20}
          color={theme.colors.textSecondary}
          style={styles.searchIcon}
        />

        {/* Text Input */}
        <TextInput
          style={styles.input}
          value={localValue}
          onChangeText={handleChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />

        {/* Clear Button */}
        {localValue.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Button */}
      {onFilterPress && (
        <TouchableOpacity
          onPress={onFilterPress}
          style={[
            styles.filterButton,
            hasActiveFilters && {
              backgroundColor: theme.colors.primary + "20",
              borderColor: theme.colors.primary,
            },
          ]}
        >
          <Ionicons
            name={hasActiveFilters ? "filter" : "filter-outline"}
            size={20}
            color={
              hasActiveFilters
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
          />
          {hasActiveFilters && <View style={styles.filterIndicator} />}
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    inputContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.sm,
    },
    searchIcon: {
      marginRight: theme.spacing.sm,
    },
    input: {
      flex: 1,
      height: 44,
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text,
      fontFamily: theme.typography.fontFamily.regular,
    },
    clearButton: {
      padding: theme.spacing.xs,
    },
    filterButton: {
      width: 44,
      height: 44,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
      ...theme.shadows.sm,
      position: "relative",
    },
    filterIndicator: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
    },
  });
