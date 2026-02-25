

# ExamCrusher Major Upgrade: Bug Fixes, Admin Enhancements, and Student Features

## 1. Bug Fix: Questions Section Blank White Screen

**Root Cause**: When navigating to the "Questions" section in the admin Exams tab, `fetchQuestions()` is never called automatically. The `useEffect` hooks only trigger `fetchSubjects` and `fetchTopics` on cascading selection changes, but there is no corresponding effect to load questions when `section === 'questions'` and a subject is selected. The "Load" button must be clicked manually, and before that, the section appears completely blank (no loading spinner, no empty state -- just white).

**Fix**: Add a `useEffect` that calls `fetchQuestions()` when `section` changes to `'questions'` and `selectedSubject` is set. Also wrap all async calls in the ExamsTab with try/catch to prevent unhandled errors from causing white screens.

---

## 2. Admin Panel Enhancements

### 2a. Exam Analytics Dashboard (New)
Add an "Exam Analytics" sub-section to the Exams tab showing:
- Total questions per exam type and subject (question bank health)
- Total student attempts, average accuracy per exam type
- Most-answered and least-answered questions
- Questions with lowest accuracy (candidates for review/rewriting)
- PDF import stats (total PDFs, total questions generated)

### 2b. Question Bank Stats Header
At the top of the Questions section, show a stats bar:
- Total questions count for selected filters
- Breakdown by difficulty (easy/medium/hard)
- Breakdown by source (admin/past_question/AI/PDF)
- Questions without explanations (flagged for admin attention)

### 2c. Question Preview & Bulk Actions
- Add a preview mode for individual questions (how students will see it)
- Bulk activate/deactivate questions
- Bulk delete selected questions
- Duplicate question button
- Search/filter questions by text content

### 2d. Question Quality Indicators
- Flag questions missing explanations with a warning icon
- Show attempt count and accuracy per question (from exam_attempts)
- Sort questions by "needs attention" (low accuracy or missing explanation)

---

## 3. Student-Facing Exam Prep Enhancements

### 3a. Adaptive Difficulty
After each answer, adjust the next question's difficulty based on recent performance. If user gets 3 in a row correct, serve harder questions. If they miss 2+, serve easier ones. This uses the existing `difficulty` column on `exam_questions`.

### 3b. Bookmark/Save Questions
Let students bookmark questions they want to review later. New database table `exam_bookmarks` (user_id, question_id, created_at). Add a "Bookmarked Questions" practice mode in SubjectSelector.

### 3c. Detailed Post-Session Review
After completing a practice session, show a full review screen with:
- All questions listed with correct/incorrect indicators
- Expandable explanations for each question
- "Practice Similar" button to retry questions on the same topic
- Share score card

### 3d. Study Streak Integration
Award XP for exam practice sessions. Track exam practice in the study streak system. Show "Exam Prep Streak" on the performance page.

### 3e. AI Study Plan
After a weakness report, offer an AI-generated personalized study plan that prioritizes weak topics and suggests which modes to use (already partially exists in the edge function but not wired to UI).

---

## 4. Technical Details

### Database Migration
```text
-- Bookmarks table
CREATE TABLE exam_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, question_id)
);
ALTER TABLE exam_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own bookmarks" ON exam_bookmarks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/AdminResources.tsx` | Fix questions auto-fetch bug; add exam analytics sub-section; add question stats header; add search, bulk actions, quality indicators; wrap async calls in try/catch |
| `src/components/exam-prep/SubjectSelector.tsx` | Add "Bookmarked Questions" mode; add "AI Study Plan" mode |
| `src/components/exam-prep/PracticeSession.tsx` | Add bookmark button per question; add adaptive difficulty logic; improve post-session review with full question list and expandable explanations |
| `src/pages/ExamPrep.tsx` | Wire new modes (bookmarks, study-plan); add bookmarks view |
| `src/hooks/useSubscription.ts` | No change needed (bookmarks are free) |
| `supabase/functions/admin-resources/index.ts` | Add `exam-analytics` action returning question counts, attempt stats, accuracy data per exam type/subject; add `question-stats` action |

### New Files

| File | Purpose |
|------|---------|
| `src/components/exam-prep/BookmarkedQuestions.tsx` | Practice mode for bookmarked questions |
| `src/components/exam-prep/StudyPlanView.tsx` | AI-generated study plan display with actionable recommendations |
| `src/components/exam-prep/SessionReview.tsx` | Full post-session review with all questions, answers, and explanations |

### Admin Edge Function Additions

The `admin-resources` edge function will get a new `exam-analytics` action:
- Counts questions per exam type and subject
- Joins with `exam_attempts` to compute per-question accuracy
- Identifies questions missing explanations
- Returns PDF import summary stats

---

## 5. Implementation Order

| Step | Task |
|------|------|
| 1 | Fix questions section blank screen bug (add useEffect + try/catch) |
| 2 | Database migration for exam_bookmarks |
| 3 | Add exam analytics sub-section to admin Exams tab |
| 4 | Add question stats header, search, and quality indicators in admin |
| 5 | Add bulk actions (activate/deactivate/delete) in admin questions |
| 6 | Add bookmark button in PracticeSession and BookmarkedQuestions mode |
| 7 | Improve post-session review with full question list |
| 8 | Add adaptive difficulty to PracticeSession |
| 9 | Add AI Study Plan view wired to existing edge function |
| 10 | Add exam analytics action to admin-resources edge function |

