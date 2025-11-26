import { api } from "./api.service";

export interface NotificationResponse {
  id: string;
  userId: string;
  mealPlanId?: string;
  mealId?: string;
  title: string;
  body: string;
  scheduledFor: string;
  frequency: "ONCE" | "DAILY" | "WEEKLY" | "CUSTOM";
  daysOfWeek: number[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  mealPlan?: {
    id: string;
    name: string;
  };
  meal?: {
    id: string;
    name: string;
    type: string;
    time: string | null;
  };
}

export interface CreateNotificationInput {
  userId: string;
  mealPlanId?: string;
  mealId?: string;
  title: string;
  body: string;
  scheduledFor: string;
  frequency?: "ONCE" | "DAILY" | "WEEKLY" | "CUSTOM";
  daysOfWeek?: number[];
}

export interface UpdateNotificationInput {
  title?: string;
  body?: string;
  scheduledFor?: string;
  frequency?: "ONCE" | "DAILY" | "WEEKLY" | "CUSTOM";
  daysOfWeek?: number[];
  mealPlanId?: string;
  mealId?: string;
}

export interface QueryNotificationParams {
  userId?: string;
  mealPlanId?: string;
  isActive?: boolean;
  frequency?: "ONCE" | "DAILY" | "WEEKLY" | "CUSTOM";
}

export interface BulkCreateNotificationInput {
  notifications: CreateNotificationInput[];
}

export interface BulkCreateNotificationResponse {
  count: number;
  notifications: NotificationResponse[];
}

/**
 * Serviço para gerenciar notificações via API
 */
class NotificationApiService {
  private baseUrl = "/notifications";

  /**
   * Criar uma nova notificação
   */
  async create(data: CreateNotificationInput): Promise<NotificationResponse> {
    const response = await api.post<NotificationResponse>(this.baseUrl, data);
    return response;
  }

  /**
   * Listar todas as notificações com filtros opcionais
   */
  async list(
    params?: QueryNotificationParams
  ): Promise<NotificationResponse[]> {
    // Construir query string manualmente para filtros
    let url = this.baseUrl;
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.userId) queryParams.append("userId", params.userId);
      if (params.mealPlanId)
        queryParams.append("mealPlanId", params.mealPlanId);
      if (params.isActive !== undefined)
        queryParams.append("isActive", String(params.isActive));
      if (params.frequency) queryParams.append("frequency", params.frequency);

      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;
    }

    const response = await api.get<NotificationResponse[]>(url);
    return response;
  }

  /**
   * Buscar notificação por ID
   */
  async getById(id: string): Promise<NotificationResponse> {
    const response = await api.get<NotificationResponse>(
      `${this.baseUrl}/${id}`
    );
    return response;
  }

  /**
   * Atualizar notificação
   */
  async update(
    id: string,
    data: UpdateNotificationInput
  ): Promise<NotificationResponse> {
    const response = await api.patch<NotificationResponse>(
      `${this.baseUrl}/${id}`,
      data
    );
    return response;
  }

  /**
   * Deletar notificação
   */
  async delete(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Alternar status ativo/inativo da notificação
   */
  async toggle(id: string): Promise<NotificationResponse> {
    const response = await api.patch<NotificationResponse>(
      `${this.baseUrl}/${id}/toggle`
    );
    return response;
  }

  /**
   * Criar múltiplas notificações em lote
   */
  async bulkCreate(
    data: BulkCreateNotificationInput
  ): Promise<BulkCreateNotificationResponse> {
    const response = await api.post<BulkCreateNotificationResponse>(
      `${this.baseUrl}/bulk`,
      data
    );
    return response;
  }

  /**
   * Listar notificações do usuário logado
   */
  async getMyNotifications(): Promise<NotificationResponse[]> {
    const response = await api.get<NotificationResponse[]>(
      `${this.baseUrl}/my`
    );
    return response;
  }

  /**
   * Listar notificações ativas do usuário
   */
  async getActiveNotifications(
    userId: string
  ): Promise<NotificationResponse[]> {
    return this.list({ userId, isActive: true });
  }

  /**
   * Listar notificações de um plano alimentar
   */
  async getMealPlanNotifications(
    mealPlanId: string
  ): Promise<NotificationResponse[]> {
    return this.list({ mealPlanId });
  }
}

export const notificationApiService = new NotificationApiService();
