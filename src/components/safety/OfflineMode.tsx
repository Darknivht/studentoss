import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOfflineAI, AVAILABLE_MODELS } from '@/hooks/useOfflineAI';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Download,
  WifiOff,
  Check,
  Trash2,
  HardDrive,
  BookOpen,
  FileText,
  Brain,
  Cpu,
  Loader2,
  Sparkles,
  X,
  RefreshCw,
  Smartphone,
  Monitor,
  Zap,
  Cloud,
  Wifi,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface StudyPack {
  id: string;
  name: string;
  type: 'notes' | 'flashcards' | 'course';
  size: string;
  downloaded: boolean;
  itemCount: number;
}

const OfflineMode = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const offlineAI = useOfflineAI();
  const [studyPacks, setStudyPacks] = useState<StudyPack[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [storageUsed, setStorageUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [testPrompt, setTestPrompt] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAvailablePacks();
      checkLocalStorage();
    }
  }, [user]);

  const fetchAvailablePacks = async () => {
    try {
      const { data: courses } = await supabase
        .from('courses')
        .select('id, name')
        .eq('user_id', user?.id);

      const { data: notes } = await supabase
        .from('notes')
        .select('id, course_id')
        .eq('user_id', user?.id);

      const { data: flashcards } = await supabase
        .from('flashcards')
        .select('id, course_id')
        .eq('user_id', user?.id);

      const packs: StudyPack[] = [];

      courses?.forEach((course) => {
        const courseNotes = notes?.filter((n) => n.course_id === course.id).length || 0;
        const courseCards = flashcards?.filter((f) => f.course_id === course.id).length || 0;

        if (courseNotes > 0 || courseCards > 0) {
          packs.push({
            id: course.id,
            name: course.name,
            type: 'course',
            size: `${Math.round((courseNotes * 50 + courseCards * 5) / 1024 * 100) / 100} MB`,
            downloaded: checkIfDownloaded(course.id),
            itemCount: courseNotes + courseCards,
          });
        }
      });

      if (notes && notes.length > 0) {
        packs.unshift({
          id: 'all-notes',
          name: 'All Notes',
          type: 'notes',
          size: `${Math.round(notes.length * 50 / 1024 * 100) / 100} MB`,
          downloaded: checkIfDownloaded('all-notes'),
          itemCount: notes.length,
        });
      }

      if (flashcards && flashcards.length > 0) {
        packs.unshift({
          id: 'all-flashcards',
          name: 'All Flashcards',
          type: 'flashcards',
          size: `${Math.round(flashcards.length * 5 / 1024 * 100) / 100} MB`,
          downloaded: checkIfDownloaded('all-flashcards'),
          itemCount: flashcards.length,
        });
      }

      setStudyPacks(packs);
    } catch (error) {
      console.error('Error fetching packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfDownloaded = (packId: string): boolean => {
    try {
      return localStorage.getItem(`offline_pack_${packId}`) !== null;
    } catch {
      return false;
    }
  };

  const checkLocalStorage = () => {
    try {
      let total = 0;
      for (const key in localStorage) {
        if (key.startsWith('offline_')) {
          total += localStorage.getItem(key)?.length || 0;
        }
      }
      setStorageUsed(Math.round(total / 1024 / 1024 * 100) / 100);
    } catch {
      setStorageUsed(0);
    }
  };

  const downloadPack = async (pack: StudyPack) => {
    setDownloading(pack.id);
    setProgress(0);

    try {
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setProgress(i);
      }

      let data: any = null;

      if (pack.type === 'notes' || pack.id === 'all-notes') {
        const { data: notes } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user?.id);
        data = notes;
      } else if (pack.type === 'flashcards' || pack.id === 'all-flashcards') {
        const { data: flashcards } = await supabase
          .from('flashcards')
          .select('*')
          .eq('user_id', user?.id);
        data = flashcards;
      } else {
        const { data: notes } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user?.id)
          .eq('course_id', pack.id);

        const { data: flashcards } = await supabase
          .from('flashcards')
          .select('*')
          .eq('user_id', user?.id)
          .eq('course_id', pack.id);

        data = { notes, flashcards };
      }

      localStorage.setItem(`offline_pack_${pack.id}`, JSON.stringify(data));

      setStudyPacks((prev) =>
        prev.map((p) => (p.id === pack.id ? { ...p, downloaded: true } : p))
      );

      checkLocalStorage();

      toast({
        title: '✅ Downloaded!',
        description: `${pack.name} is now available offline.`,
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        variant: 'destructive',
      });
    } finally {
      setDownloading(null);
      setProgress(0);
    }
  };

  const deletePack = (packId: string) => {
    localStorage.removeItem(`offline_pack_${packId}`);
    setStudyPacks((prev) =>
      prev.map((p) => (p.id === packId ? { ...p, downloaded: false } : p))
    );
    checkLocalStorage();
    toast({ title: 'Pack removed from offline storage' });
  };

  const getPackIcon = (type: string) => {
    switch (type) {
      case 'notes':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'flashcards':
        return <Brain className="w-5 h-5 text-purple-500" />;
      default:
        return <BookOpen className="w-5 h-5 text-green-500" />;
    }
  };

  const handleLoadAI = async () => {
    await offlineAI.loadModel();
  };

  const handleTestAI = async () => {
    if (!testPrompt.trim()) return;

    setIsTesting(true);
    setTestResponse('');

    try {
      const response = await offlineAI.generateText(testPrompt);
      setTestResponse(response);
    } catch (error: any) {
      toast({
        title: 'AI Error',
        description: error.message || 'Failed to generate response',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getQualityStars = (quality: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-3 h-3 ${i < Math.ceil(quality / 2) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`}
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Storage Info */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <HardDrive className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Offline Storage</h3>
            <p className="text-sm text-muted-foreground">
              {storageUsed} MB used
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
          <WifiOff className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Download study packs and AI models to access them without internet. Perfect for studying on the go!
          </p>
        </div>
      </Card>

      {/* AI Assistant Section */}
      <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
            {offlineAI.aiMode === 'cloud' ? (
              <Cloud className="w-6 h-6 text-purple-500" />
            ) : (
              <Cpu className="w-6 h-6 text-purple-500" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">AI Assistant</h3>
            <p className="text-sm text-muted-foreground">
              {offlineAI.aiMode === 'cloud'
                ? 'Using Cloud AI (requires internet)'
                : offlineAI.isModelLoaded || offlineAI.isModelCached
                  ? `Offline: ${offlineAI.modelName}`
                  : 'Download AI model for offline use'}
            </p>
          </div>
          {/* Device indicator */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {offlineAI.isMobile ? (
              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                Mobile
              </span>
            ) : (
              <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 flex items-center gap-1">
                <Monitor className="w-3 h-3" />
                Desktop
              </span>
            )}
          </div>
        </div>

        {/* AI Mode Toggle */}
        <div className="mb-4 p-4 bg-background/50 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-3">
            <Label htmlFor="ai-mode" className="text-sm font-medium">AI Mode</Label>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${offlineAI.aiMode === 'cloud' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                <Cloud className="w-3 h-3 inline mr-1" />
                Cloud
              </span>
              <Switch
                id="ai-mode"
                checked={offlineAI.aiMode === 'offline'}
                onCheckedChange={(checked) => offlineAI.setAIMode(checked ? 'offline' : 'cloud')}
              />
              <span className={`text-xs ${offlineAI.aiMode === 'offline' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                <WifiOff className="w-3 h-3 inline mr-1" />
                Offline
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className={`p-3 rounded-lg border ${offlineAI.aiMode === 'cloud' ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Cloud className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-foreground">Cloud AI</span>
              </div>
              <ul className="text-muted-foreground space-y-0.5">
                <li>• Most powerful models</li>
                <li>• No download needed</li>
                <li>• Requires internet</li>
              </ul>
            </div>
            <div className={`p-3 rounded-lg border ${offlineAI.aiMode === 'offline' ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'}`}>
              <div className="flex items-center gap-2 mb-1">
                <WifiOff className="w-4 h-4 text-green-500" />
                <span className="font-medium text-foreground">Offline AI</span>
              </div>
              <ul className="text-muted-foreground space-y-0.5">
                <li>• Works anywhere</li>
                <li>• Privacy-focused</li>
                <li>• One-time download</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Cloud AI Test Section */}
        {offlineAI.aiMode === 'cloud' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span>Cloud AI is ready to use!</span>
            </div>

            <div className="p-3 bg-background/50 rounded-lg border border-border space-y-3">
              <textarea
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Ask a study question..."
                className="w-full p-3 rounded-xl bg-background border border-border text-foreground text-sm resize-none h-20"
              />
              <Button
                onClick={handleTestAI}
                disabled={isTesting || !testPrompt.trim()}
                className="w-full"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4 mr-2" />
                    Ask Cloud AI
                  </>
                )}
              </Button>

              {testResponse && (
                <div className="p-3 bg-muted rounded-xl">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{testResponse}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Offline AI Section */}
        {offlineAI.aiMode === 'offline' && (
          <div className="space-y-4">
            {/* Device Capabilities */}
            {offlineAI.isCheckingDevice ? (
              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Detecting device capabilities...</span>
                </div>
              </div>
            ) : offlineAI.deviceCapabilities && (
              <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Device Info</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => offlineAI.checkDeviceCapabilities()}
                    className="h-7 px-2"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span className="text-muted-foreground">
                      {offlineAI.deviceCapabilities.supportsWasm ? 'WebAssembly Ready' : 'Limited Support'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      ~{offlineAI.deviceCapabilities.estimatedMemoryGB}GB RAM
                    </span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <Monitor className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {offlineAI.deviceCapabilities.browserName}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Model Status */}
            {offlineAI.isModelCached && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{offlineAI.modelName}</p>
                      <p className="text-xs text-muted-foreground">Downloaded & ready to use</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => offlineAI.deleteModel()}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Download Progress */}
            {offlineAI.isDownloading && (
              <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm font-medium text-foreground">Downloading Model</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => offlineAI.cancelDownload()}
                    className="h-7 px-2 text-red-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <Progress value={offlineAI.progress} className="h-2" />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{offlineAI.progressText}</span>
                  <span>{Math.round(offlineAI.progress)}%</span>
                </div>

                {offlineAI.totalBytes > 0 && (
                  <div className="text-xs text-muted-foreground text-center">
                    {formatBytes(offlineAI.downloadedBytes)} / {formatBytes(offlineAI.totalBytes)}
                  </div>
                )}
              </div>
            )}

            {/* Model Selection */}
            {!offlineAI.isModelCached && !offlineAI.isDownloading && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select AI Model</Label>
                  <p className="text-xs text-muted-foreground">
                    Choose a model based on your device. Larger models are smarter but need more storage.
                  </p>
                </div>

                <div className="space-y-2">
                  {AVAILABLE_MODELS.map((model) => {
                    const isRecommended = offlineAI.deviceCapabilities?.recommendedModelId === model.id;
                    const isSelected = offlineAI.selectedModelId === model.id;
                    const memoryOk = (offlineAI.deviceCapabilities?.estimatedMemoryGB || 4) >= model.minMemoryGB;

                    return (
                      <button
                        key={model.id}
                        onClick={() => offlineAI.setSelectedModelId(model.id)}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-background hover:border-primary/50'
                        } ${!memoryOk ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-foreground">{model.name}</span>
                              {isRecommended && (
                                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{model.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <HardDrive className="w-3 h-3" />
                                {model.size}
                              </span>
                              <span className="flex items-center gap-0.5">
                                {getQualityStars(model.quality)}
                              </span>
                            </div>
                            {!memoryOk && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-orange-500">
                                <AlertCircle className="w-3 h-3" />
                                Requires {model.minMemoryGB}GB+ RAM
                              </div>
                            )}
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <Button
                  onClick={handleLoadAI}
                  className="w-full"
                  size="lg"
                  disabled={offlineAI.isDownloading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download {AVAILABLE_MODELS.find(m => m.id === offlineAI.selectedModelId)?.name}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  ⚡ Uses ONNX Runtime - works on all devices including mobile!
                </p>
              </div>
            )}

            {/* Test Offline AI */}
            {(offlineAI.isModelLoaded || offlineAI.isModelCached) && !offlineAI.isDownloading && (
              <div className="p-3 bg-background/50 rounded-lg border border-border space-y-3">
                <Label className="text-sm font-medium">Test Offline AI</Label>
                <textarea
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  placeholder="Ask a study question..."
                  className="w-full p-3 rounded-xl bg-background border border-border text-foreground text-sm resize-none h-20"
                />
                <Button
                  onClick={handleTestAI}
                  disabled={isTesting || !testPrompt.trim()}
                  className="w-full"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Ask Offline AI
                    </>
                  )}
                </Button>

                {testResponse && (
                  <div className="p-3 bg-muted rounded-xl">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{testResponse}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Study Packs Section */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Study Packs</h3>
        {studyPacks.length === 0 ? (
          <Card className="p-6 bg-card border-border text-center">
            <p className="text-muted-foreground text-sm">
              No study packs available yet. Create some notes or flashcards first!
            </p>
          </Card>
        ) : (
          studyPacks.map((pack) => (
            <Card
              key={pack.id}
              className="p-4 bg-card border-border"
            >
              <div className="flex items-center gap-3">
                {getPackIcon(pack.type)}
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{pack.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {pack.itemCount} items • {pack.size}
                  </p>
                </div>

                {downloading === pack.id ? (
                  <div className="w-24">
                    <Progress value={progress} className="h-2" />
                  </div>
                ) : pack.downloaded ? (
                  <div className="flex gap-2">
                    <span className="text-xs text-green-500 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Saved
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePack(pack.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadPack(pack)}
                    className="h-8"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default OfflineMode;
