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
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { lightTheme } from "../../theme";
import { usePatients } from "../../hooks/usePatients";
import {
  useBodyMeasurements,
  BodyMeasurement,
} from "../../hooks/useBodyMeasurements";
import { useMealPlans, MealPlan } from "../../hooks/useMealPlans";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PatientDetailsScreenProps {
  route: {
    params: {
      patientId: string;
      initialTab?: "overview" | "assessments" | "plans" | "workouts";
      shouldReload?: boolean;
    };
  };
  navigation: any;
}

// Funções auxiliares para converter valores do banco para português
const formatGender = (gender: string | null | undefined): string => {
  if (!gender || gender === null || gender === undefined) return "-";

  const genderMap: Record<string, string> = {
    MALE: "Masculino",
    FEMALE: "Feminino",
    OTHER: "Outro",
    PREFER_NOT_TO_SAY: "Prefiro não informar",
  };

  return String(genderMap[gender] || gender || "-");
};

const formatBiologicalSex = (
  biologicalSex: string | null | undefined
): string => {
  if (!biologicalSex || biologicalSex === null || biologicalSex === undefined)
    return "-";

  const sexMap: Record<string, string> = {
    MALE: "Masculino",
    FEMALE: "Feminino",
  };

  return String(sexMap[biologicalSex] || biologicalSex || "-");
};

