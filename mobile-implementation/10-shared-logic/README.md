# 10 — Shared logic (copy-verbatim from web)

Single source of truth for files that mobile copies **byte-for-byte** from the web repo. If any file below stops compiling on mobile, it secretly touches a browser API — move it to `../00-foundation/04-files-to-adapt.md`.

## Copy verbatim

### Types
- `src/integrations/supabase/types.ts` → `mobile/src/integrations/supabase/types.ts`

### Hooks (pure business logic)
- `src/hooks/useSubscription.ts`
- `src/hooks/useAchievements.ts`
- `src/hooks/useWeeklyXP.ts`
- `src/hooks/useStudyTimeTracker.ts`
- `src/hooks/useCourseProgress.ts`
- `src/hooks/useActivityTracking.ts`

### Lib
- `src/lib/streak.ts`
- `src/lib/subscriptionConfig.ts`
- `src/lib/educationConfig.ts`
- `src/lib/paystackConfig.ts`
- `src/lib/formatters.ts`
- `src/lib/parseAIResponse.ts`
- `src/lib/resilientFetch.ts`
- `src/lib/ai.ts`
- `src/lib/utils.ts`

### Backend
- Entire `supabase/` folder (edge functions + migrations) — same project ref `aubastwqendcpwwbusgs`.

## Copy script (from mobile/)
```bash
WEB=../
cp $WEB/src/integrations/supabase/types.ts src/integrations/supabase/
cp $WEB/src/hooks/{useSubscription,useAchievements,useWeeklyXP,useStudyTimeTracker,useCourseProgress,useActivityTracking}.ts src/hooks/
cp $WEB/src/lib/{streak,subscriptionConfig,educationConfig,paystackConfig,formatters,parseAIResponse,resilientFetch,ai,utils}.ts src/lib/
```

## Verification
After copying, run `npx tsc --noEmit` inside `mobile/`. Any error = that file touches DOM/browser → adapt list.
