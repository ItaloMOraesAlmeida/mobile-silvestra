/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#572363",
          light: "#7B3E8F",
          dark: "#3D1847",
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
        background: {
          light: "#FFFFFF",
          dark: "#121212",
        },
        surface: {
          light: "#F5F5F5",
          dark: "#1E1E1E",
        },
        text: {
          light: "#1A1A1A",
          dark: "#FFFFFF",
        },
        textSecondary: {
          light: "#666666",
          dark: "#B3B3B3",
        },
        border: {
          light: "#E0E0E0",
          dark: "#333333",
        },
        success: {
          DEFAULT: "#4CAF50",
          light: "#66BB6A",
        },
        warning: {
          DEFAULT: "#FF9800",
          light: "#FFA726",
        },
        error: {
          DEFAULT: "#F44336",
          light: "#EF5350",
        },
        info: {
          DEFAULT: "#2196F3",
          light: "#42A5F5",
        },
      },
      fontFamily: {
        thin: ["Inter_100Thin"],
        extralight: ["Inter_200ExtraLight"],
        light: ["Inter_300Light"],
        regular: ["Inter_400Regular"],
        medium: ["Inter_500Medium"],
        semibold: ["Inter_600SemiBold"],
        bold: ["Inter_700Bold"],
        extrabold: ["Inter_800ExtraBold"],
        black: ["Inter_900Black"],
      },
    },
  },
  plugins: [],
};
