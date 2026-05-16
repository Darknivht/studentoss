# 18 — Profile

> **Web source of truth:** `src/pages/Profile.tsx`
> **RN target:** `src/screens/ProfileScreen.tsx`
> **Route name:** `Profile`
> **Auth:** Required
> **Bottom nav visible:** No (header back)

---

## 1. Purpose

View/edit own profile: avatar, bio, education, achievements showcase, stats, sign out.

## 2. Data dependencies

Open the web file and copy **every hook call** into the RN screen unchanged. The data layer does not change.

- `supabase.from('profiles').select().eq('id', user.id).single()`
- `useAchievements()` for showcase
- `supabase.storage.from('avatars').upload(...)`

## 3. Layout (top → bottom)

1. Header gradient hero with avatar (tap to change)
2. Name + handle + edit pencil
3. Bio (editable)
4. Stats row: XP, Level, Streak, Notes
5. Achievement showcase (top 6)
6. Education info
7. Action buttons: Settings, Upgrade, Sign Out

## 4. Component tree mapping

| Web element | RN replacement | Notes |
|---|---|---|
| AvatarUpload | port; uses `expo-image-picker` + crop | |
| achievement badge | small circular icon with tier color | tap → all achievements |

## 5. Animations

- Avatar pulse on upload success
- Stats count-up on mount
- Sign out: dim then navigate to Auth

## 6. Interactions & navigation

- Edit inline → debounced save
- Tap stat → drill-down (e.g. tap Streak → calendar)
- Sign out confirm dialog

## 7. Edge cases (MUST handle)

- Avatar upload >5MB → compress via `expo-image-manipulator`
- Username taken → error inline
- Sign out clears MMKV + secure store

## 8. Native enhancements (mobile-only wins)

- Camera or gallery picker for avatar
- Biometric required to confirm sign-out (optional pref)

## 9. Performance

- Wrap large lists in `FlashList` (Shopify) instead of `FlatList` when item count > 50.
- Memoize cards with `React.memo` and stable keys.
- Hoist `renderItem` out of render; never inline arrow inside `FlatList`.
- Use `removeClippedSubviews` on long scroll views.
- Defer offscreen image loads with `expo-image` `priority="low"`.

## 10. Acceptance checklist

- [ ] All edits persist
- [ ] Avatar crop works
- [ ] Sign out fully clears state

## 11. Implementation order (for the agent)

1. Create the screen file with hooks copied verbatim from the web page.
2. Render a bare `<View>` with a `<Text>` of the title — verify route works.
3. Port the header / hero section.
4. Port each section top-to-bottom, one commit per section.
5. Wire animations LAST (only after layout is correct).
6. Test offline, slow 3G, and dark mode before marking done.

