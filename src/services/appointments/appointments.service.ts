import axios from "axios";
import { tokenService } from "../token.service";
import {
  Appointment,
  CreateAppointmentDto,
  UpdateAppointmentStatusDto,
  RescheduleAppointmentDto,
  AppointmentStatus,
} from "../../types/appointments";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

interface FindAllFilters {
  status?: AppointmentStatus;
  startDate?: string;
  endDate?: string;
  patientId?: string;
}

class AppointmentsService {
  private getAuthHeaders() {
    const tokens = tokenService.getTokens();
    return {
      Authorization: `Bearer ${tokens?.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Cria uma nova consulta
   */
  async create(data: CreateAppointmentDto): Promise<Appointment> {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.post(`${API_URL}/appointments`, data, {
        headers,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao criar consulta"
      );
    }
  }

  /**
   * Lista as consultas do nutricionista com filtros opcionais
   */
  async findAll(filters?: FindAllFilters): Promise<Appointment[]> {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.get(`${API_URL}/appointments`, {
        headers,
        params: filters,
      });

      // A API retorna { data: [...], success: true }
      const appointments = response.data.data || response.data;
      return Array.isArray(appointments) ? appointments : [];
    } catch (error: any) {
      console.error("❌ [appointmentsService.findAll] Erro:", error);
      throw new Error(
        error.response?.data?.message || "Erro ao buscar consultas"
      );
    }
  }

  /**
   * Busca detalhes de uma consulta específica
   */
  async findOne(id: string): Promise<Appointment> {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.get(`${API_URL}/appointments/${id}`, {
        headers,
      });

      // A API retorna { success: true, data: {...} }
      const appointment = response.data.data || response.data;
      return appointment;
    } catch (error: any) {
      console.error("❌ [appointmentsService.findOne] Erro:", error);
      throw new Error(
        error.response?.data?.message || "Erro ao buscar consulta"
      );
    }
  }

  /**
   * Atualiza os dados de uma consulta
   */
  async update(
    id: string,
    data: Partial<CreateAppointmentDto>
  ): Promise<Appointment> {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.put(`${API_URL}/appointments/${id}`, data, {
        headers,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao atualizar consulta"
      );
    }
  }

  /**
   * Atualiza o status de uma consulta
   */
  async updateStatus(
    id: string,
    data: UpdateAppointmentStatusDto
  ): Promise<Appointment> {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.patch(
        `${API_URL}/appointments/${id}/status`,
        data,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao atualizar status"
      );
    }
  }

  /**
   * Reagenda uma consulta (cria nova e marca antiga como reagendada)
   */
  async reschedule(
    id: string,
    data: RescheduleAppointmentDto
  ): Promise<Appointment> {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.post(
        `${API_URL}/appointments/${id}/reschedule`,
        data,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao reagendar consulta"
      );
    }
  }

  /**
   * Cancela uma consulta (soft delete - muda status)
   */
  async cancel(id: string, reason?: string): Promise<Appointment> {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.delete(
        `${API_URL}/appointments/${id}/cancel`,
        {
          headers,
          data: { reason },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao cancelar consulta"
      );
    }
  }

  /**
   * Remove permanentemente uma consulta (hard delete)
   */
  async delete(id: string): Promise<void> {
    try {
      const headers = this.getAuthHeaders();
      await axios.delete(`${API_URL}/appointments/${id}`, { headers });
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao remover consulta"
      );
    }
  }

  /**
   * Busca o nutricionista do paciente (endpoint para pacientes)
   */
  async findMyNutritionist(): Promise<any> {
    try {
      const headers = this.getAuthHeaders();

      const response = await axios.get(
        `${API_URL}/appointments/patient/my-nutritionist`,
        { headers }
      );

      // Extrair apenas o data do envelope {success, data}
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error("❌ [appointmentsService.findMyNutritionist] Erro:", error);
      console.error(
        "❌ [appointmentsService.findMyNutritionist] Response error:",
        error.response?.data
      );
      throw new Error(
        error.response?.data?.message || "Erro ao buscar nutricionista"
      );
    }
  }

  /**
   * Busca as consultas do paciente (endpoint para pacientes)
   */
  async findMyAppointments(filters?: FindAllFilters): Promise<Appointment[]> {
    try {
      const headers = this.getAuthHeaders();

      const response = await axios.get(
        `${API_URL}/appointments/patient/my-appointments`,
        {
          headers,
          params: filters,
        }
      );

      // Tratar tanto array direto quanto envelope {success, data}
      const appointments = response.data?.data || response.data;

      return Array.isArray(appointments) ? appointments : [];
    } catch (error: any) {
      console.error("❌ [appointmentsService.findMyAppointments] Erro:", error);
      console.error(
        "❌ [appointmentsService.findMyAppointments] Response error:",
        error.response?.data
      );
      throw new Error(
        error.response?.data?.message || "Erro ao buscar suas consultas"
      );
    }
  }

  /**
   * Solicita uma consulta (paciente)
   */
  async requestAppointment(data: any): Promise<Appointment> {
    try {
      const headers = this.getAuthHeaders();

      const response = await axios.post(
        `${API_URL}/appointments/patient/request`,
        data,
        { headers }
      );

      return response.data?.data || response.data;
    } catch (error: any) {
      console.error("❌ [appointmentsService.requestAppointment] Erro:", error);
      throw new Error(
        error.response?.data?.message || "Erro ao solicitar consulta"
      );
    }
  }

  /**
   * Confirma uma consulta (atalho para updateStatus)
   */
  async confirm(id: string): Promise<Appointment> {
    return this.updateStatus(id, { status: AppointmentStatus.CONFIRMED });
  }

  /**
   * Marca consulta como realizada (atalho para updateStatus)
   */
  async complete(id: string): Promise<Appointment> {
    return this.updateStatus(id, { status: AppointmentStatus.COMPLETED });
  }

  /**
   * Marca paciente como faltante (atalho para updateStatus)
   */
  async markNoShow(id: string): Promise<Appointment> {
    return this.updateStatus(id, { status: AppointmentStatus.NO_SHOW });
  }
}

export default new AppointmentsService();
