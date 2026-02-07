import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Crown, Lock, Sparkles } from 'lucide-react';
import { SUBSCRIPTION_ENABLED } from '@/lib/subscriptionConfig';

interface UpgradePromptProps {
  feature: string;
  remaining?: number;
  compact?: boolean;
  requiredTier?: 'plus' | 'pro';
}

const UpgradePrompt = ({ feature, remaining, compact = false, requiredTier = 'plus' }: UpgradePromptProps) => {
  if (!SUBSCRIPTION_ENABLED) return null;

  const tierLabel = requiredTier === 'pro' ? 'Pro' : 'Plus';

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-foreground">
            {remaining !== undefined && remaining > 0 
              ? `${remaining} ${feature} left today`
              : `Upgrade to unlock ${feature}`
            }
          </span>
        </div>
        <Link to="/upgrade">
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
            <Crown className="w-3 h-3 mr-1" />
            {tierLabel}
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 border border-amber-500/30 text-center"
    >
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-white" />
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {remaining !== undefined && remaining > 0 
          ? `${remaining} ${feature} remaining today`
          : `Daily limit reached`
        }
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4">
        {remaining !== undefined && remaining > 0
          ? `Upgrade to ${tierLabel} for ${requiredTier === 'pro' ? 'unlimited' : 'more'} access`
          : `You've used all your free ${feature} for today. Upgrade to continue.`
        }
      </p>

      <Link to="/upgrade">
        <Button className="gradient-primary text-primary-foreground">
          <Sparkles className="w-4 h-4 mr-2" />
          Upgrade to {tierLabel}
        </Button>
      </Link>
    </motion.div>
  );
};

export default UpgradePrompt;
