import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { callAI } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, BookOpen, Baby, Loader2, Check } from 'lucide-react';

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
}

const AISummaryDialog = ({ open, onOpenChange, note, onUpdateSummary }: AISummaryDialogProps) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<'summarize' | 'eli5'>('summarize');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

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
      const response = await callAI(mode, note.content);
      setResult(response);

      // Save summary to database if in summarize mode
      if (mode === 'summarize') {
        await supabase
          .from('notes')
          .update({ summary: response })
          .eq('id', note.id);
        
        onUpdateSummary(note.id, response);
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
              className={`p-4 rounded-xl border text-left transition-all ${
                mode === 'summarize'
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
              className={`p-4 rounded-xl border text-left transition-all ${
                mode === 'eli5'
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
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-success">
                  {mode === 'summarize' ? 'Summary saved!' : 'Here you go!'}
                </span>
              </div>
              <div className="prose prose-sm max-w-none text-foreground">
                <p className="whitespace-pre-wrap text-sm">{result}</p>
              </div>
            </motion.div>
          )}

          {/* Note Preview */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">From note:</p>
            <p className="text-sm font-medium truncate">{note.title}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AISummaryDialog;