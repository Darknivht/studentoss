import React from "react";
import { TextInput, TextInputProps, View, Text } from "react-native";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextInputProps {
  className?: string;
  error?: string;
  label?: string;
  minHeight?: number;
}

export const Textarea = React.forwardRef<TextInput, TextareaProps>(
  ({ className, error, label, minHeight = 96, style, ...props }, ref) => {
    return (
      <View className="w-full">
        {label ? <Text className="mb-1.5 text-sm font-medium text-foreground">{label}</Text> : null}
        <TextInput
          ref={ref}
          multiline
          textAlignVertical="top"
          placeholderTextColor="#9ca3af"
          className={cn(
            "rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground",
            error ? "border-destructive" : "",
            className
          )}
          style={[{ minHeight }, style]}
          {...props}
        />
        {error ? <Text className="mt-1 text-xs text-destructive">{error}</Text> : null}
      </View>
    );
  }
);
Textarea.displayName = "Textarea";
