import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, FileText, Printer, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { formatAIResponse } from '@/lib/formatters';
import { printMarkdownContent, downloadAsHTML } from '@/components/export/ExportUtils';
import { useSubscription } from '@/hooks/useSubscription';
import FeatureGateDialog from '@/components/subscription/FeatureGateDialog';
import type { GateResult } from '@/hooks/useSubscription';

interface CheatSheetCreatorProps {
  onBack: () => void;
}

const CheatSheetCreator = ({ onBack }: CheatSheetCreatorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { gateFeature, incrementUsage } = useSubscription();
  const [gateData, setGateData] = useState<GateResult | null>(null);
  const [notes, setNotes] = useState<{ id: string; title: string }[]>([]);
  const [cheatSheet, setCheatSheet] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');

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

  const generateCheatSheet = async (noteId: string, noteTitle: string) => {
    const gate = gateFeature('ai');
    if (!gate.allowed) { setGateData(gate); return; }
    await incrementUsage('ai');
    setGenerating(true);
    setSelectedTitle(noteTitle);

    try {
      const { data: note } = await supabase.from('notes').select('content, title').eq('id', noteId).single();
      if (!note?.content) throw new Error('No content');

      await streamAIChat({
        messages: [],
        mode: 'cheatsheet',
        content: note.content,
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
    printMarkdownContent(cheatSheet, `Cheat Sheet: ${selectedTitle}`);
  };

  const handleDownload = () => {
    downloadAsHTML(cheatSheet, `Cheat Sheet: ${selectedTitle}`, `cheatsheet-${selectedTitle.replace(/\s+/g, '-').toLowerCase()}.html`);
    toast({ title: 'Downloaded!', description: 'Open the file in your browser and print to PDF.' });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cheatSheet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-screen pb-24">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-display font-bold text-foreground">Cheat Sheet Creator</h1>
          <p className="text-muted-foreground text-sm">One-page printable study guides</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
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
              onClick={() => generateCheatSheet(note.id, note.title)}
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
          <div className="p-3 bg-muted border-b border-border flex items-center justify-between gap-2">
            <h3 className="font-medium text-sm truncate">{generating ? 'Generating...' : 'Your Cheat Sheet'}</h3>
            {cheatSheet && !generating && (
              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={handleCopy} className="h-7 text-xs px-2">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDownload} className="h-7 text-xs px-2">
                  <Download className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={handlePrint} className="h-7 text-xs">
                  <Printer className="w-3 h-3 mr-1" />
                  Print
                </Button>
              </div>
            )}
          </div>
          <ScrollArea className="h-[60vh]">
            <div className="p-4 overflow-hidden">
              {generating ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-table:border-collapse prose-th:border prose-th:border-border prose-th:p-2 prose-th:bg-muted prose-td:border prose-td:border-border prose-td:p-2 prose-table:w-full prose-table:text-sm">
                  <ReactMarkdown>{formatAIResponse(cheatSheet)}</ReactMarkdown>
                </div>
              )}
            </div>
          </ScrollArea>
          {cheatSheet && !generating && (
            <div className="p-3 border-t border-border">
              <Button onClick={() => { setCheatSheet(''); setSelectedTitle(''); }} variant="outline" className="w-full" size="sm">
                Create Another Cheat Sheet
              </Button>
            </div>
          )}
        </motion.div>
      )}
      <FeatureGateDialog open={!!gateData} onOpenChange={() => setGateData(null)} feature="AI calls" currentUsage={gateData?.currentUsage || 0} limit={gateData?.limit || 0} isLifetime={gateData?.isLifetime} requiredTier={gateData?.requiredTier} />
    </div>
  );
};

export default CheatSheetCreator;
