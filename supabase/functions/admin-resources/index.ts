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
      // ─── Resources CRUD (existing) ───
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

      // ─── Analytics ───
      case 'analytics': {
        const [usersRes, activeRes, resourcesRes, quizzesRes, plusRes, proRes] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('study_sessions').select('*', { count: 'exact', head: true }).eq('session_date', new Date().toISOString().split('T')[0]),
          supabase.from('store_resources').select('*', { count: 'exact', head: true }),
          supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'plus'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'pro'),
        ]);
        return json({
          total_users: usersRes.count || 0,
          active_today: activeRes.count || 0,
          total_resources: resourcesRes.count || 0,
          total_quizzes: quizzesRes.count || 0,
          plus_subscribers: plusRes.count || 0,
          pro_subscribers: proRes.count || 0,
        });
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
