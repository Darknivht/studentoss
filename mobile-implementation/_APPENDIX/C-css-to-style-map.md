# Appendix C — Tailwind/CSS → Nativewind Map

Nativewind v4 supports most utilities. Below are the ones that need attention.

## Works as-is
- Layout: `flex`, `flex-row`, `flex-1`, `items-center`, `justify-between`, `gap-4`
- Spacing: `p-*`, `m-*`, `px-*`, `py-*`, `space-x-*`, `space-y-*`
- Sizing: `w-*`, `h-*`, `max-w-*`, `min-h-*`
- Colors: `bg-*`, `text-*`, `border-*` (using semantic tokens)
- Border: `border`, `border-2`, `rounded-*`, `rounded-t-3xl`
- Typography: `text-sm`, `text-xl`, `font-bold`, `leading-*`, `tracking-*`
- Shadow: `shadow-sm` → `shadow-lg` (mapped to platform shadow + elevation)
- Opacity: `opacity-*`
- Display: `hidden`

## Works with caveats
- `gap-*` — works only inside `flex` containers (RN limitation)
- `text-center` — applies to Text only, not parent View
- `truncate` — use `numberOfLines={1}` prop on `<Text>` instead

## Doesn't work / needs alternative

| Tailwind class | RN replacement |
|---|---|
| `cursor-pointer` | N/A (touch implied) |
| `hover:*` | replaced with `pressed:` (Nativewind extension) |
| `focus:*` | replaced with `focus:` on TextInput |
| `select-none` | `<Text selectable={false}>` |
| `pointer-events-none` | `pointerEvents='none'` prop |
| `grid grid-cols-2` | `FlashList numColumns={2}` or `flexWrap: wrap` |
| `backdrop-blur` | `<BlurView />` from `expo-blur` |
| `overflow-x-scroll` | `<ScrollView horizontal>` |
| `inset-0` | `absolute top-0 left-0 right-0 bottom-0` (works in Nativewind) |
| `transition-*` | use Reanimated/Moti animations |
| `transform rotate-*` | needs `transform: [{ rotate: '45deg' }]` or use `rotate-45` Nativewind syntax |
| `aspect-square` | `aspect-square` works in Nativewind v4 |
| `bg-gradient-*` | `expo-linear-gradient` `<LinearGradient>` component |
| `divide-y` | render `<View className="h-px bg-border" />` between items |
| `space-x-*` with `flex-row` | works |
| `prose` / typography plugin | manually style Markdown output |

## Theme tokens

Define in `tailwind.config.js` as HSL:

```js
theme: {
  extend: {
    colors: {
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
      // ...etc, mirror web tokens
    }
  }
}
```

CSS variables live in `global.css` — Nativewind v4 reads them. Switch dark mode by toggling root class on `<View className={isDark?'dark':''}>` at app root.

