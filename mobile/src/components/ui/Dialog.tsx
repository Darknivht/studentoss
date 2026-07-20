import React, { createContext, useContext } from "react";
import { Modal, View, Text, Pressable, ViewProps, TextProps } from "react-native";
import { cn } from "@/lib/utils";

type Ctx = { open: boolean; onOpenChange: (v: boolean) => void };
const DialogCtx = createContext<Ctx | null>(null);

export const Dialog = ({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
}) => (
  <DialogCtx.Provider value={{ open, onOpenChange }}>
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={() => onOpenChange(false)}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/60 p-6"
        onPress={() => onOpenChange(false)}
      >
        <Pressable onPress={(e) => e.stopPropagation()} className="w-full max-w-md">
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  </DialogCtx.Provider>
);

export const DialogContent = ({ className, children, ...props }: ViewProps & { className?: string }) => (
  <View
    className={cn("rounded-2xl border border-border bg-card p-5", className)}
    {...props}
  >
    {children}
  </View>
);

export const DialogHeader = ({ className, ...props }: ViewProps & { className?: string }) => (
  <View className={cn("mb-3 flex-col gap-1", className)} {...props} />
);

export const DialogFooter = ({ className, ...props }: ViewProps & { className?: string }) => (
  <View className={cn("mt-4 flex-row justify-end gap-2", className)} {...props} />
);

export const DialogTitle = ({ className, ...props }: TextProps & { className?: string }) => (
  <Text className={cn("text-lg font-semibold text-foreground", className)} {...props} />
);

export const DialogDescription = ({ className, ...props }: TextProps & { className?: string }) => (
  <Text className={cn("text-sm text-muted-foreground", className)} {...props} />
);

export const useDialog = () => {
  const ctx = useContext(DialogCtx);
  if (!ctx) throw new Error("useDialog must be used inside <Dialog>");
  return ctx;
};
