import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { pipeline, env } from '@huggingface/transformers';
import type { TextGenerationPipeline } from '@huggingface/transformers';

// Configure transformers.js for browser/mobile usage
env.allowLocalModels = false;
env.useBrowserCache = true;

// Device capability detection
export interface DeviceCapabilities {
  estimatedMemoryGB: number;
  isMobile: boolean;
  isLowEnd: boolean;
  recommendedModelId: ModelId;
  supportsWasm: boolean;
  browserName: string;
}

// Available models optimized for mobile with ONNX Runtime (works everywhere!)
// Using publicly accessible ONNX models - no authentication required
export const AVAILABLE_MODELS = [
  {
    id: "onnx-community/Llama-3.2-1B-Instruct-ONNX",
    name: "Llama 3.2 1B (Recommended)",
    description: "Meta's latest compact model - very smart!",
    size: "~1GB",
    sizeBytes: 1 * 1024 * 1024 * 1024,
    minMemoryGB: 3,
    recommended: "Most mobile devices",
    quality: 8,
  },
  {
    id: "onnx-community/Llama-3.2-3B-Instruct-ONNX",
    name: "Llama 3.2 3B (Best)",
    description: "Smartest small model, excellent reasoning",
    size: "~2GB",
    sizeBytes: 2 * 1024 * 1024 * 1024,
    minMemoryGB: 6,
    recommended: "High-end devices",
    quality: 10,
  },
  {
    id: "Xenova/Qwen1.5-0.5B-Chat",
    name: "Qwen 1.5 0.5B (Fast)",
    description: "Ultra-compact for low-end devices",
    size: "~350MB",
    sizeBytes: 350 * 1024 * 1024,
    minMemoryGB: 2,
    recommended: "Low-end mobile",
    quality: 3,
  },
  {
    id: "Xenova/Phi-2",
    name: "Phi-2 (Balanced)",
    description: "Microsoft's efficient reasoning model",
    size: "~1.5GB",
    sizeBytes: 1.5 * 1024 * 1024 * 1024,
    minMemoryGB: 4,
    recommended: "Mid-range devices",
    quality: 7,
  },
] as const;

export type ModelId = typeof AVAILABLE_MODELS[number]['id'];

// AI Mode - offline (local model) or cloud (Lovable AI)
export type AIMode = 'offline' | 'cloud';

interface DownloadProgress {
  status: 'initiate' | 'download' | 'progress' | 'done' | 'ready';
  name?: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
}

interface OfflineAIContextType {
  isDownloading: boolean;
  progress: number;
  progressText: string;
  downloadedBytes: number;
  totalBytes: number;
  isModelLoaded: boolean;
  isModelCached: boolean;
  cachedModelId: ModelId | null;
  error: string | null;
  modelName: string | null;
  selectedModelId: ModelId;
  isLoading: boolean;
  deviceCapabilities: DeviceCapabilities | null;
  isCheckingDevice: boolean;
  aiMode: AIMode;
  setAIMode: (mode: AIMode) => void;
  startDownload: (modelId?: ModelId) => Promise<void>;
  cancelDownload: () => void;
  deleteModel: (modelId?: ModelId) => Promise<void>;
  setSelectedModelId: (id: ModelId) => void;
  checkDeviceCapabilities: () => Promise<DeviceCapabilities>;
  generateText: (prompt: string, maxTokens?: number) => Promise<string>;
}

const OfflineAIContext = createContext<OfflineAIContextType | undefined>(undefined);

const DEFAULT_MODEL: ModelId = "onnx-community/Llama-3.2-1B-Instruct-ONNX";
const CACHE_KEY = 'offline_ai_cached_model_v2'; // Cache bust for model update

// Helper to detect device capabilities
async function detectDeviceCapabilities(): Promise<DeviceCapabilities> {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Detect browser
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  if (ua.includes('Chrome')) browserName = 'Chrome';
  else if (ua.includes('Firefox')) browserName = 'Firefox';
  else if (ua.includes('Safari')) browserName = 'Safari';
  else if (ua.includes('Edge')) browserName = 'Edge';

  // WebAssembly is widely supported
  const supportsWasm = typeof WebAssembly !== 'undefined';

  // Estimate device memory
  let estimatedMemoryGB = 4;
  if ('deviceMemory' in navigator) {
    estimatedMemoryGB = (navigator as any).deviceMemory || 4;
  }

  // On iOS, estimate based on device
  if (/iPhone|iPad|iPod/.test(ua)) {
    // Modern iPhones have 4-6GB, iPads up to 16GB
    estimatedMemoryGB = isMobile ? 4 : 6;
  }

  // Determine if low-end device
  const isLowEnd = estimatedMemoryGB < 4;

  // Recommend model based on capabilities
  let recommendedModelId: ModelId = "Xenova/Qwen1.5-0.5B-Chat";

  if (estimatedMemoryGB >= 6 && !isMobile) {
    recommendedModelId = "onnx-community/Llama-3.2-3B-Instruct-ONNX";
  } else if (estimatedMemoryGB >= 3) {
    recommendedModelId = "onnx-community/Llama-3.2-1B-Instruct-ONNX";
  } else if (estimatedMemoryGB >= 2) {
    recommendedModelId = "Xenova/Qwen1.5-0.5B-Chat";
  }

  return {
    estimatedMemoryGB,
    isMobile,
    isLowEnd,
    recommendedModelId,
    supportsWasm,
    browserName,
  };
}

