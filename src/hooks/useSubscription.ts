import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  tier: 'free' | 'pro';
  aiCallsToday: number;
  aiCallsLimit: number;
  canUseAI: boolean;
  isPro: boolean;
}

const FREE_AI_CALLS_LIMIT = 10;

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>({
    tier: 'free',
    aiCallsToday: 0,
    aiCallsLimit: FREE_AI_CALLS_LIMIT,
    canUseAI: true,
    isPro: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier, ai_calls_today, ai_calls_reset_at, subscription_expires_at')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      let aiCallsToday = data?.ai_calls_today || 0;

      // Reset daily calls if it's a new day
      if (data?.ai_calls_reset_at !== today) {
        await supabase
          .from('profiles')
          .update({ ai_calls_today: 0, ai_calls_reset_at: today })
          .eq('user_id', user.id);
        aiCallsToday = 0;
      }

      const isPro = data?.subscription_tier === 'pro' && 
        (!data?.subscription_expires_at || new Date(data.subscription_expires_at) > new Date());

      setSubscription({
        tier: isPro ? 'pro' : 'free',
        aiCallsToday,
        aiCallsLimit: isPro ? Infinity : FREE_AI_CALLS_LIMIT,
        canUseAI: isPro || aiCallsToday < FREE_AI_CALLS_LIMIT,
        isPro,
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementAICall = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('ai_calls_today')
        .eq('user_id', user.id)
        .single();

      const newCount = (data?.ai_calls_today || 0) + 1;
      
      await supabase
        .from('profiles')
        .update({ ai_calls_today: newCount })
        .eq('user_id', user.id);

      setSubscription(prev => ({
        ...prev,
        aiCallsToday: newCount,
        canUseAI: prev.isPro || newCount < FREE_AI_CALLS_LIMIT,
      }));
    } catch (error) {
      console.error('Error incrementing AI call:', error);
    }
  };

  return { subscription, loading, incrementAICall, refetch: fetchSubscription };
};
