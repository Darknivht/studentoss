import React from "react";
import { TextInput, TextInputProps, View, Text } from "react-native";
import { cn } from "@/lib/utils";

export interface InputProps extends TextInputProps {
  className?: string;
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, error, label, ...props }, ref) => {
    return (
      <View className="w-full">
        {label ? <Text className="mb-1.5 text-sm font-medium text-foreground">{label}</Text> : null}
        <TextInput
          ref={ref}
          placeholderTextColor="#9ca3af"
          className={cn(
            "h-12 rounded-xl border border-border bg-background px-4 text-base text-foreground",
            error ? "border-destructive" : "",
            className
          )}
          {...props}
        />
        {error ? <Text className="mt-1 text-xs text-destructive">{error}</Text> : null}
      </View>
    );
  }
);
Input.displayName = "Input";
