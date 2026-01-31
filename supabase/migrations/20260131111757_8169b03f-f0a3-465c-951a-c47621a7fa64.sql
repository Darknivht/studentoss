-- Create focus_sessions table
CREATE TABLE public.focus_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  target_duration_minutes INTEGER NOT NULL DEFAULT 25,
  actual_duration_minutes INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'paused')),
  blocked_apps JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blocked_app_list table
CREATE TABLE public.blocked_app_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  package_name TEXT NOT NULL,
  app_name TEXT NOT NULL,
  app_icon TEXT DEFAULT '📱',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, package_name)
);

-- Enable RLS on both tables
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_app_list ENABLE ROW LEVEL SECURITY;

-- RLS policies for focus_sessions
CREATE POLICY "Users can view own focus sessions"
ON public.focus_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own focus sessions"
ON public.focus_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own focus sessions"
ON public.focus_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own focus sessions"
ON public.focus_sessions FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for blocked_app_list
CREATE POLICY "Users can view own blocked apps"
ON public.blocked_app_list FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blocked apps"
ON public.blocked_app_list FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own blocked apps"
ON public.blocked_app_list FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own blocked apps"
ON public.blocked_app_list FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_focus_sessions_user_id ON public.focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_status ON public.focus_sessions(status);
CREATE INDEX idx_blocked_app_list_user_id ON public.blocked_app_list(user_id);