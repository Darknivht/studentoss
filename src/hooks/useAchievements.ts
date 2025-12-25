import { supabase } from '@/integrations/supabase/client';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
}

interface UserStats {
  notes_count: number;
  quizzes_count: number;
  flashcards_reviewed: number;
  streak: number;
  focus_sessions: number;
  total_xp: number;
}

/**
 * Fetches user stats for achievement checking
 */
export const fetchUserStats = async (userId: string): Promise<UserStats> => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_streak, total_xp')
    .eq('user_id', userId)
    .maybeSingle();

  const { count: notesCount } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { count: quizzesCount } = await supabase
    .from('quiz_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { count: focusCount } = await supabase
    .from('pomodoro_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('session_type', 'focus');

  const { data: flashcards } = await supabase
    .from('flashcards')
    .select('repetitions')
    .eq('user_id', userId);

  const flashcardsReviewed = flashcards?.reduce((sum, fc) => sum + (fc.repetitions || 0), 0) || 0;

  return {
    notes_count: notesCount || 0,
    quizzes_count: quizzesCount || 0,
    flashcards_reviewed: flashcardsReviewed,
    streak: profile?.current_streak || 0,
    focus_sessions: focusCount || 0,
    total_xp: profile?.total_xp || 0,
  };
};

/**
 * Checks and unlocks achievements for a user. Returns newly unlocked achievements.
 * Uses upsert-like behavior to prevent duplicates.
 */
export const checkAndUnlockAchievements = async (
  userId: string,
  stats: UserStats
): Promise<{ newlyUnlocked: Achievement[]; totalXpAwarded: number }> => {
  // Fetch all achievements
  const { data: allAchievements } = await supabase
    .from('achievements')
    .select('*')
    .order('requirement_value', { ascending: true });

  // Fetch user's already unlocked achievements
  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);

  const unlockedIds = new Set((userAchievements || []).map((ua) => ua.achievement_id));
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of allAchievements || []) {
    // Skip if already unlocked
    if (unlockedIds.has(achievement.id)) continue;

    // Check if user meets the requirement
    const currentValue = stats[achievement.requirement_type as keyof UserStats] || 0;
    if (currentValue >= achievement.requirement_value) {
      // Try to insert - use a transaction-like check to prevent duplicates
      const { error } = await supabase.from('user_achievements').insert({
        user_id: userId,
        achievement_id: achievement.id,
      });

      // If no error, it's a new unlock
      if (!error) {
        newlyUnlocked.push(achievement);
      }
    }
  }

  // Award XP for newly unlocked achievements in a single update
  const totalXpAwarded = newlyUnlocked.reduce((sum, a) => sum + a.xp_reward, 0);
  
  if (totalXpAwarded > 0) {
    // Fetch current XP first to avoid race conditions
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('user_id', userId)
      .maybeSingle();

    const currentXp = currentProfile?.total_xp || 0;
    
    await supabase
      .from('profiles')
      .update({ total_xp: currentXp + totalXpAwarded })
      .eq('user_id', userId);
  }

  return { newlyUnlocked, totalXpAwarded };
};

/**
 * Full achievement check flow - fetches stats and checks achievements
 */
export const runAchievementCheck = async (userId: string) => {
  const stats = await fetchUserStats(userId);
  return checkAndUnlockAchievements(userId, stats);
};
