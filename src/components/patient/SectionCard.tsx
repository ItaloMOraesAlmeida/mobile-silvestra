import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles } from "../../hooks/useTheme";
import type { Theme } from "../../theme";

interface SectionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  items: string[];
  emptyMessage?: string;
  onEdit?: () => void;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  icon,
  title,
  items,
  emptyMessage = "Nenhuma informação cadastrada",
  onEdit,
}) => {
  const styles = useThemedStyles(createStyles);

  const isEmpty = items.length === 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={20} color={styles.iconColor.color} />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>

        {onEdit && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={onEdit}
            activeOpacity={0.7}
          >
            <Ionicons
              name="pencil"
              size={18}
              color={styles.editIconColor.color}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isEmpty ? (
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        ) : (
          items.map((item, index) => (
            <View key={index} style={styles.item}>
              <View style={styles.bullet} />
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.sm,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.md,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.sm,
    },
    iconColor: {
      color: theme.colors.primary,
    },
    title: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
    },
    editButton: {
      width: 32,
      height: 32,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    editIconColor: {
      color: theme.colors.primary,
    },
    content: {
      gap: theme.spacing.sm,
    },
    item: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: theme.spacing.xs,
    },
    bullet: {
      width: 6,
      height: 6,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primary,
      marginTop: 6,
      marginRight: theme.spacing.sm,
    },
    itemText: {
      flex: 1,
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text,
      lineHeight: 20,
    },
    emptyText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      fontStyle: "italic",
      textAlign: "center",
      paddingVertical: theme.spacing.md,
    },
  });
