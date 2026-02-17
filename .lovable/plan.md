
# Add "Review with AI Tutor" to All Assessments + Expand Mock Exam Question Options

## Overview

Add a "Review Results with AI Tutor" button to the completion screens of **Mock Exam**, **Fill-in-the-Blanks**, and **Daily Brain Boost**. Each redirects to the appropriate tutor (course-based or note-based) with detailed results context. Also expand Mock Exam question count options to include 40 and 60 questions (gated by subscription tier).

---

## 1. Mock Exam: Add "Review with Tutor" + Expand Question Counts

**File: `src/components/study/MockExam.tsx`**

### Review with Tutor
- Track user answers in an array (currently not tracked -- only score is tracked)
- On the completion screen, add a "Review Results with AI Tutor" button
- Build a context string listing each question, user's answer, correct answer, and whether they got it right/wrong
- Since MockExam is note-based, navigate to `/tutor` with `noteId` and the quiz context (same pattern as `Quizzes.tsx` uses `handleReviewWithTutor`)
- Need to store the selected note's `course_id` (fetch it when generating exam) so the tutor can route correctly

### Expand Question Counts
- Currently the slider goes from 5 to 20 (step of 5)
- Change to support: 5, 10, 15, 20 (Free), 40 (Plus+), 60 (Pro only)
- Add subscription check: show 40 and 60 as locked options for users without the right tier
- Use `useSubscription` hook to check tier
- Update the slider to a button group instead (cleaner for non-linear options)
- Show a lock icon and tier badge on gated options

---

## 2. Fill-in-the-Blanks: Add "Review with Tutor"

**File: `src/components/study/FillBlanks.tsx`**

- Track user answers alongside each blank (currently only tracks score)
- Add `userAnswers` state array to record what the user typed for each blank
- On the completion screen, add a "Review Results with AI Tutor" button
- Build context string: each sentence with the blank, what the user answered, and the correct answer
- Navigate to `/tutor` with `noteId` (already tracked via `selectedNote`) and the context
- Need to also fetch the note's `course_id` to enable proper tutor routing
- Import `useNavigate` from react-router-dom

---

## 3. Daily Brain Boost: Add "Review with Tutor"

**File: `src/components/gamification/DailyQuizChallenge.tsx`**

- On the completion/results screen, add a "Review with AI Tutor" button
- If quiz was generated from user notes (AI-based), include the `noteId`/`courseId` and route to the appropriate tutor
- If quiz was general knowledge (hardcoded pool), navigate to `/tutor` without a specific note/course -- the context string alone provides enough info for the tutor to help
- Build context string from the questions, user answers, and correct answers
- Import `useNavigate` from react-router-dom

---

## 4. Files Changed Summary

| File | Changes |
|---|---|
| `src/components/study/MockExam.tsx` | Add answer tracking, "Review with Tutor" button, expand question count to 40/60 with subscription gating, fetch note's course_id |
| `src/components/study/FillBlanks.tsx` | Add answer tracking, "Review with Tutor" button, fetch note's course_id |
| `src/components/gamification/DailyQuizChallenge.tsx` | Add "Review with Tutor" button on completion screen |

### Technical Details

**Answer tracking pattern** (same across all three components):
```text
- Add state: userAnswers array
- Record each answer as it's given
- On completion, build context string with format:
  "Assessment Results: X/Y (Z%)
   Wrong answers: [question, user answer, correct answer]
   Correct answers: [question, correct answer]"
- Navigate to /tutor with state: { quizContext, courseId, noteId, autoStart: true }
```

**Mock Exam question gating**:
- Replace Slider with a grid of buttons: 5, 10, 15, 20, 40, 60
- 5-20: available to all users
- 40: requires Plus or Pro (show lock + "Plus" badge if free)
- 60: requires Pro only (show lock + "Pro" badge if not Pro)
- When a locked option is tapped, show a toast directing to upgrade

No database changes needed -- all existing tables and navigation patterns support these additions.
