/**
 * TopPerformersCard - Card com ranking de melhores pacientes
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity, Image, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";
import { TopPerformers } from "../../types/dashboard";

interface TopPerformersCardProps {
  data: TopPerformers;
  onPatientPress?: (patientId: string) => void;
}

export default function TopPerformersCard({
  data,
  onPatientPress,
}: TopPerformersCardProps) {
  const colors = lightTheme.colors;

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return null;
    }
  };

  const getAdherenceColor = (adherence: number) => {
    if (adherence >= 80) return "#10B981";
    if (adherence >= 60) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Destaques do Período
        </Text>
        {data.topPerformers && data.topPerformers.length > 0 && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Top {data.topPerformers.length} pacientes
          </Text>
        )}
      </View>

      {/* Lista de Top Performers */}
      {data.topPerformers && data.topPerformers.length > 0 ? (
        <View style={styles.performersList}>
          {data.topPerformers.map((performer, index) => (
            <TouchableOpacity
              key={`top-${performer.patientId}-${index}`}
              style={styles.performerItem}
              onPress={() => onPatientPress?.(performer.patientId)}
              activeOpacity={0.7}
            >
              {/* Posição/Medalha */}
              <View style={styles.positionContainer}>
                {getMedalIcon(index + 1) ? (
                  <Text style={styles.medal}>{getMedalIcon(index + 1)}</Text>
                ) : (
                  <Text
                    style={[styles.position, { color: colors.textSecondary }]}
                  >
                    {index + 1}º
                  </Text>
                )}
              </View>

              {/* Avatar */}
              <View style={styles.avatarContainer}>
                {performer.avatarUrl ? (
                  <Image
                    source={{ uri: performer.avatarUrl }}
                    style={styles.avatar}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {performer.patientName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Info */}
              <View style={styles.infoContainer}>
                <Text
                  style={[styles.name, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {performer.patientName}
                </Text>
                <View style={styles.stats}>
                  <View style={styles.statBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color="#10B981"
                    />
                    <Text
                      style={[styles.statText, { color: colors.textSecondary }]}
                    >
                      {performer.adherenceRate}% adesão
                    </Text>
                  </View>
                </View>
              </View>

              {/* Progresso */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${performer.adherenceRate}%`,
                        backgroundColor: getAdherenceColor(
                          performer.adherenceRate
                        ),
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.progressText,
                    { color: getAdherenceColor(performer.adherenceRate) },
                  ]}
                >
                  {performer.goalsAchieved}/{performer.totalGoals}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons
            name="trophy-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nenhum dado disponível ainda
          </Text>
        </View>
      )}

      {/* Seção "Precisam de Apoio" */}
      {data.needsSupport.length > 0 && (
        <View style={styles.needsSupportSection}>
          <Text style={[styles.needsSupportTitle, { color: colors.text }]}>
            Precisam de Apoio
          </Text>
          {data.needsSupport.slice(0, 3).map((patient, index) => (
            <TouchableOpacity
              key={`support-${patient.patientId}-${index}`}
              style={[
                styles.needsSupportItem,
                { backgroundColor: colors.background },
              ]}
              onPress={() => onPatientPress?.(patient.patientId)}
              activeOpacity={0.7}
            >
              <View style={styles.needsSupportIcon}>
                <Ionicons name="warning" size={16} color="#F59E0B" />
              </View>
              <View style={styles.needsSupportInfo}>
                <Text
                  style={[styles.needsSupportName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {patient.patientName}
                </Text>
                <Text
                  style={[
                    styles.needsSupportStats,
                    { color: colors.textSecondary },
                  ]}
                >
                  {patient.adherenceRate}% adesão • {patient.goalsAchieved}/
                  {patient.totalGoals} metas
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
  performersList: {
    gap: 12,
  },
  performerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  positionContainer: {
    width: 32,
    alignItems: "center",
  },
  medal: {
    fontSize: 24,
  },
  position: {
    fontSize: 16,
    fontWeight: "600",
  },
  avatarContainer: {
    width: 48,
    height: 48,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  stats: {
    flexDirection: "row",
    gap: 8,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  progressContainer: {
    width: 80,
    alignItems: "flex-end",
  },
  progressBar: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 3,
    marginBottom: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
  },
  needsSupportSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  needsSupportTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  needsSupportItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  needsSupportIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
  },
  needsSupportInfo: {
    flex: 1,
  },
  needsSupportName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  needsSupportStats: {
    fontSize: 12,
  },
});
