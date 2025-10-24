import React from "react";
import {
  View,
  ActivityIndicator,
  Text,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";

export interface LoadingProps {
  size?: "small" | "large";
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  size = "large",
  color,
  text,
  fullScreen = false,
}) => {
  const theme = useTheme();

  const containerStyle: ViewStyle = fullScreen
    ? {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.colors.background,
      }
    : {
        justifyContent: "center",
        alignItems: "center",
        padding: theme.spacing.lg,
      };

  const textStyle: TextStyle = {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  };

  const indicatorColor = color || theme.colors.primary;

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={indicatorColor} />
      {text && <Text style={textStyle}>{text}</Text>}
    </View>
  );
};

export default Loading;
