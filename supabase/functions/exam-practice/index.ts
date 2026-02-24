import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function res(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

function serviceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

// ─── AI helper ───────────────────────────────────────────────────────
async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    console.error("AI gateway error:", resp.status, t);
    if (resp.status === 429) throw new Error("RATE_LIMIT");
    if (resp.status === 402) throw new Error("PAYMENT_REQUIRED");
    throw new Error("AI gateway error");
  }

  const json = await resp.json();
  return json.choices?.[0]?.message?.content ?? "";
}

function extractJsonFromAI(raw: string): unknown {
  // Try to extract JSON from markdown fences or raw
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const toParse = fenceMatch ? fenceMatch[1].trim() : raw.trim();
  return JSON.parse(toParse);
}

// ─── Action: generate-questions ──────────────────────────────────────
async function generateQuestions(
  supabase: ReturnType<typeof serviceClient>,
  body: Record<string, unknown>,
) {
  const { exam_type_id, subject_id, topic_id, count = 10 } = body as {
    exam_type_id: string;
    subject_id: string;
    topic_id?: string;
    count?: number;
  };

  // 1. Try to fetch existing questions from the bank
  let query = supabase
    .from("exam_questions")
    .select("*")
    .eq("exam_type_id", exam_type_id)
    .eq("subject_id", subject_id)
    .eq("is_active", true);

  if (topic_id) query = query.eq("topic_id", topic_id);

  const { data: existing } = await query.limit(200);
  const pool = existing ?? [];

  // Shuffle and pick
  const shuffled = pool.sort(() => Math.random() - 0.5);
  if (shuffled.length >= (count as number)) {
    return { questions: shuffled.slice(0, count as number) };
  }

  // 2. Not enough questions → generate with AI
  const needed = (count as number) - shuffled.length;

  // Get context names
  const { data: examType } = await supabase.from("exam_types").select("name, description").eq("id", exam_type_id).single();
  const { data: subject } = await supabase.from("exam_subjects").select("name").eq("id", subject_id).single();

  let topicName = "";
  if (topic_id) {
    const { data: topic } = await supabase.from("exam_topics").select("name").eq("id", topic_id).single();
    topicName = topic?.name ?? "";
  }

  const systemPrompt = `You are an expert exam question generator for ${examType?.name ?? "exams"}.
Generate exactly ${needed} multiple-choice questions for the subject "${subject?.name ?? ""}".
${topicName ? `Focus on the topic: "${topicName}".` : "Cover a variety of topics."}
${examType?.description ? `Exam context: ${examType.description}` : ""}

Return ONLY a valid JSON array of objects, each with:
- "question": string
- "options": array of exactly 4 strings
- "correct_index": integer 0-3
- "explanation": string (why the correct answer is correct)
- "difficulty": "easy" | "medium" | "hard"

Mix difficulties: ~30% easy, ~50% medium, ~20% hard.
Randomise the position of the correct answer.
Make distractors plausible — represent common misconceptions.
Return ONLY the JSON array, no other text.`;

  const raw = await callAI(systemPrompt, `Generate ${needed} questions now.`);
  const generated = extractJsonFromAI(raw) as Array<Record<string, unknown>>;

  // 3. Cache generated questions
  const toInsert = generated.map((q) => ({
    exam_type_id,
    subject_id,
    topic_id: topic_id || null,
    question: q.question as string,
    options: q.options,
    correct_index: q.correct_index as number,
    explanation: (q.explanation as string) || null,
    difficulty: (q.difficulty as string) || "medium",
    source: "ai_generated",
  }));

  const { data: inserted } = await supabase
    .from("exam_questions")
    .insert(toInsert)
    .select();

  const allQuestions = [...shuffled, ...(inserted ?? [])];
  return { questions: allQuestions.slice(0, count as number) };
}

// ─── Action: submit-answer ───────────────────────────────────────────
async function submitAnswer(
  supabase: ReturnType<typeof serviceClient>,
  userId: string,
  body: Record<string, unknown>,
) {
  const {
    exam_type_id,
    subject_id,
    topic_id,
    question_id,
    selected_index,
    is_correct,
    time_spent_seconds,
    session_id,
  } = body as {
    exam_type_id: string;
    subject_id: string;
    topic_id?: string;
    question_id?: string;
    selected_index: number;
    is_correct: boolean;
    time_spent_seconds?: number;
    session_id: string;
  };

  const { data, error } = await supabase.from("exam_attempts").insert({
    user_id: userId,
    exam_type_id,
    subject_id,
    topic_id: topic_id || null,
    question_id: question_id || null,
    selected_index,
    is_correct,
    time_spent_seconds: time_spent_seconds ?? 0,
    session_id,
  }).select().single();

  if (error) throw error;

  // Fetch explanation if question_id provided
  let explanation: string | null = null;
  if (question_id) {
    const { data: q } = await supabase.from("exam_questions").select("explanation, correct_index, options").eq("id", question_id).single();
    explanation = q?.explanation ?? null;
  }

  return { attempt: data, explanation };
}

