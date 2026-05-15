# 02 — Bottom Nav Port

Port of `src/components/layout/BottomNav.tsx`. Same icons, labels, order, animations.

## MainTabs

```tsx
// src/navigation/MainTabs.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BookOpen, Library, Calendar, Users, Briefcase } from 'lucide-react-native';
import { MotiView } from 'moti';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import * as Haptics from 'expo-haptics';

import Dashboard from '@/screens/Dashboard';
import Study from '@/screens/Study';
import Store from '@/screens/Store';
import Plan from '@/screens/Plan';
import Social from '@/screens/Social';
import Career from '@/screens/Career';

const Tab = createBottomTabNavigator();

const items = [
  { name: 'Dashboard', label: 'Home',   Icon: Home,      Component: Dashboard },
  { name: 'Study',     label: 'Study',  Icon: BookOpen,  Component: Study },
  { name: 'Store',     label: 'Store',  Icon: Library,   Component: Store },
  { name: 'Plan',      label: 'Plan',   Icon: Calendar,  Component: Plan },
  { name: 'Social',    label: 'Social', Icon: Users,     Component: Social },
  { name: 'Career',    label: 'Career', Icon: Briefcase, Component: Career },
];

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {items.map(({ name, Component }) => (
        <Tab.Screen key={name} name={name} component={Component} />
      ))}
    </Tab.Navigator>
  );
}

function CustomTabBar({ state, navigation }) {
  const { theme } = useTheme();
  return (
    <View
      className="flex-row items-center justify-around bg-card/80 border-t border-border px-1 pt-2"
      style={{ paddingBottom: 12 + (insets?.bottom ?? 0) }}
    >
      {state.routes.map((route, idx) => {
        const isActive = state.index === idx;
        const item = items[idx];
        const Icon = item.Icon;
        return (
          <Pressable
            key={route.key}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate(route.name);
            }}
            className="relative flex-col items-center gap-0.5 py-1.5 px-2"
          >
            <View className="relative p-2 rounded-xl">
              {isActive && (
                <MotiView
                  from={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                />
              )}
              <Icon size={20} color={isActive ? theme.primary : theme.mutedForeground} />
            </View>
            <Text
              className={`text-[10px] font-sans-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {item.label}
            </Text>
            {isActive && (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'spring' }}
                className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
```

(Replace `insets?.bottom` with `useSafeAreaInsets().bottom`.)

## Why custom tab bar

The default React Navigation tab bar can't replicate the layoutId-based shared pill animation from web. Custom bar is ~60 lines and 100% pixel-faithful.

## Acceptance

- [ ] Active tab pill animates in/out matching web
- [ ] Hardware back from a non-Home tab returns to Dashboard
- [ ] Tab bar respects safe-area inset on devices with home bar
