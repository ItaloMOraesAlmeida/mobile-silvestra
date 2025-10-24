import { create } from "zustand";
import { ColorScheme } from "../theme/colors";

interface ThemeState {
  colorScheme: ColorScheme;
  setColorScheme: (colorScheme: ColorScheme) => void;
  toggleColorScheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  colorScheme: "light",
  setColorScheme: (colorScheme: ColorScheme) => set({ colorScheme }),
  toggleColorScheme: () =>
    set((state) => ({
      colorScheme: state.colorScheme === "light" ? "dark" : "light",
    })),
}));

export default useThemeStore;
