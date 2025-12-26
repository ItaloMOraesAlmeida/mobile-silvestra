// ============================================
// ENUMS
// ============================================

export enum ActivityLevel {
  SEDENTARY = "SEDENTARY",
  LIGHTLY_ACTIVE = "LIGHTLY_ACTIVE",
  MODERATELY_ACTIVE = "MODERATELY_ACTIVE",
  VERY_ACTIVE = "VERY_ACTIVE",
  EXTREMELY_ACTIVE = "EXTREMELY_ACTIVE",
}

export enum SleepQuality {
  POOR = "POOR",
  FAIR = "FAIR",
  GOOD = "GOOD",
  EXCELLENT = "EXCELLENT",
}

export enum StressLevel {
  LOW = "LOW",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
}

export enum AlcoholLevel {
  NONE = "NONE",
  OCCASIONAL = "OCCASIONAL",
  MODERATE = "MODERATE",
  FREQUENT = "FREQUENT",
}

export enum GoalType {
  WEIGHT = "WEIGHT",
  BODY_FAT = "BODY_FAT",
  MUSCLE_MASS = "MUSCLE_MASS",
  WAIST_CIRC = "WAIST_CIRC",
  OTHER = "OTHER",
}

// ============================================
// BODY MEASUREMENT
// ============================================

export interface BodyMeasurement {
  id: string;
  patientId: string;
  weight: number;
  height: number;
  bmi: number;

  // Circunferências (cm)
  neckCirc?: number | null;
  shoulderCirc?: number | null;
  rightArmCirc?: number | null;
  leftArmCirc?: number | null;
  forearmCirc?: number | null;
  chestCirc?: number | null;
  waistCirc?: number | null;
  abdomenCirc?: number | null;
  hipCirc?: number | null;
  thighCirc?: number | null;
  calfCirc?: number | null;

  // Dobras cutâneas - Protocolo Pollock (mm)
  tricepsSkinfold?: number | null;
  subscapularSkinfold?: number | null;
  pectoralSkinfold?: number | null;
  midaxillarySkinfold?: number | null;
  suprailiacSkinfold?: number | null;
  abdominalSkinfold?: number | null;
  thighSkinfold?: number | null;

  // Composição corporal
  bodyFatPercent?: number | null;
  muscleMass?: number | null;
  fatMass?: number | null;

  // Fotos de progresso
  photoFront?: string | null;
  photoSide?: string | null;
  photoBack?: string | null;

  // Observações
  notes?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateBodyMeasurementDto {
  weight: number;
  height: number;
  neckCirc?: number;
  shoulderCirc?: number;
  rightArmCirc?: number;
  leftArmCirc?: number;
  forearmCirc?: number;
  chestCirc?: number;
  waistCirc?: number;
  abdomenCirc?: number;
  hipCirc?: number;
  thighCirc?: number;
  calfCirc?: number;
  tricepsSkinfold?: number;
  subscapularSkinfold?: number;
  pectoralSkinfold?: number;
  midaxillarySkinfold?: number;
  suprailiacSkinfold?: number;
  abdominalSkinfold?: number;
  thighSkinfold?: number;
  bodyFatPercent?: number;
  muscleMass?: number;
  fatMass?: number;
  photoFront?: string;
  photoSide?: string;
  photoBack?: string;
  notes?: string;
}

export type UpdateBodyMeasurementDto = Partial<CreateBodyMeasurementDto>;

export interface MeasurementChange {
  absolute: number;
  percentage: number;
}

export interface CompareMeasurementsResponse {
  period: {
    from: string;
    to: string;
  };
  first: BodyMeasurement;
  last: BodyMeasurement;
  changes: {
    weight: MeasurementChange;
    bmi: MeasurementChange;
    bodyFatPercent?: MeasurementChange;
    muscleMass?: MeasurementChange;
    waistCirc?: MeasurementChange;
    hipCirc?: MeasurementChange;
  };
}

export interface EvolutionDataPoint {
  value: number;
  date: string;
}

export interface EvolutionResponse {
  metric:
    | "weight"
    | "bmi"
    | "bodyFatPercent"
    | "muscleMass"
    | "waistCirc"
    | "hipCirc";
  period: "1m" | "3m" | "6m" | "1y" | "all";
  data: EvolutionDataPoint[];
}

// ============================================
// HEALTH INFO
// ============================================

export interface HealthInfo {
  id: string;
  patientId: string;

