import { motion } from 'framer-motion';
import { Users, Trophy, MessageCircle, Globe } from 'lucide-react';

const Social = () => {
  return (
    <div className="p-6 space-y-6">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold text-foreground">Social</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Learn together with friends
        </p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl bg-muted/50 border border-border/50 text-center"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-secondary" />
        </div>
        <h3 className="font-display font-semibold text-lg mb-2">Coming Soon</h3>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Study groups, friend challenges, and global leaderboards are on the way!
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Trophy, label: 'Leaderboard', color: '#F59E0B' },
          { icon: MessageCircle, label: 'Study Groups', color: '#8B5CF6' },
          { icon: Globe, label: 'Find Peers', color: '#0EA5E9' },
          { icon: Users, label: 'Challenges', color: '#EC4899' },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="p-4 rounded-xl bg-card border border-border/50 flex items-center gap-3 opacity-50"
          >
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${item.color}15` }}
            >
              <item.icon size={20} style={{ color: item.color }} />
            </div>
            <span className="text-sm font-medium">{item.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Social;