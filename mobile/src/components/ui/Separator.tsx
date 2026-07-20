import React from "react";
import { View } from "react-native";
import { cn } from "@/lib/utils";

export interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export const Separator = ({ orientation = "horizontal", className }: SeparatorProps) => (
  <View
    className={cn(
      "bg-border",
      orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
      className
    )}
  />
);
