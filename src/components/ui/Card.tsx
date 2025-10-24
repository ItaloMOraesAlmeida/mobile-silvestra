import React from "react";
import { View, ViewProps, ViewStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export interface CardProps extends ViewProps {
  variant?: "default" | "outlined" | "elevated";
  padding?: number;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = "default",
  padding,
  children,
  style,
  ...props
}) => {
  const theme = useTheme();

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: padding !== undefined ? padding : theme.spacing.cardPadding,
    };

    switch (variant) {
      case "outlined":
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      case "elevated":
        return {
          ...baseStyle,
          ...theme.shadows.md,
        };
      case "default":
      default:
        return {
          ...baseStyle,
          ...theme.shadows.sm,
        };
    }
  };

  return (
    <View style={[getCardStyle(), style]} {...props}>
      {children}
    </View>
  );
};

export default Card;
