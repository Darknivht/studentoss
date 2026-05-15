# C — CSS / Tailwind → RN Style Map

Most Tailwind classes work via Nativewind. Notable conversions:

| Web class | RN handling |
|---|---|
| `flex` | RN default direction is column. Use `flex-row` explicitly. |
| `grid grid-cols-2 gap-3` | `<View className="flex-row flex-wrap gap-3">` + each child `w-[48%]` |
| `space-x-N` / `space-y-N` | use `gap-N` (Nativewind v4) |
| `hover:*`, `focus:*`, `active:*` | ignored — use Pressable's onPress* + animated states |
| `cursor-*`, `select-*` | ignored |
| `transition-*`, `animate-*` | ignored — use Reanimated/Moti |
| `backdrop-blur-*` | use `<BlurView intensity={N}>` from `expo-blur` |
| `bg-gradient-to-*` | use `<Gradient preset=...>` (see 01-design-system/04) |
| `divide-y` | manually add separators between children |
| `truncate`, `line-clamp-N` | use `<Text numberOfLines={N}>` |
| `whitespace-pre-wrap` | RN `<Text>` already preserves whitespace |
| `aspect-square`, `aspect-video` | use `aspect-ratio` style or compute manually |
| `safe-area-pb` | use `useSafeAreaInsets().bottom` |
| `min-h-screen` | `flex-1` on root container |
| `placeholder:*` | use `placeholderTextColor` prop |
| `ring-*` | use `borderWidth` + `borderColor` |
| `outline-*` | ignored |
