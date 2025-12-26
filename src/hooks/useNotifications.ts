import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const streakCheckRef = useRef<boolean>(false);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    }
  }, []);

  const checkStreakExpiration = useCallback(async () => {
    if (!user || streakCheckRef.current) return;
    streakCheckRef.current = true;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('last_study_date, current_streak')
        .eq('user_id', user.id)
        .single();

      if (profile && profile.last_study_date && profile.current_streak > 0) {
        const lastStudy = new Date(profile.last_study_date);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastStudyDay = new Date(lastStudy.getFullYear(), lastStudy.getMonth(), lastStudy.getDate());
        
        const daysDiff = Math.floor((today.getTime() - lastStudyDay.getTime()) / (1000 * 60 * 60 * 24));

        // If they haven't studied today, check hours remaining
        if (daysDiff === 0) {
          // They studied today, check if it's getting late
          const hoursLeft = 24 - now.getHours();
          if (hoursLeft <= 2) {
            // Less than 2 hours until midnight - warn them
            sendNotification('🔥 Keep Your Streak Alive!', {
              body: `Only ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} left today! Study now to maintain your ${profile.current_streak}-day streak.`,
              tag: 'streak-warning',
            });

            toast({
              title: '🔥 Streak Alert!',
              description: `Only ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} left to maintain your ${profile.current_streak}-day streak!`,
            });
          }
        } else if (daysDiff === 1) {
          // They didn't study yesterday - streak is at risk today!
          const hoursLeft = 24 - now.getHours();
          
          sendNotification('⚠️ Your Streak Expires Today!', {
            body: `You have ${hoursLeft} hours to study and save your ${profile.current_streak}-day streak!`,
            tag: 'streak-expiring',
          });

          toast({
            title: '⚠️ Streak Expires Today!',
            description: `Study now to save your ${profile.current_streak}-day streak!`,
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error checking streak:', error);
    } finally {
      streakCheckRef.current = false;
    }
  }, [user, sendNotification, toast]);

  const checkUpcomingDeadlines = useCallback(async () => {
    if (!user) return;

    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { data: goals } = await supabase
        .from('study_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .lte('due_date', in24Hours.toISOString())
        .gte('due_date', now.toISOString())
        .eq('reminder_enabled', true);

      if (goals && goals.length > 0) {
        goals.forEach((goal) => {
          const dueDate = new Date(goal.due_date);
          const hoursUntil = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
          
          sendNotification(`📚 Deadline Reminder: ${goal.title}`, {
            body: `Due in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}!`,
            tag: goal.id,
          });

          toast({
            title: `⏰ Upcoming: ${goal.title}`,
            description: `Due in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`,
          });
        });
      }
    } catch (error) {
      console.error('Error checking deadlines:', error);
    }
  }, [user, sendNotification, toast]);

  const scheduleStudyReminder = useCallback((minutesFromNow: number, message: string) => {
    setTimeout(() => {
      sendNotification('📖 Study Reminder', {
        body: message,
        tag: 'study-reminder',
      });
      toast({
        title: '📖 Study Reminder',
        description: message,
      });
    }, minutesFromNow * 60 * 1000);
  }, [sendNotification, toast]);

  useEffect(() => {
    if (user) {
      requestPermission();
      
      // Check deadlines and streak on mount
      checkUpcomingDeadlines();
      checkStreakExpiration();
      
      // Check deadlines every hour, streak every 2 hours
      const deadlineInterval = setInterval(checkUpcomingDeadlines, 60 * 60 * 1000);
      const streakInterval = setInterval(checkStreakExpiration, 2 * 60 * 60 * 1000);
      
      return () => {
        clearInterval(deadlineInterval);
        clearInterval(streakInterval);
      };
    }
  }, [user, requestPermission, checkUpcomingDeadlines, checkStreakExpiration]);

  return {
    requestPermission,
    sendNotification,
    checkUpcomingDeadlines,
    checkStreakExpiration,
    scheduleStudyReminder,
    isSupported: 'Notification' in window,
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  };
};
