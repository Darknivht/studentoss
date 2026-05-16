# 16 — Focus

> **Web source of truth:** `src/pages/Focus.tsx`
> **RN target:** `src/screens/FocusScreen + FocusSessionScreen.tsx`
> **Route name:** `Focus + FocusSession`
> **Auth:** Required
> **Bottom nav visible:** Yes (only Focus, not session)

---

## 1. Purpose

Focus mode (app blocker). List of focus profiles, pick apps to block, start session with timer. Native deep integration on Android.

## 2. Data dependencies

Open the web file and copy **every hook call** into the RN screen unchanged. The data layer does not change.

- `supabase.from('focus_profiles').select()`
- `supabase.from('focus_sessions').select()` (history)
- Native module: `FocusModePlugin` (Expo config plugin wrapping AccessibilityService)

## 3. Layout (top → bottom)

**Focus:** profiles list + 'New profile' + history + stats. **FocusSession:** big timer + currently blocking N apps + Stop button + breakdown.

## 4. Component tree mapping

| Web element | RN replacement | Notes |
|---|---|---|
| AppSelector | bottom sheet listing installed apps (native module `expo-installed-apps` or custom) | search filter |
| BlockingOverlay | system overlay drawn by AccessibilityService; not RN | configured by plugin |
| timer | huge MM:SS, Reanimated digit transitions | |

## 5. Animations

- Timer digit flip
- Pulse ring around timer
- Session start: zoom into timer screen

## 6. Interactions & navigation

- Start session → request all permissions (USAGE_STATS, SYSTEM_ALERT_WINDOW, ACCESSIBILITY) → start foreground service
- Stop session early → confirm + reason prompt
- Profile tap → edit

## 7. Edge cases (MUST handle)

- Permission denied → show PermissionsSetup screen
- iOS: use FamilyControls API (Screen Time) — different flow
- App force-closed during session → restart via foreground service
- Session > 24h → cap at 8h with warning

## 8. Native enhancements (mobile-only wins)

- **Android:** AccessibilityService + UsageStatsManager + ForegroundService notification + SYSTEM_ALERT_WINDOW overlay
- **iOS:** FamilyControls + DeviceActivity (requires Apple entitlement)
- See `06-native-features/01-app-blocking-android.md` and `02-app-blocking-ios.md`

## 9. Performance

- Wrap large lists in `FlashList` (Shopify) instead of `FlatList` when item count > 50.
- Memoize cards with `React.memo` and stable keys.
- Hoist `renderItem` out of render; never inline arrow inside `FlatList`.
- Use `removeClippedSubviews` on long scroll views.
- Defer offscreen image loads with `expo-image` `priority="low"`.

## 10. Acceptance checklist

- [ ] Permissions flow completes
- [ ] Blocking actually prevents app launches (Android)
- [ ] Session survives app kill
- [ ] Stats logged correctly

## 11. Implementation order (for the agent)

1. Create the screen file with hooks copied verbatim from the web page.
2. Render a bare `<View>` with a `<Text>` of the title — verify route works.
3. Port the header / hero section.
4. Port each section top-to-bottom, one commit per section.
5. Wire animations LAST (only after layout is correct).
6. Test offline, slow 3G, and dark mode before marking done.

