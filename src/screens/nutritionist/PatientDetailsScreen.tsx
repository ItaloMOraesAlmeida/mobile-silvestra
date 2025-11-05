import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { lightTheme } from "../../theme";
import { usePatients } from "../../hooks/usePatients";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PatientDetailsScreenProps {
  route: {
    params: {
      patientId: string;
    };
  };
  navigation: any;
}

export function PatientDetailsScreen({
  route,
  navigation,
}: PatientDetailsScreenProps) {
  const { patientId } = route.params;
  const { getPatientById, loading, error } = usePatients();
  const [patient, setPatient] = useState<any>(null);
  const layout = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "overview", title: "Visão Geral" },
    { key: "assessments", title: "Avaliações" },
    { key: "plans", title: "Planos" },
    { key: "workouts", title: "Treinos" },
  ]);

  useEffect(() => {
    loadPatientDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const loadPatientDetails = async () => {
    try {
      const data = await getPatientById(patientId);
      setPatient(data);
    } catch (err) {
      console.error("Erro ao carregar detalhes do paciente:", err);
    }
  };

  // Tab: Visão Geral
  const OverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Métricas Principais */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Métricas</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View
              style={[
                styles.metricIcon,
                { backgroundColor: lightTheme.colors.primaryBackground },
              ]}
            >
              <Ionicons
                name="calendar"
                size={20}
                color={lightTheme.colors.primary}
              />
            </View>
            <Text style={styles.metricValue}>
              {patient?.metrics?.totalAppointments || 0}
            </Text>
            <Text style={styles.metricLabel}>Consultas</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: "#10b98120" }]}>
              <Ionicons
                name="restaurant"
                size={20}
                color={lightTheme.colors.success}
              />
            </View>
            <Text style={styles.metricValue}>
              {patient?.metrics?.totalMealPlans || 0}
            </Text>
            <Text style={styles.metricLabel}>Planos</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: "#0ea5e920" }]}>
              <Ionicons
                name="clipboard"
                size={20}
                color={lightTheme.colors.info}
              />
            </View>
            <Text style={styles.metricValue}>
              {patient?.metrics?.totalEvaluations || 0}
            </Text>
            <Text style={styles.metricLabel}>Avaliações</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: "#f59e0b20" }]}>
              <Ionicons
                name="trending-up"
                size={20}
                color={lightTheme.colors.warning}
              />
            </View>
            <Text style={styles.metricValue}>
              {patient?.metrics?.averageAdherence
                ? `${patient.metrics.averageAdherence}%`
                : "-"}
            </Text>
            <Text style={styles.metricLabel}>Adesão</Text>
          </View>
        </View>
      </View>

      {/* Informações Pessoais */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações Pessoais</Text>
        <View style={styles.infoCard}>
          <InfoItem
            icon="mail"
            label="E-mail"
            value={patient?.patient?.email || "-"}
          />
          <InfoItem
            icon="call"
            label="Telefone"
            value={patient?.patient?.phone || "-"}
          />
          <InfoItem
            icon="calendar"
            label="Data de Nascimento"
            value={
              patient?.patient?.birthDate
                ? format(new Date(patient.patient.birthDate), "dd/MM/yyyy", {
                    locale: ptBR,
                  })
                : "-"
            }
          />
          <InfoItem
            icon="person"
            label="Gênero"
            value={patient?.patient?.gender || "-"}
          />
        </View>
      </View>

      {/* Última Avaliação */}
      {patient?.lastEvaluationDate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Última Avaliação</Text>
          <View style={styles.infoCard}>
            <View style={styles.lastEvaluationItem}>
              <Ionicons
                name="clipboard-outline"
                size={24}
                color={lightTheme.colors.primary}
              />
              <View style={styles.lastEvaluationContent}>
                <Text style={styles.lastEvaluationText}>
                  {formatDistanceToNow(new Date(patient.lastEvaluationDate), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </Text>
                <Text style={styles.lastEvaluationDate}>
                  {format(
                    new Date(patient.lastEvaluationDate),
                    "dd 'de' MMMM 'de' yyyy",
                    { locale: ptBR }
                  )}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Notas */}
      {patient?.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas</Text>
          <View style={styles.notesCard}>
            <Text style={styles.notesText}>{patient.notes}</Text>
          </View>
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );

  // Tab: Avaliações (Placeholder)
  const AssessmentsTab = () => (
    <View style={styles.placeholderContainer}>
      <Ionicons
        name="clipboard-outline"
        size={64}
        color={lightTheme.colors.gray[300]}
      />
      <Text style={styles.placeholderTitle}>Avaliações</Text>
      <Text style={styles.placeholderText}>
        Este recurso será implementado no Módulo 3
      </Text>
      <Text style={styles.placeholderSubtext}>
        Aqui você verá o histórico completo de avaliações antropométricas do
        paciente.
      </Text>
    </View>
  );

  // Tab: Planos (Placeholder)
  const PlansTab = () => (
    <View style={styles.placeholderContainer}>
      <Ionicons
        name="restaurant-outline"
        size={64}
        color={lightTheme.colors.gray[300]}
      />
      <Text style={styles.placeholderTitle}>Planos Alimentares</Text>
      <Text style={styles.placeholderText}>
        Este recurso será implementado no Módulo 5
      </Text>
      <Text style={styles.placeholderSubtext}>
        Aqui você verá todos os planos alimentares criados para este paciente.
      </Text>
    </View>
  );

  // Tab: Treinos (Placeholder)
  const WorkoutsTab = () => (
    <View style={styles.placeholderContainer}>
      <Ionicons
        name="barbell-outline"
        size={64}
        color={lightTheme.colors.gray[300]}
      />
      <Text style={styles.placeholderTitle}>Treinos</Text>
      <Text style={styles.placeholderText}>
        Este recurso será implementado no Módulo 6
      </Text>
      <Text style={styles.placeholderSubtext}>
        Aqui você verá o histórico de treinos e progressão de cargas do
        paciente.
      </Text>
    </View>
  );

  const renderScene = SceneMap({
    overview: OverviewTab,
    assessments: AssessmentsTab,
    plans: PlansTab,
    workouts: WorkoutsTab,
  });

  // Loading
  if (loading && !patient) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={lightTheme.colors.primary} />
        <Text style={styles.loadingText}>Carregando detalhes...</Text>
      </View>
    );
  }

  // Error
  if (error && !patient) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons
          name="alert-circle"
          size={64}
          color={lightTheme.colors.error}
        />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadPatientDetails}
        >
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Avatar e Info */}
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            {patient.patient.avatarUrl ? (
              <Image
                source={{ uri: patient.patient.avatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {patient.patient.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.patientName}>{patient.patient.name}</Text>
            <View style={styles.headerDetails}>
              {patient.patient.age && (
                <View style={styles.headerDetailItem}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={lightTheme.colors.gray[600]}
                  />
                  <Text style={styles.headerDetailText}>
                    {patient.patient.age} anos
                  </Text>
                </View>
              )}
              <View style={styles.headerDetailItem}>
                <Ionicons
                  name={
                    patient.status === "ACTIVE"
                      ? "checkmark-circle"
                      : "pause-circle"
                  }
                  size={14}
                  color={
                    patient.status === "ACTIVE"
                      ? lightTheme.colors.success
                      : lightTheme.colors.gray[400]
                  }
                />
                <Text
                  style={[
                    styles.headerDetailText,
                    {
                      color:
                        patient.status === "ACTIVE"
                          ? lightTheme.colors.success
                          : lightTheme.colors.gray[600],
                    },
                  ]}
                >
                  {patient.status === "ACTIVE" ? "Ativo" : "Inativo"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate("PatientProgress", { patientId })
            }
          >
            <Ionicons
              name="analytics-outline"
              size={20}
              color={lightTheme.colors.white}
            />
            <Text style={styles.actionButtonPrimaryText}>Ver Evolução</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtonsSecondary}>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Ionicons
              name="create-outline"
              size={20}
              color={lightTheme.colors.primary}
            />
            <Text style={styles.actionButtonText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={lightTheme.colors.primary}
            />
            <Text style={styles.actionButtonText}>Agendar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color={lightTheme.colors.primary}
            />
            <Text style={styles.actionButtonText}>Mensagem</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            indicatorStyle={styles.tabIndicator}
            style={styles.tabBar}
            activeColor={lightTheme.colors.primary}
            inactiveColor={lightTheme.colors.gray[500]}
            scrollEnabled
          />
        )}
      />
    </View>
  );
}

