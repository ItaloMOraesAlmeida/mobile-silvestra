/**
 * Types para o módulo de Pacientes
 * Sincronizado com o backend NestJS
 */

// ========== CORE TYPES ==========

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  birthDate: Date;
  gender: Gender;
  height?: number; // cm
  weight?: number; // kg
  photo?: string; // URL
  nutritionistId: string;
  createdAt: Date;
  updatedAt: Date;

  // Campos calculados
  age?: number;
  bmi?: number;
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

// ========== DTOs PARA API ==========

export interface CreatePatientDto {
  name: string;
  email: string;
  phone?: string;
  birthDate: string; // ISO format
  gender: Gender;
  height?: number;
  weight?: number;
  photo?: string;
}

export interface UpdatePatientDto {
  name?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  gender?: Gender;
  height?: number;
  weight?: number;
  photo?: string;
}

export interface FilterPatientDto {
  search?: string;
  gender?: Gender;
  minAge?: number;
  maxAge?: number;
}

// ========== UI HELPERS ==========

export interface GenderInfo {
  value: Gender;
  label: string;
  icon: string;
  color: string;
}
