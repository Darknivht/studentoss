import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();

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
      
      // Check deadlines on mount and every hour
      checkUpcomingDeadlines();
      const interval = setInterval(checkUpcomingDeadlines, 60 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [user, requestPermission, checkUpcomingDeadlines]);

  return {
    requestPermission,
    sendNotification,
    checkUpcomingDeadlines,
    scheduleStudyReminder,
    isSupported: 'Notification' in window,
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  };
};
