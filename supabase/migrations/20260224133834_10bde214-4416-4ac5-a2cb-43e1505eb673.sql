
-- Create announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active announcements
CREATE POLICY "Authenticated users can view active announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- No direct INSERT/UPDATE/DELETE for users - admin edge function uses service role
