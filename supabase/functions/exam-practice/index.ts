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
  let cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const jsonStart = cleaned.search(/[\{\[]/);
  const jsonEnd = cleaned.lastIndexOf(jsonStart !== -1 && cleaned[jsonStart] === '[' ? ']' : '}');

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("No JSON object found in response");
  }

  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

  try {
    return JSON.parse(cleaned);
  } catch (_e) {
    // Fix trailing commas and control characters
    cleaned = cleaned
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x1F\x7F]/g, "");
    return JSON.parse(cleaned);
  }
}

// ─── Difficulty adaptation helper ────────────────────────────────────
async function getUserDifficultyBias(
  supabase: ReturnType<typeof serviceClient>,
  userId: string | null,
  subjectId: string,
): Promise<"easy" | "medium" | "hard"> {
  if (!userId) return "medium";

  const { data: recent } = await supabase
    .from("exam_attempts")
    .select("is_correct")
    .eq("user_id", userId)
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!recent || recent.length < 5) return "medium";

  const accuracy = recent.filter((a) => a.is_correct).length / recent.length;
  if (accuracy > 0.75) return "hard";
  if (accuracy < 0.4) return "easy";
  return "medium";
}

// ─── Action: generate-questions ──────────────────────────────────────
async function generateQuestions(
  supabase: ReturnType<typeof serviceClient>,
  body: Record<string, unknown>,
  userId: string | null,
) {
  const { exam_type_id, subject_id, topic_id, count = 10 } = body as {
    exam_type_id: string;
    subject_id: string;
    topic_id?: string;
    count?: number;
  };

  const difficultyBias = await getUserDifficultyBias(supabase, userId, subject_id);

  let query = supabase
    .from("exam_questions")
    .select("*")
    .eq("exam_type_id", exam_type_id)
    .eq("subject_id", subject_id)
    .eq("is_active", true);

  if (topic_id) query = query.eq("topic_id", topic_id);

  const { data: existing } = await query.limit(200);
  let pool = existing ?? [];

  // Bias selection toward the preferred difficulty
  if (pool.length > (count as number)) {
    const preferred = pool.filter((q) => q.difficulty === difficultyBias);
    const others = pool.filter((q) => q.difficulty !== difficultyBias);
    const prefCount = Math.min(preferred.length, Math.ceil((count as number) * 0.7));
    const otherCount = (count as number) - prefCount;
    const picked = [
      ...preferred.sort(() => Math.random() - 0.5).slice(0, prefCount),
      ...others.sort(() => Math.random() - 0.5).slice(0, otherCount),
    ].sort(() => Math.random() - 0.5);
    if (picked.length >= (count as number)) {
      return { questions: picked.slice(0, count as number), difficulty_bias: difficultyBias };
    }
    pool = picked;
  }

  const shuffled = pool.sort(() => Math.random() - 0.5);
  if (shuffled.length >= (count as number)) {
    return { questions: shuffled.slice(0, count as number), difficulty_bias: difficultyBias };
  }

  // Not enough questions → generate with AI
  const needed = (count as number) - shuffled.length;

  const { data: examType } = await supabase.from("exam_types").select("name, description").eq("id", exam_type_id).single();
  const { data: subject } = await supabase.from("exam_subjects").select("name").eq("id", subject_id).single();

  let topicName = "";
  if (topic_id) {
    const { data: topic } = await supabase.from("exam_topics").select("name").eq("id", topic_id).single();
    topicName = topic?.name ?? "";
  }

  const difficultyInstruction = difficultyBias === "hard"
    ? "Focus on harder questions: ~60% hard, ~30% medium, ~10% easy. The student is performing well."
    : difficultyBias === "easy"
    ? "Focus on easier questions: ~60% easy, ~30% medium, ~10% hard. The student needs confidence building."
    : "Mix difficulties: ~30% easy, ~50% medium, ~20% hard.";

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

${difficultyInstruction}
Randomise the position of the correct answer.
Make distractors plausible — represent common misconceptions.
Return ONLY the JSON array, no other text.`;

  const raw = await callAI(systemPrompt, `Generate ${needed} questions now.`);
  const generated = extractJsonFromAI(raw) as Array<Record<string, unknown>>;

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
  return { questions: allQuestions.slice(0, count as number), difficulty_bias: difficultyBias };
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

  const topicStats: Record<string, { correct: number; total: number }> = {};
  for (const a of attempts) {
    const tid = a.topic_id ?? "__general__";
    if (!topicStats[tid]) topicStats[tid] = { correct: 0, total: 0 };
    topicStats[tid].total++;
    if (a.is_correct) topicStats[tid].correct++;
  }

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

  const weaknesses = Object.entries(topicStats)
    .map(([tid, stats]) => ({
      topic_id: tid === "__general__" ? null : tid,
      topic_name: tid === "__general__" ? "General / Unclassified" : (topicNames[tid] ?? "Unknown"),
      accuracy: Math.round((stats.correct / stats.total) * 100),
      total_attempts: stats.total,
      correct: stats.correct,
      confidence: Math.min(1, stats.total / 10),
    }))
    .filter((w) => w.total_attempts >= 3)
    .sort((a, b) => a.accuracy - b.accuracy);

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

  const weakData = await getWeaknesses(supabase, userId, { exam_type_id, subject_id });

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
        const result = await generateQuestions(supabase, body, user.id);
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

      case "extract-pdf-questions": {
        const { exam_type_id, subject_id, pdf_text, filename, file_url } = body as {
          exam_type_id: string; subject_id: string; pdf_text: string; filename: string; file_url: string;
        };

        const { data: examType } = await supabase.from("exam_types").select("name").eq("id", exam_type_id).single();
        const { data: subject } = await supabase.from("exam_subjects").select("name").eq("id", subject_id).single();

        const systemPrompt = `You are an expert exam question extractor. Extract multiple-choice questions from the provided text.
The text is from a PDF related to ${examType?.name ?? "exams"}, subject: ${subject?.name ?? "unknown"}.

For each question found or derivable from the content, create a structured MCQ with:
- "question": the question text
- "options": array of exactly 4 answer choices
- "correct_index": integer 0-3 for the correct answer
- "explanation": a detailed step-by-step explanation that:
  1. Explains WHY the correct answer is right
  2. Explains WHY each wrong option is incorrect
  3. References relevant concepts, formulas, or rules
- "difficulty": "easy" | "medium" | "hard"

Return ONLY a valid JSON array. Generate as many questions as possible (up to 30).`;

        const truncatedText = pdf_text.slice(0, 15000);
        const raw = await callAI(systemPrompt, `Extract questions from this text:\n\n${truncatedText}`);
        const generated = extractJsonFromAI(raw) as Array<Record<string, unknown>>;

        const toInsert = generated.map((q) => ({
          exam_type_id,
          subject_id,
          question: q.question as string,
          options: q.options,
          correct_index: (q.correct_index as number) || 0,
          explanation: (q.explanation as string) || null,
          difficulty: (q.difficulty as string) || "medium",
          source: "pdf_extracted",
        }));

        const { data: inserted } = await supabase.from("exam_questions").insert(toInsert).select();
        const count = inserted?.length ?? 0;

        // Record the PDF upload
        await supabase.from("exam_pdfs").insert({
          exam_type_id, subject_id, file_url, filename,
          uploaded_by: user.id, questions_generated: count, status: "completed",
        });

        return res({ questions_generated: count, questions: inserted });
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
