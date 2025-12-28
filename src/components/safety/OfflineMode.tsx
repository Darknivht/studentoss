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
  RefreshCw
} from 'lucide-react';

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
    if (!testPrompt.trim() || !offlineAI.isModelLoaded) return;

    setIsTesting(true);
    setTestResponse('');

    try {
      const response = await offlineAI.generateText(testPrompt);
      setTestResponse(response);
    } catch (error) {
      toast({
        title: 'AI Error',
        description: 'Failed to generate response',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
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
            Download study packs to access them without internet. Perfect for studying on the go!
          </p>
        </div>
      </Card>

      {/* Offline AI Section */}
      <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Cpu className="w-6 h-6 text-purple-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Offline AI Assistant</h3>
            <p className="text-sm text-muted-foreground">
              {offlineAI.isModelLoaded
                ? `Model loaded: ${offlineAI.modelName}`
                : 'Download AI model to use without internet'}
            </p>
          </div>
          {/* Device indicator */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {offlineAI.isMobile ? (
              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">Mobile</span>
            ) : (
              <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">Desktop</span>
            )}
          </div>
        </div>

        {/* Capacitor/Mobile specific info */}
        {offlineAI.isMobile && !offlineAI.isModelLoaded && !offlineAI.isLoading && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-start gap-2">
              <span className="text-amber-500">📱</span>
              <div className="text-sm">
                <p className="font-medium text-amber-600 dark:text-amber-400">Mobile Device Detected</p>
                <p className="text-muted-foreground mt-1">
                  {offlineAI.isCapacitor
                    ? 'Running as native app. AI will work offline after download.'
                    : 'AI model works in mobile browsers. Download on WiFi for best results.'}
                </p>
              </div>
            </div>
          </div>
        )}


        {offlineAI.isDownloading ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Downloading AI model...</span>
              </div>
              <span className="font-medium text-foreground">{Math.round(offlineAI.progress)}%</span>
            </div>
            <Progress value={offlineAI.progress} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {offlineAI.progressText || 'This may take a while. Please stay on this page.'}
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={offlineAI.cancelDownload}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel Download
            </Button>
          </div>
        ) : offlineAI.isModelLoaded ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-green-500">
                <Check className="w-4 h-4" />
                <span>AI ready for offline use!</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-500 text-xs">WebGPU</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => offlineAI.deleteModel()}
                  className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
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
                    {offlineAI.isMobile ? 'Processing...' : 'Thinking...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Ask Offline AI
                  </>
                )}
              </Button>

              {testResponse && (
                <div className="p-3 bg-muted rounded-xl">
                  <p className="text-sm text-foreground">{testResponse}</p>
                </div>
              )}
            </div>
          </div>
        ) : offlineAI.isModelCached ? (
          /* Cached model - show load or delete options */
          <div className="space-y-4">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Check className="w-4 h-4" />
                  <span>Model downloaded: {AVAILABLE_MODELS.find(m => m.id === offlineAI.cachedModelId)?.name}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => offlineAI.startDownload()} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Load Model
              </Button>
              <Button
                variant="outline"
                onClick={() => offlineAI.deleteModel()}
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              Or download a different model below
            </p>
            
            {/* Model Selection for switching */}
            <div className="space-y-2">
              <Select
                value={offlineAI.selectedModelId}
                onValueChange={(value) => offlineAI.setSelectedModelId(value as any)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a different model" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-muted-foreground">{model.size} • {model.recommended}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Select Model</label>
              <Select
                value={offlineAI.selectedModelId}
                onValueChange={(value) => offlineAI.setSelectedModelId(value as any)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a model" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-muted-foreground">{model.size} • {model.recommended}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Selected model info */}
              {(() => {
                const selected = AVAILABLE_MODELS.find(m => m.id === offlineAI.selectedModelId);
                return selected ? (
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    <p className="font-medium text-foreground">{selected.name}</p>
                    <p className="text-muted-foreground">{selected.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Size: {selected.size}</p>
                  </div>
                ) : null;
              })()}
            </div>

            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Answer complex study questions</li>
              <li>• Summarize notes with high accuracy</li>
              <li>• Generate flashcard hints</li>
              <li>• Explain difficult concepts</li>
              {offlineAI.isMobile && <li>• Works offline on your phone</li>}
            </ul>
            
            <Button onClick={() => offlineAI.startDownload()} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              {offlineAI.progress > 0 ? 'Resume Download' : 'Download Offline AI Model'}
            </Button>
            
            {offlineAI.error && (
              <p className="text-xs text-destructive">{offlineAI.error}</p>
            )}
          </div>
        )}
      </Card>

      {/* Study Packs */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Available Study Packs</h3>

        {studyPacks.length === 0 ? (
          <Card className="p-8 bg-card border-border text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No study packs available yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create notes or flashcards to enable offline mode
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {studyPacks.map((pack) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="p-4 bg-card border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        {getPackIcon(pack.type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{pack.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{pack.itemCount} items</span>
                          <span>•</span>
                          <span>{pack.size}</span>
                        </div>
                      </div>
                    </div>

                    {downloading === pack.id ? (
                      <div className="w-24">
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1 text-center">
                          {progress}%
                        </p>
                      </div>
                    ) : pack.downloaded ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-500 flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          Saved
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deletePack(pack.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadPack(pack)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default OfflineMode;
