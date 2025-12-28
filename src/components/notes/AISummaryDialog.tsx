import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { callAI } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';
import { useOfflineAI } from '@/hooks/useOfflineAI';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, BookOpen, Baby, Loader2, Check, FileText } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string | null;
  summary: string | null;
}

interface AISummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note;
  onUpdateSummary: (noteId: string, summary: string) => void;
  onViewNote?: () => void;
}

const AISummaryDialog = ({ open, onOpenChange, note, onUpdateSummary, onViewNote }: AISummaryDialogProps) => {
  const { toast } = useToast();
  const offlineAI = useOfflineAI();
  const { isOnline } = useOfflineSync();
  const [mode, setMode] = useState<'summarize' | 'eli5'>('summarize');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!result || !note.id) return;

    setSaving(true);
    try {
      await supabase
        .from('notes')
        .update({ summary: result })
        .eq('id', note.id);

      onUpdateSummary(note.id, result);
      toast({
        title: 'Summary saved!',
        description: 'Your summary has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save summary.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!note.content) {
      toast({
        title: 'No content',
        description: 'This note has no content to summarize.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setResult('');

    try {
      let response = '';

      const shouldUseOffline = !isOnline || (offlineAI.isModelLoaded && offlineAI.isMobile);

      if (shouldUseOffline) {
        if (!offlineAI.isModelLoaded) {
          throw new Error('Please download the AI model in Settings to use this feature offline.');
        }

        if (mode === 'summarize') {
          response = await offlineAI.summarize(note.content);
        } else {
          // ELI5 mode
          const prompt = `Explain the following text like I'm 5 years old:\n\n${note.content}`;
          response = await offlineAI.generateText(prompt);
        }
      } else {
        // Online mode
        response = await callAI(mode, note.content);
      }

      setResult(response);

      // Auto-save if in summarize mode
      if (mode === 'summarize') {
        onUpdateSummary(note.id, response);

        // If online, update DB directly. If offline, we should ideally queue it.
        // For now, we attempt update. If it fails, user has local result.
        if (isOnline) {
          supabase
            .from('notes')
            .update({ summary: response })
            .eq('id', note.id);
        }
      }
    } catch (error) {
      toast({
        title: 'AI Error',
        description: error instanceof Error ? error.message : 'Failed to generate content',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Study Tools
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Mode Selection */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('summarize')}
              className={`p-4 rounded-xl border text-left transition-all ${mode === 'summarize'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border bg-card hover:bg-muted/50'
                }`}
            >
              <BookOpen className={`w-6 h-6 mb-2 ${mode === 'summarize' ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="font-medium">Summarize</p>
              <p className="text-xs text-muted-foreground">Get key points</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('eli5')}
              className={`p-4 rounded-xl border text-left transition-all ${mode === 'eli5'
                ? 'border-secondary bg-secondary/5 ring-2 ring-secondary/20'
                : 'border-border bg-card hover:bg-muted/50'
                }`}
            >
              <Baby className={`w-6 h-6 mb-2 ${mode === 'eli5' ? 'text-secondary' : 'text-muted-foreground'}`} />
              <p className="font-medium">Explain Like I'm 5</p>
              <p className="text-xs text-muted-foreground">Simple explanation</p>
            </motion.button>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className={`w-full ${mode === 'summarize' ? 'gradient-primary' : 'gradient-secondary'} text-white`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate {mode === 'summarize' ? 'Summary' : 'Explanation'}
                {(!isOnline || (offlineAI.isModelLoaded && offlineAI.isMobile)) && ' (Offline)'}
              </>
            )}
          </Button>

          {/* Result */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-muted/50 border border-border"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success">
                    {mode === 'summarize' ? 'Summary generated!' : 'Here you go!'}
                  </span>
                </div>
                {mode === 'summarize' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="h-7 text-xs"
                  >
                    {saving ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3 mr-1" />
                    )}
                    Save Summary
                  </Button>
                )}
              </div>
              <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </motion.div>
          )}

          {/* Note Preview */}
          <div
            className={`p-3 rounded-lg bg-muted/30 border border-border/50 ${onViewNote ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}`}
            onClick={() => onViewNote?.()}
          >
            <p className="text-xs text-muted-foreground mb-1">From note:</p>
            <p className="text-sm font-medium truncate flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {note.title}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AISummaryDialog;