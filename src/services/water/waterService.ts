import { api } from "../api";
import {
  WaterSettings,
  UpdateWaterSettingsDto,
  WaterLog,
  CreateWaterLogDto,
  FilterWaterLogsDto,
  WaterLogsResponse,
  TodaySummary,
  HistoryItem,
  WaterOverviewResponse,
} from "../../types/water";

const BASE_URL = "/water";

// ==================== SETTINGS ====================

export const getWaterSettings = async (): Promise<WaterSettings> => {
  const response = await api.get(`${BASE_URL}/settings`);
  return response.data;
};

export const updateWaterSettings = async (
  data: UpdateWaterSettingsDto
): Promise<WaterSettings> => {
  const response = await api.patch(`${BASE_URL}/settings`, data);
  return response.data;
};

// ==================== LOGS ====================

export const createWaterLog = async (
  data: CreateWaterLogDto
): Promise<WaterLog> => {
  const response = await api.post(`${BASE_URL}/logs`, data);
  return response.data;
};

export const getWaterLogs = async (
  filters?: FilterWaterLogsDto
): Promise<WaterLogsResponse> => {
  const response = await api.get(`${BASE_URL}/logs`, { params: filters });
  return response.data;
};

export const deleteWaterLog = async (logId: string): Promise<void> => {
  await api.delete(`${BASE_URL}/logs/${logId}`);
};

// ==================== SUMMARY & HISTORY ====================

export const getTodaySummary = async (): Promise<TodaySummary> => {
  const response = await api.get(`${BASE_URL}/today`);
  return response.data;
};

export const getWaterHistory = async (
  startDate: string,
  endDate: string
): Promise<HistoryItem[]> => {
  const response = await api.get(`${BASE_URL}/history`, {
    params: { startDate, endDate },
  });
  return response.data;
};

// ==================== NUTRITIONIST ====================

export const nutritionistWaterService = {
  getPatientSettings: async (patientId: string): Promise<WaterSettings> => {
    const response = await api.get(
      `/nutritionist/water/patient/${patientId}/settings`
    );
    return response.data;
  },

  updatePatientSettings: async (
    patientId: string,
    data: UpdateWaterSettingsDto
  ): Promise<WaterSettings> => {
    const response = await api.patch(
      `/nutritionist/water/patient/${patientId}/settings`,
      data
    );
    return response.data;
  },

  getPatientTodaySummary: async (patientId: string): Promise<TodaySummary> => {
    const response = await api.get(
      `/nutritionist/water/patient/${patientId}/today`
    );
    return response.data;
  },

  getPatientHistory: async (
    patientId: string,
    startDate: string,
    endDate: string
  ): Promise<HistoryItem[]> => {
    const response = await api.get(
      `/nutritionist/water/patient/${patientId}/history`,
      {
        params: { startDate, endDate },
      }
    );
    return response.data;
  },

  getPatientLogs: async (
    patientId: string,
    filters?: FilterWaterLogsDto
  ): Promise<WaterLogsResponse> => {
    const response = await api.get(
      `/nutritionist/water/patient/${patientId}/logs`,
      { params: filters }
    );
    return response.data;
  },

  getOverview: async (): Promise<WaterOverviewResponse> => {
    const response = await api.get("/nutritionist/water/overview");
    return response.data;
  },
};
