import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as webllm from '@mlc-ai/web-llm';

// Device capability detection
export interface DeviceCapabilities {
  supportsWebGPU: boolean;
  gpuVendor: string | null;
  gpuDevice: string | null;
  estimatedMemoryGB: number;
  isMobile: boolean;
  isLowEnd: boolean;
  recommendedModelId: ModelId;
  webGPUError: string | null;
}

// Available models for user selection - using correct WebLLM model IDs
export const AVAILABLE_MODELS = [
  {
    id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    name: "Qwen 0.5B (Lite)",
    description: "Smallest model, works on low-end devices",
    size: "~350MB",
    sizeBytes: 350 * 1024 * 1024,
    minMemoryGB: 2,
    recommended: "Low-end phones & tablets"
  },
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 1B (Standard)",
    description: "Good balance of speed and quality",
    size: "~1.1GB",
    sizeBytes: 1.1 * 1024 * 1024 * 1024,
    minMemoryGB: 4,
    recommended: "Most devices"
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 3B (Pro)",
    description: "Best quality, requires more resources",
    size: "~2.5GB",
    sizeBytes: 2.5 * 1024 * 1024 * 1024,
    minMemoryGB: 6,
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
  cachedModelId: ModelId | null;
  supportsWebGPU: boolean;
  error: string | null;
  modelName: string | null;
  selectedModelId: ModelId;
  isLoading: boolean;
  deviceCapabilities: DeviceCapabilities | null;
  isCheckingDevice: boolean;
  startDownload: (modelId?: ModelId) => Promise<void>;
  cancelDownload: () => void;
  deleteModel: (modelId?: ModelId) => Promise<void>;
  setSelectedModelId: (id: ModelId) => void;
  checkDeviceCapabilities: () => Promise<DeviceCapabilities>;
  engine: webllm.MLCEngine | null;
}

const OfflineAIContext = createContext<OfflineAIContextType | undefined>(undefined);

const DEFAULT_MODEL: ModelId = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";

// Helper to detect device capabilities
async function detectDeviceCapabilities(): Promise<DeviceCapabilities> {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  let supportsWebGPU = false;
  let gpuVendor: string | null = null;
  let gpuDevice: string | null = null;
  let webGPUError: string | null = null;
  
  // Check WebGPU support
  if ('gpu' in navigator) {
    try {
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (adapter) {
        supportsWebGPU = true;
        const info = await adapter.requestAdapterInfo?.();
        if (info) {
          gpuVendor = info.vendor || null;
          gpuDevice = info.device || info.description || null;
        }
      } else {
        webGPUError = "No GPU adapter found. Your browser may not support WebGPU, or your device's GPU may not be compatible.";
      }
    } catch (e: any) {
      webGPUError = e.message || "Failed to initialize WebGPU. Your device may not have a compatible GPU.";
    }
  } else {
    webGPUError = "WebGPU is not supported in this browser. Try Chrome, Edge, or a modern browser on a device with a GPU.";
  }
  
  // Estimate device memory
  let estimatedMemoryGB = 4; // Default assumption
  if ('deviceMemory' in navigator) {
    estimatedMemoryGB = (navigator as any).deviceMemory || 4;
  }
  
  // Determine if low-end device
  const isLowEnd = isMobile || estimatedMemoryGB < 4 || !supportsWebGPU;
  
  // Recommend model based on capabilities
  let recommendedModelId: ModelId = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
  
  if (supportsWebGPU) {
    if (estimatedMemoryGB >= 6 && !isMobile) {
      recommendedModelId = "Llama-3.2-3B-Instruct-q4f16_1-MLC";
    } else if (estimatedMemoryGB >= 4) {
      recommendedModelId = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
    }
  }
  
  return {
    supportsWebGPU,
    gpuVendor,
    gpuDevice,
    estimatedMemoryGB,
    isMobile,
    isLowEnd,
    recommendedModelId,
    webGPUError,
  };
}

