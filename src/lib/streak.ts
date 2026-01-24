import { supabase } from '@/integrations/supabase/client';

/**
 * Check if the streak should be reset based on the last study date.
 * This should be called when loading user data to ensure streak accuracy.
 */
export const checkAndResetStreak = async (userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  wasReset: boolean;
}> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_study_date')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching profile for streak check:', error);
      return { currentStreak: 0, longestStreak: 0, wasReset: false };
    }

    const currentStreak = data.current_streak || 0;
    const longestStreak = data.longest_streak || 0;
    const lastStudyDate = data.last_study_date;

    // If no study date or streak is already 0, no reset needed
    if (!lastStudyDate || currentStreak === 0) {
      return { currentStreak, longestStreak, wasReset: false };
    }

    // Calculate if streak should be reset
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Get yesterday's date
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // If last study was today or yesterday, streak is still valid
    if (lastStudyDate === todayStr || lastStudyDate === yesterdayStr) {
      return { currentStreak, longestStreak, wasReset: false };
    }

    // Streak should be reset - user missed more than one day
    console.log(`Resetting streak: last study was ${lastStudyDate}, today is ${todayStr}`);
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ current_streak: 0 })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error resetting streak:', updateError);
      return { currentStreak, longestStreak, wasReset: false };
    }

    return { currentStreak: 0, longestStreak, wasReset: true };
  } catch (err) {
    console.error('Failed to check streak:', err);
    return { currentStreak: 0, longestStreak: 0, wasReset: false };
  }
};

/**
 * Update the user's streak after a study activity.
 * Call this when the user completes a study session, quiz, flashcard review, etc.
 */
export const updateStreak = async (userId: string) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_study_date')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching profile for streak:', error);
      return;
    }

    let newStreak = data.current_streak || 0;
    const lastStudyDate = data.last_study_date;

    // Get yesterday's date
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (!lastStudyDate) {
      // First time studying
      newStreak = 1;
    } else if (lastStudyDate === todayStr) {
      // Already studied today, keep streak as is
      // Don't increment - just return
      return;
    } else if (lastStudyDate === yesterdayStr) {
      // Studied yesterday, increment streak
      newStreak += 1;
    } else {
      // Missed more than one day, start fresh
      newStreak = 1;
    }

    const newLongest = Math.max(newStreak, data.longest_streak || 0);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_study_date: todayStr,
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating streak:', updateError);
    } else {
      console.log(`Streak updated: ${newStreak} days (longest: ${newLongest})`);
    }
  } catch (err) {
    console.error('Failed to update streak:', err);
  }
};
