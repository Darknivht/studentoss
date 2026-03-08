const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-study`;
const AI_TIMEOUT_MS = 30_000; // 30 seconds

type Message = { role: "user" | "assistant"; content: string };

export type AIMode = 
  | "summarize" 
  | "eli5" 
  | "socratic" 
  | "quiz" 
  | "flashcards" 
  | "fill_blanks"
  | "mnemonic"
  | "cheatsheet"
  | "debate"
  | "concept_map"
  | "essay_grade"
  | "plagiarism"
  | "citation"
  | "bibliography"
  | "research"
  | "research_full"
  | "thesis"
  | "chat"
  | "math_solver"
  | "ocr_latex"
  | "diagram_interpreter"
  | "code_debugger"
  | "translator"
  | "youtube_summary"
  | "book_scanner"
  | "transcribe_audio"
  | "job_search"
  | "quick_answer";

interface StreamChatOptions {
  messages: Message[];
  mode?: AIMode;
  content?: string;
  imageBase64?: string;
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export async function streamAIChat({
  messages,
  mode = "chat",
  content,
  imageBase64,
  onDelta,
  onDone,
  onError,
}: StreamChatOptions) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, mode, content, imageBase64 }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      const errorMessage = errorData.error || `Request failed with status ${resp.status}`;
      onError(errorMessage);
      return;
    }

    if (!resp.body) {
      onError("No response body received");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      // Reset timeout on each chunk received
      clearTimeout(timeout);
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          /* ignore */
        }
      }
    }

    onDone();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error("AI request timed out after", AI_TIMEOUT_MS / 1000, "seconds");
      onError("Request timed out. Please try again.");
    } else {
      console.error("Stream error:", error);
      onError(error instanceof Error ? error.message : "Connection failed. Check your internet and try again.");
    }
  } finally {
    clearTimeout(timeout);
  }
}

// Non-streaming version for quick operations
export async function callAI(mode: AIMode, content: string, imageBase64?: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ 
        messages: [], 
        mode, 
        content,
        imageBase64 
      }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed`);
    }

    // Read full stream
    const reader = resp.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let result = "";
    let textBuffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      clearTimeout(timeout); // Reset on each chunk
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) result += content;
        } catch {
          /* ignore */
        }
      }
    }

    return result;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// Helper to convert file to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
