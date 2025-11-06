import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Rect } from "react-native-svg";
import { lightTheme } from "../../theme";
import { useDashboard } from "../../hooks/useDashboard";
import { useAuthStore } from "../../stores/auth.store";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function DashboardScreen({ navigation }: { navigation: any }) {
  const { metrics, loading, error, getMetrics, refreshMetrics } =
    useDashboard();
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshMetrics();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !metrics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={lightTheme.colors.primary} />
        <Text style={styles.loadingText}>Carregando dashboard...</Text>
      </View>
    );
  }

  if (error && !metrics) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons
          name="alert-circle"
          size={64}
          color={lightTheme.colors.error}
        />
        <Text style={styles.errorText}>{String(error)}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getMetrics}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const safeMetrics =
    metrics ||
    ({
      totalPatients: 0,
      activePatients: 0,
      inactivePatients: 0,
      archivedPatients: 0,
      pendingEvaluations: 0,
      averageAdherence: 0,
      upcomingBirthdays: [],
      recentActivities: [],
    } as any);

  // const screenWidth = Dimensions.get("window").width; // removed (unused)
  const sparkData = Array.from({ length: 8 }).map((_, i) => {
    const base = safeMetrics.averageAdherence || 40;
    const variance = Math.round(base * (0.5 + 0.5 * Math.sin(i)));
    return Math.max(6, Math.min(100, variance));
  });

  const makeSparkPath = (data: number[], width: number, height: number) => {
    if (!data || data.length === 0) return "";
    const max = Math.max(...data, 100);
    const min = Math.min(...data, 0);
    const len = data.length;
    const step = width / Math.max(1, len - 1);

    const points = data.map((d, i) => {
      const x = Math.round(i * step);
      const norm = (d - min) / (max - min || 1);
      const y = Math.round(height - norm * height);
      return { x, y };
    });

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  };

  const formatBirthday = (birthDate: string | Date) => {
    try {
      return format(new Date(birthDate), "dd/MM", { locale: ptBR });
    } catch {
      return "--/--";
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[lightTheme.colors.primary]}
        />
      }
    >
      <LinearGradient
        colors={[lightTheme.colors.primary, lightTheme.colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerGreeting}>
              Olá
              {user?.name ? `, ${user.name.split(" ")[0]}` : ", Nutricionista"}
            </Text>
            <Text style={styles.headerSubtitle}>
              Resumo rápido dos seus pacientes
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("PatientCreate")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="person-add"
              size={18}
              color={lightTheme.colors.white}
            />
            <Text style={styles.headerButtonText}>Novo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.kpiRow}>
          <TouchableOpacity
            style={styles.kpiCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("PatientsList")}
          >
            <View
              style={[
                styles.kpiIcon,
                { backgroundColor: lightTheme.colors.primary + "22" },
              ]}
            >
              <Ionicons
                name="people"
                size={20}
                color={lightTheme.colors.primary}
              />
            </View>
            <View style={styles.kpiBody}>
              <Text style={styles.kpiValue}>{safeMetrics.totalPatients}</Text>
              <Text style={styles.kpiLabel}>Pacientes</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.kpiCard}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate("PatientsList", { filter: "active" })
            }
          >
            <View
              style={[
                styles.kpiIcon,
                { backgroundColor: lightTheme.colors.success + "22" },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={lightTheme.colors.success}
              />
            </View>
            <View style={styles.kpiBody}>
              <Text style={styles.kpiValue}>{safeMetrics.activePatients}</Text>
              <Text style={styles.kpiLabel}>Ativos</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.kpiCard}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate("PatientsList", { filter: "pending" })
            }
          >
            <View
              style={[
                styles.kpiIcon,
                { backgroundColor: lightTheme.colors.warning + "22" },
              ]}
            >
              <Ionicons
                name="alert-circle"
                size={20}
                color={lightTheme.colors.warning}
              />
            </View>
            <View style={styles.kpiBody}>
              <Text style={styles.kpiValue}>
                {safeMetrics.pendingEvaluations}
              </Text>
              <Text style={styles.kpiLabel}>Pendentes</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.kpiCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("PatientsList")}
          >
            <View
              style={[
                styles.kpiIcon,
                { backgroundColor: lightTheme.colors.info + "22" },
              ]}
            >
              <Ionicons
                name="trending-up"
                size={20}
                color={lightTheme.colors.info}
              />
            </View>
            <View style={styles.kpiBody}>
              <Text style={styles.kpiValue}>
                {safeMetrics.averageAdherence}%
              </Text>
              <Text style={styles.kpiLabel}>Adesão</Text>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tendência de adesão</Text>
        <View style={styles.sparkCard}>
          <View style={styles.sparkLeft}>
            <Text style={styles.sparkMain}>
              {safeMetrics.averageAdherence}%
            </Text>
            <Text style={styles.sparkSub}>Média últimos 30 dias</Text>
          </View>
          <View style={styles.sparkRight}>
            <Svg width={140} height={56}>
              {/* background subtle */}
              <Rect
                x={0}
                y={0}
                width={140}
                height={56}
                fill={lightTheme.colors.white}
                rx={10}
              />
              <Path
                d={makeSparkPath(sparkData, 120, 40)}
                stroke={lightTheme.colors.primary}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
              />
            </Svg>
          </View>
        </View>
      </View>

      {safeMetrics.upcomingBirthdays && (
        <>
          {safeMetrics.upcomingBirthdays.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Aniversariantes</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("PatientsList")}
                >
                  <Text style={styles.seeAll}>Ver todos</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={safeMetrics.upcomingBirthdays}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(it: any) => it.id}
                contentContainerStyle={{ paddingHorizontal: 12 }}
                renderItem={({ item }: { item: any }) => (
                  <TouchableOpacity
                    style={styles.birthdayCardLarge}
                    onPress={() =>
                      navigation.navigate("PatientDetails", {
                        patientId: item.id,
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <View style={styles.birthdayAvatarLarge}>
                      <Ionicons
                        name="person"
                        size={26}
                        color={lightTheme.colors.white}
                      />
                    </View>
                    <Text style={styles.birthdayName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.birthdayDate}>
                      {formatBirthday(item.birthDate)}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Aniversariantes</Text>
              <View style={[styles.card, styles.emptyCard]}>
                <Text
                  style={{ color: lightTheme.colors.gray[600], lineHeight: 20 }}
                >
                  Nenhum aniversariante próximo. Tudo sob controle ✨
                </Text>
              </View>
            </View>
          )}
        </>
      )}

      {safeMetrics.recentActivities && (
        <>
          {safeMetrics.recentActivities.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Atividades Recentes</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("PatientsList")}
                >
                  <Text style={styles.seeAll}>Ver tudo</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.card}>
                {safeMetrics.recentActivities
                  .slice(0, 6)
                  .map((a: any, idx: number) => (
                    <TouchableOpacity
                      key={a.id}
                      style={[
                        styles.activityRow,
                        idx !== safeMetrics.recentActivities.length - 1 &&
                          styles.itemBorder,
                      ]}
                      onPress={() =>
                        navigation.navigate("PatientDetails", {
                          patientId: a.id,
                        })
                      }
                    >
                      <View
                        style={[
                          styles.activityIcon,
                          { backgroundColor: lightTheme.colors.gray[100] },
                        ]}
                      >
                        <Ionicons
                          name="time"
                          size={16}
                          color={lightTheme.colors.gray[600]}
                        />
                      </View>
                      <View style={styles.activityMeta}>
                        <Text style={styles.activityTitle}>
                          {a.patientName}
                        </Text>
                        <Text style={styles.activityDesc} numberOfLines={1}>
                          {a.description}
                        </Text>
                      </View>
                      <Text style={styles.activityTimeSmall}>
                        {format(new Date(a.date), "dd/MM")}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Atividades Recentes</Text>
              <View style={[styles.card, styles.emptyCard]}>
                <Text
                  style={{ color: lightTheme.colors.gray[600], lineHeight: 20 }}
                >
                  Sem atividades recentes. Verifique as avaliações ou cadastros.
                </Text>
              </View>
            </View>
          )}
        </>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: lightTheme.colors.background },
  header: {
    paddingHorizontal: lightTheme.spacing.lg,
    paddingTop: lightTheme.spacing.xl + 8,
    paddingBottom: lightTheme.spacing.lg,
    borderBottomLeftRadius: lightTheme.borderRadius.xl,
    borderBottomRightRadius: lightTheme.borderRadius.xl,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerGreeting: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
  },
  headerSubtitle: {
    color: lightTheme.colors.white,
    opacity: 0.95,
    marginTop: 4,
  },
  headerButton: {
    backgroundColor: `${lightTheme.colors.white}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: lightTheme.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
  },
  headerButtonText: { color: lightTheme.colors.white, marginLeft: 8 },
  kpiRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: 6,
  },
  kpiCard: {
    width: 76,
    height: 140,
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginRight: 12,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    ...lightTheme.shadows.sm,
  },
  kpiIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  kpiBody: { alignItems: "center" },
  kpiValue: {
    fontSize: 16,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[800],
    textAlign: "center",
  },
  kpiLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
    marginTop: 4,
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
  seeAll: {
    color: lightTheme.colors.primary,
    fontSize: lightTheme.typography.fontSize.sm,
  },
  sparkCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...lightTheme.shadows.sm,
  },
  sparkLeft: { flex: 1 },
  sparkMain: {
    fontSize: 28,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[800],
  },
  sparkSub: { color: lightTheme.colors.gray[500], marginTop: 4 },
  sparkRight: { width: 140, alignItems: "center" },
  sparkBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 48,
    gap: 6,
  },
  sparkBar: {
    width: 8,
    backgroundColor: lightTheme.colors.primary,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  birthdayCardLarge: {
    width: 140,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: lightTheme.colors.white,
    borderRadius: 16,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    ...lightTheme.shadows.md,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[100],
  },
  birthdayAvatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: lightTheme.colors.primary,
    marginBottom: 12,
  },
  birthdayName: {
    fontSize: 14,
    fontWeight: "600" as any,
    color: lightTheme.colors.gray[900],
    textAlign: "center",
    marginBottom: 4,
    lineHeight: 18,
  },
  birthdayDate: {
    fontSize: 13,
    fontWeight: "500" as any,
    color: lightTheme.colors.primary,
    textAlign: "center",
    lineHeight: 16,
  },
  card: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    ...lightTheme.shadows.sm,
    overflow: "hidden",
    padding: 8,
  },
  emptyCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: lightTheme.borderRadius.lg,
    minHeight: 56,
    justifyContent: "center",
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: lightTheme.spacing.lg,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: lightTheme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: lightTheme.spacing.md,
  },
  activityMeta: { flex: 1 },
  activityTitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[800],
    marginBottom: 4,
  },
  activityDesc: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
  },
  activityTimeSmall: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[400],
    marginLeft: lightTheme.spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: lightTheme.colors.background,
    padding: lightTheme.spacing.xl,
  },
  loadingText: {
    marginTop: lightTheme.spacing.lg,
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: lightTheme.colors.background,
    padding: lightTheme.spacing.xl,
  },
  errorText: {
    marginTop: lightTheme.spacing.lg,
    marginBottom: lightTheme.spacing.xl,
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: lightTheme.colors.primary,
    paddingHorizontal: lightTheme.spacing.xl,
    paddingVertical: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.lg,
  },
  retryButtonText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
  },
});
