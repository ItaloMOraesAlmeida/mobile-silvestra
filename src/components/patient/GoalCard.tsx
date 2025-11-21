import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles } from "../../hooks/useTheme";
import type { Theme } from "../../theme";
import type { Goal, GoalType } from "../../types/patient-details.types";

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

  const progress =
    goal.current !== null && goal.target > 0
      ? Math.min((goal.current / goal.target) * 100, 100)
      : 0;

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

  const getProgressColor = () => {
    if (goal.achieved) return styles.achievedColor.color;
    if (isOverdue) return styles.overdueColor.color;
    if (progress >= 75) return styles.highProgressColor.color;
    if (progress >= 50) return styles.mediumProgressColor.color;
    return styles.lowProgressColor.color;
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
            <Text style={styles.typeLabel}>{typeInfo.label}</Text>
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

      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabels}>
          <Text style={styles.currentValue}>
            {goal.current !== null
              ? `${goal.current} ${goal.unit}`
              : "Não iniciado"}
          </Text>
          <Text style={styles.targetValue}>
            Meta: {goal.target} {goal.unit}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${progress}%`,
                backgroundColor: getProgressColor(),
              },
            ]}
          />
        </View>

        <View style={styles.progressFooter}>
          <Text style={styles.progressText}>
            {progress.toFixed(0)}% concluído
          </Text>
          {!goal.achieved && onAchieve && progress >= 100 && (
            <TouchableOpacity
              style={styles.achieveButton}
              onPress={onAchieve}
              activeOpacity={0.7}
            >
              <Ionicons
                name="checkmark"
                size={16}
                color={styles.achieveButtonText.color}
              />
              <Text style={styles.achieveButtonText}>
                Marcar como concluída
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.sm,
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
    typeLabel: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
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
      color: theme.colors.textSecondary,
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
    progressSection: {
      gap: theme.spacing.sm,
    },
    progressLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    currentValue: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
    },
    targetValue: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.full,
      overflow: "hidden",
    },
    progressBar: {
      height: "100%",
      borderRadius: theme.borderRadius.full,
    },
    progressFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    progressText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    achieveButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      backgroundColor: theme.colors.success,
      borderRadius: theme.borderRadius.md,
    },
    achieveButtonText: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.white,
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
      color: theme.colors.textSecondary,
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
    // Progress colors
    achievedColor: {
      color: theme.colors.success,
    },
    overdueColor: {
      color: theme.colors.error,
    },
    highProgressColor: {
      color: theme.colors.success,
    },
    mediumProgressColor: {
      color: theme.colors.warning,
    },
    lowProgressColor: {
      color: theme.colors.info,
    },
  });
