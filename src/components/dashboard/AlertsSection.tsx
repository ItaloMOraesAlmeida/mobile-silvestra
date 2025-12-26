/**
 * AlertsSection - Seção de alertas importantes
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity, Image, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";
import { DashboardAlerts } from "../../types/dashboard";

interface AlertsSectionProps {
  data: DashboardAlerts;
  onAlertPress?: (patientId: string) => void;
  onGoalsPress?: () => void;
  onReviewsPress?: () => void;
  onInactivePatientsPress?: () => void;
}

export default function AlertsSection({
  data,
  onAlertPress,
  onGoalsPress,
  onReviewsPress,
  onInactivePatientsPress,
}: AlertsSectionProps) {
  const colors = lightTheme.colors;

  const totalAlerts =
    data.inactivePatients.length +
    data.upcomingDeadlines.length +
    data.expiringPlans.length;

  if (totalAlerts === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
        <Ionicons name="checkmark-circle" size={48} color="#10B981" />
        <Text style={[styles.emptyText, { color: colors.text }]}>
          Tudo em ordem! 🎉
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
          Nenhum alerta no momento
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Resumo de alertas */}
      <View style={styles.summary}>
        {data.inactivePatients.length > 0 && (
          <TouchableOpacity
            style={[styles.badge, { backgroundColor: "#FEF3C7" }]}
            onPress={onInactivePatientsPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.badgeText, { color: "#92400E" }]}>
              {data.inactivePatients.length} sem check-in
            </Text>
          </TouchableOpacity>
        )}
        {data.pendingReviews > 0 && (
          <TouchableOpacity
            style={[styles.badge, { backgroundColor: "#DBEAFE" }]}
            onPress={onReviewsPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.badgeText, { color: "#1E40AF" }]}>
              {data.pendingReviews} avaliações pendentes
            </Text>
          </TouchableOpacity>
        )}
        {data.upcomingDeadlines.length > 0 && (
          <TouchableOpacity
            style={[styles.badge, { backgroundColor: "#FEE2E2" }]}
            onPress={onGoalsPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.badgeText, { color: "#991B1B" }]}>
              {data.upcomingDeadlines.length} metas vencendo
            </Text>
          </TouchableOpacity>
        )}
        {data.expiringPlans.length > 0 && (
          <TouchableOpacity
            style={[styles.badge, { backgroundColor: "#DDD6FE" }]}
          >
            <Text style={[styles.badgeText, { color: "#5B21B6" }]}>
              {data.expiringPlans.length} planos expirando
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de pacientes inativos */}
      {data.inactivePatients.length > 0 && (
        <View style={styles.alertsList}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Pacientes Inativos
          </Text>
          {data.inactivePatients.slice(0, 3).map((alert) => (
            <TouchableOpacity
              key={alert.id}
              style={[styles.alertItem, { backgroundColor: colors.card }]}
              onPress={() => onAlertPress?.(alert.id)}
              activeOpacity={0.7}
            >
              {/* Avatar ou ícone */}
              <View
                style={[styles.alertIcon, { backgroundColor: "#FEF3C715" }]}
              >
                {alert.avatarUrl ? (
                  <Image
                    source={{ uri: alert.avatarUrl }}
                    style={styles.avatar}
                  />
                ) : (
                  <Ionicons name="time-outline" size={20} color="#F59E0B" />
                )}
              </View>

              {/* Conteúdo */}
              <View style={styles.alertContent}>
                <Text style={[styles.alertName, { color: colors.text }]}>
                  {alert.name}
                </Text>
                <Text
                  style={[styles.alertMessage, { color: colors.textSecondary }]}
                >
                  {alert.message}
                </Text>
                {alert.daysSinceActivity && (
                  <Text style={[styles.alertDays, { color: "#F59E0B" }]}>
                    {alert.daysSinceActivity} dias sem atividade
                  </Text>
                )}
              </View>

              {/* Seta */}
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Metas vencendo */}
      {data.upcomingDeadlines.length > 0 && (
        <View style={[styles.goalsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Metas com Prazo Próximo
          </Text>
          <View style={styles.alertsList}>
            {data.upcomingDeadlines.slice(0, 3).map((deadline, index) => (
              <TouchableOpacity
                key={`deadline-${deadline.patientId}-${index}`}
                style={[
                  styles.alertItem,
                  { backgroundColor: colors.background },
                ]}
                onPress={() => onAlertPress?.(deadline.patientId)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.alertIcon, { backgroundColor: "#FEE2E215" }]}
                >
                  <Ionicons name="flag-outline" size={20} color="#EF4444" />
                </View>

                <View style={styles.alertContent}>
                  <Text style={[styles.alertName, { color: colors.text }]}>
                    {deadline.patientName}
                  </Text>
                  <Text
                    style={[
                      styles.alertMessage,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Meta de {deadline.goalType}
                  </Text>
                  <Text style={[styles.alertDays, { color: "#EF4444" }]}>
                    Vence em {deadline.daysUntilDeadline} dias
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
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 16,
    backgroundColor: lightTheme.colors.card,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  summary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  goalsCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertsList: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 8,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  alertContent: {
    flex: 1,
  },
  alertName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 14,
    marginBottom: 2,
  },
  alertDays: {
    fontSize: 12,
    fontWeight: "600",
  },
  moreText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
});