// Check if model is cached in IndexedDB
async function isModelCached(modelId: string): Promise<boolean> {
  try {
    // Check localStorage for our tracking
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached === modelId) {
      // Also verify through cache API if available
      if ('caches' in window) {
        const cache = await caches.open('transformers-cache');
        const keys = await cache.keys();
        // If we have any cached files for this model, consider it cached
        return keys.some(k => k.url.includes(modelId.split('/')[1]));
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error("Error checking model cache:", e);
    return false;
  }
}

export const OfflineAIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModelCachedState, setIsModelCached] = useState(false);
  const [cachedModelId, setCachedModelId] = useState<ModelId | null>(null);
  const [modelName, setModelName] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<ModelId>(DEFAULT_MODEL);
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities | null>(null);
  const [isCheckingDevice, setIsCheckingDevice] = useState(true);
  const [aiMode, setAIMode] = useState<AIMode>('cloud');

  const pipelineRef = useRef<TextGenerationPipeline | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check cache on mount
  const checkCache = useCallback(async () => {
    try {
      for (const model of AVAILABLE_MODELS) {
        const cached = await isModelCached(model.id);
        if (cached) {
          setIsModelCached(true);
          setCachedModelId(model.id);
          setSelectedModelId(model.id);
          const modelInfo = AVAILABLE_MODELS.find(m => m.id === model.id);
          setModelName(modelInfo?.name || model.id);
          return model.id;
        }
      }
      setIsModelCached(false);
      setCachedModelId(null);
      return null;
    } catch (e) {
      console.error("Error checking cache:", e);
      return null;
    }
  }, []);

  // Check device capabilities
  const checkDeviceCapabilities = useCallback(async (): Promise<DeviceCapabilities> => {
    setIsCheckingDevice(true);
    try {
      const capabilities = await detectDeviceCapabilities();
      setDeviceCapabilities(capabilities);

      // Auto-select recommended model if no cached model
      const cachedModel = await checkCache();
      if (!cachedModel) {
        setSelectedModelId(capabilities.recommendedModelId);
      }

      return capabilities;
    } finally {
      setIsCheckingDevice(false);
    }
  }, [checkCache]);

  useEffect(() => {
    checkDeviceCapabilities();

    // Load saved model preference
    const savedModel = localStorage.getItem('offline_ai_model') as ModelId | null;
    if (savedModel && AVAILABLE_MODELS.some(m => m.id === savedModel)) {
      setSelectedModelId(savedModel);
    }
  }, [checkDeviceCapabilities]);

  // Progress callback for transformers.js
  const progressCallback = useCallback((data: DownloadProgress) => {
    if (isCancelledRef.current) return;

    if (data.status === 'initiate') {
      setProgressText(`Preparing ${data.file || 'model'}...`);
    } else if (data.status === 'download') {
      setProgressText(`Downloading ${data.file || 'model'}...`);
    } else if (data.status === 'progress' && data.progress !== undefined) {
      setProgress(data.progress);
      if (data.loaded && data.total) {
        setDownloadedBytes(data.loaded);
        setTotalBytes(data.total);
        const mb = (data.loaded / 1024 / 1024).toFixed(1);
        const totalMb = (data.total / 1024 / 1024).toFixed(1);
        setProgressText(`Downloading: ${mb}MB / ${totalMb}MB`);
      }
    } else if (data.status === 'done') {
      setProgressText(`Loaded ${data.file || 'component'}`);
    } else if (data.status === 'ready') {
      setProgress(100);
      setProgressText('Model ready!');
    }
  }, []);

  const startDownload = useCallback(async (modelId?: ModelId) => {
    const targetModel = modelId || selectedModelId;

    // Reset state
    isCancelledRef.current = false;
    abortControllerRef.current = new AbortController();

    setIsDownloading(true);
    setIsLoading(true);
    setError(null);
    setProgress(0);
    setProgressText('Initializing...');
    setDownloadedBytes(0);
    setTotalBytes(0);

    // Save preference
    localStorage.setItem('offline_ai_model', targetModel);
    setSelectedModelId(targetModel);

    try {
      console.log(`Starting download for model: ${targetModel}`);

      // Create the text generation pipeline
      // This will download the model if not cached
      const pipe = await pipeline(
        'text-generation',
        targetModel,
        {
          progress_callback: progressCallback,
          // Use quantized model for better mobile performance
          dtype: 'q4',
        }
      );

      if (isCancelledRef.current) {
        console.log('Download was cancelled');
        return;
      }

      pipelineRef.current = pipe;
      
      // Mark as cached
      localStorage.setItem(CACHE_KEY, targetModel);

      setIsDownloading(false);
      setIsLoading(false);
      setIsModelLoaded(true);
      setIsModelCached(true);
      setCachedModelId(targetModel);

      const model = AVAILABLE_MODELS.find(m => m.id === targetModel);
      setModelName(model?.name || targetModel);

      toast({
        title: "AI Model Ready! 🧠",
        description: "You can now use AI offline without internet!",
      });

    } catch (err: any) {
      if (isCancelledRef.current) {
        console.log('Download cancelled by user');
        setIsDownloading(false);
        setIsLoading(false);
        setProgress(0);
        setProgressText('');
        return;
      }

      console.error("Download error:", err);
      const errorMsg = err.message || "Failed to download model";
      setError(errorMsg);
      setIsDownloading(false);
      setIsLoading(false);

      toast({
        title: "Download Failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  }, [selectedModelId, toast, progressCallback]);

  const cancelDownload = useCallback(() => {
    isCancelledRef.current = true;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    pipelineRef.current = null;

    setIsDownloading(false);
    setIsLoading(false);
    setProgress(0);
    setProgressText('');
    setDownloadedBytes(0);
    setTotalBytes(0);

    toast({
      title: "Download Cancelled",
      description: "The model download was cancelled.",
    });
  }, [toast]);

  const deleteModel = useCallback(async (modelId?: ModelId) => {
    const targetModel = modelId || cachedModelId || selectedModelId;

    try {
      // Clear from cache API
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          if (name.includes('transformers') || name.includes('huggingface')) {
            await caches.delete(name);
          }
        }
      }

      // Clear IndexedDB
      const databases = await indexedDB.databases?.() || [];
      for (const db of databases) {
        if (db.name && (db.name.includes('transformers') || db.name.includes('huggingface') || db.name.includes('onnx'))) {
          indexedDB.deleteDatabase(db.name);
        }
      }

      // Reset state
      pipelineRef.current = null;
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem('offline_ai_model');

      setIsModelLoaded(false);
      setIsModelCached(false);
      setCachedModelId(null);
      setModelName(null);
      setProgress(0);
      setProgressText('');

      toast({
        title: "Model Deleted",
        description: "The AI model has been removed from your device.",
      });
    } catch (err: any) {
      console.error("Delete error:", err);
      toast({
        title: "Delete Failed",
        description: err.message || "Could not delete the model.",
        variant: "destructive",
      });
    }
  }, [cachedModelId, selectedModelId, toast]);

  // Generate text using the loaded model
  const generateText = useCallback(async (prompt: string, maxTokens: number = 256): Promise<string> => {
    if (!pipelineRef.current) {
      // Try to load the cached model
      if (cachedModelId) {
        setIsLoading(true);
        try {
          const pipe = await pipeline('text-generation', cachedModelId, {
            dtype: 'q4',
          });
          pipelineRef.current = pipe;
          setIsModelLoaded(true);
        } catch (e) {
          setIsLoading(false);
          throw new Error('Model not loaded. Please download it first.');
        }
        setIsLoading(false);
      } else {
        throw new Error('No model loaded. Please download an AI model first.');
      }
    }

    try {
      // Format prompt based on model type
      const isLlama = cachedModelId?.includes('Llama');
      const formattedPrompt = isLlama 
        ? `<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n${prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`
        : `<|user|>\n${prompt}\n<|assistant|>\n`;

      const result = await pipelineRef.current(formattedPrompt, {
        max_new_tokens: maxTokens,
        temperature: 0.7,
        top_p: 0.9,
        do_sample: true,
        return_full_text: false,
      });

      // Extract generated text - handle various output formats
      if (Array.isArray(result) && result.length > 0) {
        const firstResult = result[0] as any;
        if (typeof firstResult === 'string') {
          return firstResult.trim();
        }
        if (firstResult?.generated_text) {
          return String(firstResult.generated_text).trim();
        }
      }
      
      if (typeof result === 'string') {
        return (result as string).trim();
      }

      // Fallback: stringify the result
      return JSON.stringify(result);
    } catch (err: any) {
      console.error('Generation error:', err);
      throw new Error(err.message || 'Failed to generate text');
    }
  }, [cachedModelId]);

  return (
    <OfflineAIContext.Provider
      value={{
        isDownloading,
        progress,
        progressText,
        downloadedBytes,
        totalBytes,
        isModelLoaded,
        isModelCached: isModelCachedState,
        cachedModelId,
        error,
        modelName,
        selectedModelId,
        isLoading,
        deviceCapabilities,
        isCheckingDevice,
        aiMode,
        setAIMode,
        startDownload,
        cancelDownload,
        deleteModel,
        setSelectedModelId,
        checkDeviceCapabilities,
        generateText,
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
