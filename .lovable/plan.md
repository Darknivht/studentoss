

# Fix Loading Issues and Stale Cache for Returning Users

## Root Cause Analysis

After reviewing the codebase, the main problems causing "infinite loading" and broken AI features for returning users are:

1. **Stale Service Worker**: `skipWaiting: false` in `vite.config.ts` means old service workers keep serving outdated JavaScript bundles even after you deploy updates. Old users get stuck on broken cached code.

2. **Edge Function responses are cached**: The workbox config caches AI function responses (`supabase-functions-cache`) for up to 1 hour. If the cached response is stale or malformed, AI features break silently.

3. **No Error Boundary**: When any component crashes (due to stale code or missing data), the entire app breaks with no recovery option. Users see a blank white screen or infinite spinner.

4. **No fetch timeouts or retries**: Components like Dashboard, StudyProgressWidget, and StudyTimeWidget fetch data without timeouts. If a request hangs, the loading spinner runs forever.

## Plan

### A. Fix Service Worker to Auto-Update (`vite.config.ts`)
- Change `skipWaiting: false` to `skipWaiting: true` so new service workers activate immediately on deploy
- Remove `supabase-functions-cache` from runtime caching entirely (AI/function responses should never be cached)
- This single change will fix most "old users can't load" issues

### B. Add Global Error Boundary (`src/components/ErrorBoundary.tsx`)
- Create a React Error Boundary that catches component crashes
- Show a friendly "Something went wrong" screen with a "Reload App" button that clears cache and reloads
- Wrap the entire app in this boundary in `App.tsx`

### C. Add Fetch Timeouts and Retry Logic
- Create a utility `fetchWithTimeout` wrapper in `src/lib/utils.ts`
- Update `src/lib/ai.ts` to add a 30-second timeout on AI stream requests so they don't hang forever
- Add error handling that shows a toast instead of infinite loading

### D. Add App Version Display
- Add an `APP_VERSION` constant (based on build timestamp)
- Show it on the Profile page next to the Force Update button so users and you can verify they're on the latest version

## Files Modified

| File | Change |
|------|--------|
| `vite.config.ts` | skipWaiting: true, remove functions cache |
| `src/components/ErrorBoundary.tsx` | New global error boundary |
| `src/App.tsx` | Wrap with ErrorBoundary |
| `src/lib/ai.ts` | Add AbortController timeout to stream/callAI |
| `src/pages/Profile.tsx` | Show app version |

