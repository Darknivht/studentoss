# 06 — Icons

```bash
npm i lucide-react-native
```

Lucide's RN package has the **exact same icon names** as the web `lucide-react`. Find/replace `lucide-react` → `lucide-react-native` in all ported files.

## Sizing & color

```tsx
import { Home } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';

const { theme } = useTheme();
<Home size={20} color={theme.primary} strokeWidth={2} />
```

## Bottom nav icons (mirror web)

```ts
const navItems = [
  { icon: Home,      label: 'Home',   route: 'Dashboard' },
  { icon: BookOpen,  label: 'Study',  route: 'Study' },
  { icon: Library,   label: 'Store',  route: 'Store' },
  { icon: Calendar,  label: 'Plan',   route: 'Plan' },
  { icon: Users,     label: 'Social', route: 'Social' },
  { icon: Briefcase, label: 'Career', route: 'Career' },
];
```

(Same icon set, same labels, same order as `src/components/layout/BottomNav.tsx`.)

## App icon + adaptive icon

`assets/icon.png` 1024×1024. Adaptive icon foreground/background in `app.config.ts`. Use the same brand-purple background `#9333ea`.

## Acceptance

- [ ] Every web icon has a 1:1 mobile equivalent
- [ ] Icon colors react to theme changes
