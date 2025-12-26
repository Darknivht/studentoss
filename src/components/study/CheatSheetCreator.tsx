import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, FileText, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CheatSheetCreatorProps {
  onBack: () => void;
}

const CheatSheetCreator = ({ onBack }: CheatSheetCreatorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<{ id: string; title: string }[]>([]);
  const [cheatSheet, setCheatSheet] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) fetchNotes();
  }, [user]);

  const fetchNotes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notes')
      .select('id, title')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotes(data || []);
    setLoading(false);
  };

  const generateCheatSheet = async (noteId: string) => {
    setGenerating(true);
    setCheatSheet('');

    try {
      const { data: note } = await supabase.from('notes').select('content, title').eq('id', noteId).single();
      if (!note?.content) throw new Error('No content');

      await streamAIChat({
        messages: [],
        mode: 'chat',
        content: `Create a one-page CHEAT SHEET from these notes. Make it:
- Ultra-condensed (fit on one printed page)
- Use bullet points, abbreviations
- Include key formulas, definitions, dates
- Use columns/sections for different topics
- Perfect for quick reference during exams

Format in clean markdown that prints well.

Notes to condense:
${note.content}`,
        onDelta: (chunk) => setCheatSheet(c => c + chunk),
        onDone: () => setGenerating(false),
        onError: (err) => {
          toast({ title: 'Error', description: err, variant: 'destructive' });
          setGenerating(false);
        },
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate cheat sheet', variant: 'destructive' });
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cheat Sheet</title>
            <style>
              body { font-family: Arial, sans-serif; font-size: 10px; padding: 20px; line-height: 1.3; }
              h1 { font-size: 14px; margin-bottom: 10px; }
              h2 { font-size: 12px; margin: 8px 0 4px; }
              ul { margin: 4px 0; padding-left: 16px; }
              li { margin: 2px 0; }
              pre { white-space: pre-wrap; font-size: 10px; }
            </style>
          </head>
          <body>
            <pre>${cheatSheet}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">Cheat Sheet Creator</h1>
          <p className="text-muted-foreground text-sm">One-page printable study guides</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
      </motion.header>

      {!cheatSheet && !generating && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Select a note:</h3>
          {notes.map((note) => (
            <motion.button
              key={note.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => generateCheatSheet(note.id)}
              className="w-full p-4 rounded-2xl bg-card border border-border text-left hover:border-primary/50 transition-all"
            >
              <span className="font-medium text-foreground">{note.title}</span>
            </motion.button>
          ))}
          {notes.length === 0 && !loading && (
            <p className="text-center text-muted-foreground py-8">No notes yet. Create notes first!</p>
          )}
        </div>
      )}

      {(generating || cheatSheet) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="p-3 bg-muted border-b border-border flex items-center justify-between">
            <h3 className="font-medium text-sm">{generating ? 'Generating...' : 'Your Cheat Sheet'}</h3>
            {cheatSheet && !generating && (
              <Button size="sm" variant="outline" onClick={handlePrint} className="h-7 text-xs">
                <Printer className="w-3 h-3 mr-1" />
                Print
              </Button>
            )}
          </div>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-4">
              {generating ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">{cheatSheet}</pre>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </div>
  );
};

export default CheatSheetCreator;