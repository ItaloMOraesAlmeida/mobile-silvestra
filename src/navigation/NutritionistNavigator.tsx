import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";
import { DashboardScreen } from "../screens/nutritionist/DashboardScreen";
import { PatientsListScreen } from "../screens/nutritionist/PatientsListScreen";
import { ProfileScreen } from "../screens/main/ProfileScreen";
import { SettingsScreen } from "../screens/main/SettingsScreen";
import { CustomHeader } from "../components/CustomHeader";
import { useDrawerStatus } from "@react-navigation/drawer";

export type NutritionistTabParamList = {
  Dashboard: undefined;
  Patients: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<NutritionistTabParamList>();

function createTabScreen(
  Screen: React.ComponentType,
  title: string
): React.ComponentType<any> {
  const ScreenWithHeader = ({ navigation }: any) => {
    const isDrawerOpen = useDrawerStatus() === "open";

    return (
      <>
        <CustomHeader
          title={title}
          navigation={navigation}
          isDrawerOpen={isDrawerOpen}
        />
        <Screen />
      </>
    );
  };

  ScreenWithHeader.displayName = `${title}TabScreen`;
  return ScreenWithHeader;
}

const DashboardTabScreen = createTabScreen(DashboardScreen, "Dashboard");
const PatientsTabScreen = createTabScreen(PatientsListScreen, "Pacientes");
const ProfileTabScreen = createTabScreen(ProfileScreen, "Perfil");
const SettingsTabScreen = createTabScreen(SettingsScreen, "Configurações");

export function NutritionistNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "Dashboard") {
            iconName = focused ? "grid" : "grid-outline";
          } else if (route.name === "Patients") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.medium,
          fontSize: 12,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardTabScreen}
        options={{ tabBarLabel: "Dashboard" }}
      />
      <Tab.Screen
        name="Patients"
        component={PatientsTabScreen}
        options={{ tabBarLabel: "Pacientes" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileTabScreen}
        options={{ tabBarLabel: "Perfil" }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsTabScreen}
        options={{ tabBarLabel: "Config" }}
      />
    </Tab.Navigator>
  );
}
