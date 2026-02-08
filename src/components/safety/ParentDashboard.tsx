import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { BarChart3, Clock, BookOpen, Brain, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

interface DailyActivity {
  date: string;
  focus_minutes: number;
  notes_created: number;
  quizzes_completed: number;
  flashcards_reviewed: number;
}

const ParentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState<DailyActivity[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalFocusMinutes: 0, totalNotes: 0, totalQuizzes: 0, avgDailyTime: 0,
  });

  useEffect(() => {
    if (user) fetchActivityData();
  }, [user]);

  const fetchActivityData = async () => {
    try {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekAgoStr = weekAgo.toISOString();

      // Fetch real data in parallel
      const [sessionsRes, notesRes, quizzesRes, weekNotesRes, weekQuizzesRes, flashcardsRes] = await Promise.all([
        supabase.from('pomodoro_sessions').select('duration_minutes, completed_at').eq('user_id', user?.id).gte('completed_at', weekAgoStr),
        supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', user?.id),
        supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }).eq('user_id', user?.id),
        supabase.from('notes').select('created_at').eq('user_id', user?.id).gte('created_at', weekAgoStr),
        supabase.from('quiz_attempts').select('completed_at').eq('user_id', user?.id).gte('completed_at', weekAgoStr),
        supabase.from('flashcards').select('updated_at, repetitions').eq('user_id', user?.id).gte('updated_at', weekAgoStr).gt('repetitions', 0),
      ]);

      const sessions = sessionsRes.data || [];
      const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

      setTotalStats({
        totalFocusMinutes: totalMinutes,
        totalNotes: notesRes.count || 0,
        totalQuizzes: quizzesRes.count || 0,
        avgDailyTime: Math.round(totalMinutes / 7),
      });

      // Build real daily data for the last 7 days
      const dailyData: DailyActivity[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });

        const dayFocus = sessions
          .filter(s => s.completed_at?.startsWith(dateStr))
          .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

        const dayNotes = (weekNotesRes.data || []).filter(n => n.created_at?.startsWith(dateStr)).length;
        const dayQuizzes = (weekQuizzesRes.data || []).filter(q => q.completed_at?.startsWith(dateStr)).length;
        const dayFlashcards = (flashcardsRes.data || []).filter(f => f.updated_at?.startsWith(dateStr)).length;

        dailyData.push({
          date: dayLabel,
          focus_minutes: dayFocus,
          notes_created: dayNotes,
          quizzes_completed: dayQuizzes,
          flashcards_reviewed: dayFlashcards,
        });
      }
      setWeeklyStats(dailyData);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {Math.floor(totalStats.totalFocusMinutes / 60)}h {totalStats.totalFocusMinutes % 60}m
              </p>
              <p className="text-xs text-muted-foreground">Total Focus Time</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalStats.totalNotes}</p>
              <p className="text-xs text-muted-foreground">Notes Created</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalStats.totalQuizzes}</p>
              <p className="text-xs text-muted-foreground">Quizzes Completed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalStats.avgDailyTime}m</p>
              <p className="text-xs text-muted-foreground">Avg Daily Study</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Weekly Activity Chart */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Weekly Activity</h3>
        </div>
        <div className="flex items-end justify-between gap-2 h-32">
          {weeklyStats.map((day, index) => {
            const maxMinutes = Math.max(...weeklyStats.map((d) => d.focus_minutes), 1);
            const height = (day.focus_minutes / maxMinutes) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="w-full bg-primary rounded-t-lg min-h-[4px]"
                />
                <span className="text-xs text-muted-foreground">{day.date}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Activity Details */}
      <Card className="p-4 bg-muted/30 border-border">
        <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          This Week's Breakdown
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Focus sessions</span>
            <span className="font-medium text-foreground">
              {weeklyStats.reduce((sum, d) => sum + Math.floor(d.focus_minutes / 25), 0)} sessions
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Notes created</span>
            <span className="font-medium text-foreground">
              {weeklyStats.reduce((sum, d) => sum + d.notes_created, 0)} notes
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Quizzes completed</span>
            <span className="font-medium text-foreground">
              {weeklyStats.reduce((sum, d) => sum + d.quizzes_completed, 0)} quizzes
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Flashcards reviewed</span>
            <span className="font-medium text-foreground">
              {weeklyStats.reduce((sum, d) => sum + d.flashcards_reviewed, 0)} cards
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-blue-500/10 border-blue-500/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground font-medium">Real Activity Data</p>
            <p className="text-xs text-muted-foreground mt-1">
              This dashboard shows actual study activity from the past 7 days.
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ParentDashboard;
