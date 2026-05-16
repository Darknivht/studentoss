# 17 — Safety

> **Web source of truth:** `src/pages/Safety.tsx`
> **RN target:** `src/screens/SafetyScreen.tsx`
> **Route name:** `Safety`
> **Auth:** Required
> **Bottom nav visible:** Yes

---

## 1. Purpose

Parental controls + parent dashboard + offline mode toggle.

## 2. Data dependencies

Open the web file and copy **every hook call** into the RN screen unchanged. The data layer does not change.

- `supabase.from('parental_controls').select().eq('user_id', user.id).single()`
- `supabase.from('parent_links').select()`
- `useOfflineStatus()`

## 3. Layout (top → bottom)

Tabs: Parental Controls | Parent Dashboard | Offline Mode. Each tab renders the corresponding component.

## 4. Component tree mapping

| Web element | RN replacement | Notes |
|---|---|---|
| ParentalControls | switches + sliders for time limits, content filters, app block list | |
| ParentDashboard | charts of child usage; only visible to linked parent account | |
| OfflineMode | toggle 'cache mode' + list of downloaded items | |

## 5. Animations

- Switch toggle haptic
- Chart entrance: bars grow from baseline

## 6. Interactions & navigation

- Link parent: generate 6-digit code, parent enters on their device
- Time limit reached → focus mode auto-activates
- Offline mode ON: only cached content accessible

## 7. Edge cases (MUST handle)

- Underage user must have parent linked to enable certain features
- Parent unlink requires both parties
- Offline mode + new data → queue

## 8. Native enhancements (mobile-only wins)

- Notification when child exceeds time limit (to parent)
- Background sync for cached items

## 9. Performance

- Wrap large lists in `FlashList` (Shopify) instead of `FlatList` when item count > 50.
- Memoize cards with `React.memo` and stable keys.
- Hoist `renderItem` out of render; never inline arrow inside `FlatList`.
- Use `removeClippedSubviews` on long scroll views.
- Defer offscreen image loads with `expo-image` `priority="low"`.

## 10. Acceptance checklist

- [ ] Linking flow works both directions
- [ ] Time limits enforced
- [ ] Offline mode blocks network

## 11. Implementation order (for the agent)

1. Create the screen file with hooks copied verbatim from the web page.
2. Render a bare `<View>` with a `<Text>` of the title — verify route works.
3. Port the header / hero section.
4. Port each section top-to-bottom, one commit per section.
5. Wire animations LAST (only after layout is correct).
6. Test offline, slow 3G, and dark mode before marking done.

