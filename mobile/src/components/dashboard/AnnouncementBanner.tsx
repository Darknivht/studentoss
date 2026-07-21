import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { Megaphone, AlertTriangle, Gift, X } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  action_url?: string | null;
}

const DISMISSED_KEY = "dismissed_announcements";

const typeConfig: Record<
  string,
  { Icon: React.ComponentType<any>; container: string; iconColor: string }
> = {
  info: {
    Icon: Megaphone,
    container: "bg-primary/10 border-primary/20",
    iconColor: "hsl(262 83% 58%)",
  },
  warning: {
    Icon: AlertTriangle,
    container: "bg-amber-500/10 border-amber-500/20",
    iconColor: "hsl(38 92% 50%)",
  },
  promo: {
    Icon: Gift,
    container: "bg-green-500/10 border-green-500/20",
    iconColor: "hsl(142 71% 45%)",
  },
};

export function AnnouncementBanner() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DISMISSED_KEY);
        if (raw) setDismissed(new Set(JSON.parse(raw)));
      } catch {}

      try {
        const { data } = await supabase
          .from("announcements" as any)
          .select("id, title, content, type, action_url")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(3);
        if (data) setItems(data as any[]);
      } catch {
        // non-critical
      }
    })();
  }, []);

  const dismiss = async (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    try {
      await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]));
    } catch {}
  };

  const openAction = (url?: string | null) => {
    if (!url) return;
    if (url.startsWith("studentos://")) {
      const path = url.replace("studentos://", "");
      try {
        navigation.navigate(path);
      } catch {
        Linking.openURL(url).catch(() => {});
      }
      return;
    }
    Linking.openURL(url).catch(() => {});
  };

  const visible = items.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <View className="gap-2">
      <AnimatePresence>
        {visible.map((a) => {
          const cfg = typeConfig[a.type] ?? typeConfig.info;
          return (
            <MotiView
              key={a.id}
              from={{ opacity: 0, translateY: -8 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateX: 40 }}
              transition={{ type: "spring", damping: 18 }}
              className={cn(
                "flex-row items-start gap-3 p-3 rounded-lg border",
                cfg.container
              )}
            >
              <View className="mt-0.5">
                <cfg.Icon size={16} color={cfg.iconColor} />
              </View>
              <Pressable
                className="flex-1"
                onPress={() => openAction(a.action_url)}
                disabled={!a.action_url}
              >
                <Text className="font-medium text-sm text-foreground">{a.title}</Text>
                <Text className="text-xs text-muted-foreground mt-0.5">{a.content}</Text>
              </Pressable>
              <Pressable onPress={() => dismiss(a.id)} className="opacity-60 p-1">
                <X size={16} color="hsl(240 4% 46%)" />
              </Pressable>
            </MotiView>
          );
        })}
      </AnimatePresence>
    </View>
  );
}

export default AnnouncementBanner;