// Componente auxiliar para itens de informação
interface InfoItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <View style={styles.infoItem}>
      <View style={styles.infoIconContainer}>
        <Ionicons name={icon} size={18} color={lightTheme.colors.gray[500]} />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  header: {
    backgroundColor: lightTheme.colors.white,
    paddingTop: lightTheme.spacing.lg,
    paddingHorizontal: lightTheme.spacing.xl,
    paddingBottom: lightTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: lightTheme.spacing.lg,
  },
  avatarContainer: {
    marginRight: lightTheme.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: lightTheme.borderRadius.full,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: lightTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: lightTheme.typography.fontSize["2xl"],
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.white,
  },
  headerInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[800],
    marginBottom: lightTheme.spacing.xs,
  },
  headerDetails: {
    flexDirection: "row",
    gap: lightTheme.spacing.md,
  },
  headerDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.xs - 2,
  },
  headerDetailText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
  },
  actionButtons: {
    marginBottom: lightTheme.spacing.md,
  },
  actionButtonsSecondary: {
    flexDirection: "row",
    gap: lightTheme.spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: lightTheme.spacing.sm,
    backgroundColor: lightTheme.colors.primaryBackground,
    borderRadius: lightTheme.borderRadius.md,
    gap: lightTheme.spacing.xs,
  },
  actionButtonPrimary: {
    backgroundColor: lightTheme.colors.primary,
    paddingVertical: lightTheme.spacing.md,
  },
  actionButtonText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.primary,
  },
  actionButtonPrimaryText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.white,
  },
  tabBar: {
    backgroundColor: lightTheme.colors.white,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  tabIndicator: {
    backgroundColor: lightTheme.colors.primary,
    height: 3,
  },
  tabContent: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[50],
  },
  section: {
    paddingHorizontal: lightTheme.spacing.xl,
    paddingTop: lightTheme.spacing.xl,
  },
  sectionTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[800],
    marginBottom: lightTheme.spacing.md,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: lightTheme.spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: lightTheme.colors.white,
    padding: lightTheme.spacing.lg,
    borderRadius: lightTheme.borderRadius.lg,
    alignItems: "center",
    ...lightTheme.shadows.sm,
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: lightTheme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: lightTheme.spacing.sm,
  },
  metricValue: {
    fontSize: lightTheme.typography.fontSize["2xl"],
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[800],
    marginBottom: lightTheme.spacing.xs - 2,
  },
  metricLabel: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
  },
  infoCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.lg,
    ...lightTheme.shadows.sm,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: lightTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: lightTheme.borderRadius.md,
    backgroundColor: lightTheme.colors.gray[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: lightTheme.spacing.md,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginBottom: lightTheme.spacing.xs - 2,
  },
  infoValue: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[800],
  },
  lastEvaluationItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  lastEvaluationContent: {
    marginLeft: lightTheme.spacing.md,
    flex: 1,
  },
  lastEvaluationText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[800],
    marginBottom: lightTheme.spacing.xs - 2,
  },
  lastEvaluationDate: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
  },
  notesCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.lg,
    ...lightTheme.shadows.sm,
  },
  notesText: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[700],
    lineHeight: 22,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: lightTheme.spacing.xl,
    backgroundColor: lightTheme.colors.gray[50],
  },
  placeholderTitle: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[700],
    marginTop: lightTheme.spacing.lg,
    marginBottom: lightTheme.spacing.sm,
  },
  placeholderText: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
    marginBottom: lightTheme.spacing.xs,
  },
  placeholderSubtext: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[400],
    textAlign: "center",
  },
  bottomSpacer: {
    height: lightTheme.spacing["2xl"],
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
