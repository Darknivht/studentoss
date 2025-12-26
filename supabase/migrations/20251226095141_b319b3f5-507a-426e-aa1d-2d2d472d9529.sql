-- Create friends/connections table
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Create study goals/deadlines table
CREATE TABLE public.study_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL DEFAULT 'exam' CHECK (goal_type IN ('exam', 'assignment', 'quiz', 'project', 'other')),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  completed BOOLEAN NOT NULL DEFAULT false,
  reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weekly XP snapshots for leaderboard
CREATE TABLE public.weekly_xp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  notes_created INTEGER NOT NULL DEFAULT 0,
  quizzes_completed INTEGER NOT NULL DEFAULT 0,
  flashcards_reviewed INTEGER NOT NULL DEFAULT 0,
  focus_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_xp ENABLE ROW LEVEL SECURITY;

-- Friendships policies
CREATE POLICY "Users can view their own friendships" 
ON public.friendships 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests" 
ON public.friendships 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their friendships" 
ON public.friendships 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships" 
ON public.friendships 
FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Study goals policies
CREATE POLICY "Users can view their own goals" 
ON public.study_goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals" 
ON public.study_goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON public.study_goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON public.study_goals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Weekly XP policies - allow viewing all for leaderboard, but only own data for insert/update
CREATE POLICY "Anyone can view weekly XP for leaderboard" 
ON public.weekly_xp 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own weekly XP" 
ON public.weekly_xp 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly XP" 
ON public.weekly_xp 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add display_name to profiles for leaderboard visibility
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update triggers
CREATE TRIGGER update_friendships_updated_at
BEFORE UPDATE ON public.friendships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_study_goals_updated_at
BEFORE UPDATE ON public.study_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weekly_xp_updated_at
BEFORE UPDATE ON public.weekly_xp
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();