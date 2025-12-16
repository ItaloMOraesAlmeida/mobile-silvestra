import React from "react";
import { TouchableOpacity } from "react-native";
import {
  createDrawerNavigator,
  useDrawerStatus,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
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
import FormulasListScreen from "../screens/nutritionist/FormulasListScreen";
import FormulaEditorScreen from "../screens/nutritionist/FormulaEditorScreen";
import FormulaDetailsScreen from "../screens/nutritionist/FormulaDetailsScreen";
import CalculateFormulaModal from "../screens/nutritionist/CalculateFormulaModal";

// Feature #4 - App do Paciente
import {
  MyMealPlansScreen,
  MealPlanDetailsForPatientScreen,
  MealCheckInScreen,
  MyMeasurementsScreen,
  MyGoalsScreen,
} from "../screens/patient";

// Módulo 5 - Sistema de Agendamentos
import {
  AvailabilityConfigScreen,
  AvailabilitySetupWizard,
  WeeklyScheduleScreen,
  BlockedPeriodsScreen,
  AppointmentCalendarScreen,
  AppointmentFormScreen,
  AppointmentDetailsScreen,
} from "../screens/nutritionist/appointments";
import {
  PatientAppointmentsScreen,
  RequestAppointmentScreen,
  PatientAppointmentDetailsScreen,
} from "../screens/patient/appointments";
import { NutritionistAddressListScreen } from "../screens/nutritionist/profile/NutritionistAddressListScreen";
import { NutritionistAddressFormScreen } from "../screens/nutritionist/profile/NutritionistAddressFormScreen";

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
  Formulas: undefined;
  FormulaEditor: {
    formulaId?: string;
  };
  FormulaDetails: {
    formulaId: string;
  };
  CalculateFormula: {
    formulaId: string;
    patientId?: string;
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
  // Módulo 5 - Sistema de Agendamentos (Nutricionista)
  AppointmentCalendar: undefined;
  AvailabilityConfig: undefined;
  WeeklySchedule: undefined;
  BlockedPeriods: undefined;
  AppointmentForm: {
    appointmentId?: string;
    patientId?: string;
    mode?: "create" | "edit" | "reschedule";
  };
  AppointmentDetails: {
    appointmentId: string;
  };
  // Módulo 5 - Sistema de Agendamentos (Paciente)
  PatientAppointments: undefined;
  RequestAppointment: undefined;
  PatientAppointmentDetails: {
    appointmentId: string;
  };
  // Gerenciamento de Endereços (Nutricionista)
  NutritionistAddressList: undefined;
  NutritionistAddressForm: {
    addressId?: string;
    returnTo?: string;
  };
};

const Drawer = createDrawerNavigator<MainDrawerParamList>();

function createScreenWithHeader(
  Screen: React.ComponentType<any>,
  title: string | ((props: any) => string),
  showBackButton: boolean = false,
  backTo?: string | ((props: any) => string),
  headerRight?: (props: any) => React.ReactNode
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

    // HeaderRight dinâmico
    const dynamicHeaderRight = headerRight ? headerRight(props) : undefined;

    // BackTo dinâmico: pode ser string ou função
    const dynamicBackTo = typeof backTo === "function" ? backTo(props) : backTo;

    return (
      <>
        <CustomHeader
          title={dynamicTitle}
          navigation={navigation}
          isDrawerOpen={isDrawerOpen}
          showBackButton={showBackButton}
          backTo={dynamicBackTo}
          onBackPress={onBackPressCallback}
          headerRight={dynamicHeaderRight}
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
      {/* Fórmulas Personalizadas */}
      <Drawer.Screen
        name="Formulas"
        component={
          createScreenWithHeader(
            FormulasListScreen as any,
            "Fórmulas Personalizadas"
          ) as any
        }
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="FormulaEditor"
        component={FormulaEditorScreen as any}
        options={({ route }: any) => ({
          drawerItemStyle: { display: "none" },
          headerShown: true,
          title: route.params?.formulaId ? "Editar Fórmula" : "Nova Fórmula",
          headerBackTitle: "Voltar",
        })}
      />
      <Drawer.Screen
        name="FormulaDetails"
        component={
          createScreenWithHeader(
            FormulaDetailsScreen as any,
            "Detalhes da Fórmula",
            true,
            "Formulas"
          ) as any
        }
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="CalculateFormula"
        component={
          createScreenWithHeader(
            CalculateFormulaModal as any,
            "Calcular Fórmula",
            true,
            "Formulas"
          ) as any
        }
        options={{ drawerItemStyle: { display: "none" } }}
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

      {/* Módulo 5 - Sistema de Agendamentos (Nutricionista) */}
      <Drawer.Screen
        name="AppointmentCalendar"
        component={
          createScreenWithHeader(
            AppointmentCalendarScreen as any,
            "Agenda de Consultas"
          ) as any
        }
        options={{
          title: "Agenda",
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="AvailabilityConfig"
        component={
          createScreenWithHeader(
            AvailabilitySetupWizard as any,
            "Configurar Disponibilidade",
            true,
            "AppointmentCalendar"
          ) as any
        }
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="WeeklySchedule"
        component={
          createScreenWithHeader(
            WeeklyScheduleScreen as any,
            "Horários Semanais",
            true,
            "AppointmentCalendar"
          ) as any
        }
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="BlockedPeriods"
        component={
          createScreenWithHeader(
            BlockedPeriodsScreen as any,
            "Períodos Bloqueados",
            true,
            "AppointmentCalendar"
          ) as any
        }
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="AppointmentForm"
        component={
          createScreenWithHeader(
            AppointmentFormScreen as any,
            (props: any) => {
              const mode = props.route?.params?.mode;
              return mode === "edit"
                ? "Editar Consulta"
                : mode === "reschedule"
                ? "Reagendar Consulta"
                : "Nova Consulta";
            },
            true,
            "AppointmentCalendar"
          ) as any
        }
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="AppointmentDetails"
        component={
          createScreenWithHeader(
            AppointmentDetailsScreen as any,
            "Detalhes da Consulta",
            true,
            "AppointmentCalendar"
          ) as any
        }
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />

      {/* Módulo 5 - Sistema de Agendamentos (Paciente) */}
      <Drawer.Screen
        name="PatientAppointments"
        component={
          createScreenWithHeader(
            PatientAppointmentsScreen as any,
            "Minhas Consultas"
          ) as any
        }
        options={{
          title: "Minhas Consultas",
        }}
      />
      <Drawer.Screen
        name="RequestAppointment"
        component={
          createScreenWithHeader(
            RequestAppointmentScreen as any,
            "Solicitar Consulta",
            true,
            "PatientAppointments"
          ) as any
        }
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="PatientAppointmentDetails"
        component={
          createScreenWithHeader(
            PatientAppointmentDetailsScreen as any,
            "Detalhes da Consulta",
            true,
            "PatientAppointments"
          ) as any
        }
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />

      {/* Gerenciamento de Endereços (Nutricionista) */}
      <Drawer.Screen
        name="NutritionistAddressList"
        component={
          createScreenWithHeader(
            NutritionistAddressListScreen as any,
            "Meus Endereços",
            true,
            "EditProfile",
            (props: any) => (
              <TouchableOpacity
                style={{ padding: 8 }}
                onPress={() =>
                  props.navigation.navigate("NutritionistAddressForm")
                }
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={28} color="#fff" />
              </TouchableOpacity>
            )
          ) as any
        }
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="NutritionistAddressForm"
        component={
          createScreenWithHeader(
            NutritionistAddressFormScreen as any,
            (props: any) => {
              const addressId = props.route?.params?.addressId;
              return addressId ? "Editar Endereço" : "Novo Endereço";
            },
            true,
            (props: any) => {
              const returnTo = props.route?.params?.returnTo;
              return returnTo || "NutritionistAddressList";
            }
          ) as any
        }
        options={{
          drawerItemStyle: { display: "none" },
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
