import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layers, BookOpen, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudyStats {
  dueFlashcards: number;
  todaySessions: number;
  todayMinutes: number;
  totalQuizzes: number;
}

const StudyProgressWidget = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudyStats>({
    dueFlashcards: 0,
    todaySessions: 0,
    todayMinutes: 0,
    totalQuizzes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      // Get due flashcards
      const { data: flashcards } = await supabase
        .from('flashcards')
        .select('next_review')
        .eq('user_id', user?.id)
        .lte('next_review', now.toISOString());

      // Get today's pomodoro sessions
      const { data: sessions } = await supabase
        .from('pomodoro_sessions')
        .select('duration_minutes')
        .eq('user_id', user?.id)
        .eq('session_type', 'focus')
        .gte('completed_at', todayStart);

      // Get total quiz attempts
      const { count: quizCount } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      setStats({
        dueFlashcards: flashcards?.length || 0,
        todaySessions: sessions?.length || 0,
        todayMinutes: (sessions?.length || 0) * 25,
        totalQuizzes: quizCount || 0,
      });
    } catch (error) {
      console.error('Error fetching study stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 rounded-2xl bg-card border border-border animate-pulse h-40" />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 border border-border"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-foreground">Today's Study</h3>
        <Link to="/study">
          <Button variant="ghost" size="sm" className="text-xs">
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Due Flashcards */}
        <Link to="/flashcards">
          <div className="p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Due Cards</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.dueFlashcards}</p>
            {stats.dueFlashcards > 0 && (
              <p className="text-[10px] text-emerald-500 font-medium">Ready to review!</p>
            )}
          </div>
        </Link>

        {/* Focus Time */}
        <Link to="/focus">
          <div className="p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Focus Time</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.todayMinutes}m</p>
            <p className="text-[10px] text-muted-foreground">{stats.todaySessions} sessions</p>
          </div>
        </Link>

        {/* Quizzes */}
        <Link to="/quizzes" className="col-span-2">
          <div className="p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-medium text-foreground">Quizzes Completed</p>
                <p className="text-xs text-muted-foreground">{stats.totalQuizzes} total</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </Link>
      </div>
    </motion.div>
  );
};

export default StudyProgressWidget;
