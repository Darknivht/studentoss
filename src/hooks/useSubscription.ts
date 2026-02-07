import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SUBSCRIPTION_ENABLED } from '@/lib/subscriptionConfig';

interface FeatureLimits {
  aiCallsLimit: number;
  quizzesLimit: number;
  flashcardsLimit: number;
  notesLimit: number;
  jobSearchesLimit: number;
  resumeTemplatesLimit: number;
}

interface SubscriptionData {
  tier: 'free' | 'plus' | 'pro';
  isPro: boolean;
  isPlus: boolean;
  // Usage tracking
  aiCallsToday: number;
  quizzesToday: number;
  flashcardsToday: number;
  notesToday: number;
  // Limits
  limits: FeatureLimits;
  // Permission checks
  canUseAI: boolean;
  canCreateQuiz: boolean;
  canCreateFlashcard: boolean;
  canCreateNote: boolean;
  canUseChat: boolean;
  canUseGroupChat: boolean;
  canUseAdvancedTools: boolean;
  showAds: boolean;
}

const FREE_LIMITS: FeatureLimits = {
  aiCallsLimit: 5,
  quizzesLimit: 3,
  flashcardsLimit: 10,
  notesLimit: 2,
  jobSearchesLimit: 3,
  resumeTemplatesLimit: 3,
};

const PLUS_LIMITS: FeatureLimits = {
  aiCallsLimit: 20,
  quizzesLimit: 10,
  flashcardsLimit: 30,
  notesLimit: 8,
  jobSearchesLimit: 10,
  resumeTemplatesLimit: 7,
};

const PRO_LIMITS: FeatureLimits = {
  aiCallsLimit: Infinity,
  quizzesLimit: Infinity,
  flashcardsLimit: Infinity,
  notesLimit: Infinity,
  jobSearchesLimit: Infinity,
  resumeTemplatesLimit: 10,
};

