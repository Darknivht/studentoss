

# Fix Slow Admin Pages and Payment Not Reflecting

## Root Causes Found

### 1. Admin Pages Loading Slowly
All 7 admin tabs use `forceMount`, which means every tab mounts and fetches data simultaneously when the admin page opens. This fires 7+ edge function calls and multiple database queries in parallel the instant you authenticate -- even for tabs you never look at.

### 2. Payment Not Reflecting on Frontend
The database IS updated correctly after payment (confirmed in the database). The problem is in the frontend:
- In `Upgrade.tsx` line 142, `refetch()` is called but NOT awaited -- meaning the page may not wait for the fresh subscription data
- `useSubscription` only fetches on initial mount (when `user` changes) -- if the user stays on the same page, the stale "free" state persists even after the DB is updated
- There's no mechanism to force-refresh the subscription after returning from a payment flow

---

## Fix Plan

### A. Remove `forceMount` from Admin Tabs (Fix Slow Loading)

**File:** `src/pages/AdminResources.tsx`

- Remove `forceMount` and the `data-[state=inactive]:hidden` class from all 7 `TabsContent` elements
- This way, only the active tab mounts and fetches data -- switching tabs triggers the new tab's `useEffect`
- Result: admin page loads in ~1 second instead of 5-10+

### B. Fix Payment Subscription Refresh

**File:** `src/pages/Upgrade.tsx`

- Add `await` to the `refetch()` call on line 142 (after successful verification)
- Add a small delay before refetch to let the database update propagate
- After refetch completes, force a page state update so the UI immediately reflects the new tier

**File:** `src/hooks/useSubscription.ts`

- Expose a `forceRefresh` function that clears the current state and re-fetches from the database
- Add a `useEffect` that listens for a custom event (e.g., `subscription-updated`) so any component can trigger a refresh
- This ensures the subscription state is always fresh after payment, even if the user navigates away and back

### C. Optimize Analytics Edge Function (Prevent Future Slowdowns)

**File:** `supabase/functions/admin-resources/index.ts`

- For the `analytics` action, the queries fetching `study_sessions.select('total_minutes')` and `profiles.select('current_streak')` currently fetch ALL rows (up to 1000 limit). With growth, this will break.
- Change these to use `.limit(1000)` explicitly and add pagination awareness, or switch to count-only queries where possible
- For the daily chart data queries, add `.limit(1000)` to prevent silent truncation

### D. Add Subscription Auto-Refresh on Navigation

**File:** `src/hooks/useSubscription.ts`

- Add a timestamp check: if the last subscription fetch was more than 5 minutes ago, auto-refetch when any gated feature is accessed
- This catches cases where the DB was updated (by payment or admin) but the frontend hasn't refreshed

---

## Technical Summary

| Fix | File(s) | Impact |
|-----|---------|--------|
| Remove forceMount from tabs | AdminResources.tsx | Immediate 5-10x faster admin load |
| Await refetch after payment | Upgrade.tsx | Payment tier reflects instantly |
| Add subscription refresh mechanism | useSubscription.ts | Catches all missed updates |
| Optimize analytics queries | admin-resources/index.ts | Prevents future slowdowns |

## Sequencing

1. Remove `forceMount` (fastest fix, biggest impact)
2. Fix payment refetch flow (critical user-facing bug)
3. Add subscription auto-refresh
4. Optimize analytics queries

