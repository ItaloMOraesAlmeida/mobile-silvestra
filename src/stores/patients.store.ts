/**
 * Zustand Store para Pacientes
 *
 * Gerencia estado de pacientes com cache e filtros
 */

import { create } from "zustand";
import type {
  Patient,
  CreatePatientDto,
  UpdatePatientDto,
  FilterPatientDto,
} from "../types/patient.types";
import * as patientService from "../services/patient.service";

interface PatientsState {
  // ===== STATE =====
  patients: Patient[];
  selectedPatient: Patient | null;

  // UI state
  loading: boolean;
  error: string | null;

  // Filtros
  activeFilters: FilterPatientDto;

  // Cache
  cache: Map<string, { data: Patient; timestamp: number }>;
  cacheTTL: number; // 5 minutos

  // ===== ACTIONS - PATIENTS =====
  loadPatients: (filters?: FilterPatientDto) => Promise<void>;
  loadPatientById: (id: string, forceRefresh?: boolean) => Promise<void>;
  createPatient: (data: CreatePatientDto) => Promise<Patient>;
  updatePatient: (id: string, data: UpdatePatientDto) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  uploadPhoto: (patientId: string, photoUri: string) => Promise<void>;
  setSelectedPatient: (patient: Patient | null) => void;
  setActiveFilters: (filters: FilterPatientDto) => void;
  clearFilters: () => void;

  // ===== UTILS =====
  clearCache: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const usePatientsStore = create<PatientsState>((set, get) => ({
  // ===== INITIAL STATE =====
  patients: [],
  selectedPatient: null,
  loading: false,
  error: null,
  activeFilters: {},
  cache: new Map(),
  cacheTTL: 5 * 60 * 1000, // 5 minutos

  // ===== ACTIONS =====

  loadPatients: async (filters?: FilterPatientDto) => {
    set({ loading: true, error: null });
    try {
      const patients = await patientService.getPatients(filters);
      set({
        patients: patients || [],
        loading: false,
        activeFilters: filters || {},
      });
    } catch (error: any) {
      set({
        patients: [], // Garantir array vazio em caso de erro
        error: error.message || "Erro ao carregar pacientes",
        loading: false,
      });
    }
  },

  loadPatientById: async (id: string, forceRefresh = false) => {
    const { cache, cacheTTL } = get();

    // Verificar cache
    if (!forceRefresh) {
      const cached = cache.get(id);
      if (cached && Date.now() - cached.timestamp < cacheTTL) {
        set({ selectedPatient: cached.data });
        return;
      }
    }

    set({ loading: true, error: null });
    try {
      const patient = await patientService.getPatientById(id);

      // Atualizar cache
      const newCache = new Map(cache);
      newCache.set(id, { data: patient, timestamp: Date.now() });

      set({ selectedPatient: patient, cache: newCache, loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao carregar paciente",
        loading: false,
      });
    }
  },

  createPatient: async (data: CreatePatientDto) => {
    set({ loading: true, error: null });
    try {
      const patient = await patientService.createPatient(data);
      const { patients } = get();
      set({
        patients: [patient, ...(patients || [])],
        selectedPatient: patient,
        loading: false,
      });
      return patient;
    } catch (error: any) {
      set({ error: error.message || "Erro ao criar paciente", loading: false });
      throw error;
    }
  },

  updatePatient: async (id: string, data: UpdatePatientDto) => {
    set({ loading: true, error: null });
    try {
      const updated = await patientService.updatePatient(id, data);
      const { patients, cache } = get();

      // Atualizar lista
      const updatedPatients = (patients || []).map((p) =>
        p.id === id ? updated : p
      );

      // Atualizar cache
      const newCache = new Map(cache);
      newCache.set(id, { data: updated, timestamp: Date.now() });

      set({
        patients: updatedPatients,
        selectedPatient: updated,
        cache: newCache,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao atualizar paciente",
        loading: false,
      });
    }
  },

  deletePatient: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await patientService.deletePatient(id);
      const { patients, cache, selectedPatient } = get();

      // Remover da lista
      const filteredPatients = (patients || []).filter((p) => p.id !== id);

      // Remover do cache
      cache.delete(id);

      set({
        patients: filteredPatients,
        selectedPatient: selectedPatient?.id === id ? null : selectedPatient,
        cache,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao deletar paciente",
        loading: false,
      });
    }
  },

  uploadPhoto: async (patientId: string, photoUri: string) => {
    set({ loading: true, error: null });
    try {
      const photoUrl = await patientService.uploadPatientPhoto(
        patientId,
        photoUri
      );

      // Atualizar paciente com nova foto
      const { patients, cache, selectedPatient } = get();

      const updatedPatients = patients.map((p) =>
        p.id === patientId ? { ...p, photo: photoUrl } : p
      );

      // Atualizar cache
      const cachedPatient = cache.get(patientId);
      if (cachedPatient) {
        const newCache = new Map(cache);
        newCache.set(patientId, {
          data: { ...cachedPatient.data, photo: photoUrl },
          timestamp: Date.now(),
        });
        set({ cache: newCache });
      }

      set({
        patients: updatedPatients,
        selectedPatient:
          selectedPatient?.id === patientId
            ? { ...selectedPatient, photo: photoUrl }
            : selectedPatient,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao fazer upload da foto",
        loading: false,
      });
    }
  },

  setSelectedPatient: (patient) => set({ selectedPatient: patient }),

  setActiveFilters: (filters) => set({ activeFilters: filters }),

  clearFilters: () => set({ activeFilters: {} }),

  // ===== UTILS =====

  clearCache: () => set({ cache: new Map() }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),
}));
