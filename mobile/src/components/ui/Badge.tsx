import React from "react";
import { View, Text, ViewProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("self-start rounded-full px-2.5 py-0.5", {
  variants: {
    variant: {
      default: "bg-primary",
      secondary: "bg-secondary",
      destructive: "bg-destructive",
      outline: "border border-border bg-transparent",
      success: "bg-success",
      warning: "bg-warning",
    },
  },
  defaultVariants: { variant: "default" },
});

const badgeTextVariants = cva("text-xs font-semibold", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      destructive: "text-destructive-foreground",
      outline: "text-foreground",
      success: "text-success-foreground",
      warning: "text-warning-foreground",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends ViewProps, VariantProps<typeof badgeVariants> {
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

export const Badge = ({ variant, className, textClassName, children, ...props }: BadgeProps) => (
  <View className={cn(badgeVariants({ variant }), className)} {...props}>
    {typeof children === "string" ? (
      <Text className={cn(badgeTextVariants({ variant }), textClassName)}>{children}</Text>
    ) : (
      children
    )}
  </View>
);
