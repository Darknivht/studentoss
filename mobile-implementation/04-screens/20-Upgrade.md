# 20 — Upgrade

> **Web source of truth:** `src/pages/Upgrade.tsx`
> **RN target:** `src/screens/UpgradeScreen.tsx`
> **Route name:** `Upgrade`
> **Auth:** Required
> **Bottom nav visible:** No

---

## 1. Purpose

Show subscription tiers (Free, Plus, Pro), monthly/yearly toggle, feature matrix, Paystack checkout.

## 2. Data dependencies

Open the web file and copy **every hook call** into the RN screen unchanged. The data layer does not change.

- `useSubscription()` for current tier
- Pricing from `lib/paystackConfig.ts` and `lib/subscriptionConfig.ts`
- `supabase.functions.invoke('verify-payment', ...)` after Paystack callback

## 3. Layout (top → bottom)

1. Hero: 'Unlock your potential'
2. Monthly/Yearly toggle (save 20% on yearly)
3. 3 tier cards (Free | Plus highlighted | Pro)
4. Feature comparison table (collapsible)
5. FAQ section
6. Sticky CTA at bottom

## 4. Component tree mapping

| Web element | RN replacement | Notes |
|---|---|---|
| tier card | gradient, shadow, scale on focus | 'Most Popular' badge on Plus |
| feature row | check or ✕ per tier | accordion |
| Paystack | open via WebView or `react-native-paystack-webview` | callback via deep link |

## 5. Animations

- Toggle slides with spring
- Tier card lifts on press
- Confetti on successful upgrade

## 6. Interactions & navigation

- Tap tier → WebView with Paystack inline checkout
- On success → call `verify-payment` edge function with reference
- 'Restore purchase' (iOS App Store IAP if used instead)

## 7. Edge cases (MUST handle)

- Payment failed → toast + log
- Already on selected tier → 'You're on this plan' button
- Referral bonus active → show modified pricing
- Use existing typo: `PAYSTACK_SERCET_KEY`

## 8. Native enhancements (mobile-only wins)

- iOS App Store: must use IAP (Apple policy) — alternative path
- Deep link `studentos://paystack/callback`

## 9. Performance

- Wrap large lists in `FlashList` (Shopify) instead of `FlatList` when item count > 50.
- Memoize cards with `React.memo` and stable keys.
- Hoist `renderItem` out of render; never inline arrow inside `FlatList`.
- Use `removeClippedSubviews` on long scroll views.
- Defer offscreen image loads with `expo-image` `priority="low"`.

## 10. Acceptance checklist

- [ ] Successful payment upgrades tier
- [ ] Verify-payment runs server-side
- [ ] iOS uses IAP (if shipping iOS)

## 11. Implementation order (for the agent)

1. Create the screen file with hooks copied verbatim from the web page.
2. Render a bare `<View>` with a `<Text>` of the title — verify route works.
3. Port the header / hero section.
4. Port each section top-to-bottom, one commit per section.
5. Wire animations LAST (only after layout is correct).
6. Test offline, slow 3G, and dark mode before marking done.

