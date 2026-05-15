# 02 — Typography

Web uses Space Grotesk (display/headings) + Inter (body) loaded from Google Fonts.

## Install

```bash
npx expo install expo-font @expo-google-fonts/space-grotesk @expo-google-fonts/inter
```

## Load at app start

```ts
// App.tsx
import { useFonts, SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

export default function App() {
  const [loaded] = useFonts({
    SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
    Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });
  if (!loaded) return null; // splash stays
  return <RootNavigator />;
}
```

## Tailwind font family extension

In `tailwind.config.ts` (mobile copy):

```ts
fontFamily: {
  sans: ['Inter_400Regular'],
  display: ['SpaceGrotesk_700Bold'],
  // weights
  'sans-medium': ['Inter_500Medium'],
  'sans-semibold': ['Inter_600SemiBold'],
  'sans-bold': ['Inter_700Bold'],
  'display-semibold': ['SpaceGrotesk_600SemiBold'],
}
```

Now `<Text className="font-display text-2xl">Hello</Text>` matches `<h1>` in web.

## Type scale (mirrors Tailwind defaults)

| Token | Size / line | Web class |
|---|---|---|
| `text-xs` | 12 / 16 | text-xs |
| `text-sm` | 14 / 20 | text-sm |
| `text-base` | 16 / 24 | text-base |
| `text-lg` | 18 / 28 | text-lg |
| `text-xl` | 20 / 28 | text-xl |
| `text-2xl` | 24 / 32 | text-2xl |
| `text-3xl` | 30 / 36 | text-3xl |
| `text-4xl` | 36 / 40 | text-4xl |

Nativewind handles all of this automatically.

## Anti-aliasing

iOS does font smoothing automatically. Android: enable `android:hardwareAccelerated="true"` (already default in Expo).

## Acceptance

- [ ] H1 in mobile and web match in size, weight, line-height to within 1px
- [ ] Body Inter at 16px renders identical x-height
