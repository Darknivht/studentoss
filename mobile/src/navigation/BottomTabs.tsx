import React from "react";
import { View, Text, Pressable } from "react-native";
import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  Home,
  BookOpen,
  Calendar,
  Users,
  Library,
  Briefcase,
  LucideIcon,
} from "lucide-react-native";

import DashboardScreen from "../screens/DashboardScreen";
import StudyScreen from "../screens/StudyScreen";
import StoreScreen from "../screens/StoreScreen";
import PlanScreen from "../screens/PlanScreen";
import SocialScreen from "../screens/SocialScreen";
import CareerScreen from "../screens/CareerScreen";
import { useTheme } from "../context/ThemeContext";

const Tab = createBottomTabNavigator();

type TabDef = { name: string; label: string; icon: LucideIcon; component: React.ComponentType<any> };

const TABS: TabDef[] = [
  { name: "Dashboard", label: "Home", icon: Home, component: DashboardScreen },
  { name: "Study", label: "Study", icon: BookOpen, component: StudyScreen },
  { name: "Store", label: "Store", icon: Library, component: StoreScreen },
  { name: "Plan", label: "Plan", icon: Calendar, component: PlanScreen },
  { name: "Social", label: "Social", icon: Users, component: SocialScreen },
  { name: "Career", label: "Career", icon: Briefcase, component: CareerScreen },
];

const PRIMARY = "hsl(262 83% 58%)";
const MUTED = "hsl(240 4% 46%)";

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { resolved } = useTheme();

  return (
    <View
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
      className="absolute bottom-0 left-0 right-0"
    >
      <BlurView
        intensity={40}
        tint={resolved === "dark" ? "dark" : "light"}
        className="border-t border-border/60"
      >
        <View className="flex-row items-center justify-around py-2 px-1 max-w-lg mx-auto w-full">
          {state.routes.map((route, index) => {
            const tab = TABS.find((t) => t.name === route.name);
            if (!tab) return null;
            const isActive = state.index === index;
            const { options } = descriptors[route.key];
            const Icon = tab.icon;

            const scale = useSharedValue(isActive ? 1 : 0);
            React.useEffect(() => {
              scale.value = withSpring(isActive ? 1 : 0, { damping: 15, stiffness: 200 });
            }, [isActive]);

            const pillStyle = useAnimatedStyle(() => ({
              opacity: scale.value,
              transform: [{ scale: 0.85 + scale.value * 0.15 }],
            }));

            const dotStyle = useAnimatedStyle(() => ({
              opacity: scale.value,
              transform: [{ scale: scale.value }],
            }));

            const onPress = () => {
              Haptics.selectionAsync().catch(() => {});
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isActive && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isActive ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? tab.label}
                onPress={onPress}
                className="flex-1 items-center gap-0.5 py-1.5"
              >
                <View className="relative p-2 rounded-xl">
                  <Animated.View
                    style={pillStyle}
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                  />
                  <Icon size={20} color={isActive ? PRIMARY : MUTED} />
                </View>
                <Text
                  className="text-[10px] font-medium"
                  style={{ color: isActive ? PRIMARY : MUTED }}
                >
                  {tab.label}
                </Text>
                <Animated.View
                  style={dotStyle}
                  className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
                />
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarStyle: { position: "absolute" } }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      {TABS.map((t) => (
        <Tab.Screen key={t.name} name={t.name} component={t.component} />
      ))}
    </Tab.Navigator>
  );
}
