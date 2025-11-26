import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import type { StackScreenProps } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles } from "../../hooks/useTheme";
import type { Theme } from "../../theme";
import { OverviewTab } from "./tabs/OverviewTab";
import { MeasurementsTab } from "./tabs/MeasurementsTab";
import { HealthTab } from "./tabs/HealthTab";
import { GoalsTab } from "./tabs/GoalsTab";
import { ProgressTab } from "./tabs/ProgressTab";
import { AnalyticsTab } from "./tabs/AnalyticsTab";

type RootStackParamList = {
  PatientDetails: { patientId: string; patientName: string };
};

type Props = StackScreenProps<RootStackParamList, "PatientDetails">;

const Tab = createMaterialTopTabNavigator();

export const PatientDetailsScreen: React.FC<Props> = ({
  route,
  navigation,
}) => {
  const { patientName, patientId } = route.params;

  const styles = useThemedStyles(createStyles);

  // Memoizar componentes de tabs para evitar re-renders desnecessários
  const OverviewTabMemo = React.useMemo(() => {
    const Component = () => <OverviewTab />;
    Component.displayName = "OverviewTabMemo";
    return Component;
  }, []);

  const MeasurementsTabMemo = React.useMemo(() => {
    const Component = () => <MeasurementsTab />;
    Component.displayName = "MeasurementsTabMemo";
    return Component;
  }, []);

  const HealthTabMemo = React.useMemo(() => {
    const Component = () => <HealthTab />;
    Component.displayName = "HealthTabMemo";
    return Component;
  }, []);

  const GoalsTabMemo = React.useMemo(() => {
    const Component = () => <GoalsTab />;
    Component.displayName = "GoalsTabMemo";
    return Component;
  }, []);

  const ProgressTabMemo = React.useMemo(() => {
    const Component = () => <ProgressTab />;
    Component.displayName = "ProgressTabMemo";
    return Component;
  }, []);

  const AnalyticsTabMemo = React.useMemo(() => {
    const Component = () => <AnalyticsTab />;
    Component.displayName = "AnalyticsTabMemo";
    return Component;
  }, []);

  const handleGenerateReport = React.useCallback(() => {
    // @ts-ignore - navegação entre diferentes navigators
    navigation.navigate("ReportConfig", {
      patientId,
      patientName,
    });
  }, [navigation, patientId, patientName]);

  const handleOpenNotifications = React.useCallback(() => {
    // @ts-ignore - navegação entre diferentes navigators
    navigation.navigate("NotificationSettings", {
      patientId,
      patientName,
    });
  }, [navigation, patientId, patientName]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: patientName || "Detalhes do Paciente",
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={styles.headerIconColor.color}
          />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <TouchableOpacity
            onPress={handleOpenNotifications}
            style={styles.headerButton}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={styles.headerIconColor.color}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleGenerateReport}
            style={styles.headerButton}
          >
            <Ionicons
              name="document-text"
              size={24}
              color={styles.headerIconColor.color}
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [
    navigation,
    patientName,
    styles,
    handleGenerateReport,
    handleOpenNotifications,
  ]);

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          tabBarScrollEnabled: true,
          tabBarActiveTintColor: styles.tabBarActiveColor.color,
          tabBarInactiveTintColor: styles.tabBarInactiveColor.color,
          tabBarIndicatorStyle: {
            backgroundColor: styles.tabBarIndicator.backgroundColor,
            height: 3,
          },
          tabBarLabelStyle: {
            fontSize: styles.tabBarLabel.fontSize,
            fontWeight: styles.tabBarLabel.fontWeight,
            textTransform: "none",
          },
          tabBarStyle: {
            backgroundColor: styles.tabBarBackground.backgroundColor,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: styles.tabBarBorder.borderBottomColor,
          },
          tabBarItemStyle: {
            width: "auto",
            minWidth: 90,
          },
          swipeEnabled: true,
        }}
      >
        <Tab.Screen
          name="Overview"
          options={{
            tabBarLabel: "Visão Geral",
            tabBarIcon: ({ color }) => (
              <Ionicons name="home-outline" size={20} color={color} />
            ),
          }}
          component={OverviewTabMemo}
        />

        <Tab.Screen
          name="Measurements"
          options={{
            tabBarLabel: "Medidas",
            tabBarIcon: ({ color }) => (
              <Ionicons name="body-outline" size={20} color={color} />
            ),
          }}
          component={MeasurementsTabMemo}
        />

        <Tab.Screen
          name="Health"
          options={{
            tabBarLabel: "Saúde",
            tabBarIcon: ({ color }) => (
              <Ionicons name="heart-outline" size={20} color={color} />
            ),
          }}
          component={HealthTabMemo}
        />

        <Tab.Screen
          name="Goals"
          options={{
            tabBarLabel: "Metas",
            tabBarIcon: ({ color }) => (
              <Ionicons name="flag-outline" size={20} color={color} />
            ),
          }}
          component={GoalsTabMemo}
        />

        <Tab.Screen
          name="Progress"
          options={{
            tabBarLabel: "Progresso",
            tabBarIcon: ({ color }) => (
              <Ionicons name="trending-up-outline" size={20} color={color} />
            ),
          }}
          component={ProgressTabMemo}
        />

        <Tab.Screen
          name="Analytics"
          options={{
            tabBarLabel: "Analytics",
            tabBarIcon: ({ color }) => (
              <Ionicons name="stats-chart-outline" size={20} color={color} />
            ),
          }}
          component={AnalyticsTabMemo}
        />
      </Tab.Navigator>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerButton: {
      padding: theme.spacing.sm,
      marginLeft: theme.spacing.sm,
    },
    headerRightContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerIconColor: {
      color: theme.colors.text,
    },
    tabBarActiveColor: {
      color: theme.colors.primary,
    },
    tabBarInactiveColor: {
      color: theme.colors.textSecondary,
    },
    tabBarIndicator: {
      backgroundColor: theme.colors.primary,
    },
    tabBarLabel: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    tabBarBackground: {
      backgroundColor: theme.colors.card,
    },
    tabBarBorder: {
      borderBottomColor: theme.colors.border,
    },
  });
