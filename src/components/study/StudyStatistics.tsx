import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Zap, BookOpen, Brain, Target, TrendingUp } from 'lucide-react';

interface WeeklyStats {
  total_focus_minutes: number;
  total_xp: number;
  flashcards_reviewed: number;
  quizzes_completed: number;
  notes_created: number;
}

const StudyStatistics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<WeeklyStats>({
    total_focus_minutes: 0,
    total_xp: 0,
    flashcards_reviewed: 0,
    quizzes_completed: 0,
    notes_created: 0,
  });
  const [profileXP, setProfileXP] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      // Fetch weekly XP stats (aggregate all weeks)
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('weekly_xp')
        .select('*')
        .eq('user_id', user?.id);

      if (weeklyError) throw weeklyError;

      // Aggregate all weekly data
      const aggregated = (weeklyData || []).reduce(
        (acc, week) => ({
          total_focus_minutes: acc.total_focus_minutes + (week.focus_minutes || 0),
          total_xp: acc.total_xp + (week.xp_earned || 0),
          flashcards_reviewed: acc.flashcards_reviewed + (week.flashcards_reviewed || 0),
          quizzes_completed: acc.quizzes_completed + (week.quizzes_completed || 0),
          notes_created: acc.notes_created + (week.notes_created || 0),
        }),
        {
          total_focus_minutes: 0,
          total_xp: 0,
          flashcards_reviewed: 0,
          quizzes_completed: 0,
          notes_created: 0,
        }
      );

      setStats(aggregated);

      // Fetch total XP from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_xp')
        .eq('user_id', user?.id)
        .single();

      setProfileXP(profile?.total_xp || 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const activities = [
    {
      icon: Brain,
      label: 'Flashcards',
      value: stats.flashcards_reviewed,
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'bg-purple-500/10',
      iconColor: 'text-purple-500',
    },
    {
      icon: Target,
      label: 'Quizzes',
      value: stats.quizzes_completed,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
    },
    {
      icon: BookOpen,
      label: 'Notes Created',
      value: stats.notes_created,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
    },
  ];

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatTime(stats.total_focus_minutes)}</p>
          <p className="text-xs text-muted-foreground">Total Study Time</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{profileXP.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total XP Earned</p>
        </div>
      </div>

      {/* Activity Breakdown */}
      <div className="p-4 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Activity Breakdown</p>
        </div>

        <div className="space-y-3">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${activity.bgColor} flex items-center justify-center`}>
                  <activity.icon className={`w-5 h-5 ${activity.iconColor}`} />
                </div>
                <span className="text-sm text-foreground">{activity.label}</span>
              </div>
              <span className="text-lg font-bold text-foreground">{activity.value}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Weekly XP Progress */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 border border-border">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground">Weekly XP</p>
          <span className="text-xs text-muted-foreground">{stats.total_xp} XP this period</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((stats.total_xp / 500) * 100, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Goal: 500 XP</p>
      </div>
    </motion.div>
  );
};

export default StudyStatistics;
