
Goal: Fix the systemic “nothing loads / shows Free / AI not generating” regression by stabilizing auth initialization, data-fetch timing, and stale API caching.

1) Root-cause hardening (auth + race conditions)
- Refactor `src/hooks/useAuth.tsx` so session restore is completed first, then listeners run.
- Stop awaiting database calls inside `onAuthStateChange` callback (move blocked-user check to fire-and-forget helper).
- Expose an explicit auth-ready signal so features don’t query too early.

2) Make critical data fetches auth-ready + resilient
- Update these high-impact files to fetch only when auth is ready and user exists:
  - `src/hooks/useSubscription.ts`
  - `src/pages/Profile.tsx`
  - `src/pages/Dashboard.tsx`
  - `src/components/gamification/DailyChallenges.tsx`
  - `src/components/dashboard/StudyProgressWidget.tsx`
  - `src/components/study/StreakCalendar.tsx`
  - `src/hooks/useStudyTimeTracker.ts`
- Add shared timeout + retry utility (short backoff, 2 retries) for profile/subscription/stats queries.
- Preserve last good state on transient errors instead of reverting to default Free/0.

3) Fix subscription misclassification and gating side effects
- Normalize tier values safely (`trim().toLowerCase()`), and keep active-expiry checks robust.
- Prevent paid users from being treated as Free while subscription is still loading:
  - `src/components/ads/AdBanner.tsx`
  - `src/components/ai-tools/AIToolLayout.tsx`
- Keep auto-refresh on focus/online + `subscription-updated` event.

4) Fix AI request reliability end-to-end
- Unify cloud AI calls to use authenticated session token (not static publishable bearer) in:
  - `src/lib/ai.ts`
  - `src/hooks/useOfflineAI.ts`
- Ensure all AI loaders exit on failure and show user-facing error feedback (no hanging generation state).

5) Remove stale authenticated API caching risk
- In `vite.config.ts`, change authenticated REST API runtime cache strategy from cached fallback to network-only for user data endpoints.
- Keep asset/storage caching as-is.
- Bump cache namespace/version so old stale API entries are invalidated.

6) Verification pass (must-pass checklist)
```text
A) Free user: XP/streak/challenges load after refresh
B) Pro/Plus user: tier badge + gated tools unlock correctly
C) AI tools: generate response successfully, fail gracefully when backend fails
D) Profile page: no default fallback values when real data exists
E) Dashboard: no infinite loading widgets
F) After hard refresh + Force Update: same correct behavior
```

Technical implementation notes
- This is primarily a frontend-state and cache-coherency fix; no schema changes required.
- If any user is found without profile data during implementation, add a safe profile self-heal upsert path at auth init (without changing auth tables).
