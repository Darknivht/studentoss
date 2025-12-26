import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineAIState {
  isLoading: boolean;
  isModelLoaded: boolean;
  modelName: string | null;
  progress: number;
  error: string | null;
}

type PipelineType = 'text-generation' | 'text2text-generation' | 'summarization' | 'question-answering';

export const useOfflineAI = () => {
  const { toast } = useToast();
  const [state, setState] = useState<OfflineAIState>({
    isLoading: false,
    isModelLoaded: false,
    modelName: null,
    progress: 0,
    error: null,
  });
  
  const pipelineRef = useRef<any>(null);
  const loadingRef = useRef(false);

  const loadModel = useCallback(async (
    task: PipelineType = 'text2text-generation',
    modelId: string = 'Xenova/LaMini-Flan-T5-77M'
  ) => {
    if (loadingRef.current || pipelineRef.current) {
      return true;
    }

    loadingRef.current = true;
    setState(prev => ({ ...prev, isLoading: true, progress: 0, error: null }));

    try {
      toast({
        title: '🧠 Loading Offline AI',
        description: 'Downloading model for offline use...',
      });

      // Dynamically import to reduce bundle size
      const { pipeline } = await import('@huggingface/transformers');

      setState(prev => ({ ...prev, progress: 30 }));

      // Load the pipeline with progress tracking
      pipelineRef.current = await pipeline(task, modelId, {
        progress_callback: (progress: any) => {
          if (progress.progress) {
            setState(prev => ({ 
              ...prev, 
              progress: Math.min(30 + Math.round(progress.progress * 0.7), 99) 
            }));
          }
        },
      });

      setState({
        isLoading: false,
        isModelLoaded: true,
        modelName: modelId,
        progress: 100,
        error: null,
      });

      toast({
        title: '✅ Offline AI Ready',
        description: 'You can now use AI features without internet!',
      });

      loadingRef.current = false;
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load model';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        progress: 0,
      }));

      toast({
        title: 'Failed to load offline AI',
        description: errorMessage,
        variant: 'destructive',
      });

      loadingRef.current = false;
      return false;
    }
  }, [toast]);

  const generateText = useCallback(async (prompt: string, maxLength: number = 150): Promise<string> => {
    if (!pipelineRef.current) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    try {
      const result = await pipelineRef.current(prompt, {
        max_new_tokens: maxLength,
        do_sample: true,
        temperature: 0.7,
      });

      if (Array.isArray(result) && result.length > 0) {
        return result[0].generated_text || result[0].text || '';
      }
      return '';
    } catch (error) {
      console.error('Offline AI generation error:', error);
      throw error;
    }
  }, []);

  const summarize = useCallback(async (text: string): Promise<string> => {
    if (!pipelineRef.current) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    try {
      const prompt = `Summarize: ${text}`;
      const result = await pipelineRef.current(prompt, {
        max_new_tokens: 100,
      });

      if (Array.isArray(result) && result.length > 0) {
        return result[0].generated_text || result[0].summary_text || '';
      }
      return '';
    } catch (error) {
      console.error('Offline summarization error:', error);
      throw error;
    }
  }, []);

  const answerQuestion = useCallback(async (question: string, context: string): Promise<string> => {
    if (!pipelineRef.current) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    try {
      const prompt = `Answer the question based on the context.\n\nContext: ${context}\n\nQuestion: ${question}\n\nAnswer:`;
      const result = await pipelineRef.current(prompt, {
        max_new_tokens: 100,
      });

      if (Array.isArray(result) && result.length > 0) {
        return result[0].generated_text || '';
      }
      return '';
    } catch (error) {
      console.error('Offline QA error:', error);
      throw error;
    }
  }, []);

  const generateFlashcardHint = useCallback(async (front: string, back: string): Promise<string> => {
    if (!pipelineRef.current) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    try {
      const prompt = `Give a hint for this flashcard without revealing the answer.\n\nQuestion: ${front}\nAnswer: ${back}\n\nHint:`;
      const result = await pipelineRef.current(prompt, {
        max_new_tokens: 50,
      });

      if (Array.isArray(result) && result.length > 0) {
        return result[0].generated_text || '';
      }
      return '';
    } catch (error) {
      console.error('Offline hint generation error:', error);
      throw error;
    }
  }, []);

  const unloadModel = useCallback(() => {
    pipelineRef.current = null;
    setState({
      isLoading: false,
      isModelLoaded: false,
      modelName: null,
      progress: 0,
      error: null,
    });
  }, []);

  return {
    ...state,
    loadModel,
    generateText,
    summarize,
    answerQuestion,
    generateFlashcardHint,
    unloadModel,
  };
};
