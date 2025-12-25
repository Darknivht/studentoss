import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Lock, CheckCircle } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
}

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
}

const Achievements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    notes_count: 0,
    quizzes_count: 0,
    flashcards_reviewed: 0,
    streak: 0,
    focus_sessions: 0,
    total_xp: 0,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch all achievements
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement_value', { ascending: true });

      // Fetch user's unlocked achievements
      const { data: userAchievementsData } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user?.id);

      // Fetch user stats
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_streak, total_xp')
        .eq('user_id', user?.id)
        .single();

      const { count: notesCount } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      const { count: quizzesCount } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      const { count: focusCount } = await supabase
        .from('pomodoro_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('session_type', 'focus');

      // Get total flashcard reviews (sum of repetitions)
      const { data: flashcards } = await supabase
        .from('flashcards')
        .select('repetitions')
        .eq('user_id', user?.id);

      const flashcardsReviewed = flashcards?.reduce((sum, fc) => sum + (fc.repetitions || 0), 0) || 0;

      setAchievements(achievementsData || []);
      setUserAchievements(userAchievementsData || []);
      setStats({
        notes_count: notesCount || 0,
        quizzes_count: quizzesCount || 0,
        flashcards_reviewed: flashcardsReviewed,
        streak: profile?.current_streak || 0,
        focus_sessions: focusCount || 0,
        total_xp: profile?.total_xp || 0,
      });

      // Check for new achievements to unlock
      await checkAndUnlockAchievements(achievementsData || [], userAchievementsData || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndUnlockAchievements = async (
    allAchievements: Achievement[],
    unlockedAchievements: UserAchievement[]
  ) => {
    const unlockedIds = unlockedAchievements.map((ua) => ua.achievement_id);
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of allAchievements) {
      if (unlockedIds.includes(achievement.id)) continue;

      const currentValue = stats[achievement.requirement_type as keyof typeof stats] || 0;
      if (currentValue >= achievement.requirement_value) {
        try {
          await supabase.from('user_achievements').insert({
            user_id: user!.id,
            achievement_id: achievement.id,
          });

          // Award XP
          await supabase
            .from('profiles')
            .update({ total_xp: stats.total_xp + achievement.xp_reward })
            .eq('user_id', user!.id);

          newlyUnlocked.push(achievement);
        } catch (error) {
          // Achievement might already exist
        }
      }
    }

    if (newlyUnlocked.length > 0) {
      toast({
        title: `🎉 Achievement Unlocked!`,
        description: `${newlyUnlocked.map((a) => a.name).join(', ')} (+${newlyUnlocked.reduce((sum, a) => sum + a.xp_reward, 0)} XP)`,
      });
      fetchData(); // Refresh
    }
  };

  const isUnlocked = (achievementId: string) => {
    return userAchievements.some((ua) => ua.achievement_id === achievementId);
  };

  const getProgress = (achievement: Achievement) => {
    const current = stats[achievement.requirement_type as keyof typeof stats] || 0;
    return Math.min(100, Math.round((current / achievement.requirement_value) * 100));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const unlockedCount = userAchievements.length;
  const totalCount = achievements.length;

  return (
    <div className="p-6 space-y-6">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold text-foreground">Achievements</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {unlockedCount}/{totalCount} unlocked
        </p>
      </motion.header>

      {/* Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-3xl gradient-primary text-primary-foreground"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <p className="text-3xl font-bold">{unlockedCount}</p>
            <p className="text-sm opacity-90">Achievements Earned</p>
          </div>
        </div>
        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          />
        </div>
      </motion.div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-2 gap-3">
        {achievements.map((achievement, index) => {
          const unlocked = isUnlocked(achievement.id);
          const progress = getProgress(achievement);

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-2xl border transition-all ${
                unlocked
                  ? 'bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30'
                  : 'bg-card border-border opacity-70'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{achievement.icon}</span>
                {unlocked ? (
                  <CheckCircle className="w-5 h-5 text-primary" />
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <h3 className="font-semibold text-foreground text-sm">{achievement.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
              
              {!unlocked && (
                <div className="mt-2">
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{progress}%</p>
                </div>
              )}
              
              <p className="text-xs text-primary font-medium mt-2">+{achievement.xp_reward} XP</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Achievements;
