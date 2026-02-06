import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, BookOpen, Plus, Trash2, Copy, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { formatAIResponse } from '@/lib/formatters';

interface Source {
  id: string;
  details: string;
}

interface BibliographyBuilderProps {
  onBack: () => void;
}

const BibliographyBuilder = ({ onBack }: BibliographyBuilderProps) => {
  const { toast } = useToast();
  const [style, setStyle] = useState('apa');
  const [sources, setSources] = useState<Source[]>([{ id: '1', details: '' }]);
  const [bibliography, setBibliography] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const addSource = () => {
    setSources([...sources, { id: Date.now().toString(), details: '' }]);
  };

  const removeSource = (id: string) => {
    if (sources.length > 1) {
      setSources(sources.filter(s => s.id !== id));
    }
  };

  const updateSource = (id: string, details: string) => {
    setSources(sources.map(s => s.id === id ? { ...s, details } : s));
  };

  const validSources = sources.filter(s => s.details.trim());

  const generateBibliography = async () => {
    if (validSources.length === 0) {
      toast({ title: 'Sources required', description: 'Add at least one source with details.', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    setBibliography('');

    await streamAIChat({
      messages: [],
      mode: 'chat',
      content: `Create a properly formatted ${style.toUpperCase()} bibliography/reference list from these sources.

Sources:
${validSources.map((s, i) => `${i + 1}. ${s.details}`).join('\n')}

Rules:
- Format each citation correctly for ${style.toUpperCase()}
- Sort alphabetically by author's last name
- Use hanging indent format
- Include all necessary elements (author, date, title, source, URL/DOI if applicable)
- If information is missing, note what would be needed

Output the formatted bibliography in markdown, ready to copy-paste.`,
      onDelta: (chunk) => setBibliography(b => b + chunk),
      onDone: () => setLoading(false),
      onError: (err) => {
        toast({ title: 'Error', description: err, variant: 'destructive' });
        setLoading(false);
      },
    });
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(bibliography);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied!', description: 'Bibliography copied to clipboard.' });
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-screen pb-24">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">Bibliography Builder</h1>
          <p className="text-muted-foreground text-sm">Compile reference lists</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
      </motion.header>

      {!bibliography && !loading && (
        <>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Citation Style</label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="apa">APA 7th Edition</SelectItem>
                <SelectItem value="mla">MLA 9th Edition</SelectItem>
                <SelectItem value="chicago">Chicago/Turabian</SelectItem>
                <SelectItem value="harvard">Harvard</SelectItem>
                <SelectItem value="ieee">IEEE</SelectItem>
                <SelectItem value="vancouver">Vancouver</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Sources ({validSources.length} of {sources.length})
              </label>
              <Button size="sm" variant="outline" onClick={addSource} className="h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Add Source
              </Button>
            </div>
            
            {sources.map((source, i) => (
              <div key={source.id} className="flex gap-2">
                <Textarea
                  value={source.details}
                  onChange={(e) => updateSource(source.id, e.target.value)}
                  placeholder={`Source ${i + 1}: Author, Title, Year, Publisher, URL/DOI...`}
                  className="flex-1 min-h-[60px]"
                />
                {sources.length > 1 && (
                  <Button size="icon" variant="ghost" onClick={() => removeSource(source.id)} className="shrink-0 self-start">
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button 
            onClick={generateBibliography} 
            disabled={loading || validSources.length === 0} 
            className="w-full gradient-primary text-primary-foreground"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Generate Bibliography ({validSources.length} source{validSources.length !== 1 ? 's' : ''})
          </Button>
        </>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Formatting bibliography...</p>
        </div>
      )}

      {bibliography && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="p-3 bg-muted border-b border-border flex items-center justify-between">
              <h3 className="font-medium text-sm">Bibliography ({style.toUpperCase()})</h3>
              <Button size="sm" variant="ghost" onClick={copyToClipboard} className="h-7">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
            <ScrollArea className="h-[40vh]">
              <div className="p-4 overflow-hidden">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{formatAIResponse(bibliography)}</ReactMarkdown>
                </div>
              </div>
            </ScrollArea>
          </div>

          <Button onClick={() => setBibliography('')} variant="outline" className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Edit Sources & Regenerate
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default BibliographyBuilder;
