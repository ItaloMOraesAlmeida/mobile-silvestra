/**
 * Service de API para Pacientes
 * Comunicação com o backend NestJS
 */

import { api } from "./api";
import type {
  Patient,
  CreatePatientDto,
  UpdatePatientDto,
  FilterPatientDto,
} from "../types/patient.types";

const PATIENTS_BASE_URL = "/patients";

/**
 * Buscar todos os pacientes (com filtros opcionais)
 */
export const getPatients = async (
  filters?: FilterPatientDto
): Promise<Patient[]> => {
  const params = new URLSearchParams();

  if (filters?.search) params.append("search", filters.search);
  if (filters?.gender) params.append("gender", filters.gender);
  if (filters?.minAge) params.append("minAge", filters.minAge.toString());
  if (filters?.maxAge) params.append("maxAge", filters.maxAge.toString());

  const queryString = params.toString();
  const url = queryString
    ? `${PATIENTS_BASE_URL}?${queryString}`
    : PATIENTS_BASE_URL;

  return await api.get<Patient[]>(url);
};

/**
 * Buscar paciente por ID
 */
export const getPatientById = async (id: string): Promise<Patient> => {
  return await api.get<Patient>(`${PATIENTS_BASE_URL}/${id}`);
};

/**
 * Criar novo paciente
 */
export const createPatient = async (
  data: CreatePatientDto
): Promise<Patient> => {
  return await api.post<Patient>(PATIENTS_BASE_URL, data);
};

/**
 * Atualizar paciente existente
 */
export const updatePatient = async (
  id: string,
  data: UpdatePatientDto
): Promise<Patient> => {
  return await api.put<Patient>(`${PATIENTS_BASE_URL}/${id}`, data);
};

/**
 * Deletar paciente
 */
export const deletePatient = async (id: string): Promise<void> => {
  await api.delete(`${PATIENTS_BASE_URL}/${id}`);
};

/**
 * Upload de foto do paciente
 */
export const uploadPatientPhoto = async (
  patientId: string,
  photoUri: string
): Promise<string> => {
  const formData = new FormData();
  formData.append("file", {
    uri: photoUri,
    type: "image/jpeg",
    name: "patient_photo.jpg",
  } as any);

  const response = await api.post<{ url: string }>(
    `${PATIENTS_BASE_URL}/${patientId}/photo`,
    formData
  );

  return response.url;
};
