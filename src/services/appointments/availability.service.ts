import axios from "axios";
import { tokenService } from "../token.service";
import {
  AvailabilityConfig,
  CreateAvailabilityConfigDto,
  CreateWeeklyScheduleDto,
  UpdateWeeklyScheduleDto,
  CreateBlockedPeriodDto,
  BlockedPeriod,
  DayOfWeek,
} from "../../types/appointments";
import { ApiResponse } from "../../types";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

class AvailabilityService {
  private getAuthHeaders() {
    const tokens = tokenService.getTokens();
    return {
      Authorization: `Bearer ${tokens?.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Cria ou atualiza a configuração de disponibilidade do nutricionista
   */
  async createOrUpdateConfig(
    data: CreateAvailabilityConfigDto
  ): Promise<AvailabilityConfig> {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.post(
        `${API_URL}/availability/config`,
        data,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao salvar configuração"
      );
    }
  }

  /**
   * Busca a configuração de disponibilidade do nutricionista
   */
  async getConfig(): Promise<
    ApiResponse<AvailabilityConfig> | AvailabilityConfig
  > {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.get(`${API_URL}/availability/config`, {
        headers,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao buscar configuração"
      );
    }
  }

  /**
   * Cria um horário de atendimento para um dia da semana
   */
  async createWeeklySchedule(
    data: CreateWeeklyScheduleDto
  ): Promise<AvailabilityConfig> {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.post(
        `${API_URL}/availability/schedule`,
        data,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Erro ao criar horário");
    }
  }

  /**
   * Atualiza o horário de atendimento de um dia da semana
   */
  async updateWeeklySchedule(
    dayOfWeek: DayOfWeek,
    data: UpdateWeeklyScheduleDto
  ): Promise<AvailabilityConfig> {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.put(
        `${API_URL}/availability/schedule/${dayOfWeek}`,
        data,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao atualizar horário"
      );
    }
  }

  /**
   * Remove o horário de atendimento de um dia da semana
   */
  async deleteWeeklySchedule(dayOfWeek: DayOfWeek): Promise<void> {
    try {
      const headers = this.getAuthHeaders();
      await axios.delete(`${API_URL}/availability/schedule/${dayOfWeek}`, {
        headers,
      });
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao remover horário"
      );
    }
  }

  /**
   * Cria um período bloqueado (férias, feriado, etc)
   */
  async createBlockedPeriod(
    data: CreateBlockedPeriodDto
  ): Promise<BlockedPeriod> {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.post(
        `${API_URL}/availability/blocked-periods`,
        data,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao criar período bloqueado"
      );
    }
  }

  /**
   * Atualiza um período bloqueado
   */
  async updateBlockedPeriod(
    id: string,
    data: Partial<CreateBlockedPeriodDto>
  ): Promise<BlockedPeriod> {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.put(
        `${API_URL}/availability/blocked-periods/${id}`,
        data,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao atualizar período bloqueado"
      );
    }
  }

  /**
   * Remove um período bloqueado
   */
  async deleteBlockedPeriod(id: string): Promise<void> {
    try {
      const headers = this.getAuthHeaders();
      await axios.delete(`${API_URL}/availability/blocked-periods/${id}`, {
        headers,
      });
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao remover período bloqueado"
      );
    }
  }

  /**
   * Lista os períodos bloqueados futuros
   */
  async getBlockedPeriods(): Promise<
    ApiResponse<BlockedPeriod[]> | BlockedPeriod[]
  > {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.get(
        `${API_URL}/availability/blocked-periods`,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao buscar períodos bloqueados"
      );
    }
  }

  /**
   * Busca os horários disponíveis para uma data específica
   */
  async getAvailableSlots(date: string): Promise<string[]> {
    try {
      const headers = this.getAuthHeaders();
      const url = `${API_URL}/availability/slots`;

      const response = await axios.get(url, {
        headers,
        params: { date },
      });

      // A resposta vem envolvida em { success: true, data: { date, slots } }
      const apiData = response.data?.data || response.data;
      const slots = apiData?.slots || [];

      return Array.isArray(slots) ? slots : [];
    } catch (error: any) {
      console.error("❌ [AvailabilityService] Erro na requisição:", error);
      throw new Error(
        error.response?.data?.message || "Erro ao buscar horários disponíveis"
      );
    }
  }

  /**
   * Busca os horários disponíveis do nutricionista do paciente para uma data específica (endpoint para pacientes)
   */
  async getPatientAvailableSlots(date: string): Promise<string[]> {
    try {
      const headers = this.getAuthHeaders();
      const url = `${API_URL}/availability/patient/slots`;

      const response = await axios.get(url, {
        headers,
        params: { date },
      });

      // A resposta vem envolvida em { success: true, data: { date, slots } }
      const apiData = response.data?.data || response.data;
      const slots = apiData?.slots || [];

      return Array.isArray(slots) ? slots : [];
    } catch (error: any) {
      console.error(
        "❌ [AvailabilityService] Erro na requisição do paciente:",
        error
      );
      console.error(
        "❌ [AvailabilityService] Response error:",
        error.response?.data
      );
      throw new Error(
        error.response?.data?.message || "Erro ao buscar horários disponíveis"
      );
    }
  }
}

export default new AvailabilityService();
