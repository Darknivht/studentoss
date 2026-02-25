

# ExamCrusher Enhancement Plan: Multi-Mode Exams, PDF Question Import, and Admin Controls

## Overview

This plan upgrades the ExamCrusher module to support two distinct exam modes (per-subject and multi-subject CBT), PDF-based question extraction by admin, and richer international exam support (TOEFL, IELTS, SAT, GRE). It also improves explanation quality and admin workflows.

---

## What Changes

### 1. Exam Type Configuration -- Admin-Controlled Exam Modes

Add a new column `exam_mode` to the `exam_types` table so the admin can configure whether an exam type uses:
- **per_subject** -- Student picks one subject at a time (e.g., WAEC, NECO, TOEFL, IELTS)
- **multi_subject** -- Student picks multiple subjects and takes them all at once in a timed CBT session (e.g., JAMB UTME)

Also add `subjects_required` (integer, default 1) and `time_limit_minutes` (integer, default 60) columns so the admin can set how many subjects to combine and total time.

### 2. PDF Upload for Question Extraction (Admin)

Add a new feature in the Admin Exams tab:
- Admin uploads a PDF file to a subject
- The system extracts text from the PDF using the existing `extract-pdf-text` edge function
- The extracted text is sent to AI (via the exam-practice edge function) to generate structured questions with detailed explanations
- Generated questions are saved to `exam_questions` with source = `pdf_extracted`
- Admin can review, edit, or delete generated questions before activating them

A new `exam_pdfs` table will store uploaded PDF references:
- `id`, `exam_type_id`, `subject_id`, `file_url`, `filename`, `uploaded_by`, `questions_generated` (count), `created_at`

Storage: Use the existing `store-resources` bucket or create a new `exam-pdfs` bucket.

### 3. Multi-Subject CBT Mode (Student-Facing)

A new component `MultiSubjectCBT` for exams configured as `multi_subject`:
- Student selects N subjects (as configured by admin, e.g., 4 for JAMB)
- System loads questions per subject (e.g., 45 per subject for JAMB = 180 total)
- Timed session with per-subject navigation tabs
- Auto-submit on timeout
- Results breakdown per subject with scores, percentages, and weak areas
- The existing `SubjectSelector` will detect `exam_mode` and show a "Start Full CBT" button instead of per-subject mode selection for multi-subject exams

### 4. Enhanced Explanations

- All AI-generated and PDF-extracted questions will include rich, step-by-step explanations
- The AI prompt will be updated to require explanations that: explain WHY the correct answer is right, WHY each distractor is wrong, and reference relevant concepts/formulas
- Explanations will render with Markdown support (formulas, bold, lists)

### 5. International Exam Seeding

Seed TOEFL, IELTS, SAT, and GRE exam types with appropriate subjects:
- **TOEFL**: Reading, Listening, Speaking, Writing
- **IELTS**: Reading, Listening, Writing, Speaking
- **SAT**: Reading & Writing, Math
- **GRE**: Verbal Reasoning, Quantitative Reasoning, Analytical Writing

### 6. Admin Improvements

- Add a "PDF Import" section to the Exams tab for uploading PDFs per subject
- Show PDF upload history with question count generated
- Add `exam_mode` selector to the Exam Types form (per_subject / multi_subject)
- Add `subjects_required` and `time_limit_minutes` fields for multi-subject exams

---

## Technical Details

### Database Migration

