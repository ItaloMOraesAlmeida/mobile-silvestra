import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useRoute,
  useNavigation,
  type RouteProp,
} from "@react-navigation/native";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import { useThemedStyles } from "../../../hooks/useTheme";
import type { Theme } from "../../../theme";
import {
  KpiCard,
  EmptyState,
  KpiCardSkeleton,
  CardSkeleton,
} from "../../../components/patient";
import {
  AddMeasurementModal,
  EditMeasurementModal,
} from "../../../components/modals";
import { bodyMeasurementsService, goalsService } from "../../../services/api";
import type {
  BodyMeasurement,
  Goal,
  CreateBodyMeasurementDto,
  UpdateBodyMeasurementDto,
} from "../../../types/patient-details.types";

type RouteParams = {
  PatientDetails: {
    patientId: string;
    patientName: string;
  };
};

export const OverviewTab: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const route = useRoute<RouteProp<RouteParams, "PatientDetails">>();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const { patientId, patientName } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [latestMeasurement, setLatestMeasurement] =
    useState<BodyMeasurement | null>(null);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [measurementModalVisible, setMeasurementModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      setError(null);

      // Buscar última medição
      const measurement = await bodyMeasurementsService.findLatest(patientId);
      setLatestMeasurement(measurement);

      // Buscar metas ativas
      const goals = await goalsService.findAll(patientId, false);
      setActiveGoals(goals.slice(0, 3)); // Mostrar apenas as 3 primeiras
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro ao carregar informações do paciente");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleAddMeasurement = async (data: CreateBodyMeasurementDto) => {
    try {
      await bodyMeasurementsService.create(patientId, data);
      await fetchData();
    } catch (error) {
      console.error("Error adding measurement:", error);
      Alert.alert("Erro", "Não foi possível adicionar a medição");
      throw error; // Re-throw to let modal handle it
    }
  };

  const handleEditMeasurement = async (
    measurementId: string,
    data: UpdateBodyMeasurementDto
  ) => {
    try {
      await bodyMeasurementsService.update(patientId, measurementId, data);
      await fetchData();
    } catch (error) {
      console.error("Error updating measurement:", error);
      Alert.alert("Erro", "Não foi possível atualizar a medição");
      throw error;
    }
  };

  const handleDeleteLatestMeasurement = () => {
    if (!latestMeasurement) return;

    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir a última medição? Esta ação não pode ser desfeita.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await bodyMeasurementsService.remove(
                patientId,
                latestMeasurement.id
              );
              await fetchData();
              Alert.alert("Sucesso", "Medição excluída com sucesso!");
            } catch (error) {
              console.error("Error deleting measurement:", error);
              Alert.alert("Erro", "Não foi possível excluir a medição");
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const calculateBMI = (weight: number, height: number) => {
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  if (loading) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.kpiSection}>
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </View>
        <CardSkeleton />
        <CardSkeleton />
      </ScrollView>
    );
  }

  if (error) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <EmptyState
          icon="alert-circle-outline"
          title="Erro ao carregar"
          message={error}
          actionLabel="Tentar novamente"
          onAction={fetchData}
        />
      </ScrollView>
    );
  }

  if (!latestMeasurement) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <EmptyState
          icon="body-outline"
          title="Nenhuma medição encontrada"
          message="Adicione a primeira medição do paciente para começar o acompanhamento"
          actionLabel="Adicionar Medição"
          onAction={() => setMeasurementModalVisible(true)}
        />
      </ScrollView>
    );
  }

  const bmi = latestMeasurement.height
    ? calculateBMI(latestMeasurement.weight, latestMeasurement.height)
    : null;

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* KPIs Principais */}
        <View style={styles.kpiSection}>
          <KpiCard
            icon="scale-outline"
            label="Peso Atual"
            value={latestMeasurement.weight.toFixed(1)}
            unit="kg"
            style={styles.kpiCard}
          />

          {bmi && (
            <KpiCard
              icon="fitness-outline"
              label="IMC"
              value={bmi}
              unit="kg/m²"
              style={styles.kpiCard}
            />
          )}

          <KpiCard
            icon="calendar-outline"
            label="Última Medição"
            value={formatDate(latestMeasurement.createdAt)}
            style={styles.kpiCard}
          />
        </View>

        {/* Card de Última Medição */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Última Medição</Text>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditModalVisible(true)}
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={styles.editIcon.color}
                />
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteLatestMeasurement}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={styles.deleteIcon.color}
                />
                <Text style={styles.deleteButtonText}>Excluir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("MeasurementDetails", {
                    measurementId: latestMeasurement.id,
                    patientId: patientId,
                    patientName: patientName,
                  })
                }
              >
                <Text style={styles.cardAction}>Ver detalhes</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.measurementGrid}
            onPress={() =>
              navigation.navigate("MeasurementDetails", {
                measurementId: latestMeasurement.id,
                patientId: patientId,
                patientName: patientName,
              })
            }
            activeOpacity={0.7}
          >
            <View style={styles.measurementItem}>
              <Text style={styles.measurementLabel}>Altura</Text>
              <Text style={styles.measurementValue}>
                {latestMeasurement.height?.toFixed(0) || "-"} cm
              </Text>
            </View>

            {latestMeasurement.bodyFatPercent && (
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>% Gordura</Text>
                <Text style={styles.measurementValue}>
                  {latestMeasurement.bodyFatPercent.toFixed(1)}%
                </Text>
              </View>
            )}

            {latestMeasurement.muscleMass && (
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>Massa Muscular</Text>
                <Text style={styles.measurementValue}>
                  {latestMeasurement.muscleMass.toFixed(1)} kg
                </Text>
              </View>
            )}

            {latestMeasurement.waistCirc && (
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>Cintura</Text>
                <Text style={styles.measurementValue}>
                  {latestMeasurement.waistCirc.toFixed(1)} cm
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Card de Metas Ativas */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Metas Ativas</Text>
            <TouchableOpacity
              onPress={() => {
                // TODO: Navegar para aba de metas
                console.log("Navegar para aba de metas");
              }}
            >
              <Text style={styles.cardAction}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {activeGoals.length > 0 ? (
            <View style={styles.goalsContainer}>
              {activeGoals.map((goal) => (
                <View key={goal.id} style={styles.goalItem}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalIconContainer}>
                      <Ionicons
                        name="flag"
                        size={16}
                        color={styles.goalIcon.color}
                      />
                    </View>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalType}>{goal.type}</Text>
                      <Text style={styles.goalTarget}>
                        Meta: {goal.target} {goal.unit}
                      </Text>
                    </View>
                  </View>

                  {goal.current !== null && (
                    <View style={styles.goalProgress}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${Math.min(
                                (goal.current / goal.target) * 100,
                                100
                              )}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.goalCurrent}>
                        {goal.current} / {goal.target} {goal.unit}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyGoals}>
              <Ionicons
                name="flag-outline"
                size={48}
                color={styles.emptyIcon.color}
              />
              <Text style={styles.emptyText}>Nenhuma meta ativa</Text>
            </View>
          )}
        </View>

        {/* Botões de Ação Rápida */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setMeasurementModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="add-circle"
              size={24}
              color={styles.actionIcon.color}
            />
            <Text style={styles.actionText}>Nova Medição</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // TODO: Abrir modal de nova meta
              console.log("Abrir modal de nova meta");
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="flag" size={24} color={styles.actionIcon.color} />
            <Text style={styles.actionText}>Nova Meta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Measurement Modal */}
      <AddMeasurementModal
        visible={measurementModalVisible}
        patientId={patientId}
        onClose={() => setMeasurementModalVisible(false)}
        onSubmit={handleAddMeasurement}
      />

      {/* Edit Measurement Modal */}
      {latestMeasurement && (
        <EditMeasurementModal
          visible={editModalVisible}
          patientId={patientId}
          measurement={latestMeasurement}
          onClose={() => setEditModalVisible(false)}
          onSubmit={handleEditMeasurement}
        />
      )}
    </>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    content: {
      padding: theme.spacing.md,
      paddingBottom: theme.spacing["2xl"],
    },
    kpiSection: {
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    kpiCard: {
      marginBottom: 0,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.sm,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.md,
    },
    cardTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
    },
    cardAction: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.primary,
    },
    cardActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    editButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: theme.spacing.sm,
      backgroundColor: theme.colors.primaryBackground,
      borderRadius: theme.borderRadius.sm,
    },
    editButtonText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.primary,
    },
    editIcon: {
      color: theme.colors.primary,
    },
    deleteButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: theme.spacing.sm,
      backgroundColor: theme.colors.error + "15",
      borderRadius: theme.borderRadius.sm,
    },
    deleteButtonText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.error,
    },
    deleteIcon: {
      color: theme.colors.error,
    },
    measurementGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.md,
    },
    measurementItem: {
      flex: 1,
      minWidth: "45%",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
    },
    measurementLabel: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    measurementValue: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
    },
    goalsContainer: {
      gap: theme.spacing.md,
    },
    goalItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
    },
    goalHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: theme.spacing.sm,
    },
    goalIconContainer: {
      width: 32,
      height: 32,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.primaryBackground,
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.sm,
    },
    goalIcon: {
      color: theme.colors.primary,
    },
    goalInfo: {
      flex: 1,
    },
    goalType: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text,
      marginBottom: 2,
    },
    goalTarget: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    goalProgress: {
      marginTop: theme.spacing.sm,
    },
    progressBar: {
      height: 6,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.full,
      overflow: "hidden",
      marginBottom: theme.spacing.xs,
    },
    progressFill: {
      height: "100%",
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.full,
    },
    goalCurrent: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    emptyGoals: {
      alignItems: "center",
      padding: theme.spacing.xl,
    },
    emptyIcon: {
      color: theme.colors.textSecondary,
    },
    emptyText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.sm,
    },
    actionsContainer: {
      flexDirection: "row",
      gap: theme.spacing.md,
    },
    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      ...theme.shadows.md,
    },
    actionIcon: {
      color: theme.colors.white,
    },
    actionText: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.white,
      marginLeft: theme.spacing.sm,
    },
  });
