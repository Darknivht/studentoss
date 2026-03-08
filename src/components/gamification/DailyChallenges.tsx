import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap, Target, Gift, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  type: 'notes' | 'quizzes' | 'flashcards' | 'focus' | 'streak' | 'daily_quiz';
  completed: boolean;
}

const LEVEL_XP_REQUIREMENTS = [
  0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500,
  10000, 13000, 17000, 22000, 28000, 35000, 43000, 52000, 62000, 75000
];

export const calculateLevel = (xp: number): { level: number; currentLevelXp: number; nextLevelXp: number; progress: number } => {
  let level = 1;
  for (let i = 1; i < LEVEL_XP_REQUIREMENTS.length; i++) {
    if (xp >= LEVEL_XP_REQUIREMENTS[i]) level = i + 1;
    else break;
  }
  const currentLevelXp = LEVEL_XP_REQUIREMENTS[level - 1] || 0;
  const nextLevelXp = LEVEL_XP_REQUIREMENTS[level] || LEVEL_XP_REQUIREMENTS[LEVEL_XP_REQUIREMENTS.length - 1];
  const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
  return { level, currentLevelXp, nextLevelXp, progress: Math.min(progress, 100) };
};

interface DailyChallengesProps {
  compact?: boolean;
  refreshKey?: number;
}

const DailyChallenges = ({ compact = false, refreshKey = 0 }: DailyChallengesProps) => {
  const { user, authReady } = useAuth();
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [totalXp, setTotalXp] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authReady && user) fetchChallengesProgress();
    else if (authReady) setLoading(false);
  }, [user, authReady, refreshKey]);

  useEffect(() => {
    if (!authReady || !user) return;
    const interval = setInterval(fetchChallengesProgress, 30000);
    return () => clearInterval(interval);
  }, [user, authReady]);

  const fetchChallengesProgress = async () => {
    try {
      const { data: profile } = await supabase.from('profiles').select('total_xp').eq('user_id', user?.id).single();
      setTotalXp(profile?.total_xp || 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      const [notesRes, quizzesRes, flashcardsRes, focusRes] = await Promise.all([
        supabase.from('notes').select('id', { count: 'exact', head: true }).eq('user_id', user?.id).gte('created_at', todayStr),
        supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('user_id', user?.id).gte('completed_at', todayStr),
        supabase.from('flashcards').select('id', { count: 'exact', head: true }).eq('user_id', user?.id).gt('repetitions', 0),
        supabase.from('pomodoro_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user?.id).gte('completed_at', todayStr),
      ]);

      const dailyQuizDone = localStorage.getItem('daily_quiz_date') === new Date().toISOString().split('T')[0];

      setChallenges([
        { id: 'notes_daily', title: 'Note Taker', description: 'Create 2 notes today', target: 2, current: notesRes.count || 0, xpReward: 50, type: 'notes', completed: (notesRes.count || 0) >= 2 },
        { id: 'quiz_daily', title: 'Quiz Master', description: 'Complete 1 quiz', target: 1, current: quizzesRes.count || 0, xpReward: 30, type: 'quizzes', completed: (quizzesRes.count || 0) >= 1 },
        { id: 'flashcards_daily', title: 'Card Shark', description: 'Review 10 flashcards', target: 10, current: Math.min(flashcardsRes.count || 0, 10), xpReward: 40, type: 'flashcards', completed: (flashcardsRes.count || 0) >= 10 },
        { id: 'focus_daily', title: 'Deep Focus', description: 'Complete 2 focus sessions', target: 2, current: focusRes.count || 0, xpReward: 60, type: 'focus', completed: (focusRes.count || 0) >= 2 },
        { id: 'brain_boost', title: 'Brain Boost', description: 'Complete the daily quiz', target: 1, current: dailyQuizDone ? 1 : 0, xpReward: 50, type: 'daily_quiz', completed: dailyQuizDone },
      ]);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const levelInfo = calculateLevel(totalXp);
  const completedCount = challenges.filter(c => c.completed).length;

  if (loading) {
    return <div className="p-4 rounded-2xl bg-card border border-border animate-pulse h-20" />;
  }

  if (compact) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" /><span className="font-semibold text-foreground">Daily Challenges</span></div>
          <span className="text-sm text-muted-foreground">{completedCount}/{challenges.length}</span>
        </div>
        <Progress value={challenges.length ? (completedCount / challenges.length) * 100 : 0} className="h-2" />
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-3xl gradient-primary text-primary-foreground">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center"><span className="text-2xl font-bold">{levelInfo.level}</span></div>
            <div><p className="text-sm opacity-80">Level</p><p className="text-lg font-bold">{levelInfo.level < 5 ? 'Beginner' : levelInfo.level < 10 ? 'Apprentice' : levelInfo.level < 15 ? 'Scholar' : 'Master'}</p></div>
          </div>
          <div className="text-right"><p className="text-2xl font-bold">{totalXp.toLocaleString()}</p><p className="text-sm opacity-80">Total XP</p></div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs opacity-80"><span>Progress to Level {levelInfo.level + 1}</span><span>{totalXp - levelInfo.currentLevelXp} / {levelInfo.nextLevelXp - levelInfo.currentLevelXp} XP</span></div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden"><motion.div className="h-full bg-white" initial={{ width: 0 }} animate={{ width: `${levelInfo.progress}%` }} transition={{ duration: 0.5 }} /></div>
        </div>
      </motion.div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><Target className="w-5 h-5 text-primary" />Daily Challenges</h3>
          <span className="text-sm text-muted-foreground">{completedCount}/{challenges.length} complete</span>
        </div>
        {challenges.map((challenge, i) => (
          <motion.div key={challenge.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
            className={`p-4 rounded-2xl border transition-all ${challenge.completed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-card border-border'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${challenge.completed ? 'bg-emerald-500/20' : 'bg-primary/10'}`}>
                {challenge.completed ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Star className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between"><p className="font-medium text-foreground">{challenge.title}</p><span className="text-xs font-medium text-primary">+{challenge.xpReward} XP</span></div>
                <p className="text-xs text-muted-foreground">{challenge.description}</p>
                <div className="mt-2"><Progress value={(challenge.current / challenge.target) * 100} className="h-1.5" /></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DailyChallenges;
