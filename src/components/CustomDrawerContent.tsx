import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../stores/auth.store";
import { useAvatar } from "../hooks/use-avatar";
import { LinearGradient } from "expo-linear-gradient";
import { lightTheme } from "../theme";
import { getPatientMealPlans } from "../services/meal-consumption.service";
import appointmentsService from "../services/appointments/appointments.service";

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState({
    appointments: 0,
    plans: 0,
    adherence: 0,
  });

  // Helper para verificar se uma rota está ativa
  const isRouteActive = (routeName: string) => {
    const currentRoute = props.state.routes[props.state.index];
    return currentRoute.name === routeName;
  };

  // Extrair a KEY do avatar (agora sempre está em user.avatarUrl)
  const getAvatarKey = (): string | null => {
    return user?.avatarUrl || null;
  };

  // Hook que gerencia cache e busca da URL assinada
  const { avatarUrl } = useAvatar(getAvatarKey());

  // Extrai iniciais do nome do usuário
  const getInitials = () => {
    if (user?.name) {
      const names = user.name.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    // Fallback para email
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const getUserName = () => {
    return user?.name || "Usuário";
  };

  const getRoleName = () => {
    const r = String(user?.role || "").toLowerCase();
    switch (r) {
      case "patient":
      case "paciente":
        return "Paciente";
      case "nutritionist":
      case "nutricionista":
        return "Nutricionista";
      case "normal":
        return "Usuário";
      default:
        return "Usuário";
    }
  };

  // Helper para verificar role (já normalizado para lowercase)
  const isNutritionist = () => {
    const r = String(user?.role || "").toLowerCase();
    return r === "nutritionist" || r === "nutricionista";
  };

  const isPatient = () => {
    const r = String(user?.role || "").toLowerCase();
    return r === "patient" || r === "paciente";
  };

  const getRoleIcon = () => {
    const r = String(user?.role || "").toLowerCase();
    switch (r) {
      case "patient":
      case "paciente":
        return "person";
      case "nutritionist":
      case "nutricionista":
        return "medical";
      case "normal":
      default:
        return "person-circle";
    }
  };

  const formatMemberSince = () => {
    if (!user?.createdAt) return "";
    const date = new Date(user.createdAt);
    return `Membro desde ${date.toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
    })}`;
  };

  // Carregar estatísticas do paciente
  useEffect(() => {
    const loadPatientStats = async () => {
      if (!isPatient()) return;

      // Obter o ID do paciente associado ao usuário
      const patientId = user?.patientProfile?.patients?.[0]?.id;
      if (!patientId) return;

      try {
        // Buscar consultas
        const appointments = await appointmentsService.findMyAppointments();
        const totalAppointments = appointments.length;

        // Buscar planos alimentares
        const plansData = await getPatientMealPlans(patientId);
        const totalPlans = plansData.plans?.length || 0;

        // Buscar adesão do plano ativo
        const activePlan = plansData.plans?.find(
          (p: any) => p.status === "ACTIVE"
        );
        const adherence = activePlan?.progress || 0;

        setStats({
          appointments: totalAppointments,
          plans: totalPlans,
          adherence: Math.round(adherence),
        });
      } catch (error) {
        console.error("Erro ao carregar estatísticas do drawer:", error);
      }
    };

    loadPatientStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.patientProfile?.patients]);

  return (
    <View style={styles.container}>
      {/* Header do Drawer com Gradiente */}
      <LinearGradient
        colors={[
          lightTheme.colors.primary,
          lightTheme.colors.primaryDark,
          lightTheme.colors.primaryDarker,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Avatar com iniciais e badge de status */}
        <View style={styles.avatarWrapper}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <LinearGradient
              colors={[lightTheme.colors.white, lightTheme.colors.white]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </LinearGradient>
          )}
          {/* Badge de status online */}
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
          </View>
        </View>

        {/* Informações do Usuário */}
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {getUserName()}
          </Text>

          {/* Badge de Role - Só aparece para PATIENT e NUTRITIONIST */}
          {(isPatient() || isNutritionist()) && (
            <View style={styles.roleBadge}>
              <Ionicons
                name={getRoleIcon()}
                size={10}
                color={lightTheme.colors.white}
                style={styles.roleBadgeIcon}
              />
              <Text style={styles.roleBadgeText}>{getRoleName()}</Text>
            </View>
          )}

          {/* Email */}
          <Text style={styles.userEmail} numberOfLines={1}>
            {user?.email}
          </Text>

          {/* Membro desde */}
          <Text style={styles.memberSince}>{formatMemberSince()}</Text>
        </View>

        {/* Estatísticas rápidas (opcional) */}
        {isPatient() && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons
                name="calendar"
                size={18}
                color={lightTheme.colors.white}
              />
              <Text style={styles.statValue} numberOfLines={1}>
                {stats.appointments}
              </Text>
              <Text style={styles.statLabel} numberOfLines={1}>
                Consultas
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons
                name="nutrition"
                size={18}
                color={lightTheme.colors.white}
              />
              <Text style={styles.statValue} numberOfLines={1}>
                {stats.plans}
              </Text>
              <Text style={styles.statLabel} numberOfLines={1}>
                Planos
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons
                name="trophy"
                size={18}
                color={lightTheme.colors.white}
              />
              <Text style={styles.statValue} numberOfLines={1}>
                {stats.adherence}%
              </Text>
              <Text style={styles.statLabel} numberOfLines={1}>
                Adesão
              </Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Menu Items */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.drawerContent}
      >
        {/* Início */}
        <TouchableOpacity
          style={[
            styles.drawerItem,
            isRouteActive("Home") && styles.drawerItemActive,
          ]}
          onPress={() => props.navigation.navigate("Home")}
        >
          <Ionicons
            name="home"
            size={24}
            color={
              isRouteActive("Home")
                ? lightTheme.colors.primary
                : lightTheme.colors.gray[500]
            }
            style={styles.drawerIcon}
          />
          <Text
            style={[
              styles.drawerLabel,
              isRouteActive("Home") && styles.drawerLabelActive,
            ]}
          >
            Início
          </Text>
        </TouchableOpacity>

        {/* Perfil */}
        <TouchableOpacity
          style={[
            styles.drawerItem,
            isRouteActive("Profile") && styles.drawerItemActive,
          ]}
          onPress={() => props.navigation.navigate("Profile")}
        >
          <Ionicons
            name="person-outline"
            size={24}
            color={
              isRouteActive("Profile")
                ? lightTheme.colors.primary
                : lightTheme.colors.gray[500]
            }
            style={styles.drawerIcon}
          />
          <Text
            style={[
              styles.drawerLabel,
              isRouteActive("Profile") && styles.drawerLabelActive,
            ]}
          >
            Perfil
          </Text>
        </TouchableOpacity>

        {/* Grupo Pacientes - SÓ PARA NUTRICIONISTA */}
        {isNutritionist() && (
          <>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>Pacientes</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.groupItem,
                isRouteActive("Patients") && styles.drawerItemActive,
              ]}
              onPress={() => props.navigation.navigate("Patients")}
            >
              <Ionicons
                name="people"
                size={18}
                color={
                  isRouteActive("Patients")
                    ? lightTheme.colors.primary
                    : lightTheme.colors.gray[500]
                }
                style={styles.drawerIcon}
              />
              <Text
                style={[
                  styles.drawerLabel,
                  isRouteActive("Patients") && styles.drawerLabelActive,
                ]}
              >
                Lista de Pacientes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.groupItem,
                isRouteActive("PatientCreate") && styles.drawerItemActive,
              ]}
              onPress={() => props.navigation.navigate("PatientCreate")}
            >
              <Ionicons
                name="person-add"
                size={18}
                color={
                  isRouteActive("PatientCreate")
                    ? lightTheme.colors.primary
                    : lightTheme.colors.gray[500]
                }
                style={styles.drawerIcon}
              />
              <Text
                style={[
                  styles.drawerLabel,
                  isRouteActive("PatientCreate") && styles.drawerLabelActive,
                ]}
              >
                Novo Paciente
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Grupo Nutrição - SÓ PARA PACIENTE */}
        {isPatient() && (
          <>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>Nutrição</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.groupItem,
                isRouteActive("MyMealPlans") && styles.drawerItemActive,
              ]}
              onPress={() => props.navigation.navigate("MyMealPlans")}
            >
              <Ionicons
                name="nutrition"
                size={18}
                color={
                  isRouteActive("MyMealPlans")
                    ? lightTheme.colors.primary
                    : lightTheme.colors.gray[500]
                }
                style={styles.drawerIcon}
              />
              <Text
                style={[
                  styles.drawerLabel,
                  isRouteActive("MyMealPlans") && styles.drawerLabelActive,
                ]}
              >
                Meus Planos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.groupItem,
                isRouteActive("FoodDatabase") && styles.drawerItemActive,
              ]}
              onPress={() => props.navigation.navigate("FoodDatabase")}
            >
              <Ionicons
                name="fast-food"
                size={18}
                color={
                  isRouteActive("FoodDatabase")
                    ? lightTheme.colors.primary
                    : lightTheme.colors.gray[500]
                }
                style={styles.drawerIcon}
              />
              <Text
                style={[
                  styles.drawerLabel,
                  isRouteActive("FoodDatabase") && styles.drawerLabelActive,
                ]}
              >
                Alimentos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.groupItem,
                isRouteActive("FoodFavorites") && styles.drawerItemActive,
              ]}
              onPress={() => props.navigation.navigate("FoodFavorites")}
            >
              <Ionicons
                name="star"
                size={18}
                color={
                  isRouteActive("FoodFavorites")
                    ? lightTheme.colors.primary
                    : lightTheme.colors.gray[500]
                }
                style={styles.drawerIcon}
              />
              <Text
                style={[
                  styles.drawerLabel,
                  isRouteActive("FoodFavorites") && styles.drawerLabelActive,
                ]}
              >
                Favoritos
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Grupo Saúde - SÓ PARA PACIENTE */}
        {isPatient() && (
          <>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>Saúde</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.groupItem,
                isRouteActive("MyMeasurements") && styles.drawerItemActive,
              ]}
              onPress={() => props.navigation.navigate("MyMeasurements")}
            >
              <Ionicons
                name="fitness"
                size={18}
                color={
                  isRouteActive("MyMeasurements")
                    ? lightTheme.colors.primary
                    : lightTheme.colors.gray[500]
                }
                style={styles.drawerIcon}
              />
              <Text
                style={[
                  styles.drawerLabel,
                  isRouteActive("MyMeasurements") && styles.drawerLabelActive,
                ]}
              >
                Minhas Medições
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.groupItem,
                isRouteActive("MyGoals") && styles.drawerItemActive,
              ]}
              onPress={() => props.navigation.navigate("MyGoals")}
            >
              <Ionicons
                name="trophy"
                size={18}
                color={
                  isRouteActive("MyGoals")
                    ? lightTheme.colors.primary
                    : lightTheme.colors.gray[500]
                }
                style={styles.drawerIcon}
              />
              <Text
                style={[
                  styles.drawerLabel,
                  isRouteActive("MyGoals") && styles.drawerLabelActive,
                ]}
              >
                Minhas Metas
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.groupItem,
                isRouteActive("WaterDashboard") && styles.drawerItemActive,
              ]}
              onPress={() => props.navigation.navigate("WaterDashboard")}
            >
              <Ionicons
                name="water"
                size={18}
                color={
                  isRouteActive("WaterDashboard")
                    ? lightTheme.colors.primary
                    : lightTheme.colors.gray[500]
                }
                style={styles.drawerIcon}
              />
              <Text
                style={[
                  styles.drawerLabel,
                  isRouteActive("WaterDashboard") && styles.drawerLabelActive,
                ]}
              >
                Hidratação
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Grupo Consultas - SÓ PARA PACIENTE */}
        {isPatient() && (
          <>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>Consultas</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.groupItem,
                isRouteActive("PatientAppointments") && styles.drawerItemActive,
              ]}
              onPress={() => props.navigation.navigate("PatientAppointments")}
            >
              <Ionicons
                name="calendar"
                size={18}
                color={
                  isRouteActive("PatientAppointments")
                    ? lightTheme.colors.primary
                    : lightTheme.colors.gray[500]
                }
                style={styles.drawerIcon}
              />
              <Text
                style={[
                  styles.drawerLabel,
                  isRouteActive("PatientAppointments") &&
                    styles.drawerLabelActive,
                ]}
              >
                Minhas Consultas
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Grupo Ferramentas - SÓ PARA NUTRICIONISTA */}
        {isNutritionist() && (
          <>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>Ferramentas</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.groupItem,
                isRouteActive("FoodDatabase") && styles.drawerItemActive,
              ]}
              onPress={() => props.navigation.navigate("FoodDatabase")}
            >
              <Ionicons
                name="fast-food"
                size={18}
                color={
                  isRouteActive("FoodDatabase")
                    ? lightTheme.colors.primary
                    : lightTheme.colors.gray[500]
                }
                style={styles.drawerIcon}
              />
              <Text
                style={[
                  styles.drawerLabel,
                  isRouteActive("FoodDatabase") && styles.drawerLabelActive,
                ]}
              >
                Banco de Alimentos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.groupItem,
                isRouteActive("FoodFavorites") && styles.drawerItemActive,
              ]}
              onPress={() => props.navigation.navigate("FoodFavorites")}
            >
              <Ionicons
                name="star"
                size={18}
                color={
                  isRouteActive("FoodFavorites")
                    ? lightTheme.colors.primary
                    : lightTheme.colors.gray[500]
                }
                style={styles.drawerIcon}
              />
              <Text
                style={[
                  styles.drawerLabel,
                  isRouteActive("FoodFavorites") && styles.drawerLabelActive,
                ]}
              >
                Favoritos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.groupItem,
                isRouteActive("ReportList") && styles.drawerItemActive,
              ]}
              onPress={() => props.navigation.navigate("ReportList")}
            >
              <Ionicons
                name="document-text"
                size={18}
                color={
                  isRouteActive("ReportList")
                    ? lightTheme.colors.primary
                    : lightTheme.colors.gray[500]
                }
                style={styles.drawerIcon}
              />
              <Text
                style={[
                  styles.drawerLabel,
                  isRouteActive("ReportList") && styles.drawerLabelActive,
                ]}
              >
                Relatórios
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.groupItem,
                isRouteActive("Formulas") && styles.drawerItemActive,
              ]}
              onPress={() => props.navigation.navigate("Formulas")}
            >
              <Ionicons
                name="calculator"
                size={18}
                color={
                  isRouteActive("Formulas")
                    ? lightTheme.colors.primary
                    : lightTheme.colors.gray[500]
                }
                style={styles.drawerIcon}
              />
              <Text
                style={[
                  styles.drawerLabel,
                  isRouteActive("Formulas") && styles.drawerLabelActive,
                ]}
              >
                Fórmulas Personalizadas
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Grupo Agendamento - SÓ PARA NUTRICIONISTA */}
        {isNutritionist() && (
          <>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>Consulta</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.groupItem,
                isRouteActive("AppointmentCalendar") && styles.drawerItemActive,
              ]}
              onPress={() => props.navigation.navigate("AppointmentCalendar")}
            >
              <Ionicons
                name="calendar"
                size={18}
                color={
                  isRouteActive("AppointmentCalendar")
                    ? lightTheme.colors.primary
                    : lightTheme.colors.gray[500]
                }
                style={styles.drawerIcon}
              />
              <Text
                style={[
                  styles.drawerLabel,
                  isRouteActive("AppointmentCalendar") &&
                    styles.drawerLabelActive,
                ]}
              >
                Agenda de Consultas
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.groupItem,
                isRouteActive("AvailabilityConfig") && styles.drawerItemActive,
              ]}
              onPress={() => props.navigation.navigate("AvailabilityConfig")}
            >
              <Ionicons
                name="settings-outline"
                size={18}
                color={
                  isRouteActive("AvailabilityConfig")
                    ? lightTheme.colors.primary
                    : lightTheme.colors.gray[500]
                }
                style={styles.drawerIcon}
              />
              <Text
                style={[
                  styles.drawerLabel,
                  isRouteActive("AvailabilityConfig") &&
                    styles.drawerLabelActive,
                ]}
              >
                Configurar Disponibilidade
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Configurações */}
        <TouchableOpacity
          style={[
            styles.drawerItem,
            isRouteActive("Settings") && styles.drawerItemActive,
          ]}
          onPress={() => props.navigation.navigate("Settings")}
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color={
              isRouteActive("Settings")
                ? lightTheme.colors.primary
                : lightTheme.colors.gray[500]
            }
            style={styles.drawerIcon}
          />
          <Text
            style={[
              styles.drawerLabel,
              isRouteActive("Settings") && styles.drawerLabelActive,
            ]}
          >
            Configurações
          </Text>
        </TouchableOpacity>
      </DrawerContentScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.white,
  },
  header: {
    paddingTop: lightTheme.spacing.xl,
    paddingBottom: lightTheme.spacing.lg,
    paddingHorizontal: lightTheme.spacing.lg,
    alignItems: "flex-start",
  },
  // Avatar e Wrapper
  avatarWrapper: {
    alignSelf: "flex-start",
    marginBottom: lightTheme.spacing.sm,
    position: "relative",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: lightTheme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    ...lightTheme.shadows.sm,
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: lightTheme.borderRadius.full,
    ...lightTheme.shadows.sm,
  },
  avatarText: {
    fontSize: lightTheme.typography.fontSize["3xl"],
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.primary,
  },
  // Status Badge Online
  statusBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.full,
    padding: 2,
    ...lightTheme.shadows.sm,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: lightTheme.borderRadius.full,
    backgroundColor: lightTheme.colors.success,
  },
  // Informações do Usuário
  userInfo: {
    alignItems: "flex-start",
    width: "100%",
    paddingHorizontal: 0,
  },
  userName: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold,
    color: lightTheme.colors.white,
    marginBottom: lightTheme.spacing.xs,
    textAlign: "left",
    maxWidth: "90%",
  },
  // Badge de Role
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.primaryLight,
    paddingHorizontal: lightTheme.spacing.sm,
    paddingVertical: 3,
    borderRadius: lightTheme.borderRadius.full,
    marginBottom: lightTheme.spacing.xs,
    alignSelf: "flex-start",
    opacity: 0.8,
  },
  roleBadgeIcon: {
    marginRight: 3,
  },
  roleBadgeText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  userEmail: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.white,
    textAlign: "left",
    maxWidth: "90%",
    opacity: 0.85,
  },
  memberSince: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.white,
    textAlign: "left",
    marginTop: lightTheme.spacing.xs,
    opacity: 0.75,
  },
  // Estatísticas
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: lightTheme.borderRadius.lg,
    paddingVertical: lightTheme.spacing.md,
    paddingHorizontal: lightTheme.spacing.xs,
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: lightTheme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    minWidth: 0,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: lightTheme.colors.white,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: lightTheme.colors.white,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    marginHorizontal: 4,
  },
  // Divider e Conteúdo do Drawer
  divider: {
    height: 1,
    backgroundColor: lightTheme.colors.gray[200],
    marginVertical: lightTheme.spacing.sm,
  },
  drawerContent: {
    paddingTop: lightTheme.spacing.sm,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: lightTheme.spacing.md,
    paddingHorizontal: lightTheme.spacing.lg - 4,
    marginHorizontal: lightTheme.spacing.md - 4,
    marginBottom: lightTheme.spacing.xs,
    borderRadius: lightTheme.borderRadius.md,
    backgroundColor: lightTheme.colors.transparent,
  },
  drawerItemActive: {
    backgroundColor: lightTheme.colors.primaryBackground,
  },
  drawerIcon: {
    marginRight: lightTheme.spacing.md,
  },
  drawerLabel: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[500],
    fontWeight: lightTheme.typography.fontWeight.medium,
  },
  drawerLabelActive: {
    color: lightTheme.colors.primary,
    fontWeight: lightTheme.typography.fontWeight.semibold,
  },
  groupHeader: {
    paddingHorizontal: lightTheme.spacing.lg - 4,
    marginTop: lightTheme.spacing.lg,
    marginBottom: lightTheme.spacing.xs,
    paddingVertical: lightTheme.spacing.xs,
  },
  groupTitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[700],
    fontWeight: lightTheme.typography.fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: lightTheme.spacing.sm,
    paddingHorizontal: lightTheme.spacing.lg + 8,
    marginHorizontal: lightTheme.spacing.md - 4,
    marginBottom: lightTheme.spacing.xs,
    borderRadius: lightTheme.borderRadius.md,
    backgroundColor: lightTheme.colors.transparent,
    borderLeftWidth: 2,
    borderLeftColor: lightTheme.colors.gray[200],
    marginLeft: lightTheme.spacing.lg + 4,
  },
});
