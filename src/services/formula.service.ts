import { api } from "./api.service";
import type {
  CustomFormula,
  FormulaResult,
  CreateFormulaDto,
  UpdateFormulaDto,
  CalculateFormulaDto,
  TestFormulaDto,
  TestFormulaResponse,
  VariableInfo,
} from "../types/formula.types";

/**
 * Service para gerenciamento de fórmulas customizadas
 */
class FormulaService {
  private readonly baseUrl = "/formulas";

  /**
   * Lista todas as fórmulas (próprias + públicas)
   */
  async getAll(): Promise<CustomFormula[]> {
    return api.get<CustomFormula[]>(this.baseUrl);
  }

  /**
   * Busca uma fórmula específica por ID
   */
  async getById(id: string): Promise<CustomFormula> {
    return api.get<CustomFormula>(`${this.baseUrl}/${id}`);
  }

  /**
   * Cria uma nova fórmula customizada
   */
  async create(data: CreateFormulaDto): Promise<CustomFormula> {
    return api.post<CustomFormula>(this.baseUrl, data);
  }

  /**
   * Atualiza uma fórmula existente
   */
  async update(id: string, data: UpdateFormulaDto): Promise<CustomFormula> {
    return api.patch<CustomFormula>(`${this.baseUrl}/${id}`, data);
  }

  /**
   * Remove uma fórmula
   */
  async delete(id: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  /**
   * Lista variáveis disponíveis para uso em fórmulas
   */
  async getAvailableVariables(): Promise<VariableInfo[]> {
    return api.get<VariableInfo[]>(`${this.baseUrl}/variables`);
  }

  /**
   * Testa uma fórmula antes de salvar
   */
  async testFormula(data: TestFormulaDto): Promise<TestFormulaResponse> {
    return api.post<TestFormulaResponse>(`${this.baseUrl}/test`, data);
  }

  /**
   * Calcula uma fórmula para um paciente
   */
  async calculate(
    formulaId: string,
    data: CalculateFormulaDto
  ): Promise<FormulaResult> {
    return api.post<FormulaResult>(`${this.baseUrl}/calculate`, data);
  }

  /**
   * Lista fórmulas por categoria
   */
  async getByCategory(category: string): Promise<CustomFormula[]> {
    return api.get<CustomFormula[]>(`${this.baseUrl}/category/${category}`);
  }

  /**
   * Lista resultados de cálculos de um paciente
   */
  async getPatientResults(patientId: string): Promise<FormulaResult[]> {
    return api.get<FormulaResult[]>(
      `${this.baseUrl}/patient/${patientId}/results`
    );
  }

  /**
   * Clona uma fórmula pública para uso próprio
   */
  async clonePublicFormula(formulaId: string): Promise<CustomFormula> {
    return api.post<CustomFormula>(`${this.baseUrl}/${formulaId}/clone`, {});
  }
}

// Exporta instância única (singleton)
export const formulaService = new FormulaService();
