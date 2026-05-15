# 04 — Gradients & Shadows

## Gradients

Web uses Tailwind `bg-gradient-to-br from-primary to-accent`. RN has no gradient backgrounds — use `expo-linear-gradient`.

### Helper component

```tsx
// src/components/ui/Gradient.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';

type Preset = 'primary-accent' | 'primary-secondary' | 'success' | 'warning' | 'sunset';

const presets = (t) => ({
  'primary-accent':    [t.primary, t.accent],
  'primary-secondary': [t.primary, t.secondary],
  'success':           [t.success, '#10b981'],
  'warning':           [t.warning, t.accent],
  'sunset':            ['#f97316', t.accent, t.primary],
});

export function Gradient({ preset = 'primary-accent', children, style, className, ...rest }) {
  const { theme } = useTheme();
  const colors = presets(theme)[preset];
  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style} className={className} {...rest}>
      {children}
    </LinearGradient>
  );
}
```

### Usage table — match web → RN

| Web | RN |
|---|---|
| `bg-gradient-to-br from-primary to-accent` | `<Gradient preset="primary-accent">` |
| `bg-gradient-to-r from-primary to-secondary` | `<Gradient preset="primary-secondary" start={{x:0,y:0.5}} end={{x:1,y:0.5}}>` |
| Splash screen | Solid `#9333ea` (primary in hex) — Expo splash doesn't support gradients |

## Shadows

Web custom shadows from `tailwind.config.ts`:

```ts
glow:        '0 0 40px hsl(var(--primary) / 0.3)',
'glow-lg':   '0 0 60px hsl(var(--primary) / 0.4)',
elevated:    '0 20px 40px -10px hsl(var(--foreground) / 0.1)',
```

### iOS

```ts
const shadows = {
  glow: {
    shadowColor: 'hsl(262, 83%, 58%)',
    shadowOpacity: 0.3,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
  },
  glowLg: {
    shadowColor: 'hsl(262, 83%, 58%)',
    shadowOpacity: 0.4,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
  },
  elevated: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 20 },
  },
};
```

### Android

Android only supports `elevation` (no color, no offset). Approximations:

```ts
const elevation = { glow: 12, glowLg: 16, elevated: 8 };
```

For Android-glow effect with color, layer a soft `<LinearGradient>` behind the card with low opacity — see Dashboard cards.

### Combined helper

```ts
// src/theme/shadows.ts
import { Platform } from 'react-native';

export function shadow(name: 'glow' | 'glowLg' | 'elevated') {
  if (Platform.OS === 'android') return { elevation: { glow: 12, glowLg: 16, elevated: 8 }[name] };
  return iosShadows[name];
}
```

Use:

```tsx
<View className="bg-card rounded-3xl p-6" style={shadow('glow')}>
```

## Acceptance

- [ ] A purple glow card on iOS matches the web `shadow-glow` look
- [ ] Android equivalent shows distinct elevation, not flat
