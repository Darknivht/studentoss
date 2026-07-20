import React from "react";
import { Modal, View, Pressable, ViewProps } from "react-native";
import { MotiView } from "moti";
import { cn } from "@/lib/utils";

export interface SheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  side?: "bottom" | "top" | "left" | "right";
  children: React.ReactNode;
  className?: string;
}

export const Sheet = ({ open, onOpenChange, side = "bottom", children, className }: SheetProps) => {
  const isVertical = side === "bottom" || side === "top";
  const from =
    side === "bottom"
      ? { translateY: 400 }
      : side === "top"
      ? { translateY: -400 }
      : side === "left"
      ? { translateX: -400 }
      : { translateX: 400 };

  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={() => onOpenChange(false)}
    >
      <Pressable
        onPress={() => onOpenChange(false)}
        className={cn(
          "flex-1 bg-black/60",
          side === "bottom" && "justify-end",
          side === "top" && "justify-start",
          side === "left" && "flex-row",
          side === "right" && "flex-row justify-end"
        )}
      >
        <MotiView
          from={from as any}
          animate={{ translateX: 0, translateY: 0 }}
          transition={{ type: "timing", duration: 220 }}
          style={isVertical ? { width: "100%" } : { height: "100%" }}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              className={cn(
                "border border-border bg-card p-5",
                side === "bottom" && "rounded-t-2xl",
                side === "top" && "rounded-b-2xl",
                side === "left" && "h-full rounded-r-2xl",
                side === "right" && "h-full rounded-l-2xl",
                className
              )}
            >
              {children}
            </View>
          </Pressable>
        </MotiView>
      </Pressable>
    </Modal>
  );
};

export const SheetContent = ({ children, className, ...props }: ViewProps & { className?: string }) => (
  <View className={className} {...props}>{children}</View>
);
