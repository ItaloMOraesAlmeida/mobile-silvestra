export const colors = {
  // Cores principais (Roxo do App)
  primary: {
    DEFAULT: "#8b5a9f", // Roxo principal
    light: "#9b6cb0", // Roxo claro
    lighter: "#e6a4f0", // Roxo muito claro (accent)
    dark: "#572363", // Roxo escuro
    darker: "#3d1a4a", // Roxo muito escuro
    medium: "#6b3d7a", // Roxo médio
    background: "#f3e8f7", // Roxo de fundo (muito claro)
  },
  secondary: {
    DEFAULT: "#8B4A9D",
    light: "#9D5FB0",
  },
  accent: {
    DEFAULT: "#FF6B9D",
    light: "#FF8BB3",
    dark: "#E5528A",
  },

  // Temas claro e escuro
  light: {
    background: "#FFFFFF",
    surface: "#F5F5F5",
    text: "#1A1A1A",
    textSecondary: "#666666",
    border: "#E0E0E0",
    card: "#FFFFFF",
    shadow: "rgba(0, 0, 0, 0.1)",
  },
  dark: {
    background: "#121212",
    surface: "#1E1E1E",
    text: "#FFFFFF",
    textSecondary: "#B3B3B3",
    border: "#333333",
    card: "#2A2A2A",
    shadow: "rgba(0, 0, 0, 0.5)",
  },

  // Cores de status
  success: {
    DEFAULT: "#4CAF50",
    light: "#66BB6A",
    dark: "#388E3C",
  },
  warning: {
    DEFAULT: "#FF9800",
    light: "#FFA726",
    dark: "#F57C00",
  },
  error: {
    DEFAULT: "#F44336",
    light: "#EF5350",
    dark: "#D32F2F",
  },
  info: {
    DEFAULT: "#2196F3",
    light: "#42A5F5",
    dark: "#1976D2",
  },

  // Grayscale
  gray: {
    50: "#FAFAFA",
    100: "#F5F5F5",
    200: "#EEEEEE",
    300: "#E0E0E0",
    400: "#BDBDBD",
    500: "#9E9E9E",
    600: "#757575",
    700: "#616161",
    800: "#424242",
    900: "#212121",
  },

  // Cores transparentes
  transparent: "transparent",
  white: "#FFFFFF",
  black: "#000000",
};

export type ColorScheme = "light" | "dark";

export default colors;
