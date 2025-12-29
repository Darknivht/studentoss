import { useCallback } from 'react';
import { useOfflineAIContext, AVAILABLE_MODELS, ModelId, DeviceCapabilities, AIMode } from '@/context/OfflineAIContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Helper to parse SSE stream for cloud AI
async function parseSSEStream(
  response: Response,
  onDelta: (text: string) => void
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullText += content;
            onDelta(content);
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  }

  return fullText;
}

export const useOfflineAI = () => {
  const { toast } = useToast();
  const context = useOfflineAIContext();
  const { engine, isModelLoaded, deviceCapabilities, aiMode } = context;

  // Check if running in Capacitor (native mobile)
  const isCapacitor = typeof (window as any).Capacitor !== 'undefined';

  // Check if mobile device
  const isMobile = isCapacitor || deviceCapabilities?.isMobile || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Cloud AI call helper
  const callCloudAI = useCallback(async (
    prompt: string,
    mode: string = 'quick_answer'
  ): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('ai-study', {
      body: { mode, content: prompt },
    });

    if (error) {
      console.error('Cloud AI error:', error);
      throw new Error(error.message || 'Cloud AI request failed');
    }

    // Handle streaming response
    if (data instanceof ReadableStream) {
      let result = '';
      await parseSSEStream(new Response(data), (delta) => {
        result += delta;
      });
      return result;
    }

    // Handle non-streaming response
    if (typeof data === 'string') return data;
    if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
    if (data?.error) throw new Error(data.error);
    
    return JSON.stringify(data);
  }, []);

  const generateText = useCallback(async (prompt: string, maxLength: number = 250): Promise<string> => {
    // Use cloud AI if in cloud mode or offline model not loaded
    if (aiMode === 'cloud' || !isModelLoaded) {
      return callCloudAI(prompt);
    }

    if (!engine) {
      throw new Error('Model not loaded. Please download the offline model or switch to Cloud AI.');
    }

    try {
      const reply = await engine.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxLength,
        temperature: 0.7,
      });

      return reply.choices[0]?.message?.content || "";
    } catch (error) {
      console.error('Offline AI generation error:', error);
      // Fallback to cloud if offline fails
      if (aiMode === 'offline') {
        console.log('Falling back to cloud AI...');
        return callCloudAI(prompt);
      }
      throw error;
    }
  }, [engine, isModelLoaded, aiMode, callCloudAI]);

  const summarize = useCallback(async (text: string): Promise<string> => {
    // Use cloud AI if in cloud mode or offline model not loaded
    if (aiMode === 'cloud' || !isModelLoaded) {
      return callCloudAI(text, 'summarize');
    }

    if (!engine) {
      throw new Error('Model not loaded.');
    }

    try {
      // Truncate input for mobile to avoid memory issues
      const maxInputLength = isMobile ? 1000 : 2000;
      const truncatedText = text.length > maxInputLength
        ? text.slice(0, maxInputLength) + '...'
        : text;

      const prompt = `Summarize the following text in a clear, concise way:\n\n${truncatedText}`;

      const reply = await engine.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.5,
      });

      return reply.choices[0]?.message?.content || "";
    } catch (error) {
      console.error('Offline summarization error:', error);
      return callCloudAI(text, 'summarize');
    }
  }, [engine, isModelLoaded, isMobile, aiMode, callCloudAI]);

  const answerQuestion = useCallback(async (question: string, noteContext: string): Promise<string> => {
    // Use cloud AI if in cloud mode or offline model not loaded
    if (aiMode === 'cloud' || !isModelLoaded) {
      return callCloudAI(`Context:\n${noteContext}\n\nQuestion: ${question}`);
    }

    if (!engine) {
      throw new Error('Model not loaded.');
    }

    try {
      const maxContextLength = isMobile ? 800 : 1500;
      const truncatedContext = noteContext.length > maxContextLength
        ? noteContext.slice(0, maxContextLength) + '...'
        : noteContext;

      const prompt = `Context:\n${truncatedContext}\n\nQuestion: ${question}\n\nAnswer the question based on the context provided.`;

      const reply = await engine.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      });

      return reply.choices[0]?.message?.content || "";
    } catch (error) {
      console.error('Offline QA error:', error);
      return callCloudAI(`Context:\n${noteContext}\n\nQuestion: ${question}`);
    }
  }, [engine, isModelLoaded, isMobile, aiMode, callCloudAI]);

  const generateFlashcardHint = useCallback(async (front: string, back: string): Promise<string> => {
    const prompt = `Flashcard Question: ${front}\nFlashcard Answer: ${back}\n\nGenerate a helpful hint for the answer without revealing it directly. Keep it short.`;
    
    // Use cloud AI if in cloud mode or offline model not loaded
    if (aiMode === 'cloud' || !isModelLoaded) {
      return callCloudAI(prompt);
    }

    if (!engine) {
      throw new Error('Model not loaded.');
    }

    try {
      const reply = await engine.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        max_tokens: 50,
        temperature: 0.8,
      });

      return reply.choices[0]?.message?.content || "";
    } catch (error) {
      console.error('Offline hint generation error:', error);
      return callCloudAI(prompt);
    }
  }, [engine, isModelLoaded, aiMode, callCloudAI]);

  // Check if AI is available (either cloud or offline)
  const isAIAvailable = aiMode === 'cloud' || isModelLoaded;

  return {
    ...context,
    loadModel: context.startDownload,
    generateText,
    summarize,
    answerQuestion,
    generateFlashcardHint,
    callCloudAI,
    isCapacitor,
    isMobile,
    isAIAvailable,
    availableModels: AVAILABLE_MODELS,
  };
};

export type { ModelId, DeviceCapabilities, AIMode };
export { AVAILABLE_MODELS };
