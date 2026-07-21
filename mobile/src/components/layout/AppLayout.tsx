import React from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft } from "lucide-react-native";
import { cn } from "@/lib/utils";

export interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  headerRight?: React.ReactNode;
  scroll?: boolean;
  padding?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentClassName?: string;
}

export function AppLayout({
  children,
  title,
  showBack = false,
  headerRight,
  scroll = true,
  padding = true,
  refreshing,
  onRefresh,
  contentClassName,
}: AppLayoutProps) {
  const navigation = useNavigation<any>();
  const showHeader = !!title || showBack || !!headerRight;

  const body = scroll ? (
    <ScrollView
      className={cn("flex-1", padding && "px-4")}
      contentContainerStyle={{ paddingBottom: 96 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor="hsl(262 83% 58%)" />
        ) : undefined
      }
    >
      <View className={cn(contentClassName)}>{children}</View>
    </ScrollView>
  ) : (
    <View className={cn("flex-1", padding && "px-4", contentClassName)}>{children}</View>
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {showHeader && (
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border/50 bg-background/80">
            <View className="flex-row items-center gap-2 flex-1">
              {showBack && (
                <Pressable
                  onPress={() => navigation.goBack()}
                  className="w-9 h-9 rounded-full items-center justify-center active:bg-muted"
                >
                  <ChevronLeft size={22} color="hsl(240 5% 84%)" />
                </Pressable>
              )}
              {!!title && (
                <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
                  {title}
                </Text>
              )}
            </View>
            {headerRight ? <View>{headerRight}</View> : null}
          </View>
        )}
        {body}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default AppLayout;
