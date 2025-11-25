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
import { PatientDetailsScreen } from "../screens/nutritionist/PatientDetailsScreen";
import { PatientEditScreen } from "../screens/nutritionist/PatientEditScreen";
import { PatientProgressScreen } from "../screens/nutritionist/PatientProgressScreen";
import { PatientEvolutionScreen } from "../screens/nutritionist/PatientEvolutionScreen";
import { PatientAssessmentCreateScreen } from "../screens/nutritionist/PatientAssessmentCreateScreen";
import { PatientAssessmentDetailsScreen } from "../screens/nutritionist/PatientAssessmentDetailsScreen";
import { MeasurementDetailsScreen } from "../screens/patient/MeasurementDetailsScreen";
import { NotificationSettingsScreen } from "../screens/patient/NotificationSettingsScreen";
import { GoalDetailsScreen } from "../screens/goals";
import ReportConfigScreen from "../screens/reports/ReportConfigScreen";
import ReportViewerScreen from "../screens/reports/ReportViewerScreen";
import ReportHistoryScreen from "../screens/reports/ReportHistoryScreen";
import FoodDatabaseScreen from "../screens/FoodDatabaseScreen";
import FoodDetailsScreen from "../screens/FoodDetailsScreen";
import FoodFavoritesScreen from "../screens/FoodFavoritesScreen";
import CreateMealPlanScreen from "../screens/nutritionist/CreateMealPlanScreen";
import MealPlanDetailsScreen from "../screens/MealPlanDetailsScreen";
import ShoppingListScreen from "../screens/ShoppingListScreen";

// Feature #4 - App do Paciente
import {
  MyMealPlansScreen,
  MealPlanDetailsForPatientScreen,
  MealCheckInScreen,
  MyMeasurementsScreen,
  MyGoalsScreen,
} from "../screens/patient";

export type MainDrawerParamList = {
  Home: undefined;
  Patients: undefined;
  PatientCreate: undefined;
  PatientDetails: {
    patientId: string;
  };
  PatientEdit: {
    patientId: string;
    patient: any;
  };
  PatientProgress: {
    patientId: string;
  };
  PatientEvolution: {
    patientId: string;
  };
  PatientAssessmentCreate: {
    patientId: string;
    patientName: string;
  };
  PatientAssessmentDetails: {
    patientId: string;
    measurementId: string;
  };
  MeasurementDetails: {
    measurementId: string;
    patientId: string;
    patientName?: string;
  };
  NotificationSettings: {
    patientId: string;
    patientName?: string;
  };
  GoalDetails: {
    patientId: string;
    goalId: string;
    patientName?: string;
  };
  ReportConfig: {
    patientId: string;
    patientName: string;
  };
  ReportViewer: {
    reportId: string;
  };
  ReportList: undefined;
  FoodDatabase: undefined;
  FoodDetails: {
    foodId: string;
  };
  FoodFavorites: undefined;
  CreateMealPlan: {
    patientId?: string;
    patientName?: string;
  };
  MealPlanDetails: {
    planId: string;
  };
  ShoppingList: {
    planId: string;
  };
  Profile: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  About: undefined;
  EditProfile: undefined;
  Terms: undefined;
  Privacy: undefined;
  // Feature #4 - App do Paciente
  MyMealPlans: undefined;
  MealPlanDetailsForPatient: {
    planId: string;
  };
  MealCheckIn: {
    mealId: string;
    mealName: string;
    patientId: string;
    planId: string;
  };
  MyMeasurements: undefined;
  MyGoals: undefined;
};

const Drawer = createDrawerNavigator<MainDrawerParamList>();

