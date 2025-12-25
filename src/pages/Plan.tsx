import { motion } from 'framer-motion';
import { Calendar, Clock, Target, Bell } from 'lucide-react';

const Plan = () => {
  return (
    <div className="p-6 space-y-6">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold text-foreground">Plan & Schedule</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Organize your study sessions
        </p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl bg-muted/50 border border-border/50 text-center"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-display font-semibold text-lg mb-2">Coming Soon</h3>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Smart study scheduler, Pomodoro timer, and deadline tracking are on the way!
        </p>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Clock, label: 'Pomodoro', color: '#8B5CF6' },
          { icon: Target, label: 'Goals', color: '#10B981' },
          { icon: Bell, label: 'Reminders', color: '#F59E0B' },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="p-4 rounded-xl bg-card border border-border/50 text-center opacity-50"
          >
            <div 
              className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center mb-2"
              style={{ backgroundColor: `${item.color}15` }}
            >
              <item.icon size={20} style={{ color: item.color }} />
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Plan;