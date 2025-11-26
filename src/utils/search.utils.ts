import type { BodyMeasurement } from "../types/patient-details.types";

/**
 * Formata data para DD/MM/YYYY
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Parse de diferentes formatos de data
 * Suporta: DD/MM/YYYY, DD/MM, MM/YYYY, YYYY
 */
export const parseSearchDate = (search: string): Date | null => {
  const cleanSearch = search.trim();

  // DD/MM/YYYY
  const fullDateMatch = cleanSearch.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (fullDateMatch) {
    const [, day, month, year] = fullDateMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // DD/MM (ano atual)
  const dayMonthMatch = cleanSearch.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (dayMonthMatch) {
    const [, day, month] = dayMonthMatch;
    const year = new Date().getFullYear();
    return new Date(year, parseInt(month) - 1, parseInt(day));
  }

  // MM/YYYY
  const monthYearMatch = cleanSearch.match(/^(\d{1,2})\/(\d{4})$/);
  if (monthYearMatch) {
    const [, month, year] = monthYearMatch;
    return new Date(parseInt(year), parseInt(month) - 1, 1);
  }

  // YYYY
  const yearMatch = cleanSearch.match(/^(\d{4})$/);
  if (yearMatch) {
    const [, year] = yearMatch;
    return new Date(parseInt(year), 0, 1);
  }

  return null;
};

/**
 * Verifica se uma data corresponde à busca
 */
export const matchesDateSearch = (
  measurementDate: Date | string,
  searchDate: Date,
  searchText: string
): boolean => {
  const mDate =
    typeof measurementDate === "string"
      ? new Date(measurementDate)
      : measurementDate;

  // DD/MM/YYYY - match exato
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(searchText)) {
    return (
      mDate.getDate() === searchDate.getDate() &&
      mDate.getMonth() === searchDate.getMonth() &&
      mDate.getFullYear() === searchDate.getFullYear()
    );
  }

  // DD/MM - match dia e mês
  if (/^\d{1,2}\/\d{1,2}$/.test(searchText)) {
    return (
      mDate.getDate() === searchDate.getDate() &&
      mDate.getMonth() === searchDate.getMonth()
    );
  }

  // MM/YYYY - match mês e ano
  if (/^\d{1,2}\/\d{4}$/.test(searchText)) {
    return (
      mDate.getMonth() === searchDate.getMonth() &&
      mDate.getFullYear() === searchDate.getFullYear()
    );
  }

  // YYYY - match ano
  if (/^\d{4}$/.test(searchText)) {
    return mDate.getFullYear() === searchDate.getFullYear();
  }

  return false;
};

/**
 * Filtra medições por texto de busca
 * Busca por:
 * - Data (DD/MM/YYYY, DD/MM, MM/YYYY, YYYY)
 * - Peso
 * - IMC
 * - Notas
 */
export const searchMeasurements = (
  measurements: BodyMeasurement[],
  searchText: string
): BodyMeasurement[] => {
  if (!searchText.trim()) {
    return measurements;
  }

  const lowerSearch = searchText.toLowerCase().trim();

  // Tenta parse de data
  const searchDate = parseSearchDate(lowerSearch);

  return measurements.filter((measurement) => {
    // Busca por data
    if (searchDate) {
      if (matchesDateSearch(measurement.createdAt, searchDate, lowerSearch)) {
        return true;
      }
    }

    // Busca por data formatada (texto livre)
    const formattedDate = formatDate(measurement.createdAt);
    if (formattedDate.includes(lowerSearch)) {
      return true;
    }

    // Busca por peso
    if (measurement.weight.toString().includes(lowerSearch)) {
      return true;
    }

    // Busca por IMC
    const bmi = measurement.weight / Math.pow(measurement.height / 100, 2);
    if (bmi.toFixed(1).includes(lowerSearch)) {
      return true;
    }

    // Busca por notas
    if (
      measurement.notes &&
      measurement.notes.toLowerCase().includes(lowerSearch)
    ) {
      return true;
    }

    return false;
  });
};

/**
 * Destaca o texto que corresponde à busca
 */
export const highlightSearchText = (
  text: string,
  search: string
): { text: string; highlight: boolean }[] => {
  if (!search.trim()) {
    return [{ text, highlight: false }];
  }

  const lowerText = text.toLowerCase();
  const lowerSearch = search.toLowerCase().trim();
  const index = lowerText.indexOf(lowerSearch);

  if (index === -1) {
    return [{ text, highlight: false }];
  }

  const before = text.substring(0, index);
  const match = text.substring(index, index + search.length);
  const after = text.substring(index + search.length);

  return [
    ...(before ? [{ text: before, highlight: false }] : []),
    { text: match, highlight: true },
    ...(after ? [{ text: after, highlight: false }] : []),
  ];
};

/**
 * Exemplos de formatos de busca suportados
 */
export const SEARCH_EXAMPLES = [
  "25/12/2023 - Data específica",
  "25/12 - Dia e mês",
  "12/2023 - Mês e ano",
  "2023 - Ano",
  "75.5 - Peso",
  "24.5 - IMC",
  "evolução - Notas",
];
