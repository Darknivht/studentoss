import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as webllm from '@mlc-ai/web-llm';

// Available models for user selection
export const AVAILABLE_MODELS = [
  {
    id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    name: "Qwen 0.5B (Lite)",
    description: "Smallest model, works on low-end devices",
    size: "~350MB",
    recommended: "Low-end phones & tablets"
  },
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 1B (Standard)",
    description: "Good balance of speed and quality",
    size: "~1.1GB",
    recommended: "Most devices"
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 3B (Pro)",
    description: "Best quality, requires more resources",
    size: "~2.5GB",
    recommended: "High-end devices"
  }
] as const;

export type ModelId = typeof AVAILABLE_MODELS[number]['id'];

interface OfflineAIContextType {
  isDownloading: boolean;
  progress: number;
  progressText: string;
  isModelLoaded: boolean;
  isModelCached: boolean;
  supportsWebGPU: boolean;
  error: string | null;
  modelName: string | null;
  selectedModelId: ModelId;
  isLoading: boolean;
  startDownload: (modelId?: ModelId) => Promise<void>;
  pauseDownload: () => void;
  resumeDownload: () => void;
  setSelectedModelId: (id: ModelId) => void;
  engine: webllm.MLCEngine | null;
}

const OfflineAIContext = createContext<OfflineAIContextType | undefined>(undefined);

const DEFAULT_MODEL: ModelId = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

export const OfflineAIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModelCached, setIsModelCached] = useState(false);
  const [supportsWebGPU, setSupportsWebGPU] = useState(false);
  const [modelName, setModelName] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<ModelId>(DEFAULT_MODEL);

  const engineRef = useRef<webllm.MLCEngine | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Check WebGPU support
    if ('gpu' in navigator) {
      setSupportsWebGPU(true);
    }

    // Load saved model preference
    const savedModel = localStorage.getItem('offline_ai_model') as ModelId | null;
    if (savedModel && AVAILABLE_MODELS.some(m => m.id === savedModel)) {
      setSelectedModelId(savedModel);
    }

    // Check if any model is already cached
    const checkCache = async () => {
      try {
        for (const model of AVAILABLE_MODELS) {
          const cached = await webllm.hasModelInCache(model.id);
          if (cached) {
            setIsModelCached(true);
            setSelectedModelId(model.id);
            break;
          }
        }
      } catch (e) {
        console.error("Error checking cache:", e);
      }
    };

    checkCache();
  }, []);

  const initProgressCallback = (report: webllm.InitProgressReport) => {
    setProgress(report.progress * 100);
    setProgressText(report.text);

    if (report.progress === 1) {
      setIsDownloading(false);
      setIsLoading(false);
      setIsModelLoaded(true);
      setIsModelCached(true);
      
      const model = AVAILABLE_MODELS.find(m => m.id === selectedModelId);
      setModelName(model?.name || selectedModelId);
      
      toast({
        title: "AI Model Ready",
        description: "You can now use the AI Tutor offline!",
      });
    }
  };

  const startDownload = useCallback(async (modelId?: ModelId) => {
    const targetModel = modelId || selectedModelId;
    
    // Create new engine instance
    if (!engineRef.current) {
      engineRef.current = new webllm.MLCEngine();
    }

    setIsDownloading(true);
    setIsLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    // Save preference
    localStorage.setItem('offline_ai_model', targetModel);
    setSelectedModelId(targetModel);

    try {
      engineRef.current.setInitProgressCallback(initProgressCallback);

      // Use the model ID directly - WebLLM will fetch from its built-in model list
      await engineRef.current.reload(targetModel);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Download paused/aborted');
        setIsDownloading(false);
        setIsLoading(false);
        return;
      }
      console.error("Download error:", err);
      setError(err.message || "Failed to download model");
      setIsDownloading(false);
      setIsLoading(false);
      toast({
        title: "Download Failed",
        description: err.message || "Could not download the AI model.",
        variant: "destructive",
      });
    }
  }, [selectedModelId, toast]);

  const pauseDownload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsDownloading(false);
      setIsLoading(false);
      toast({
        title: "Download Paused",
        description: "You can resume later.",
      });
    }
  }, [toast]);

  const resumeDownload = useCallback(() => {
    startDownload();
  }, [startDownload]);

  return (
    <OfflineAIContext.Provider
      value={{
        isDownloading,
        progress,
        progressText,
        isModelLoaded,
        isModelCached,
        supportsWebGPU,
        error,
        modelName,
        selectedModelId,
        isLoading,
        startDownload,
        pauseDownload,
        resumeDownload,
        setSelectedModelId,
        engine: engineRef.current,
      }}
    >
      {children}
    </OfflineAIContext.Provider>
  );
};

export const useOfflineAIContext = () => {
  const context = useContext(OfflineAIContext);
  if (context === undefined) {
    throw new Error('useOfflineAIContext must be used within an OfflineAIProvider');
  }
  return context;
};
