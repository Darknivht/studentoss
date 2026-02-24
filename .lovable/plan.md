

# ExamCrusher Integration into StudentOS

## What I Understand

You originally planned ExamCrusher as a standalone AI-powered exam preparation platform for Nigerian students (WAEC, NECO, JAMB). Instead of building it separately, you want to integrate its core functionality directly into StudentOS as a premium feature section. Key ideas:

1. **Exam Prep as a premium module** -- users pay separately (or it's part of a higher tier) to access structured exam preparation for specific exams
2. **Admin-managed exams** -- you (as admin) can create new exam types (WAEC, NECO, JAMB, IELTS, TOEFL, etc.), add subjects/topics, upload past questions, and manage resources per exam
3. **Student-facing exam practice** -- students select an exam, pick subjects, and get AI-generated questions with difficulty adaptation, performance tracking, weakness detection, and study schedules
4. **Extensible** -- not locked to Nigerian exams; you can add any exam type (IELTS, TOEFL, SAT, GRE, etc.) from the admin panel at any time

---

## Architecture Overview

```text
+-------------------+          +------------------+
|   Admin Panel     |          |   Student UI     |
| (new "Exams" tab) |          | (new /exams page)|
+-------------------+          +------------------+
        |                              |
        v                              v
+------------------------------------------+
|         Database Tables                  |
| exam_types | exam_subjects | exam_topics |
| exam_questions | exam_attempts           |
| exam_performance | exam_subscriptions    |
+------------------------------------------+
        |                              |
        v                              v
+-------------------+     +--------------------+
| admin-resources   |     | exam-practice      |
| edge function     |     | edge function      |
| (CRUD for exams)  |     | (AI question gen,  |
|                   |     |  answer eval,      |
|                   |     |  weakness detect)  |
+-------------------+     +--------------------+
```

---

## Phase-by-Phase Implementation Plan

### Phase A: Database Schema (Migration)

Create 6 new tables:

**1. `exam_types`** -- Admin-defined exam categories
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | auto-generated |
| name | text | e.g., "JAMB UTME", "WAEC SSCE", "IELTS", "TOEFL" |
| slug | text (unique) | e.g., "jamb", "waec", "ielts" |
| description | text | What this exam is about |
| icon | text | Emoji icon |
| country | text | "Nigeria", "International", etc. |
| is_active | boolean | Admin can disable |
| created_at | timestamptz | default now() |

**2. `exam_subjects`** -- Subjects within each exam
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | auto-generated |
| exam_type_id | uuid (FK) | References exam_types |
| name | text | e.g., "Mathematics", "English Language" |
| icon | text | Emoji |
| topics_count | integer | For display (updated by admin) |
| is_active | boolean | default true |
| created_at | timestamptz | default now() |

**3. `exam_topics`** -- Topics within each subject
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | auto-generated |
| subject_id | uuid (FK) | References exam_subjects |
| name | text | e.g., "Organic Chemistry - Alkanes" |
| description | text | Brief description |
| difficulty | text | "easy", "medium", "hard" |
| is_active | boolean | default true |
| created_at | timestamptz | default now() |

**4. `exam_questions`** -- Past questions and AI-cached questions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | auto-generated |
| topic_id | uuid (FK) | References exam_topics |
| subject_id | uuid (FK) | References exam_subjects |
| exam_type_id | uuid (FK) | References exam_types |
| question | text | The question text |
| options | jsonb | Array of 4 options |
| correct_index | integer | 0-3 |
| explanation | text | Why the answer is correct |
| difficulty | text | "easy", "medium", "hard" |
| year | text | e.g., "2023", "2024" (for past questions) |
| source | text | "past_question", "ai_generated", "admin_added" |
| is_active | boolean | default true |
| created_at | timestamptz | default now() |

**5. `exam_attempts`** -- Student answer history
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | auto-generated |
| user_id | uuid | The student |
| exam_type_id | uuid (FK) | Which exam |
| subject_id | uuid (FK) | Which subject |
| topic_id | uuid (FK, nullable) | Which topic |
| question_id | uuid (FK, nullable) | If from question bank |
| selected_index | integer | Student's answer |
| is_correct | boolean | Was it right |
| time_spent_seconds | integer | Time on this question |
| session_id | uuid | Groups questions into a practice session |
| created_at | timestamptz | default now() |

**6. `exam_subscriptions`** -- Separate payment tracking for ExamCrusher access
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | auto-generated |
| user_id | uuid | The student |
| exam_type_id | uuid (FK, nullable) | null = all exams access |
| plan | text | "monthly", "yearly", "lifetime" |
| status | text | "active", "expired", "cancelled" |
| starts_at | timestamptz | When access begins |
| expires_at | timestamptz | When access ends |
| payment_reference | text | Paystack reference |
| amount_paid | integer | In kobo |
| created_at | timestamptz | default now() |

**RLS Policies:**
- `exam_types`, `exam_subjects`, `exam_topics`, `exam_questions`: Authenticated users can SELECT active records (read-only for students; admin writes via edge function with service role)
- `exam_attempts`: Users can INSERT and SELECT their own records only
- `exam_subscriptions`: Users can SELECT their own records only (inserts via edge function after payment)

---

### Phase B: Admin Panel -- "Exams" Tab

Add a 7th tab to the existing Admin Dashboard (`/admin-resources`):

**Tab: "Exams"** with sub-sections:

1. **Exam Types Manager**
   - Create new exam types (name, slug, description, icon, country)
   - Edit/delete existing exam types
   - Toggle active/inactive

2. **Subjects Manager** (filtered by selected exam type)
   - Add subjects to an exam (e.g., add "Physics" to JAMB)
   - Edit/delete subjects

3. **Topics Manager** (filtered by selected subject)
   - Add topics under a subject (e.g., "Organic Chemistry" under Chemistry)
   - Set difficulty level
   - Edit/delete topics

4. **Question Bank Manager**
   - Add individual questions manually (question text, 4 options, correct answer, explanation, difficulty, year)
   - Bulk import: Upload a JSON file of questions
   - View/edit/delete existing questions
   - Filter by exam type, subject, topic, difficulty, source

**Edge Function Updates (`admin-resources/index.ts`):**
- New actions: `create-exam-type`, `update-exam-type`, `delete-exam-type`, `list-exam-types`
- New actions: `create-exam-subject`, `update-exam-subject`, `delete-exam-subject`, `list-exam-subjects`
- New actions: `create-exam-topic`, `update-exam-topic`, `delete-exam-topic`, `list-exam-topics`
- New actions: `create-exam-question`, `update-exam-question`, `delete-exam-question`, `list-exam-questions`, `bulk-import-questions`

**Files changed:** `supabase/functions/admin-resources/index.ts`, `src/pages/AdminResources.tsx`

---

### Phase C: Student-Facing Exam Prep Page

**New route: `/exams`**
**New page: `src/pages/ExamPrep.tsx`**

**UI Flow:**

```text
/exams
  -> List of available exams (JAMB, WAEC, NECO, IELTS, etc.)
  -> Select an exam
    -> Show subjects for that exam
    -> Select a subject
      -> Options:
        1. "Quick Practice" (10 questions, untimed)
        2. "Topic Practice" (pick a topic, 10-20 questions)
        3. "Mock Exam" (full timed simulation)
        4. "My Performance" (analytics for this subject)
        5. "Weak Topics" (AI-identified weaknesses)
```

**Sub-components to create:**
- `src/components/exam-prep/ExamSelector.tsx` -- Grid of exam type cards
- `src/components/exam-prep/SubjectSelector.tsx` -- Subjects for a selected exam
- `src/components/exam-prep/PracticeSession.tsx` -- The actual question-answering interface (timed/untimed, shows question + 4 options, instant feedback with explanation)
- `src/components/exam-prep/ExamPerformance.tsx` -- Charts showing performance by subject/topic over time, weak topics highlighted
- `src/components/exam-prep/MockExamMode.tsx` -- Full timed simulation (configurable question count)
- `src/components/exam-prep/WeaknessReport.tsx` -- AI-analyzed weak topics with recommended focus areas

**Navigation:**
- Add "Exams" as a prominent card on the Study page (between Study Tools and Study Modes sections)
- Alternatively, add a dedicated entry point on the Dashboard

---

### Phase D: New Edge Function -- `exam-practice`

**New file: `supabase/functions/exam-practice/index.ts`**

This edge function handles:

1. **Generate Questions** -- Given an exam type, subject, and optionally a topic:
   - First check the `exam_questions` table for existing questions
   - If not enough cached questions, call Lovable AI to generate new ones using the exam's context (syllabus, difficulty, exam style)
   - Cache generated questions in `exam_questions` for reuse
   - Return a set of questions (10 for quick practice, configurable for mock exams)

2. **Evaluate Answer** -- Record the attempt, return explanation

3. **Weakness Detection** -- Analyze `exam_attempts` for the user:
   - Calculate accuracy per topic (rolling window, last 100 attempts)
   - Flag topics below 60% accuracy with 5+ attempts
   - Return ranked list of weak topics with confidence scores

4. **Generate Study Plan** -- Based on weak topics, exam date (if set), and available study time, generate an AI-powered daily study plan

---

### Phase E: Monetization -- ExamCrusher Payment

**Two approaches (you choose):**

**Option 1: Separate ExamCrusher subscription**
- Free tier: 5 practice questions/day, 1 exam type, no mock exams
- ExamCrusher Plan: Separate Paystack payment (e.g., N3,000/month)
- Stored in `exam_subscriptions` table
- Users with StudentOS Pro get ExamCrusher included

**Option 2: Bundle into existing tiers**
- Free: 5 exam questions/day
- Plus: 30 exam questions/day, mock exams
- Pro: Unlimited everything

**Implementation:**
- Add exam-specific limits to the existing `useSubscription` hook OR create a new `useExamSubscription` hook
- New Paystack payment flow for ExamCrusher (if separate)
- Update the Upgrade page to show ExamCrusher pricing
- Gate the exam features using `FeatureGateDialog`

**Files:** `src/pages/Upgrade.tsx`, `src/hooks/useSubscription.ts` or new `src/hooks/useExamSubscription.ts`, `supabase/functions/verify-payment/index.ts`

---

### Phase F: Integration Points

1. **Bottom Nav** -- No change needed (exams accessible from Study page or a card on Dashboard)
2. **Study Page** -- Add a prominent "Exam Prep" card/banner at the top of the Study page linking to `/exams`
3. **Dashboard** -- Add an "Exam Prep" widget showing recent performance or upcoming exam countdown
4. **App.tsx** -- Add route: `<Route path="/exams" element={<AppLayout><ExamPrep /></AppLayout>} />`
5. **Store integration** -- Admin can upload exam-specific resources (past question PDFs, textbooks) tagged to specific exam types

---

## Technical Details

### Database Migration SQL (Summary)

- Create 6 tables with proper foreign keys and defaults
- Enable RLS on all tables
- Add SELECT policies for authenticated users on reference tables (exam_types, exam_subjects, exam_topics, exam_questions)
- Add user-scoped INSERT/SELECT policies on exam_attempts and exam_subscriptions
- Admin writes handled via service role in edge functions

### Edge Function: `exam-practice/index.ts`

- Handles authentication via Bearer token (same pattern as `ai-study`)
- Actions: `generate-questions`, `submit-answer`, `get-performance`, `get-weaknesses`, `generate-study-plan`
- Uses Lovable AI gateway for question generation (model: `google/gemini-2.5-flash` for speed)
- Caches generated questions to reduce AI calls

### Admin Panel Updates

- Add 7th tab "Exams" to `TabsList` in `AdminResources.tsx`
- Create `ExamsTab` component with cascading selectors (exam type -> subject -> topic -> questions)
- All CRUD operations go through `admin-resources` edge function with new action types

### Subscription Check Logic

```text
function canAccessExamPrep(user):
  if user has active exam_subscription -> allow
  if user.subscription_tier == "pro" -> allow (bundled)
  if user.subscription_tier == "plus" -> allow with daily limits
  if user.subscription_tier == "free" -> allow 5 questions/day
```

### File Summary

| File | Action |
|------|--------|
| New migration SQL | Create 6 tables + RLS |
| `supabase/functions/admin-resources/index.ts` | Add exam CRUD actions |
| `supabase/functions/exam-practice/index.ts` | New edge function |
| `src/pages/AdminResources.tsx` | Add Exams tab |
| `src/pages/ExamPrep.tsx` | New student-facing page |
| `src/components/exam-prep/ExamSelector.tsx` | New component |
| `src/components/exam-prep/SubjectSelector.tsx` | New component |
| `src/components/exam-prep/PracticeSession.tsx` | New component |
| `src/components/exam-prep/ExamPerformance.tsx` | New component |
| `src/components/exam-prep/MockExamMode.tsx` | New component |
| `src/components/exam-prep/WeaknessReport.tsx` | New component |
| `src/App.tsx` | Add /exams route |
| `src/pages/Study.tsx` | Add Exam Prep entry point |
| `src/pages/Upgrade.tsx` | Add ExamCrusher pricing (if separate) |
| `src/hooks/useExamSubscription.ts` | New hook (if separate payment) |
| `supabase/functions/verify-payment/index.ts` | Handle exam payments (if separate) |

---

## Implementation Order

1. Database migration (all 6 tables + RLS)
2. Admin edge function updates (exam CRUD actions)
3. Admin panel UI (Exams tab with full CRUD)
4. `exam-practice` edge function (question generation + evaluation)
5. Student-facing page + components
6. Payment/subscription gating
7. Integration points (Study page card, Dashboard widget, routing)

This will be implemented across multiple messages due to the size. Each step builds on the previous one.

