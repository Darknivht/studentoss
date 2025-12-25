-- Create storage bucket for note files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'note-files',
  'note-files',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
);

-- Storage policies for note files
CREATE POLICY "Users can view own note files"
ON storage.objects FOR SELECT
USING (bucket_id = 'note-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own note files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'note-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own note files"
ON storage.objects FOR DELETE
USING (bucket_id = 'note-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add file_url column to notes table
ALTER TABLE public.notes ADD COLUMN file_url TEXT;