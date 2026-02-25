

# ExamCrusher Readiness Assessment and Per-Subject AI Prompt + Admin Super-Upgrade Plan

## Current Readiness: ~55/100

**What works well (built):**
- 9 practice modes (Quick, Topic, Year, PDF, Bookmarks, Mock, CBT, Performance, Weakness)
- Adaptive difficulty via edge function
- AI question generation fallback
- Bookmarking, session review, study plan
- Admin: exam types/subjects/topics/questions CRUD, PDF import, basic analytics
- Trend charts with Recharts
- Subscription gating (free blocked, Plus/Pro tiers)

**What is missing for "academy-level" quality:**
- No per-subject AI prompt customization (all subjects use the same generic prompt)
- No subject-specific teaching context (syllabus, key concepts, common mistakes)
- No guided learning path (students just pick random modes)
- No "Explain this topic" or AI tutoring within exam prep
- Admin panel lacks: revenue charts, engagement graphs, user activity timelines, content audit tools, system health indicators, notification management
- No spaced repetition for weak questions
- No timed practice (only mock has timer)
- No question reporting by students
- No difficulty progression within a session

---

## Plan

### 1. Per-Subject AI Prompt System (Database + Admin + Edge Function)

**Core idea:** When admin creates a subject, they can provide a custom AI system prompt. This prompt is stored in the database and injected into ALL AI interactions for that subject (question generation, study plans, explanations). Each subject becomes a "specialized teacher."

**Database change:** Add `ai_prompt` text column to `exam_subjects` table.

**Admin change (`AdminResources.tsx`):** Add a textarea field "AI Teaching Prompt" to the subject creation/edit form. Include placeholder text like: "You are an expert Chemistry teacher specializing in WAEC preparation. Focus on practical applications, use Nigerian examples, emphasize common student mistakes in organic chemistry..."

**Edge function change (`exam-practice/index.ts`):** When generating questions or study plans, fetch the subject's `ai_prompt` from the database and prepend it to the system prompt. If no custom prompt exists, fall back to the current generic prompt.

### 2. Guided Learning Mode (New Student Feature)

Add a "Guided Learning" mode in SubjectSelector that works like a lesson:
1. AI presents a topic explanation first (2-3 paragraphs)
2. Then asks 3-5 practice questions on that topic
3. After answering, AI provides personalized feedback
4. Suggests the next topic based on performance

**New file:** `src/components/exam-prep/GuidedLearning.tsx`

This uses the per-subject AI prompt to feel like a dedicated teacher for each subject.

### 3. Topic Explainer (AI "Teach Me" Button)

Within any practice mode, add a "Teach me this topic" button that calls the AI with the subject's custom prompt to generate a lesson-style explanation before the student attempts questions.

**Change in:** `PracticeSession.tsx` -- add a "Learn First" button that shows an AI-generated mini-lesson for the current question's topic.

### 4. Admin Panel Major Upgrade

**4a. Enhanced Analytics Dashboard (replace current simple stats)**

Replace the current 6-stat card grid with a full dashboard:
- **Revenue section:** Active subscriptions breakdown, monthly revenue estimate, churn indicators
- **Engagement charts:** Daily active users over 30 days (line chart), study minutes per day (bar chart), feature usage breakdown (pie chart)
- **Exam health:** Questions per subject bar chart, accuracy distribution, topics needing more questions
- **User growth:** New signups over time, conversion rates (free to Plus/Pro)

**4b. Content Audit Tool**

New admin section "Content Health" showing:
- Subjects with fewer than 20 questions (flagged red)
- Questions with zero attempts (never served)
- Questions with less than 20% accuracy (too hard or poorly written)
- Topics with no questions at all
- Subjects missing AI prompts

**4c. User Activity Timeline**

In the Users tab, when viewing a user, show their recent activity: last login, recent exam attempts, subscription changes, AI usage.

**4d. Notification/Push Management**

Add ability for admin to schedule and send push-like announcements to specific tiers or all users (extends current announcements with targeting).

### 5. Question Reporting by Students

