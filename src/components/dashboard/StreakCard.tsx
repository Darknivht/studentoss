import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Target, Sparkles } from 'lucide-react';

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
}

const StreakCard = ({ currentStreak, longestStreak, totalXP }: StreakCardProps) => {
  const isZeroStreak = currentStreak === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl gradient-primary text-primary-foreground relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={isZeroStreak ? {} : { 
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Flame className="w-8 h-8" />
            </motion.div>
            <div>
              <p className="text-sm opacity-80">Current Streak</p>
              {isZeroStreak ? (
                <div className="flex items-center gap-1.5">
                  <p className="text-xl font-display font-bold">Start your streak!</p>
                  <Sparkles className="w-4 h-4 opacity-80" />
                </div>
              ) : (
                <motion.p 
                  key={currentStreak}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-display font-bold"
                >
                  {currentStreak} days
                </motion.p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 opacity-80" />
            <div>
              <p className="text-xs opacity-70">Best Streak</p>
              <motion.p key={longestStreak} initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-semibold">
                {longestStreak} days
              </motion.p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 opacity-80" />
            <div>
              <p className="text-xs opacity-70">Total XP</p>
              <motion.p key={totalXP} initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-semibold">
                {totalXP.toLocaleString()}
              </motion.p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StreakCard;
