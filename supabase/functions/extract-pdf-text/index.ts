import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import * as pdfjs from "https://esm.sh/pdfjs-dist@4.0.379/legacy/build/pdf.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReqBody = {
  bucket: string;
  path: string;
  filename?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { bucket, path, filename }: ReqBody = await req.json();
    if (!bucket || !path) {
      return new Response(JSON.stringify({ error: "Missing bucket or path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Backend is missing required configuration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the caller and enforce ownership of the file path.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    if (!path.startsWith(`${userId}/`)) {
      return new Response(JSON.stringify({ error: "You do not have access to this file" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: fileData, error: downloadError } = await adminClient.storage
      .from(bucket)
      .download(path);

    if (downloadError || !fileData) {
      return new Response(JSON.stringify({ error: "Failed to download file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // pdfjs worker isn't available in this environment; run in-process.
    // @ts-ignore - types differ between runtimes
    const loadingTask = pdfjs.getDocument({ data: bytes, disableWorker: true });
    const pdf = await loadingTask.promise;

    const maxPages = Math.min(pdf.numPages ?? 0, 50);
    let text = "";

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      // @ts-ignore
      const pageText = (content.items ?? [])
        // @ts-ignore
        .map((it) => (typeof it?.str === "string" ? it.str : ""))
        .filter(Boolean)
        .join(" ");
      if (pageText.trim()) text += pageText + "\n\n";
    }

    text = text.replace(/\s+/g, " ").trim();

    if (text.length < 80) {
      const name = filename ? ` (${filename})` : "";
      text = `This PDF${name} appears to be scanned, image-based, or has protected/embedded text, so text extraction returned little content.\n\nTip: export it as a text-based PDF or upload a DOCX/TXT for best AI results.`;
    }

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-pdf-text error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
