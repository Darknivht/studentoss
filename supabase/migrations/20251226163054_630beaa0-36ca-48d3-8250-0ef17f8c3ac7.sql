-- Add username field to profiles with unique constraint
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username text;

-- Create unique index for usernames
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles(username) WHERE username IS NOT NULL;

-- Add subscription tier columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS ai_calls_today integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_calls_reset_at date DEFAULT CURRENT_DATE;

-- Update RLS policy to allow users to read other profiles for social features
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Allow users to view all profiles for leaderboard/social (but limit visible fields)
CREATE POLICY "Users can view profiles for social"
ON public.profiles
FOR SELECT
USING (true);

-- Create study_sessions table to track daily study activity for calendar
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  total_minutes integer DEFAULT 0,
  activities_count integer DEFAULT 0,
  xp_earned integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, session_date)
);

-- Enable RLS on study_sessions
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for study_sessions
CREATE POLICY "Users can view own study sessions"
ON public.study_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions"
ON public.study_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions"
ON public.study_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Create study_groups table
CREATE TABLE IF NOT EXISTS public.study_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  topic text,
  creator_id uuid NOT NULL,
  is_public boolean DEFAULT true,
  max_members integer DEFAULT 10,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;

-- RLS policies for study_groups
CREATE POLICY "Anyone can view public groups"
ON public.study_groups
FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can create groups"
ON public.study_groups
FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update groups"
ON public.study_groups
FOR UPDATE
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete groups"
ON public.study_groups
FOR DELETE
USING (auth.uid() = creator_id);

-- Create study_group_members table
CREATE TABLE IF NOT EXISTS public.study_group_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text DEFAULT 'member',
  joined_at timestamp with time zone DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for group members
CREATE POLICY "Members can view group members"
ON public.study_group_members
FOR SELECT
USING (true);

CREATE POLICY "Users can join groups"
ON public.study_group_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
ON public.study_group_members
FOR DELETE
USING (auth.uid() = user_id);

-- Migrate all existing users to free tier
UPDATE public.profiles SET subscription_tier = 'free' WHERE subscription_tier IS NULL;