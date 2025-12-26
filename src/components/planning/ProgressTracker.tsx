import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { 
  Target, BookOpen, Brain, Clock, Flame, TrendingUp,
  CheckCircle, Star
} from 'lucide-react';

interface CourseProgress {
  id: string;
  name: string;
  color: string;
  notesCount: number;
  flashcardsCount: number;
  quizzesCompleted: number;
  focusMinutes: number;
  overallProgress: number;
}

interface OverallStats {
  totalNotes: number;
  totalFlashcards: number;
  totalQuizzes: number;
  totalFocusHours: number;
  currentStreak: number;
  totalXP: number;
}

const ProgressTracker = () => {
  const { user } = useAuth();
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user]);

  const fetchProgress = async () => {
    if (!user) return;

    try {
      // Fetch overall stats
      const [
        { count: totalNotes },
        { count: totalFlashcards },
        { count: totalQuizzes },
        { data: pomodoroData },
        { data: profile },
        { data: courses },
      ] = await Promise.all([
        supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('flashcards').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('pomodoro_sessions').select('duration_minutes').eq('user_id', user.id),
        supabase.from('profiles').select('current_streak, total_xp').eq('user_id', user.id).single(),
        supabase.from('courses').select('*').eq('user_id', user.id),
      ]);

      const totalFocusMinutes = pomodoroData?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0;

      setOverallStats({
        totalNotes: totalNotes || 0,
        totalFlashcards: totalFlashcards || 0,
        totalQuizzes: totalQuizzes || 0,
        totalFocusHours: Math.round(totalFocusMinutes / 60 * 10) / 10,
        currentStreak: profile?.current_streak || 0,
        totalXP: profile?.total_xp || 0,
      });

      // Fetch per-course progress
      if (courses) {
        const courseData: CourseProgress[] = [];

        for (const course of courses) {
          const [
            { count: notesCount },
            { count: flashcardsCount },
            { count: quizzesCount },
            { data: coursePomodoroData },
          ] = await Promise.all([
            supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('course_id', course.id),
            supabase.from('flashcards').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('course_id', course.id),
            supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('course_id', course.id),
            supabase.from('pomodoro_sessions').select('duration_minutes').eq('user_id', user.id).eq('course_id', course.id),
          ]);

          const focusMinutes = coursePomodoroData?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0;

          // Calculate overall progress (simple average of different metrics)
          const notesProgress = Math.min((notesCount || 0) / 10 * 100, 100);
          const flashcardsProgress = Math.min((flashcardsCount || 0) / 20 * 100, 100);
          const quizzesProgress = Math.min((quizzesCount || 0) / 5 * 100, 100);
          const focusProgress = Math.min(focusMinutes / 120 * 100, 100);

          const overallProgress = (notesProgress + flashcardsProgress + quizzesProgress + focusProgress) / 4;

          courseData.push({
            id: course.id,
            name: course.name,
            color: course.color || '#6366f1',
            notesCount: notesCount || 0,
            flashcardsCount: flashcardsCount || 0,
            quizzesCompleted: quizzesCount || 0,
            focusMinutes,
            overallProgress,
          });
        }

        setCourseProgress(courseData);
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      {overallStats && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={BookOpen}
            label="Notes"
            value={overallStats.totalNotes}
            color="#8B5CF6"
          />
          <StatCard
            icon={Brain}
            label="Cards"
            value={overallStats.totalFlashcards}
            color="#F97316"
          />
          <StatCard
            icon={Target}
            label="Quizzes"
            value={overallStats.totalQuizzes}
            color="#10B981"
          />
          <StatCard
            icon={Clock}
            label="Focus"
            value={`${overallStats.totalFocusHours}h`}
            color="#0EA5E9"
          />
          <StatCard
            icon={Flame}
            label="Streak"
            value={`${overallStats.currentStreak}d`}
            color="#EF4444"
          />
          <StatCard
            icon={Star}
            label="XP"
            value={overallStats.totalXP}
            color="#F59E0B"
          />
        </div>
      )}

      {/* Course Progress */}
      <div className="space-y-3">
        <h3 className="font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Course Progress
        </h3>

        {courseProgress.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Add courses to track progress</p>
          </div>
        ) : (
          courseProgress.map((course, idx) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 rounded-xl bg-card border border-border"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: course.color }}
                  />
                  <span className="font-medium">{course.name}</span>
                </div>
                <span className="text-sm font-bold text-primary">
                  {Math.round(course.overallProgress)}%
                </span>
              </div>

              <Progress value={course.overallProgress} className="h-2 mb-3" />

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <p className="text-muted-foreground">Notes</p>
                  <p className="font-bold">{course.notesCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cards</p>
                  <p className="font-bold">{course.flashcardsCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quizzes</p>
                  <p className="font-bold">{course.quizzesCompleted}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Focus</p>
                  <p className="font-bold">{course.focusMinutes}m</p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: typeof BookOpen;
  label: string;
  value: number | string;
  color: string;
}

const StatCard = ({ icon: Icon, label, value, color }: StatCardProps) => (
  <div className="p-3 rounded-xl bg-card border border-border text-center">
    <div 
      className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center mb-1"
      style={{ backgroundColor: `${color}20` }}
    >
      <Icon className="w-4 h-4" style={{ color }} />
    </div>
    <p className="font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export default ProgressTracker;
