export type UserRole = "normal" | "patient" | "nutritionist";

export type AuthProvider = "local" | "google";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  provider: AuthProvider;
  createdAt: string;
  updatedAt: string;
}

export interface NutritionistProfile {
  id: string;
  userId: string;
  crn: string;
  specialization?: string;
  bio?: string;
  avatarUrl?: string;
  phone?: string;
  isVerified: boolean;
}

export interface PatientProfile {
  id: string;
  userId: string;
  name: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  birthDate?: string;
  avatarUrl?: string;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role: UserRole;
  name?: string;
  crn?: string;
  phone?: string;
  invitationCode?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  success: false;
  message: string | string[];
  statusCode: number;
  timestamp?: string;
  path?: string;
}
