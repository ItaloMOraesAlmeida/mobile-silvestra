import { useColorScheme as useRNColorScheme } from "react-native";
import { useMemo } from "react";
import { getTheme, Theme } from "../theme";
import { ColorScheme } from "../theme/colors";

export const useColorScheme = (): ColorScheme => {
  const colorScheme = useRNColorScheme();
  return (colorScheme as ColorScheme) || "light";
};

export const useTheme = (): Theme => {
  const colorScheme = useColorScheme();
  return useMemo(() => getTheme(colorScheme), [colorScheme]);
};

export const useThemedStyles = <T extends Record<string, any>>(
  stylesFn: (theme: Theme) => T
): T => {
  const theme = useTheme();
  return useMemo(() => stylesFn(theme), [theme, stylesFn]);
};

export default useTheme;
