import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, ViewStyle } from "react-native";
import { useThemedStyles } from "../../hooks/useTheme";
import type { Theme } from "../../theme";

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = "100%",
  height = 20,
  borderRadius,
  style,
}) => {
  const styles = useThemedStyles(createStyles);
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as number | `${number}%` | "auto",
          height,
          borderRadius: borderRadius ?? styles.skeleton.borderRadius,
        },
        { opacity },
        style,
      ]}
    />
  );
};

// Skeleton pré-configurados para componentes específicos
export const KpiCardSkeleton: React.FC = () => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.kpiCard}>
      <LoadingSkeleton width={48} height={48} borderRadius={12} />
      <View style={styles.kpiContent}>
        <LoadingSkeleton width={80} height={14} style={{ marginBottom: 8 }} />
        <LoadingSkeleton width={120} height={24} />
      </View>
    </View>
  );
};

export const CardSkeleton: React.FC = () => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      <LoadingSkeleton width="60%" height={18} style={{ marginBottom: 12 }} />
      <LoadingSkeleton width="100%" height={14} style={{ marginBottom: 8 }} />
      <LoadingSkeleton width="80%" height={14} style={{ marginBottom: 8 }} />
      <LoadingSkeleton width="90%" height={14} />
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    skeleton: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.sm,
    },
    kpiCard: {
      flexDirection: "row",
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      alignItems: "center",
      ...theme.shadows.sm,
    },
    kpiContent: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      ...theme.shadows.sm,
    },
  });
