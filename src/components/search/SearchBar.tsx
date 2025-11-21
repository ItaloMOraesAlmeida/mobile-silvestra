import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, useThemedStyles } from "../../hooks/useTheme";
import type { Theme } from "../../theme";

interface Props {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  debounceMs?: number;
  resultCount?: number;
}

/**
 * Componente de busca com debounce
 */
export const SearchBar: React.FC<Props> = ({
  placeholder = "Buscar medições...",
  value,
  onChangeText,
  onClear,
  debounceMs = 300,
  resultCount,
}) => {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const [localValue, setLocalValue] = useState(value);

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChangeText(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChangeText, value]);

  // Atualiza valor local quando prop value muda
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = useCallback(() => {
    setLocalValue("");
    onClear();
  }, [onClear]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={theme.colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          value={localValue}
          onChangeText={setLocalValue}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
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
      {localValue.length > 0 && resultCount !== undefined && (
        <Text style={styles.resultCount}>
          {resultCount === 0
            ? "Nenhum resultado encontrado"
            : `${resultCount} resultado${
                resultCount !== 1 ? "s" : ""
              } encontrado${resultCount !== 1 ? "s" : ""}`}
        </Text>
      )}
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      gap: theme.spacing.xs,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    searchIcon: {
      marginRight: theme.spacing.sm,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
      paddingVertical: 0,
    },
    clearButton: {
      marginLeft: theme.spacing.sm,
    },
    resultCount: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      paddingHorizontal: theme.spacing.sm,
    },
  });
