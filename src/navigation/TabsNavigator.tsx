import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { HomeScreen } from "../screens/tabs/HomeScreen";
import { ExploreScreen } from "../screens/tabs/ExploreScreen";
import { lightTheme } from "../theme";

export type TabsParamList = {
  Home: undefined;
  Explore: undefined;
};

const Tab = createBottomTabNavigator<TabsParamList>();

export function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: lightTheme.colors.primaryDark,
        tabBarInactiveTintColor: lightTheme.colors.gray[600],
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          title: "Explorar",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
