
-- 1. Per-subject AI prompt
ALTER TABLE public.exam_subjects ADD COLUMN IF NOT EXISTS ai_prompt text;

-- 2. Question reports table
CREATE TABLE public.question_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
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
