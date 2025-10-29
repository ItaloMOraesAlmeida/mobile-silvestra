import React from "react";
import {
  createDrawerNavigator,
  useDrawerStatus,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { HomeScreen } from "../screens/main/HomeScreen";
import { ProfileScreen } from "../screens/main/ProfileScreen";
import { SettingsScreen } from "../screens/main/SettingsScreen";
import { CustomDrawerContent } from "../components/CustomDrawerContent";
import { CustomHeader } from "../components/CustomHeader";

export type MainDrawerParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Drawer = createDrawerNavigator<MainDrawerParamList>();

function createScreenWithHeader(
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

  ScreenWithHeader.displayName = `${title}ScreenWithHeader`;
  return ScreenWithHeader;
}

const HomeScreenWithHeader = createScreenWithHeader(HomeScreen, "Início");
const ProfileScreenWithHeader = createScreenWithHeader(ProfileScreen, "Perfil");
const SettingsScreenWithHeader = createScreenWithHeader(
  SettingsScreen,
  "Configurações"
);

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
      <Drawer.Screen
        name="Profile"
        component={ProfileScreenWithHeader}
        options={{
          title: "Perfil",
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreenWithHeader}
        options={{
          title: "Configurações",
        }}
      />
    </Drawer.Navigator>
  );
}
