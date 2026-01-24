import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Play, Pause, RotateCcw, Coffee, Brain, CheckCircle, 
  Lock, Shield, Settings, Minus, Plus 
} from 'lucide-react';
import { updateStreak } from '@/lib/streak';
import FocusModeOverlay from '@/components/focus/FocusModeOverlay';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface PomodoroTimerProps {
  courseId?: string;
  onSessionComplete?: () => void;
}

type SessionType = 'focus' | 'short_break' | 'long_break';

// Default durations
const DEFAULT_DURATIONS: Record<SessionType, number> = {
  focus: 25,
  short_break: 5,
  long_break: 15,
};

const DURATIONS_KEY = 'pomodoro_custom_durations';

const PomodoroTimer = ({ courseId, onSessionComplete }: PomodoroTimerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Load custom durations from localStorage
  const getStoredDurations = (): Record<SessionType, number> => {
    try {
      const stored = localStorage.getItem(DURATIONS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_DURATIONS;
  };

  const [durations, setDurations] = useState<Record<SessionType, number>>(getStoredDurations);
  const [sessionType, setSessionType] = useState<SessionType>('focus');
  const [timeLeft, setTimeLeft] = useState(durations.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [focusModeEnabled, setFocusModeEnabled] = useState(false);
  const [isFocusModeActive, setIsFocusModeActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update timeLeft when durations change
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(durations[sessionType] * 60);
    }
  }, [durations, sessionType, isRunning]);

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
        const durationMinutes = durations.focus;
        
        // Save completed focus session
        await supabase.from('pomodoro_sessions').insert({
          user_id: user.id,
          course_id: courseId || null,
          duration_minutes: durationMinutes,
          session_type: 'focus',
        });

        // Update streak and XP
        await updateStreak(user.id);

        // Award XP for session (1 XP per minute)
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_xp')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          const newXP = (profile.total_xp || 0) + durationMinutes;
          await supabase
            .from('profiles')
            .update({ total_xp: newXP })
            .eq('user_id', user.id);
        }

        setCompletedPomodoros((prev) => prev + 1);
        onSessionComplete?.();

        toast({
          title: 'Great work! 🎉',
          description: `+${durationMinutes} XP earned! Time for a break.`,
        });
      } catch (error) {
        console.error('Failed to save session:', error);
      }

      // Switch to break
      const nextBreak = (completedPomodoros + 1) % 4 === 0 ? 'long_break' : 'short_break';
      setSessionType(nextBreak);
      setTimeLeft(durations[nextBreak] * 60);
    } else {
      // Break complete, switch to focus
      toast({
        title: 'Break over! ☕',
        description: 'Ready to focus again?',
      });
      setSessionType('focus');
      setTimeLeft(durations.focus * 60);
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
    setTimeLeft(durations[sessionType] * 60);
    setIsFocusModeActive(false);
  };

  const switchSession = (type: SessionType) => {
    setIsRunning(false);
    setSessionType(type);
    setTimeLeft(durations[type] * 60);
    setIsFocusModeActive(false);
  };

  const handleEmergencyExit = useCallback(() => {
    setIsRunning(false);
    setIsFocusModeActive(false);
    setTimeLeft(durations[sessionType] * 60);
    toast({
      title: 'Focus Mode Ended',
      description: 'Session progress was not saved.',
      variant: 'destructive',
    });
  }, [durations, sessionType, toast]);

  // Deactivate focus mode when session ends or switches to break
  useEffect(() => {
    if (sessionType !== 'focus' || !isRunning) {
      if (isFocusModeActive && sessionType !== 'focus') {
        setIsFocusModeActive(false);
      }
    }
  }, [sessionType, isRunning, isFocusModeActive]);

  const updateDuration = (type: SessionType, change: number) => {
    setDurations(prev => {
      const newValue = Math.max(1, Math.min(120, prev[type] + change));
      const updated = { ...prev, [type]: newValue };
      localStorage.setItem(DURATIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((durations[sessionType] * 60 - timeLeft) / (durations[sessionType] * 60)) * 100;

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
        {/* Header with Settings */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-foreground">Pomodoro Timer</h3>
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Timer Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Focus Duration */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-primary" />
                      <span className="font-medium">Focus Duration</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{durations.focus} min</span>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateDuration('focus', -5)}
                      disabled={durations.focus <= 5}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-2xl font-bold w-16 text-center">{durations.focus}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateDuration('focus', 5)}
                      disabled={durations.focus >= 120}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Short Break Duration */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-emerald-500" />
                      <span className="font-medium">Short Break</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{durations.short_break} min</span>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateDuration('short_break', -1)}
                      disabled={durations.short_break <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-2xl font-bold w-16 text-center">{durations.short_break}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateDuration('short_break', 1)}
                      disabled={durations.short_break >= 30}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Long Break Duration */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">Long Break</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{durations.long_break} min</span>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateDuration('long_break', -5)}
                      disabled={durations.long_break <= 5}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-2xl font-bold w-16 text-center">{durations.long_break}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateDuration('long_break', 5)}
                      disabled={durations.long_break >= 60}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Preset Buttons */}
                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Quick Presets</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const preset = { focus: 25, short_break: 5, long_break: 15 };
                        setDurations(preset);
                        localStorage.setItem(DURATIONS_KEY, JSON.stringify(preset));
                      }}
                    >
                      Classic
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const preset = { focus: 50, short_break: 10, long_break: 30 };
                        setDurations(preset);
                        localStorage.setItem(DURATIONS_KEY, JSON.stringify(preset));
                      }}
                    >
                      Long
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const preset = { focus: 15, short_break: 3, long_break: 10 };
                        setDurations(preset);
                        localStorage.setItem(DURATIONS_KEY, JSON.stringify(preset));
                      }}
                    >
                      Short
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

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
              {type === 'focus' ? `${durations.focus}m` : type === 'short_break' ? `${durations.short_break}m` : `${durations.long_break}m`}
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
            disabled={timeLeft === durations[sessionType] * 60}
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
