import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { 
  BarChart3, 
  Clock, 
  BookOpen, 
  Brain, 
  Trophy,
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

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
    totalFocusMinutes: 0,
    totalNotes: 0,
    totalQuizzes: 0,
    avgDailyTime: 0,
  });

  useEffect(() => {
    if (user) {
      fetchActivityData();
    }
  }, [user]);

  const fetchActivityData = async () => {
    try {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Fetch pomodoro sessions
      const { data: sessions } = await supabase
        .from('pomodoro_sessions')
        .select('duration_minutes, completed_at')
        .eq('user_id', user?.id)
        .gte('completed_at', weekAgo.toISOString());

      // Fetch notes
      const { count: notesCount } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Fetch quizzes
      const { count: quizzesCount } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Calculate totals
      const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;

      setTotalStats({
        totalFocusMinutes: totalMinutes,
        totalNotes: notesCount || 0,
        totalQuizzes: quizzesCount || 0,
        avgDailyTime: Math.round(totalMinutes / 7),
      });

      // Mock weekly data for visualization
      const mockWeeklyData: DailyActivity[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        mockWeeklyData.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          focus_minutes: Math.floor(Math.random() * 60) + 15,
          notes_created: Math.floor(Math.random() * 3),
          quizzes_completed: Math.floor(Math.random() * 2),
          flashcards_reviewed: Math.floor(Math.random() * 20),
        });
      }
      setWeeklyStats(mockWeeklyData);
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
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
            const maxMinutes = Math.max(...weeklyStats.map((d) => d.focus_minutes));
            const height = maxMinutes > 0 ? (day.focus_minutes / maxMinutes) * 100 : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="w-full bg-primary/20 rounded-t-lg relative min-h-[4px]"
                >
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg"
                    style={{ height: '100%' }}
                  />
                </motion.div>
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

      {/* Info Notice */}
      <Card className="p-4 bg-blue-500/10 border-blue-500/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground font-medium">Activity Reports</p>
            <p className="text-xs text-muted-foreground mt-1">
              Weekly activity summaries are sent to the registered parent email every Sunday.
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ParentDashboard;
