# AnnouncementBanner — AnnouncementBanner

> **Web source:** `src/components/dashboard/AnnouncementBanner.tsx`
> **RN target:** same

## Purpose
Show admin-broadcast announcements at top of Dashboard.

## Data
```ts
supabase.from('announcements')
  .select('*')
  .eq('active', true)
  .lte('start_at', new Date().toISOString())
  .gte('end_at', new Date().toISOString())
  .order('priority', { ascending: false });
```

## Variants
- `info` — blue card with Info icon
- `warning` — amber card with AlertTriangle icon
- `promo` — gradient (primary → accent) with Sparkles icon

## Dismissal
Store dismissed IDs in MMKV under key `dismissed_announcements`. Filter them out from query result.
Swipe-right to dismiss (Reanimated `Swipeable`), or X button top-right.

## Animations
- Mount: slide-down from top with spring
- Dismiss: slide-right + fade out (300ms)
- Promo variant has subtle shimmer (Moti looped gradient translateX)

## Deep link action
If announcement has `action_url`, primary button opens it: in-app route (`studentos://...`) or external (`Linking.openURL`).

## Acceptance
- [ ] Only active announcements show
- [ ] Dismissals persist across launches
- [ ] Swipe + button dismiss both work

<!-- STYLES_APPENDIX -->

## Styles & className mapping (NativeWind v4)

These are the **exact Tailwind class strings** used by the web counterpart(s). NativeWind v4 understands the same grammar — copy them straight into your RN component's `className=` and only swap the web-only utilities listed in `_APPENDIX/C-css-to-style-map.md` (e.g. `hover:*`, `backdrop-blur-*`, `transition-*` for non-Reanimated transitions).


### From `src/components/dashboard/AnnouncementBanner.tsx`

```text
w-4 h-4
space-y-2
mt-0.5
flex-1 min-w-0
font-medium text-sm
text-xs opacity-80 mt-0.5
opacity-60 hover:opacity-100
```

### Conversion checklist

- Keep colour utilities (`bg-primary`, `text-foreground`, `border-border/50`) — defined in `01-design-system/01-colors-tokens.md`.
- Keep spacing, sizing, radius, flex, grid (when supported by NativeWind).
- Replace `hover:*` → use `Pressable`'s `pressed` state or Reanimated.
- Replace `backdrop-blur-*` → `expo-blur` `<BlurView>`.
- Replace `transition-*` / `animate-*` → Moti / Reanimated.
- Replace `cursor-*`, `select-*`, `pointer-events-*` → not needed on RN.
- Replace `grid grid-cols-N gap-X` → `<View className="flex-row flex-wrap gap-X">` or `FlashList numColumns={N}`.
