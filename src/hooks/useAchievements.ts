import { supabase } from '@/integrations/supabase/client';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
}

interface UserStats {
  notes_count: number;
  quizzes_count: number;
  flashcards_reviewed: number;
  streak: number;
  focus_sessions: number;
  total_xp: number;
  groups_joined: number;
  messages_sent: number;
  challenges_sent: number;
  perfect_quizzes: number;
  study_minutes: number;
  subjects_with_notes: number;
}

export const fetchUserStats = async (userId: string): Promise<UserStats> => {
  const [profileRes, notesRes, quizzesRes, focusRes, flashcardsRes, groupsRes, messagesRes, challengesRes, quizDataRes, courseNotesRes, studySessionsRes] = await Promise.all([
    supabase.from('profiles').select('current_streak, total_xp').eq('user_id', userId).maybeSingle(),
    supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('pomodoro_sessions').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('session_type', 'focus'),
    supabase.from('flashcards').select('repetitions').eq('user_id', userId),
    supabase.from('study_group_members').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('sender_id', userId),
    supabase.from('peer_challenges').select('*', { count: 'exact', head: true }).eq('challenger_id', userId),
    supabase.from('quiz_attempts').select('score, total_questions').eq('user_id', userId),
    supabase.from('notes').select('course_id').eq('user_id', userId).not('course_id', 'is', null),
    supabase.from('study_sessions').select('total_minutes').eq('user_id', userId),
  ]);

  const flashcardsReviewed = flashcardsRes.data?.reduce((sum, fc) => sum + (fc.repetitions || 0), 0) || 0;
  const perfectQuizzes = (quizDataRes.data || []).filter(q => q.score === q.total_questions && q.total_questions > 0).length;
  const uniqueSubjects = new Set((courseNotesRes.data || []).map(n => n.course_id)).size;
  const totalStudyMinutes = (studySessionsRes.data || []).reduce((sum, s) => sum + (s.total_minutes || 0), 0);

  return {
    notes_count: notesRes.count || 0,
    quizzes_count: quizzesRes.count || 0,
    flashcards_reviewed: flashcardsReviewed,
    streak: profileRes.data?.current_streak || 0,
    focus_sessions: focusRes.count || 0,
    total_xp: profileRes.data?.total_xp || 0,
    groups_joined: groupsRes.count || 0,
    messages_sent: messagesRes.count || 0,
    challenges_sent: challengesRes.count || 0,
    perfect_quizzes: perfectQuizzes,
    study_minutes: totalStudyMinutes,
    subjects_with_notes: uniqueSubjects,
  };
};

export const checkAndUnlockAchievements = async (
  userId: string,
  stats: UserStats
): Promise<{ newlyUnlocked: Achievement[]; totalXpAwarded: number }> => {
  const { data: allAchievements } = await supabase.from('achievements').select('*').order('requirement_value', { ascending: true });
  const { data: userAchievements } = await supabase.from('user_achievements').select('achievement_id').eq('user_id', userId);

  const unlockedIds = new Set((userAchievements || []).map((ua) => ua.achievement_id));
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of allAchievements || []) {
    if (unlockedIds.has(achievement.id)) continue;
    const currentValue = stats[achievement.requirement_type as keyof UserStats] || 0;
    if (currentValue >= achievement.requirement_value) {
      const { error } = await supabase.from('user_achievements').insert({ user_id: userId, achievement_id: achievement.id });
      if (!error) newlyUnlocked.push(achievement);
    }
  }

  const totalXpAwarded = newlyUnlocked.reduce((sum, a) => sum + a.xp_reward, 0);
  if (totalXpAwarded > 0) {
    const { data: currentProfile } = await supabase.from('profiles').select('total_xp').eq('user_id', userId).maybeSingle();
    await supabase.from('profiles').update({ total_xp: (currentProfile?.total_xp || 0) + totalXpAwarded }).eq('user_id', userId);
  }

  return { newlyUnlocked, totalXpAwarded };
};

export const runAchievementCheck = async (userId: string) => {
  const stats = await fetchUserStats(userId);
  return checkAndUnlockAchievements(userId, stats);
};
