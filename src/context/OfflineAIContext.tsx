import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as webllm from '@mlc-ai/web-llm';

interface OfflineAIContextType {
    isDownloading: boolean;
    progress: number;
    progressText: string;
    isModelLoaded: boolean;
    isModelCached: boolean;
    supportsWebGPU: boolean;
    error: string | null;
    startDownload: () => Promise<void>;
    pauseDownload: () => void;
    resumeDownload: () => void;
    engine: webllm.MLCEngine | null;
}

const OfflineAIContext = createContext<OfflineAIContextType | undefined>(undefined);

// Use Llama-3.2-1B-Instruct for mobile optimization
const SELECTED_MODEL = "Llama-3.2-1B-Instruct-q4f16_1";

const appConfig: webllm.AppConfig = {
    model_list: [
        {
            "model": "https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC",
            "model_id": "Llama-3.2-1B-Instruct-q4f16_1",
            "model_lib": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0.2.48/Llama-3.2-1B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
            "vram_required_MB": 1073.15,
            "low_resource_required": true,
        }
    ]
};

export const OfflineAIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { toast } = useToast();
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState('');
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModelCached, setIsModelCached] = useState(false);
    const [supportsWebGPU, setSupportsWebGPU] = useState(false);

    // Use a ref to hold the engine instance so it persists across renders
    const engineRef = useRef<webllm.MLCEngine | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Initialize engine on mount
    useEffect(() => {
        // Check WebGPU support
        if ('gpu' in navigator) {
            setSupportsWebGPU(true);
        }

        if (!engineRef.current) {
            engineRef.current = new webllm.MLCEngine();
        }

        // Check if model is already cached
        const checkCache = async () => {
            try {
                const cached = await webllm.hasModelInCache(SELECTED_MODEL);
                setIsModelCached(cached);
                if (cached) {
                    // If cached, we don't auto-load to save memory, but we mark it as available
                    // Actually, for better UX, let's not auto-load until user requests or we are offline
                    // But the previous logic set isModelLoaded = true. 
                    // Let's keep isModelLoaded false until explicitly loaded, but show "Cached" in UI.
                    // WAIT: The previous logic was:
                    // if (cached) { setIsModelLoaded(true); ... }
                    // If we want to avoid auto-loading, we should remove that.
                    // But if we want instant availability, we should keep it.
                    // Given it's 1GB, maybe better to load on demand? 
                    // For now, let's stick to the previous behavior of checking cache but NOT auto-loading fully 
                    // unless we want to.
                    // Actually, webllm.hasModelInCache just checks storage. It doesn't load into RAM.
                    // So isModelLoaded should track RAM status.
                    // Let's change the logic: isModelLoaded is ONLY true when engine.reload() has finished.
                    // So we remove the auto set isModelLoaded(true) here.
                }
            } catch (e) {
                console.error("Error checking cache:", e);
            }
        };

        checkCache();

        return () => {
            // Cleanup if needed
        };
    }, []);

    const initProgressCallback = (report: webllm.InitProgressReport) => {
        setProgress(report.progress * 100);
        setProgressText(report.text);

        if (report.progress === 1) {
            setIsDownloading(false);
            setIsModelLoaded(true);
            setIsModelCached(true);
            toast({
                title: "AI Model Ready",
                description: "You can now use the AI Tutor offline!",
            });
        }
    };

    const startDownload = useCallback(async () => {
        if (!engineRef.current) return;

        setIsDownloading(true);
        setError(null);
        abortControllerRef.current = new AbortController();

        try {
            engineRef.current.setInitProgressCallback(initProgressCallback);

            await engineRef.current.reload(SELECTED_MODEL, { appConfig });

        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.log('Download paused/aborted');
                setIsDownloading(false);
                return;
            }
            console.error("Download error:", err);
            setError(err.message || "Failed to download model");
            setIsDownloading(false);
            toast({
                title: "Download Failed",
                description: err.message || "Could not download the AI model.",
                variant: "destructive",
            });
        }
    }, [toast]);

    const pauseDownload = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsDownloading(false);
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
                startDownload,
                pauseDownload,
                resumeDownload,
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
