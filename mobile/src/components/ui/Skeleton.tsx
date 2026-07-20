import React from "react";
import { MotiView } from "moti";
import { cn } from "@/lib/utils";

export interface SkeletonProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const Skeleton = ({ className, width, height }: SkeletonProps) => (
  <MotiView
    from={{ opacity: 0.4 }}
    animate={{ opacity: 0.9 }}
    transition={{ type: "timing", duration: 900, loop: true, repeatReverse: true }}
    className={cn("rounded-md bg-muted", className)}
    style={{ width: width as any, height: height as any }}
  />
);
