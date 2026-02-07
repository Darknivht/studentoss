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
    const { messages, mode, content, imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userMessages = messages || [];

    // Different modes for different AI features
    switch (mode) {
      case "summarize":
        systemPrompt = `You are a brilliant study assistant that creates detailed, comprehensive summaries.
When given study notes or content:
1. Create a clear "Executive Summary" at the top
2. Break down the content into logical sections with H3 headers (###)
3. **CRITICAL:** The summary must be at least 50% of the length of the original text. Do not be concise.
4. Cover EVERY topic, subtopic, and detail from the notes. Do not skip anything.
5. Use bullet points for key details
6. Highlight important terms and definitions in **bold**
7. Create a "Key Takeaways" section at the end
8. Use emojis to make it engaging but professional

Format your response as clean, structured Markdown.`;
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
        systemPrompt = `You are a wise and encouraging Socratic Tutor called "StudentOS AI".
Your goal is to help the student truly understand the material in their course, not just memorize answers.

Context:
You have access to the student's notes for this course. Use them to guide your questions.
If a specific note is provided as "Focus Note", start by discussing that, but feel free to draw connections to other notes in the course.

Your Approach:
1. **Never give direct answers immediately.** Instead, guide the student with questions.
2. **Ask thought-provoking questions** that lead the student to discover the answer themselves.
3. **Break down complex problems** into smaller, manageable steps.
4. **Be warm and encouraging.** Celebrate progress and effort!
5. **Use Markdown formatting** for clarity:
   - Use **bold** for key terms
   - Use lists for steps or options
   - Use > blockquotes for referencing their notes
6. If the student is stuck, provide hints, not answers.
7. Connect concepts across different topics when relevant.
8. Use emojis sparingly to keep the conversation engaging 🎓

Remember: Your role is to help them THINK, not to give them answers. A student who discovers the answer themselves learns far better than one who is simply told.`;
        // Keep the messages as provided - they contain the context and user's question
        break;

      case "quiz":
        systemPrompt = `You are a quiz generator for educational content.
Create a quiz in this exact JSON format:
{
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Brief explanation of why this answer is correct."
    }
  ]
}
The "correct" field is the index (0-3) of the correct option.
Make questions progressively harder. Include a mix of conceptual and application questions.
Only return valid JSON, no other text.`;
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

      case "fill_blanks":
        systemPrompt = `You are a fill-in-the-blank exercise generator for effective studying.
Create exercises in this exact JSON format:
[
  {
    "sentence": "The ___ is the powerhouse of the cell.",
    "blank": "mitochondria",
    "hint": "Organelle responsible for energy production"
  }
]
- Generate 5-8 exercises from the content
- Replace exactly ONE key term with ___ in each sentence
- The sentence must make sense and test understanding of an important concept
- Provide a helpful hint that guides without giving away the answer
- Only return valid JSON array, no other text or markdown.`;
        userMessages = [{ role: "user", content: `Create fill-in-the-blank exercises from:\n\n${content}` }];
        break;

      case "mnemonic":
        systemPrompt = `You are a mnemonic creator that helps students memorize information effectively.
Create memorable mnemonics for the given content. Include:

1. **Acronyms** - Create funny, memorable acronyms (these work best!)
2. **Rhymes or Songs** - Musical memory aids
3. **Visual Associations** - Vivid mental images
4. **Memory Palace Suggestions** - How to place concepts in familiar locations
5. **Silly Sentences** - Using first letters of words to remember

Make them FUNNY and MEMORABLE. Students remember humor better than dry facts!

Format with clear headers and bullet points. Use markdown for emphasis.
Do NOT include greetings or introductions - just provide the mnemonics directly.`;
        userMessages = [{ role: "user", content: `Create memorable mnemonics for:\n\n${content}` }];
        break;

      case "cheatsheet":
        systemPrompt = `You are a cheat sheet creator that condenses study materials.
Create a one-page CHEAT SHEET from the content. Make it:

- **Ultra-condensed** - Fit on one printed page
- **Bullet points** - Use short, punchy points
- **Abbreviations** - Use common abbreviations
- **Key formulas** - Include important equations/formulas in LaTeX where applicable
- **Definitions** - Essential terms only
- **Organized sections** - Clear headers for different topics
- **Perfect for exams** - Quick reference during last-minute review

Format in clean markdown that prints well. Use headers (##), bullet points, and bold for emphasis.
Do NOT include greetings or introductions - just provide the cheat sheet directly.`;
        userMessages = [{ role: "user", content: `Create a one-page cheat sheet from:\n\n${content}` }];
        break;

      case "debate":
        systemPrompt = `You are a skilled debate partner who argues the OPPOSITE view.
Your goal is to help the student strengthen their arguments by challenging them.

Your approach:
1. **Argue the opposite position** - Be persuasive and use logic
2. **Challenge assumptions** - Point out logical fallacies or weak points
3. **Use evidence** - Provide counter-examples and evidence
4. **Stay respectful** - Be challenging but not dismissive
5. **Keep responses focused** - 2-3 paragraphs maximum

Use rhetorical techniques to make strong counter-arguments.
Format with clear paragraphs and use **bold** for key points.
Do NOT include greetings - dive straight into the debate.`;
        // Messages will contain the topic and user's position
        break;

      case "concept_map":
        systemPrompt = `You are a concept map generator that creates visual mind maps.
Analyze the content and create a concept map with 5-8 key concepts.

Return ONLY valid JSON in this exact format:
{
  "nodes": [
    {"id": "1", "label": "Main Concept"},
    {"id": "2", "label": "Related Concept"}
  ],
  "connections": [
    {"from": "1", "to": "2", "label": "relates to"}
  ]
}

Rules:
- The first node should be the main/central concept
- Each node must have a unique "id" (string) and a "label"
- Connections show relationships between concepts
- Connection labels should be short (2-3 words)
- Only return valid JSON, no other text or markdown fences.`;
        userMessages = [{ role: "user", content: `Create a concept map from:\n\n${content}` }];
        break;

      case "math_solver":
        systemPrompt = `You are an expert math tutor. When given a math problem:
1. Identify what type of problem it is
2. Explain each step of the solution clearly
3. Show all work with proper mathematical notation
4. Provide the final answer clearly marked
5. Give a brief tip for solving similar problems

Use LaTeX notation for math expressions (wrap in $ for inline, $$ for display).
Be thorough but clear. Make it educational!`;
        if (imageBase64) {
          userMessages = [{
            role: "user",
            content: [
              { type: "text", text: "Solve this math problem step by step. Show all work and explain each step clearly." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
            ]
          }];
        } else {
          userMessages = [{ role: "user", content: `Solve this math problem step by step:\n\n${content}` }];
        }
        break;

      case "ocr_latex":
        systemPrompt = `You are an expert at converting handwritten or printed mathematical expressions into clean LaTeX.
When given an image of math:
1. Identify all mathematical symbols accurately
2. Convert to proper LaTeX notation
3. Format complex expressions properly with appropriate LaTeX environments
4. Provide both inline ($...$) and display ($$...$$) versions when appropriate
5. If there are multiple expressions, number them

Output clean, compilable LaTeX that renders beautifully.`;
        if (imageBase64) {
          userMessages = [{
            role: "user",
            content: [
              { type: "text", text: "Convert this handwritten/printed math into clean LaTeX code. Provide the LaTeX expressions clearly formatted." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
            ]
          }];
        } else {
          userMessages = [{ role: "user", content: `Convert this math expression to LaTeX:\n\n${content}` }];
        }
        break;

      case "diagram_interpreter":
        systemPrompt = `You are an expert at explaining scientific diagrams from biology, physics, chemistry, and other STEM subjects.
When analyzing a diagram:
1. Identify what the diagram represents
2. Explain each labeled component and its function
3. Describe the relationships and processes shown
4. Connect it to key concepts students should know
5. Provide memory tips for exams

Be thorough but student-friendly. Use bullet points for clarity.`;
        if (imageBase64) {
          userMessages = [{
            role: "user",
            content: [
              { type: "text", text: "Explain this scientific diagram in detail. What does it show? What are the key components and processes?" },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
            ]
          }];
        } else {
          userMessages = [{ role: "user", content: `Explain this diagram:\n\n${content}` }];
        }
        break;

      case "code_debugger":
        systemPrompt = `You are an expert programmer and debugging specialist.
When analyzing code:
1. Identify any bugs, errors, or issues
2. Explain WHY the problem occurs
3. Provide the corrected code with explanations
4. Suggest improvements for better code quality
5. Point out any security concerns or best practices

Format your response with:
- 🐛 **Issues Found**: List of problems
- 💡 **Explanation**: Why these are problems
- ✅ **Fixed Code**: Corrected version with comments
- 📝 **Tips**: Additional suggestions

Be educational - help the student learn, not just copy.`;
        userMessages = [{ role: "user", content: `Debug and fix this code:\n\n\`\`\`\n${content}\n\`\`\`` }];
        break;

      case "translator":
        systemPrompt = `You are a multilingual expert who helps students with language learning and translation.
When translating:
1. Provide accurate translation to the requested language (or detect and translate to English if not specified)
2. Explain key vocabulary and grammar points
3. Note any idioms or cultural context
4. Provide pronunciation tips where helpful
5. Give example sentences for key terms

Be educational and help students learn the language, not just translate.`;
        userMessages = [{ role: "user", content: `Translate and explain:\n\n${content}` }];
        break;

      case "youtube_summary":
        systemPrompt = `You are an expert at summarizing educational video content.
You will receive either a YouTube URL or a pasted transcript. In BOTH cases, provide a helpful summary.

If given a URL: Use the video title and any info you can infer from the URL to provide a helpful summary about the likely topic. Do NOT say you cannot access the URL. Instead, analyze what the video is likely about based on the URL, title keywords, and your knowledge, then provide a comprehensive educational summary on that topic.

If given a transcript: Summarize it thoroughly.

Always format as:
📺 **Video Summary**
📌 **Key Points** (bullet list)
💡 **Main Takeaways**
📚 **Study Notes**
🔗 **Related Topics**

Do NOT say "I cannot access external websites". Always provide useful content.`;
        userMessages = [{ role: "user", content: `Summarize this YouTube video content:\n\n${content}` }];
        break;

      case "book_scanner":
        systemPrompt = `You are an expert at extracting and organizing educational content from textbook pages.
When analyzing a textbook page image:
1. Extract all key definitions
2. Identify important terms and concepts
3. Note any formulas or equations (in LaTeX)
4. Summarize the main ideas
5. Create study-ready notes

Format as:
📖 **Topic**: [Main topic]
📝 **Definitions**: [Term: Definition format]
🔑 **Key Concepts**: [Bullet points]
📐 **Formulas**: [LaTeX formatted]
💡 **Summary**: [Brief overview]`;
        if (imageBase64) {
          userMessages = [{
            role: "user",
            content: [
              { type: "text", text: "Extract all definitions, key terms, formulas, and concepts from this textbook page. Create organized study notes." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
            ]
          }];
        } else {
          userMessages = [{ role: "user", content: `Extract key information from:\n\n${content}` }];
        }
        break;

      case "transcribe_audio":
        systemPrompt = `You are organizing and cleaning up lecture transcriptions.
When given a transcription:
1. Clean up any transcription errors
2. Add proper punctuation and formatting
3. Organize into logical sections with headings
4. Highlight key points and definitions
5. Create a summary at the end

Format as clean, study-ready notes that are easy to review.`;
        userMessages = [{ role: "user", content: `Clean up and organize this lecture transcription:\n\n${content}` }];
        break;

      case "essay_grade":
        systemPrompt = `You are an expert essay grader. Grade the essay thoroughly.
First line must be JSON: {"scores": [{"category": "Thesis/Argument", "score": 20, "max": 25}, {"category": "Evidence/Support", "score": 18, "max": 25}, {"category": "Analysis", "score": 19, "max": 25}, {"category": "Organization", "score": 21, "max": 25}]}
Then provide detailed markdown feedback with ## Strengths, ## Areas for Improvement, ## Grammar & Style Notes, ## Summary sections.
Do NOT include greetings. Start directly with the JSON scores line.`;
        userMessages = [{ role: "user", content: content || "" }];
        break;

      case "plagiarism":
        systemPrompt = `You are an expert text originality analyst.
First line must be JSON: {"originality_score": 85}
(Score 0-100, where 100 is fully original)
Then provide detailed markdown analysis with ## Overall Assessment, ## Suspicious Passages, ## Style Consistency, ## Suggestions sections.
Do NOT include greetings. Start directly with the JSON score line.`;
        userMessages = [{ role: "user", content: content || "" }];
        break;

      case "citation":
        systemPrompt = `You are an expert citation formatter. Generate properly formatted citations following exact style rules (APA, MLA, Chicago, Harvard, IEEE, Vancouver).
Provide: ## Full Citation, ## In-text Citation, ## Notes sections.
Be precise with formatting. Do NOT include greetings.`;
        userMessages = [{ role: "user", content: content || "" }];
        break;

      case "bibliography":
        systemPrompt = `You are an expert bibliography formatter. Format sources into a properly formatted reference list. Sort alphabetically. Follow exact citation style rules. Note missing information in brackets.
Do NOT include greetings. Output only the formatted bibliography.`;
        userMessages = [{ role: "user", content: content || "" }];
        break;

      case "research":
        systemPrompt = `You are an expert research assistant. Provide a comprehensive research guide with: ## Overview, ## Key Research Areas, ## Suggested Search Terms, ## Recommended Databases, ## Notable Authors, ## Recent Developments, ## Research Questions (5-7), ## Methodology Suggestions.
Do NOT include greetings. Provide only the research guide.`;
        userMessages = [{ role: "user", content: content || "" }];
        break;

      case "research_full":
        systemPrompt = `You are an expert academic researcher conducting comprehensive research on behalf of a student. Your task is to perform thorough, in-depth research and present your findings as a complete research report.

Structure your report with:
## Executive Summary
Brief overview of the topic and key findings.

## Background & Context
Historical context and current state of the field.

## Key Findings
Detailed analysis of the most important discoveries, theories, and evidence. Use subsections (###) for each major finding.

## Critical Analysis
Evaluate the strength of evidence, identify gaps in research, and discuss conflicting viewpoints.

## Data & Statistics
Include relevant statistics, figures, and quantitative data where applicable.

## Expert Perspectives
Reference notable researchers and their contributions.

## Current Debates & Controversies
Discuss ongoing academic debates in this area.

## Practical Implications
Real-world applications and significance of the research.

## Recommended Sources
List 10-15 specific academic papers, books, and resources with full citation details.

## Conclusion & Future Directions
Summarize findings and suggest areas for future research.

Be thorough, evidence-based, and academic in tone. Provide specific citations and references throughout.
Do NOT include greetings. Start directly with the research report.`;
        userMessages = [{ role: "user", content: content || "" }];
        break;

      case "thesis":
        systemPrompt = `You are an expert thesis statement generator. Generate strong, arguable thesis statements with: ## Strong Thesis Statement, ## Alternative Versions (2-3), ## Weak vs Strong Comparison, ## Supporting Points, ## Refinement Tips.
Do NOT include greetings. Start directly with thesis content.`;
        userMessages = [{ role: "user", content: content || "" }];
        break;

      case "chat":
        systemPrompt = `You are StudentOS AI, a helpful and encouraging study assistant.
You help students learn effectively by:
- Answering questions clearly and thoroughly
- Providing examples and analogies
- Breaking down complex topics
- Being encouraging and supportive
- Using markdown formatting for clarity

Keep responses helpful but concise unless detail is specifically needed.`;
        break;

      case "quick_answer":
        systemPrompt = `You are a quick study helper. Give brief, direct answers.
- Be concise (2-4 sentences max unless more detail is needed)
- Focus on the core answer
- Use simple language`;
        userMessages = [{ role: "user", content: content }];
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
