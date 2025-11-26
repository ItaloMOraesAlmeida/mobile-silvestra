/**
 * Configuração de integração com API Backend
 *
 * IMPORTANTE: Este arquivo prepara a integração com o backend api-silvestra
 * Quando o backend estiver disponível, descomente as URLs e ajuste conforme necessário
 */

// ============================================================================
// CONFIGURAÇÃO DA API
// ============================================================================

/**
 * URL base da API
 *
 * Desenvolvimento:
 * - Local: http://localhost:3000
 * - Emulador Android: http://10.0.2.2:3000
 * - Dispositivo físico: http://<seu-ip>:3000
 *
 * Produção:
 * - https://api.silvestra.com.br
 */
export const API_CONFIG = {
  // Backend real habilitado
  BASE_URL: __DEV__
    ? "http://10.0.2.2:3000" // Android emulator -> localhost do PC
    : "https://api.silvestra.com.br", // Produção

  TIMEOUT: 30000, // 30 segundos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 segundo
};

/**
 * Endpoints da API
 */
export const API_ENDPOINTS = {
  // ========== AUTENTICAÇÃO ==========
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH_TOKEN: "/auth/refresh",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },

  // ========== USUÁRIOS ==========
  USERS: {
    PROFILE: "/users/profile",
    UPDATE_PROFILE: "/users/profile",
    CHANGE_PASSWORD: "/users/change-password",
    UPLOAD_AVATAR: "/users/avatar",
  },

  // ========== PACIENTES ==========
  PATIENTS: {
    LIST: "/patients",
    CREATE: "/patients",
    GET: (id: string) => `/patients/${id}`,
    UPDATE: (id: string) => `/patients/${id}`,
    DELETE: (id: string) => `/patients/${id}`,
    MEASUREMENTS: (id: string) => `/patients/${id}/measurements`,
    GOALS: (id: string) => `/patients/${id}/goals`,
    PHOTOS: (id: string) => `/patients/${id}/photos`,
  },

  // ========== MEDIDAS ==========
  MEASUREMENTS: {
    LIST: "/measurements",
    CREATE: "/measurements",
    GET: (id: string) => `/measurements/${id}`,
    UPDATE: (id: string) => `/measurements/${id}`,
    DELETE: (id: string) => `/measurements/${id}`,
    PHOTOS: (id: string) => `/measurements/${id}/photos`,
    UPLOAD_PHOTO: (id: string) => `/measurements/${id}/photos`,
  },

  // ========== METAS ==========
  GOALS: {
    LIST: "/goals",
    CREATE: "/goals",
    GET: (id: string) => `/goals/${id}`,
    UPDATE: (id: string) => `/goals/${id}`,
    DELETE: (id: string) => `/goals/${id}`,
    PROGRESS: (id: string) => `/goals/${id}/progress`,
  },

  // ========== RELATÓRIOS (NOVO) ==========
  REPORTS: {
    // Dados para geração de relatórios
    PATIENT_DATA: (patientId: string) => `/reports/patients/${patientId}/data`,
    MEASUREMENTS: (
      patientId: string,
      params: { startDate: string; endDate: string }
    ) =>
      `/reports/patients/${patientId}/measurements?startDate=${params.startDate}&endDate=${params.endDate}`,
    GOALS: (
      patientId: string,
      params: { startDate: string; endDate: string }
    ) =>
      `/reports/patients/${patientId}/goals?startDate=${params.startDate}&endDate=${params.endDate}`,
    STATISTICS: (
      patientId: string,
      params: { startDate: string; endDate: string }
    ) =>
      `/reports/patients/${patientId}/statistics?startDate=${params.startDate}&endDate=${params.endDate}`,

    // Gerenciamento de relatórios gerados (opcional - se quiser armazenar no backend)
    LIST: "/reports",
    UPLOAD: "/reports",
    GET: (id: string) => `/reports/${id}`,
    DELETE: (id: string) => `/reports/${id}`,
  },

  // ========== NOTIFICAÇÕES ==========
  NOTIFICATIONS: {
    LIST: "/notifications",
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: "/notifications/read-all",
    SETTINGS: "/notifications/settings",
    UPDATE_SETTINGS: "/notifications/settings",
  },

  // ========== STORAGE (Backblaze B2) ==========
  STORAGE: {
    UPLOAD: "/storage/upload",
    DELETE: (fileId: string) => `/storage/${fileId}`,
    GET_URL: (fileId: string) => `/storage/${fileId}/url`,
  },
};

// ============================================================================
// HELPERS DE INTEGRAÇÃO
// ============================================================================

/**
 * Status de integração com o backend
 */
