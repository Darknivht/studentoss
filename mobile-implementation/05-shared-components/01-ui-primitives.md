# ui-primitives — UI Primitives (shadcn → RN)

> **Web source:** `src/components/ui/*.tsx` (shadcn)
> **RN target:** `src/components/ui/*.tsx`

Every shadcn primitive has a RN twin with the SAME export name + prop shape so screens port without changes.

## Mapping table

| shadcn | RN file | Library used | Notes |
|---|---|---|---|
| Button | `Button.tsx` | `Pressable` + CVA | variants: default, destructive, outline, secondary, ghost, link, gradient. Sizes: sm, default, lg, icon. Adds haptic on press (light). |
| Input | `Input.tsx` | `TextInput` | Forwards ref. Adds `error` prop that shows red border + helper text. |
| Textarea | `Textarea.tsx` | `TextInput multiline` | autosize via onContentSizeChange |
| Card / CardHeader / CardContent / CardFooter | `Card.tsx` | `View` w/ shadow + border | Same composition API |
| Dialog | `Dialog.tsx` | `Modal` + animated overlay | Trap focus, dismiss on backdrop tap |
| Sheet / Drawer | `Sheet.tsx` | `@gorhom/bottom-sheet` | sides: bottom (default), left, right via separate `Drawer` |
| Select | `Select.tsx` | `@gorhom/bottom-sheet` list | Use system picker on iOS via `@react-native-picker/picker` |
| Switch | `Switch.tsx` | `Switch` (RN core) | tintColor = primary |
| Slider | `Slider.tsx` | `@react-native-community/slider` | |
| Checkbox | `Checkbox.tsx` | `Pressable` with check icon | |
| RadioGroup | `RadioGroup.tsx` | `Pressable` rows | |
| Tabs | `Tabs.tsx` | custom Reanimated indicator | use Material Top Tabs for routed tabs |
| Toast | `Toast.tsx` | `react-native-toast-message` or `burnt` | wire `useToast()` to it |
| Tooltip | `Tooltip.tsx` | `react-native-tooltip-2` | rarely used on mobile; prefer long-press hints |
| Popover | `Popover.tsx` | custom Modal with anchor measurement | |
| Avatar / AvatarFallback / AvatarImage | `Avatar.tsx` | `Image` + initials fallback | |
| Badge | `Badge.tsx` | View + Text | variants match shadcn |
| Progress | `Progress.tsx` | View with animated width | |
| Skeleton | `Skeleton.tsx` | `MotiView` with loop opacity | |
| Separator | `Separator.tsx` | View with height/width 1 | |
| ScrollArea | `ScrollArea.tsx` | `ScrollView` | RN already scrollable — mostly passthrough |
| Accordion | `Accordion.tsx` | `LayoutAnimation` + Pressable header | |
| Calendar | `Calendar.tsx` | `react-native-calendars` | |
| DropdownMenu | `DropdownMenu.tsx` | `@react-native-menu/menu` (uses native UIMenu / PopupMenu) | best UX |
| AlertDialog | `AlertDialog.tsx` | Dialog wrapper with two buttons | |
| Toggle / ToggleGroup | `Toggle.tsx` | Pressable with selected state | |

## CVA usage

Install `class-variance-authority`. Use exactly like web. Nativewind v4 accepts the resulting className strings.

```ts
import { cva } from 'class-variance-authority';
export const buttonVariants = cva('rounded-xl items-center justify-center', {
  variants: { variant: { default: 'bg-primary', outline: 'border border-border' }, size: { default: 'h-12 px-4' } },
});
```

## Acceptance
- [ ] Every web import path has a mobile equivalent
- [ ] Storybook (optional) renders all variants in light + dark
- [ ] All primitives respect `disabled` and `loading` states

<!-- STYLES_APPENDIX -->

## Styles & className mapping (NativeWind v4)

These are the **exact Tailwind class strings** used by the web counterpart(s). NativeWind v4 understands the same grammar — copy them straight into your RN component's `className=` and only swap the web-only utilities listed in `_APPENDIX/C-css-to-style-map.md` (e.g. `hover:*`, `backdrop-blur-*`, `transition-*` for non-Reanimated transitions).


### From `src/components/ui/dialog.tsx`

```text
h-4 w-4
sr-only

### From `src/components/ui/select.tsx`

```text
h-4 w-4 opacity-50
absolute left-2 flex h-3.5 w-3.5 items-center justify-center

### From `src/components/ui/progress.tsx`

```text
h-full w-full flex-1 bg-primary transition-all
```

### Conversion checklist

- Keep colour utilities (`bg-primary`, `text-foreground`, `border-border/50`) — defined in `01-design-system/01-colors-tokens.md`.
- Keep spacing, sizing, radius, flex, grid (when supported by NativeWind).
- Replace `hover:*` → use `Pressable`'s `pressed` state or Reanimated.
- Replace `backdrop-blur-*` → `expo-blur` `<BlurView>`.
- Replace `transition-*` / `animate-*` → Moti / Reanimated.
- Replace `cursor-*`, `select-*`, `pointer-events-*` → not needed on RN.
- Replace `grid grid-cols-N gap-X` → `<View className="flex-row flex-wrap gap-X">` or `FlashList numColumns={N}`.
