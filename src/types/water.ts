// ==================== SETTINGS ====================

export interface WaterSettings {
  id: string;
  userId: string;
  dailyGoal: number; // ml
  cupSize: number; // ml
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  interval: number; // minutes
  remindersEnabled: boolean;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateWaterSettingsDto {
  dailyGoal?: number;
  cupSize?: number;
  startTime?: string;
  endTime?: string;
  interval?: number;
  remindersEnabled?: boolean;
}

// ==================== LOGS ====================

export interface WaterLog {
  id: string;
  userId: string;
  amount: number; // ml
  consumedAt: string; // ISO datetime
  source: "APP" | "WIDGET" | "NOTIFICATION" | "LIVE_ACTIVITY";
  notes?: string;
  localId?: string;
  syncedAt?: string;
  createdAt: string;
}

export interface CreateWaterLogDto {
  amount: number;
  consumedAt?: string;
  source?: string;
  notes?: string;
  localId?: string;
}

export interface FilterWaterLogsDto {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface WaterLogsResponse {
  data: WaterLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// ==================== STATISTICS ====================

export interface DailyWaterStats {
  id: string;
  userId: string;
  date: string; // ISO date
  totalAmount: number;
  goalAmount: number;
  logCount: number;
  percentAchieved: number;
  goalAchieved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TodaySummary {
  date: string;
  goal: number;
  consumed: number;
  remaining: number;
  percent: number;
  goalAchieved: boolean;
  logs: {
    id: string;
    amount: number;
    time: string;
    source: string;
  }[];
}

export interface HistoryItem {
  date: string; // YYYY-MM-DD
  consumed: number;
  goal: number;
  percent: number;
  achieved: boolean;
  logCount: number;
}

// ==================== NUTRITIONIST ====================

export interface PatientWaterOverview {
  patientId: string;
  patientName: string;
  date: string;
  goal: number;
  consumed: number;
  remaining: number;
  percent: number;
  goalAchieved: boolean;
  logs: {
    id: string;
    amount: number;
    time: string;
    source: string;
  }[];
}

export interface WaterOverviewResponse {
  totalPatients: number;
  patientsAchievedGoal: number;
  averageProgress: number;
  patients: PatientWaterOverview[];
}

// ==================== OFFLINE SYNC ====================

export interface LocalWaterLog {
  localId: string;
  amount: number;
  consumedAt: string;
  source: string;
  notes?: string;
  synced: boolean;
  createdAt: string;
}

export interface SyncQueueItem {
  id: string;
  type: "CREATE_LOG" | "UPDATE_SETTINGS";
  data: any;
  attempts: number;
  lastAttempt?: string;
}
