import React, { useState } from "react";
import { View, Text, Image } from "react-native";
import { cn } from "@/lib/utils";

export interface AvatarProps {
  src?: string | null;
  fallback?: string;
  size?: number;
  className?: string;
}

export const Avatar = ({ src, fallback = "?", size = 40, className }: AvatarProps) => {
  const [failed, setFailed] = useState(false);
  const initials = fallback.slice(0, 2).toUpperCase();

  return (
    <View
      className={cn("items-center justify-center overflow-hidden rounded-full bg-muted", className)}
      style={{ width: size, height: size }}
    >
      {src && !failed ? (
        <Image
          source={{ uri: src }}
          onError={() => setFailed(true)}
          style={{ width: size, height: size }}
        />
      ) : (
        <Text className="font-semibold text-foreground" style={{ fontSize: size * 0.4 }}>
          {initials}
        </Text>
      )}
    </View>
  );
};

export const AvatarImage = ({ src }: { src?: string }) => null; // API compatibility
export const AvatarFallback = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
