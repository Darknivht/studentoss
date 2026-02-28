import { useEffect, useRef } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { SUBSCRIPTION_ENABLED } from '@/lib/subscriptionConfig';

interface GoogleAdBannerProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const GoogleAdBanner = ({ adSlot, adFormat = 'auto', className = '' }: GoogleAdBannerProps) => {
  const { subscription } = useSubscription();
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense not loaded yet
    }
  }, []);

  // Hide ads for paid users or if subscriptions are off
  if (!SUBSCRIPTION_ENABLED || subscription.tier !== 'free') return null;

  return (
    <div className={`ad-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default GoogleAdBanner;
