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

