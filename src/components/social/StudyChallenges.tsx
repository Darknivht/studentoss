import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Swords, Target, BookOpen, Brain, Clock, Flame, 
  CheckCircle, Gift, Star
} from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: typeof Swords;
  target: number;
  current: number;
  xpReward: number;
  type: 'daily' | 'weekly';
  completed: boolean;
}

const StudyChallenges = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChallengeProgress();
    }
  }, [user]);

  const fetchChallengeProgress = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const weekStart = getWeekStart();

      // Fetch today's stats
      const [notesResult, quizzesResult, flashcardsResult, pomodoroResult] = await Promise.all([
        supabase
          .from('notes')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .gte('created_at', today),
        supabase
          .from('quiz_attempts')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .gte('completed_at', today),
        supabase
          .from('flashcards')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .gte('updated_at', today),
        supabase
          .from('pomodoro_sessions')
          .select('duration_minutes')
          .eq('user_id', user.id)
          .gte('completed_at', today),
      ]);

      const notesToday = notesResult.count || 0;
      const quizzesToday = quizzesResult.count || 0;
      const flashcardsToday = flashcardsResult.count || 0;
      const focusMinutesToday = pomodoroResult.data?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0;

      // Fetch weekly stats
      const [weeklyNotes, weeklyQuizzes, weeklyPomodoro] = await Promise.all([
        supabase
          .from('notes')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .gte('created_at', weekStart),
        supabase
          .from('quiz_attempts')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .gte('completed_at', weekStart),
        supabase
          .from('pomodoro_sessions')
          .select('duration_minutes')
          .eq('user_id', user.id)
          .gte('completed_at', weekStart),
      ]);

      const weeklyFocusMinutes = weeklyPomodoro.data?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0;

      const dailyChallenges: Challenge[] = [
        {
          id: 'daily_notes',
          title: 'Note Taker',
          description: 'Create 2 notes today',
          icon: BookOpen,
          target: 2,
          current: notesToday,
          xpReward: 50,
          type: 'daily',
          completed: notesToday >= 2,
        },
        {
          id: 'daily_quiz',
          title: 'Quiz Master',
          description: 'Complete 3 quizzes today',
          icon: Brain,
          target: 3,
          current: quizzesToday,
          xpReward: 75,
          type: 'daily',
          completed: quizzesToday >= 3,
        },
        {
          id: 'daily_flashcards',
          title: 'Card Shark',
          description: 'Review 10 flashcards today',
          icon: Target,
          target: 10,
          current: flashcardsToday,
          xpReward: 50,
          type: 'daily',
          completed: flashcardsToday >= 10,
        },
        {
          id: 'daily_focus',
          title: 'Deep Focus',
          description: 'Complete 50 minutes of focus time',
          icon: Clock,
          target: 50,
          current: focusMinutesToday,
          xpReward: 100,
          type: 'daily',
          completed: focusMinutesToday >= 50,
        },
      ];

      const weeklyChallenges: Challenge[] = [
        {
          id: 'weekly_notes',
          title: 'Weekly Scholar',
          description: 'Create 10 notes this week',
          icon: BookOpen,
          target: 10,
          current: weeklyNotes.count || 0,
          xpReward: 200,
          type: 'weekly',
          completed: (weeklyNotes.count || 0) >= 10,
        },
        {
          id: 'weekly_quizzes',
          title: 'Quiz Champion',
          description: 'Complete 15 quizzes this week',
          icon: Brain,
          target: 15,
          current: weeklyQuizzes.count || 0,
          xpReward: 300,
          type: 'weekly',
          completed: (weeklyQuizzes.count || 0) >= 15,
        },
        {
          id: 'weekly_focus',
          title: 'Focus Legend',
          description: 'Study for 5 hours this week',
          icon: Flame,
          target: 300,
          current: weeklyFocusMinutes,
          xpReward: 500,
          type: 'weekly',
          completed: weeklyFocusMinutes >= 300,
        },
      ];

      setChallenges([...dailyChallenges, ...weeklyChallenges]);
    } catch (error) {
      console.error('Failed to fetch challenge progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString();
  };

  const claimReward = async (challenge: Challenge) => {
    if (!user || !challenge.completed) return;

    try {
      // Add XP to profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_xp')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ total_xp: (profile.total_xp || 0) + challenge.xpReward })
          .eq('user_id', user.id);

        toast({
          title: 'Reward claimed! 🎉',
          description: `+${challenge.xpReward} XP earned!`,
        });

        // Refresh challenges
        fetchChallengeProgress();
      }
    } catch (error) {
      console.error('Failed to claim reward:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const dailyChallenges = challenges.filter(c => c.type === 'daily');
  const weeklyChallenges = challenges.filter(c => c.type === 'weekly');

  return (
    <div className="space-y-6">
      {/* Daily Challenges */}
      <div className="space-y-3">
        <h3 className="font-medium flex items-center gap-2">
          <Swords className="w-4 h-4 text-primary" />
          Daily Challenges
        </h3>
        {dailyChallenges.map((challenge, idx) => (
          <ChallengeCard 
            key={challenge.id} 
            challenge={challenge} 
            index={idx}
            onClaim={claimReward}
          />
        ))}
      </div>

      {/* Weekly Challenges */}
      <div className="space-y-3">
        <h3 className="font-medium flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" />
          Weekly Challenges
        </h3>
        {weeklyChallenges.map((challenge, idx) => (
          <ChallengeCard 
            key={challenge.id} 
            challenge={challenge} 
            index={idx}
            onClaim={claimReward}
          />
        ))}
      </div>
    </div>
  );
};

interface ChallengeCardProps {
  challenge: Challenge;
  index: number;
  onClaim: (challenge: Challenge) => void;
}

const ChallengeCard = ({ challenge, index, onClaim }: ChallengeCardProps) => {
  const progress = Math.min((challenge.current / challenge.target) * 100, 100);
  const Icon = challenge.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`p-4 rounded-xl border ${
        challenge.completed 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-card border-border'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          challenge.completed ? 'bg-green-500/20' : 'bg-primary/10'
        }`}>
          {challenge.completed ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <Icon className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-medium">{challenge.title}</p>
            <span className="text-xs font-bold text-primary flex items-center gap-1">
              <Gift className="w-3 h-3" />
              +{challenge.xpReward} XP
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{challenge.description}</p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{challenge.current} / {challenge.target}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StudyChallenges;
