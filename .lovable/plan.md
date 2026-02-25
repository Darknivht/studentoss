
# ExamCrusher Major Enhancement Plan

## Overview

This plan addresses multiple improvements: giving JAMB both per-subject AND multi-subject modes, adding year-based question filtering, stronger monetization (block free users from exam prep entirely), performance trend charts, back button on exam prep page, admin logo image upload for exam types, and study-material-based practice.

---

## Changes

### 1. JAMB Gets Both Modes (Per-Subject + Full CBT)

Currently, selecting JAMB immediately jumps to the MultiSubjectCBT component. Instead, when a user selects any exam (including JAMB), they should always go to the SubjectSelector first, which will show all practice modes (Quick Practice, Topic Practice, Mock, Performance, Weak Topics). For `multi_subject` exams, an additional "Full CBT" mode card will appear.

**Files changed:** `ExamPrep.tsx`, `SubjectSelector.tsx`

- Remove the automatic routing to `multi-cbt` on exam select -- always go to `subjects` view
- Add a "Full CBT" mode button in SubjectSelector when `exam_mode === 'multi_subject'`, which triggers navigation back up to the `multi-cbt` view
- Pass `exam_mode` to SubjectSelector so it can conditionally show the Full CBT option

### 2. Year-Based Question Filtering

Add a "Practice by Year" mode and a year filter to existing practice. The `exam_questions` table already has a `year` column.

**New View:** `year-select` in ExamPrep that shows available years for the selected subject, letting users pick a specific year or "All Years."

**Files changed:** `ExamPrep.tsx` (add `year-select` view and `year` state), `SubjectSelector.tsx` (add "Past Questions by Year" mode), create `src/components/exam-prep/YearSelector.tsx`, modify `PracticeSession.tsx` (accept optional `year` prop and filter questions by it)

### 3. Practice from Study Materials (PDF-based)

Add a "Study Material Practice" mode where users practice questions extracted from admin-uploaded PDFs for that subject. Uses the `exam_pdfs` table + questions with `source = 'pdf_extracted'`.

**Files changed:** `SubjectSelector.tsx` (add "Study Material" mode), `PracticeSession.tsx` (accept optional `source` filter prop)

### 4. Block Free Users from Exam Prep Entirely

Currently free users get 5 questions/day. Change: free users see a gate dialog immediately upon entering Exam Prep, requiring Plus or Pro.

**Files changed:** `ExamPrep.tsx` -- check subscription tier at mount. If `free`, show `FeatureGateDialog` blocking access. Update `useSubscription.ts` to set `examQuestionsLimit: 0` for free tier.

### 5. Back Button on Exam Prep Page

When the user is on the top-level exam list (`view === 'exams'`), add a back button that navigates to the previous page or dashboard.

**Files changed:** `ExamPrep.tsx` -- add back navigation using `navigate(-1)` or `navigate('/dashboard')` when on the exams view.

### 6. Admin Logo Image Upload for Exam Types

Allow admins to upload an image (logo) for each exam type, falling back to emoji if none provided. Store the image URL in a new `logo_url` column on `exam_types`.

**Database migration:** Add `logo_url text` column to `exam_types`.

**Files changed:** `AdminResources.tsx` (add image upload field in type form), `ExamSelector.tsx` (render `<img>` if `logo_url` exists, else show emoji icon), `supabase/functions/admin-resources/index.ts` (include `logo_url` in CRUD).

Storage: Use the existing `exam-pdfs` bucket or add a policy for storing logos in it.

### 7. Performance Trend Charts

Add Recharts line charts to `ExamPerformance.tsx` showing accuracy over time, with improving/stable/declining indicators per topic.

**Files changed:** `ExamPerformance.tsx` -- fetch attempts with timestamps, group by date/session, compute rolling accuracy, render `LineChart` from Recharts with topic-level breakdowns.

### 8. Exam Attempts Table Enhancement

The `exam_attempts` table already stores `created_at` and `session_id`, which is sufficient for time-series charts. No schema change needed for this.

---

## Technical Details

### Database Migration

```text
ALTER TABLE exam_types ADD COLUMN IF NOT EXISTS logo_url text;
```

### New Files

1. **`src/components/exam-prep/YearSelector.tsx`** -- Fetches distinct years from `exam_questions` for a given subject, displays them as selectable cards, plus an "All Years" option.

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/ExamPrep.tsx` | Add `year-select` view, `year` state, back button on exams view, free-user gate check, always route to `subjects` first, add "Full CBT" callback from SubjectSelector |
| `src/components/exam-prep/SubjectSelector.tsx` | Add modes: "Past Questions by Year", "Study Materials", "Full CBT" (for multi_subject exams). Accept `examMode` prop |
| `src/components/exam-prep/PracticeSession.tsx` | Accept optional `year` and `source` props, filter DB queries accordingly |
| `src/components/exam-prep/ExamSelector.tsx` | Render `logo_url` as `<img>` when available, fallback to emoji |
| `src/components/exam-prep/ExamPerformance.tsx` | Add Recharts LineChart for accuracy over time, group attempts by date, show per-topic trend lines with color coding |
| `src/pages/AdminResources.tsx` | Add logo image upload field to exam type form, store URL in `logo_url` |
| `src/hooks/useSubscription.ts` | Set `examQuestionsLimit: 0` for free tier |
| `supabase/functions/admin-resources/index.ts` | Include `logo_url` in exam type CRUD |

### Student Flow (Updated)

```text
ExamPrep (back button always visible)
  --> Free user? Show gate dialog, block access
  --> ExamSelector (shows logo images or emoji)
    --> Always go to SubjectSelector
      --> Modes shown:
          - Quick Practice
          - Topic Practice
          - Past Questions by Year (NEW)
          - Study Material Practice (NEW)
          - Mock Exam (Plus+)
          - Full CBT (only for multi_subject exams like JAMB) (Plus+)
          - My Performance (with trend charts)
          - Weak Topics
      --> Year mode: YearSelector --> PracticeSession (filtered by year)
      --> Study Material mode: PracticeSession (filtered by source='pdf_extracted')
      --> Full CBT: MultiSubjectCBT component
```

### Performance Chart Design

- X-axis: Date (grouped by session date from `created_at`)
- Y-axis: Accuracy percentage (0-100%)
- One line per topic, plus an "Overall" line
- Color-coded: green for improving trend, yellow for stable, red for declining
- Trend determined by comparing last 3 sessions vs previous 3 sessions

---

## Implementation Order

| Step | Task |
|------|------|
| 1 | Database migration: add `logo_url` to `exam_types` |
| 2 | Update `useSubscription.ts`: free tier `examQuestionsLimit: 0` |
| 3 | Update `ExamPrep.tsx`: back button, free-user gate, always route to subjects, year-select view |
| 4 | Update `SubjectSelector.tsx`: add new modes, accept `examMode` prop |
| 5 | Create `YearSelector.tsx` |
| 6 | Update `PracticeSession.tsx`: accept `year` and `source` filter props |
| 7 | Update `ExamPerformance.tsx`: add Recharts trend charts |
| 8 | Update `ExamSelector.tsx`: render logo images |
| 9 | Update `AdminResources.tsx`: add logo upload field |
| 10 | Update `admin-resources` edge function: include `logo_url` |
| 11 | Deploy and test end-to-end |
