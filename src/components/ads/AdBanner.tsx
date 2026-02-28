import { Link } from 'react-router-dom';
import { Crown, Sparkles, Zap, X } from 'lucide-react';
import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { SUBSCRIPTION_ENABLED } from '@/lib/subscriptionConfig';
import GoogleAdBanner from './GoogleAdBanner';

const AD_VARIANTS = [
  {
    icon: Crown,
    title: 'Unlock Unlimited AI',
    description: 'Upgrade to Plus for 20 AI calls/day',
    cta: 'Go Plus',
    gradient: 'from-amber-500/15 to-orange-500/15',
    border: 'border-amber-500/30',
    iconColor: 'text-amber-500',
  },
  {
    icon: Sparkles,
    title: 'Remove All Limits',
    description: 'Go Pro for unlimited everything',
    cta: 'Go Pro',
    gradient: 'from-violet-500/15 to-purple-500/15',
    border: 'border-violet-500/30',
    iconColor: 'text-violet-500',
  },
  {
    icon: Zap,
    title: 'Study Smarter',
    description: 'Get group chat, advanced tools & more',
    cta: 'Upgrade',
    gradient: 'from-emerald-500/15 to-teal-500/15',
    border: 'border-emerald-500/30',
    iconColor: 'text-emerald-500',
  },
];

interface AdBannerProps {
  variant?: 'banner' | 'inline';
  className?: string;
}

const AdBanner = ({ variant = 'banner', className = '' }: AdBannerProps) => {
  const { subscription } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  // Don't show ads if subscription system is off, user is paid, or dismissed
  if (!SUBSCRIPTION_ENABLED || subscription.tier !== 'free' || dismissed) return null;

  // Show Google Ads if available, fall back to self-promo
  const showGoogleAd = true; // Set to true once AdSense is approved
  if (showGoogleAd && variant === 'banner') {
    return <GoogleAdBanner adSlot="YOUR_AD_SLOT_ID" className={className} />;
  }

  const ad = AD_VARIANTS[Math.floor(Math.random() * AD_VARIANTS.length)];
  const Icon = ad.icon;

  if (variant === 'inline') {
    return (
      <Link
        to="/upgrade"
        className={`block p-4 rounded-2xl bg-gradient-to-r ${ad.gradient} border ${ad.border} transition-all hover:scale-[1.01] ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-background/80 flex items-center justify-center ${ad.iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">{ad.title}</p>
            <p className="text-xs text-muted-foreground">{ad.description}</p>
          </div>
          <span className="text-xs font-medium text-primary shrink-0">{ad.cta} →</span>
        </div>
      </Link>
    );
  }

  return (
    <div className={`px-4 pb-2 ${className}`}>
      <div className={`relative p-3 rounded-xl bg-gradient-to-r ${ad.gradient} border ${ad.border}`}>
        <button
          onClick={(e) => { e.preventDefault(); setDismissed(true); }}
          className="absolute top-2 right-2 p-0.5 rounded-full hover:bg-background/50"
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
        <Link to="/upgrade" className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${ad.iconColor} shrink-0`} />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground">{ad.title}</p>
            <p className="text-xs text-muted-foreground">{ad.description}</p>
          </div>
          <span className="text-xs font-medium text-primary shrink-0">{ad.cta} →</span>
        </Link>
      </div>
    </div>
  );
};

export default AdBanner;
