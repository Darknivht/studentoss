

# Fix Radio Stations, Add Daily Quiz Challenge, Improve Streak System, and Redesign Onboarding

## 1. Fix Radio Stations with Verified Streams

Replace all zeno.fm streams (many are Nigerian radio/news broadcasts) with verified, reliable music/ambient streams. Use known-good sources like ilovemusic.de (German music streams), and SomaFM (free listener-supported radio).

**File: `src/components/planning/LofiRadio.tsx`**

Updated station list with verified URLs:

| Station | Source | Type |
|---|---|---|
| Lofi Hip Hop | SomaFM Groove Salad | Ambient/Downtempo |
| Chillhop | iloveradio17 (iLoveMusic) | Chillhop |
| Sleep Sounds | SomaFM Drone Zone | Deep ambient |
| Nature Sounds | SomaFM Illinois Street Lounge | Smooth background |
| Jazz Study | SomaFM Secret Agent | Jazz/spy-fi |
| Classical Focus | SomaFM Bagel Radio | Classical |
| Ambient Space | SomaFM Space Station | Space ambient |
| Rain & Thunder | Rainymood-style stream | Rain sounds |
| Piano Chill | SomaFM Seven Inch Soul | Mellow |
| Deep Focus | iloveradio21 (iLoveMusic) | Deep electronic |
| Cafe Vibes | SomaFM Boot Liquor | Cafe acoustic |
| White Noise | SomaFM Fluid | Electronic ambient |

All streams will be from SomaFM (somafm.com) or ilovemusic.de -- both are free, reliable, ad-free music streams with no news broadcasts.

---

## 2. Daily Quiz Challenge (5 Questions, 10 XP Each)

Add a new "Daily Brain Boost" challenge -- a quick 5-question general knowledge quiz that appears once per day. Completing it counts as a study activity (updates streak) and awards 10 XP per correct answer (max 50 XP).

### How It Works
- A new component `DailyQuizChallenge` is added to the Study page and Dashboard
- 5 random questions are generated from a pool of 50+ hardcoded general knowledge questions (math, science, vocabulary, history, geography)
- Each correct answer = 10 XP, awarded immediately
- Completing the quiz (regardless of score) counts as a daily study activity and updates the streak via `updateStreak()`
- The quiz can only be taken once per day (tracked via localStorage `daily_quiz_date`)
- Results are saved to the `quiz_attempts` table for tracking

### New Files
- `src/components/gamification/DailyQuizChallenge.tsx` -- The quiz component with timer, animations, and score display

### Modified Files
- `src/pages/Dashboard.tsx` -- Add DailyQuizChallenge card between StreakCard and StudyTimeWidget
- `src/components/gamification/DailyChallenges.tsx` -- Add a 5th challenge type "Complete Daily Quiz" that tracks whether the daily quiz was done today

---

## 3. Improve Streak Tracking

Currently the streak system exists but the daily challenge doesn't have a "quick quiz to earn streak" mechanic. This change ties the daily quiz directly into streak building.

### Modified Files
- `src/components/gamification/DailyQuizChallenge.tsx` -- On quiz completion, call `updateStreak(userId)` from `src/lib/streak.ts` and `awardXP(userId, correctCount * 10)` from `src/hooks/useWeeklyXP.ts`
- `src/components/gamification/DailyChallenges.tsx` -- Add a 5th challenge: "Daily Brain Boost - Complete the daily quiz" with 50 XP reward, tracking completion via localStorage check

---

## 4. Redesign Onboarding (7 Pages, Much More Beautiful)

Completely redesign `src/pages/Onboarding.tsx` with 7 slides, richer visuals, gradient backgrounds, floating particle animations, and 3D-style animated icons.

### 7 Onboarding Slides

| Slide | Title | Description | Visual |
|---|---|---|---|
| 1 | Welcome to StudentOS | The smartest way to study. Built by students, for students. | Large animated logo with floating sparkle particles |
| 2 | AI-Powered Learning | Smart notes, AI tutor, math solver -- AI that actually understands your homework | Animated brain icon with glowing neural connections |
| 3 | Never Forget Again | Spaced-repetition flashcards and quizzes that adapt to how you learn | Animated flashcard stack with flip effect |
| 4 | Stay in the Zone | Pomodoro timer, lofi radio, and app blocking to keep distractions away | Animated clock with sound wave rings |
| 5 | Track Your Growth | Streaks, XP, levels, and achievements -- watch yourself level up every day | Animated trophy with rising XP counter |
| 6 | Study Together | Join study groups, challenge friends, and climb the global leaderboard | Animated user group with connection lines |
| 7 | Ready to Begin? | Join thousands of students already crushing their goals with StudentOS | Large animated "Get Started" with confetti-ready CTA |

### Visual Enhancements
- Each slide has a unique gradient background (not just icon gradients)
- Floating animated particles/dots on every slide using framer-motion
- Icons are larger (40x40) inside bigger containers (32x32rem) with glow effects
- Smooth page transitions with spring physics
- Progress bar at top (thin line) in addition to dot indicators
- "Get Started" button on final slide pulses with a glow animation
- StudentOS logo/icon appears on first slide using `/studentos-icon.png`

### File
- **Rewritten**: `src/pages/Onboarding.tsx`

---

## Summary

| Change | Files |
|---|---|
| Fix radio streams | Modified: `src/components/planning/LofiRadio.tsx` |
| Daily quiz challenge | New: `src/components/gamification/DailyQuizChallenge.tsx`, Modified: `src/pages/Dashboard.tsx`, `src/components/gamification/DailyChallenges.tsx` |
| Redesigned onboarding | Rewritten: `src/pages/Onboarding.tsx` |

No database changes required -- quiz results use the existing `quiz_attempts` table, streak uses existing `profiles` columns, and XP uses existing `weekly_xp` table.