function createScreenWithHeader(
  Screen: React.ComponentType<any>,
  title: string | ((props: any) => string),
  showBackButton: boolean = false,
  backTo?: string
): React.ComponentType<any> {
  const ScreenWithHeader = (props: any) => {
    const { navigation } = props;
    const isDrawerOpen = useDrawerStatus() === "open";
    const [onBackPressCallback, setOnBackPressCallback] = React.useState<
      (() => boolean) | undefined
    >(undefined);

    // Função para a tela registrar seu callback
    const registerBackHandler = React.useCallback((callback: () => boolean) => {
      setOnBackPressCallback(() => callback);
    }, []);

    // Título dinâmico: pode ser string ou função
    const dynamicTitle = typeof title === "function" ? title(props) : title;

    return (
      <>
        <CustomHeader
          title={dynamicTitle}
          navigation={navigation}
          isDrawerOpen={isDrawerOpen}
          showBackButton={showBackButton}
          backTo={backTo}
          onBackPress={onBackPressCallback}
        />
        {/* Repassa todas as props para a tela + registerBackHandler */}
        <Screen {...props} registerBackHandler={registerBackHandler} />
      </>
    );
  };

  ScreenWithHeader.displayName = `ScreenWithHeader`;
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
        name="PatientDetails"
        component={
          createScreenWithHeader(
            PatientDetailsScreen as any,
            "Detalhes do Paciente",
            true,
            "Patients"
          ) as any
        }
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="PatientEdit"
        component={
          createScreenWithHeader(
            PatientEditScreen as any,
            "Editar Paciente",
            true,
            "PatientDetails"
          ) as any
        }
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="PatientProgress"
        component={
          createScreenWithHeader(
            PatientProgressScreen as any,
            "Evolução do Paciente",
            true,
            "PatientDetails"
          ) as any
        }
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="PatientEvolution"
        component={
          createScreenWithHeader(
            PatientEvolutionScreen as any,
            "Evolução do Paciente",
            true,
            "PatientDetails"
          ) as any
        }
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="PatientAssessmentCreate"
        component={
          createScreenWithHeader(
            PatientAssessmentCreateScreen as any,
            "Nova Avaliação",
            true,
            "PatientDetails"
          ) as any
        }
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="PatientAssessmentDetails"
        component={
          createScreenWithHeader(
            PatientAssessmentDetailsScreen as any,
            "Detalhes da Avaliação",
            true,
            "PatientDetails"
          ) as any
        }
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="MeasurementDetails"
        component={MeasurementDetailsScreen as any}
        options={{
          drawerItemStyle: { display: "none" },
          headerShown: true,
        }}
      />
      <Drawer.Screen
        name="GoalDetails"
        component={GoalDetailsScreen as any}
        options={{
          drawerItemStyle: { display: "none" },
          headerShown: true,
        }}
      />
      <Drawer.Screen
        name="NotificationSettings"
        component={
          createScreenWithHeader(
            NotificationSettingsScreen as any,
            "Configurações de Notificações",
            true,
            "Home"
          ) as any
        }
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />

      {/* Telas de Relatórios */}
      <Drawer.Screen
        name="ReportList"
        component={
          createScreenWithHeader(
            ReportHistoryScreen as any,
            "Histórico de Relatórios"
          ) as any
        }
        options={{
          title: "Relatórios",
        }}
      />
      <Drawer.Screen
        name="ReportConfig"
        component={ReportConfigScreen as any}
        options={{
          drawerItemStyle: { display: "none" },
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="ReportViewer"
        component={ReportViewerScreen as any}
        options={{
          drawerItemStyle: { display: "none" },
          headerShown: false,
        }}
      />

      {/* Banco de Alimentos TACO - Sprint 7 */}
      <Drawer.Screen
        name="FoodDatabase"
        component={
          createScreenWithHeader(
            FoodDatabaseScreen as any,
            "Banco de Alimentos"
          ) as any
        }
        options={{
          title: "Alimentos",
        }}
      />
      <Drawer.Screen
        name="FoodDetails"
        component={
          createScreenWithHeader(
            FoodDetailsScreen as any,
            "Detalhes do Alimento",
            true,
            "FoodDatabase"
          ) as any
        }
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="FoodFavorites"
        component={
          createScreenWithHeader(
            FoodFavoritesScreen as any,
            "Meus Favoritos",
            true,
            "FoodDatabase"
          ) as any
        }
        options={{
          title: "Favoritos",
        }}
      />

      {/* Planos Alimentares - Sprint 8-9 */}
      <Drawer.Screen
        name="CreateMealPlan"
        component={
          createScreenWithHeader(
            CreateMealPlanScreen as any,
            (props: any) => {
              const planId = props.route?.params?.planId;
              return planId ? "Editar Plano Alimentar" : "Novo Plano Alimentar";
            },
            true,
            "PatientDetails"
          ) as any
        }
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="MealPlanDetails"
        component={
          createScreenWithHeader(
            MealPlanDetailsScreen as any,
            "Detalhes do Plano",
            true,
            "PatientDetails"
          ) as any
        }
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="ShoppingList"
        component={ShoppingListScreen as any}
        options={{
          drawerItemStyle: { display: "none" },
          headerShown: false,
        }}
      />

      {/* Feature #4 - App do Paciente */}
      <Drawer.Screen
        name="MyMealPlans"
        component={
          createScreenWithHeader(MyMealPlansScreen as any, "Meus Planos") as any
        }
        options={{
          title: "Meus Planos",
        }}
      />
      <Drawer.Screen
        name="MealPlanDetailsForPatient"
        component={MealPlanDetailsForPatientScreen as any}
        options={{
          drawerItemStyle: { display: "none" },
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="MealCheckIn"
        component={MealCheckInScreen as any}
        options={{
          drawerItemStyle: { display: "none" },
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="MyMeasurements"
        component={
          createScreenWithHeader(
            MyMeasurementsScreen as any,
            "Minhas Medições"
          ) as any
        }
        options={{
          title: "Minhas Medições",
        }}
      />
      <Drawer.Screen
        name="MyGoals"
        component={
          createScreenWithHeader(MyGoalsScreen as any, "Minhas Metas") as any
        }
        options={{
          title: "Minhas Metas",
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
