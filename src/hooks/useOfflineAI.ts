import { useCallback } from 'react';
import { useOfflineAIContext, AVAILABLE_MODELS, ModelId, DeviceCapabilities, AIMode } from '@/context/OfflineAIContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

async function parseSSEStream(response: Response, onDelta: (text: string) => void): Promise<string> {
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
          if (content) { fullText += content; onDelta(content); }
        } catch {}
      }
    }
  }
  return fullText;
}

export const useOfflineAI = () => {
  const { toast } = useToast();
  const context = useOfflineAIContext();
  const { isModelLoaded, deviceCapabilities, aiMode, generateText: offlineGenerateText, isModelCached, cachedModelId } = context;

  const isCapacitor = typeof (window as any).Capacitor !== 'undefined';
  const isMobile = isCapacitor || deviceCapabilities?.isMobile || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const callCloudAI = useCallback(async (prompt: string, mode: string = 'quick_answer'): Promise<string> => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-study`;
    
    // Use session token for authenticated requests
    let token = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) token = data.session.access_token;
    } catch {}

    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ mode, content: prompt, messages: [] }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) throw new Error('Rate limit exceeded. Please try again in a moment.');
      if (response.status === 402) throw new Error('AI credits exhausted. Please add credits to continue.');
      throw new Error(errorData.error || 'Cloud AI request failed');
    }
    if (!response.body) throw new Error('No response body received');

    let result = '';
    await parseSSEStream(response, (delta) => { result += delta; });
    return result;
  }, []);

  const generateText = useCallback(async (prompt: string, maxLength: number = 250): Promise<string> => {
    if (aiMode === 'cloud') return callCloudAI(prompt);
    if (isModelLoaded || isModelCached) {
      try { return await offlineGenerateText(prompt, maxLength); }
      catch { return callCloudAI(prompt); }
    }
    return callCloudAI(prompt);
  }, [aiMode, isModelLoaded, isModelCached, offlineGenerateText, callCloudAI]);

  const summarize = useCallback(async (text: string): Promise<string> => {
    const maxInputLength = isMobile ? 1000 : 2000;
    const truncatedText = text.length > maxInputLength ? text.slice(0, maxInputLength) + '...' : text;
    const prompt = `Summarize the following text in a clear, concise way. Keep the summary under 200 words:\n\n${truncatedText}`;
    if (aiMode === 'cloud') return callCloudAI(truncatedText, 'summarize');
    if (isModelLoaded || isModelCached) {
      try { return await offlineGenerateText(prompt, 300); }
      catch { return callCloudAI(truncatedText, 'summarize'); }
    }
    return callCloudAI(truncatedText, 'summarize');
  }, [aiMode, isModelLoaded, isModelCached, isMobile, offlineGenerateText, callCloudAI]);

  const answerQuestion = useCallback(async (question: string, noteContext: string): Promise<string> => {
    const maxContextLength = isMobile ? 800 : 1500;
    const truncatedContext = noteContext.length > maxContextLength ? noteContext.slice(0, maxContextLength) + '...' : noteContext;
    const prompt = `Context:\n${truncatedContext}\n\nQuestion: ${question}\n\nProvide a clear, accurate answer based on the context.`;
    if (aiMode === 'cloud') return callCloudAI(prompt);
    if (isModelLoaded || isModelCached) {
      try { return await offlineGenerateText(prompt, 200); }
      catch { return callCloudAI(prompt); }
    }
    return callCloudAI(prompt);
  }, [aiMode, isModelLoaded, isModelCached, isMobile, offlineGenerateText, callCloudAI]);

  const generateFlashcardHint = useCallback(async (front: string, back: string): Promise<string> => {
    const prompt = `Flashcard Question: ${front}\nFlashcard Answer: ${back}\n\nGenerate a helpful hint for the answer without revealing it directly. Keep it very short (1-2 sentences).`;
    if (aiMode === 'cloud') return callCloudAI(prompt);
    if (isModelLoaded || isModelCached) {
      try { return await offlineGenerateText(prompt, 50); }
      catch { return callCloudAI(prompt); }
    }
    return callCloudAI(prompt);
  }, [aiMode, isModelLoaded, isModelCached, offlineGenerateText, callCloudAI]);

  const isAIAvailable = aiMode === 'cloud' || isModelLoaded || isModelCached;

  return {
    ...context, loadModel: context.startDownload, generateText, summarize, answerQuestion, generateFlashcardHint,
    callCloudAI, isCapacitor, isMobile, isAIAvailable, availableModels: AVAILABLE_MODELS,
  };
};

export type { ModelId, DeviceCapabilities, AIMode };
export { AVAILABLE_MODELS };
