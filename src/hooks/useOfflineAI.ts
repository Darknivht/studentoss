import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineAIState {
  isLoading: boolean;
  isModelLoaded: boolean;
  modelName: string | null;
  progress: number;
  error: string | null;
  deviceType: 'mobile' | 'desktop' | 'unknown';
  supportsWebGPU: boolean;
  modelCached: boolean;
}

type PipelineType = 'text-generation' | 'text2text-generation' | 'summarization' | 'question-answering';

// Check if running in Capacitor (native mobile)
const isCapacitor = (): boolean => {
  return typeof (window as any).Capacitor !== 'undefined';
};

// Check if mobile device
const isMobileDevice = (): boolean => {
  if (isCapacitor()) return true;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Check WebGPU support
const checkWebGPUSupport = async (): Promise<boolean> => {
  if (typeof navigator === 'undefined') return false;
  if (!('gpu' in navigator)) return false;
  try {
    const adapter = await (navigator as any).gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
};

// Check if model is cached in browser storage
const checkModelCached = (modelId: string): boolean => {
  try {
    // Check IndexedDB for cached model files
    return localStorage.getItem(`offline_model_${modelId}_cached`) === 'true';
  } catch {
    return false;
  }
};

export const useOfflineAI = () => {
  const { toast } = useToast();
  const [state, setState] = useState<OfflineAIState>({
    isLoading: false,
    isModelLoaded: false,
    modelName: null,
    progress: 0,
    error: null,
    deviceType: 'unknown',
    supportsWebGPU: false,
    modelCached: false,
  });
  
  const pipelineRef = useRef<any>(null);
  const loadingRef = useRef(false);

  // Detect device capabilities on mount
  useEffect(() => {
    const detectCapabilities = async () => {
      const deviceType = isMobileDevice() ? 'mobile' : 'desktop';
      const supportsWebGPU = await checkWebGPUSupport();
      const modelCached = checkModelCached('Xenova/LaMini-Flan-T5-77M');
      
      setState(prev => ({
        ...prev,
        deviceType,
        supportsWebGPU,
        modelCached,
      }));
    };
    
    detectCapabilities();
  }, []);

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
      const isMobile = isMobileDevice();
      const deviceInfo = isMobile ? '📱 Mobile' : '💻 Desktop';
      
      toast({
        title: `🧠 Loading Offline AI (${deviceInfo})`,
        description: 'Downloading model for offline use...',
      });

      // Dynamically import to reduce bundle size
      const { pipeline, env } = await import('@huggingface/transformers');

      setState(prev => ({ ...prev, progress: 10 }));

      // Configure for mobile optimization
      // Use WASM backend for better mobile compatibility
      env.backends.onnx.wasm.numThreads = isMobile ? 1 : 4;
      
      // Allow local model caching
      env.allowLocalModels = true;
      env.useBrowserCache = true;

      setState(prev => ({ ...prev, progress: 20 }));

      // Determine device configuration
      // Mobile devices use 'wasm' for better compatibility
      // Desktop can try 'webgpu' if available
      const supportsWebGPU = await checkWebGPUSupport();
      const device = supportsWebGPU && !isMobile ? 'webgpu' : 'wasm';
      
      console.log(`[Offline AI] Loading model with device: ${device}, mobile: ${isMobile}`);

      setState(prev => ({ ...prev, progress: 30 }));

      // Load the pipeline with progress tracking
      pipelineRef.current = await pipeline(task, modelId, {
        device: device as any,
        progress_callback: (progress: any) => {
          if (progress.progress) {
            const pct = Math.min(30 + Math.round(progress.progress * 0.65), 95);
            setState(prev => ({ ...prev, progress: pct }));
          }
        },
      });

      // Mark model as cached
      try {
        localStorage.setItem(`offline_model_${modelId}_cached`, 'true');
      } catch {}

      setState({
        isLoading: false,
        isModelLoaded: true,
        modelName: modelId,
        progress: 100,
        error: null,
        deviceType: isMobile ? 'mobile' : 'desktop',
        supportsWebGPU,
        modelCached: true,
      });

      toast({
        title: '✅ Offline AI Ready',
        description: isMobile 
          ? 'AI works offline on your mobile device!' 
          : 'You can now use AI features without internet!',
      });

      loadingRef.current = false;
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load model';
      console.error('[Offline AI] Load error:', error);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        progress: 0,
      }));

      toast({
        title: 'Failed to load offline AI',
        description: isMobileDevice() 
          ? 'Try on a stable WiFi connection first'
          : errorMessage,
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
      // Reduce max tokens on mobile for faster response
      const isMobile = isMobileDevice();
      const adjustedMaxLength = isMobile ? Math.min(maxLength, 100) : maxLength;
      
      const result = await pipelineRef.current(prompt, {
        max_new_tokens: adjustedMaxLength,
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
      // Truncate input for mobile to avoid memory issues
      const isMobile = isMobileDevice();
      const maxInputLength = isMobile ? 500 : 1000;
      const truncatedText = text.length > maxInputLength 
        ? text.slice(0, maxInputLength) + '...' 
        : text;
      
      const prompt = `Summarize: ${truncatedText}`;
      const result = await pipelineRef.current(prompt, {
        max_new_tokens: isMobile ? 75 : 100,
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
      // Truncate context for mobile
      const isMobile = isMobileDevice();
      const maxContextLength = isMobile ? 300 : 600;
      const truncatedContext = context.length > maxContextLength 
        ? context.slice(0, maxContextLength) + '...' 
        : context;
      
      const prompt = `Answer the question based on the context.\n\nContext: ${truncatedContext}\n\nQuestion: ${question}\n\nAnswer:`;
      const result = await pipelineRef.current(prompt, {
        max_new_tokens: isMobile ? 75 : 100,
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
    setState(prev => ({
      ...prev,
      isLoading: false,
      isModelLoaded: false,
      modelName: null,
      progress: 0,
      error: null,
    }));
  }, []);

  const clearModelCache = useCallback(() => {
    try {
      // Clear the cached flag
      const keys = Object.keys(localStorage).filter(k => k.startsWith('offline_model_'));
      keys.forEach(k => localStorage.removeItem(k));
      
      setState(prev => ({ ...prev, modelCached: false }));
      
      toast({
        title: 'Cache Cleared',
        description: 'AI model cache has been cleared. Re-download needed for offline use.',
      });
    } catch (error) {
      console.error('Failed to clear model cache:', error);
    }
  }, [toast]);

  return {
    ...state,
    loadModel,
    generateText,
    summarize,
    answerQuestion,
    generateFlashcardHint,
    unloadModel,
    clearModelCache,
    isCapacitor: isCapacitor(),
    isMobile: isMobileDevice(),
  };
};