export function PatientDetailsScreen({
  route,
  navigation,
}: PatientDetailsScreenProps) {
  const patientId = route?.params?.patientId;
  const initialTab = route?.params?.initialTab;
  const shouldReload = route?.params?.shouldReload;
  const { getPatientById, loading, error } = usePatients();
  const { listMeasurements, loading: loadingMeasurements } =
    useBodyMeasurements();
  const { listMealPlans, loading: loadingPlans } = useMealPlans();
  const [patient, setPatient] = useState<any>(null);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const layout = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "overview", title: "Visão Geral" },
    { key: "assessments", title: "Avaliações" },
    { key: "plans", title: "Planos Alimentares" },
    { key: "workouts", title: "Treinos" },
  ]);

  // Definir tab inicial se fornecida
  useEffect(() => {
    if (initialTab) {
      const tabIndex = routes.findIndex((r) => r.key === initialTab);
      if (tabIndex !== -1) {
        setIndex(tabIndex);
      }
    }
  }, [initialTab, routes]);

  useEffect(() => {
    if (patientId) {
      loadPatientDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // Carregar avaliações e planos após carregar dados do paciente
  useEffect(() => {
    if (patient) {
      loadMeasurements();
      loadMealPlans();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient]);

  // Recarregar dados quando shouldReload for true
  useEffect(() => {
    if (shouldReload) {
      // Forçar reload mesmo se patient ainda não estiver carregado
      if (patient) {
        loadMeasurements();
        loadMealPlans();
      } else {
        loadPatientDetails();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldReload]);

  const loadPatientDetails = async () => {
    try {
      const response: any = await getPatientById(patientId);
      // A API retorna { success: true, data: {...} }
      const patientData = response.data || response;

      setPatient(patientData);
    } catch (err) {
      console.error("Erro ao carregar detalhes do paciente:", err);
    }
  };

  const loadMeasurements = async () => {
    try {
      // Verificar se o paciente já confirmou o acesso antes de buscar avaliações
      if (!patient?.patient?.hasConfirmedAccess) {
        console.log("⚠️ Paciente não confirmou acesso, measurements vazios");
        setMeasurements([]);
        return;
      }

      const result = await listMeasurements(patientId, {
        sortOrder: "desc",
        limit: 50,
      });

      if (result) {
        setMeasurements(result.measurements);
      }
    } catch (err) {
      console.error("Erro ao carregar avaliações:", err);
      // Se der erro de autorização, assume que o paciente não confirmou acesso
      setMeasurements([]);
    }
  };

  const loadMealPlans = async () => {
    try {
      // Verificar se o paciente já confirmou o acesso
      if (!patient?.patient?.hasConfirmedAccess) {
        setMealPlans([]);
        return;
      }

      const result = await listMealPlans(patientId);
      if (result) {
        setMealPlans(result);
      }
    } catch (err) {
      console.error("Erro ao carregar planos alimentares:", err);
      setMealPlans([]);
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
                { backgroundColor: lightTheme.colors.primary + "20" },
              ]}
            >
              <Ionicons
                name="calendar"
                size={20}
                color={lightTheme.colors.primary}
              />
            </View>
            <Text style={styles.metricValue}>
              {String(patient?.metrics?.totalAppointments || 0)}
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
              {String(patient?.metrics?.totalMealPlans || 0)}
            </Text>
            <Text style={styles.metricLabel}>Planos Alimentares</Text>
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
              {String(patient?.metrics?.totalEvaluations || 0)}
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
            value={String(patient?.patient?.email || "-")}
          />
          <InfoItem
            icon="call"
            label="Telefone"
            value={String(patient?.patient?.phone || "-")}
          />
          <InfoItem
            icon="card"
            label="CPF"
            value={String(patient?.patient?.cpf || "-")}
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
            value={formatGender(patient?.patient?.gender)}
          />
          <InfoItem
            icon="body"
            label="Sexo Biológico"
            value={formatBiologicalSex(patient?.patient?.biologicalSex)}
          />
        </View>
      </View>

      {/* Última Avaliação */}
      {measurements.length > 0 && measurements[0]?.id && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Última Avaliação</Text>
            <Text style={styles.sectionSubtitle}>
              {formatDistanceToNow(new Date(measurements[0].createdAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </Text>
          </View>
          <View style={styles.lastAssessmentCard}>
            <View style={styles.lastAssessmentHeader}>
              <View style={styles.lastAssessmentHeaderLeft}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={lightTheme.colors.primary}
                />
                <Text style={styles.lastAssessmentDate}>
                  {format(
                    new Date(measurements[0].createdAt),
                    "dd 'de' MMMM 'de' yyyy",
                    { locale: ptBR }
                  )}
                </Text>
              </View>
              {measurements[0].protocol && (
                <View style={styles.protocolBadge}>
                  <Text style={styles.protocolBadgeText}>
                    {measurements[0].protocol.replace(/_/g, " ")}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.lastAssessmentMetrics}>
              <View style={styles.assessmentMetricItem}>
                <Text style={styles.assessmentMetricLabel}>Peso</Text>
                <Text style={styles.assessmentMetricValue}>
                  {measurements[0].weight.toFixed(1)} kg
                </Text>
              </View>
              <View style={styles.assessmentMetricItem}>
                <Text style={styles.assessmentMetricLabel}>Altura</Text>
                <Text style={styles.assessmentMetricValue}>
                  {measurements[0].height.toFixed(0)} cm
                </Text>
              </View>
              <View style={styles.assessmentMetricItem}>
                <Text style={styles.assessmentMetricLabel}>IMC</Text>
                <Text style={styles.assessmentMetricValue}>
                  {measurements[0].bmi ? measurements[0].bmi.toFixed(1) : "-"}
                </Text>
              </View>
              {measurements[0].bodyFatPercent && (
                <View style={styles.assessmentMetricItem}>
                  <Text style={styles.assessmentMetricLabel}>% Gordura</Text>
                  <Text style={styles.assessmentMetricValue}>
                    {measurements[0].bodyFatPercent.toFixed(1)}%
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() => {
                const assessmentId = measurements[0]?.id;

                if (!assessmentId) {
                  console.error("❌ assessmentId não encontrado!");
                  return;
                }

                navigation.navigate("PatientAssessmentDetails", {
                  measurementId: assessmentId, // ✅ Corrigido: usar measurementId
                  patientId: patientId,
                });
              }}
            >
              <Text style={styles.viewDetailsButtonText}>Ver Detalhes</Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={lightTheme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Notas */}
      {patient?.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas</Text>
          <View style={styles.notesCard}>
            <Text style={styles.notesText}>{String(patient.notes)}</Text>
          </View>
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );

  // Tab: Avaliações
  const AssessmentsTab = () => {
    // Verifica se o paciente confirmou o acesso
    if (!patient?.patient?.hasConfirmedAccess) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={64}
            color={lightTheme.colors.gray[400]}
          />
          <Text style={styles.emptyStateTitle}>Acesso Pendente</Text>
          <Text style={styles.emptyStateText}>
            O paciente ainda não confirmou o código de acesso. As avaliações só
            estarão disponíveis após a confirmação.
          </Text>
        </View>
      );
    }

    // Loading state
    if (loadingMeasurements) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={lightTheme.colors.primary} />
          <Text style={styles.loadingText}>Carregando avaliações...</Text>
        </View>
      );
    }

    // Empty state
    if (measurements.length === 0) {
      return (
        <ScrollView
          style={styles.tabContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyStateContainer}>
            <Ionicons
              name="clipboard-outline"
              size={64}
              color={lightTheme.colors.gray[400]}
            />
            <Text style={styles.emptyStateTitle}>Nenhuma Avaliação</Text>
            <Text style={styles.emptyStateText}>
              Adicione a primeira avaliação antropométrica do paciente para
              começar a acompanhar sua evolução.
            </Text>
          </View>

          {/* Botão para criar nova avaliação */}
          <View style={styles.actionButtonContainer}>
            <TouchableOpacity
              style={styles.addPlanButton}
              onPress={() => {
                navigation.navigate("PatientAssessmentCreate", {
                  patientId: patientId,
                  patientName: patient?.patient?.name || "Paciente",
                });
              }}
            >
              <Ionicons
                name="add-circle"
                size={20}
                color={lightTheme.colors.white}
              />
              <Text style={styles.addPlanButtonText}>
                Nova Avaliação Antropométrica
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    // Lista de avaliações
    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Botão para criar nova avaliação */}
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity
            style={styles.addPlanButton}
            onPress={() => {
              navigation.navigate("PatientAssessmentCreate", {
                patientId: patientId,
                patientName: patient?.patient?.name || "Paciente",
              });
            }}
          >
            <Ionicons
              name="add-circle"
              size={20}
              color={lightTheme.colors.white}
            />
            <Text style={styles.addPlanButtonText}>
              Nova Avaliação Antropométrica
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Avaliações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Histórico de Avaliações ({measurements.length})
          </Text>

          <View style={styles.assessmentsList}>
            {measurements.map((measurement, index) => (
              <TouchableOpacity
                key={measurement.id}
                style={styles.assessmentCard}
                activeOpacity={0.7}
                onPress={() => {
                  navigation.navigate("PatientAssessmentDetails", {
                    patientId: patientId,
                    measurementId: measurement.id,
                  });
                }}
              >
                <View style={styles.assessmentCardHeader}>
                  <View style={styles.assessmentCardIconContainer}>
                    <Ionicons
                      name="fitness"
                      size={24}
                      color={lightTheme.colors.primary}
                    />
                  </View>
                  <View style={styles.assessmentCardInfo}>
                    <Text style={styles.assessmentCardDate}>
                      {format(
                        new Date(measurement.createdAt),
                        "dd 'de' MMMM 'de' yyyy",
                        { locale: ptBR }
                      )}
                    </Text>
                    <Text style={styles.assessmentCardTime}>
                      {formatDistanceToNow(new Date(measurement.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={lightTheme.colors.gray[400]}
                  />
                </View>

                {/* Badge de Protocolo */}
                {measurement.protocol && (
                  <View style={styles.protocolBadge}>
                    <Ionicons
                      name="analytics"
                      size={14}
                      color={lightTheme.colors.primary}
                    />
                    <Text style={styles.protocolBadgeText}>
                      {(() => {
                        const protocolMap: Record<string, string> = {
                          POLLOCK_7: "Pollock 7 Dobras",
                          POLLOCK_3_MALE: "Pollock 3 (M)",
                          POLLOCK_3_FEMALE: "Pollock 3 (F)",
                          GUEDES_3: "Guedes 3 Dobras",
                          FAULKNER_4: "Faulkner 4 Dobras",
                        };
                        return (
                          protocolMap[measurement.protocol] ||
                          measurement.protocol
                        );
                      })()}
                    </Text>
                  </View>
                )}

                <View style={styles.assessmentCardMetrics}>
                  <View style={styles.assessmentMetric}>
                    <Text style={styles.assessmentMetricLabel}>Peso</Text>
                    <Text style={styles.assessmentMetricValue}>
                      {measurement.weight.toFixed(1)} kg
                    </Text>
                  </View>

                  <View style={styles.assessmentMetric}>
                    <Text style={styles.assessmentMetricLabel}>IMC</Text>
                    <Text style={styles.assessmentMetricValue}>
                      {measurement.bmi?.toFixed(1) || "-"}
                    </Text>
                  </View>

                  {measurement.bodyFatPercent && (
                    <View style={styles.assessmentMetric}>
                      <Text style={styles.assessmentMetricLabel}>
                        % Gordura
                      </Text>
                      <Text style={styles.assessmentMetricValue}>
                        {measurement.bodyFatPercent.toFixed(1)}%
                      </Text>
                    </View>
                  )}
                </View>

                {/* Indicador de progresso (comparação com avaliação anterior) */}
                {index < measurements.length - 1 && (
                  <View style={styles.assessmentProgress}>
                    {(() => {
                      const previousMeasurement = measurements[index + 1];
                      const weightDiff =
                        measurement.weight - previousMeasurement.weight;
                      const isLoss = weightDiff < 0;

                      return (
                        <View style={styles.progressIndicator}>
                          <Ionicons
                            name={isLoss ? "trending-down" : "trending-up"}
                            size={16}
                            color={
                              isLoss
                                ? lightTheme.colors.success
                                : lightTheme.colors.warning
                            }
                          />
                          <Text
                            style={[
                              styles.progressText,
                              {
                                color: isLoss
                                  ? lightTheme.colors.success
                                  : lightTheme.colors.warning,
                              },
                            ]}
                          >
                            {Math.abs(weightDiff).toFixed(1)} kg desde última
                            avaliação
                          </Text>
                        </View>
                      );
                    })()}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    );
  };

  // Tab: Planos
  const PlansTab = () => {
    // Verifica se o paciente confirmou o acesso
    if (!patient?.patient?.hasConfirmedAccess) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={64}
            color={lightTheme.colors.gray[400]}
          />
          <Text style={styles.emptyStateTitle}>Acesso Pendente</Text>
          <Text style={styles.emptyStateText}>
            O paciente ainda não confirmou o código de acesso. Os planos
            alimentares só estarão disponíveis após a confirmação.
          </Text>
        </View>
      );
    }

    // Loading state
    if (loadingPlans) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={lightTheme.colors.primary} />
          <Text style={styles.loadingText}>Carregando planos...</Text>
        </View>
      );
    }

    // Empty state
    if (mealPlans.length === 0) {
      return (
        <ScrollView
          style={styles.tabContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyStateContainer}>
            <Ionicons
              name="restaurant-outline"
              size={64}
              color={lightTheme.colors.gray[400]}
            />
            <Text style={styles.emptyStateTitle}>Nenhum plano criado</Text>
            <Text style={styles.emptyStateText}>
              Ainda não há planos alimentares para este paciente.
            </Text>
          </View>

          {/* Botão para criar novo plano */}
          <View style={styles.actionButtonContainer}>
            <TouchableOpacity
              style={styles.addPlanButton}
              onPress={() => {
                navigation.navigate("CreateMealPlan", {
                  patientId: patientId,
                  patientName: patient?.patient?.name || "Paciente",
                });
              }}
            >
              <Ionicons
                name="add-circle"
                size={20}
                color={lightTheme.colors.white}
              />
              <Text style={styles.addPlanButtonText}>
                Criar Plano Alimentar
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    // Lista de planos
    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Botão para criar novo plano */}
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity
            style={styles.addPlanButton}
            onPress={() => {
              navigation.navigate("CreateMealPlan", {
                patientId: patientId,
                patientName: patient?.patient?.name || "Paciente",
              });
            }}
          >
            <Ionicons
              name="add-circle"
              size={20}
              color={lightTheme.colors.white}
            />
            <Text style={styles.addPlanButtonText}>Novo Plano Alimentar</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Planos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Planos Alimentares ({mealPlans.length})
          </Text>

          {mealPlans.map((plan) => {
            const statusColors = {
              DRAFT: {
                bg: lightTheme.colors.gray[100],
                text: lightTheme.colors.gray[700],
              },
              ACTIVE: {
                bg: lightTheme.colors.success + "20",
                text: lightTheme.colors.success,
              },
              COMPLETED: {
                bg: lightTheme.colors.info + "20",
                text: lightTheme.colors.info,
              },
              ARCHIVED: {
                bg: lightTheme.colors.gray[200],
                text: lightTheme.colors.gray[600],
              },
            };

            const statusLabels = {
              DRAFT: "Rascunho",
              ACTIVE: "Ativo",
              COMPLETED: "Concluído",
              ARCHIVED: "Arquivado",
            };

            const statusStyle = statusColors[plan.status] || statusColors.DRAFT;

            return (
              <TouchableOpacity
                key={plan.id}
                style={styles.planCard}
                onPress={() => {
                  navigation.navigate("MealPlanDetails", {
                    planId: plan.id,
                    patientId: patientId,
                  });
                }}
              >
                <View style={styles.planCardHeader}>
                  <View style={styles.planCardIcon}>
                    <Ionicons
                      name="restaurant"
                      size={24}
                      color={lightTheme.colors.primary}
                    />
                  </View>
                  <View style={styles.planCardInfo}>
                    <Text style={styles.planCardTitle}>{plan.name}</Text>
                    {plan.description && (
                      <Text
                        style={styles.planCardDescription}
                        numberOfLines={2}
                      >
                        {plan.description}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.planStatusBadge,
                      { backgroundColor: statusStyle.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.planStatusText,
                        { color: statusStyle.text },
                      ]}
                    >
                      {statusLabels[plan.status]}
                    </Text>
                  </View>
                </View>

                <View style={styles.planCardFooter}>
                  <View style={styles.planCardMeta}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color={lightTheme.colors.gray[500]}
                    />
                    <Text style={styles.planCardMetaText}>
                      Início:{" "}
                      {format(new Date(plan.startDate), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </Text>
                  </View>
                  {plan.endDate && (
                    <View style={styles.planCardMeta}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={lightTheme.colors.gray[500]}
                      />
                      <Text style={styles.planCardMetaText}>
                        Fim:{" "}
                        {format(new Date(plan.endDate), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </Text>
                    </View>
                  )}
                </View>

                {(plan.totalMeals || plan.totalCalories) && (
                  <View style={styles.planCardStats}>
                    {plan.totalMeals !== undefined && (
                      <View style={styles.planCardStat}>
                        <Ionicons
                          name="fast-food-outline"
                          size={16}
                          color={lightTheme.colors.primary}
                        />
                        <Text style={styles.planCardStatText}>
                          {plan.totalMeals} refeições
                        </Text>
                      </View>
                    )}
                    {plan.totalCalories !== undefined && (
                      <View style={styles.planCardStat}>
                        <Ionicons
                          name="flame-outline"
                          size={16}
                          color={lightTheme.colors.primary}
                        />
                        <Text style={styles.planCardStatText}>
                          {plan.totalCalories.toFixed(0)} kcal/dia
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    );
  };

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

  // Validação de patientId
  if (!patientId) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={lightTheme.colors.error}
        />
        <Text style={styles.errorText}>
          ID do paciente não encontrado. Por favor, retorne e tente novamente.
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Loading
  if (loading && !patient) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={lightTheme.colors.primary} />
        <Text style={styles.loadingText}>Carregando detalhes...</Text>
      </SafeAreaView>
    );
  }

  // Error
  if (error && !patient) {
    return (
      <SafeAreaView style={styles.errorContainer}>
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
      </SafeAreaView>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        {/* Avatar e Info */}
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            {patient.patient?.avatarUrl ? (
              <Image
                source={{ uri: patient.patient.avatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {patient.patient?.name?.charAt(0).toUpperCase() || "P"}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.patientName}>
                {patient.patient?.name || "Paciente"}
              </Text>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setMenuVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="ellipsis-vertical"
                  size={24}
                  color={lightTheme.colors.gray[700]}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.headerDetails}>
              {patient.patient?.age && (
                <View style={styles.headerDetailItem}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={lightTheme.colors.gray[600]}
                  />
                  <Text style={styles.headerDetailText}>
                    {String(patient.patient?.age)} anos
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
            style={styles.actionButtonPrimary}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate("PatientProgress", { patientId })
            }
          >
            <Ionicons
              name="trending-up"
              size={24}
              color={lightTheme.colors.white}
            />
            <Text style={styles.actionButtonPrimaryText}>
              Ver Evolução do Paciente
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dropdown Menu Modal */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setMenuVisible(false)}
          >
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate("PatientEdit", {
                    patientId: patientId,
                    patient: patient,
                  });
                }}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={lightTheme.colors.primary}
                />
                <Text style={styles.menuItemText}>Editar Paciente</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  setMenuVisible(false);
                  alert(
                    "Funcionalidade de agendamento será implementada no Módulo de Consultas."
                  );
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={lightTheme.colors.primary}
                />
                <Text style={styles.menuItemText}>Agendar Consulta</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  setMenuVisible(false);
                  alert(
                    "Funcionalidade de mensagens será implementada no Módulo de Comunicação."
                  );
                }}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={20}
                  color={lightTheme.colors.primary}
                />
                <Text style={styles.menuItemText}>Enviar Mensagem</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
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
    </SafeAreaView>
  );
}

// Componente auxiliar para itens de informação
interface InfoItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  // Garantir que value seja sempre uma string
  const displayValue = value != null ? String(value) : "-";

  return (
    <View style={styles.infoItem}>
      <View style={styles.infoIconContainer}>
        <Ionicons name={icon} size={18} color={lightTheme.colors.gray[500]} />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{displayValue}</Text>
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
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: lightTheme.spacing.xs,
  },
  menuButton: {
    padding: lightTheme.spacing.xs,
    marginRight: -lightTheme.spacing.xs,
  },
  patientName: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[800],
    flex: 1,
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
    paddingHorizontal: lightTheme.spacing.sm,
    backgroundColor: lightTheme.colors.primaryBackground,
    borderRadius: lightTheme.borderRadius.md,
    gap: lightTheme.spacing.xs,
  },
  actionButtonPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: lightTheme.spacing.sm,
    borderRadius: lightTheme.borderRadius.md,
    gap: lightTheme.spacing.xs,
    backgroundColor: lightTheme.colors.primary,
    paddingVertical: lightTheme.spacing.md,
  },
  actionButtonText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.primary,
  },
  actionButtonPrimaryText: {
    fontSize: lightTheme.typography.fontSize.xs,
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
  // Estilos da Tab de Avaliações
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: lightTheme.spacing["3xl"],
  },
  emptyTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[700],
    marginTop: lightTheme.spacing.lg,
    marginBottom: lightTheme.spacing.sm,
  },
  emptyText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
    textAlign: "center",
    lineHeight: 20,
  },
  assessmentsList: {
    gap: lightTheme.spacing.md,
  },
  assessmentCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.lg,
    ...lightTheme.shadows.sm,
  },
  assessmentCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: lightTheme.spacing.md,
  },
  assessmentCardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: lightTheme.colors.primaryBackground,
    alignItems: "center",
    justifyContent: "center",
    marginRight: lightTheme.spacing.md,
  },
  assessmentCardInfo: {
    flex: 1,
  },
  assessmentCardDate: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.text,
    marginBottom: 2,
  },
  assessmentCardTime: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
  },
  protocolBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.primaryBackground,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
    alignSelf: "flex-start",
    marginBottom: lightTheme.spacing.md,
  },
  protocolBadgeText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.primary,
  },
  assessmentCardMetrics: {
    flexDirection: "row",
    gap: lightTheme.spacing.md,
    paddingTop: lightTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[200],
  },
  assessmentMetric: {
    flex: 1,
    alignItems: "center",
  },
  assessmentMetricLabel: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    marginBottom: 4,
  },
  assessmentMetricValue: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.text,
  },
  assessmentProgress: {
    marginTop: lightTheme.spacing.md,
    paddingTop: lightTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[200],
  },
  progressIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.xs,
  },
  progressText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
  },
  // Estilos para Empty States
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: lightTheme.spacing["2xl"],
    paddingHorizontal: lightTheme.spacing.xl,
  },
  emptyStateTitle: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[800],
    marginTop: lightTheme.spacing.lg,
    marginBottom: lightTheme.spacing.sm,
  },
  emptyStateText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
    lineHeight: 20,
  },
  // Estilos para botões de ação
  actionButtonContainer: {
    paddingHorizontal: lightTheme.spacing.xl,
    paddingVertical: lightTheme.spacing.lg,
  },
  addPlanButton: {
    backgroundColor: lightTheme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: lightTheme.spacing.md,
    paddingHorizontal: lightTheme.spacing.lg,
    borderRadius: lightTheme.borderRadius.lg,
    gap: lightTheme.spacing.sm,
    ...lightTheme.shadows.md,
  },
  addPlanButtonText: {
    color: lightTheme.colors.white,
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
  },
  // Estilos para cards de planos
  planCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.lg,
    marginBottom: lightTheme.spacing.md,
    ...lightTheme.shadows.sm,
  },
  planCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: lightTheme.spacing.md,
    marginBottom: lightTheme.spacing.md,
  },
  planCardIcon: {
    width: 48,
    height: 48,
    borderRadius: lightTheme.borderRadius.lg,
    backgroundColor: lightTheme.colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  planCardInfo: {
    flex: 1,
  },
  planCardTitle: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing.xs,
  },
  planCardDescription: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    lineHeight: 18,
  },
  planStatusBadge: {
    paddingHorizontal: lightTheme.spacing.sm,
    paddingVertical: lightTheme.spacing.xs,
    borderRadius: lightTheme.borderRadius.md,
  },
  planStatusText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    textTransform: "uppercase",
  },
  planCardFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: lightTheme.spacing.md,
    marginBottom: lightTheme.spacing.sm,
  },
  planCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.xs,
  },
  planCardMetaText: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
  },
  planCardStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: lightTheme.spacing.md,
    paddingTop: lightTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[100],
  },
  planCardStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.xs,
  },
  planCardStatText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[700],
    fontWeight: lightTheme.typography.fontWeight.medium as any,
  },
  // Dropdown Menu Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 120, // Abaixo do header
    paddingRight: lightTheme.spacing.xl,
  },
  dropdownMenu: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    minWidth: 220,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: lightTheme.spacing.md,
    paddingHorizontal: lightTheme.spacing.lg,
    gap: lightTheme.spacing.md,
  },
  menuItemText: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[800],
    fontWeight: lightTheme.typography.fontWeight.medium as any,
  },
  menuDivider: {
    height: 1,
    backgroundColor: lightTheme.colors.gray[100],
    marginHorizontal: lightTheme.spacing.md,
  },
  // Estilos da Última Avaliação
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: lightTheme.spacing.md,
  },
  sectionSubtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
    fontStyle: "italic",
  },
  lastAssessmentCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.lg,
    ...lightTheme.shadows.sm,
  },
  lastAssessmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: lightTheme.spacing.lg,
    paddingBottom: lightTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[100],
  },
  lastAssessmentHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing.sm,
  },
  lastAssessmentDate: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[700],
  },
  lastAssessmentMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: lightTheme.spacing.md,
    marginBottom: lightTheme.spacing.lg,
  },
  assessmentMetricItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: lightTheme.colors.gray[50],
    padding: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.md,
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: lightTheme.spacing.xs,
    paddingVertical: lightTheme.spacing.sm,
    paddingHorizontal: lightTheme.spacing.md,
    backgroundColor: lightTheme.colors.primary + "10",
    borderRadius: lightTheme.borderRadius.md,
  },
  viewDetailsButtonText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.primary,
  },
});
