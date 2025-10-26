import { colors as baseColors, ColorScheme } from "./colors";
import typography from "./typography";
import spacing from "./spacing";
import { borderRadius, shadows } from "./borders";

export interface Theme {
  colors: {
    primary: string;
    primaryLight: string;
    primaryLighter: string;
    primaryDark: string;
    primaryDarker: string;
    primaryMedium: string;
    primaryBackground: string;
    secondary: string;
    secondaryLight: string;
    accent: string;
    accentLight: string;
    accentDark: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    card: string;
    shadow: string;
    success: string;
    successLight: string;
    successDark: string;
    warning: string;
    warningLight: string;
    warningDark: string;
    error: string;
    errorLight: string;
    errorDark: string;
    info: string;
    infoLight: string;
    infoDark: string;
    transparent: string;
    white: string;
    black: string;
    gray: typeof baseColors.gray;
  };
  typography: {
    fontSize: typeof typography.fontSize;
    lineHeight: typeof typography.lineHeight;
    fontWeight: typeof typography.fontWeight;
    fontFamily: typeof typography.fontFamily;
    thin: string;
    extralight: string;
    light: string;
    regular: string;
    medium: string;
    semibold: string;
    bold: string;
    extrabold: string;
    black: string;
  };
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  isDark: boolean;
}

export const lightTheme: Theme = {
  colors: {
    primary: baseColors.primary.DEFAULT,
    primaryLight: baseColors.primary.light,
    primaryLighter: baseColors.primary.lighter,
    primaryDark: baseColors.primary.dark,
    primaryDarker: baseColors.primary.darker,
    primaryMedium: baseColors.primary.medium,
    primaryBackground: baseColors.primary.background,
    secondary: baseColors.secondary.DEFAULT,
    secondaryLight: baseColors.secondary.light,
    accent: baseColors.accent.DEFAULT,
    accentLight: baseColors.accent.light,
    accentDark: baseColors.accent.dark,
    background: baseColors.light.background,
    surface: baseColors.light.surface,
    text: baseColors.light.text,
    textSecondary: baseColors.light.textSecondary,
    border: baseColors.light.border,
    card: baseColors.light.card,
    shadow: baseColors.light.shadow,
    success: baseColors.success.DEFAULT,
    successLight: baseColors.success.light,
    successDark: baseColors.success.dark,
    warning: baseColors.warning.DEFAULT,
    warningLight: baseColors.warning.light,
    warningDark: baseColors.warning.dark,
    error: baseColors.error.DEFAULT,
    errorLight: baseColors.error.light,
    errorDark: baseColors.error.dark,
    info: baseColors.info.DEFAULT,
    infoLight: baseColors.info.light,
    infoDark: baseColors.info.dark,
    transparent: baseColors.transparent,
    white: baseColors.white,
    black: baseColors.black,
    gray: baseColors.gray,
  },
  typography: {
    fontSize: typography.fontSize,
    lineHeight: typography.lineHeight,
    fontWeight: typography.fontWeight,
    fontFamily: typography.fontFamily,
    thin: typography.fontFamily.thin,
    extralight: typography.fontFamily.extralight,
    light: typography.fontFamily.light,
    regular: typography.fontFamily.regular,
    medium: typography.fontFamily.medium,
    semibold: typography.fontFamily.semibold,
    bold: typography.fontFamily.bold,
    extrabold: typography.fontFamily.extrabold,
    black: typography.fontFamily.black,
  },
  spacing,
  borderRadius,
  shadows,
  isDark: false,
};

export const darkTheme: Theme = {
  colors: {
    primary: baseColors.primary.DEFAULT,
    primaryLight: baseColors.primary.light,
    primaryLighter: baseColors.primary.lighter,
    primaryDark: baseColors.primary.dark,
    primaryDarker: baseColors.primary.darker,
    primaryMedium: baseColors.primary.medium,
    primaryBackground: baseColors.primary.background,
    secondary: baseColors.secondary.DEFAULT,
    secondaryLight: baseColors.secondary.light,
    accent: baseColors.accent.DEFAULT,
    accentLight: baseColors.accent.light,
    accentDark: baseColors.accent.dark,
    background: baseColors.dark.background,
    surface: baseColors.dark.surface,
    text: baseColors.dark.text,
    textSecondary: baseColors.dark.textSecondary,
    border: baseColors.dark.border,
    card: baseColors.dark.card,
    shadow: baseColors.dark.shadow,
    success: baseColors.success.DEFAULT,
    successLight: baseColors.success.light,
    successDark: baseColors.success.dark,
    warning: baseColors.warning.DEFAULT,
    warningLight: baseColors.warning.light,
    warningDark: baseColors.warning.dark,
    error: baseColors.error.DEFAULT,
    errorLight: baseColors.error.light,
    errorDark: baseColors.error.dark,
    info: baseColors.info.DEFAULT,
    infoLight: baseColors.info.light,
    infoDark: baseColors.info.dark,
    transparent: baseColors.transparent,
    white: baseColors.white,
    black: baseColors.black,
    gray: baseColors.gray,
  },
  typography: {
    fontSize: typography.fontSize,
    lineHeight: typography.lineHeight,
    fontWeight: typography.fontWeight,
    fontFamily: typography.fontFamily,
    thin: typography.fontFamily.thin,
    extralight: typography.fontFamily.extralight,
    light: typography.fontFamily.light,
    regular: typography.fontFamily.regular,
    medium: typography.fontFamily.medium,
    semibold: typography.fontFamily.semibold,
    bold: typography.fontFamily.bold,
    extrabold: typography.fontFamily.extrabold,
    black: typography.fontFamily.black,
  },
  spacing,
  borderRadius,
  shadows,
  isDark: true,
};

export const getTheme = (colorScheme: ColorScheme): Theme => {
  return colorScheme === "dark" ? darkTheme : lightTheme;
};

export { baseColors as colors, typography, spacing, borderRadius, shadows };

export default {
  light: lightTheme,
  dark: darkTheme,
  colors: baseColors,
  typography,
  spacing,
  borderRadius,
  shadows,
};
