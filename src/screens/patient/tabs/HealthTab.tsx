import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet, RefreshControl, Alert } from "react-native";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { useThemedStyles, useTheme } from "../../../hooks/useTheme";
import type { Theme } from "../../../theme";
import {
  SectionCard,
  LifestyleCard,
  EmptyState,
  CardSkeleton,
} from "../../../components/patient";
import { healthInfoService } from "../../../services/api";
import type { HealthInfo } from "../../../types/patient-details.types";

type RouteParams = {
  PatientDetails: {
    patientId: string;
    patientName: string;
  };
};

export const HealthTab: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const route = useRoute<RouteProp<RouteParams, "PatientDetails">>();
  const { patientId } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [healthInfo, setHealthInfo] = useState<HealthInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthInfo = React.useCallback(
    async (isRefresh = false) => {
      try {
        setError(null);
        if (!isRefresh) setLoading(true);

        const data = await healthInfoService.findOne(patientId);
        setHealthInfo(data);
      } catch (err) {
        console.error("Error fetching health info:", err);
        setError("Não foi possível carregar as informações de saúde");
      } finally {
        setLoading(false);
        if (isRefresh) setRefreshing(false);
      }
    },
    [patientId]
  );

  useEffect(() => {
    fetchHealthInfo();
  }, [fetchHealthInfo]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchHealthInfo(true);
  }, [fetchHealthInfo]);

  const handleEditSection = (sectionName: string) => {
    Alert.alert(
      "Editar",
      `Edição de ${sectionName} será implementada em breve`
    );
  };

  // Loading state
  if (loading) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </ScrollView>
    );
  }

  // Error state
  if (error) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.emptyContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <EmptyState
          icon="alert-circle"
          title="Erro ao carregar"
          message={error}
          actionLabel="Tentar novamente"
          onAction={() => fetchHealthInfo()}
        />
      </ScrollView>
    );
  }

  // Empty state
  if (!healthInfo) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.emptyContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <EmptyState
          icon="medical"
          title="Sem informações de saúde"
          message="Nenhuma informação de saúde cadastrada para este paciente"
          actionLabel="Adicionar informações"
          onAction={() =>
            Alert.alert("Em breve", "Funcionalidade em desenvolvimento")
          }
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Medical History Section */}
      <SectionCard
        icon="medical"
        title="Histórico Médico"
        items={healthInfo.medicalConditions}
        emptyMessage="Nenhuma condição médica registrada"
        onEdit={() => handleEditSection("Histórico Médico")}
      />

      {/* Allergies Section */}
      <SectionCard
        icon="warning"
        title="Alergias"
        items={healthInfo.allergies}
        emptyMessage="Nenhuma alergia registrada"
        onEdit={() => handleEditSection("Alergias")}
      />

      {/* Medications Section */}
      <SectionCard
        icon="medical-outline"
        title="Medicamentos"
        items={healthInfo.medications}
        emptyMessage="Nenhum medicamento registrado"
        onEdit={() => handleEditSection("Medicamentos")}
      />

      {/* Surgeries Section */}
      <SectionCard
        icon="cut"
        title="Cirurgias"
        items={healthInfo.surgeries}
        emptyMessage="Nenhuma cirurgia registrada"
        onEdit={() => handleEditSection("Cirurgias")}
      />

      {/* Family History Section */}
      <SectionCard
        icon="people"
        title="Histórico Familiar"
        items={healthInfo.familyHistory}
        emptyMessage="Nenhum histórico familiar registrado"
        onEdit={() => handleEditSection("Histórico Familiar")}
      />

      {/* Dietary Restrictions Section */}
      <SectionCard
        icon="restaurant"
        title="Restrições Alimentares"
        items={healthInfo.dietaryRestrictions}
        emptyMessage="Nenhuma restrição alimentar registrada"
        onEdit={() => handleEditSection("Restrições Alimentares")}
      />

      {/* Food Intolerances Section */}
      <SectionCard
        icon="nutrition"
        title="Intolerâncias Alimentares"
        items={healthInfo.foodIntolerances}
        emptyMessage="Nenhuma intolerância alimentar registrada"
        onEdit={() => handleEditSection("Intolerâncias Alimentares")}
      />

      {/* Lifestyle Section */}
      <LifestyleCard
        activityLevel={healthInfo.activityLevel}
        sleepQuality={healthInfo.sleepQuality}
        stressLevel={healthInfo.stressLevel}
        smoker={healthInfo.smoker}
        alcoholConsumption={healthInfo.alcoholConsumption}
        onEdit={() => handleEditSection("Estilo de Vida")}
      />
    </ScrollView>
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
    },
    emptyContent: {
      flexGrow: 1,
      justifyContent: "center",
    },
  });
