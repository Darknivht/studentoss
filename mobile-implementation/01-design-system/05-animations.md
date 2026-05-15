# 05 — Animations

Web uses framer-motion heavily. We use **Moti** (framer-motion API on top of Reanimated) for declarative animations and **Reanimated 3 directly** for layout animations and gestures.

## Mapping

| Web framer-motion | RN Moti |
|---|---|
| `<motion.div initial={{opacity:0}} animate={{opacity:1}}>` | `<MotiView from={{opacity:0}} animate={{opacity:1}}>` |
| `<motion.div whileTap={{scale:0.9}}>` | wrap in `<Pressable>` + animate `scale` shared value (Reanimated) |
| `transition={{type:'spring', stiffness:300, damping:30}}` | `transition={{type:'spring', stiffness:300, damping:30}}` |
| `layoutId="activeTab"` | `<MotiView animateInitialState transition={{type:'spring'}}/>` + manual `position` prop |
| `<AnimatePresence>` | `<AnimatePresence>` (Moti has it) |

## Bottom nav active pill (port of web)

```tsx
// inside BottomTabBar
<MotiView
  from={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
  className="absolute inset-0 bg-primary/10 rounded-xl"
/>
```

## Tap micro-interaction

```tsx
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export function Tappable({ children, onPress }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPressIn={() => (scale.value = withSpring(0.95))}
      onPressOut={() => (scale.value = withSpring(1))}
      onPress={onPress}
    >
      <Animated.View style={style}>{children}</Animated.View>
    </Pressable>
  );
}
```

Use everywhere a card or button is tapped.

## Page transitions

React Navigation handles these — use `presentation: 'modal'` for slide-up sheets and default for push.

## Loading skeletons

Web uses `animate-pulse`. RN equivalent via Moti loop:

```tsx
<MotiView
  from={{ opacity: 0.4 }}
  animate={{ opacity: 1 }}
  transition={{ type: 'timing', duration: 800, loop: true, repeatReverse: true }}
  className="bg-muted rounded-xl h-6 w-32"
/>
```

## Confetti / celebration (achievements)

Use `react-native-confetti-cannon`.

## Haptics on every tap

Wrap `Tappable` to fire haptics:

```ts
import * as Haptics from 'expo-haptics';
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
```

## Acceptance

- [ ] Active bottom-tab pill animation indistinguishable from web
- [ ] All buttons feel tactile (light haptic + scale)
- [ ] No frame drops on a mid-range Android (Pixel 6a)
