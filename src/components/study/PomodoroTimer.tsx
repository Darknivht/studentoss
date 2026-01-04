import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Play, Pause, RotateCcw, Coffee, Brain, CheckCircle, Lock, Shield } from 'lucide-react';
import { updateStreak } from '@/lib/streak';
import FocusModeOverlay from '@/components/focus/FocusModeOverlay';

interface PomodoroTimerProps {
  courseId?: string;
  onSessionComplete?: () => void;
}

type SessionType = 'focus' | 'short_break' | 'long_break';

const DURATIONS: Record<SessionType, number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

const PomodoroTimer = ({ courseId, onSessionComplete }: PomodoroTimerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessionType, setSessionType] = useState<SessionType>('focus');
  const [timeLeft, setTimeLeft] = useState(DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [focusModeEnabled, setFocusModeEnabled] = useState(false);
  const [isFocusModeActive, setIsFocusModeActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  const handleSessionComplete = async () => {
    setIsRunning(false);

    if (sessionType === 'focus' && user) {
      try {
        // Save completed focus session
        await supabase.from('pomodoro_sessions').insert({
          user_id: user.id,
          course_id: courseId || null,
          duration_minutes: 25,
          session_type: 'focus',
        });

        // Update streak and XP
        await updateStreak(user.id);

        // Award XP for session
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_xp')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          const newXP = (profile.total_xp || 0) + 25; // 25 XP per session
          await supabase
            .from('profiles')
            .update({ total_xp: newXP })
            .eq('user_id', user.id);
        }

        setCompletedPomodoros((prev) => prev + 1);
        onSessionComplete?.();

        toast({
          title: 'Great work! 🎉',
          description: '+25 XP earned! Time for a break.',
        });
      } catch (error) {
        console.error('Failed to save session:', error);
      }

      // Switch to break
      const nextBreak = (completedPomodoros + 1) % 4 === 0 ? 'long_break' : 'short_break';
      setSessionType(nextBreak);
      setTimeLeft(DURATIONS[nextBreak]);
    } else {
      // Break complete, switch to focus
      toast({
        title: 'Break over! ☕',
        description: 'Ready to focus again?',
      });
      setSessionType('focus');
      setTimeLeft(DURATIONS.focus);
    }
  };

  const toggleTimer = () => {
    const newIsRunning = !isRunning;
    setIsRunning(newIsRunning);

    // Activate focus mode when starting a focus session
    if (newIsRunning && sessionType === 'focus' && focusModeEnabled) {
      setIsFocusModeActive(true);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(DURATIONS[sessionType]);
    setIsFocusModeActive(false);
  };

  const switchSession = (type: SessionType) => {
    setIsRunning(false);
    setSessionType(type);
    setTimeLeft(DURATIONS[type]);
    setIsFocusModeActive(false);
  };

  const handleEmergencyExit = useCallback(() => {
    setIsRunning(false);
    setIsFocusModeActive(false);
    setTimeLeft(DURATIONS[sessionType]);
    toast({
      title: 'Focus Mode Ended',
      description: 'Session progress was not saved.',
      variant: 'destructive',
    });
  }, [sessionType, toast]);

  // Deactivate focus mode when session ends or switches to break
  useEffect(() => {
    if (sessionType !== 'focus' || !isRunning) {
      if (isFocusModeActive && sessionType !== 'focus') {
        setIsFocusModeActive(false);
      }
    }
  }, [sessionType, isRunning, isFocusModeActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((DURATIONS[sessionType] - timeLeft) / DURATIONS[sessionType]) * 100;

  const getSessionColor = () => {
    switch (sessionType) {
      case 'focus': return 'from-primary to-accent';
      case 'short_break': return 'from-emerald-500 to-teal-500';
      case 'long_break': return 'from-blue-500 to-indigo-500';
    }
  };

  return (
    <>
      <FocusModeOverlay
        isActive={isFocusModeActive}
        timeLeft={formatTime(timeLeft)}
        onEmergencyExit={handleEmergencyExit}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl bg-card border border-border shadow-lg"
      >
        {/* Session Type Tabs */}
        <div className="flex gap-2 mb-6">
          {(['focus', 'short_break', 'long_break'] as const).map((type) => (
            <button
              key={type}
              onClick={() => switchSession(type)}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${sessionType === type
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
            >
              {type === 'focus' && <Brain className="w-4 h-4 inline mr-1" />}
              {type === 'short_break' && <Coffee className="w-4 h-4 inline mr-1" />}
              {type === 'long_break' && <Coffee className="w-4 h-4 inline mr-1" />}
              {type === 'focus' ? 'Focus' : type === 'short_break' ? 'Short' : 'Long'}
            </button>
          ))}
        </div>

        {/* Timer Circle */}
        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={`bg-gradient-to-r ${getSessionColor()}`}
              style={{ stroke: 'url(#gradient)' }}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: progress / 100 }}
              transition={{ duration: 0.5 }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--accent))" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-display font-bold text-foreground">
              {formatTime(timeLeft)}
            </span>
            <span className="text-sm text-muted-foreground capitalize">
              {sessionType.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={resetTimer}
            className="rounded-full w-12 h-12"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
          <Button
            onClick={toggleTimer}
            className={`rounded-full w-16 h-16 gradient-primary text-primary-foreground`}
          >
            {isRunning ? (
              <Pause className="w-7 h-7" />
            ) : (
              <Play className="w-7 h-7 ml-1" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleSessionComplete}
            className="rounded-full w-12 h-12"
            disabled={timeLeft === DURATIONS[sessionType]}
          >
            <CheckCircle className="w-5 h-5" />
          </Button>
        </div>

        {/* Completed Sessions */}
        <div className="mt-6 flex justify-center gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${i < completedPomodoros % 4
                ? 'bg-primary'
                : 'bg-muted'
                }`}
            />
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          {completedPomodoros} sessions completed today
        </p>

        {/* Focus Mode Toggle */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Focus Mode</p>
                <p className="text-xs text-muted-foreground">
                  Dims screen & blocks navigation
                </p>
              </div>
            </div>
            <Switch
              checked={focusModeEnabled}
              onCheckedChange={setFocusModeEnabled}
            />
          </div>
          {focusModeEnabled && (
            <p className="text-xs text-primary mt-2 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Focus mode will activate when you start
            </p>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default PomodoroTimer;
