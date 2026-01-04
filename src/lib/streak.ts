import { supabase } from '@/integrations/supabase/client';

export const updateStreak = async (userId: string) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    try {
        // We cast to any here because the types might not be regenerated yet 
        // to include the new 'last_study_at' column
        const { data, error } = await supabase
            .from('profiles')
            .select('current_streak, longest_streak, last_study_at, last_study_date')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            console.error('Error fetching profile for streak:', error);
            return;
        }

        const profile = data as any;

        let newStreak = profile.current_streak || 0;
        let lastTime: Date | null = null;

        if (profile.last_study_at) {
            // Precise tracking for users who have already migrated
            lastTime = new Date(profile.last_study_at);
            const diffMs = now.getTime() - lastTime.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffHours > 24) {
                newStreak = 1;
            } else {
                // If it's a new calendar day (UTC) compared to the last study date, increment
                // This allows multiple sessions in one day without inflating streak,
                // but ensures streak grows if you study daily.
                if (profile.last_study_date !== todayStr) {
                    newStreak += 1;
                }
            }
        } else {
            // Legacy fallback: Use calendar days to be lenient during migration
            // This prevents unfair resets for users transitioning from the old system
            const lastDate = profile.last_study_date;
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (!lastDate) {
                newStreak = 1;
            } else if (lastDate === todayStr) {
                // Already studied today, keep streak
            } else if (lastDate === yesterdayStr) {
                // Studied yesterday, increment
                newStreak += 1;
            } else {
                // Missed a day (or more), reset
                newStreak = 1;
            }
        }

        const newLongest = Math.max(newStreak, profile.longest_streak || 0);

        await supabase
            .from('profiles')
            .update({
                current_streak: newStreak,
                longest_streak: newLongest,
                last_study_at: now.toISOString(),
                last_study_date: todayStr,
            } as any)
            .eq('user_id', userId);

    } catch (err) {
        console.error('Failed to update streak:', err);
    }
};
