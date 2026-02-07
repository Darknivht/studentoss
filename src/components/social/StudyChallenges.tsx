import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { awardXP } from '@/hooks/useWeeklyXP';
import { 
  Swords, Target, BookOpen, Brain, Clock, Flame, 
  CheckCircle, Gift, Star, MessageCircle, Users, Award
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
  claimed: boolean;
}

const StudyChallenges = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchChallengeProgress();
  }, [user]);

  const fetchChallengeProgress = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const weekStart = getWeekStart();

      // Fetch today's claims to check what's already claimed
      const { data: todayClaims } = await supabase
        .from('challenge_claims')
        .select('challenge_id')
        .eq('user_id', user.id)
        .eq('claimed_date', today);

      const claimedToday = new Set(todayClaims?.map(c => c.challenge_id) || []);

      // Fetch weekly claims
      const { data: weekClaims } = await supabase
        .from('challenge_claims')
        .select('challenge_id')
        .eq('user_id', user.id)
        .gte('claimed_date', weekStart.split('T')[0]);

      const claimedThisWeek = new Set(weekClaims?.map(c => c.challenge_id) || []);

      // Fetch today's stats
      const [notesResult, quizzesResult, flashcardsResult, pomodoroResult, messagesResult, streakResult] = await Promise.all([
        supabase.from('notes').select('id', { count: 'exact' }).eq('user_id', user.id).gte('created_at', today),
        supabase.from('quiz_attempts').select('id, score, total_questions', { count: 'exact' }).eq('user_id', user.id).gte('completed_at', today),
        supabase.from('flashcards').select('id', { count: 'exact' }).eq('user_id', user.id).gte('updated_at', today),
        supabase.from('pomodoro_sessions').select('duration_minutes').eq('user_id', user.id).gte('completed_at', today),
        supabase.from('messages').select('id', { count: 'exact' }).eq('sender_id', user.id).gte('created_at', today),
        supabase.from('profiles').select('current_streak').eq('user_id', user.id).single(),
      ]);

      const notesToday = notesResult.count || 0;
      const quizzesToday = quizzesResult.count || 0;
      const flashcardsToday = flashcardsResult.count || 0;
      const focusMinutesToday = pomodoroResult.data?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0;
      const messagesToday = messagesResult.count || 0;
      const currentStreak = streakResult.data?.current_streak || 0;
      const perfectQuizzes = quizzesResult.data?.filter(q => q.score === q.total_questions).length || 0;

      // Weekly stats
      const [weeklyNotes, weeklyQuizzes, weeklyPomodoro] = await Promise.all([
        supabase.from('notes').select('id', { count: 'exact' }).eq('user_id', user.id).gte('created_at', weekStart),
        supabase.from('quiz_attempts').select('id', { count: 'exact' }).eq('user_id', user.id).gte('completed_at', weekStart),
        supabase.from('pomodoro_sessions').select('duration_minutes').eq('user_id', user.id).gte('completed_at', weekStart),
      ]);

      const weeklyFocusMinutes = weeklyPomodoro.data?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0;

      const dailyChallenges: Challenge[] = [
        { id: 'daily_notes', title: 'Note Taker', description: 'Create 2 notes today', icon: BookOpen, target: 2, current: notesToday, xpReward: 50, type: 'daily', completed: notesToday >= 2, claimed: claimedToday.has('daily_notes') },
        { id: 'daily_quiz', title: 'Quiz Master', description: 'Complete 3 quizzes today', icon: Brain, target: 3, current: quizzesToday, xpReward: 75, type: 'daily', completed: quizzesToday >= 3, claimed: claimedToday.has('daily_quiz') },
        { id: 'daily_flashcards', title: 'Card Shark', description: 'Review 10 flashcards today', icon: Target, target: 10, current: flashcardsToday, xpReward: 50, type: 'daily', completed: flashcardsToday >= 10, claimed: claimedToday.has('daily_flashcards') },
        { id: 'daily_focus', title: 'Deep Focus', description: '50 minutes of focus time', icon: Clock, target: 50, current: focusMinutesToday, xpReward: 100, type: 'daily', completed: focusMinutesToday >= 50, claimed: claimedToday.has('daily_focus') },
        { id: 'daily_social', title: 'Social Butterfly', description: 'Send 5 messages', icon: MessageCircle, target: 5, current: messagesToday, xpReward: 30, type: 'daily', completed: messagesToday >= 5, claimed: claimedToday.has('daily_social') },
        { id: 'daily_perfect', title: 'Perfect Score', description: 'Get 100% on a quiz', icon: Award, target: 1, current: perfectQuizzes, xpReward: 100, type: 'daily', completed: perfectQuizzes >= 1, claimed: claimedToday.has('daily_perfect') },
      ];

      const weeklyChallenges: Challenge[] = [
        { id: 'weekly_notes', title: 'Weekly Scholar', description: 'Create 10 notes this week', icon: BookOpen, target: 10, current: weeklyNotes.count || 0, xpReward: 200, type: 'weekly', completed: (weeklyNotes.count || 0) >= 10, claimed: claimedThisWeek.has('weekly_notes') },
        { id: 'weekly_quizzes', title: 'Quiz Champion', description: 'Complete 15 quizzes this week', icon: Brain, target: 15, current: weeklyQuizzes.count || 0, xpReward: 300, type: 'weekly', completed: (weeklyQuizzes.count || 0) >= 15, claimed: claimedThisWeek.has('weekly_quizzes') },
        { id: 'weekly_focus', title: 'Focus Legend', description: 'Study for 5 hours this week', icon: Flame, target: 300, current: weeklyFocusMinutes, xpReward: 500, type: 'weekly', completed: weeklyFocusMinutes >= 300, claimed: claimedThisWeek.has('weekly_focus') },
        { id: 'weekly_streak', title: 'Streak Keeper', description: 'Maintain a 3-day streak', icon: Flame, target: 3, current: currentStreak, xpReward: 150, type: 'weekly', completed: currentStreak >= 3, claimed: claimedThisWeek.has('weekly_streak') },
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
    const monday = new Date(now.getFullYear(), now.getMonth(), diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString();
  };

  const claimReward = async (challenge: Challenge) => {
    if (!user || !challenge.completed || challenge.claimed) return;

    try {
      // Insert claim record (will fail on duplicate due to UNIQUE constraint)
      const { error: claimError } = await supabase
        .from('challenge_claims')
        .insert({
          user_id: user.id,
          challenge_id: challenge.id,
          xp_earned: challenge.xpReward,
        });

      if (claimError) {
        if (claimError.code === '23505') {
          toast({ title: 'Already claimed!', description: 'You already got this reward.', variant: 'destructive' });
        } else {
          throw claimError;
        }
        return;
      }

      // Award XP using centralized helper (updates both profiles.total_xp and weekly_xp)
      await awardXP(user.id, challenge.xpReward);

      toast({ title: 'Reward claimed! 🎉', description: `+${challenge.xpReward} XP earned!` });
      fetchChallengeProgress();
    } catch (error) {
      console.error('Failed to claim reward:', error);
      toast({ title: 'Failed to claim reward', variant: 'destructive' });
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
      <div className="space-y-3">
        <h3 className="font-medium flex items-center gap-2">
          <Swords className="w-4 h-4 text-primary" />
          Daily Challenges
        </h3>
        {dailyChallenges.map((challenge, idx) => (
          <ChallengeCard key={challenge.id} challenge={challenge} index={idx} onClaim={claimReward} />
        ))}
      </div>
      <div className="space-y-3">
        <h3 className="font-medium flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" />
          Weekly Challenges
        </h3>
        {weeklyChallenges.map((challenge, idx) => (
          <ChallengeCard key={challenge.id} challenge={challenge} index={idx} onClaim={claimReward} />
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
      transition={{ delay: index * 0.05 }}
      className={`p-4 rounded-xl border ${
        challenge.claimed
          ? 'bg-muted/30 border-border/50 opacity-60'
          : challenge.completed 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-card border-border'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          challenge.claimed ? 'bg-muted' : challenge.completed ? 'bg-green-500/20' : 'bg-primary/10'
        }`}>
          {challenge.claimed ? (
            <CheckCircle className="w-5 h-5 text-muted-foreground" />
          ) : challenge.completed ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <Icon className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-medium">{challenge.title}</p>
            {challenge.completed && !challenge.claimed ? (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 border-green-500 text-green-600 hover:bg-green-500/10"
                onClick={() => onClaim(challenge)}
              >
                <Gift className="w-3 h-3 mr-1" />
                Claim +{challenge.xpReward} XP
              </Button>
            ) : challenge.claimed ? (
              <span className="text-xs text-muted-foreground">Claimed ✓</span>
            ) : (
              <span className="text-xs font-bold text-primary flex items-center gap-1">
                <Gift className="w-3 h-3" />+{challenge.xpReward} XP
              </span>
            )}
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
