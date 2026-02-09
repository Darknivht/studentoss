
-- Add job search monthly tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS job_searches_this_month integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS job_searches_reset_month text DEFAULT to_char(CURRENT_DATE, 'YYYY-MM');

-- Fix profiles SELECT policy: replace public access with auth-only
DROP POLICY IF EXISTS "Users can view profiles for social" ON public.profiles;
CREATE POLICY "Users can view profiles for social"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix weekly_xp SELECT policy: auth-only
DROP POLICY IF EXISTS "Anyone can view weekly XP for leaderboard" ON public.weekly_xp;
CREATE POLICY "Authenticated users can view weekly XP"
ON public.weekly_xp FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix study_group_members SELECT policy: only fellow group members
DROP POLICY IF EXISTS "Members can view group members" ON public.study_group_members;
CREATE POLICY "Group members can view fellow members"
ON public.study_group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.study_group_members sgm
    WHERE sgm.group_id = study_group_members.group_id
    AND sgm.user_id = auth.uid()
  )
);

-- Fix achievements SELECT policy: auth-only
DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON public.achievements;
CREATE POLICY "Authenticated users can view achievements"
ON public.achievements FOR SELECT
USING (auth.uid() IS NOT NULL);
