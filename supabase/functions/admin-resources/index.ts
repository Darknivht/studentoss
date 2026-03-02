import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { password, action } = body;

    const adminPassword = Deno.env.get('ADMIN_PANEL_PASSWORD');
    if (!adminPassword || password !== adminPassword) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    switch (action) {
      // ─── Resources CRUD ───
      case 'create': {
        const { data, error } = await supabase.from('store_resources').insert(body.resource).select().single();
        if (error) throw error;
        return json({ data });
      }
      case 'update': {
        const { data, error } = await supabase.from('store_resources').update(body.resource).eq('id', body.resourceId).select().single();
        if (error) throw error;
        return json({ data });
      }
      case 'delete': {
        const { error } = await supabase.from('store_resources').delete().eq('id', body.resourceId);
        if (error) throw error;
        return json({ success: true });
      }
      case 'upload-url': {
        const { fileName, fileType } = body;
        const filePath = `resources/${Date.now()}-${fileName}`;
        await supabase.storage.from('store-resources').upload(filePath, new Uint8Array(), { contentType: fileType, upsert: true });
        const { data: urlData } = supabase.storage.from('store-resources').getPublicUrl(filePath);
        return json({ filePath, publicUrl: urlData.publicUrl });
      }

      // ─── Announcements CRUD ───
      case 'list-announcements': {
        const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return json({ data });
      }
      case 'create-announcement': {
        const { data, error } = await supabase.from('announcements').insert(body.announcement).select().single();
        if (error) throw error;
        return json({ data });
      }
      case 'update-announcement': {
        const { data, error } = await supabase.from('announcements').update(body.announcement).eq('id', body.announcementId).select().single();
        if (error) throw error;
        return json({ data });
      }
      case 'delete-announcement': {
        const { error } = await supabase.from('announcements').delete().eq('id', body.announcementId);
        if (error) throw error;
        return json({ success: true });
      }

      // ─── Achievements CRUD ───
      case 'list-achievements': {
        const { data, error } = await supabase.from('achievements').select('*').order('requirement_type');
        if (error) throw error;
        return json({ data });
      }
      case 'create-achievement': {
        const { data, error } = await supabase.from('achievements').insert(body.achievement).select().single();
        if (error) throw error;
        return json({ data });
      }
      case 'update-achievement': {
        const { data, error } = await supabase.from('achievements').update(body.achievement).eq('id', body.achievementId).select().single();
        if (error) throw error;
        return json({ data });
      }
      case 'delete-achievement': {
        const { error } = await supabase.from('achievements').delete().eq('id', body.achievementId);
        if (error) throw error;
        return json({ success: true });
      }

      // ─── User Management ───
      case 'list-users': {
        const { search } = body;
        let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100);
        if (search) {
          query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%,display_name.ilike.%${search}%`);
        }
        const { data, error } = await query;
        if (error) throw error;
        return json({ data });
      }
      case 'update-subscription': {
        const { userId, subscription_tier, subscription_expires_at } = body;
        const { data, error } = await supabase
          .from('profiles')
          .update({ subscription_tier, subscription_expires_at })
          .eq('user_id', userId)
          .select()
          .single();
        if (error) throw error;
        return json({ data });
      }

      // ─── Block/Unblock User ───
      case 'toggle-block-user': {
        const { userId, is_blocked } = body;
        const { data, error } = await supabase
          .from('profiles')
          .update({ is_blocked })
          .eq('user_id', userId)
          .select()
          .single();
        if (error) throw error;
        return json({ data });
      }

      // ─── User Detail (per-student analytics) ───
      case 'user-detail': {
        const { userId } = body;
        
        const [profileRes, examRes, studyRes, quizRes, notesRes, flashcardsRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', userId).single(),
          supabase.from('exam_attempts').select('is_correct, created_at, session_id').eq('user_id', userId).order('created_at', { ascending: false }).limit(500),
          supabase.from('study_sessions').select('total_minutes, session_date, xp_earned').eq('user_id', userId).order('session_date', { ascending: false }).limit(100),
          supabase.from('quiz_attempts').select('score, total_questions, completed_at').eq('user_id', userId).order('completed_at', { ascending: false }).limit(100),
          supabase.from('notes').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('flashcards').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        ]);

        const examAttempts = examRes.data || [];
        const totalExamAttempts = examAttempts.length;
        const correctExamAttempts = examAttempts.filter(a => a.is_correct).length;
        const examAccuracy = totalExamAttempts > 0 ? Math.round((correctExamAttempts / totalExamAttempts) * 100) : 0;

        const studySessions = studyRes.data || [];
        const totalStudyMinutes = studySessions.reduce((s, r) => s + (r.total_minutes || 0), 0);

        const quizAttempts = quizRes.data || [];
        const totalQuizzes = quizAttempts.length;
        const avgQuizScore = totalQuizzes > 0 ? Math.round(quizAttempts.reduce((s, q) => s + (q.score / q.total_questions) * 100, 0) / totalQuizzes) : 0;

        return json({
          profile: profileRes.data,
          exam: { total: totalExamAttempts, accuracy: examAccuracy, recent: examAttempts.slice(0, 10) },
          study: { total_minutes: totalStudyMinutes, sessions: studySessions.length, recent: studySessions.slice(0, 10) },
          quiz: { total: totalQuizzes, avg_score: avgQuizScore, recent: quizAttempts.slice(0, 10) },
          notes_count: notesRes.count || 0,
          flashcards_count: flashcardsRes.count || 0,
        });
      }

      // ─── Enhanced Analytics ───
      case 'analytics': {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

        const [usersRes, activeRes, resourcesRes, quizzesRes, plusRes, proRes, examAttemptsRes, notesCountRes, studyMinutesRes, streakRes] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('study_sessions').select('*', { count: 'exact', head: true }).eq('session_date', new Date().toISOString().split('T')[0]),
          supabase.from('store_resources').select('*', { count: 'exact', head: true }),
          supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'plus'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'pro'),
          supabase.from('exam_attempts').select('*', { count: 'exact', head: true }),
          supabase.from('notes').select('*', { count: 'exact', head: true }),
          supabase.from('study_sessions').select('total_minutes').limit(1000),
          supabase.from('profiles').select('current_streak').limit(1000),
        ]);

        const totalStudyHours = Math.round((studyMinutesRes.data || []).reduce((s, r) => s + (r.total_minutes || 0), 0) / 60);
        const streaks = (streakRes.data || []).map(p => p.current_streak || 0);
        const avgStreak = streaks.length > 0 ? Math.round(streaks.reduce((a, b) => a + b, 0) / streaks.length) : 0;

        // 30-day daily active users
        const { data: dailySessions } = await supabase
          .from('study_sessions')
          .select('session_date, user_id')
          .gte('session_date', thirtyDaysAgo)
          .order('session_date')
          .limit(1000);

        const dauMap: Record<string, Set<string>> = {};
        for (const s of (dailySessions || [])) {
          if (!dauMap[s.session_date]) dauMap[s.session_date] = new Set();
          dauMap[s.session_date].add(s.user_id);
        }
        const daily_active_users = Object.entries(dauMap).map(([date, users]) => ({
          date, count: users.size,
        })).sort((a, b) => a.date.localeCompare(b.date));

        // Daily signups (last 30 days)
        const { data: recentProfiles } = await supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
          .order('created_at');

        const signupMap: Record<string, number> = {};
        for (const p of (recentProfiles || [])) {
          const d = (p.created_at || '').split('T')[0];
          signupMap[d] = (signupMap[d] || 0) + 1;
        }
        const daily_signups = Object.entries(signupMap).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));

        // Feature usage (last 30 days)
        const [quizUsage, examUsage, flashcardUsage] = await Promise.all([
          supabase.from('quiz_attempts').select('completed_at').gte('completed_at', new Date(Date.now() - 30 * 86400000).toISOString()).limit(1000),
          supabase.from('exam_attempts').select('created_at').gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()).limit(1000),
          supabase.from('flashcards').select('created_at').gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()).limit(1000),
        ]);

        const featureMap: Record<string, { quizzes: number; exams: number; flashcards: number }> = {};
        for (const q of (quizUsage.data || [])) {
          const d = (q.completed_at || '').split('T')[0];
          if (!featureMap[d]) featureMap[d] = { quizzes: 0, exams: 0, flashcards: 0 };
          featureMap[d].quizzes++;
        }
        for (const e of (examUsage.data || [])) {
          const d = (e.created_at || '').split('T')[0];
          if (!featureMap[d]) featureMap[d] = { quizzes: 0, exams: 0, flashcards: 0 };
          featureMap[d].exams++;
        }
        for (const f of (flashcardUsage.data || [])) {
          const d = (f.created_at || '').split('T')[0];
          if (!featureMap[d]) featureMap[d] = { quizzes: 0, exams: 0, flashcards: 0 };
          featureMap[d].flashcards++;
        }
        const daily_feature_usage = Object.entries(featureMap).map(([date, data]) => ({ date, ...data })).sort((a, b) => a.date.localeCompare(b.date));

        return json({
          total_users: usersRes.count || 0,
          active_today: activeRes.count || 0,
          total_resources: resourcesRes.count || 0,
          total_quizzes: quizzesRes.count || 0,
          plus_subscribers: plusRes.count || 0,
          pro_subscribers: proRes.count || 0,
          total_exam_attempts: examAttemptsRes.count || 0,
          total_notes: notesCountRes.count || 0,
          total_study_hours: totalStudyHours,
          avg_streak: avgStreak,
          daily_active_users,
          daily_signups,
          daily_feature_usage,
        });
      }

      // ─── Exam Types CRUD ───
      case 'list-exam-types': {
        const { data, error } = await supabase.from('exam_types').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return json({ data });
      }
      case 'create-exam-type': {
        const { data, error } = await supabase.from('exam_types').insert(body.examType).select().single();
        if (error) throw error;
        return json({ data });
      }
      case 'update-exam-type': {
        const { data, error } = await supabase.from('exam_types').update(body.examType).eq('id', body.examTypeId).select().single();
        if (error) throw error;
        return json({ data });
      }
      case 'delete-exam-type': {
        const { error } = await supabase.from('exam_types').delete().eq('id', body.examTypeId);
        if (error) throw error;
        return json({ success: true });
      }

      // ─── Exam Subjects CRUD ───
      case 'list-exam-subjects': {
        let query = supabase.from('exam_subjects').select('*').order('name');
        if (body.examTypeId) query = query.eq('exam_type_id', body.examTypeId);
        const { data, error } = await query;
        if (error) throw error;
        return json({ data });
      }
      case 'create-exam-subject': {
        const { data, error } = await supabase.from('exam_subjects').insert(body.subject).select().single();
        if (error) throw error;
        return json({ data });
      }
      case 'update-exam-subject': {
        const { data, error } = await supabase.from('exam_subjects').update(body.subject).eq('id', body.subjectId).select().single();
        if (error) throw error;
        return json({ data });
      }
      case 'delete-exam-subject': {
        const { error } = await supabase.from('exam_subjects').delete().eq('id', body.subjectId);
        if (error) throw error;
        return json({ success: true });
      }

      // ─── Exam Topics CRUD ───
      case 'list-exam-topics': {
        let query = supabase.from('exam_topics').select('*').order('name');
        if (body.subjectId) query = query.eq('subject_id', body.subjectId);
        const { data, error } = await query;
        if (error) throw error;
        return json({ data });
      }
      case 'create-exam-topic': {
        const { data, error } = await supabase.from('exam_topics').insert(body.topic).select().single();
        if (error) throw error;
        return json({ data });
      }
      case 'update-exam-topic': {
        const { data, error } = await supabase.from('exam_topics').update(body.topic).eq('id', body.topicId).select().single();
        if (error) throw error;
        return json({ data });
      }
      case 'delete-exam-topic': {
        const { error } = await supabase.from('exam_topics').delete().eq('id', body.topicId);
        if (error) throw error;
        return json({ success: true });
      }

      // ─── Exam Questions CRUD ───
      case 'list-exam-questions': {
        let query = supabase.from('exam_questions').select('*').order('created_at', { ascending: false }).limit(200);
        if (body.examTypeId) query = query.eq('exam_type_id', body.examTypeId);
        if (body.subjectId) query = query.eq('subject_id', body.subjectId);
        if (body.topicId) query = query.eq('topic_id', body.topicId);
        if (body.difficulty) query = query.eq('difficulty', body.difficulty);
        if (body.source) query = query.eq('source', body.source);
        const { data, error } = await query;
        if (error) throw error;
        return json({ data });
      }
      case 'create-exam-question': {
        const { data, error } = await supabase.from('exam_questions').insert(body.question).select().single();
        if (error) throw error;
        return json({ data });
      }
      case 'update-exam-question': {
        const { data, error } = await supabase.from('exam_questions').update(body.question).eq('id', body.questionId).select().single();
        if (error) throw error;
        return json({ data });
      }
      case 'delete-exam-question': {
        const { error } = await supabase.from('exam_questions').delete().eq('id', body.questionId);
        if (error) throw error;
        return json({ success: true });
      }
      case 'bulk-import-questions': {
        const { questions } = body;
        if (!Array.isArray(questions) || questions.length === 0) {
          return json({ error: 'No questions provided' }, 400);
        }
        const { data, error } = await supabase.from('exam_questions').insert(questions).select();
        if (error) throw error;
        return json({ data, count: data.length });
      }

      // ─── Exam PDFs ───
      case 'list-exam-pdfs': {
        let query = supabase.from('exam_pdfs').select('*').order('created_at', { ascending: false });
        if (body.examTypeId) query = query.eq('exam_type_id', body.examTypeId);
        if (body.subjectId) query = query.eq('subject_id', body.subjectId);
        const { data, error } = await query;
        if (error) throw error;
        return json({ data });
      }

      // ─── Exam Analytics ───
      case 'exam-analytics': {
        const [qCountRes, aCountRes, pdfCountRes, typesRes] = await Promise.all([
          supabase.from('exam_questions').select('*', { count: 'exact', head: true }),
          supabase.from('exam_attempts').select('*', { count: 'exact', head: true }),
          supabase.from('exam_pdfs').select('*', { count: 'exact', head: true }),
          supabase.from('exam_types').select('id, name'),
        ]);

        const { data: attemptsData } = await supabase.from('exam_attempts').select('is_correct').limit(1000);
        const totalAttempts = attemptsData?.length || 0;
        const correctAttempts = attemptsData?.filter(a => a.is_correct).length || 0;
        const avgAccuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

        const byExamType = [];
        for (const et of (typesRes.data || [])) {
          const { count: qc } = await supabase.from('exam_questions').select('*', { count: 'exact', head: true }).eq('exam_type_id', et.id);
          const { count: ac } = await supabase.from('exam_attempts').select('*', { count: 'exact', head: true }).eq('exam_type_id', et.id);
          byExamType.push({ name: et.name, question_count: qc || 0, attempt_count: ac || 0 });
        }

        return json({
          total_questions: qCountRes.count || 0,
          total_attempts: aCountRes.count || 0,
          total_pdfs: pdfCountRes.count || 0,
          avg_accuracy: avgAccuracy,
          by_exam_type: byExamType,
        });
      }

      // ─── Content Health ───
      case 'content-health': {
        const { data: allSubjects } = await supabase.from('exam_subjects').select('id, name, exam_type_id, ai_prompt');
        const healthItems = [];
        for (const sub of (allSubjects || [])) {
          const { count: qCount } = await supabase.from('exam_questions').select('*', { count: 'exact', head: true }).eq('subject_id', sub.id);
          const { count: noExpl } = await supabase.from('exam_questions').select('*', { count: 'exact', head: true }).eq('subject_id', sub.id).is('explanation', null);
          healthItems.push({
            id: sub.id,
            name: sub.name,
            question_count: qCount || 0,
            no_explanation: noExpl || 0,
            has_ai_prompt: !!sub.ai_prompt,
            status: (qCount || 0) < 20 ? 'low' : (noExpl || 0) > 5 ? 'warning' : 'good',
          });
        }
        return json({ items: healthItems });
      }

      // ─── Question Reports ───
      case 'list-question-reports': {
        const { data, error } = await supabase
          .from('question_reports')
          .select('*, exam_questions(question)')
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        return json({ data });
      }
      case 'update-report-status': {
        const { data, error } = await supabase
          .from('question_reports')
          .update({ status: body.status })
          .eq('id', body.reportId)
          .select()
          .single();
        if (error) throw error;
        return json({ data });
      }

      default:
        return json({ error: 'Invalid action' }, 400);
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
