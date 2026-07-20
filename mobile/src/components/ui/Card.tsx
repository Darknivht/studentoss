import React from "react";
import { View, Text, ViewProps, TextProps } from "react-native";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("rounded-2xl border border-border bg-card p-4", className)}
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = ({ className, ...props }: ViewProps & { className?: string }) => (
  <View className={cn("mb-3 flex-col gap-1", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: TextProps & { className?: string }) => (
  <Text className={cn("text-lg font-semibold text-foreground", className)} {...props} />
);

export const CardDescription = ({ className, ...props }: TextProps & { className?: string }) => (
  <Text className={cn("text-sm text-muted-foreground", className)} {...props} />
);

export const CardContent = ({ className, ...props }: ViewProps & { className?: string }) => (
  <View className={cn("", className)} {...props} />
);

export const CardFooter = ({ className, ...props }: ViewProps & { className?: string }) => (
  <View className={cn("mt-3 flex-row items-center", className)} {...props} />
);
