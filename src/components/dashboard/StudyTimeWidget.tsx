import { motion } from 'framer-motion';
import { Clock, Target, CheckCircle, Lock, Unlock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useStudyTimeTracker } from '@/hooks/useStudyTimeTracker';

const StudyTimeWidget = () => {
  const { todayMinutes, dailyGoalMinutes, isGoalMet } = useStudyTimeTracker();
  
  const progressPercent = Math.min((todayMinutes / dailyGoalMinutes) * 100, 100);
  const remainingMinutes = Math.max(dailyGoalMinutes - todayMinutes, 0);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-2xl border ${
        isGoalMet 
          ? 'bg-emerald-500/10 border-emerald-500/30' 
          : 'bg-card border-border'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isGoalMet ? 'bg-emerald-500/20' : 'bg-primary/10'
          }`}>
            {isGoalMet ? (
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            ) : (
              <Clock className="w-4 h-4 text-primary" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">Daily Study Time</h3>
            <p className="text-xs text-muted-foreground">
              {isGoalMet ? 'Goal achieved! 🎉' : `${formatTime(remainingMinutes)} to go`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-foreground">{formatTime(todayMinutes)}</span>
          <span className="text-xs text-muted-foreground"> / {formatTime(dailyGoalMinutes)}</span>
        </div>
      </div>

      <Progress 
        value={progressPercent} 
        className={`h-2 ${isGoalMet ? '[&>div]:bg-emerald-500' : ''}`}
      />

      {/* App access status */}
      <div className="mt-3 flex items-center gap-2 text-xs">
        {isGoalMet ? (
          <>
            <Unlock className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400">Apps unlocked for today</span>
          </>
        ) : (
          <>
            <Lock className="w-3 h-3 text-amber-500" />
            <span className="text-amber-600 dark:text-amber-400">Complete goal to unlock apps</span>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default StudyTimeWidget;
