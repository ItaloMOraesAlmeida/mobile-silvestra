import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { getTodaySummary } from "../../services/water/waterService";
import {
  createWaterLogOffline,
  getTodaySummaryOffline,
} from "../../services/water/offlineService";
import { TodaySummary } from "../../types/water";
import { lightTheme } from "../../theme";
import { useWaterReminders } from "../../hooks/water";
import { WaterProgressRing } from "../../components/water";

export default function WaterDashboardScreen() {
  const navigation = useNavigation();

  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingWater, setAddingWater] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const celebrationAnim = React.useRef(new Animated.Value(0)).current;

  const loadSummary = useCallback(async () => {
    try {
      const data = await getTodaySummary();
      const offlineData = await getTodaySummaryOffline(data);
      setSummary(offlineData);
    } catch (error) {
      console.error("Erro ao carregar resumo:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Hook de lembretes com callback para atualizar quando Quick Action é usada
  useWaterReminders(loadSummary);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleAddWater = async (amount: number) => {
    if (addingWater || !summary) return;

    setAddingWater(true);
    try {
      await createWaterLogOffline(amount);
      await loadSummary();

      const newPercent = ((summary.consumed + amount) / summary.goal) * 100;
      if (newPercent >= 100 && summary.percent < 100) {
        triggerCelebration();
      }
    } catch (error) {
      console.error("Erro ao adicionar água:", error);
    } finally {
      setAddingWater(false);
    }
  };

  const triggerCelebration = () => {
    setShowCelebration(true);
    Animated.sequence([
      Animated.spring(celebrationAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }),
      Animated.timing(celebrationAnim, {
        toValue: 0,
        duration: 300,
        delay: 2000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowCelebration(false);
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSummary();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={lightTheme.colors.primary} />
      </View>
    );
  }

  if (!summary) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons
          name="water-outline"
          size={64}
          color={lightTheme.colors.gray[300]}
        />
        <Text style={styles.errorText}>Erro ao carregar dados</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            loadSummary();
          }}
        >
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const quickAmounts = [100, 200, 250, 500];
  const percentComplete = Math.min(summary.percent, 100);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Card */}
        <LinearGradient
          colors={[lightTheme.colors.primary, lightTheme.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerGreeting}>Hidratação</Text>
              <Text style={styles.headerDate}>
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("WaterSettings" as never)}
              style={styles.settingsButton}
            >
              <Ionicons name="settings-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Progress Ring */}
          <View style={styles.progressContainer}>
            <WaterProgressRing
              consumed={summary.consumed}
              goal={summary.goal}
              size={180}
            />
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="water" size={24} color="#FFF" opacity={0.9} />
              <Text style={styles.statValue}>{summary.consumed}ml</Text>
              <Text style={styles.statLabel}>Consumido</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="flag" size={24} color="#FFF" opacity={0.9} />
              <Text style={styles.statValue}>{summary.goal}ml</Text>
              <Text style={styles.statLabel}>Meta</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons
                name="trending-up"
                size={24}
                color="#FFF"
                opacity={0.9}
              />
              <Text style={styles.statValue}>
                {summary.goalAchieved ? "100" : Math.round(percentComplete)}%
              </Text>
              <Text style={styles.statLabel}>Progresso</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Goal Status Banner */}
        {summary.goalAchieved ? (
          <View style={styles.achievementBanner}>
            <View style={styles.achievementContent}>
              <View style={styles.achievementIcon}>
                <Ionicons
                  name="trophy"
                  size={24}
                  color={lightTheme.colors.warning}
                />
              </View>
              <View style={styles.achievementText}>
                <Text style={styles.achievementTitle}>Meta Alcançada!</Text>
                <Text style={styles.achievementSubtitle}>
                  Parabéns! Você atingiu sua meta de hoje 🎉
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.remainingBanner}>
            <Ionicons
              name="information-circle"
              size={20}
              color={lightTheme.colors.primary}
            />
            <Text style={styles.remainingText}>
              Faltam{" "}
              <Text style={styles.remainingValue}>{summary.remaining}ml</Text>{" "}
              para atingir sua meta diária
            </Text>
          </View>
        )}

        {/* Quick Add Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Adicionar Rápido</Text>
            <Text style={styles.sectionSubtitle}>Toque para registrar</Text>
          </View>
          <View style={styles.quickGrid}>
            {quickAmounts.map((amount, index) => (
              <TouchableOpacity
                key={amount}
                onPress={() => handleAddWater(amount)}
                disabled={addingWater}
                style={[
                  styles.quickButton,
                  addingWater && styles.quickButtonDisabled,
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.quickButtonIcon}>
                  <Ionicons
                    name="water"
                    size={20}
                    color={lightTheme.colors.primary}
                  />
                </View>
                <Text style={styles.quickButtonAmount}>+{amount}</Text>
                <Text style={styles.quickButtonLabel}>ml</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Logs */}
        {summary.logs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Registros de Hoje</Text>
              <Text style={styles.sectionSubtitle}>
                {summary.logs.length}{" "}
                {summary.logs.length === 1 ? "registro" : "registros"}
              </Text>
            </View>
            <View style={styles.logsContainer}>
              {summary.logs.slice(0, 5).map((log, index) => (
                <View key={log.id} style={styles.logItem}>
                  <View style={styles.logIconContainer}>
                    <Ionicons
                      name="water"
                      size={16}
                      color={lightTheme.colors.primary}
                    />
                  </View>
                  <View style={styles.logInfo}>
                    <Text style={styles.logAmount}>{log.amount}ml</Text>
                    <Text style={styles.logTime}>
                      {format(new Date(log.time), "HH:mm")}
                    </Text>
                  </View>
                  <View style={styles.logBadge}>
                    <Text style={styles.logBadgeText}>
                      #{summary.logs.length - index}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() => navigation.navigate("WaterHistory" as never)}
            style={styles.actionButton}
          >
            <Ionicons
              name="bar-chart"
              size={20}
              color={lightTheme.colors.primary}
            />
            <Text style={styles.actionButtonText}>Ver Histórico</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={lightTheme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Celebration Overlay */}
      {showCelebration && (
        <Animated.View
          style={[
            styles.celebrationOverlay,
            {
              opacity: celebrationAnim,
              transform: [
                {
                  scale: celebrationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.celebrationCard}>
            <View style={styles.celebrationIconContainer}>
              <Ionicons
                name="trophy"
                size={64}
                color={lightTheme.colors.warning}
              />
            </View>
            <Text style={styles.celebrationTitle}>Meta Alcançada!</Text>
            <Text style={styles.celebrationMessage}>
              Parabéns! Você atingiu sua meta de hidratação hoje! 🎉
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: lightTheme.colors.textSecondary,
    marginTop: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: lightTheme.colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  headerCard: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  headerGreeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 14,
    color: "#FFF",
    opacity: 0.9,
    textTransform: "capitalize",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    alignItems: "center",
    marginVertical: 24,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#FFF",
    opacity: 0.8,
  },
  achievementBanner: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: lightTheme.colors.card,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: lightTheme.colors.warning,
    ...lightTheme.shadows.sm,
  },
  achievementContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${lightTheme.colors.warning}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: lightTheme.colors.text,
    marginBottom: 2,
  },
  achievementSubtitle: {
    fontSize: 14,
    color: lightTheme.colors.textSecondary,
  },
  remainingBanner: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: `${lightTheme.colors.primary}10`,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  remainingText: {
    flex: 1,
    fontSize: 14,
    color: lightTheme.colors.text,
    lineHeight: 20,
  },
  remainingValue: {
    fontWeight: "bold",
    color: lightTheme.colors.primary,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: lightTheme.colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: lightTheme.colors.textSecondary,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickButton: {
    width: (Dimensions.get("window").width - 52) / 2,
    backgroundColor: lightTheme.colors.card,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
  },
  quickButtonDisabled: {
    opacity: 0.5,
  },
  quickButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${lightTheme.colors.primary}10`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickButtonAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: lightTheme.colors.text,
  },
  quickButtonLabel: {
    fontSize: 12,
    color: lightTheme.colors.textSecondary,
    marginTop: 2,
  },
  logsContainer: {
    gap: 8,
  },
  logItem: {
    backgroundColor: lightTheme.colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
  },
  logIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${lightTheme.colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  logInfo: {
    flex: 1,
  },
  logAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.text,
    marginBottom: 2,
  },
  logTime: {
    fontSize: 13,
    color: lightTheme.colors.textSecondary,
  },
  logBadge: {
    backgroundColor: lightTheme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  logBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: lightTheme.colors.textSecondary,
  },
  actionButtons: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  actionButton: {
    backgroundColor: lightTheme.colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.text,
  },
  bottomSpacing: {
    height: 32,
  },
  celebrationOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  celebrationCard: {
    backgroundColor: lightTheme.colors.card,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    maxWidth: 320,
    ...lightTheme.shadows.lg,
  },
  celebrationIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${lightTheme.colors.warning}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: lightTheme.colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  celebrationMessage: {
    fontSize: 16,
    color: lightTheme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
});
