import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { lightTheme } from "../../theme";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  subtitle?: string;
}

function MetricCard({ title, value, icon, color, subtitle }: MetricCardProps) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.metricContent}>
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={styles.metricValue}>{value}</Text>
        {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

export function DashboardScreen() {
  // Dados mockados - serão substituídos pela API
  const metrics = {
    totalPatients: 24,
    activePatients: 18,
    pendingEvaluations: 5,
    averageAdherence: 82,
    monthAppointments: 32,
  };

  const upcomingBirthdays = [
    { id: 1, name: "Maria Silva", date: "15/11", age: 34 },
    { id: 2, name: "João Santos", date: "18/11", age: 28 },
    { id: 3, name: "Ana Costa", date: "22/11", age: 42 },
  ];

  const recentActivities = [
    {
      id: 1,
      type: "evaluation",
      patient: "Carlos Oliveira",
      description: "Nova avaliação antropométrica",
      time: "2h atrás",
    },
    {
      id: 2,
      type: "appointment",
      patient: "Paula Mendes",
      description: "Consulta realizada",
      time: "5h atrás",
    },
    {
      id: 3,
      type: "diary",
      patient: "Roberto Lima",
      description: "Diário alimentar atualizado",
      time: "1d atrás",
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header com Gradiente */}
      <LinearGradient
        colors={[lightTheme.colors.primary, lightTheme.colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View>
          <Text style={styles.headerGreeting}>Olá, Nutricionista! 👋</Text>
          <Text style={styles.headerSubtitle}>Aqui está o resumo de hoje</Text>
        </View>
      </LinearGradient>

      {/* Métricas Principais */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visão Geral</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Total de Pacientes"
            value={metrics.totalPatients}
            icon="people"
            color={lightTheme.colors.primary}
          />
          <MetricCard
            title="Pacientes Ativos"
            value={metrics.activePatients}
            icon="checkmark-circle"
            color={lightTheme.colors.success}
          />
          <MetricCard
            title="Avaliações Pendentes"
            value={metrics.pendingEvaluations}
            icon="alert-circle"
            color={lightTheme.colors.warning}
          />
          <MetricCard
            title="Adesão Média"
            value={`${metrics.averageAdherence}%`}
            icon="trending-up"
            color={lightTheme.colors.info}
            subtitle="Últimos 30 dias"
          />
        </View>
      </View>

      {/* Aniversariantes do Mês */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Aniversariantes do Mês</Text>
          <Ionicons
            name="gift"
            size={20}
            color={lightTheme.colors.primary}
            style={{ opacity: 0.8 }}
          />
        </View>
        <View style={styles.card}>
          {upcomingBirthdays.map((birthday, index) => (
            <View
              key={birthday.id}
              style={[
                styles.birthdayItem,
                index !== upcomingBirthdays.length - 1 && styles.itemBorder,
              ]}
            >
              <View style={styles.birthdayIconContainer}>
                <Ionicons
                  name="balloon"
                  size={20}
                  color={lightTheme.colors.primary}
                />
              </View>
              <View style={styles.birthdayInfo}>
                <Text style={styles.birthdayName}>{birthday.name}</Text>
                <Text style={styles.birthdayDate}>
                  {birthday.date} • {birthday.age} anos
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Atividades Recentes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Atividades Recentes</Text>
        <View style={styles.card}>
          {recentActivities.map((activity, index) => {
            const activityIcons = {
              evaluation: "clipboard",
              appointment: "calendar",
              diary: "restaurant",
            };

            const activityColors = {
              evaluation: lightTheme.colors.info,
              appointment: lightTheme.colors.success,
              diary: lightTheme.colors.warning,
            };

            return (
              <View
                key={activity.id}
                style={[
                  styles.activityItem,
                  index !== recentActivities.length - 1 && styles.itemBorder,
                ]}
              >
                <View
                  style={[
                    styles.activityIcon,
                    {
                      backgroundColor: `${
                        activityColors[
                          activity.type as keyof typeof activityColors
                        ]
                      }15`,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      activityIcons[
                        activity.type as keyof typeof activityIcons
                      ] as keyof typeof Ionicons.glyphMap
                    }
                    size={18}
                    color={
                      activityColors[
                        activity.type as keyof typeof activityColors
                      ]
                    }
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityPatient}>{activity.patient}</Text>
                  <Text style={styles.activityDescription}>
                    {activity.description}
                  </Text>
                </View>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Ação Rápida */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.quickActionButton} activeOpacity={0.8}>
          <LinearGradient
            colors={[lightTheme.colors.primary, lightTheme.colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quickActionGradient}
          >
            <Ionicons
              name="add-circle"
              size={24}
              color={lightTheme.colors.white}
            />
            <Text style={styles.quickActionText}>Novo Paciente</Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={lightTheme.colors.white}
              style={{ opacity: 0.8 }}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Espaçamento Final */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[50],
  },
  header: {
    paddingHorizontal: lightTheme.spacing.xl,
    paddingTop: lightTheme.spacing.xl + lightTheme.spacing.md,
    paddingBottom: lightTheme.spacing["2xl"],
    borderBottomLeftRadius: lightTheme.borderRadius["2xl"],
    borderBottomRightRadius: lightTheme.borderRadius["2xl"],
  },
  headerGreeting: {
    fontSize: lightTheme.typography.fontSize["2xl"],
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.white,
    marginBottom: lightTheme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.white,
    opacity: 0.9,
  },
  section: {
    paddingHorizontal: lightTheme.spacing.xl,
    marginTop: lightTheme.spacing.xl + lightTheme.spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: lightTheme.spacing.md,
  },
  sectionTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[800],
    marginBottom: lightTheme.spacing.md,
  },
  metricsGrid: {
    gap: lightTheme.spacing.md,
  },
  metricCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.white,
    padding: lightTheme.spacing.lg,
    borderRadius: lightTheme.borderRadius.lg,
    ...lightTheme.shadows.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: lightTheme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: lightTheme.spacing.md,
  },
  metricContent: {
    flex: 1,
  },
  metricTitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing.xs - 2,
  },
  metricValue: {
    fontSize: lightTheme.typography.fontSize["2xl"],
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[800],
  },
  metricSubtitle: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginTop: lightTheme.spacing.xs - 2,
  },
  card: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    ...lightTheme.shadows.sm,
    overflow: "hidden",
  },
  birthdayItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: lightTheme.spacing.lg,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  birthdayIconContainer: {
    width: 40,
    height: 40,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: lightTheme.colors.primaryBackground,
    alignItems: "center",
    justifyContent: "center",
    marginRight: lightTheme.spacing.md,
  },
  birthdayInfo: {
    flex: 1,
  },
  birthdayName: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[800],
    marginBottom: lightTheme.spacing.xs - 2,
  },
  birthdayDate: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: lightTheme.spacing.lg,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: lightTheme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: lightTheme.spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityPatient: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[800],
    marginBottom: lightTheme.spacing.xs - 2,
  },
  activityDescription: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
  },
  activityTime: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[400],
    marginLeft: lightTheme.spacing.sm,
  },
  quickActionButton: {
    borderRadius: lightTheme.borderRadius.lg,
    overflow: "hidden",
    ...lightTheme.shadows.primary,
  },
  quickActionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: lightTheme.spacing.lg,
    gap: lightTheme.spacing.md,
  },
  quickActionText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.white,
  },
  bottomSpacer: {
    height: lightTheme.spacing["2xl"] + lightTheme.spacing.md,
  },
});
