import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, TrendingDown, TrendingUp, Target, Brain,
  BookOpen, CheckCircle
} from 'lucide-react';

interface CourseWeakness {
  courseId: string;
  courseName: string;
  courseColor: string;
  quizAverage: number;
  totalQuizzes: number;
  notesCount: number;
  flashcardsCount: number;
  focusMinutes: number;
  overallScore: number;
  recommendations: string[];
}

const WeaknessDetector = () => {
  const { user } = useAuth();
  const [weaknesses, setWeaknesses] = useState<CourseWeakness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      analyzeWeaknesses();
    }
  }, [user]);

  const analyzeWeaknesses = async () => {
    if (!user) return;

    try {
      // Fetch courses
      const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id);

      if (!courses || courses.length === 0) {
        setLoading(false);
        return;
      }

      const weaknessData: CourseWeakness[] = [];

      for (const course of courses) {
        // Fetch quiz attempts for this course
        const { data: quizzes } = await supabase
          .from('quiz_attempts')
          .select('score, total_questions')
          .eq('user_id', user.id)
          .eq('course_id', course.id);

        // Fetch notes count
        const { count: notesCount } = await supabase
          .from('notes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('course_id', course.id);

        // Fetch flashcards count
        const { count: flashcardsCount } = await supabase
          .from('flashcards')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('course_id', course.id);

        // Fetch focus time
        const { data: pomodoro } = await supabase
          .from('pomodoro_sessions')
          .select('duration_minutes')
          .eq('user_id', user.id)
          .eq('course_id', course.id);

        const focusMinutes = pomodoro?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0;

        // Calculate quiz average
        let quizAverage = 0;
        if (quizzes && quizzes.length > 0) {
          const totalScore = quizzes.reduce((sum, q) => sum + (q.score / q.total_questions) * 100, 0);
          quizAverage = totalScore / quizzes.length;
        }

        // Calculate overall score (weighted average)
        // 40% quiz performance, 20% notes, 20% flashcards, 20% focus time
        const notesScore = Math.min((notesCount || 0) / 10 * 100, 100);
        const flashcardsScore = Math.min((flashcardsCount || 0) / 20 * 100, 100);
        const focusScore = Math.min(focusMinutes / 120 * 100, 100);
        
        const overallScore = quizzes && quizzes.length > 0
          ? quizAverage * 0.4 + notesScore * 0.2 + flashcardsScore * 0.2 + focusScore * 0.2
          : notesScore * 0.33 + flashcardsScore * 0.33 + focusScore * 0.33;

        // Generate recommendations
        const recommendations: string[] = [];
        if (quizAverage < 70 && quizzes && quizzes.length > 0) {
          recommendations.push('Review concepts from failed quiz questions');
        }
        if ((notesCount || 0) < 5) {
          recommendations.push('Create more notes to reinforce learning');
        }
        if ((flashcardsCount || 0) < 10) {
          recommendations.push('Generate flashcards for key concepts');
        }
        if (focusMinutes < 60) {
          recommendations.push('Dedicate more focused study time');
        }
        if (!quizzes || quizzes.length === 0) {
          recommendations.push('Take practice quizzes to test knowledge');
        }

        weaknessData.push({
          courseId: course.id,
          courseName: course.name,
          courseColor: course.color || '#6366f1',
          quizAverage,
          totalQuizzes: quizzes?.length || 0,
          notesCount: notesCount || 0,
          flashcardsCount: flashcardsCount || 0,
          focusMinutes,
          overallScore,
          recommendations,
        });
      }

      // Sort by overall score (weakest first)
      weaknessData.sort((a, b) => a.overallScore - b.overallScore);
      setWeaknesses(weaknessData);
    } catch (error) {
      console.error('Failed to analyze weaknesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (score >= 60) return <Target className="w-4 h-4 text-yellow-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (weaknesses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Add courses and study to see weakness analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-yellow-500" />
        <h3 className="font-display font-semibold">Weakness Analysis</h3>
      </div>

      {weaknesses.map((course, idx) => (
        <motion.div
          key={course.courseId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className={`p-4 rounded-xl border ${
            course.overallScore < 50 
              ? 'bg-red-500/5 border-red-500/30' 
              : 'bg-card border-border'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: course.courseColor }}
              />
              <span className="font-medium">{course.courseName}</span>
            </div>
            <div className="flex items-center gap-2">
              {getScoreIcon(course.overallScore)}
              <span className={`font-bold ${getScoreColor(course.overallScore)}`}>
                {Math.round(course.overallScore)}%
              </span>
            </div>
          </div>

          <Progress 
            value={course.overallScore} 
            className="h-2 mb-3"
          />

          <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
            <div>
              <p className="text-muted-foreground">Quiz Avg</p>
              <p className={`font-bold ${getScoreColor(course.quizAverage)}`}>
                {course.totalQuizzes > 0 ? `${Math.round(course.quizAverage)}%` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Notes</p>
              <p className="font-bold">{course.notesCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cards</p>
              <p className="font-bold">{course.flashcardsCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Focus</p>
              <p className="font-bold">{course.focusMinutes}m</p>
            </div>
          </div>

          {course.recommendations.length > 0 && (
            <div className="space-y-1">
              {course.recommendations.slice(0, 2).map((rec, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <CheckCircle className="w-3 h-3 text-primary" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default WeaknessDetector;
