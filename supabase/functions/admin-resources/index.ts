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
    const { password, action, resource, resourceId } = body;

    // Verify admin password on every request
    const adminPassword = Deno.env.get('ADMIN_PANEL_PASSWORD');
    if (!adminPassword || password !== adminPassword) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    switch (action) {
      case 'create': {
        const { data, error } = await supabase
          .from('store_resources')
          .insert(resource)
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update': {
        const { data, error } = await supabase
          .from('store_resources')
          .update(resource)
          .eq('id', resourceId)
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        const { error } = await supabase
          .from('store_resources')
          .delete()
          .eq('id', resourceId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'upload-url': {
        // Generate a signed upload URL for the admin
        const { fileName, fileType } = body;
        const filePath = `resources/${Date.now()}-${fileName}`;
        const { data, error } = await supabase.storage
          .from('store-resources')
          .upload(filePath, new Uint8Array(), {
            contentType: fileType,
            upsert: true,
          });
        
        // Return the public URL path
        const { data: urlData } = supabase.storage
          .from('store-resources')
          .getPublicUrl(filePath);

        return new Response(JSON.stringify({ filePath, publicUrl: urlData.publicUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
