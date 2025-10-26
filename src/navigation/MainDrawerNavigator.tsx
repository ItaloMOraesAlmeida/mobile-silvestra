import React from "react";
import {
  createDrawerNavigator,
  useDrawerStatus,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { HomeScreen } from "../screens/main/HomeScreen";
import { CustomDrawerContent } from "../components/CustomDrawerContent";
import { CustomHeader } from "../components/CustomHeader";

export type MainDrawerParamList = {
  Home: undefined;
};

const Drawer = createDrawerNavigator<MainDrawerParamList>();

function HomeScreenWithHeader({ navigation }: any) {
  const isDrawerOpen = useDrawerStatus() === "open";

  return (
    <>
      <CustomHeader
        title="Início"
        navigation={navigation}
        isDrawerOpen={isDrawerOpen}
      />
      <HomeScreen />
    </>
  );
}

export function MainDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props: DrawerContentComponentProps) => (
        <CustomDrawerContent {...props} />
      )}
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerStyle: {
          width: 280,
        },
        overlayColor: "rgba(0, 0, 0, 0.5)",
        swipeEnabled: true,
        swipeEdgeWidth: 50,
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreenWithHeader}
        options={{
          title: "Início",
        }}
      />
    </Drawer.Navigator>
  );
}
