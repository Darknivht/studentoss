# 22 — Misc (Privacy, Terms, NotFound, Index, Install, ResetPassword)

> **Web source of truth:** `src/pages/Privacy/Terms/NotFound/Index/Install/ResetPassword.tsx`
> **RN target:** `src/screens/PrivacyScreen + TermsScreen + NotFoundScreen + IndexScreen + ResetPasswordScreen.tsx`
> **Route name:** `Privacy, Terms, NotFound, Index, ResetPassword`
> **Auth:** Mixed
> **Bottom nav visible:** No

---

## 1. Purpose

Static/legal screens and minor utility screens.

## 2. Data dependencies

Open the web file and copy **every hook call** into the RN screen unchanged. The data layer does not change.

- ResetPassword: `supabase.auth.updateUser({ password })` after deep link establishes session
- Privacy/Terms: static markdown rendered via `react-native-marked`

## 3. Layout (top → bottom)

**Privacy/Terms:** scrollable markdown with header.
**NotFound:** illustration + 'Go home' button.
**Index:** splash; routes to Auth or Main based on session.
**ResetPassword:** new password + confirm + submit.
**Install:** N/A on mobile — delete (PWA only).

## 4. Component tree mapping

| Web element | RN replacement | Notes |
|---|---|---|
| markdown | `react-native-marked` | apply theme styles |
| splash | gradient + logo + spinner | match expo splash for seamless transition |

## 5. Animations

- Splash fade-out
- 404 illustration float
- Password fields shake on mismatch

## 6. Interactions & navigation

- ResetPassword: only accessible via `studentos://reset-password?token=...` deep link
- 404: 'Go home' resets nav stack

## 7. Edge cases (MUST handle)

- ResetPassword token expired → 'Request new link' state
- Privacy/Terms updates: show 'Updated DD MMM YYYY' header

## 8. Native enhancements (mobile-only wins)

- Splash uses `expo-splash-screen.preventAutoHideAsync()` until auth checked
- Deep link handler in NavigationContainer

## 9. Performance

- Wrap large lists in `FlashList` (Shopify) instead of `FlatList` when item count > 50.
- Memoize cards with `React.memo` and stable keys.
- Hoist `renderItem` out of render; never inline arrow inside `FlatList`.
- Use `removeClippedSubviews` on long scroll views.
- Defer offscreen image loads with `expo-image` `priority="low"`.

## 10. Acceptance checklist

- [ ] Splash → Auth or Main correctly
- [ ] Reset password flow works end-to-end
- [ ] Legal docs match web content

## 11. Implementation order (for the agent)

1. Create the screen file with hooks copied verbatim from the web page.
2. Render a bare `<View>` with a `<Text>` of the title — verify route works.
3. Port the header / hero section.
4. Port each section top-to-bottom, one commit per section.
5. Wire animations LAST (only after layout is correct).
6. Test offline, slow 3G, and dark mode before marking done.

