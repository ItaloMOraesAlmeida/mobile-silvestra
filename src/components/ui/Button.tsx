import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  ...props
}) => {
  const theme = useTheme();

  const getBackgroundColor = (): string => {
    if (disabled) return theme.colors.gray[300];

    switch (variant) {
      case "primary":
        return theme.colors.primary;
      case "secondary":
        return theme.colors.secondary;
      case "outline":
      case "ghost":
        return "transparent";
      default:
        return theme.colors.primary;
    }
  };

  const getTextColor = (): string => {
    if (disabled) return theme.colors.gray[500];

    switch (variant) {
      case "primary":
      case "secondary":
        return theme.colors.white;
      case "outline":
      case "ghost":
        return theme.colors.primary;
      default:
        return theme.colors.white;
    }
  };

  const getBorderColor = (): string | undefined => {
    if (variant === "outline") {
      return disabled ? theme.colors.gray[300] : theme.colors.primary;
    }
    return undefined;
  };

  const getPadding = (): {
    paddingVertical: number;
    paddingHorizontal: number;
  } => {
    switch (size) {
      case "sm":
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case "lg":
        return { paddingVertical: 16, paddingHorizontal: 32 };
      case "md":
      default:
        return { paddingVertical: 12, paddingHorizontal: 24 };
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case "sm":
        return theme.typography.fontSize.sm;
      case "lg":
        return theme.typography.fontSize.lg;
      case "md":
      default:
        return theme.typography.fontSize.base;
    }
  };

  const containerStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius: theme.borderRadius.md,
    borderWidth: variant === "outline" ? 2 : 0,
    borderColor: getBorderColor(),
    ...getPadding(),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: fullWidth ? "100%" : undefined,
    opacity: disabled ? 0.6 : 1,
    ...theme.shadows.sm,
  };

  const textStyle: TextStyle = {
    color: getTextColor(),
    fontSize: getFontSize(),
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: "center",
  };

  return (
    <TouchableOpacity
      style={[containerStyle, style]}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {leftIcon && <>{leftIcon}</>}
          <Text style={textStyle}>{title}</Text>
          {rightIcon && <>{rightIcon}</>}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
