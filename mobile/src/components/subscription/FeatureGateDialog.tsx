import React from "react";
import { View, Text, Pressable } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { MotiView } from "moti";
import { Lock, Crown, Check } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { Dialog, DialogContent } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { SUBSCRIPTION_ENABLED } from "@/lib/subscriptionConfig";
import { cn } from "@/lib/utils";

export interface FeatureGateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  currentUsage: number;
  limit: number;
  isLifetime?: boolean;
  requiredTier?: "plus" | "pro";
}

const AnimatedCircle = Circle as any;

export function FeatureGateDialog({
  open,
  onOpenChange,
  feature,
  currentUsage,
  limit,
  isLifetime = false,
  requiredTier = "plus",
}: FeatureGateDialogProps) {
  const navigation = useNavigation<any>();
  if (!SUBSCRIPTION_ENABLED) return null;

  const tierLabel = requiredTier === "pro" ? "Pro" : "Plus";
  const usagePercent = limit > 0 ? Math.min((currentUsage / limit) * 100, 100) : 100;
  const R = 36;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC - (usagePercent / 100) * CIRC;

  const tiers = [
    { name: "Free", highlight: false, features: ["5 AI/day", "2 notes/day", "2 jobs/mo"] },
    { name: "Plus", highlight: requiredTier === "plus", features: ["20 AI/day", "8 notes/day", "10 jobs/mo"] },
    { name: "Pro", highlight: requiredTier === "pro", features: ["Unlimited", "Unlimited", "Unlimited"] },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <View className="items-center">
          <View className="w-20 h-20 relative mb-3 items-center justify-center">
            <MotiView
              from={{ rotate: "0deg" }}
              animate={{ rotate: "360deg" }}
              transition={{ type: "timing", duration: 800 }}
              style={{ position: "absolute" }}
            >
              <Svg width={80} height={80} style={{ transform: [{ rotate: "-90deg" }] }}>
                <Circle cx={40} cy={40} r={R} stroke="hsl(240 4% 26%)" strokeWidth={4} fill="none" />
                <AnimatedCircle
                  cx={40}
                  cy={40}
                  r={R}
                  stroke="hsl(0 84% 60%)"
                  strokeWidth={4}
                  fill="none"
                  strokeDasharray={CIRC}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                />
              </Svg>
            </MotiView>
            <Lock size={24} color="hsl(0 84% 60%)" />
          </View>
          <Text className="text-lg font-bold text-foreground text-center">
            {isLifetime ? "Lifetime Limit Reached" : "Limit Reached"}
          </Text>
          <Text className="text-sm text-muted-foreground text-center mt-1">
            You've used{" "}
            <Text className="font-bold text-foreground">
              {currentUsage}/{limit}
            </Text>{" "}
            {feature}.{isLifetime ? " Upgrade to unlock more capacity." : " Upgrade now for more."}
          </Text>
        </View>

        <View className="py-2 gap-4">
          <View className="flex-row gap-2">
            {tiers.map((t) => (
              <View
                key={t.name}
                className={cn(
                  "flex-1 rounded-xl p-2.5 gap-1.5 border",
                  t.highlight
                    ? "bg-primary/10 border-primary/30"
                    : "bg-muted/50 border-border"
                )}
              >
                <Text
                  className={cn(
                    "font-bold text-xs text-center",
                    t.highlight ? "text-primary" : "text-foreground"
                  )}
                >
                  {t.name}
                </Text>
                {t.features.map((f, i) => (
                  <View key={i} className="flex-row items-center justify-center gap-1">
                    <Check size={10} color="hsl(262 83% 58%)" />
                    <Text className="text-[10px] text-muted-foreground">{f}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <Button
            variant="gradient"
            leftIcon={<Crown size={16} color="#fff" />}
            onPress={() => {
              onOpenChange(false);
              navigation.navigate("Upgrade");
            }}
          >
            {`Upgrade to ${tierLabel}`}
          </Button>

          <Button variant="ghost" onPress={() => onOpenChange(false)}>
            Maybe later
          </Button>
        </View>
      </DialogContent>
    </Dialog>
  );
}

export default FeatureGateDialog;