const FULL_ACCESS: SubscriptionData = {
  tier: 'pro',
  isPro: true,
  isPlus: true,
  aiCallsToday: 0,
  quizzesToday: 0,
  flashcardsToday: 0,
  notesToday: 0,
  limits: PRO_LIMITS,
  canUseAI: true,
  canCreateQuiz: true,
  canCreateFlashcard: true,
  canCreateNote: true,
  canUseChat: true,
  canUseGroupChat: true,
  canUseAdvancedTools: true,
  showAds: false,
};

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>({
    tier: 'free',
    isPro: false,
    isPlus: false,
    aiCallsToday: 0,
    quizzesToday: 0,
    flashcardsToday: 0,
    notesToday: 0,
    limits: FREE_LIMITS,
    canUseAI: true,
    canCreateQuiz: true,
    canCreateFlashcard: true,
    canCreateNote: true,
    canUseChat: true,
    canUseGroupChat: false,
    canUseAdvancedTools: false,
    showAds: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    // Kill switch: if disabled, grant full access
    if (!SUBSCRIPTION_ENABLED) {
      setSubscription(FULL_ACCESS);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_expires_at, ai_calls_today, ai_calls_reset_at, quizzes_today, flashcards_generated_today, notes_today')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      
      // Reset daily counters if it's a new day
      if (data?.ai_calls_reset_at !== today) {
        await supabase
          .from('profiles')
          .update({ 
            ai_calls_today: 0, 
            quizzes_today: 0,
            flashcards_generated_today: 0,
            notes_today: 0,
            ai_calls_reset_at: today 
          })
          .eq('user_id', user.id);
      }

      const tierRaw = data?.subscription_tier || 'free';
      const isActive = !data?.subscription_expires_at || new Date(data.subscription_expires_at) > new Date();
      
      const isPro = tierRaw === 'pro' && isActive;
      const isPlus = tierRaw === 'plus' && isActive;
      const tier: 'free' | 'plus' | 'pro' = isPro ? 'pro' : isPlus ? 'plus' : 'free';

      const limits = isPro ? PRO_LIMITS : isPlus ? PLUS_LIMITS : FREE_LIMITS;
      const aiCallsToday = data?.ai_calls_reset_at === today ? (data?.ai_calls_today || 0) : 0;
      const quizzesToday = data?.ai_calls_reset_at === today ? (data?.quizzes_today || 0) : 0;
      const flashcardsToday = data?.ai_calls_reset_at === today ? (data?.flashcards_generated_today || 0) : 0;
      const notesToday = data?.ai_calls_reset_at === today ? (data?.notes_today || 0) : 0;

      setSubscription({
        tier,
        isPro,
        isPlus,
        aiCallsToday,
        quizzesToday,
        flashcardsToday,
        notesToday,
        limits,
        canUseAI: isPro || isPlus || aiCallsToday < limits.aiCallsLimit,
        canCreateQuiz: isPro || isPlus || quizzesToday < limits.quizzesLimit,
        canCreateFlashcard: isPro || isPlus || flashcardsToday < limits.flashcardsLimit,
        canCreateNote: isPro || isPlus || notesToday < limits.notesLimit,
        canUseChat: true, // DMs allowed for all tiers
        canUseGroupChat: isPro || isPlus,
        canUseAdvancedTools: isPro,
        showAds: tier === 'free',
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementUsage = async (type: 'ai' | 'quiz' | 'flashcard' | 'note') => {
    if (!user) return false;
    if (!SUBSCRIPTION_ENABLED) return true;

    const fieldMap = {
      ai: 'ai_calls_today',
      quiz: 'quizzes_today',
      flashcard: 'flashcards_generated_today',
      note: 'notes_today',
    };

    const field = fieldMap[type];
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select(field)
        .eq('user_id', user.id)
        .single();

      const currentCount = (data as any)?.[field] || 0;
      const newCount = currentCount + 1;
      
      await supabase
        .from('profiles')
        .update({ [field]: newCount })
        .eq('user_id', user.id);

      // Update local state
      const stateKey = {
        ai: 'aiCallsToday',
        quiz: 'quizzesToday',
        flashcard: 'flashcardsToday',
        note: 'notesToday',
      }[type] as keyof SubscriptionData;

      const limitKey = {
        ai: 'canUseAI',
        quiz: 'canCreateQuiz',
        flashcard: 'canCreateFlashcard',
        note: 'canCreateNote',
      }[type] as keyof SubscriptionData;

      const limitValue = subscription.limits[`${type === 'ai' ? 'aiCalls' : type === 'quiz' ? 'quizzes' : type === 'flashcard' ? 'flashcards' : 'notes'}Limit` as keyof FeatureLimits];

      setSubscription(prev => ({
        ...prev,
        [stateKey]: newCount,
        [limitKey]: prev.isPro || prev.isPlus || newCount < limitValue,
      }));

      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  };

  const checkLimit = (type: 'ai' | 'quiz' | 'flashcard' | 'note'): boolean => {
    if (!SUBSCRIPTION_ENABLED) return true;
    const checks = {
      ai: subscription.canUseAI,
      quiz: subscription.canCreateQuiz,
      flashcard: subscription.canCreateFlashcard,
      note: subscription.canCreateNote,
    };
    return checks[type];
  };

  const getRemainingUses = (type: 'ai' | 'quiz' | 'flashcard' | 'note'): number => {
    if (!SUBSCRIPTION_ENABLED || subscription.isPro) return Infinity;
    
    const usage = {
      ai: subscription.aiCallsToday,
      quiz: subscription.quizzesToday,
      flashcard: subscription.flashcardsToday,
      note: subscription.notesToday,
    }[type];

    const limit = {
      ai: subscription.limits.aiCallsLimit,
      quiz: subscription.limits.quizzesLimit,
      flashcard: subscription.limits.flashcardsLimit,
      note: subscription.limits.notesLimit,
    }[type];

    return Math.max(0, limit - usage);
  };

  return { 
    subscription, 
    loading, 
    incrementUsage, 
    checkLimit,
    getRemainingUses,
    refetch: fetchSubscription 
  };
};
