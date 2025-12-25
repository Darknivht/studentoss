-- Create achievements table
CREATE TABLE public.achievements (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL
);

-- Create user_achievements table to track unlocked achievements
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievements are readable by everyone
CREATE POLICY "Achievements are viewable by everyone" ON public.achievements FOR SELECT USING (true);

-- User achievements policies
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (id, name, description, icon, xp_reward, requirement_type, requirement_value) VALUES
('first_note', 'First Steps', 'Create your first note', '📝', 50, 'notes_count', 1),
('note_master', 'Note Master', 'Create 10 notes', '📚', 200, 'notes_count', 10),
('quiz_taker', 'Quiz Taker', 'Complete your first quiz', '🎯', 50, 'quizzes_count', 1),
('quiz_master', 'Quiz Master', 'Complete 10 quizzes', '🏆', 200, 'quizzes_count', 10),
('flashcard_learner', 'Flashcard Learner', 'Review 10 flashcards', '🎴', 50, 'flashcards_reviewed', 10),
('flashcard_master', 'Flashcard Master', 'Review 100 flashcards', '⭐', 300, 'flashcards_reviewed', 100),
('streak_starter', 'Streak Starter', 'Get a 3-day streak', '🔥', 100, 'streak', 3),
('streak_warrior', 'Streak Warrior', 'Get a 7-day streak', '💪', 250, 'streak', 7),
('streak_champion', 'Streak Champion', 'Get a 30-day streak', '👑', 1000, 'streak', 30),
('focus_beginner', 'Focus Beginner', 'Complete 5 focus sessions', '⏱️', 100, 'focus_sessions', 5),
('focus_pro', 'Focus Pro', 'Complete 25 focus sessions', '🧘', 500, 'focus_sessions', 25),
('xp_collector', 'XP Collector', 'Earn 500 XP', '💎', 100, 'total_xp', 500),
('xp_master', 'XP Master', 'Earn 2000 XP', '🌟', 500, 'total_xp', 2000);