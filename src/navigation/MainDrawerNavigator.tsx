import React from "react";
import {
  createDrawerNavigator,
  useDrawerStatus,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { HomeScreen } from "../screens/main/HomeScreen";
import { DashboardScreen as NutritionistDashboard } from "../screens/nutritionist/DashboardScreen";
import { PatientDashboardScreen } from "../screens/patient/DashboardScreen";
import { useAuthStore } from "../stores/auth.store";
import { ProfileScreen } from "../screens/main/ProfileScreen";
import { SettingsScreen } from "../screens/main/SettingsScreen";
import { ChangePasswordScreen } from "../screens/main/ChangePasswordScreen";
import { AboutScreen } from "../screens/main/AboutScreen";
import { EditProfileScreen } from "../screens/main/EditProfileScreen";
import { TermsOfServiceScreen } from "../screens/legal/TermsOfServiceScreen";
import { PrivacyPolicyScreen } from "../screens/legal/PrivacyPolicyScreen";
import { CustomDrawerContent } from "../components/CustomDrawerContent";
import { CustomHeader } from "../components/CustomHeader";
import { PatientsListScreen } from "../screens/nutritionist/PatientsListScreen";
import { PatientCreateScreen } from "../screens/nutritionist/PatientCreateScreen";

export type MainDrawerParamList = {
  Home: undefined;
  Patients: undefined;
  PatientCreate: undefined;
  Profile: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  About: undefined;
  EditProfile: undefined;
  Terms: undefined;
  Privacy: undefined;
};

const Drawer = createDrawerNavigator<MainDrawerParamList>();

function createScreenWithHeader(
  Screen: React.ComponentType,
  title: string,
  showBackButton: boolean = false,
  backTo?: string
): React.ComponentType<any> {
  const ScreenWithHeader = (props: any) => {
    const { navigation } = props;
    const isDrawerOpen = useDrawerStatus() === "open";

    return (
      <>
        <CustomHeader
          title={title}
          navigation={navigation}
          isDrawerOpen={isDrawerOpen}
          showBackButton={showBackButton}
          backTo={backTo}
        />
        {/* Repassa todas as props para a tela (navigation, route, etc.) */}
        <Screen {...props} />
      </>
    );
  };

  ScreenWithHeader.displayName = `${title}ScreenWithHeader`;
  return ScreenWithHeader;
}

function RoleBasedHome(props: any) {
  const user = useAuthStore((s) => s.user);

  // auth.store normaliza role para lowercase
  const role = user?.role || "normal";

  if (role === "nutritionist" || role === "nutricionista") {
    return <NutritionistDashboard {...props} />;
  }

  // Caso paciente: renderiza dashboard do paciente
  if (role === "patient" || role === "paciente") {
    return <PatientDashboardScreen {...props} />;
  }

  // Usuário normal
  return <HomeScreen {...props} />;
}

const HomeScreenWithHeader = createScreenWithHeader(RoleBasedHome, "Início");
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
const EditProfileScreenWithHeader = createScreenWithHeader(
  EditProfileScreen,
  "Editar Perfil",
  true, // Mostra botão de voltar
  "Profile" // Volta para Profile
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
      {/* Pacientes (mantemos as telas registradas, mas não as exibimos direto no drawer; o conteúdo do drawer fornece links) */}
      <Drawer.Screen
        name="Patients"
        component={
          createScreenWithHeader(PatientsListScreen as any, "Pacientes") as any
        }
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="PatientCreate"
        component={
          createScreenWithHeader(
            PatientCreateScreen as any,
            "Novo Paciente"
          ) as any
        }
        options={{ drawerItemStyle: { display: "none" } }}
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
      <Drawer.Screen
        name="EditProfile"
        component={EditProfileScreenWithHeader}
        options={{
          title: "Editar Perfil",
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
