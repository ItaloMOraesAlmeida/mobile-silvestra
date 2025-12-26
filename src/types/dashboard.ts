/**
 * Tipos para Dashboard do Nutricionista
 */

export enum DashboardPeriod {
  TODAY = "today",
  WEEK = "week",
  MONTH = "month",
  QUARTER = "quarter",
  YEAR = "year",
}

export interface DashboardOverview {
  totalPatients: number;
  activePatients: number;
  averageAdherence: number;
  todayAppointments: number;
  weekAppointments: number;
  upcomingAppointments: number;
}

export interface PatientAlert {
  id: string;
  name: string;
  avatarUrl?: string;
  alertType: "no_checkin" | "goal_deadline" | "plan_expiring";
  message: string;
  daysSinceActivity?: number;
}

export interface DashboardAlerts {
  inactivePatients: PatientAlert[];
  upcomingDeadlines: {
    patientId: string;
    patientName: string;
    goalType: string;
    daysUntilDeadline: number;
  }[];
  expiringPlans: {
    patientId: string;
    patientName: string;
    planName: string;
    daysUntilExpiration: number;
  }[];
  pendingReviews: number;
}

export interface PerformanceData {
  labels: string[];
  values: number[];
  averageAdherence: number;
  bestDay?: {
    day: string;
    value: number;
  };
  worstDay?: {
    day: string;
    value: number;
  };
}

export interface PatientPerformance {
  patientId: string;
  patientName: string;
  avatarUrl?: string;
  adherenceRate: number;
  goalsAchieved: number;
  totalGoals: number;
}

export interface TopPerformers {
  topPerformers: PatientPerformance[];
  needsSupport: PatientPerformance[];
}

export interface DashboardStatistics {
  activeGoals: number;
  completedGoals: number;
  activePlans: number;
  totalAppointments: number;
  completedAppointments: number;
  weeklyCheckIns: number;
  successRate: number;
  averageRating: number;
}

export interface GoalsProgress {
  byType: {
    type: string; // Tipo da meta (WEIGHT, WAIST_CIRC, etc)
    completed: number; // Metas concluídas
    total: number; // Total de metas
    percentage: number; // Percentual de conclusão
  }[];
}

export interface DashboardInsight {
  type: "warning" | "success" | "info";
  message: string;
  action?: string;
  actionLink?: string;
}

export interface DashboardInsights {
  insights: DashboardInsight[];
}

export interface ActivePatient {
  id: string;
  name: string;
  avatarUrl?: string;
  adherence: number;
  lastConsultation?: string;
  currentGoal?: {
    type: string;
    target: number;
    current: number;
    progress: number;
    unit: string;
  };
  needsAttention: boolean;
}

export interface ActivePatientsList {
  patients: ActivePatient[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