```text
-- New columns on exam_types
ALTER TABLE exam_types ADD COLUMN exam_mode text NOT NULL DEFAULT 'per_subject';
ALTER TABLE exam_types ADD COLUMN subjects_required integer NOT NULL DEFAULT 1;
ALTER TABLE exam_types ADD COLUMN time_limit_minutes integer NOT NULL DEFAULT 60;
ALTER TABLE exam_types ADD COLUMN questions_per_subject integer NOT NULL DEFAULT 40;

-- New table for PDF uploads
CREATE TABLE exam_pdfs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  file_url text NOT NULL,
  filename text NOT NULL,
  uploaded_by text,
  questions_generated integer DEFAULT 0,
  status text DEFAULT 'processing',
  created_at timestamptz DEFAULT now()
);

-- RLS: admin-only via edge function (service role), read for authenticated
ALTER TABLE exam_pdfs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view exam pdfs"
  ON exam_pdfs FOR SELECT USING (auth.uid() IS NOT NULL);

-- Storage bucket for exam PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('exam-pdfs', 'exam-pdfs', false);
CREATE POLICY "Admin upload exam pdfs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'exam-pdfs');
CREATE POLICY "Authenticated read exam pdfs" ON storage.objects
  FOR SELECT USING (bucket_id = 'exam-pdfs' AND auth.uid() IS NOT NULL);
```

### Files to Create

1. **`src/components/exam-prep/MultiSubjectCBT.tsx`** -- New multi-subject CBT component
   - Subject selection screen (checkboxes, must select N subjects)
   - Timed exam interface with subject tabs
   - Question navigation grid per subject
   - Auto-submit on timeout
   - Per-subject results breakdown

2. **`src/components/admin/PdfQuestionImport.tsx`** -- Admin PDF upload and question extraction component

### Files to Modify

1. **`src/pages/ExamPrep.tsx`** -- Add `multi-cbt` view, detect exam mode from exam_types
2. **`src/components/exam-prep/ExamSelector.tsx`** -- Pass exam_mode info to parent
3. **`src/components/exam-prep/SubjectSelector.tsx`** -- Show "Start Full CBT" for multi-subject exams; keep per-subject modes for per_subject exams
4. **`src/components/exam-prep/PracticeSession.tsx`** -- Use MarkdownRenderer for explanations
5. **`src/components/exam-prep/MockExamMode.tsx`** -- Use MarkdownRenderer for explanations
6. **`src/pages/AdminResources.tsx`** -- Add exam_mode/subjects_required/time_limit fields to type form; add PDF import section
7. **`supabase/functions/exam-practice/index.ts`** -- Add `extract-pdf-questions` action that takes PDF text and generates questions with rich explanations; update AI prompts for better explanations
8. **`supabase/functions/admin-resources/index.ts`** -- Add CRUD for exam_pdfs, handle PDF upload flow

### Student Flow for Multi-Subject Exams (e.g., JAMB)

```text
ExamSelector --> detect exam_mode = "multi_subject"
  --> MultiSubjectCBT (select 4 subjects)
    --> Load 45 questions per subject (180 total)
    --> 120-minute countdown timer
    --> Subject tabs for navigation
    --> Submit / Auto-submit
    --> Per-subject results + overall score
```

### Student Flow for Per-Subject Exams (e.g., WAEC, IELTS)

```text
ExamSelector --> detect exam_mode = "per_subject"
  --> SubjectSelector (pick one subject)
    --> Choose mode: Quick Practice / Topic / Mock / Performance / Weakness
    --> (unchanged from current flow)
```

### Admin PDF Import Flow

```text
Admin selects Exam Type + Subject
  --> Uploads PDF file
  --> PDF text extracted via edge function
  --> AI generates questions with rich explanations
  --> Questions saved as "pdf_extracted" source
  --> Admin reviews in question list, can edit/delete
```

---

## Implementation Order

| Step | Task | Priority |
|------|------|----------|
| 1 | Database migration (new columns + exam_pdfs table + bucket) | High |
| 2 | Seed TOEFL, IELTS, SAT, GRE exam types with subjects | High |
| 3 | Update Admin Exam Types form with mode/subjects/time fields | High |
| 4 | Update JAMB to exam_mode = multi_subject, subjects_required = 4, time = 120 | High |
| 5 | Build MultiSubjectCBT component | High |
| 6 | Update ExamPrep + SubjectSelector to route based on exam_mode | High |
| 7 | Add PDF import to admin panel + edge function action | Medium |
| 8 | Enhance AI prompts for richer explanations + Markdown rendering | Medium |
| 9 | Test end-to-end: JAMB multi-subject CBT + WAEC per-subject + PDF import | High |

