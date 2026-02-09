import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, Crown, Sparkles, Check } from 'lucide-react';
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
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (usagePercent / 100) * circumference;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader className="text-center">
          <div className="w-20 h-20 mx-auto relative mb-3">
            {/* Progress ring */}
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" stroke="hsl(var(--muted))" strokeWidth="4" fill="none" />
              <circle
                cx="40" cy="40" r="36"
                stroke="hsl(var(--destructive))"
                strokeWidth="4" fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-6 h-6 text-destructive" />
            </div>
          </div>
          <DialogTitle className="text-lg">
            {isLifetime ? 'Lifetime Limit Reached' : 'Limit Reached'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            You've used <span className="font-bold text-foreground">{currentUsage}/{limit}</span> {feature}.
            {isLifetime
              ? ' Upgrade to unlock more capacity.'
              : ' Upgrade now for more.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tier comparison */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { name: 'Free', highlight: false, features: ['5 AI/day', '2 notes/day', '2 jobs/mo'] },
              { name: 'Plus', highlight: requiredTier === 'plus', features: ['20 AI/day', '8 notes/day', '10 jobs/mo'] },
              { name: 'Pro', highlight: requiredTier === 'pro', features: ['Unlimited', 'Unlimited', 'Unlimited'] },
            ].map(t => (
              <div key={t.name} className={`rounded-xl p-2.5 text-xs space-y-1.5 ${t.highlight ? 'bg-primary/10 border border-primary/30 ring-1 ring-primary/20' : 'bg-muted/50 border border-border'}`}>
                <p className={`font-bold ${t.highlight ? 'text-primary' : 'text-foreground'}`}>{t.name}</p>
                {t.features.map((f, i) => (
                  <p key={i} className="text-muted-foreground flex items-center justify-center gap-1">
                    <Check className="w-3 h-3 text-primary" />{f}
                  </p>
                ))}
              </div>
            ))}
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
