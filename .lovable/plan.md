

# ExamCrusher Launch Readiness Plan

## What's Already Done
- Database schema (6 tables with RLS)
- Admin panel for managing exams, subjects, topics, questions
- Student-facing Exam Prep page with 5 practice modes
- AI question generation + caching via `exam-practice` edge function
- Subscription gating (Free: 5/day, Plus: 30/day, Pro: unlimited)
- Dashboard and Study page integration
- Paystack payment flow

## What's Missing for Launch (Prioritized)

---

### 1. Seed the Question Bank (Critical -- No Questions = No Product)

Right now the question bank is empty. AI generation works, but having pre-loaded verified questions is essential for speed and accuracy.

**Action:**
- Create a database seed migration with 100+ verified JAMB questions across 5 core subjects (Mathematics, English, Physics, Chemistry, Biology)
- Pre-populate `exam_types` with JAMB UTME, WAEC SSCE, NECO
- Pre-populate `exam_subjects` for each exam type with proper icons
- Pre-populate `exam_topics` with official syllabus topics per subject
- Add 20+ seed questions per subject with past-question source tags

**Files:** New SQL migration

---

### 2. Difficulty Adaptation (PRD P0)

The PRD requires questions that get harder as students improve and easier when they struggle. Currently questions are randomly selected.

**Action:**
- Update `exam-practice` edge function's `generateQuestions` to analyze the user's recent accuracy for the subject
- If accuracy > 75%, bias toward "hard" questions; if < 40%, bias toward "easy"
- Pass difficulty preference to AI prompt when generating new questions

**Files:** `supabase/functions/exam-practice/index.ts`

---

### 3. Realistic JAMB CBT Simulation (PRD P0)

The PRD specifies JAMB-standard mock exams: 180 questions across 4 subjects, 120 minutes. Currently MockExamMode only supports single-subject sessions.

**Action:**
- Add a "Full JAMB CBT" option in SubjectSelector or as a separate entry from ExamSelector
- Multi-subject mock: user picks 4 subjects, system generates 45 questions each (180 total)
- 120-minute countdown timer with auto-submit
- Results broken down by subject with per-topic analysis

**Files:** `src/components/exam-prep/MockExamMode.tsx`, `src/pages/ExamPrep.tsx`

---

### 4. Hide Explanations for Free Tier (PRD Spec)

The PRD states Free tier gets "no explanations." Currently all users see explanations.

**Action:**
- In `PracticeSession.tsx`, check subscription tier before showing the explanation section
- Free users see "Upgrade to see detailed explanations" with an upgrade prompt
- Plus and Pro users see full explanations

**Files:** `src/components/exam-prep/PracticeSession.tsx`

---

### 5. Wrong Answer Review Mode (PRD P0)

After completing a mock exam, students should be able to review only the questions they got wrong with full explanations.

**Action:**
- Add a "Review Wrong Answers" button on the MockExamMode results screen
- Filter and display only incorrectly answered questions with the correct answer highlighted and explanation shown

**Files:** `src/components/exam-prep/MockExamMode.tsx`

---

### 6. Performance Trend Tracking (PRD P1)

Currently ExamPerformance shows a static snapshot. The PRD wants improvement trends over time.

**Action:**
- Query `exam_attempts` grouped by week/date to calculate accuracy over time
- Add a simple line chart (using existing Recharts dependency) showing accuracy trend per subject
- Show "improving", "stable", or "declining" indicators per topic

**Files:** `src/components/exam-prep/ExamPerformance.tsx`

---

### 7. Referral System (PRD Feature)

The PRD includes a referral program: "Refer 3 paying friends, get 1 month free."

**Action:**
- Add `referral_code` column to profiles (or use existing `invitation_code` from study groups pattern)
- Create `referrals` table tracking who referred whom
- Add referral code display on Profile page with share button
- Apply referral logic in `verify-payment` edge function

**Files:** New migration, `src/pages/Profile.tsx`, `supabase/functions/verify-payment/index.ts`

---

### 8. Daily Question Push Notification (PRD P1)

Morning question to maintain engagement.

**Action:**
- Use existing `useNotifications` hook and Capacitor Local Notifications
- Schedule a daily notification at 7 AM with a teaser question
- Tapping the notification opens `/exams` directly

**Files:** `src/hooks/useNotifications.ts`, notification scheduling logic

---

## Technical Details

### Migration SQL (Seed Data)
```text
INSERT INTO exam_types (name, slug, description, icon, country)
VALUES
  ('JAMB UTME', 'jamb-utme', 'Joint Admissions and Matriculation Board', '🎓', 'Nigeria'),
  ('WAEC SSCE', 'waec-ssce', 'West African Examinations Council', '📝', 'Nigeria'),
  ('NECO', 'neco', 'National Examinations Council', '📋', 'Nigeria');

-- Then subjects per exam type, topics per subject, and seed questions
```

### Difficulty Adaptation Logic
```text
1. Query last 20 attempts for user + subject
2. Calculate accuracy %
3. Map to difficulty bias:
   - accuracy > 75% -> prefer "hard"
   - accuracy 40-75% -> prefer "medium"  
   - accuracy < 40% -> prefer "easy"
4. Filter exam_questions by difficulty, or pass to AI prompt
```

### Full JAMB CBT Flow
```text
ExamSelector -> "Start Full JAMB CBT" button
  -> Pick 4 subjects from available list
  -> Generate 45 questions per subject (180 total)
  -> 120-minute timer, navigate between subjects via tabs
  -> Auto-submit on timeout
  -> Results: overall score + per-subject breakdown
```

## Recommended Implementation Order

| Priority | Task | Impact |
|----------|------|--------|
| 1 | Seed question bank | Without data, nothing works |
| 2 | Difficulty adaptation | Core PRD requirement |
| 3 | Hide explanations for free tier | Monetization driver |
| 4 | Wrong answer review | Key learning feature |
| 5 | Full JAMB CBT simulation | Major differentiator |
| 6 | Performance trends chart | User retention |
| 7 | Referral system | Growth engine |
| 8 | Daily push notifications | Engagement driver |