export const OfflineAIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModelCached, setIsModelCached] = useState(false);
  const [cachedModelId, setCachedModelId] = useState<ModelId | null>(null);
  const [supportsWebGPU, setSupportsWebGPU] = useState(false);
  const [modelName, setModelName] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<ModelId>(DEFAULT_MODEL);
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities | null>(null);
  const [isCheckingDevice, setIsCheckingDevice] = useState(true);

  const engineRef = useRef<webllm.MLCEngine | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  // Check cache on mount
  const checkCache = useCallback(async () => {
    try {
      for (const model of AVAILABLE_MODELS) {
        const cached = await webllm.hasModelInCache(model.id);
        if (cached) {
          setIsModelCached(true);
          setCachedModelId(model.id);
          setSelectedModelId(model.id);
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

  // Check device capabilities function
  const checkDeviceCapabilities = useCallback(async (): Promise<DeviceCapabilities> => {
    setIsCheckingDevice(true);
    try {
      const capabilities = await detectDeviceCapabilities();
      setDeviceCapabilities(capabilities);
      setSupportsWebGPU(capabilities.supportsWebGPU);
      
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
    // Check device capabilities on mount
    checkDeviceCapabilities();

    // Load saved model preference
    const savedModel = localStorage.getItem('offline_ai_model') as ModelId | null;
    if (savedModel && AVAILABLE_MODELS.some(m => m.id === savedModel)) {
      setSelectedModelId(savedModel);
    }
  }, [checkDeviceCapabilities]);

  const initProgressCallback = useCallback((report: webllm.InitProgressReport) => {
    // Check if cancelled
    if (isCancelledRef.current) {
      throw new Error('Download cancelled');
    }
    
    setProgress(report.progress * 100);
    setProgressText(report.text);

    if (report.progress === 1) {
      setIsDownloading(false);
      setIsLoading(false);
      setIsModelLoaded(true);
      setIsModelCached(true);
      setCachedModelId(selectedModelId);
      
      const model = AVAILABLE_MODELS.find(m => m.id === selectedModelId);
      setModelName(model?.name || selectedModelId);
      
      toast({
        title: "AI Model Ready",
        description: "You can now use the AI Tutor offline!",
      });
    }
  }, [selectedModelId, toast]);

  const startDownload = useCallback(async (modelId?: ModelId) => {
    const targetModel = modelId || selectedModelId;
    
    // Reset cancel flag
    isCancelledRef.current = false;

    // Create new engine instance
    if (!engineRef.current) {
      engineRef.current = new webllm.MLCEngine();
    }

    setIsDownloading(true);
    setIsLoading(true);
    setError(null);
    setProgress(0);
    setProgressText('Initializing...');

    // Save preference
    localStorage.setItem('offline_ai_model', targetModel);
    setSelectedModelId(targetModel);

    try {
      engineRef.current.setInitProgressCallback(initProgressCallback);

      // Use the model ID directly - WebLLM will fetch from its built-in model list
      await engineRef.current.reload(targetModel);

    } catch (err: any) {
      if (err.message === 'Download cancelled' || isCancelledRef.current) {
        console.log('Download cancelled by user');
        setIsDownloading(false);
        setIsLoading(false);
        setProgress(0);
        setProgressText('');
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
  }, [selectedModelId, toast, initProgressCallback]);

  const cancelDownload = useCallback(() => {
    isCancelledRef.current = true;
    
    // Reset engine
    if (engineRef.current) {
      engineRef.current = null;
    }
    
    setIsDownloading(false);
    setIsLoading(false);
    setProgress(0);
    setProgressText('');
    
    toast({
      title: "Download Cancelled",
      description: "The model download was cancelled.",
    });
  }, [toast]);

  const deleteModel = useCallback(async (modelId?: ModelId) => {
    const targetModel = modelId || cachedModelId || selectedModelId;
    
    try {
      // Delete from WebLLM cache
      await webllm.deleteModelInCache(targetModel);
      
      // Reset state
      if (engineRef.current) {
        engineRef.current = null;
      }
      
      setIsModelLoaded(false);
      setIsModelCached(false);
      setCachedModelId(null);
      setModelName(null);
      setProgress(0);
      setProgressText('');
      
      // Remove from localStorage
      localStorage.removeItem('offline_ai_model');
      
      // Re-check cache to update state
      await checkCache();
      
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
  }, [cachedModelId, selectedModelId, toast, checkCache]);

  return (
    <OfflineAIContext.Provider
      value={{
        isDownloading,
        progress,
        progressText,
        isModelLoaded,
        isModelCached,
        cachedModelId,
        supportsWebGPU,
        error,
        modelName,
        selectedModelId,
        isLoading,
        deviceCapabilities,
        isCheckingDevice,
        startDownload,
        cancelDownload,
        deleteModel,
        setSelectedModelId,
        checkDeviceCapabilities,
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
