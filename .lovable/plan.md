
# Massive Subscription Gating Overhaul, YouTube Summarizer Fix, Offline AI Improvement, More Achievements, and Safety Section Upgrade

This plan covers 5 major areas: tighter subscription enforcement, fixing the YouTube Summarizer, improving the offline AI system, adding more achievements, and making the Safety section functional.

---

## 1. Tighter Subscription Gating (Popup-on-Click + Lifetime Limits)

### Current Problem
Gating only checks when a user "enters" a page. Users can still click buttons and attempt actions. Limits are daily-only, so free users can accumulate unlimited total usage over time.

### Solution

**A. Add lifetime (total) limits alongside daily limits:**

```text
+-------------------------+----------+-----------+-----------+
| Lifetime Limits         | Free     | Plus      | Pro       |
+-------------------------+----------+-----------+-----------+
| Total notes             | 15       | 100       | Unlimited |
| Total flashcard sets    | 10       | 50        | Unlimited |
| Total quizzes           | 20       | 100       | Unlimited |
| Total AI tool uses      | 30       | 200       | Unlimited |
+-------------------------+----------+-----------+-----------+
```

**B. Block at the action button, not at page entry:**
- Remove page-level gates (the UpgradePrompt shown on page load)
- Instead, wrap every action button (Generate Quiz, Save Note, Create Flashcard, Use AI Tool, etc.) with a pre-check
- When a free/plus user clicks a gated button, show a modal/dialog popup immediately explaining the limit and prompting upgrade
- The popup should show: feature name, current usage vs limit, and an "Upgrade" button

**C. Create a reusable `FeatureGateDialog` component:**
- New file: `src/components/subscription/FeatureGateDialog.tsx`
- A modal dialog that shows when a gated action is attempted
- Props: `feature`, `currentUsage`, `limit`, `isLifetime`, `requiredTier`
- Shows a lock icon, usage bar, and upgrade CTA

**D. Update `useSubscription.ts`:**
- Add lifetime counters: `totalNotes`, `totalQuizzes`, `totalFlashcardSets`, `totalAIUses`
- Add lifetime limit checks: `canCreateNoteLifetime`, `canCreateQuizLifetime`, etc.
- Combined check function: `gateFeature(type)` returns `{ allowed: boolean, reason: 'daily' | 'lifetime' | null, remaining: number, limit: number }`
- Fetch actual total counts from database (notes count, quiz_attempts count, etc.)

**E. Files modified:**
- `src/hooks/useSubscription.ts` -- Add lifetime limits and `gateFeature()` method
- `src/components/subscription/FeatureGateDialog.tsx` -- New reusable popup component
- `src/components/subscription/UpgradePrompt.tsx` -- Keep for inline warnings but add popup variant
- `src/pages/AITutor.tsx` -- Gate the "Start Session" button, not the page
- `src/pages/Quizzes.tsx` -- Gate "Generate Quiz" button
- `src/pages/SmartNotes.tsx` -- Gate "Save Note" / "Add Note" button
- `src/pages/Flashcards.tsx` -- Gate "Generate" button
- `src/pages/Chat.tsx` -- Keep as-is (DMs allowed for all)
- `src/pages/GroupChat.tsx` -- Keep popup gate (already works well)
- All AI tools components (`MathSolver`, `CodeDebugger`, `OCRToLatex`, `DiagramInterpreter`, `BookScanner`, `LanguageTranslator`, `YouTubeSummarizer`) -- Gate the action button
- `src/components/career/JobSearch.tsx` -- Gate search button
- `src/components/career/ResumeBuilder.tsx` -- Gate template selection beyond limit

---

## 2. Fix YouTube Summarizer

### Current Problem
When a URL is provided (no transcript), the AI gets `Please summarize the key points from this YouTube video: [URL]`. The AI cannot access URLs, so it hallucinates random content.

### Solution
- Update the YouTube Summarizer to **strongly emphasize** that transcript is required for accurate results
- When only a URL is provided, make the UI clearly state: "For accurate summaries, please paste the transcript"
- Update the backend prompt (`youtube_summary` mode in `ai-study/index.ts`) to:
  - If transcript is provided: summarize it thoroughly
  - If only URL is provided: extract the video ID, attempt to infer the topic from URL keywords, and explicitly state it's an inference-based summary
- Add a helper section in the UI explaining step-by-step how to get a YouTube transcript
- Change the default behavior: make transcript the primary input, URL secondary

**Files modified:**
- `src/components/ai-tools/YouTubeSummarizer.tsx` -- Redesign UI to prioritize transcript input, add clear instructions
- `supabase/functions/ai-study/index.ts` -- Update `youtube_summary` system prompt to be more honest about URL-only limitations

---

## 3. Improve Offline AI System

### Current Problem
The existing system uses `@huggingface/transformers` with WebLLM, which has WebGPU compatibility issues on mobile WebViews (Capacitor). The user wants a native-capable approach.

### Solution
Since this is a Capacitor app, we should keep the current web-based approach (which works on desktop/browser) but improve it significantly:

**A. Improve the existing OfflineAI system:**
- Fix model loading reliability by adding better error recovery
- Add explicit WebGPU/WASM detection and auto-fallback to cloud
- Improve the progress tracking during downloads
- Add a "Reset All" button that clears IndexedDB, Cache API, and localStorage model data to fix stuck states

**B. Add native model support preparation:**
- Create `src/services/NativeAIService.ts` -- A singleton service that detects if running in Capacitor and uses the appropriate inference path
- On native (Capacitor): use `@capacitor/filesystem` for persistent model storage instead of browser cache
- Add `android:largeHeap="true"` to AndroidManifest.xml

