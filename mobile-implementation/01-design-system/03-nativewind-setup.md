# 03 — Nativewind Setup

Nativewind v4 lets us write `<View className="bg-primary rounded-2xl p-4">` and have it work on iOS/Android.

## tailwind.config.ts (mobile)

Copy from web verbatim. Two edits:

```ts
content: ['./App.tsx', './src/**/*.{ts,tsx}'],
presets: [require('nativewind/preset')], // ADD
```

**Keep** every token: colors (use the `hsl(var(--...))` pattern via runtime CSS vars below), spacing, radius, shadows, animations.

## Wire CSS vars to RN

Nativewind v4 supports CSS variables. Create `src/global.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 240 20% 98%;
    --foreground: 240 10% 10%;
    --card: 0 0% 100%;
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
  }
  .dark:root {
    --background: 240 10% 8%;
    --foreground: 240 10% 95%;
    --card: 240 10% 12%;
    --primary: 262 83% 65%;
    /* ...rest from web index.css dark block... */
  }
}
```

Import in `App.tsx`:

```ts
import './src/global.css';
```

## Toggling dark class

```tsx
import { useColorScheme } from 'nativewind';
const { colorScheme, setColorScheme } = useColorScheme();
setColorScheme('dark'); // or 'light' or 'system'
```

## Common gotchas

| Web class | RN behavior |
|---|---|
| `flex` | RN default is column; you may need `flex-row` |
| `space-x-4` | Use `gap-4` (Nativewind v4 supports it) |
| `hidden md:block` | Responsive prefixes work (md = 768px) |
| `cursor-pointer` | Ignored — fine |
| `select-none` | Ignored — fine |
| `transition-all` | Ignored — use Reanimated |
| `hover:` | Ignored — RN has no hover |
| `backdrop-blur-xl` | Use `expo-blur` `<BlurView>` instead |

## Acceptance

- [ ] `<View className="bg-primary text-primary-foreground rounded-2xl p-4">` renders correct color
- [ ] Dark mode toggle flips colors
- [ ] Responsive prefix `xs:` works on small phones
