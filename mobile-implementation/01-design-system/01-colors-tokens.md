# 01 — Color Tokens

The web app uses HSL CSS variables. We port them to a typed TS object so RN components can consume them either via Nativewind classes (preferred) or directly via `theme.colors.primary`.

## Source: `src/index.css`

Light mode:
```
--background: 240 20% 98%;
--foreground: 240 10% 10%;
--card: 0 0% 100%;
--popover: 0 0% 100%;
--primary: 262 83% 58%;
--primary-foreground: 0 0% 100%;
--secondary: 199 89% 48%;
--accent: 340 82% 52%;
--success: 142 71% 45%;
--warning: 38 92% 50%;
--muted: 240 5% 92%;
--muted-foreground: 240 4% 46%;
--destructive: 0 84% 60%;
--border: 240 6% 90%;
--input: 240 6% 90%;
--ring: 262 83% 58%;
--radius: 1rem;
```

Dark mode: see web file lines 58–110. Port both into `tokens.ts`.

## Create `src/theme/tokens.ts`

```ts
export const tokens = {
  light: {
    background: 'hsl(240, 20%, 98%)',
    foreground: 'hsl(240, 10%, 10%)',
    card: 'hsl(0, 0%, 100%)',
    cardForeground: 'hsl(240, 10%, 10%)',
    popover: 'hsl(0, 0%, 100%)',
    popoverForeground: 'hsl(240, 10%, 10%)',
    primary: 'hsl(262, 83%, 58%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondary: 'hsl(199, 89%, 48%)',
    secondaryForeground: 'hsl(0, 0%, 100%)',
    accent: 'hsl(340, 82%, 52%)',
    accentForeground: 'hsl(0, 0%, 100%)',
    success: 'hsl(142, 71%, 45%)',
    successForeground: 'hsl(0, 0%, 100%)',
    warning: 'hsl(38, 92%, 50%)',
    warningForeground: 'hsl(0, 0%, 100%)',
    muted: 'hsl(240, 5%, 92%)',
    mutedForeground: 'hsl(240, 4%, 46%)',
    destructive: 'hsl(0, 84%, 60%)',
    destructiveForeground: 'hsl(0, 0%, 100%)',
    border: 'hsl(240, 6%, 90%)',
    input: 'hsl(240, 6%, 90%)',
    ring: 'hsl(262, 83%, 58%)',
  },
  dark: {
    background: 'hsl(240, 10%, 8%)',
    foreground: 'hsl(240, 10%, 95%)',
    card: 'hsl(240, 10%, 12%)',
    cardForeground: 'hsl(240, 10%, 95%)',
    popover: 'hsl(240, 10%, 12%)',
    popoverForeground: 'hsl(240, 10%, 95%)',
    primary: 'hsl(262, 83%, 65%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondary: 'hsl(199, 89%, 55%)',
    secondaryForeground: 'hsl(0, 0%, 100%)',
    accent: 'hsl(340, 82%, 60%)',
    accentForeground: 'hsl(0, 0%, 100%)',
    success: 'hsl(142, 71%, 50%)',
    successForeground: 'hsl(0, 0%, 100%)',
    warning: 'hsl(38, 92%, 55%)',
    warningForeground: 'hsl(0, 0%, 100%)',
    muted: 'hsl(240, 5%, 20%)',
    mutedForeground: 'hsl(240, 5%, 60%)',
    destructive: 'hsl(0, 84%, 60%)',
    destructiveForeground: 'hsl(0, 0%, 100%)',
    border: 'hsl(240, 5%, 20%)',
    input: 'hsl(240, 5%, 20%)',
    ring: 'hsl(262, 83%, 65%)',
  },
} as const;

export const radius = {
  sm: 12, md: 14, lg: 16, xl: 20, '2xl': 24, '3xl': 32,
};

export type Theme = typeof tokens.light;
```

## Theme provider

```ts
// src/theme/ThemeProvider.tsx
import { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { tokens, Theme } from './tokens';

const mmkv = new MMKV({ id: 'theme' });
const Ctx = createContext<{ theme: Theme; mode: 'light' | 'dark' | 'system'; setMode: (m: any) => void }>({} as any);

export function ThemeProvider({ children }) {
  const sys = useColorScheme();
  const [mode, setModeState] = useState<'light' | 'dark' | 'system'>(
    (mmkv.getString('mode') as any) ?? 'system'
  );
  const effective = mode === 'system' ? (sys ?? 'light') : mode;
  const theme = tokens[effective];
  const setMode = (m) => { mmkv.set('mode', m); setModeState(m); };
  return <Ctx.Provider value={{ theme, mode, setMode }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
```

## Acceptance

- [ ] `tokens.light.primary === 'hsl(262, 83%, 58%)'`
- [ ] Toggling system dark mode flips the theme automatically
- [ ] Theme override persists across app restart via MMKV
