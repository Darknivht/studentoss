
-- New columns on exam_types
ALTER TABLE public.exam_types ADD COLUMN exam_mode text NOT NULL DEFAULT 'per_subject';
ALTER TABLE public.exam_types ADD COLUMN subjects_required integer NOT NULL DEFAULT 1;
ALTER TABLE public.exam_types ADD COLUMN time_limit_minutes integer NOT NULL DEFAULT 60;
ALTER TABLE public.exam_types ADD COLUMN questions_per_subject integer NOT NULL DEFAULT 40;

-- New table for PDF uploads
CREATE TABLE public.exam_pdfs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type_id uuid NOT NULL REFERENCES public.exam_types(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.exam_subjects(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  filename text NOT NULL,
  uploaded_by text,
  questions_generated integer DEFAULT 0,
  status text DEFAULT 'processing',
  created_at timestamptz DEFAULT now()
);

-- RLS for exam_pdfs
ALTER TABLE public.exam_pdfs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view exam pdfs"
  ON public.exam_pdfs FOR SELECT USING (auth.uid() IS NOT NULL);

-- Storage bucket for exam PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('exam-pdfs', 'exam-pdfs', false);

CREATE POLICY "Authenticated upload exam pdfs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'exam-pdfs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read exam pdfs" ON storage.objects
  FOR SELECT USING (bucket_id = 'exam-pdfs' AND auth.uid() IS NOT NULL);
