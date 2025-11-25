/**
 * Utilitários para Código de Acesso de Pacientes
 * Gera códigos únicos para pacientes acessarem o sistema
 */

/**
 * Gera um código de acesso alfanumérico único
 * @param length Tamanho do código (padrão: 8 caracteres)
 * @returns Código de acesso em formato XXXX-XXXX
 */
export function generateAccessCode(length: number = 8): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Remove caracteres ambíguos (0, O, I, 1)
  let code = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];

    // Adiciona hífen no meio para melhor legibilidade
    if (i === length / 2 - 1) {
      code += "-";
    }
  }

  return code;
}

/**
 * Valida formato de código de acesso
 * @param code Código a ser validado
 * @returns true se o código está no formato correto
 */
export function validateAccessCodeFormat(code: string): boolean {
  // Formato: XXXX-XXXX (8 caracteres + 1 hífen)
  const codeRegex = /^[A-Z2-9]{4}-[A-Z2-9]{4}$/;
  return codeRegex.test(code);
}

/**
 * Formata código de acesso adicionando hífen
 * @param code Código sem formatação
 * @returns Código formatado com hífen
 */
export function formatAccessCode(code: string): string {
  // Remove caracteres não alfanuméricos
  const cleaned = code.replace(/[^A-Z0-9]/gi, "").toUpperCase();

  // Adiciona hífen no meio
  if (cleaned.length > 4) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
  }

  return cleaned;
}

/**
 * Remove formatação do código de acesso
 * @param code Código formatado
 * @returns Código sem hífen
 */
export function cleanAccessCode(code: string): string {
  return code.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}
