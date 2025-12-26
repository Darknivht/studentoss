import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  Brain
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
  const [studyPacks, setStudyPacks] = useState<StudyPack[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [storageUsed, setStorageUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAvailablePacks();
      checkLocalStorage();
    }
  }, [user]);

  const fetchAvailablePacks = async () => {
    try {
      // Fetch user's courses
      const { data: courses } = await supabase
        .from('courses')
        .select('id, name')
        .eq('user_id', user?.id);

      // Fetch notes count per course
      const { data: notes } = await supabase
        .from('notes')
        .select('id, course_id')
        .eq('user_id', user?.id);

      // Fetch flashcards count
      const { data: flashcards } = await supabase
        .from('flashcards')
        .select('id, course_id')
        .eq('user_id', user?.id);

      const packs: StudyPack[] = [];

      // Create packs for each course
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

      // Add all notes pack
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

      // Add all flashcards pack
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
      // Simulate download with progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setProgress(i);
      }

      // Fetch and store data based on pack type
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
        // Course pack
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

      // Store in localStorage
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

      {/* Offline AI Info */}
      <Card className="p-4 bg-amber-500/10 border-amber-500/20">
        <div className="flex items-start gap-3">
          <Brain className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground font-medium">Offline AI Mode</p>
            <p className="text-xs text-muted-foreground mt-1">
              Basic AI features like flashcard review work offline. Advanced features require internet.
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default OfflineMode;
