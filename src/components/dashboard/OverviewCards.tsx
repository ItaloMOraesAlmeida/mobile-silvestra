/**
 * OverviewCards - Cards com métricas principais
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";
import { DashboardOverview } from "../../types/dashboard";

interface OverviewCardsProps {
  data: DashboardOverview;
  onCardPress?: (cardType: string) => void;
  onTotalPatientsPress?: () => void;
  onActivePatientsPress?: () => void;
  onAdherencePress?: () => void;
  onTodayAppointmentsPress?: () => void;
}

export default function OverviewCards({
  data,
  onCardPress,
  onTotalPatientsPress,
  onActivePatientsPress,
  onAdherencePress,
  onTodayAppointmentsPress,
}: OverviewCardsProps) {
  const colors = lightTheme.colors;

  const cards = [
    {
      id: "total",
      icon: "people-outline" as const,
      label: "Total de Pacientes",
      value: data.totalPatients,
      color: colors.primary,
      onPress: onTotalPatientsPress,
    },
    {
      id: "active",
      icon: "checkmark-circle-outline" as const,
      label: "Pacientes Ativos",
      value: data.activePatients,
      color: "#10B981",
      onPress: onActivePatientsPress,
    },
    {
      id: "adherence",
      icon: "stats-chart-outline" as const,
      label: "Adesão Alimentar Média",
      value: `${data.averageAdherence}%`,
      color: "#8B5CF6",
      onPress: onAdherencePress,
    },
    {
      id: "appointments",
      icon: "calendar-outline" as const,
      label: "Consultas Hoje",
      value: data.todayAppointments,
      color: "#F59E0B",
      subtitle: `${data.weekAppointments} esta semana`,
      onPress: onTodayAppointmentsPress,
    },
  ];

  return (
    <View style={styles.container}>
      {cards.map((card) => (
        <TouchableOpacity
          key={card.id}
          style={[styles.card, { backgroundColor: colors.card }]}
          onPress={card.onPress || (() => onCardPress?.(card.id))}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${card.color}15` },
            ]}
          >
            <Ionicons name={card.icon} size={24} color={card.color} />
          </View>

          <View style={styles.content}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {card.label}
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {card.value}
            </Text>
            {card.subtitle && (
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {card.subtitle}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    flex: 1,
    minWidth: "47%",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
});