  // Histórico médico
  medicalConditions: string[];
  allergies: string[];
  medications: string[];
  surgeries: string[];
  familyHistory: string[];

  // Restrições alimentares
  dietaryRestrictions: string[];
  foodIntolerances: string[];

  // Lifestyle
  activityLevel?: ActivityLevel | null;
  sleepQuality?: SleepQuality | null;
  stressLevel?: StressLevel | null;
  smoker?: boolean | null;
  alcoholConsumption?: AlcoholLevel | null;

  // Goals
  primaryGoal?: string | null;
  secondaryGoals: string[];

  createdAt: string;
  updatedAt: string;
}

export interface UpdateHealthInfoDto {
  medicalConditions?: string[];
  allergies?: string[];
  medications?: string[];
  surgeries?: string[];
  familyHistory?: string[];
  dietaryRestrictions?: string[];
  foodIntolerances?: string[];
  activityLevel?: ActivityLevel;
  sleepQuality?: SleepQuality;
  stressLevel?: StressLevel;
  smoker?: boolean;
  alcoholConsumption?: AlcoholLevel;
  primaryGoal?: string;
  secondaryGoals?: string[];
}

export type HealthInfoSection =
  | "medicalConditions"
  | "allergies"
  | "medications"
  | "surgeries"
  | "familyHistory"
  | "dietaryRestrictions"
  | "foodIntolerances"
  | "lifestyle"
  | "goals";

export interface UpdateHealthInfoSectionDto {
  section: HealthInfoSection;
  data: unknown;
}

// ============================================
// GOAL
// ============================================

export interface Goal {
  id: string;
  patientId: string;
  name: string;
  type: GoalType;
  target: number;
  current: number | null;
  unit: string;
  deadline?: string | null;
  notes?: string | null;
  achieved: boolean;
  achievedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalDto {
  name: string;
  type: GoalType;
  target: number;
  current?: number;
  unit: string;
  deadline?: string;
  notes?: string;
}

export type UpdateGoalDto = Partial<CreateGoalDto>;

export interface AchieveGoalDto {
  current: number;
}

export interface GoalWithProgress extends Goal {
  individualProgress: number;
}

export interface GoalsProgressResponse {
  totalGoals: number;
  achievedGoals: number;
  activeGoals: number;
  progressPercentage: number;
  goals: GoalWithProgress[];
}

// ============================================
// API RESPONSES
// ============================================

export interface PaginatedMeasurementsResponse {
  data: BodyMeasurement[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// LABELS PARA UI
// ============================================

export const ActivityLevelLabels: Record<ActivityLevel, string> = {
  [ActivityLevel.SEDENTARY]: "Sedentário",
  [ActivityLevel.LIGHTLY_ACTIVE]: "Levemente Ativo",
  [ActivityLevel.MODERATELY_ACTIVE]: "Moderadamente Ativo",
  [ActivityLevel.VERY_ACTIVE]: "Muito Ativo",
  [ActivityLevel.EXTREMELY_ACTIVE]: "Extremamente Ativo",
};

export const SleepQualityLabels: Record<SleepQuality, string> = {
  [SleepQuality.POOR]: "Ruim",
  [SleepQuality.FAIR]: "Regular",
  [SleepQuality.GOOD]: "Bom",
  [SleepQuality.EXCELLENT]: "Excelente",
};

export const StressLevelLabels: Record<StressLevel, string> = {
  [StressLevel.LOW]: "Baixo",
  [StressLevel.MODERATE]: "Moderado",
  [StressLevel.HIGH]: "Alto",
};

export const AlcoholLevelLabels: Record<AlcoholLevel, string> = {
  [AlcoholLevel.NONE]: "Não Consome",
  [AlcoholLevel.OCCASIONAL]: "Ocasional",
  [AlcoholLevel.MODERATE]: "Moderado",
  [AlcoholLevel.FREQUENT]: "Frequente",
};

export const GoalTypeLabels: Record<GoalType, string> = {
  [GoalType.WEIGHT]: "Peso",
  [GoalType.BODY_FAT]: "Gordura Corporal",
  [GoalType.MUSCLE_MASS]: "Massa Muscular",
  [GoalType.WAIST_CIRC]: "Circunferência da Cintura",
  [GoalType.OTHER]: "Outro",
};
