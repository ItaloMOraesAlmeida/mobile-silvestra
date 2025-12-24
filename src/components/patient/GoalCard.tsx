import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles } from "../../hooks/useTheme";
import type { Theme } from "../../theme";
import type { Goal, GoalType } from "../../types/patient-details.types";
import { getGoalTypeLabel } from "../../constants/goalTypes";

interface GoalCardProps {
  goal: Goal;
  onPress?: () => void;
  onAchieve?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onPress,
  onAchieve,
  onEdit,
  onDelete,
}) => {
  const styles = useThemedStyles(createStyles);

  const isOverdue =
    goal.deadline && !goal.achieved
      ? new Date(goal.deadline) < new Date()
      : false;

  const getGoalTypeInfo = (type: GoalType) => {
    const info: Record<
      GoalType,
      { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }
    > = {
      WEIGHT: { icon: "scale", label: "Peso", color: styles.weightColor.color },
      BODY_FAT: {
        icon: "water",
        label: "Gordura Corporal",
        color: styles.fatColor.color,
      },
      MUSCLE_MASS: {
        icon: "fitness",
        label: "Massa Muscular",
        color: styles.muscleColor.color,
      },
      WAIST_CIRC: {
        icon: "ellipse",
        label: "Circunferência da Cintura",
        color: styles.waistColor.color,
      },
      OTHER: { icon: "flag", label: "Outro", color: styles.customColor.color },
    };
    return info[type];
  };

  const typeInfo = getGoalTypeInfo(goal.type);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: typeInfo.color + "20" },
            ]}
          >
            <Ionicons name={typeInfo.icon} size={20} color={typeInfo.color} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.goalName} numberOfLines={1}>
              {goal.name}
            </Text>
            <Text style={styles.typeLabel}>{getGoalTypeLabel(goal.type)}</Text>
            {goal.deadline && (
              <View style={styles.deadlineContainer}>
                <Ionicons
                  name="calendar"
                  size={12}
                  color={
                    isOverdue
                      ? styles.overdueColor.color
                      : styles.deadlineIconColor.color
                  }
                />
                <Text
                  style={[styles.deadlineText, isOverdue && styles.overdueText]}
                >
                  {formatDate(goal.deadline)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.headerRight}>
          {goal.achieved && (
            <View style={styles.achievedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={styles.achievedIconColor.color}
              />
            </View>
          )}

          {onEdit && !goal.achieved && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={styles.editIcon.color}
              />
            </TouchableOpacity>
          )}

          {onDelete && !goal.achieved && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={styles.deleteIcon.color}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Meta Info */}
      <View style={styles.metaInfo}>
        <Text style={styles.currentValue}>
          {goal.current !== null
            ? `${goal.current} ${goal.unit}`
            : "Não iniciado"}
        </Text>
        <Text style={styles.targetValue}>
          Meta: {goal.target} {goal.unit}
        </Text>
      </View>

      {/* Notes */}
      {goal.notes && (
        <View style={styles.notesContainer}>
          <Ionicons
            name="document-text"
            size={14}
            color={styles.notesIconColor.color}
          />
          <Text style={styles.notesText} numberOfLines={2}>
            {goal.notes}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.white,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 3,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: theme.spacing.md,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    editButton: {
      width: 32,
      height: 32,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.primaryBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    editIcon: {
      color: theme.colors.primary,
    },
    deleteButton: {
      width: 32,
      height: 32,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.error + "15",
      alignItems: "center",
      justifyContent: "center",
    },
    deleteIcon: {
      color: theme.colors.error,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: theme.borderRadius.md,
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.sm,
    },
    headerText: {
      flex: 1,
    },
    goalName: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: "#1a1a1a",
      marginBottom: 2,
    },
    typeLabel: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.medium,
      color: "#666",
      marginBottom: theme.spacing.xs / 2,
    },
    deadlineContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    deadlineIconColor: {
      color: theme.colors.textSecondary,
    },
    deadlineText: {
      fontSize: theme.typography.fontSize.xs,
      color: "#666",
    },
    overdueText: {
      color: theme.colors.error,
      fontWeight: theme.typography.fontWeight.medium,
    },
    achievedBadge: {
      marginLeft: theme.spacing.sm,
    },
    achievedIconColor: {
      color: theme.colors.success,
    },
    metaInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.sm,
    },
    currentValue: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: "#1a1a1a",
    },
    targetValue: {
      fontSize: theme.typography.fontSize.sm,
      color: "#666",
    },
    notesContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    notesIconColor: {
      color: theme.colors.textSecondary,
    },
    notesText: {
      flex: 1,
      fontSize: theme.typography.fontSize.sm,
      color: "#666",
      lineHeight: 18,
    },
    // Type colors
    weightColor: {
      color: theme.colors.primary,
    },
    fatColor: {
      color: theme.colors.warning,
    },
    muscleColor: {
      color: theme.colors.success,
    },
    waistColor: {
      color: theme.colors.info,
    },
    customColor: {
      color: theme.colors.textSecondary,
    },
    overdueColor: {
      color: theme.colors.error,
    },
  });
