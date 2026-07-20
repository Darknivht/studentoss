import React from "react";
import { View } from "react-native";
import { MotiView } from "moti";
import { cn } from "@/lib/utils";

export interface ProgressProps {
  value?: number; // 0-100
  className?: string;
  indicatorClassName?: string;
}

export const Progress = ({ value = 0, className, indicatorClassName }: ProgressProps) => {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <MotiView
        from={{ width: "0%" as any }}
        animate={{ width: `${pct}%` as any }}
        transition={{ type: "timing", duration: 400 }}
        className={cn("h-full bg-primary", indicatorClassName)}
      />
    </View>
  );
};
