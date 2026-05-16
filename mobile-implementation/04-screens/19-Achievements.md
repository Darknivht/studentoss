# 19 — Achievements

> **Web source of truth:** `src/pages/Achievements.tsx`
> **RN target:** `src/screens/AchievementsScreen.tsx`
> **Route name:** `Achievements`
> **Auth:** Required
> **Bottom nav visible:** No (header back)

---

## 1. Purpose

Show all 50+ achievements with progress bars, locked/unlocked states, categories, and unlock animations.

## 2. Data dependencies

Open the web file and copy **every hook call** into the RN screen unchanged. The data layer does not change.

- `useAchievements()` returns all definitions + user progress
- `supabase.from('user_achievements').select()`

## 3. Layout (top → bottom)

1. Header + filter chips (All / Unlocked / Locked / by category)
2. Stats: X/Y unlocked + total XP from achievements
3. Grid of achievement cards (2 cols)

## 4. Component tree mapping

| Web element | RN replacement | Notes |
|---|---|---|
| achievement card | icon + name + description + progress bar + tier badge | locked = greyscale + padlock |
| unlock toast | full-screen Lottie animation when newly unlocked | trigger from anywhere in app via context |

## 5. Animations

- Locked → unlocked: greyscale fade + bounce + confetti
- Progress bar fills on mount
- Card press: scale + lift

## 6. Interactions & navigation

- Tap card → detail bottom sheet with claim button (if reward unclaimed)
- 'Share' → share sheet with image

## 7. Edge cases (MUST handle)

- New achievement unlocked while elsewhere in app → queue toasts, show when tab focused
- Tier-locked achievements show 'Plus only' badge

## 8. Native enhancements (mobile-only wins)

- Haptic notification success on unlock
- Share as image (`react-native-view-shot`)

## 9. Performance

- Wrap large lists in `FlashList` (Shopify) instead of `FlatList` when item count > 50.
- Memoize cards with `React.memo` and stable keys.
- Hoist `renderItem` out of render; never inline arrow inside `FlatList`.
- Use `removeClippedSubviews` on long scroll views.
- Defer offscreen image loads with `expo-image` `priority="low"`.

## 10. Acceptance checklist

- [ ] All achievements listed with correct progress
- [ ] Unlock animation fires reliably
- [ ] Share works

## 11. Implementation order (for the agent)

1. Create the screen file with hooks copied verbatim from the web page.
2. Render a bare `<View>` with a `<Text>` of the title — verify route works.
3. Port the header / hero section.
4. Port each section top-to-bottom, one commit per section.
5. Wire animations LAST (only after layout is correct).
6. Test offline, slow 3G, and dark mode before marking done.

