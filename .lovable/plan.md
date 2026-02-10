
# Onboarding Flow, More Radio Stations, and Resume Template Gating

## 1. Onboarding Flow (5 Slides) for Unauthenticated Users

Replace the current direct-to-auth flow with a 5-step onboarding experience for all unauthenticated users (mobile and desktop).

### Onboarding Slides

| Step | Title | Description | Icon |
|---|---|---|---|
| 1 | Welcome to StudentOS | Your AI-powered study companion that helps you learn smarter, not harder | BookOpen + logo |
| 2 | AI-Powered Learning | Smart notes, AI tutor, math solver, and more -- all powered by AI to help you understand any subject | Brain |
| 3 | Stay Focused | Pomodoro timer, focus radio, and app blocking keep you on track during study sessions | Target |
| 4 | Track Your Progress | Achievements, streaks, XP, and detailed stats to keep you motivated every day | Trophy |
| 5 | Study Together | Join study groups, challenge friends, and climb the leaderboard | Users |

### UI Design
- Full-screen pages with large icon/illustration at top, title, description text, and dot indicators at bottom
- "Next" button advances slides, "Skip" link goes straight to `/auth`
- Final slide has a "Get Started" button that navigates to `/auth`
- Smooth framer-motion transitions between slides (slide left/right)
- Swipe gesture support for mobile via framer-motion drag

### Routing Logic
In `App.tsx`:
- Create a `HomeRoute` wrapper component
- If user is authenticated: render Dashboard inside AppLayout
- If user is NOT authenticated: render the Onboarding component
- The onboarding stores a flag in localStorage (`onboarding_seen`) so returning unauthenticated visitors go straight to `/auth` instead of seeing it again

### Files
- **New**: `src/pages/Onboarding.tsx` -- 5-step onboarding with swipe/tap navigation
- **Modified**: `src/App.tsx` -- Add `HomeRoute` wrapper for `/` route

---

## 2. More Radio Stations (8 new, total 12)

Add 8 new stations to `src/components/planning/LofiRadio.tsx`:

| Station | Icon | Stream URL |
|---|---|---|
| Jazz Study | Music | zeno.fm jazz stream |
| Classical Focus | Music | zeno.fm classical stream |
| Ambient Space | Moon | zeno.fm ambient stream |
| Rain Sounds | Waves | zeno.fm rain stream |
| Piano Chill | Music | zeno.fm piano stream |
| Deep Focus | Radio | ilovemusic electronic stream |
| Cafe Vibes | Coffee | zeno.fm cafe stream |
| White Noise | Waves | zeno.fm white noise stream |

Update station grid from `grid-cols-2` to `grid-cols-3` on mobile and `grid-cols-4` on desktop.

### Files
- **Modified**: `src/components/planning/LofiRadio.tsx`

---

## 3. Resume Template Gating

Currently all 10 templates are selectable by everyone. Enforce limits: Free = 3, Plus = 7, Pro = all 10.

### Implementation
- Import `useSubscription` and `FeatureGateDialog` into `ResumeBuilder.tsx`
- When rendering the template grid, templates beyond the user's limit get a lock overlay and dimmed styling
- Clicking a locked template shows `FeatureGateDialog` instead of selecting it
- The first 3 templates are always available to free users

### Files
- **Modified**: `src/components/career/ResumeBuilder.tsx`

---

## Summary

| Change | Files |
|---|---|
| Onboarding flow | New: `src/pages/Onboarding.tsx`, Modified: `src/App.tsx` |
| Radio stations | Modified: `src/components/planning/LofiRadio.tsx` |
| Resume gating | Modified: `src/components/career/ResumeBuilder.tsx` |

No database changes required.
