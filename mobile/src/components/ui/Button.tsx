import React from "react";
import { Pressable, Text, ActivityIndicator, View, PressableProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "flex-row items-center justify-center rounded-xl",
  {
    variants: {
      variant: {
        default: "bg-primary",
        destructive: "bg-destructive",
        outline: "border border-border bg-transparent",
        secondary: "bg-secondary",
        ghost: "bg-transparent",
        link: "bg-transparent",
        gradient: "bg-transparent",
      },
      size: {
        default: "h-12 px-4",
        sm: "h-9 px-3",
        lg: "h-14 px-6",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

const textVariants = cva("font-semibold text-base", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      destructive: "text-destructive-foreground",
      outline: "text-foreground",
      secondary: "text-secondary-foreground",
      ghost: "text-foreground",
      link: "text-primary underline",
      gradient: "text-white",
    },
    size: {
      default: "text-base",
      sm: "text-sm",
      lg: "text-lg",
      icon: "text-base",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export interface ButtonProps
  extends Omit<PressableProps, "children">,
    VariantProps<typeof buttonVariants> {
  children?: React.ReactNode;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<View, ButtonProps>(
  (
    { variant, size, className, textClassName, children, loading, disabled, leftIcon, rightIcon, onPress, ...rest },
    ref
  ) => {
    const content = (
      <>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
            {typeof children === "string" ? (
              <Text className={cn(textVariants({ variant, size }), textClassName)}>{children}</Text>
            ) : (
              children
            )}
            {rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
          </>
        )}
      </>
    );

    const handlePress: PressableProps["onPress"] = (e) => {
      if (disabled || loading) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onPress?.(e);
    };

    if (variant === "gradient") {
      return (
        <Pressable
          ref={ref as any}
          disabled={disabled || loading}
          onPress={handlePress}
          className={cn("rounded-xl overflow-hidden", (disabled || loading) && "opacity-50", className)}
          {...rest}
        >
          <LinearGradient
            colors={["#7C3AED", "#2563EB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          >
            <View className={cn(buttonVariants({ variant, size }), "bg-transparent")}>{content}</View>
          </LinearGradient>
        </Pressable>
      );
    }

    return (
      <Pressable
        ref={ref as any}
        disabled={disabled || loading}
        onPress={handlePress}
        className={cn(buttonVariants({ variant, size }), (disabled || loading) && "opacity-50", className)}
        {...rest}
      >
        {content}
      </Pressable>
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
