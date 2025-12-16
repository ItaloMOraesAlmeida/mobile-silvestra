import axios from "axios";
import { tokenService } from "../token.service";
import {
  NutritionistAddress,
  CreateNutritionistAddressDto,
  UpdateNutritionistAddressDto,
} from "../../types/nutritionist";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

class NutritionistAddressService {
  private getAuthHeaders() {
    const tokens = tokenService.getTokens();
    return {
      Authorization: `Bearer ${tokens?.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  async create(
    data: CreateNutritionistAddressDto
  ): Promise<NutritionistAddress> {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.post(
        `${API_URL}/nutritionist/addresses`,
        data,
        { headers }
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao criar endereço"
      );
    }
  }

  async findAll(): Promise<NutritionistAddress[]> {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.get(`${API_URL}/nutritionist/addresses`, {
        headers,
      });
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      // Se for 404, retorna array vazio (não há endereços cadastrados)
      if (error.response?.status === 404) {
        return [];
      }
      // Para outros erros, propaga o erro original
      throw error;
    }
  }

  async findServiceLocations(): Promise<NutritionistAddress[]> {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.get(
        `${API_URL}/nutritionist/addresses/service-locations`,
        { headers }
      );
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao buscar locais de atendimento"
      );
    }
  }

  async findOne(id: string): Promise<NutritionistAddress> {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.get(
        `${API_URL}/nutritionist/addresses/${id}`,
        { headers }
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao buscar endereço"
      );
    }
  }

  async update(
    id: string,
    data: UpdateNutritionistAddressDto
  ): Promise<NutritionistAddress> {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.put(
        `${API_URL}/nutritionist/addresses/${id}`,
        data,
        { headers }
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao atualizar endereço"
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const headers = this.getAuthHeaders();
      await axios.delete(`${API_URL}/nutritionist/addresses/${id}`, {
        headers,
      });
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Erro ao excluir endereço"
      );
    }
  }

  /**
   * Busca os locais de atendimento do nutricionista do paciente (endpoint para pacientes)
   */
  async findPatientNutritionistServiceLocations(): Promise<
    NutritionistAddress[]
  > {
    try {
      const headers = this.getAuthHeaders();

      const response = await axios.get(
        `${API_URL}/nutritionist/addresses/patient/service-locations`,
        { headers }
      );

      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      console.error("❌ [AddressService] Erro:", error);
      throw new Error(
        error.response?.data?.message || "Erro ao buscar locais de atendimento"
      );
    }
  }
}

export const nutritionistAddressService = new NutritionistAddressService();
export default nutritionistAddressService;
