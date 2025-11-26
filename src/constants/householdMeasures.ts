/**
 * Constante de medidas caseiras padrões
 * Utilizada em toda a aplicação para conversão de medidas
 */

export interface HouseholdMeasure {
  id: string;
  name: string;
  abbreviation: string;
  gramsEquivalent: number;
}

export const HOUSEHOLD_MEASURES: HouseholdMeasure[] = [
  {
    id: "colher_sopa",
    name: "Colher de Sopa",
    abbreviation: "col. sopa",
    gramsEquivalent: 15,
  },
  {
    id: "colher_cha",
    name: "Colher de Chá",
    abbreviation: "col. chá",
    gramsEquivalent: 5,
  },
  {
    id: "colher_cafe",
    name: "Colher de Café",
    abbreviation: "col. café",
    gramsEquivalent: 2,
  },
  {
    id: "colher_sobremesa",
    name: "Colher de Sobremesa",
    abbreviation: "col. sobr.",
    gramsEquivalent: 10,
  },
  {
    id: "xicara_cha",
    name: "Xícara de Chá",
    abbreviation: "xíc",
    gramsEquivalent: 200,
  },
  {
    id: "copo_americano",
    name: "Copo Americano",
    abbreviation: "copo",
    gramsEquivalent: 200,
  },
  {
    id: "copo_200ml",
    name: "Copo 200ml",
    abbreviation: "copo 200ml",
    gramsEquivalent: 200,
  },
  {
    id: "copo_300ml",
    name: "Copo 300ml",
    abbreviation: "copo 300ml",
    gramsEquivalent: 300,
  },
  {
    id: "prato_raso",
    name: "Prato Raso",
    abbreviation: "prato",
    gramsEquivalent: 250,
  },
  {
    id: "prato_fundo",
    name: "Prato Fundo",
    abbreviation: "prato fundo",
    gramsEquivalent: 300,
  },
  {
    id: "prato_sobremesa",
    name: "Prato Sobremesa",
    abbreviation: "prato sobr.",
    gramsEquivalent: 150,
  },
  {
    id: "concha",
    name: "Concha",
    abbreviation: "concha",
    gramsEquivalent: 100,
  },
  {
    id: "concha_pequena",
    name: "Concha Pequena",
    abbreviation: "concha peq.",
    gramsEquivalent: 60,
  },
  {
    id: "escumadeira",
    name: "Escumadeira",
    abbreviation: "escum.",
    gramsEquivalent: 80,
  },
  { id: "fatia", name: "Fatia", abbreviation: "fatia", gramsEquivalent: 50 },
  {
    id: "fatia_fina",
    name: "Fatia Fina",
    abbreviation: "fatia fina",
    gramsEquivalent: 30,
  },
  {
    id: "fatia_grossa",
    name: "Fatia Grossa",
    abbreviation: "fatia grossa",
    gramsEquivalent: 80,
  },
  { id: "unidade", name: "Unidade", abbreviation: "un", gramsEquivalent: 100 },
  {
    id: "unidade_pequena",
    name: "Unidade Pequena",
    abbreviation: "un peq.",
    gramsEquivalent: 50,
  },
  {
    id: "unidade_media",
    name: "Unidade Média",
    abbreviation: "un média",
    gramsEquivalent: 100,
  },
  {
    id: "unidade_grande",
    name: "Unidade Grande",
    abbreviation: "un grande",
    gramsEquivalent: 150,
  },
  {
    id: "punhado",
    name: "Punhado",
    abbreviation: "punhado",
    gramsEquivalent: 40,
  },
  {
    id: "porcao",
    name: "Porção",
    abbreviation: "porção",
    gramsEquivalent: 100,
  },
];
