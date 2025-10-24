export const typography = {
  // Tamanhos de fonte
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 28,
    "4xl": 32,
    "5xl": 36,
    "6xl": 48,
  },

  // Altura de linha
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Peso da fonte
  fontWeight: {
    thin: "100" as const,
    extralight: "200" as const,
    light: "300" as const,
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    extrabold: "800" as const,
    black: "900" as const,
  },

  // Família de fontes (Inter)
  fontFamily: {
    thin: "Inter_100Thin",
    extralight: "Inter_200ExtraLight",
    light: "Inter_300Light",
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
    extrabold: "Inter_800ExtraBold",
    black: "Inter_900Black",
  },
};

export default typography;
