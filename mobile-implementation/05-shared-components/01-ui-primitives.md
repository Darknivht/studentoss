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

