

# Enhanced Admin Analytics, JAMB 5 Options, and Richer User Details

## 1. JAMB Questions: 5 Options (A-E)

The AI prompt in `supabase/functions/exam-practice/index.ts` currently says "exactly 4 strings" and "correct_index: integer 0-3". The frontend already renders options dynamically using `String.fromCharCode(65 + i)`, so it handles 5 options automatically.

**Changes:**
- `supabase/functions/exam-practice/index.ts` lines 211-212: Change "exactly 4 strings" to "exactly 5 strings" and "correct_index: integer 0-3" to "0-4"
- Same change in the `extractPdfQuestions` prompt (lines 512-513)
- Also update the `guidedLearning` prompt (search for similar "4" references)

Existing database questions with 4 options will still work fine -- the UI handles any number of options.

---

## 2. Enhanced Admin Analytics Dashboard

Current analytics has 10 summary cards and 3 charts (DAU, Signups, Feature Usage). Will add:

**New charts/sections in AnalyticsTab (frontend):**
- **Subscription Revenue Pie Chart** -- breakdown of Free vs Plus vs Pro users (PieChart from recharts)
- **Study Time Trend** -- daily total study minutes over 30 days (AreaChart)
- **Retention Rate** -- users who studied this week vs last week
- **Top Active Students** -- leaderboard of top 10 users by XP this week
- **AI Usage Trend** -- daily AI calls aggregated

**Backend (`admin-resources/index.ts` analytics action):**
- Add queries for: daily study minutes, top users by XP, weekly retention (users active both weeks), tier distribution breakdown
- Add focus sessions and pomodoro data to feature usage

---

## 3. Richer Per-Student Detail View

Current user detail shows: tier, XP, streak, join date, AI calls, subscription expiry, exam attempts (count + accuracy), quizzes (count + avg score), study time, notes count, flashcards count.

**Add to the detail dialog:**
- **Recent Activity Timeline** -- last 10 actions (study sessions, quiz attempts, exam attempts) with dates
- **Subject Performance Breakdown** -- for exam attempts, group by subject and show per-subject accuracy
- **Weekly Study Trend** -- small sparkline/bar chart of daily study minutes for the last 7 days
- **Course Progress** -- list courses with progress %
- **Achievement Count** -- unlocked achievements
- **Focus Sessions** -- total focus time from `focus_sessions` and `pomodoro_sessions`

**Backend (`admin-resources/index.ts` user-detail action):**
- Add queries for: courses, achievements, focus_sessions, pomodoro_sessions, exam subjects breakdown
- Return structured data for the timeline and subject breakdown

---

## Technical Summary

| Change | Files | Impact |
|--------|-------|--------|
| 5 options for JAMB | `exam-practice/index.ts` | AI generates A-E options |
| Enhanced analytics dashboard | `AdminResources.tsx`, `admin-resources/index.ts` | More charts + data |
| Richer user detail view | `AdminResources.tsx`, `admin-resources/index.ts` | Deeper student insights |

## Sequencing
1. Fix JAMB 5 options in edge function
2. Extend `admin-resources` edge function with new analytics + user-detail data
3. Update `AdminResources.tsx` with new charts and enriched user detail panel

