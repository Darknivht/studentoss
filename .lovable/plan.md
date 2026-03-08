

# Improve Error Handling, Fixes, and UI Polish

## Current State Assessment

After reviewing the codebase thoroughly, the previous stabilization work (auth hardening, subscription normalization, PWA cache strategy) is solid. The remaining issues fall into three categories: **missing error boundaries in data fetches**, **UI polish gaps**, and **minor reliability issues**.

## Plan

### 1. Add Loading Timeout Safety Nets
**Files:** `src/pages/Dashboard.tsx`, `src/components/gamification/DailyChallenges.tsx`, `src/components/dashboard/StudyProgressWidget.tsx`

- Add a hard 10-second timeout to `fetchData()` in Dashboard so it never hangs indefinitely if a network call stalls
- Same for DailyChallenges and StudyProgressWidget
- If timeout triggers, show cached data or zeros instead of infinite spinner

### 2. Fix DailyQuizChallenge Missing `authReady` Guard
**File:** `src/components/gamification/DailyQuizChallenge.tsx`

- The component uses `useAuth()` but only checks `user`, not `authReady` — it can attempt to read data before auth is initialized
- Add `authReady` check before any data operations

### 3. Fix AnnouncementBanner Unguarded Fetch
**File:** `src/components/dashboard/AnnouncementBanner.tsx`

- Fetches from `announcements` table on mount without any error handling — if the table doesn't exist or RLS blocks it, it silently fails but could cause console noise
- Wrap in try/catch and silently fail

### 4. Improve AppLayout Loading State
**File:** `src/components/layout/AppLayout.tsx`

- Add a maximum loading timeout (8s) so users don't see "Loading StudentOS..." forever if auth hangs
- After timeout, show a retry/reload option

### 5. Improve Dashboard Empty/Error States
**File:** `src/pages/Dashboard.tsx`

- When profile is null after loading, show a friendly fallback card instead of showing "0 days" / "0 XP" defaults
- Add pull-to-refresh / retry button if data fetch fails

### 6. Improve StreakCard Visual Polish
**File:** `src/components/dashboard/StreakCard.tsx`

- Add subtle animation when XP/streak values update
- Show "Start your streak!" message when streak is 0

### 7. Better Error Feedback in AI Tools
**File:** `src/components/ai-tools/AIToolLayout.tsx`

- When AI generation fails, show inline error with retry button instead of just toast
- Ensure loading state always resolves (add timeout guard)

### 8. Fix useStudyTimeTracker Missing authReady
**File:** `src/hooks/useStudyTimeTracker.ts`

- `refreshStats` only checks `user` but doesn't wait for `authReady`, potentially firing before session is ready
- Gate on `authReady`

### 9. Improve Profile Page Resilience
**File:** `src/pages/Profile.tsx`

- Add loading skeleton state while profile data loads
- Show inline error if profile fetch fails with retry option

### 10. Polish Bottom Navigation
**File:** `src/components/layout/BottomNav.tsx`

- Add haptic-style tap feedback animation
- Improve active state visibility with a dot indicator

## Files to modify
- `src/pages/Dashboard.tsx` — timeout + empty states + retry
- `src/components/gamification/DailyChallenges.tsx` — timeout safety
- `src/components/gamification/DailyQuizChallenge.tsx` — authReady guard
- `src/components/dashboard/StudyProgressWidget.tsx` — timeout safety
- `src/components/dashboard/AnnouncementBanner.tsx` — error handling
- `src/components/dashboard/StreakCard.tsx` — zero-state messaging
- `src/components/layout/AppLayout.tsx` — loading timeout + retry
- `src/components/ai-tools/AIToolLayout.tsx` — inline error + retry
- `src/hooks/useStudyTimeTracker.ts` — authReady guard
- `src/pages/Profile.tsx` — loading skeleton + error state
- `src/components/layout/BottomNav.tsx` — active indicator polish