**C. Improve model selection and UX:**
- Auto-detect device capabilities more accurately
- Show clear warnings for unsupported devices
- Add model size verification after download
- Better error messages when model loading fails

**Files modified:**
- `src/context/OfflineAIContext.tsx` -- Better error recovery, cache verification, reset functionality
- `src/hooks/useOfflineAI.ts` -- Improved fallback logic
- `src/components/safety/OfflineMode.tsx` -- Better UX, reset button, clearer status
- `android/app/src/main/AndroidManifest.xml` -- Add `android:largeHeap="true"`
- `src/services/NativeAIService.ts` -- New file for native AI path detection

---

## 4. More Achievements

### Current Achievements (13 total)
The existing set covers: notes, quizzes, flashcards, streaks, focus sessions, and XP.

### New Achievements to Add (12 more, total 25)

```text
+------------------------+-------------------+-------+------+
| Name                   | Requirement       | Value | XP   |
+------------------------+-------------------+-------+------+
| Social Butterfly       | groups_joined      | 1     | 50   |
| Study Buddy            | groups_joined      | 3     | 150  |
| Speed Reader           | notes_count        | 25    | 300  |
| Library Builder         | notes_count        | 50    | 500  |
| Quiz Champion          | quizzes_count      | 25    | 400  |
| Flashcard Guru         | flashcards_reviewed| 500   | 500  |
| Marathon Studier       | focus_sessions     | 50    | 750  |
| Century Focus          | focus_sessions     | 100   | 1000 |
| XP Legend              | total_xp           | 5000  | 750  |
| Streak Legend          | streak             | 60    | 1500 |
| Streak Immortal        | streak             | 100   | 2500 |
| Early Bird             | notes_count        | 5     | 100  |
+------------------------+-------------------+-------+------+
```

**Implementation:**
- Database migration to insert the new achievements into the `achievements` table
- Update `fetchUserStats` in `useAchievements.ts` to also count `groups_joined` (from study_groups membership)
- Add the `groups_joined` stat type

**Files modified:**
- Database migration (SQL) -- Insert 12 new achievements
- `src/hooks/useAchievements.ts` -- Add `groups_joined` to UserStats and fetch logic

---

## 5. Improve Safety Section

### Current Problems
- ParentDashboard uses **mock/random data** for weekly activity chart (lines 77-88 in ParentDashboard.tsx)
- Daily time limits are not enforced anywhere -- they're just UI settings that do nothing
- Content filters are just toggles with no backend enforcement
- No PIN protection for parental controls (anyone can toggle them off)

### Solution

**A. Replace mock data with real data in ParentDashboard:**
- Query `pomodoro_sessions` grouped by date for the last 7 days
- Query `notes` created per day
- Query `quiz_attempts` per day
- Show actual data instead of `Math.random()`

**B. Add PIN protection for parental controls:**
- Add a `parental_pin` field to the profiles table
- When parental controls are first enabled, prompt to set a 4-digit PIN
- Require PIN entry before any parental settings can be changed
- Store PIN as a hash (not plain text)

**C. Enforce daily time limits:**
- Track session time using `useStudyTimeTracker` hook
- When daily limit is reached, show a full-screen overlay blocking further use
- The overlay can only be dismissed with the parental PIN

**D. Make content filters functional:**
- Pass the `safeSearchEnabled` and `contentFilterEnabled` flags to AI calls
- In the edge function, prepend content safety instructions to the system prompt when filters are enabled

**Files modified:**
- `src/components/safety/ParentDashboard.tsx` -- Replace mock data with real queries
- `src/components/safety/ParentalControls.tsx` -- Add PIN setup/verification, persist daily limit and content filter settings
- `src/hooks/useStudyTimeTracker.ts` -- Add daily limit enforcement
- `supabase/functions/ai-study/index.ts` -- Add content safety prompt when filters are on
- Database migration -- Add `parental_pin`, `daily_time_limit`, `safe_search_enabled`, `content_filter_enabled` columns to profiles

---

## Summary of All Changes

### New Files (2)
- `src/components/subscription/FeatureGateDialog.tsx` -- Popup dialog for gated features
- `src/services/NativeAIService.ts` -- Native AI detection service

### Database Migrations (2)
- Insert 12 new achievements
- Add parental control columns to profiles (`parental_pin`, `daily_time_limit`, `safe_search_enabled`, `content_filter_enabled`)

### Modified Files (20+)
- `src/hooks/useSubscription.ts` -- Lifetime limits, `gateFeature()` method
- `src/components/subscription/UpgradePrompt.tsx` -- Minor updates
- `src/pages/AITutor.tsx`, `Quizzes.tsx`, `SmartNotes.tsx`, `Flashcards.tsx` -- Button-level gating with popup
- All AI tool components -- Button-level gating
- `src/components/career/JobSearch.tsx`, `ResumeBuilder.tsx` -- Button-level gating
- `src/components/ai-tools/YouTubeSummarizer.tsx` -- Redesigned UI
- `supabase/functions/ai-study/index.ts` -- Updated YouTube prompt + content safety
- `src/context/OfflineAIContext.tsx` -- Error recovery improvements
- `src/hooks/useOfflineAI.ts` -- Better fallback logic
- `src/components/safety/OfflineMode.tsx` -- Reset button, better UX
- `src/components/safety/ParentDashboard.tsx` -- Real data
- `src/components/safety/ParentalControls.tsx` -- PIN protection
- `src/hooks/useStudyTimeTracker.ts` -- Daily limit enforcement
- `src/hooks/useAchievements.ts` -- New stat types
- `android/app/src/main/AndroidManifest.xml` -- largeHeap