Add a "Report" button on each question in PracticeSession. Students can flag questions as incorrect, confusing, or duplicate. Admin sees reported questions in a new "Reports" sub-section.

**Database change:** New `question_reports` table (user_id, question_id, reason, created_at).

### 6. Timed Practice Mode

Add optional timer to Quick Practice. Students can choose "Timed (2 min/question)" or "Untimed" before starting. Shows countdown per question and auto-advances.

---

## Technical Details

### Database Migrations

```text
-- 1. Per-subject AI prompt
ALTER TABLE exam_subjects ADD COLUMN IF NOT EXISTS ai_prompt text;

-- 2. Question reports
CREATE TABLE public.question_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id uuid NOT NULL,
  reason text NOT NULL DEFAULT 'incorrect',
  details text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own reports" ON public.question_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own reports" ON public.question_reports
  FOR SELECT USING (auth.uid() = user_id);
```

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/exam-prep/GuidedLearning.tsx` | Guided lesson + practice flow with AI-generated topic explanations followed by targeted questions |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/AdminResources.tsx` | Add `ai_prompt` textarea to subject form; add Content Health section; enhance Analytics with Recharts charts (line chart for DAU, bar chart for questions per subject); add Question Reports viewer; add user activity detail view |
| `src/components/exam-prep/SubjectSelector.tsx` | Add "Guided Learning" and "Timed Practice" modes |
| `src/components/exam-prep/PracticeSession.tsx` | Add question report button; add "Learn First" button; add optional per-question timer; use subject AI prompt for explanations |
| `src/pages/ExamPrep.tsx` | Wire guided-learning view and timed-practice variants |
| `supabase/functions/exam-practice/index.ts` | Fetch `ai_prompt` from `exam_subjects` and inject into all AI system prompts (question generation, study plan, explanations) |
| `supabase/functions/admin-resources/index.ts` | Add `content-health` action (returns subjects with low question counts, unreported questions, missing prompts); add `question-reports` action; add `user-activity` action; enhance `analytics` with time-series data; include `ai_prompt` in subject CRUD |

### How Per-Subject AI Prompt Works

```text
Admin creates subject "Chemistry" with AI prompt:
  "You are Prof. Adeyemi, a WAEC Chemistry expert with 20 years experience.
   Always relate concepts to everyday Nigerian life. Emphasize safety in
   practicals. Common weak areas: organic naming, electrochemistry calculations."

When student practices Chemistry:
  1. Edge function fetches subject row including ai_prompt
  2. System prompt becomes: [subject ai_prompt] + [question generation instructions]
  3. AI generates questions with Nigerian context, practical emphasis
  4. Study plans reference the same persona
  5. "Learn First" explanations use the same teacher voice
```

### Enhanced Admin Analytics Data Flow

The `admin-resources` edge function `analytics` action will be enhanced to return:
- 30-day daily active users (from `study_sessions` grouped by date)
- 30-day daily exam attempts (from `exam_attempts` grouped by date)
- Subscription tier distribution
- Per-subject question counts with health indicators
- Questions with lowest accuracy (join `exam_attempts` with `exam_questions`)

Frontend renders these using Recharts LineChart and BarChart components already available in the project.

---

## Implementation Order

| Step | Task |
|------|------|
| 1 | Database migration: add `ai_prompt` to `exam_subjects`, create `question_reports` table |
| 2 | Update `admin-resources` edge function: include `ai_prompt` in subject CRUD, add content-health action, add question-reports action, enhance analytics |
| 3 | Update `exam-practice` edge function: fetch and inject per-subject `ai_prompt` into all AI calls |
| 4 | Update `AdminResources.tsx`: add AI prompt field to subjects, add Content Health section, enhance Analytics with charts, add Reports viewer |
| 5 | Create `GuidedLearning.tsx`: AI topic explanation + targeted practice flow |
| 6 | Update `SubjectSelector.tsx`: add Guided Learning and Timed Practice modes |
| 7 | Update `PracticeSession.tsx`: add report button, "Learn First" button, optional timer |
| 8 | Update `ExamPrep.tsx`: wire new views |
| 9 | Deploy edge functions and test end-to-end |

