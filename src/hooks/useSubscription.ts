import { useState, useEffect, useCallback } from 'react';
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

interface LifetimeLimits {
  totalNotes: number;
  totalQuizzes: number;
  totalFlashcardSets: number;
  totalAIUses: number;
}

export interface GateResult {
  allowed: boolean;
  reason: 'daily' | 'lifetime' | null;
  currentUsage: number;
  limit: number;
  isLifetime: boolean;
  requiredTier: 'plus' | 'pro';
}

interface SubscriptionData {
  tier: 'free' | 'plus' | 'pro';
  isPro: boolean;
  isPlus: boolean;
  aiCallsToday: number;
  quizzesToday: number;
  flashcardsToday: number;
  notesToday: number;
  jobSearchesThisMonth: number;
  jobSearchesResetMonth: string;
  limits: FeatureLimits;
  lifetimeLimits: LifetimeLimits;
  totalNotesCount: number;
  totalQuizzesCount: number;
  totalFlashcardSetsCount: number;
  totalAIUsesCount: number;
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

const FREE_LIFETIME: LifetimeLimits = { totalNotes: 15, totalQuizzes: 20, totalFlashcardSets: 10, totalAIUses: 30 };
const PLUS_LIFETIME: LifetimeLimits = { totalNotes: 100, totalQuizzes: 100, totalFlashcardSets: 50, totalAIUses: 200 };
const PRO_LIFETIME: LifetimeLimits = { totalNotes: Infinity, totalQuizzes: Infinity, totalFlashcardSets: Infinity, totalAIUses: Infinity };

const FULL_ACCESS: SubscriptionData = {
  tier: 'pro', isPro: true, isPlus: true,
  aiCallsToday: 0, quizzesToday: 0, flashcardsToday: 0, notesToday: 0,
  jobSearchesThisMonth: 0, jobSearchesResetMonth: '',
  limits: PRO_LIMITS, lifetimeLimits: PRO_LIFETIME,
  totalNotesCount: 0, totalQuizzesCount: 0, totalFlashcardSetsCount: 0, totalAIUsesCount: 0,
  canUseAI: true, canCreateQuiz: true, canCreateFlashcard: true, canCreateNote: true,
  canUseChat: true, canUseGroupChat: true, canUseAdvancedTools: true, showAds: false,
};

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>({
    tier: 'free', isPro: false, isPlus: false,
    aiCallsToday: 0, quizzesToday: 0, flashcardsToday: 0, notesToday: 0,
    jobSearchesThisMonth: 0, jobSearchesResetMonth: '',
    limits: FREE_LIMITS, lifetimeLimits: FREE_LIFETIME,
    totalNotesCount: 0, totalQuizzesCount: 0, totalFlashcardSetsCount: 0, totalAIUsesCount: 0,
    canUseAI: true, canCreateQuiz: true, canCreateFlashcard: true, canCreateNote: true,
    canUseChat: true, canUseGroupChat: false, canUseAdvancedTools: false, showAds: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;
    if (!SUBSCRIPTION_ENABLED) {
      setSubscription(FULL_ACCESS);
      setLoading(false);
      return;
    }

    try {
      // Fetch profile + lifetime counts in parallel
      const [profileRes, notesCountRes, quizzesCountRes, flashcardsCountRes, aiCountRes] = await Promise.all([
        supabase.from('profiles')
          .select('subscription_tier, subscription_expires_at, ai_calls_today, ai_calls_reset_at, quizzes_today, flashcards_generated_today, notes_today, job_searches_this_month, job_searches_reset_month')
          .eq('user_id', user.id).single(),
        supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('flashcards').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('chat_messages').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('role', 'user'),
      ]);

      if (profileRes.error) throw profileRes.error;
      const data = profileRes.data;

      const today = new Date().toISOString().split('T')[0];
      if (data?.ai_calls_reset_at !== today) {
        await supabase.from('profiles').update({
          ai_calls_today: 0, quizzes_today: 0, flashcards_generated_today: 0, notes_today: 0, ai_calls_reset_at: today
        }).eq('user_id', user.id);
      }

      const tierRaw = data?.subscription_tier || 'free';
      const isActive = !data?.subscription_expires_at || new Date(data.subscription_expires_at) > new Date();
      const isPro = tierRaw === 'pro' && isActive;
      const isPlus = tierRaw === 'plus' && isActive;
      const tier: 'free' | 'plus' | 'pro' = isPro ? 'pro' : isPlus ? 'plus' : 'free';

      const limits = isPro ? PRO_LIMITS : isPlus ? PLUS_LIMITS : FREE_LIMITS;
      const lifetimeLimits = isPro ? PRO_LIFETIME : isPlus ? PLUS_LIFETIME : FREE_LIFETIME;

      const aiCallsToday = data?.ai_calls_reset_at === today ? (data?.ai_calls_today || 0) : 0;
      const quizzesToday = data?.ai_calls_reset_at === today ? (data?.quizzes_today || 0) : 0;
      const flashcardsToday = data?.ai_calls_reset_at === today ? (data?.flashcards_generated_today || 0) : 0;
      const notesToday = data?.ai_calls_reset_at === today ? (data?.notes_today || 0) : 0;

      const totalNotesCount = notesCountRes.count || 0;
      const totalQuizzesCount = quizzesCountRes.count || 0;
      const totalFlashcardSetsCount = flashcardsCountRes.count || 0;
      const totalAIUsesCount = aiCountRes.count || 0;

      const jobSearchesThisMonth = (data as any)?.job_searches_this_month || 0;
      const jobSearchesResetMonth = (data as any)?.job_searches_reset_month || '';

      setSubscription({
        tier, isPro, isPlus,
        aiCallsToday, quizzesToday, flashcardsToday, notesToday,
        jobSearchesThisMonth, jobSearchesResetMonth,
        limits, lifetimeLimits,
        totalNotesCount, totalQuizzesCount, totalFlashcardSetsCount, totalAIUsesCount,
        canUseAI: isPro || isPlus || (aiCallsToday < limits.aiCallsLimit && totalAIUsesCount < lifetimeLimits.totalAIUses),
        canCreateQuiz: isPro || isPlus || (quizzesToday < limits.quizzesLimit && totalQuizzesCount < lifetimeLimits.totalQuizzes),
        canCreateFlashcard: isPro || isPlus || (flashcardsToday < limits.flashcardsLimit && totalFlashcardSetsCount < lifetimeLimits.totalFlashcardSets),
        canCreateNote: isPro || isPlus || (notesToday < limits.notesLimit && totalNotesCount < lifetimeLimits.totalNotes),
        canUseChat: true,
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

  const gateFeature = useCallback((type: 'ai' | 'quiz' | 'flashcard' | 'note' | 'jobSearch'): GateResult => {
    if (!SUBSCRIPTION_ENABLED) return { allowed: true, reason: null, currentUsage: 0, limit: Infinity, isLifetime: false, requiredTier: 'plus' };
    if (subscription.isPro) return { allowed: true, reason: null, currentUsage: 0, limit: Infinity, isLifetime: false, requiredTier: 'plus' };

    // Monthly job search check (2/month for free, 10/month for plus)
    if (type === 'jobSearch') {
      const monthlyLimit = subscription.isPlus ? 10 : 2;
      const currentMonth = new Date().toISOString().slice(0, 7);
      const usage = subscription.jobSearchesResetMonth === currentMonth ? subscription.jobSearchesThisMonth : 0;
      if (usage >= monthlyLimit) {
        return { allowed: false, reason: 'daily', currentUsage: usage, limit: monthlyLimit, isLifetime: false, requiredTier: 'plus' };
      }
      return { allowed: true, reason: null, currentUsage: usage, limit: monthlyLimit, isLifetime: false, requiredTier: 'plus' };
    }

    // Check lifetime first
    const lifetimeMap = {
      ai: { current: subscription.totalAIUsesCount, limit: subscription.lifetimeLimits.totalAIUses },
      quiz: { current: subscription.totalQuizzesCount, limit: subscription.lifetimeLimits.totalQuizzes },
      flashcard: { current: subscription.totalFlashcardSetsCount, limit: subscription.lifetimeLimits.totalFlashcardSets },
      note: { current: subscription.totalNotesCount, limit: subscription.lifetimeLimits.totalNotes },
    };

    const lifetime = lifetimeMap[type];
    if (lifetime.current >= lifetime.limit) {
      return { allowed: false, reason: 'lifetime', currentUsage: lifetime.current, limit: lifetime.limit, isLifetime: true, requiredTier: 'plus' };
    }

    // Check daily
    const dailyMap = {
      ai: { current: subscription.aiCallsToday, limit: subscription.limits.aiCallsLimit },
      quiz: { current: subscription.quizzesToday, limit: subscription.limits.quizzesLimit },
      flashcard: { current: subscription.flashcardsToday, limit: subscription.limits.flashcardsLimit },
      note: { current: subscription.notesToday, limit: subscription.limits.notesLimit },
    };

    const daily = dailyMap[type];
    if (daily.current >= daily.limit) {
      return { allowed: false, reason: 'daily', currentUsage: daily.current, limit: daily.limit, isLifetime: false, requiredTier: 'plus' };
    }

    return { allowed: true, reason: null, currentUsage: daily.current, limit: daily.limit, isLifetime: false, requiredTier: 'plus' };
  }, [subscription]);

  const incrementUsage = async (type: 'ai' | 'quiz' | 'flashcard' | 'note' | 'jobSearch') => {
    if (!user) return false;
    if (!SUBSCRIPTION_ENABLED) return true;

    if (type === 'jobSearch') {
      try {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const { data } = await supabase.from('profiles').select('job_searches_this_month, job_searches_reset_month').eq('user_id', user.id).single();
        const resetMonth = (data as any)?.job_searches_reset_month || '';
        const current = resetMonth === currentMonth ? ((data as any)?.job_searches_this_month || 0) : 0;
        const newCount = current + 1;
        await supabase.from('profiles').update({ job_searches_this_month: newCount, job_searches_reset_month: currentMonth } as any).eq('user_id', user.id);
        setSubscription(prev => ({ ...prev, jobSearchesThisMonth: newCount, jobSearchesResetMonth: currentMonth }));
        return true;
      } catch (error) {
        console.error('Error incrementing job search usage:', error);
        return false;
      }
    }

    const fieldMap = { ai: 'ai_calls_today', quiz: 'quizzes_today', flashcard: 'flashcards_generated_today', note: 'notes_today' };
    const field = fieldMap[type as keyof typeof fieldMap];

    try {
      const { data } = await supabase.from('profiles').select(field).eq('user_id', user.id).single();
      const currentCount = (data as any)?.[field] || 0;
      const newCount = currentCount + 1;
      await supabase.from('profiles').update({ [field]: newCount }).eq('user_id', user.id);

      setSubscription(prev => {
        const stateKey = { ai: 'aiCallsToday', quiz: 'quizzesToday', flashcard: 'flashcardsToday', note: 'notesToday' }[type as keyof typeof fieldMap] as keyof SubscriptionData;
        return { ...prev, [stateKey]: newCount };
      });

      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  };

  const checkLimit = (type: 'ai' | 'quiz' | 'flashcard' | 'note'): boolean => {
    return gateFeature(type).allowed;
  };

  const getRemainingUses = (type: 'ai' | 'quiz' | 'flashcard' | 'note'): number => {
    if (!SUBSCRIPTION_ENABLED || subscription.isPro) return Infinity;
    const gate = gateFeature(type);
    return Math.max(0, gate.limit - gate.currentUsage);
  };

  return {
    subscription, loading, incrementUsage, checkLimit, getRemainingUses, gateFeature,
    refetch: fetchSubscription,
  };
};
