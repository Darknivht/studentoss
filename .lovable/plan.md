
# Comprehensive Launch Preparation Plan

This is a large plan covering monetization, file uploads, daily quiz improvements, feature gating for unfinished features, math rendering, sleep calculator, and education-level impact. I've broken it into clear phases.

---

## Phase 1: Monetization Setup with Paystack

The current Upgrade page has a placeholder Paystack key (`pk_test_xxx...`). We need to wire up real payment verification.

### Changes

**`src/pages/Upgrade.tsx`** -- Replace the placeholder Paystack key with a dynamic approach:
- Load the Paystack inline script via a `<script>` tag in `index.html`
- Use the existing `PAYSTACK_SECRET_KEY` secret for backend verification
- After successful payment callback, call a new edge function `verify-payment` to verify the transaction and update the user's `subscription_tier` and `subscription_expires_at` in the `profiles` table
- Add monthly/yearly toggle with a discount for yearly plans (e.g., yearly = 10 months' price)
- Add a "Restore Purchase" button that re-checks the profile tier

**`supabase/functions/verify-payment/index.ts`** (already exists -- update):
- Verify the Paystack transaction reference via Paystack's `/transaction/verify/:reference` API
- On success, update `profiles.subscription_tier` and set `subscription_expires_at` to 30 days from now
- Return the updated tier to the frontend

**`index.html`** -- Add Paystack inline script tag:
```html
<script src="https://js.paystack.co/v2/inline.js"></script>
```

**New `src/lib/paystackConfig.ts`**:
- Export the Paystack public key (fetched from env or hardcoded test key)
- Export plan-to-amount mapping

---

## Phase 2: File Upload Compatibility (PPTX and more)

Currently `FileUpload.tsx` only accepts PDF, TXT, DOCX, and DOC files.

### Changes

**`src/components/notes/FileUpload.tsx`**:
- Add PPTX support (`application/vnd.openxmlformats-officedocument.presentationml.presentation`)
- Add XLSX support (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
- Add RTF support (`application/rtf`)
- Add Markdown support (`.md` files as `text/markdown` or `text/plain`)
- Update the file input `accept` attribute to include `.pptx,.xlsx,.rtf,.md`
- Update the upload label text to reflect the new types
- Add `extractPptxText()` function using JSZip (already installed) to parse `ppt/slides/slide*.xml` and extract text nodes
- Add `extractXlsxText()` function using JSZip to parse `xl/sharedStrings.xml` for cell content
- RTF: basic regex extraction stripping RTF control words
- Markdown: read as plain text (same as TXT)

---

## Phase 3: Daily Brain Boost Based on User Notes

Currently the quiz uses a hardcoded question pool of general knowledge. The plan is to make it note-based when the user has notes.

### Changes

**`src/components/gamification/DailyQuizChallenge.tsx`**:
- On `startQuiz`, check if the user has any notes in the database
- If they have notes, pick 1-3 random notes, extract their content, and send to the AI edge function (`ai-study`) with a prompt like: "Generate exactly 5 multiple-choice quiz questions (4 options each) based on this content. Return as JSON."
- Parse the AI response into the `Question[]` format
- Fall back to the hardcoded pool if: no notes exist, AI call fails, or the user is offline
- Add a small label indicating "Based on your notes" or "General knowledge" depending on the source
- Show a loading spinner while AI generates questions
- Gate the AI-based quiz behind subscription (free users get general knowledge, Plus/Pro get note-based)

---

## Phase 4: Feature Gating for Incomplete Features

Mark features that aren't fully production-ready (App Blocker and Offline AI) with clear "Beta" or "Coming Soon" indicators.

### Changes

**`src/components/settings/AppBlockerSettings.tsx`**:
- Add a prominent banner at the top: "Beta Feature -- App blocking requires the native Android app. Web users can use the Focus Timer instead."
- When running on web (not Capacitor native), show a simplified view with just the study goal tracker and a link to Focus Timer, hiding the app blocking controls
- Add a `Badge` component showing "BETA" next to the title

**`src/context/OfflineAIContext.tsx`** (and wherever Offline AI is surfaced):
- Add a "Beta" badge in the Offline AI section of the Safety page
- Add a disclaimer: "Offline AI requires downloading large models (350MB-2GB). Performance varies by device. This feature is experimental."

**`src/pages/Focus.tsx`**:
- On the App Blocker tool card, add a small "BETA" badge
- When user taps it on web, show an info toast explaining it works best on the native Android app

---

## Phase 5: Math Symbol Rendering Improvements

The `MarkdownRenderer` component currently renders LaTeX as monospace text rather than actual rendered math. The app already has `katex`, `remark-math`, and `rehype-katex` installed.

### Changes

**`src/components/ui/markdown-renderer.tsx`**:
- Replace the custom markdown parser with `ReactMarkdown` from `react-markdown` (already installed)
- Use `remarkMath` and `rehypeKatex` plugins for proper math rendering
- Import KaTeX CSS at the top: `import 'katex/dist/katex.min.css'`
- This ensures `$...$` and `$$...$$` render as proper math symbols everywhere in the app
- Keep the existing className props for compatibility

**`src/index.css`**:
- Add a global KaTeX CSS import if not already present: `@import 'katex/dist/katex.min.css';`
- Add overflow handling for KaTeX display math: `.katex-display { overflow-x: auto; }`

This single change fixes math rendering everywhere because all AI tools use either `MarkdownRenderer` or `ReactMarkdown` directly.

---

## Phase 6: Improve Sleep Calculator

The current calculator is basic -- only shows 3 bedtimes based on 90-minute cycles.

### Changes

**`src/components/planning/SleepCalculator.tsx`**:
- Add "Sleep Now" mode: calculate optimal wake-up times if going to bed right now
- Show 6 cycle options (3, 4, 5, 6, 7, 8 cycles) instead of just 3
- Add age-based sleep recommendations (using the user's `grade_level` from profile):
  - Middle school (grades 6-8): 9-11 hours recommended
  - High school (grades 9-12): 8-10 hours recommended  
  - College: 7-9 hours recommended
- Add a "sleep quality tips" section with quick tips
- Add AM/PM toggle instead of assuming AM for wake-up time (currently hardcodes "AM")
- Show a visual representation of sleep cycles using colored blocks
- Add nap calculator: quick 20-min power nap, 90-min full cycle nap times

---

## Phase 7: Education Level Impact

The `grade_level` field exists in profiles but doesn't affect anything in the app.

### Changes

**`src/lib/educationConfig.ts`** (new file):
- Export education level definitions: `middle_school`, `high_school`, `college`, `graduate`
- Export AI prompt modifiers per level (e.g., simpler language for middle school, more academic for graduate)
- Export recommended daily study times per level
- Export difficulty scaling for quiz generation

**`src/lib/ai.ts`** (modify):
- When building AI prompts, include the user's education level context
- Add a helper `getEducationContext(gradeLevel: string)` that returns appropriate instruction text like: "The student is in [grade]. Adjust complexity, vocabulary, and examples accordingly."

**`src/components/gamification/DailyQuizChallenge.tsx`**:
- When generating AI-based questions, include the education level in the prompt so questions match the student's level

**`src/pages/Profile.tsx`**:
- Expand the grade level selector to include more specific options: "6th Grade" through "Graduate School"
- Show a brief description of how the level affects AI responses

---

## Phase 8: Feature Gate Refinement

Currently gating is on notes, quizzes, flashcards, AI calls, and job searches. The plan should focus gating on AI-based features primarily, with lighter limits on non-AI features.

### Changes

**`src/hooks/useSubscription.ts`**:
- Restructure limits so non-AI features (notes upload without AI summary, manual flashcards) have higher free limits
- AI-powered features (AI Tutor, Math Solver, Quiz Generation, Flashcard Generation, Essay Grader, etc.) share a single `ai_calls_today` counter
- Free: 5 AI calls/day (covers all AI features combined)
- Plus: 30 AI calls/day
- Pro: Unlimited
- Non-AI features: Free users get 5 notes/day, 5 manual flashcards/day (generous enough to not frustrate)
- Keep resume template gating as-is (3/7/10)
- Keep job search monthly limits as-is

**`src/components/subscription/FeatureGateDialog.tsx`**:
- No structural changes needed, already works well

---

## Phase 9: Console Errors Fix

The console shows `forwardRef` warnings for `ChallengeAFriend` and `Leaderboard`.

### Changes

**`src/components/social/ChallengeAFriend.tsx`**:
- Find the `Select` component that's receiving a ref and wrap the inner component with `React.forwardRef` or remove the ref passing

**`src/components/social/Leaderboard.tsx`**:
- Same fix -- find the component (`LeaderboardList`) receiving a ref incorrectly and fix the ref forwarding

---

## Summary of All Files

| Phase | Change | Files |
|---|---|---|
| 1. Monetization | Wire Paystack payments | `Upgrade.tsx`, `verify-payment/index.ts`, `index.html`, new `paystackConfig.ts` |
| 2. File Uploads | Add PPTX/XLSX/RTF/MD support | `FileUpload.tsx` |
| 3. Note-Based Quiz | AI quiz from user notes | `DailyQuizChallenge.tsx` |
| 4. Beta Labels | Mark incomplete features | `AppBlockerSettings.tsx`, `Focus.tsx`, Safety page |
| 5. Math Rendering | Use ReactMarkdown + KaTeX plugins | `markdown-renderer.tsx`, `index.css` |
| 6. Sleep Calculator | Add modes, age-based recs, naps | `SleepCalculator.tsx` |
| 7. Education Level | AI adapts to grade level | New `educationConfig.ts`, `ai.ts`, `DailyQuizChallenge.tsx`, `Profile.tsx` |
| 8. Gating Refinement | Focus gating on AI features | `useSubscription.ts` |
| 9. Console Fixes | Fix forwardRef warnings | `ChallengeAFriend.tsx`, `Leaderboard.tsx` |

### Database Changes
- None required -- all existing tables and columns support these features

### New Secrets Needed
- A Paystack **public** key needs to be configured in the frontend (not a secret, just a config value). The `PAYSTACK_SECRET_KEY` already exists for backend verification.

