-- Add last_study_at timestamp for precise streak tracking
ALTER TABLE public.profiles
ADD COLUMN last_study_at TIMESTAMP WITH TIME ZONE;
