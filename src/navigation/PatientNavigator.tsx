import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";

export type PatientTabParamList = {
  Home: undefined;
  Nutrition: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<PatientTabParamList>();

export function PatientNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Nutrition") {
            iconName = focused ? "restaurant" : "restaurant-outline";
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
        name="Home"
        component={() => null}
        options={{ tabBarLabel: "Início" }}
      />
      <Tab.Screen
        name="Nutrition"
        component={() => null}
        options={{ tabBarLabel: "Nutrição" }}
      />
      <Tab.Screen
        name="Profile"
        component={() => null}
        options={{ tabBarLabel: "Perfil" }}
      />
    </Tab.Navigator>
  );
}
