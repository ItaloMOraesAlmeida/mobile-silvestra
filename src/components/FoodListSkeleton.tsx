/**
 * FoodListSkeleton - Skeleton loader para lista de alimentos
 */

import React from "react";
import { View, StyleSheet, Animated } from "react-native";
import { lightTheme } from "../theme";

const FoodListSkeleton = () => {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const SkeletonCard = () => (
    <Animated.View style={[styles.card, { opacity }]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardContent}>
          <View style={styles.titleSkeleton} />
          <View style={styles.categoryBadgeSkeleton} />
        </View>
        <View style={styles.iconSkeleton} />
      </View>

      {/* Macros */}
      <View style={styles.macrosContainer}>
        <View style={styles.caloriesSkeleton} />
        <View style={styles.macrosRow}>
          <View style={styles.macroItemSkeleton} />
          <View style={styles.macroItemSkeleton} />
          <View style={styles.macroItemSkeleton} />
        </View>
      </View>

      {/* Score */}
      <View style={styles.scoreContainer}>
        <View style={styles.scoreSkeleton} />
        <View style={styles.scoreTextSkeleton} />
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: lightTheme.spacing[4],
    paddingTop: lightTheme.spacing[4],
  },
  card: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.xl,
    padding: lightTheme.spacing[4],
    marginBottom: lightTheme.spacing[3],
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[100],
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: lightTheme.spacing[3],
  },
  cardContent: {
    flex: 1,
    paddingRight: lightTheme.spacing[2],
  },
  titleSkeleton: {
    height: 20,
    backgroundColor: lightTheme.colors.gray[200],
    borderRadius: 4,
    width: "70%",
    marginBottom: lightTheme.spacing[2],
  },
  categoryBadgeSkeleton: {
    height: 24,
    backgroundColor: lightTheme.colors.gray[200],
    borderRadius: 12,
    width: 80,
  },
  iconSkeleton: {
    width: 40,
    height: 40,
    backgroundColor: lightTheme.colors.gray[200],
    borderRadius: 20,
  },
  macrosContainer: {
    marginTop: lightTheme.spacing[3],
    paddingTop: lightTheme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[100],
  },
  caloriesSkeleton: {
    height: 32,
    backgroundColor: lightTheme.colors.gray[200],
    borderRadius: 4,
    width: 100,
    marginBottom: lightTheme.spacing[3],
  },
  macrosRow: {
    flexDirection: "row",
    gap: lightTheme.spacing[4],
  },
  macroItemSkeleton: {
    height: 40,
    backgroundColor: lightTheme.colors.gray[200],
    borderRadius: 4,
    width: 60,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: lightTheme.spacing[3],
    paddingTop: lightTheme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[100],
  },
  scoreSkeleton: {
    height: 20,
    backgroundColor: lightTheme.colors.gray[200],
    borderRadius: 4,
    width: 100,
  },
  scoreTextSkeleton: {
    height: 16,
    backgroundColor: lightTheme.colors.gray[200],
    borderRadius: 4,
    width: 60,
  },
});

export default FoodListSkeleton;
