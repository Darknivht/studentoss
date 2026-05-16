# quotas-and-subscription — Quotas & Subscription

## Tiers
| Tier | Daily AI | Mock exam Qs | Resume templates | Ads |
|---|---|---|---|---|
| Free | 5 | 20 | 1 | Yes |
| Plus | 30 | 50 | 5 | No |
| Pro | 100 | 100 | All | No |

## Source of truth
Subscription state from `useSubscription()` hook → reads `supabase.from('subscriptions').select().eq('user_id', user.id).single()`.
Cache locally in MMKV with 5min TTL.

## Quota enforcement
- **Client check first** (fast UX): if local counter ≥ limit, show FeatureGateDialog before calling edge.
- **Server check authoritative**: every AI edge function (`ai-study`, `exam-practice`) increments + checks `ai_usage` table. Returns 429 if exceeded.

```sql
create table ai_usage (
  user_id uuid references auth.users on delete cascade,
  date date,
  count int default 0,
  primary key (user_id, date)
);
```

Local counter syncs from server response (`x-quota-remaining` header).

## Paystack on mobile
Use `react-native-paystack-webview` or open Paystack inline checkout in `WebBrowser.openAuthSessionAsync`. Callback via deep link `studentos://paystack/callback?reference=xxx` → call `verify-payment` edge function with reference → updates subscription.

(Important: continue to use the existing typo `PAYSTACK_SERCET_KEY` in edge function env var.)

## iOS IAP
If shipping iOS, Apple requires IAP for digital subscriptions. Use `expo-in-app-purchases` (or RevenueCat). Bridge IAP receipt → server validation → update `subscriptions` table.

## Restore purchases (iOS)
Settings → Restore Purchases → re-validates receipt → re-applies tier.

## Referral
3 paying friends = 1 month free (see referral memory). Track via `referrals` table; cron edge function applies credit.

## Acceptance
- [ ] Free user blocked at quota
- [ ] Plus/Pro upgrade flows complete on Android (Paystack) and iOS (IAP)
- [ ] Restore works on iOS
- [ ] Quota resets daily at midnight user-local

