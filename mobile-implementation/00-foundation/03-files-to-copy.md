# 03 — Files to Copy (Verbatim, Zero Edits)

These files port from the web repo to `StudentOSMobile/src/...` with **no changes**. They are pure logic with no DOM, CSS, or browser globals.

## How to copy

From your web repo root:

```bash
WEB=~/path/to/lovable-web
MOB=~/path/to/StudentOSMobile

cp $WEB/src/integrations/supabase/types.ts          $MOB/src/integrations/supabase/types.ts

# Hooks (pure logic)
cp $WEB/src/hooks/useSubscription.ts                $MOB/src/hooks/useSubscription.ts
cp $WEB/src/hooks/useAchievements.ts                $MOB/src/hooks/useAchievements.ts
cp $WEB/src/hooks/useWeeklyXP.ts                    $MOB/src/hooks/useWeeklyXP.ts
cp $WEB/src/hooks/useStudyTimeTracker.ts            $MOB/src/hooks/useStudyTimeTracker.ts
cp $WEB/src/hooks/useCourseProgress.ts              $MOB/src/hooks/useCourseProgress.ts
cp $WEB/src/hooks/useActivityTracking.ts            $MOB/src/hooks/useActivityTracking.ts

# Lib (pure functions)
cp $WEB/src/lib/streak.ts                           $MOB/src/lib/streak.ts
cp $WEB/src/lib/subscriptionConfig.ts               $MOB/src/lib/subscriptionConfig.ts
cp $WEB/src/lib/educationConfig.ts                  $MOB/src/lib/educationConfig.ts
cp $WEB/src/lib/paystackConfig.ts                   $MOB/src/lib/paystackConfig.ts
cp $WEB/src/lib/formatters.ts                       $MOB/src/lib/formatters.ts
cp $WEB/src/lib/parseAIResponse.ts                  $MOB/src/lib/parseAIResponse.ts
cp $WEB/src/lib/resilientFetch.ts                   $MOB/src/lib/resilientFetch.ts
cp $WEB/src/lib/ai.ts                               $MOB/src/lib/ai.ts
cp $WEB/src/lib/utils.ts                            $MOB/src/lib/utils.ts   # cn() works (clsx + tw-merge)

# Backend (zero changes — same Supabase project)
cp -R $WEB/supabase $MOB/supabase
```

## Verbatim verification

After copying, run in the mobile project:

```bash
npx tsc --noEmit
```

If any of these files error, it means they secretly imported a browser API. Move them to `04-files-to-adapt.md`.

## Why these are safe

| File | Browser API used? |
|---|---|
| `types.ts` | None — generated types |
| `useSubscription.ts` | Only Supabase + React |
| `useAchievements.ts` | Only Supabase + React |
| `streak.ts` | Pure date math |
| `subscriptionConfig.ts` | Constants object |
| `educationConfig.ts` | Constants |
| `paystackConfig.ts` | Constants |
| `formatters.ts` | Pure functions |
| `parseAIResponse.ts` | String parsing |
| `resilientFetch.ts` | Uses global `fetch` — works in RN |
| `ai.ts` | Calls Supabase edge function via supabase-js |
| `utils.ts` | `clsx` + `tailwind-merge` — both work in RN |

## Edge functions

`supabase/functions/**` runs on Deno on Supabase infrastructure. Copy as-is. Same URLs, same auth, same RLS — the mobile app is just another client.

## Database schema

Do **not** create new tables. The mobile app uses the same project ref `aubastwqendcpwwbusgs`. Migrations stay in the web repo.

## Acceptance

- [ ] All 16 files copied
- [ ] `npx tsc --noEmit` passes in mobile project
- [ ] `import { has } from '@/lib/streak'` works
