import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  isPassword = false,
  secureTextEntry,
  style,
  ...props
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const containerStyles: ViewStyle = {
    marginBottom: theme.spacing.md,
    ...containerStyle,
  };

  const labelStyle: TextStyle = {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing[1],
  };

  const inputContainerStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: error
      ? theme.colors.error
      : isFocused
      ? theme.colors.primary
      : theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    minHeight: 48,
  };

  const inputStyle: TextStyle = {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
    paddingVertical: theme.spacing[3],
  };

  const errorTextStyle: TextStyle = {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.error,
    marginTop: theme.spacing[1],
  };

  const handleTogglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={containerStyles}>
      {label && <Text style={labelStyle}>{label}</Text>}

      <View style={inputContainerStyle}>
        {leftIcon && (
          <View style={{ marginRight: theme.spacing[2] }}>{leftIcon}</View>
        )}

        <TextInput
          style={[inputStyle, style]}
          placeholderTextColor={theme.colors.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword ? !isPasswordVisible : secureTextEntry}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={handleTogglePasswordVisibility}
            style={{ marginLeft: theme.spacing[2] }}
          >
            <Text>{isPasswordVisible ? "👁️" : "👁️‍🗨️"}</Text>
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && (
          <View style={{ marginLeft: theme.spacing[2] }}>{rightIcon}</View>
        )}
      </View>

      {error && <Text style={errorTextStyle}>{error}</Text>}
    </View>
  );
};

export default Input;
