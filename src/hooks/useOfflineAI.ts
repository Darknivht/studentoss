import { useCallback } from 'react';
import { useOfflineAIContext, AVAILABLE_MODELS, ModelId } from '@/context/OfflineAIContext';
import { useToast } from '@/hooks/use-toast';

export const useOfflineAI = () => {
  const { toast } = useToast();
  const context = useOfflineAIContext();
  const { engine, isModelLoaded } = context;

  // Check if running in Capacitor (native mobile)
  const isCapacitor = typeof (window as any).Capacitor !== 'undefined';

  // Check if mobile device
  const isMobile = isCapacitor || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const generateText = useCallback(async (prompt: string, maxLength: number = 250): Promise<string> => {
    if (!engine || !isModelLoaded) {
      throw new Error('Model not loaded. Please download the offline model in Settings.');
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
      throw error;
    }
  }, [engine, isModelLoaded]);

  const summarize = useCallback(async (text: string): Promise<string> => {
    if (!engine || !isModelLoaded) {
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
      throw error;
    }
  }, [engine, isModelLoaded, isMobile]);

  const answerQuestion = useCallback(async (question: string, context: string): Promise<string> => {
    if (!engine || !isModelLoaded) {
      throw new Error('Model not loaded.');
    }

    try {
      const maxContextLength = isMobile ? 800 : 1500;
      const truncatedContext = context.length > maxContextLength
        ? context.slice(0, maxContextLength) + '...'
        : context;

      const prompt = `Context:\n${truncatedContext}\n\nQuestion: ${question}\n\nAnswer the question based on the context provided.`;

      const reply = await engine.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      });

      return reply.choices[0]?.message?.content || "";
    } catch (error) {
      console.error('Offline QA error:', error);
      throw error;
    }
  }, [engine, isModelLoaded, isMobile]);

  const generateFlashcardHint = useCallback(async (front: string, back: string): Promise<string> => {
    if (!engine || !isModelLoaded) {
      throw new Error('Model not loaded.');
    }

    try {
      const prompt = `Flashcard Question: ${front}\nFlashcard Answer: ${back}\n\nGenerate a helpful hint for the answer without revealing it directly. Keep it short.`;

      const reply = await engine.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        max_tokens: 50,
        temperature: 0.8,
      });

      return reply.choices[0]?.message?.content || "";
    } catch (error) {
      console.error('Offline hint generation error:', error);
      throw error;
    }
  }, [engine, isModelLoaded]);

  return {
    ...context,
    loadModel: context.startDownload,
    generateText,
    summarize,
    answerQuestion,
    generateFlashcardHint,
    isCapacitor,
    isMobile,
    availableModels: AVAILABLE_MODELS,
  };
};

export type { ModelId };
export { AVAILABLE_MODELS };
