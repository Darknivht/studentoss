import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { pipeline, env } from '@huggingface/transformers';
import type { TextGenerationPipeline } from '@huggingface/transformers';
import { useBackgroundDownload } from '@/hooks/useBackgroundDownload';

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

// Track individual file progress for accurate overall tracking
interface FileProgress {
  file: string;
  loaded: number;
  total: number;
  done: boolean;
}

interface DownloadProgress {
  status: 'initiate' | 'download' | 'progress' | 'done' | 'ready';
  name?: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
}

// Download state tracking for resume capability
interface DownloadState {
  modelId: string;
  startedAt: number;
  filesProgress: Record<string, { loaded: number; total: number; done: boolean }>;
  totalBytes: number;
  downloadedBytes: number;
}

const DOWNLOAD_STATE_KEY = 'offline_ai_download_state';

// Save download state for resume capability
function saveDownloadState(state: DownloadState) {
  try {
    localStorage.setItem(DOWNLOAD_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save download state:', e);
  }
}

// Load download state for resume
function loadDownloadState(): DownloadState | null {
  try {
    const saved = localStorage.getItem(DOWNLOAD_STATE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

// Clear download state
function clearDownloadState() {
  try {
    localStorage.removeItem(DOWNLOAD_STATE_KEY);
  } catch {
    // Ignore
  }
}

interface OfflineAIContextType {
  isDownloading: boolean;
  isBackgroundDownloading: boolean;
  progress: number;
  progressText: string;
  downloadedBytes: number;
  totalBytes: number;
  currentFile: string;
  filesCompleted: number;
  totalFiles: number;
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
  canResume: boolean;
  supportsBackgroundDownload: boolean;
  setAIMode: (mode: AIMode) => void;
  startDownload: (modelId?: ModelId) => Promise<void>;
  resumeDownload: () => Promise<void>;
  cancelDownload: () => void;
  deleteModel: (modelId?: ModelId) => Promise<void>;
  setSelectedModelId: (id: ModelId) => void;
  checkDeviceCapabilities: () => Promise<DeviceCapabilities>;
  generateText: (prompt: string, maxTokens?: number) => Promise<string>;
}

const OfflineAIContext = createContext<OfflineAIContextType | undefined>(undefined);

const DEFAULT_MODEL: ModelId = "onnx-community/Llama-3.2-1B-Instruct-ONNX";
const CACHE_KEY = 'offline_ai_cached_model_v3'; // Cache bust for download continuity update

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
  const backgroundDownload = useBackgroundDownload();
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [filesCompleted, setFilesCompleted] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [canResume, setCanResume] = useState(false);
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
  const [isBackgroundDownloading, setIsBackgroundDownloading] = useState(false);

  const pipelineRef = useRef<TextGenerationPipeline | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Track per-file progress for accurate overall calculation
  const filesProgressRef = useRef<Map<string, FileProgress>>(new Map());
  const downloadStateRef = useRef<DownloadState | null>(null);

  // Check for resumable download on mount
  useEffect(() => {
    const savedState = loadDownloadState();
    if (savedState && !isModelCachedState) {
      // Check if it was interrupted (more than 30 seconds old without completion)
      const isInterrupted = Date.now() - savedState.startedAt > 30000;
      if (isInterrupted && savedState.downloadedBytes < savedState.totalBytes) {
        setCanResume(true);
        setSelectedModelId(savedState.modelId as ModelId);
        setDownloadedBytes(savedState.downloadedBytes);
        setTotalBytes(savedState.totalBytes);
        downloadStateRef.current = savedState;
      } else {
        clearDownloadState();
      }
    }
  }, [isModelCachedState]);

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
          clearDownloadState(); // Clear any pending download state
          setCanResume(false);
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

  // Format bytes helper
  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Enhanced progress callback for transformers.js with per-file tracking + background notifications
  const progressCallback = useCallback((data: DownloadProgress) => {
    if (isCancelledRef.current) return;

    const fileName = data.file || 'model';
    const modelInfo = AVAILABLE_MODELS.find(m => m.id === selectedModelId);
    const currentModelName = modelInfo?.name || selectedModelId;

    if (data.status === 'initiate') {
      setCurrentFile(fileName);
      setProgressText(`Preparing ${fileName}...`);
      
      // Initialize file tracking
      if (!filesProgressRef.current.has(fileName)) {
        filesProgressRef.current.set(fileName, {
          file: fileName,
          loaded: 0,
          total: 0,
          done: false,
        });
        setTotalFiles(prev => prev + 1);
      }
    } else if (data.status === 'download') {
      setCurrentFile(fileName);
      setProgressText(`Starting download: ${fileName}`);
    } else if (data.status === 'progress' && data.progress !== undefined) {
      const fileProgress = filesProgressRef.current.get(fileName);
      if (fileProgress && data.loaded !== undefined && data.total !== undefined) {
        fileProgress.loaded = data.loaded;
        fileProgress.total = data.total;
        filesProgressRef.current.set(fileName, fileProgress);
      }

      // Calculate total progress across all files
      let totalLoaded = 0;
      let totalSize = 0;
      filesProgressRef.current.forEach((fp) => {
        totalLoaded += fp.loaded;
        totalSize += fp.total;
      });

      setDownloadedBytes(totalLoaded);
      setTotalBytes(totalSize);

      // Calculate overall percentage
      const overallProgress = totalSize > 0 ? (totalLoaded / totalSize) * 100 : 0;
      setProgress(overallProgress);

      // Update progress text with accurate MB/GB display
      setCurrentFile(fileName);
      setProgressText(`${formatBytes(totalLoaded)} / ${formatBytes(totalSize)} (${overallProgress.toFixed(1)}%)`);

      // Save download state for resume capability
      if (downloadStateRef.current) {
        downloadStateRef.current.downloadedBytes = totalLoaded;
        downloadStateRef.current.totalBytes = totalSize;
        downloadStateRef.current.filesProgress = Object.fromEntries(
          Array.from(filesProgressRef.current.entries()).map(([k, v]) => [k, { loaded: v.loaded, total: v.total, done: v.done }])
        );
        saveDownloadState(downloadStateRef.current);
      }

      // Update background notification (shows in notification drawer on mobile)
      backgroundDownload.saveDownloadState({
        isActive: true,
        modelName: currentModelName,
        progress: overallProgress,
        downloadedBytes: totalLoaded,
        totalBytes: totalSize,
      });

      // Show notification when app is in background or always on native
      if (backgroundDownload.isNative) {
        backgroundDownload.showProgressNotification(
          currentModelName,
          overallProgress,
          totalLoaded,
          totalSize
        );
      }
    } else if (data.status === 'done') {
      const fileProgress = filesProgressRef.current.get(fileName);
      if (fileProgress) {
        fileProgress.done = true;
        filesProgressRef.current.set(fileName, fileProgress);
      }
      setFilesCompleted(prev => prev + 1);
      setProgressText(`Completed: ${fileName}`);
    } else if (data.status === 'ready') {
      setProgress(100);
      setProgressText('Model ready!');
      clearDownloadState();
      setCanResume(false);
      
      // Show completion notification
      if (backgroundDownload.isNative) {
        backgroundDownload.showCompletionNotification(currentModelName, true);
      }
    }
  }, [formatBytes, selectedModelId, backgroundDownload]);

  const startDownload = useCallback(async (modelId?: ModelId) => {
    const targetModel = modelId || selectedModelId;

    // Reset state
    isCancelledRef.current = false;
    abortControllerRef.current = new AbortController();
    filesProgressRef.current = new Map();

    setIsDownloading(true);
    setIsLoading(true);
    setError(null);
    setProgress(0);
    setProgressText('Initializing...');
    setDownloadedBytes(0);
    setTotalBytes(0);
    setCurrentFile('');
    setFilesCompleted(0);
    setTotalFiles(0);
    setCanResume(false);

    // Save preference
    localStorage.setItem('offline_ai_model', targetModel);
    setSelectedModelId(targetModel);

    // Initialize download state for resume capability
    const modelInfo = AVAILABLE_MODELS.find(m => m.id === targetModel);
    downloadStateRef.current = {
      modelId: targetModel,
      startedAt: Date.now(),
      filesProgress: {},
      totalBytes: modelInfo?.sizeBytes || 0,
      downloadedBytes: 0,
    };
    saveDownloadState(downloadStateRef.current);

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
      clearDownloadState();

      setIsDownloading(false);
      setIsLoading(false);
      setIsModelLoaded(true);
      setIsModelCached(true);
      setCachedModelId(targetModel);
      setCanResume(false);

      const model = AVAILABLE_MODELS.find(m => m.id === targetModel);
      setModelName(model?.name || targetModel);

      toast({
        title: "AI Model Ready! 🧠",
        description: "You can now use AI offline without internet!",
      });

      // Ensure background notification shows completion
      if (backgroundDownload.isNative) {
        const model = AVAILABLE_MODELS.find(m => m.id === targetModel);
        backgroundDownload.showCompletionNotification(model?.name || targetModel, true);
      }
    } catch (err: any) {
      if (isCancelledRef.current) {
        console.log('Download cancelled by user');
        // Keep download state for resume capability
        setIsDownloading(false);
        setIsLoading(false);
        setProgress(0);
        setProgressText('Download paused - can be resumed');
        setCanResume(true);
        return;
      }

      console.error("Download error:", err);
      const errorMsg = err.message || "Failed to download model";
      setError(errorMsg);
      setIsDownloading(false);
      setIsLoading(false);

      // Check if it's a network error that can be resumed
      if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('abort')) {
        setCanResume(true);
        toast({
          title: "Download Interrupted",
          description: "You can resume the download when you're ready.",
        });
      } else {
        clearDownloadState();
        setCanResume(false);
        
        // Show failure notification
        if (backgroundDownload.isNative) {
          const model = AVAILABLE_MODELS.find(m => m.id === targetModel);
          backgroundDownload.showCompletionNotification(model?.name || targetModel, false);
        }
        
        toast({
          title: "Download Failed",
          description: errorMsg,
          variant: "destructive",
        });
      }
    }
  }, [selectedModelId, toast, progressCallback, backgroundDownload]);

  // Resume a previously interrupted download
  const resumeDownload = useCallback(async () => {
    const savedState = downloadStateRef.current || loadDownloadState();
    if (!savedState) {
      toast({
        title: "Cannot Resume",
        description: "No interrupted download found.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Resuming Download",
      description: "Continuing from where you left off...",
    });

    // Start download with the saved model - transformers.js will use cached files
    await startDownload(savedState.modelId as ModelId);
  }, [startDownload, toast]);

  const cancelDownload = useCallback(() => {
    isCancelledRef.current = true;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    pipelineRef.current = null;

    setIsDownloading(false);
    setIsLoading(false);
    setIsBackgroundDownloading(false);
    
    // Cancel background notification
    backgroundDownload.cancelNotification();
    
    // Preserve some state for resume capability
    const hadProgress = downloadedBytes > 0;
    if (hadProgress) {
      setCanResume(true);
      setProgressText('Download paused - tap Resume to continue');
      toast({
        title: "Download Paused",
        description: "You can resume the download anytime.",
      });
    } else {
      setProgress(0);
      setProgressText('');
      setDownloadedBytes(0);
      setTotalBytes(0);
      setCurrentFile('');
      setFilesCompleted(0);
      setTotalFiles(0);
      clearDownloadState();
      setCanResume(false);
      toast({
        title: "Download Cancelled",
        description: "The model download was cancelled.",
      });
    }
  }, [downloadedBytes, toast, backgroundDownload]);

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
        isBackgroundDownloading,
        progress,
        progressText,
        downloadedBytes,
        totalBytes,
        currentFile,
        filesCompleted,
        totalFiles,
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
        canResume,
        supportsBackgroundDownload: backgroundDownload.isNative,
        setAIMode,
        startDownload,
        resumeDownload,
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
