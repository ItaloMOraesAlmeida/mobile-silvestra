/**
 * Utilitários para aplicar máscaras em campos de texto
 */

/**
 * Aplica máscara de telefone brasileiro
 * Formatos: (11) 99999-9999 ou (11) 9999-9999
 */
export function applyPhoneMask(value: string): string {
  if (!value) return "";

  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "");

  // Limita a 11 dígitos
  const limited = numbers.slice(0, 11);

  // Aplica a máscara
  if (limited.length <= 2) {
    return limited;
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  } else if (limited.length <= 10) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(
      6
    )}`;
  } else {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(
      7
    )}`;
  }
}

/**
 * Remove máscara de telefone
 */
export function removePhoneMask(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Aplica máscara de CPF
 * Formato: 123.456.789-00
 */
export function applyCpfMask(value: string): string {
  if (!value) return "";

  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "");

  // Limita a 11 dígitos
  const limited = numbers.slice(0, 11);

  // Aplica a máscara
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 3)}.${limited.slice(3)}`;
  } else if (limited.length <= 9) {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
  } else {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(
      6,
      9
    )}-${limited.slice(9)}`;
  }
}

/**
 * Remove máscara de CPF
 */
export function removeCpfMask(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Valida CPF
 */
export function validateCpf(cpf: string): boolean {
  const numbers = cpf.replace(/\D/g, "");

  if (numbers.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false;

  // Validação dos dígitos verificadores
  let sum = 0;
  let remainder: number;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(numbers.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(numbers.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.substring(10, 11))) return false;

  return true;
}

/**
 * Aplica máscara de data
 * Formato: DD/MM/AAAA
 */
export function applyDateMask(value: string): string {
  if (!value) return "";

  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "");

  // Limita a 8 dígitos
  const limited = numbers.slice(0, 8);

  // Aplica a máscara
  if (limited.length <= 2) {
    return limited;
  } else if (limited.length <= 4) {
    return `${limited.slice(0, 2)}/${limited.slice(2)}`;
  } else {
    return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
  }
}

/**
 * Remove máscara de data
 */
export function removeDateMask(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Valida data no formato DD/MM/AAAA
 */
export function validateDate(date: string): boolean {
  const numbers = date.replace(/\D/g, "");

  if (numbers.length !== 8) return false;

  const day = parseInt(numbers.slice(0, 2));
  const month = parseInt(numbers.slice(2, 4));
  const year = parseInt(numbers.slice(4, 8));

  // Validações básicas
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;

  // Validação de dias por mês
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Ano bissexto
  if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
    daysInMonth[1] = 29;
  }

  if (day > daysInMonth[month - 1]) return false;

  return true;
}

/**
 * Converte data DD/MM/AAAA para ISO (AAAA-MM-DD)
 */
export function dateToISO(date: string): string {
  const numbers = date.replace(/\D/g, "");

  if (numbers.length !== 8) return "";

  const day = numbers.slice(0, 2);
  const month = numbers.slice(2, 4);
  const year = numbers.slice(4, 8);

  return `${year}-${month}-${day}`;
}

/**
 * Converte data ISO (AAAA-MM-DD) para DD/MM/AAAA
 */
export function isoToDate(iso: string): string {
  if (!iso) return "";

  const [year, month, day] = iso.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
}

/**
 * Aplica máscara de CEP
 * Formato: 12345-678
 */
export function applyCepMask(value: string): string {
  if (!value) return "";

  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "");

  // Limita a 8 dígitos
  const limited = numbers.slice(0, 8);

  // Aplica a máscara
  if (limited.length <= 5) {
    return limited;
  } else {
    return `${limited.slice(0, 5)}-${limited.slice(5)}`;
  }
}

/**
 * Remove máscara de CEP
 */
export function removeCepMask(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Aplica máscara de cartão de crédito
 * Formato: 1234 5678 9012 3456
 */
export function applyCreditCardMask(value: string): string {
  if (!value) return "";

  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "");

  // Limita a 16 dígitos
  const limited = numbers.slice(0, 16);

  // Aplica a máscara
  const parts = limited.match(/.{1,4}/g) || [];
  return parts.join(" ");
}

/**
 * Aplica máscara de moeda (Real Brasileiro)
 * Formato: R$ 1.234,56
 */
export function applyCurrencyMask(value: string): string {
  if (!value) return "R$ 0,00";

  // Remove tudo que não é número
  let numbers = value.replace(/\D/g, "");

  // Remove zeros à esquerda
  numbers = numbers.replace(/^0+/, "") || "0";

  // Converte para centavos
  const cents = parseInt(numbers);

  // Formata
  const formatted = (cents / 100).toFixed(2);
  const [reais, centavos] = formatted.split(".");

  // Adiciona separador de milhares
  const reaisFormatted = reais.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `R$ ${reaisFormatted},${centavos}`;
}

/**
 * Remove máscara de moeda
 */
export function removeCurrencyMask(value: string): number {
  const numbers = value.replace(/\D/g, "");
  return parseInt(numbers) / 100;
}
