import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { lightTheme } from "../../theme";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = lightTheme.borderRadius.md,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
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
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: lightTheme.colors.gray[200],
  },
});

interface SkeletonCardProps {
  hasIcon?: boolean;
  hasSwitch?: boolean;
}

export function SkeletonSettingItem({
  hasIcon = true,
  hasSwitch = false,
}: SkeletonCardProps) {
  return (
    <View style={skeletonStyles.settingItem}>
      {hasIcon && (
        <Skeleton
          width={36}
          height={36}
          borderRadius={lightTheme.borderRadius.md}
          style={skeletonStyles.icon}
        />
      )}
      <View style={skeletonStyles.content}>
        <Skeleton width="60%" height={16} style={skeletonStyles.title} />
        <Skeleton width="80%" height={12} />
      </View>
      {hasSwitch && (
        <Skeleton
          width={51}
          height={31}
          borderRadius={lightTheme.borderRadius.full}
        />
      )}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: lightTheme.spacing.lg,
  },
  icon: {
    marginRight: lightTheme.spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    marginBottom: lightTheme.spacing.xs,
  },
});
