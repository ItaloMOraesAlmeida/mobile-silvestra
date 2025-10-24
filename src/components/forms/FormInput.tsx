import React from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Input } from "../ui/Input";
import { TextInputProps } from "react-native";

interface FormInputProps<T extends FieldValues>
  extends Omit<TextInputProps, "value" | "onChangeText"> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  placeholder?: string;
  isPassword?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
}

export function FormInput<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  isPassword = false,
  leftIcon,
  rightIcon,
  disabled = false,
  ...props
}: FormInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => (
        <Input
          label={label}
          placeholder={placeholder}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
          isPassword={isPassword}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          editable={!disabled}
          {...props}
        />
      )}
    />
  );
}
