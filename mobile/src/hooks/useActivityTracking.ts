import { useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UseActivityTrackingOptions {
  activityType: 'quiz' | 'flashcard' | 'reading' | 'focus';
  courseId?: string | null;
}

export const useActivityTracking = ({ activityType, courseId }: UseActivityTrackingOptions) => {
  const { user } = useAuth();
  const startTimeRef = useRef<Date | null>(null);
  const isActiveRef = useRef(false);

  const startTracking = useCallback(() => {
    if (!isActiveRef.current) {
      startTimeRef.current = new Date();
      isActiveRef.current = true;
    }
  }, []);

  const stopTracking = useCallback(async () => {
    if (!isActiveRef.current || !startTimeRef.current || !user?.id) {
      return 0;
    }

    const endTime = new Date();
    const durationMinutes = Math.round(
      (endTime.getTime() - startTimeRef.current.getTime()) / 60000
    );

    isActiveRef.current = false;
    startTimeRef.current = null;

    if (durationMinutes < 1) {
      return durationMinutes;
    }

    try {
      // Get the current week start
      const now = new Date();
      const dayOfWeek = now.getDay();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);
      const weekStartStr = weekStart.toISOString().split('T')[0];

      // Check if weekly record exists
      const { data: existingWeek } = await supabase
        .from('weekly_xp')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStartStr)
        .maybeSingle();

      const xpEarned = Math.round(durationMinutes * 2); // 2 XP per minute

      if (existingWeek) {
        // Update existing record
        const updates: Record<string, number> = {
          focus_minutes: existingWeek.focus_minutes + durationMinutes,
          xp_earned: existingWeek.xp_earned + xpEarned,
        };

        if (activityType === 'flashcard') {
          updates.flashcards_reviewed = existingWeek.flashcards_reviewed + 1;
        } else if (activityType === 'quiz') {
          updates.quizzes_completed = existingWeek.quizzes_completed + 1;
        }

        await supabase
          .from('weekly_xp')
          .update(updates)
          .eq('id', existingWeek.id);
      } else {
        // Create new record
        await supabase
          .from('weekly_xp')
          .insert({
            user_id: user.id,
            week_start: weekStartStr,
            focus_minutes: durationMinutes,
            xp_earned: xpEarned,
            flashcards_reviewed: activityType === 'flashcard' ? 1 : 0,
            quizzes_completed: activityType === 'quiz' ? 1 : 0,
            notes_created: 0,
          });
      }

      // Update total XP in profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_xp')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ total_xp: (profile.total_xp || 0) + xpEarned })
          .eq('user_id', user.id);
      }

      return durationMinutes;
    } catch (error) {
      console.error('Error tracking activity:', error);
      return durationMinutes;
    }
  }, [user?.id, activityType]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isActiveRef.current) {
        stopTracking();
      }
    };
  }, [stopTracking]);

  return {
    startTracking,
    stopTracking,
    isActive: isActiveRef.current,
  };
};

export default useActivityTracking;