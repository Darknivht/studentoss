# 21 — Settings

> **Web source of truth:** `src/pages/Profile (settings drawer) or dedicated.tsx`
> **RN target:** `src/screens/SettingsScreen.tsx`
> **Route name:** `Settings`
> **Auth:** Required
> **Bottom nav visible:** No

---

## 1. Purpose

Theme, notifications, language, account, privacy, data export, delete account, app version, force update.

## 2. Data dependencies

Open the web file and copy **every hook call** into the RN screen unchanged. The data layer does not change.

- `useTheme()` from `next-themes` equivalent (custom theme context backed by MMKV)
- `useNotifications()` for permission state
- `supabase.from('profiles').update({...})`

## 3. Layout (top → bottom)

Sectioned list: Account | Appearance | Notifications | Study | Privacy | Data | About. Each section has list rows.

## 4. Component tree mapping

| Web element | RN replacement | Notes |
|---|---|---|
| list row | label + value + chevron or switch | |
| theme picker | radio: System / Light / Dark | |
| notifications row | switch + 'Schedule' link if enabled | |

## 5. Animations

- Section reorder fade
- Switch flip
- Force-update button shows spinner then success check

## 6. Interactions & navigation

- Theme change applies instantly app-wide
- Notification schedule → modal with time picker
- 'Force update' clears Workbox SW + reloads (RN: clears Expo Updates cache + restarts)
- 'Delete account' → 3-step confirm + reason → call edge function

## 7. Edge cases (MUST handle)

- OS-level notif permission revoked → row shows 'Enable in Settings' + opens system
- Theme: respect system change in 'System' mode
- Language: store in MMKV + i18n

## 8. Native enhancements (mobile-only wins)

- `expo-linking.openSettings()`
- `expo-updates.reloadAsync()` for force update
- `expo-localization` for default language

## 9. Performance

- Wrap large lists in `FlashList` (Shopify) instead of `FlatList` when item count > 50.
- Memoize cards with `React.memo` and stable keys.
- Hoist `renderItem` out of render; never inline arrow inside `FlatList`.
- Use `removeClippedSubviews` on long scroll views.
- Defer offscreen image loads with `expo-image` `priority="low"`.

## 10. Acceptance checklist

- [ ] Every setting persists
- [ ] Theme applies app-wide
- [ ] Delete account fully removes data

## 11. Implementation order (for the agent)

1. Create the screen file with hooks copied verbatim from the web page.
2. Render a bare `<View>` with a `<Text>` of the title — verify route works.
3. Port the header / hero section.
4. Port each section top-to-bottom, one commit per section.
5. Wire animations LAST (only after layout is correct).
6. Test offline, slow 3G, and dark mode before marking done.