export const INTEGRATION_STATUS = {
  // true = usando API real, false = usando mock data
  ENABLED: true, // ✅ HABILITADO

  // Módulos que já têm endpoints prontos no backend
  AVAILABLE_MODULES: {
    AUTH: false,
    USERS: false,
    PATIENTS: false,
    MEASUREMENTS: false,
    GOALS: false,
    REPORTS: true, // ✅ HABILITADO - Endpoints de relatórios implementados
    NOTIFICATIONS: false,
    STORAGE: false,
  },
};

/**
 * Headers padrão para requisições
 */
export const getHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  ...(token && { Authorization: `Bearer ${token}` }),
});

/**
 * Headers para upload de arquivos
 */
export const getMultipartHeaders = (token?: string) => ({
  "Content-Type": "multipart/form-data",
  ...(token && { Authorization: `Bearer ${token}` }),
});

// ============================================================================
// INSTRUÇÕES DE INTEGRAÇÃO
// ============================================================================

/**
 * COMO INTEGRAR COM O BACKEND:
 *
 * 1. BACKEND PRONTO:
 *    - Descomente a BASE_URL em API_CONFIG
 *    - Ajuste o endereço conforme seu ambiente
 *    - Mude INTEGRATION_STATUS.ENABLED para true
 *
 * 2. HABILITAR MÓDULO ESPECÍFICO:
 *    - Mude o status do módulo em AVAILABLE_MODULES para true
 *    - Exemplo: AVAILABLE_MODULES.REPORTS = true
 *
 * 3. NOS SERVICES (report.service.ts, etc):
 *    - Localize os comentários "// TODO: API Integration"
 *    - Substitua os dados mock pelas chamadas reais
 *    - Exemplo:
 *
 *      // ANTES (Mock):
 *      const measurements = this.generateMockMeasurements(startDate, endDate);
 *
 *      // DEPOIS (API Real):
 *      if (INTEGRATION_STATUS.AVAILABLE_MODULES.REPORTS) {
 *        const response = await fetch(
 *          API_CONFIG.BASE_URL + API_ENDPOINTS.REPORTS.MEASUREMENTS(patientId, {
 *            startDate: startDate.toISOString(),
 *            endDate: endDate.toISOString(),
 *          }),
 *          {
 *            headers: getHeaders(token),
 *          }
 *        );
 *        const measurements = await response.json();
 *      } else {
 *        // Fallback para mock se API não disponível
 *        const measurements = this.generateMockMeasurements(startDate, endDate);
 *      }
 *
 * 4. TRATAMENTO DE ERROS:
 *    - Sempre adicione try/catch
 *    - Valide status codes (200, 401, 404, etc)
 *    - Mostre mensagens apropriadas ao usuário
 *
 * 5. AUTENTICAÇÃO:
 *    - Obtenha o token do auth.store
 *    - Passe nos headers usando getHeaders(token)
 *    - Trate 401 (não autorizado) fazendo logout
 */

// ============================================================================
// EXEMPLO DE USO
// ============================================================================

/**
 * Exemplo de função que busca medições de um paciente
 *
 * async function fetchPatientMeasurements(
 *   patientId: string,
 *   startDate: Date,
 *   endDate: Date
 * ) {
 *   // Verifica se o módulo de relatórios está habilitado
 *   if (INTEGRATION_STATUS.AVAILABLE_MODULES.REPORTS) {
 *     try {
 *       // Obtém token de autenticação
 *       const token = useAuthStore.getState().token;
 *
 *       // Monta URL com parâmetros
 *       const url = API_CONFIG.BASE_URL + API_ENDPOINTS.REPORTS.MEASUREMENTS(
 *         patientId,
 *         {
 *           startDate: startDate.toISOString(),
 *           endDate: endDate.toISOString(),
 *         }
 *       );
 *
 *       // Faz requisição
 *       const response = await fetch(url, {
 *         method: "GET",
 *         headers: getHeaders(token),
 *         signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
 *       });
 *
 *       // Valida resposta
 *       if (!response.ok) {
 *         if (response.status === 401) {
 *           // Token expirado - fazer logout
 *           useAuthStore.getState().logout();
 *           throw new Error("Sessão expirada. Faça login novamente.");
 *         }
 *         throw new Error(`Erro ao buscar medições: ${response.status}`);
 *       }
 *
 *       // Retorna dados
 *       const data = await response.json();
 *       return data;
 *
 *     } catch (error) {
 *       console.error("Erro ao buscar medições:", error);
 *       // Fallback para mock em caso de erro
 *       return generateMockMeasurements(startDate, endDate);
 *     }
 *   } else {
 *     // API não disponível - usa mock
 *     return generateMockMeasurements(startDate, endDate);
 *   }
 * }
 */

export default API_CONFIG;
