# 04-quotas-and-subscription — Quotas & Subscription

useSubscription hook ported verbatim. Reads profiles.subscription_tier and *_today counters. Server enforcement in ai-study/exam-practice edge fns is the source of truth. Client gates UX only.

## Acceptance
- [ ] Works in airplane mode then syncs on reconnect (where applicable)
- [ ] No race conditions on concurrent writes
