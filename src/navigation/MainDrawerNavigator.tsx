import React from "react";
import {
  createDrawerNavigator,
  useDrawerStatus,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { HomeScreen } from "../screens/main/HomeScreen";
import { ProfileScreen } from "../screens/main/ProfileScreen";
import { SettingsScreen } from "../screens/main/SettingsScreen";
import { ChangePasswordScreen } from "../screens/main/ChangePasswordScreen";
import { AboutScreen } from "../screens/main/AboutScreen";
import { TermsOfServiceScreen } from "../screens/legal/TermsOfServiceScreen";
import { PrivacyPolicyScreen } from "../screens/legal/PrivacyPolicyScreen";
import { CustomDrawerContent } from "../components/CustomDrawerContent";
import { CustomHeader } from "../components/CustomHeader";

export type MainDrawerParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  About: undefined;
  Terms: undefined;
  Privacy: undefined;
};

const Drawer = createDrawerNavigator<MainDrawerParamList>();

function createScreenWithHeader(
  Screen: React.ComponentType,
  title: string,
  showBackButton: boolean = false
): React.ComponentType<any> {
  const ScreenWithHeader = ({ navigation }: any) => {
    const isDrawerOpen = useDrawerStatus() === "open";

    return (
      <>
        <CustomHeader
          title={title}
          navigation={navigation}
          isDrawerOpen={isDrawerOpen}
          showBackButton={showBackButton}
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
const ChangePasswordScreenWithHeader = createScreenWithHeader(
  ChangePasswordScreen,
  "Alterar Senha",
  true // Mostra botão de voltar
);
const AboutScreenWithHeader = createScreenWithHeader(
  AboutScreen,
  "Sobre o App",
  true // Mostra botão de voltar
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

      {/* Modal Screens com header customizado */}
      <Drawer.Screen
        name="ChangePassword"
        component={ChangePasswordScreenWithHeader}
        options={{
          title: "Alterar Senha",
          drawerItemStyle: { display: "none" }, // Não aparece no drawer
        }}
      />
      <Drawer.Screen
        name="About"
        component={AboutScreenWithHeader}
        options={{
          title: "Sobre",
          drawerItemStyle: { display: "none" },
        }}
      />

      {/* Telas de legal - sem header customizado (já têm header próprio) */}
      <Drawer.Screen
        name="Terms"
        component={TermsOfServiceScreen}
        options={{
          title: "Termos de Uso",
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="Privacy"
        component={PrivacyPolicyScreen}
        options={{
          title: "Privacidade",
          drawerItemStyle: { display: "none" },
        }}
      />
    </Drawer.Navigator>
  );
}
