import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Lock, Crown, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SUBSCRIPTION_ENABLED } from '@/lib/subscriptionConfig';

interface FeatureGateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  currentUsage: number;
  limit: number;
  isLifetime?: boolean;
  requiredTier?: 'plus' | 'pro';
}

const FeatureGateDialog = ({
  open,
  onOpenChange,
  feature,
  currentUsage,
  limit,
  isLifetime = false,
  requiredTier = 'plus',
}: FeatureGateDialogProps) => {
  if (!SUBSCRIPTION_ENABLED) return null;

  const tierLabel = requiredTier === 'pro' ? 'Pro' : 'Plus';
  const usagePercent = limit > 0 ? Math.min((currentUsage / limit) * 100, 100) : 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-3">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-lg">
            {isLifetime ? 'Lifetime Limit Reached' : 'Daily Limit Reached'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            You've used all your free {feature}.
            {isLifetime
              ? ' Upgrade to unlock more capacity.'
              : ' Come back tomorrow or upgrade now.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Usage bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Usage</span>
              <span className="font-medium text-foreground">
                {currentUsage} / {limit}
              </span>
            </div>
            <Progress value={usagePercent} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {isLifetime ? 'Total usage (lifetime)' : "Today's usage"}
            </p>
          </div>

          {/* CTA */}
          <Link to="/upgrade" onClick={() => onOpenChange(false)}>
            <Button className="w-full gradient-primary text-primary-foreground">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to {tierLabel}
            </Button>
          </Link>

          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeatureGateDialog;
