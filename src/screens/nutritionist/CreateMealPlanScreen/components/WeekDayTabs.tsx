/**
 * WeekDayTabs - Tabs de navegação por dia da semana
 *
 * Permite navegar entre Segunda e Domingo
 * Bloqueia dias que ainda não podem ser acessados (validação progressiva)
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DayOfWeek } from "../../../../types/meal-plan.types";
import { DAY_LABELS, DAYS_ORDER } from "../../../../utils/dayOfWeek.utils";
import { lightTheme } from "../../../../theme";

interface Props {
  currentDay: DayOfWeek;
  onDayChange: (day: DayOfWeek) => void;
  canAccessDay: (day: DayOfWeek) => boolean;
  filledDays: DayOfWeek[];
}

export default function WeekDayTabs({
  currentDay,
  onDayChange,
  canAccessDay,
  filledDays,
}: Props) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {DAYS_ORDER.map((day) => {
          const isActive = currentDay === day;
          const isAccessible = canAccessDay(day);
          const isFilled = filledDays.includes(day);

          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.tab,
                isActive && styles.tabActive,
                !isAccessible && styles.tabDisabled,
              ]}
              onPress={() => isAccessible && onDayChange(day)}
              disabled={!isAccessible}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive && styles.tabTextActive,
                  !isAccessible && styles.tabTextDisabled,
                ]}
              >
                {DAY_LABELS[day]}
              </Text>
              {isFilled && isAccessible && (
                <View style={styles.filledIndicator}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={
                      isActive
                        ? lightTheme.colors.white
                        : lightTheme.colors.primary
                    }
                  />
                </View>
              )}
              {!isAccessible && (
                <Ionicons
                  name="lock-closed"
                  size={12}
                  color={lightTheme.colors.gray[400]}
                  style={styles.lockIcon}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: lightTheme.spacing[4],
  },
  scrollContent: {
    paddingHorizontal: lightTheme.spacing[4],
    gap: lightTheme.spacing[2],
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: lightTheme.spacing[2],
    paddingHorizontal: lightTheme.spacing[4],
    borderRadius: lightTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    backgroundColor: lightTheme.colors.white,
    minWidth: 85,
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: lightTheme.colors.primary,
    borderColor: lightTheme.colors.primary,
  },
  tabDisabled: {
    backgroundColor: lightTheme.colors.gray[50],
    borderColor: lightTheme.colors.gray[200],
    opacity: 0.6,
  },
  tabText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[700],
  },
  tabTextActive: {
    color: lightTheme.colors.white,
    fontWeight: lightTheme.typography.fontWeight.semibold,
  },
  tabTextDisabled: {
    color: lightTheme.colors.gray[400],
  },
  filledIndicator: {
    marginLeft: lightTheme.spacing[1],
  },
  lockIcon: {
    marginLeft: lightTheme.spacing[1],
  },
});