// ─── Action: get-weaknesses ──────────────────────────────────────────
async function getWeaknesses(
  supabase: ReturnType<typeof serviceClient>,
  userId: string,
  body: Record<string, unknown>,
) {
  const { exam_type_id, subject_id } = body as {
    exam_type_id: string;
    subject_id: string;
  };

  // Get last 200 attempts for this exam + subject
  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select("topic_id, is_correct")
    .eq("user_id", userId)
    .eq("exam_type_id", exam_type_id)
    .eq("subject_id", subject_id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (!attempts || attempts.length === 0) {
    return { weaknesses: [], message: "Not enough data yet. Practice more questions!" };
  }

  // Group by topic
  const topicStats: Record<string, { correct: number; total: number }> = {};
  for (const a of attempts) {
    const tid = a.topic_id ?? "__general__";
    if (!topicStats[tid]) topicStats[tid] = { correct: 0, total: 0 };
    topicStats[tid].total++;
    if (a.is_correct) topicStats[tid].correct++;
  }

  // Get topic names
  const topicIds = Object.keys(topicStats).filter((id) => id !== "__general__");
  let topicNames: Record<string, string> = {};
  if (topicIds.length > 0) {
    const { data: topics } = await supabase
      .from("exam_topics")
      .select("id, name")
      .in("id", topicIds);
    if (topics) {
      topicNames = Object.fromEntries(topics.map((t) => [t.id, t.name]));
    }
  }

  // Calculate weaknesses
  const weaknesses = Object.entries(topicStats)
    .map(([tid, stats]) => ({
      topic_id: tid === "__general__" ? null : tid,
      topic_name: tid === "__general__" ? "General / Unclassified" : (topicNames[tid] ?? "Unknown"),
      accuracy: Math.round((stats.correct / stats.total) * 100),
      total_attempts: stats.total,
      correct: stats.correct,
      confidence: Math.min(1, stats.total / 10), // 0-1 confidence based on sample size
    }))
    .filter((w) => w.total_attempts >= 3) // need at least 3 attempts
    .sort((a, b) => a.accuracy - b.accuracy); // worst first

  const weak = weaknesses.filter((w) => w.accuracy < 60);

  return { weaknesses, weak_topics: weak };
}

// ─── Action: generate-study-plan ─────────────────────────────────────
async function generateStudyPlan(
  supabase: ReturnType<typeof serviceClient>,
  userId: string,
  body: Record<string, unknown>,
) {
  const { exam_type_id, subject_id, exam_date, daily_hours = 2 } = body as {
    exam_type_id: string;
    subject_id: string;
    exam_date?: string;
    daily_hours?: number;
  };

  // Get weakness data
  const weakData = await getWeaknesses(supabase, userId, { exam_type_id, subject_id });

  // Get context
  const { data: examType } = await supabase.from("exam_types").select("name").eq("id", exam_type_id).single();
  const { data: subject } = await supabase.from("exam_subjects").select("name").eq("id", subject_id).single();

  const daysLeft = exam_date
    ? Math.max(1, Math.ceil((new Date(exam_date).getTime() - Date.now()) / 86400000))
    : null;

  const systemPrompt = `You are an expert exam preparation coach. Create a focused study plan.

Exam: ${examType?.name ?? "Unknown"}
Subject: ${subject?.name ?? "Unknown"}
${daysLeft ? `Days until exam: ${daysLeft}` : "No specific exam date set."}
Daily study time: ${daily_hours} hours

Student's weak topics (sorted worst-first):
${weakData.weaknesses.map((w) => `- ${w.topic_name}: ${w.accuracy}% accuracy (${w.total_attempts} attempts)`).join("\n") || "No data yet."}

Create a practical, day-by-day study plan (up to 14 days). For each day include:
- Focus topic(s)
- Specific activities (practice questions, review notes, etc.)
- Time allocation
- Priority level (🔴 high / 🟡 medium / 🟢 low)

Prioritise weak topics. Include revision of strong topics periodically.
Format as clean Markdown. Be specific and actionable.`;

  const plan = await callAI(systemPrompt, "Generate the study plan now.");

  return { plan, weaknesses: weakData.weaknesses };
}

// ─── Main handler ────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const user = await getUser(req);
    if (!user) return res({ error: "Authentication required" }, 401);

    const body = await req.json();
    const { action } = body as { action: string };
    const supabase = serviceClient();

    switch (action) {
      case "generate-questions": {
        const result = await generateQuestions(supabase, body);
        return res(result);
      }

      case "submit-answer": {
        const result = await submitAnswer(supabase, user.id, body);
        return res(result);
      }

      case "get-weaknesses": {
        const result = await getWeaknesses(supabase, user.id, body);
        return res(result);
      }

      case "generate-study-plan": {
        const result = await generateStudyPlan(supabase, user.id, body);
        return res(result);
      }

      default:
        return res({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (e) {
    console.error("exam-practice error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "RATE_LIMIT") return res({ error: "Rate limit exceeded. Please try again later." }, 429);
    if (msg === "PAYMENT_REQUIRED") return res({ error: "AI credits exhausted. Please add funds." }, 402);
    return res({ error: msg }, 500);
  }
});
