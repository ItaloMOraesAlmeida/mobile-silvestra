import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";

export type NutritionistTabParamList = {
  Dashboard: undefined;
  Patients: undefined;
  Schedule: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<NutritionistTabParamList>();

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
          } else if (route.name === "Schedule") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
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
        component={() => null}
        options={{ tabBarLabel: "Dashboard" }}
      />
      <Tab.Screen
        name="Patients"
        component={() => null}
        options={{ tabBarLabel: "Pacientes" }}
      />
      <Tab.Screen
        name="Schedule"
        component={() => null}
        options={{ tabBarLabel: "Agenda" }}
      />
      <Tab.Screen
        name="Profile"
        component={() => null}
        options={{ tabBarLabel: "Perfil" }}
      />
    </Tab.Navigator>
  );
}
