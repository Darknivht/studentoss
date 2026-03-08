import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface StudyTimeTrackerResult {
  todayMinutes: number;
  dailyGoalMinutes: number;
  isGoalMet: boolean;
  startSession: (type: 'notes' | 'quizzes' | 'flashcards' | 'pomodoro') => void;
  endSession: () => void;
  isTracking: boolean;
  currentSessionType: string | null;
  currentSessionDuration: number;
  setDailyGoal: (minutes: number) => Promise<void>;
  refreshStats: () => Promise<void>;
}

const STORAGE_KEY = 'study_time_tracker';
const DAILY_GOAL_KEY = 'daily_study_goal';

export function useStudyTimeTracker(): StudyTimeTrackerResult {
  const { user, authReady } = useAuth();
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(60); // Default 60 minutes
  const [isTracking, setIsTracking] = useState(false);
  const [currentSessionType, setCurrentSessionType] = useState<string | null>(null);
  const [currentSessionDuration, setCurrentSessionDuration] = useState(0);
  
  const sessionStartRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load daily goal from localStorage
  useEffect(() => {
    const savedGoal = localStorage.getItem(DAILY_GOAL_KEY);
    if (savedGoal) {
      setDailyGoalMinutes(parseInt(savedGoal, 10));
    }
  }, []);

  // Load today's study time from localStorage and DB
  const refreshStats = useCallback(async () => {
    if (!user || !authReady) return;

    const today = new Date().toISOString().split('T')[0];
    
    // Try to get from localStorage first
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.date === today) {
          setTodayMinutes(parsed.minutes);
        } else {
          // New day, reset
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, minutes: 0 }));
          setTodayMinutes(0);
        }
      } catch {
        setTodayMinutes(0);
      }
    }

    // Sync from database + include pomodoro sessions
    try {
      const [sessionRes, pomodoroRes] = await Promise.all([
        supabase
          .from('study_sessions')
          .select('total_minutes')
          .eq('user_id', user.id)
          .eq('session_date', today)
          .single(),
        supabase
          .from('pomodoro_sessions')
          .select('duration_minutes')
          .eq('user_id', user.id)
          .gte('completed_at', `${today}T00:00:00`)
      ]);

      const sessionMinutes = sessionRes.data?.total_minutes || 0;
      const pomodoroMinutes = pomodoroRes.data?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
      const totalFromDb = Math.max(sessionMinutes, pomodoroMinutes, sessionMinutes + pomodoroMinutes);

      if (totalFromDb > 0) {
        setTodayMinutes(totalFromDb);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
          date: today, 
          minutes: totalFromDb 
        }));
      }
    } catch {
      // No session for today yet, that's fine
    }
  }, [user]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // Update current session duration every second while tracking
  useEffect(() => {
    if (isTracking && sessionStartRef.current) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartRef.current!) / 1000);
        setCurrentSessionDuration(elapsed);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrentSessionDuration(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking]);

  const startSession = useCallback((type: 'notes' | 'quizzes' | 'flashcards' | 'pomodoro') => {
    sessionStartRef.current = Date.now();
    setCurrentSessionType(type);
    setIsTracking(true);
  }, []);

  const endSession = useCallback(async () => {
    if (!sessionStartRef.current || !user) {
      setIsTracking(false);
      setCurrentSessionType(null);
      return;
    }

    const elapsedMs = Date.now() - sessionStartRef.current;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    
    // Only count if at least 1 minute
    if (elapsedMinutes >= 1) {
      const today = new Date().toISOString().split('T')[0];
      const newTotal = todayMinutes + elapsedMinutes;
      
      setTodayMinutes(newTotal);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
        date: today, 
        minutes: newTotal 
      }));

      // Update or insert in database
      try {
        const { data: existing } = await supabase
          .from('study_sessions')
          .select('id, total_minutes, activities_count')
          .eq('user_id', user.id)
          .eq('session_date', today)
          .single();

        if (existing) {
          await supabase
            .from('study_sessions')
            .update({
              total_minutes: (existing.total_minutes || 0) + elapsedMinutes,
              activities_count: (existing.activities_count || 0) + 1,
              xp_earned: Math.floor(elapsedMinutes * 2), // 2 XP per minute
            })
            .eq('id', existing.id);
        } else {
          await supabase.from('study_sessions').insert({
            user_id: user.id,
            session_date: today,
            total_minutes: elapsedMinutes,
            activities_count: 1,
            xp_earned: Math.floor(elapsedMinutes * 2),
          });
        }
      } catch (error) {
        console.error('Failed to save study session:', error);
      }
    }

    sessionStartRef.current = null;
    setIsTracking(false);
    setCurrentSessionType(null);
  }, [user, todayMinutes]);

  const setDailyGoal = useCallback(async (minutes: number) => {
    setDailyGoalMinutes(minutes);
    localStorage.setItem(DAILY_GOAL_KEY, minutes.toString());
  }, []);

  const isGoalMet = todayMinutes >= dailyGoalMinutes;

  return {
    todayMinutes,
    dailyGoalMinutes,
    isGoalMet,
    startSession,
    endSession,
    isTracking,
    currentSessionType,
    currentSessionDuration,
    setDailyGoal,
    refreshStats,
  };
}
