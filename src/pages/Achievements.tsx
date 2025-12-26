import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Lock, CheckCircle, Flame, Star, Zap, Award, Target } from 'lucide-react';
import { fetchUserStats, checkAndUnlockAchievements } from '@/hooks/useAchievements';
import confetti from 'canvas-confetti';

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

// Streak badge tiers
const STREAK_BADGES = [
  { days: 3, name: 'Getting Started', color: 'from-gray-400 to-gray-500', icon: '🌱' },
  { days: 7, name: 'Week Warrior', color: 'from-green-400 to-emerald-500', icon: '🔥' },
  { days: 14, name: 'Two Week Titan', color: 'from-blue-400 to-cyan-500', icon: '💎' },
  { days: 30, name: 'Monthly Master', color: 'from-purple-400 to-violet-500', icon: '👑' },
  { days: 60, name: 'Legendary Learner', color: 'from-amber-400 to-orange-500', icon: '🏆' },
  { days: 100, name: 'Century Scholar', color: 'from-rose-400 to-red-500', icon: '⭐' },
];

const Achievements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState<string | null>(null);
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

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffd700', '#ff6b6b', '#4ecdc4', '#a855f7'],
    });
  };

  const fetchData = async () => {
    try {
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement_value', { ascending: true });

      const { data: userAchievementsData } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user?.id);

      const userStats = await fetchUserStats(user!.id);

      setAchievements(achievementsData || []);
      setUserAchievements(userAchievementsData || []);
      setStats(userStats);

      const { newlyUnlocked, totalXpAwarded } = await checkAndUnlockAchievements(
        user!.id,
        userStats
      );

      if (newlyUnlocked.length > 0) {
        triggerConfetti();
        setShowUnlockAnimation(newlyUnlocked[0].id);
        
        toast({
          title: `🎉 Achievement Unlocked!`,
          description: `${newlyUnlocked.map((a) => a.name).join(', ')} (+${totalXpAwarded} XP)`,
        });
        
        const { data: refreshedAchievements } = await supabase
          .from('user_achievements')
          .select('achievement_id, unlocked_at')
          .eq('user_id', user?.id);
        
        setUserAchievements(refreshedAchievements || []);
        setStats((prev) => ({ ...prev, total_xp: prev.total_xp + totalXpAwarded }));
        
        setTimeout(() => setShowUnlockAnimation(null), 3000);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (achievementId: string) => {
    return userAchievements.some((ua) => ua.achievement_id === achievementId);
  };

  const getProgress = (achievement: Achievement) => {
    const current = stats[achievement.requirement_type as keyof typeof stats] || 0;
    return Math.min(100, Math.round((current / achievement.requirement_value) * 100));
  };

  const currentStreakBadge = STREAK_BADGES.filter((b) => stats.streak >= b.days).pop();
  const nextStreakBadge = STREAK_BADGES.find((b) => stats.streak < b.days);

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
    <div className="p-6 space-y-6 pb-24">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold text-foreground">Achievements</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {unlockedCount}/{totalCount} unlocked
        </p>
      </motion.header>

      {/* Streak Card with Animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl"
      >
        <div className={`p-6 bg-gradient-to-br ${currentStreakBadge?.color || 'from-primary to-accent'}`}>
          {/* Animated fire particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/30 rounded-full"
                initial={{ 
                  x: Math.random() * 100 + '%', 
                  y: '100%',
                  opacity: 0 
                }}
                animate={{ 
                  y: '-20%', 
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex items-center gap-4">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-4xl"
            >
              {currentStreakBadge?.icon || '🔥'}
            </motion.div>
            <div className="text-white">
              <p className="text-5xl font-bold">{stats.streak}</p>
              <p className="text-lg opacity-90">Day Streak</p>
              {currentStreakBadge && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm font-medium bg-white/20 px-2 py-1 rounded-full mt-1 inline-block"
                >
                  {currentStreakBadge.name}
                </motion.p>
              )}
            </div>
          </div>

          {nextStreakBadge && (
            <div className="mt-4 relative z-10">
              <div className="flex items-center justify-between text-white/80 text-sm mb-1">
                <span>Next: {nextStreakBadge.name}</span>
                <span>{nextStreakBadge.days - stats.streak} days to go</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.streak / nextStreakBadge.days) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-white rounded-full"
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Streak Badges Collection */}
      <div>
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Streak Badges
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {STREAK_BADGES.map((badge, index) => {
            const earned = stats.streak >= badge.days;
            return (
              <motion.div
                key={badge.days}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-xl text-center border transition-all ${
                  earned
                    ? `bg-gradient-to-br ${badge.color} border-transparent`
                    : 'bg-muted/50 border-border opacity-50'
                }`}
              >
                <span className={`text-2xl ${earned ? '' : 'grayscale'}`}>{badge.icon}</span>
                <p className={`text-xs mt-1 font-medium ${earned ? 'text-white' : 'text-muted-foreground'}`}>
                  {badge.days} days
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-3xl gradient-primary text-primary-foreground"
      >
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center"
          >
            <Trophy className="w-8 h-8" />
          </motion.div>
          <div>
            <p className="text-3xl font-bold">{unlockedCount}</p>
            <p className="text-sm opacity-90">Achievements Earned</p>
          </div>
        </div>
        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-white"
          />
        </div>
      </motion.div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-2 gap-3">
        {achievements.map((achievement, index) => {
          const unlocked = isUnlocked(achievement.id);
          const progress = getProgress(achievement);
          const isAnimating = showUnlockAnimation === achievement.id;

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                scale: isAnimating ? [1, 1.1, 1] : 1,
              }}
              transition={{ 
                delay: index * 0.05,
                duration: isAnimating ? 0.5 : 0.3,
              }}
              className={`relative p-4 rounded-2xl border transition-all overflow-hidden ${
                unlocked
                  ? 'bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30'
                  : 'bg-card border-border opacity-70'
              }`}
            >
              {/* Unlock animation overlay */}
              <AnimatePresence>
                {isAnimating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 z-10"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 2, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute inset-0 bg-white/20 rounded-2xl"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-start justify-between mb-2 relative z-20">
                <motion.span 
                  className="text-2xl"
                  animate={unlocked ? { 
                    rotate: [0, -10, 10, 0],
                  } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {achievement.icon}
                </motion.span>
                {unlocked ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </motion.div>
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <h3 className="font-semibold text-foreground text-sm relative z-20">{achievement.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 relative z-20">{achievement.description}</p>
              
              {!unlocked && (
                <div className="mt-2 relative z-20">
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className="h-full bg-primary"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{progress}%</p>
                </div>
              )}
              
              <p className="text-xs text-primary font-medium mt-2 relative z-20">+{achievement.xp_reward} XP</p>
            </motion.div>
          );
        })}
      </div>

      {/* XP Rewards Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-muted/50 border border-border"
      >
        <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          How to Earn XP
        </h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Star className="w-4 h-4 text-primary" />
            <span>Create notes: +10 XP</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="w-4 h-4 text-primary" />
            <span>Complete quiz: +20 XP</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flame className="w-4 h-4 text-primary" />
            <span>Focus session: +25 XP</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Award className="w-4 h-4 text-primary" />
            <span>Daily streak: +15 XP</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Achievements;
