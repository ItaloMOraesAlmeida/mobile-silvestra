export enum DayOfWeek {
  SUNDAY = "SUNDAY",
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
}

export enum AppointmentType {
  FIRST_CONSULTATION = "FIRST_CONSULTATION",
  FOLLOW_UP = "FOLLOW_UP",
  ASSESSMENT = "ASSESSMENT",
}

export enum AppointmentStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  COMPLETED = "COMPLETED",
  CANCELLED_BY_PATIENT = "CANCELLED_BY_PATIENT",
  CANCELLED_BY_NUTRITIONIST = "CANCELLED_BY_NUTRITIONIST",
  NO_SHOW = "NO_SHOW",
  RESCHEDULED = "RESCHEDULED",
}

export interface AvailabilityConfig {
  id: string;
  nutritionistId: string;
  defaultDuration: number;
  bufferTime: number;
  allowSameDay: boolean;
  minAdvanceHours: number;
  maxAdvanceDays: number;
  cancellationPolicy?: string;
  createdAt: string;
  updatedAt: string;
  weeklySchedules: WeeklySchedule[];
  blockedPeriods: BlockedPeriod[];
}

export interface WeeklySchedule {
  id: string;
  configId: string;
  dayOfWeek: DayOfWeek;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  lunchBreak?: {
    start: string;
    end: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BlockedPeriod {
  id: string;
  configId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  isAllDay: boolean;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  nutritionistId: string;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  endTime?: string;
  isOnline: boolean;
  location?: string;
  meetingUrl?: string;
  meetingId?: string;
  meetingPass?: string;
  title?: string;
  description?: string;
  patientNotes?: string;
  nutritionistNotes?: string;
  price?: number;
  isPaid: boolean;
  confirmationSentAt?: string;
  reminder24hSentAt?: string;
  reminder1hSentAt?: string;
  originalAppointmentId?: string;
  rescheduledToId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  patient?: any;
  nutritionist?: any;
}

// DTOs
export interface CreateAvailabilityConfigDto {
  defaultDuration?: number;
  bufferTime?: number;
  allowSameDay?: boolean;
  minAdvanceHours?: number;
  maxAdvanceDays?: number;
  cancellationPolicy?: string;
}

export interface CreateWeeklyScheduleDto {
  dayOfWeek: DayOfWeek;
  isAvailable?: boolean;
  startTime: string;
  endTime: string;
  lunchBreak?: {
    start: string;
    end: string;
  };
}

export interface UpdateWeeklyScheduleDto {
  isAvailable?: boolean;
  startTime?: string;
  endTime?: string;
  lunchBreak?: {
    start: string;
    end: string;
  } | null;
}

export interface CreateBlockedPeriodDto {
  startDate: string;
  endDate: string;
  reason?: string;
  isAllDay?: boolean;
}

export interface CreateAppointmentDto {
  patientId: string;
  type: AppointmentType;
  scheduledDate: string;
  scheduledTime: string;
  duration?: number;
  isOnline?: boolean;
  location?: string;
  meetingUrl?: string;
  title?: string;
  description?: string;
  patientNotes?: string;
  price?: number;
}

export interface UpdateAppointmentStatusDto {
  status: AppointmentStatus;
  reason?: string;
}

export interface RescheduleAppointmentDto {
  scheduledDate: string;
  scheduledTime: string;
  reason?: string;
}

// Helpers
export const DayOfWeekLabels: Record<DayOfWeek, string> = {
  [DayOfWeek.SUNDAY]: "Domingo",
  [DayOfWeek.MONDAY]: "Segunda-feira",
  [DayOfWeek.TUESDAY]: "Terça-feira",
  [DayOfWeek.WEDNESDAY]: "Quarta-feira",
  [DayOfWeek.THURSDAY]: "Quinta-feira",
  [DayOfWeek.FRIDAY]: "Sexta-feira",
  [DayOfWeek.SATURDAY]: "Sábado",
};

export const DayOfWeekShort: Record<DayOfWeek, string> = {
  [DayOfWeek.SUNDAY]: "Dom",
  [DayOfWeek.MONDAY]: "Seg",
  [DayOfWeek.TUESDAY]: "Ter",
  [DayOfWeek.WEDNESDAY]: "Qua",
  [DayOfWeek.THURSDAY]: "Qui",
  [DayOfWeek.FRIDAY]: "Sex",
  [DayOfWeek.SATURDAY]: "Sáb",
};

export const AppointmentTypeLabels: Record<AppointmentType, string> = {
  [AppointmentType.FIRST_CONSULTATION]: "Primeira Consulta",
  [AppointmentType.FOLLOW_UP]: "Retorno",
  [AppointmentType.ASSESSMENT]: "Avaliação",
};

export const AppointmentStatusLabels: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: "Pendente",
  [AppointmentStatus.CONFIRMED]: "Confirmado",
  [AppointmentStatus.COMPLETED]: "Realizado",
  [AppointmentStatus.CANCELLED_BY_PATIENT]: "Cancelado pelo Paciente",
  [AppointmentStatus.CANCELLED_BY_NUTRITIONIST]: "Cancelado por Você",
  [AppointmentStatus.NO_SHOW]: "Paciente Faltou",
  [AppointmentStatus.RESCHEDULED]: "Reagendado",
};

export const AppointmentStatusColors: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: "#FFA500",
  [AppointmentStatus.CONFIRMED]: "#4CAF50",
  [AppointmentStatus.COMPLETED]: "#2196F3",
  [AppointmentStatus.CANCELLED_BY_PATIENT]: "#F44336",
  [AppointmentStatus.CANCELLED_BY_NUTRITIONIST]: "#F44336",
  [AppointmentStatus.NO_SHOW]: "#9E9E9E",
  [AppointmentStatus.RESCHEDULED]: "#FF9800",
};
