/**
 * Configuração do Backblaze B2 Cloud Storage
 *
 * IMPORTANTE: As credenciais abaixo são placeholders.
 * Configure as variáveis de ambiente ou substitua pelos valores reais.
 *
 * Como obter as credenciais:
 * 1. Acesse https://www.backblaze.com/b2/cloud-storage.html
 * 2. Crie uma conta ou faça login
 * 3. Vá em "App Keys" e crie uma nova Application Key
 * 4. Anote: Account ID, Application Key
 * 5. Crie um Bucket em "Buckets" e anote: Bucket Name, Bucket ID
 * 6. Configure as permissões: Private ou Public conforme necessário
 */

export const BACKBLAZE_CONFIG = {
  /**
   * Account ID do Backblaze B2
   * Encontrado em: Account → App Keys
   */
  accountId: process.env.EXPO_PUBLIC_BACKBLAZE_ACCOUNT_ID || "YOUR_ACCOUNT_ID",

  /**
   * Application Key do Backblaze B2
   * Gerada em: Account → App Keys → Create a New App Key
   * IMPORTANTE: Guarde com segurança, não será mostrada novamente
   */
  applicationKey:
    process.env.EXPO_PUBLIC_BACKBLAZE_APP_KEY || "YOUR_APPLICATION_KEY",

  /**
   * Nome do Bucket
   * Criado em: Buckets → Create a Bucket
   * Exemplo: "silvestra-photos"
   */
  bucketName:
    process.env.EXPO_PUBLIC_BACKBLAZE_BUCKET_NAME || "silvestra-photos",

  /**
   * ID do Bucket
   * Encontrado em: Buckets → [Seu Bucket] → Settings
   */
  bucketId: process.env.EXPO_PUBLIC_BACKBLAZE_BUCKET_ID || "YOUR_BUCKET_ID",

  /**
   * Endpoint da API
   * Formato: https://s3.{region}.backblazeb2.com
   * Exemplo: https://s3.us-west-004.backblazeb2.com
   */
  endpoint:
    process.env.EXPO_PUBLIC_BACKBLAZE_ENDPOINT ||
    "https://s3.us-west-004.backblazeb2.com",

  /**
   * Região do bucket
   * Exemplos: us-west-004, eu-central-003, ap-northeast-001
   */
  region: process.env.EXPO_PUBLIC_BACKBLAZE_REGION || "us-west-004",

  /**
   * URL base para download de arquivos
   * Formato: https://f{bucketId}.backblazeb2.com
   * Pode ser customizado com Cloudflare ou outro CDN
   */
  downloadUrl:
    process.env.EXPO_PUBLIC_BACKBLAZE_DOWNLOAD_URL ||
    `https://f${
      process.env.EXPO_PUBLIC_BACKBLAZE_BUCKET_ID || "YOUR_BUCKET_ID"
    }.backblazeb2.com`,

  /**
   * Configurações de upload
   */
  upload: {
    /**
     * Tamanho máximo do arquivo em bytes (10MB)
     */
    maxFileSize: 10 * 1024 * 1024,

    /**
     * Qualidade de compressão de imagens (0-1)
     * 0.8 = 80% de qualidade, bom balanço entre qualidade e tamanho
     */
    imageQuality: 0.8,

    /**
     * Largura máxima para redimensionamento
     * null = não redimensiona
     */
    maxWidth: 1920,

    /**
     * Altura máxima para redimensionamento
     * null = não redimensiona
     */
    maxHeight: 1920,

    /**
     * Tipos de arquivo permitidos
     */
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  },

  /**
   * Configurações de retry
   */
  retry: {
    /**
     * Número máximo de tentativas em caso de falha
     */
    maxAttempts: 3,

    /**
     * Delay inicial entre tentativas (ms)
     */
    initialDelay: 1000,

    /**
     * Fator de multiplicação do delay (backoff exponencial)
     */
    backoffFactor: 2,
  },
};

/**
 * Valida se as configurações estão corretas
 */
export const validateConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (
    !BACKBLAZE_CONFIG.accountId ||
    BACKBLAZE_CONFIG.accountId === "YOUR_ACCOUNT_ID"
  ) {
    errors.push("BACKBLAZE_ACCOUNT_ID não configurado");
  }

  if (
    !BACKBLAZE_CONFIG.applicationKey ||
    BACKBLAZE_CONFIG.applicationKey === "YOUR_APPLICATION_KEY"
  ) {
    errors.push("BACKBLAZE_APP_KEY não configurado");
  }

  if (
    !BACKBLAZE_CONFIG.bucketId ||
    BACKBLAZE_CONFIG.bucketId === "YOUR_BUCKET_ID"
  ) {
    errors.push("BACKBLAZE_BUCKET_ID não configurado");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
