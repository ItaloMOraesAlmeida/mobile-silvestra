import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";
import { useAuthStore } from "../../stores/auth.store";
import { usePatients } from "../../hooks/usePatients";
import Svg, { Path, Rect } from "react-native-svg";

export function PatientDashboardScreen({ navigation }: { navigation: any }) {
  const user = useAuthStore((s) => s.user);
  const name = user?.name || "";
  const patientId = user?.patientProfile?.id;

  const { getPatientDashboard } = usePatients();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [patientData, setPatientData] = React.useState<any | null>(null);

  const fetchDashboard = React.useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);

    try {
      const res: any = await getPatientDashboard(patientId);
      const payload = res?.data || res;
      setPatientData(payload);
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar dados do paciente");
    } finally {
      setLoading(false);
    }
  }, [patientId, getPatientDashboard]);

  React.useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

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

  if (!patientId) {
    return (
      <View style={styles.container}>
        <Text style={{ padding: 24, color: lightTheme.colors.gray[600] }}>
          Perfil de paciente não encontrado. Verifique sua conta ou entre em
          contato com suporte.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[lightTheme.colors.primary, lightTheme.colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerInner}>
          <View>
            <Text style={styles.greeting}>
              Olá{name ? `, ${name.split(" ")[0]}` : ""}
            </Text>
            <Text style={styles.subtitle}>Bem-vindo ao seu resumo</Text>
          </View>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate("Profile")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="person-circle"
              size={28}
              color={lightTheme.colors.white}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {error && (
        <View style={styles.section}>
          <Text style={{ color: lightTheme.colors.error }}>{error}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plano alimentar</Text>
        <View style={styles.card}>
          {loading ? (
            <ActivityIndicator color={lightTheme.colors.primary} />
          ) : (
            <>
              <Text style={styles.cardTitle}>
                {patientData?.patient?.metrics?.lastUpdated
                  ? "Hoje"
                  : "Sem plano"}
              </Text>
              <Text style={styles.cardText}>
                {patientData?.patient?.metrics?.mealPlanSummary ||
                  "Nenhum plano disponível"}
              </Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Próxima consulta</Text>
        <View style={styles.card}>
          {loading ? (
            <ActivityIndicator color={lightTheme.colors.primary} />
          ) : (
            <>
              <Text style={styles.cardTitle}>
                {patientData?.nextAppointment?.date
                  ? new Date(patientData.nextAppointment.date).toLocaleString()
                  : "Nenhuma consulta agendada"}
              </Text>
              <Text style={styles.cardText}>
                {patientData?.nextAppointment?.location || ""}
              </Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Adesão</Text>
        <View style={styles.cardRow}>
          <View style={styles.smallCard}>
            <Text style={styles.largeNumber}>
              {patientData?.charts?.adherenceTrend?.slice(-1)[0] ?? "--"}
            </Text>
            <Text style={styles.smallLabel}>Última</Text>
          </View>
          <View style={styles.smallCard}>
            <Text style={styles.largeNumber}>
              {patientData?.patient?.metrics?.averageAdherence ?? "--"}
            </Text>
            <Text style={styles.smallLabel}>Média 30 dias</Text>
          </View>
        </View>

        {/* Sparkline */}
        {patientData?.charts?.adherenceTrend && (
          <View
            style={{
              paddingHorizontal: lightTheme.spacing.xl,
              marginTop: lightTheme.spacing.md,
            }}
          >
            <Svg width={280} height={60}>
              <Rect
                x={0}
                y={0}
                width={280}
                height={60}
                fill={lightTheme.colors.white}
                rx={10}
              />
              <Path
                d={makeSparkPath(patientData.charts.adherenceTrend, 260, 40)}
                stroke={lightTheme.colors.primary}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
              />
            </Svg>
          </View>
        )}
      </View>

      <View style={{ height: 48 }} />
    </View>
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
  headerInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
  },
  subtitle: { color: lightTheme.colors.white, opacity: 0.9, marginTop: 4 },
  quickAction: {
    backgroundColor: `${lightTheme.colors.white}10`,
    padding: 8,
    borderRadius: lightTheme.borderRadius.md,
  },
  section: {
    paddingHorizontal: lightTheme.spacing.xl,
    marginTop: lightTheme.spacing.xl,
  },
  sectionTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[800],
    marginBottom: lightTheme.spacing.md,
  },
  card: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.lg,
    ...lightTheme.shadows.sm,
  },
  cardTitle: {
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    marginBottom: 6,
  },
  cardText: { color: lightTheme.colors.gray[600] },
  cardRow: { flexDirection: "row", gap: 12 },
  smallCard: {
    flex: 1,
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.md,
    padding: lightTheme.spacing.lg,
    alignItems: "center",
    ...lightTheme.shadows.sm,
  },
  largeNumber: {
    fontSize: 22,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
  },
  smallLabel: { color: lightTheme.colors.gray[600], marginTop: 4 },
});
