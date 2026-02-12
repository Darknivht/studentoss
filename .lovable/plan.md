

# Issues Found and Enhancements Needed

## Bugs to Fix

### 1. Daily Quiz: Stale `score` in `finishQuiz`
In `DailyQuizChallenge.tsx`, the `finishQuiz` function uses `score` directly, but it's called from `nextQuestion` right after `setScore` -- meaning `score` may still hold the old value (React state updates are batched). The last correct answer might not be counted for XP.

**Fix**: Track the final score using a ref or pass it explicitly. Use `scoreRef.current` inside `finishQuiz` instead of the state variable.

**File**: `src/components/gamification/DailyQuizChallenge.tsx`

### 2. Radio Streams: Mismatched Station Names
Several stations have misleading names vs actual streams:
- "Rain & Thunder" plays `deepspaceone` (electronic music, not rain)
- "Piano Chill" plays `seventies` (70s rock hits, not piano)
- "Nature Sounds" plays `illstreet` (lounge music, not nature)
- "Cafe Vibes" plays `bootliquor` (Americana/country, not cafe ambience)

**Fix**: Remap streams to better matches from SomaFM:
- Rain & Thunder -> Use a rain/ambient stream or rename to match content
- Piano Chill -> SomaFM `thistle` (classical/piano) or rename
- Nature Sounds -> SomaFM `dronezone` is more nature-like; swap with Sleep
- Cafe Vibes -> SomaFM `lush` or `groovesalad` fits cafe better

**File**: `src/components/planning/LofiRadio.tsx`

### 3. Resume Template Gating: Wrong FeatureGateDialog Props
The `FeatureGateDialog` receives `currentUsage={templateLimit}` and `limit={templateLimit}` -- both are the same value, which is the user's limit, not their current usage. This means the dialog shows misleading information.

**Fix**: Change `currentUsage` to be the index of the clicked template (or a count of available templates), and set `limit` properly.

**File**: `src/components/career/ResumeBuilder.tsx`

---

## Enhancements

### 4. Streak Count Not Visible on Dashboard
The `StreakCard` shows streak info, but the daily quiz doesn't visually show how completing it affects the streak in real-time. After completing the quiz, the dashboard streak doesn't update without a refresh.

**Fix**: After quiz completion, trigger a re-fetch of the profile data or use a callback to update the parent `Dashboard` component's streak state.

**File**: `src/components/gamification/DailyQuizChallenge.tsx`, `src/pages/Dashboard.tsx` -- Add an `onComplete` callback prop to `DailyQuizChallenge` that triggers `fetchData()` in Dashboard.

### 5. Onboarding: No Back Button
Users can only go forward or skip. There's no way to go back to a previous slide except by swiping.

**Fix**: Add a "Back" button (or left arrow) that appears on slides 2-7.

**File**: `src/pages/Onboarding.tsx`

---

## Summary of Changes

| Priority | Issue | File |
|---|---|---|
| Bug | Stale score in daily quiz finishQuiz | `DailyQuizChallenge.tsx` |
| Bug | Wrong radio streams for station names | `LofiRadio.tsx` |
| Bug | Wrong FeatureGateDialog props for resume templates | `ResumeBuilder.tsx` |
| Enhancement | Dashboard streak doesn't refresh after quiz | `DailyQuizChallenge.tsx` + `Dashboard.tsx` |
| Enhancement | Add back button to onboarding | `Onboarding.tsx` |

### Technical Details

**Stale score fix** -- Add a `scoreRef` using `useRef` that mirrors the score state. Update it alongside `setScore`. Use `scoreRef.current` in `finishQuiz` to calculate XP.

**Radio stream remapping**:
- Nature Sounds -> `somafm.com/dronezone` (deep ambient/nature feel)
- Sleep Sounds -> `somafm.com/darkzone` or `fluid` (sleep-like)
- Rain & Thunder -> Rename to "Deep Space" or find actual rain audio URL
- Piano Chill -> `somafm.com/thistle` (classical/chamber)
- Cafe Vibes -> `somafm.com/lush` (smooth vocals/cafe vibe)

**Resume gating fix** -- Track which template index was clicked when locked, pass the actual template index as `currentUsage` and `templateLimit` as `limit`.

**Dashboard refresh** -- Add `onComplete?: () => void` prop to `DailyQuizChallenge`, call it after `finishQuiz`, and wire it to `fetchData` in Dashboard.

**Onboarding back button** -- Show a left-arrow/back button on slides after the first one, calling `paginate(-1)`.

