import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const useFocusMode = () => {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const allowedPaths = ['/plan', '/focus'];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activateFocusMode = useCallback((durationSeconds: number) => {
    setIsActive(true);
    setTimeLeft(durationSeconds);
    toast({
      title: '🔒 Focus Mode Activated',
      description: 'Navigation is now blocked. Stay focused!',
    });
  }, [toast]);

  const deactivateFocusMode = useCallback(() => {
    setIsActive(false);
    setTimeLeft(0);
  }, []);

  const emergencyExit = useCallback(() => {
    deactivateFocusMode();
    toast({
      title: 'Focus Mode Ended',
      description: 'Session progress was not saved.',
      variant: 'destructive',
    });
  }, [deactivateFocusMode, toast]);

  // Block navigation when focus mode is active
  useEffect(() => {
    if (isActive) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'Focus mode is active. Are you sure you want to leave?';
        return e.returnValue;
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // Redirect back to plan page if user navigates away
      if (!allowedPaths.includes(location.pathname)) {
        navigate('/plan');
      }

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [isActive, location.pathname, navigate]);

  // Countdown timer
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            deactivateFocusMode();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isActive, timeLeft, deactivateFocusMode]);

  return {
    isActive,
    timeLeft,
    timeLeftFormatted: formatTime(timeLeft),
    activateFocusMode,
    deactivateFocusMode,
    emergencyExit,
  };
};
