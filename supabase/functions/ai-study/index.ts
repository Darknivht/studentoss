import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode, content } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userMessages = messages || [];

    // Different modes for different AI features
    switch (mode) {
      case "summarize":
        systemPrompt = `You are a brilliant study assistant that creates concise, memorable summaries. 
When given study notes or content:
1. Extract the key concepts and main ideas
2. Create bullet points that are easy to remember
3. Highlight important terms and definitions
4. Keep the summary under 200 words unless the content is very complex
5. Use emojis sparingly to make key points memorable
Format your response as clean markdown with bullet points.`;
        userMessages = [{ role: "user", content: `Please summarize these notes:\n\n${content}` }];
        break;

      case "eli5":
        systemPrompt = `You are a friendly teacher who explains complex topics in simple terms that a 5-year-old could understand.
Use:
- Simple everyday analogies
- Short sentences
- Relatable examples
- Fun comparisons
Never use jargon. Make learning fun and accessible!`;
        userMessages = [{ role: "user", content: `Explain this like I'm 5 years old:\n\n${content}` }];
        break;

      case "socratic":
        systemPrompt = `You are a Socratic tutor - a wise and encouraging teacher who guides students to discover answers themselves.
Your approach:
1. Never give direct answers immediately
2. Ask thought-provoking questions that lead students toward understanding
3. Break down complex problems into smaller, manageable questions
4. Celebrate when students make progress ("Great thinking! Now consider...")
5. Provide hints if the student is stuck, but always in question form
6. Be patient, warm, and encouraging
7. When they finally understand, reinforce why their reasoning is correct

Remember: Your goal is to help them THINK, not just memorize answers.`;
        break;

      case "quiz":
        systemPrompt = `You are a quiz generator. Create exactly 5 multiple-choice questions from the study content.
Return ONLY valid JSON array in this exact format (no markdown, no explanation):
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Brief explanation of why this answer is correct."
  }
]
The "correct" field is the index (0-3) of the correct option.
Make questions progressively harder. Include a mix of conceptual and application questions.`;
        userMessages = [{ role: "user", content: `Create a quiz from:\n\n${content}` }];
        break;

      case "flashcards":
        systemPrompt = `You are a flashcard generator for effective studying.
Create flashcards in this exact JSON format:
{
  "flashcards": [
    { "front": "Question or term", "back": "Answer or definition" }
  ]
}
- Generate 5-10 flashcards from the content
- Focus on key concepts, definitions, and important facts
- Make questions clear and answers concise
- Only return valid JSON, no other text.`;
        userMessages = [{ role: "user", content: `Create flashcards from:\n\n${content}` }];
        break;

      default:
        systemPrompt = `You are a helpful, encouraging AI study assistant called StudentOS AI.
You help students learn effectively by:
- Answering questions clearly and thoroughly
- Providing examples and analogies
- Breaking down complex topics
- Being encouraging and supportive
Keep responses helpful but concise unless detail is needed.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...userMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI function error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});