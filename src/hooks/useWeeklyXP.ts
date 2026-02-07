import { supabase } from '@/integrations/supabase/client';

const getWeekStart = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  return monday.toISOString().split('T')[0];
};

export async function awardXP(userId: string, xpAmount: number) {
  if (!userId || xpAmount <= 0) return;

  const weekStart = getWeekStart();

  // Update total_xp in profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_xp')
    .eq('user_id', userId)
    .single();

  if (profile) {
    await supabase
      .from('profiles')
      .update({ total_xp: (profile.total_xp || 0) + xpAmount })
      .eq('user_id', userId);
  }

  // Upsert weekly_xp
  const { data: existing } = await supabase
    .from('weekly_xp')
    .select('id, xp_earned')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('weekly_xp')
      .update({ xp_earned: existing.xp_earned + xpAmount })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('weekly_xp')
      .insert({ user_id: userId, week_start: weekStart, xp_earned: xpAmount });
  }
}

export async function updateWeeklyActivity(
  userId: string,
  field: 'notes_created' | 'quizzes_completed' | 'flashcards_reviewed' | 'focus_minutes',
  incrementBy: number = 1
) {
  if (!userId) return;

  const weekStart = getWeekStart();

  const { data: existing } = await supabase
    .from('weekly_xp')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('weekly_xp')
      .update({ [field]: ((existing as any)[field] || 0) + incrementBy })
      .eq('id', (existing as any).id);
  } else {
    await supabase
      .from('weekly_xp')
      .insert({ user_id: userId, week_start: weekStart, [field]: incrementBy });
  }
}
