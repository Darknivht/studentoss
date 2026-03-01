

# Admin Student Analytics, Payment Duration, Forgot Password, Enhanced Analytics, and CBT Navigation

## Overview

Five changes: (1) per-student activity/analytics view in admin, (2) payment resolution with monthly/yearly duration choice, (3) forgot password flow, (4) richer analytics dashboard with charts, (5) CBT "Next Subject" button so users don't prematurely submit.

---

## 1. Per-Student Analytics in Admin (Users Tab)

**Current state:** The Users tab shows a flat table with name, username, tier, XP, streak, grade. No way to drill into a student's activity.

**Plan:**
- Add a "View" button on each user row in UsersTab
- When clicked, show an expandable detail panel (or modal) for that student with:
  - **Profile summary**: tier, XP, streak, join date, subscription expiry
  - **Exam activity**: fetch from `exam_attempts` -- total attempts, average score, recent sessions
  - **Study sessions**: fetch from `study_sessions` -- total minutes studied, sessions count
  - **Quiz history**: fetch from `quiz_attempts` -- total quizzes, average score
  - **AI usage**: show `ai_calls_today` from their profile
  - **Notes/flashcards count**: count from `notes` and `flashcards` tables
- Add a "Block/Unblock" toggle that sets a new `is_blocked` boolean column on profiles (requires a small migration)
- When `is_blocked = true`, the auth hook will sign the user out and prevent login

**Files:**
- `src/pages/AdminResources.tsx` -- extend UsersTab with detail view
- Database migration: add `is_blocked` column to `profiles` (default false)
- `src/hooks/useAuth.tsx` -- check `is_blocked` on auth state change
- `supabase/functions/admin-resources/index.ts` -- add `user-detail` action that queries multiple tables for a specific user_id

---

## 2. Payment Resolution with Duration Choice

**Current state:** The PaymentsTab `updateSub` function hardcodes 30 days for all tiers. No option for yearly.

**Plan:**
- Add a duration selector (Monthly / Yearly / Custom) next to each tier button
- Monthly = 30 days, Yearly = 365 days, Free = null expiry
- Update the `updateSub` function to accept the selected duration and calculate `subscription_expires_at` accordingly

**File:** `src/pages/AdminResources.tsx` -- PaymentsTab component only

---

## 3. Forgot Password Flow

**Current state:** Auth page has login/signup but no forgot password link or reset page.

**Plan:**
- Add "Forgot password?" link on the Auth page login form
- When clicked, show an email input that calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`
- Create a new `/reset-password` page that:
  - Detects `type=recovery` in the URL hash
  - Shows a "Set new password" form
  - Calls `supabase.auth.updateUser({ password })` on submit
  - Redirects to `/` on success

**Files:**
- `src/pages/Auth.tsx` -- add forgot password UI state and handler
- New file: `src/pages/ResetPassword.tsx`
- `src/App.tsx` -- add `/reset-password` route

---

## 4. Enhanced Analytics Dashboard

**Current state:** Analytics tab shows 6 stat cards (total users, active today, resources, quizzes, plus/pro subscribers) with no graphs.

**Plan:**
- Add time-series charts using Recharts (already installed):
  - **Daily signups** (last 30 days) -- line chart
  - **Daily active users** trend -- area chart
  - **Revenue breakdown** -- bar chart showing Plus vs Pro subscribers over time
  - **Feature usage** -- bar chart (AI calls, quizzes, flashcards, exam attempts per day)
- Add summary cards for:
  - Total study hours (sum of study_sessions.total_minutes)
  - Total exam attempts
  - Average streak
  - Notes created
- Backend: extend `admin-resources` edge function `analytics` action to return time-series data by querying `profiles.created_at`, `study_sessions`, `exam_attempts`, `quiz_attempts` grouped by date

**Files:**
- `supabase/functions/admin-resources/index.ts` -- extend analytics action
- `src/pages/AdminResources.tsx` -- AnalyticsTab with Recharts charts

---

## 5. CBT "Next Subject" Navigation Button

**Current state:** When a user finishes the last question of a subject, only "Submit Exam" appears. Users may accidentally submit before completing other subjects.

**Plan:**
- At line 561-565 in `MultiSubjectCBT.tsx`, when the user is on the last question of the current subject:
  - Check if there are other subjects with unanswered questions
  - If yes, show THREE buttons: "Previous", "Next Subject" (navigates to the first unanswered question of the next incomplete subject), and "Submit Exam"
  - If all subjects are complete, show "Previous" and "Submit Exam"
- The "Next Subject" button will:
  - Find the next subject in the list that has unanswered questions
  - Switch `activeSubject` to that subject
  - Set the index to the first unanswered question in that subject

**File:** `src/components/exam-prep/MultiSubjectCBT.tsx` -- bottom navigation buttons section

---

## Technical Summary

| Change | Files | Complexity |
|--------|-------|------------|
| Per-student analytics | 4 files + 1 migration | Medium |
| Payment duration choice | 1 file | Low |
| Forgot password | 3 files (1 new) | Low |
| Enhanced analytics | 2 files | Medium |
| CBT next subject button | 1 file | Low |

## Sequencing

1. Database migration (add `is_blocked` to profiles)
2. CBT navigation fix (quick UX win)
3. Forgot password flow (standalone)
4. Payment duration selector (standalone)
5. Admin analytics + per-student view (largest change, edge function + frontend)

