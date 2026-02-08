
-- Insert 12 new achievements
INSERT INTO public.achievements (id, name, description, icon, requirement_type, requirement_value, xp_reward) VALUES
  ('social_butterfly', 'Social Butterfly', 'Join your first study group', '🦋', 'groups_joined', 1, 50),
  ('study_buddy', 'Study Buddy', 'Join 3 study groups', '🤝', 'groups_joined', 3, 150),
  ('speed_reader', 'Speed Reader', 'Create 25 notes', '📖', 'notes_count', 25, 300),
  ('library_builder', 'Library Builder', 'Create 50 notes', '🏛️', 'notes_count', 50, 500),
  ('quiz_champion', 'Quiz Champion', 'Complete 25 quizzes', '🏆', 'quizzes_count', 25, 400),
  ('flashcard_guru', 'Flashcard Guru', 'Review 500 flashcards', '🧘', 'flashcards_reviewed', 500, 500),
  ('marathon_studier', 'Marathon Studier', 'Complete 50 focus sessions', '🏃', 'focus_sessions', 50, 750),
  ('century_focus', 'Century Focus', 'Complete 100 focus sessions', '💯', 'focus_sessions', 100, 1000),
  ('xp_legend', 'XP Legend', 'Earn 5000 total XP', '⭐', 'total_xp', 5000, 750),
  ('streak_legend', 'Streak Legend', 'Maintain a 60-day streak', '🔥', 'streak', 60, 1500),
  ('streak_immortal', 'Streak Immortal', 'Maintain a 100-day streak', '♾️', 'streak', 100, 2500),
  ('early_bird', 'Early Bird', 'Create 5 notes', '🐦', 'notes_count', 5, 100)
ON CONFLICT (id) DO NOTHING;

-- Add parental control columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS parental_pin text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS daily_time_limit integer DEFAULT 120,
  ADD COLUMN IF NOT EXISTS safe_search_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS content_filter_enabled boolean DEFAULT true;
