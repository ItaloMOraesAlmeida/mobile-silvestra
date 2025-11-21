import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Appearance } from "react-native";
import { useSettingsStore } from "../stores/settings.store";
import { lightTheme, darkTheme } from "./index";
import type { Theme } from "./index";

/**
 * Context de Tema
 */
interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: "light" | "dark" | "auto") => void;
  themeMode: "light" | "dark" | "auto";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Provider de Tema
 */
interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const settingsStore = useSettingsStore();
  const themeMode = settingsStore.settings.theme;
  const setThemeMode = settingsStore.setTheme;

  // Estado do tema atual
  const [currentTheme, setCurrentTheme] = useState<Theme>(lightTheme);
  const [isDark, setIsDark] = useState(false);

  /**
   * Determina qual tema usar baseado no modo selecionado
   */
  const determineTheme = (mode: "light" | "dark" | "auto") => {
    if (mode === "auto") {
      const colorScheme = Appearance.getColorScheme();
      return colorScheme === "dark" ? darkTheme : lightTheme;
    }
    return mode === "dark" ? darkTheme : lightTheme;
  };

  /**
   * Atualiza o tema quando o modo mudar
   */
  useEffect(() => {
    const newTheme = determineTheme(themeMode);
    setCurrentTheme(newTheme);
    setIsDark(newTheme === darkTheme);
  }, [themeMode]);

  /**
   * Listener para mudanças no tema do sistema (quando mode = "auto")
   */
  useEffect(() => {
    if (themeMode !== "auto") return;

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      const newTheme = colorScheme === "dark" ? darkTheme : lightTheme;
      setCurrentTheme(newTheme);
      setIsDark(colorScheme === "dark");
    });

    return () => subscription.remove();
  }, [themeMode]);

  /**
   * Alterna entre light e dark (não usa auto)
   */
  const toggleTheme = () => {
    const newMode = isDark ? "light" : "dark";
    setThemeMode(newMode);
  };

  /**
   * Define o tema explicitamente
   */
  const setTheme = (mode: "light" | "dark" | "auto") => {
    setThemeMode(mode);
  };

  const value: ThemeContextType = {
    theme: currentTheme,
    isDark,
    toggleTheme,
    setTheme,
    themeMode,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Hook para acessar o tema
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
