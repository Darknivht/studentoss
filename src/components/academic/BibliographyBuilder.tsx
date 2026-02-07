import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, BookOpen, Plus, Trash2, Copy, Check, RotateCcw, ChevronDown, ChevronUp, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { formatAIResponse } from '@/lib/formatters';
import { downloadAsHTML, printMarkdownContent } from '@/components/export/ExportUtils';

interface SourceEntry {
  id: string;
  type: string;
  authors: string;
  title: string;
  year: string;
  publisher: string;
  url: string;
  expanded: boolean;
}

const createSource = (): SourceEntry => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2),
  type: 'book', authors: '', title: '', year: '', publisher: '', url: '', expanded: true,
});

interface BibliographyBuilderProps {
  onBack: () => void;
}

const BibliographyBuilder = ({ onBack }: BibliographyBuilderProps) => {
  const { toast } = useToast();
  const [style, setStyle] = useState('apa');
  const [sources, setSources] = useState<SourceEntry[]>([createSource()]);
  const [bibliography, setBibliography] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const addSource = () => setSources(prev => [...prev.map(s => ({ ...s, expanded: false })), createSource()]);
  const removeSource = (id: string) => { if (sources.length > 1) setSources(sources.filter(s => s.id !== id)); };
  const updateSource = (id: string, field: keyof SourceEntry, value: string) => setSources(sources.map(s => s.id === id ? { ...s, [field]: value } : s));
  const toggleExpand = (id: string) => setSources(sources.map(s => s.id === id ? { ...s, expanded: !s.expanded } : s));

  const validSources = sources.filter(s => s.title.trim());

  const generateBibliography = async () => {
    if (validSources.length === 0) {
      toast({ title: 'Sources required', description: 'Add at least one source with a title.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setBibliography('');
    const sourcesText = validSources.map((s, i) => {
      const parts = [`Source ${i + 1} (${s.type})`];
      if (s.authors) parts.push(`Authors: ${s.authors}`);
      parts.push(`Title: ${s.title}`);
      if (s.year) parts.push(`Year: ${s.year}`);
      if (s.publisher) parts.push(`Publisher/Journal: ${s.publisher}`);
      if (s.url) parts.push(`URL: ${s.url}`);
      return parts.join('\n');
    }).join('\n\n');

    await streamAIChat({
      messages: [],
      mode: 'bibliography',
      content: `Create a ${style.toUpperCase()} bibliography from these sources:\n\n${sourcesText}`,
      onDelta: (chunk) => setBibliography(b => b + chunk),
      onDone: () => setLoading(false),
      onError: (err) => { toast({ title: 'Error', description: err, variant: 'destructive' }); setLoading(false); },
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
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><BookOpen className="w-5 h-5 text-primary" /></div>
      </motion.header>

      {!bibliography && !loading && (
        <>
          <div>
            <Label className="mb-2 block">Citation Style</Label>
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
              <Label>Sources ({validSources.length} of {sources.length})</Label>
              <Button size="sm" variant="outline" onClick={addSource} className="h-7 text-xs"><Plus className="w-3 h-3 mr-1" />Add Source</Button>
            </div>
            {sources.map((source, i) => (
              <div key={source.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleExpand(source.id)}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-muted-foreground shrink-0">#{i + 1}</span>
                    <span className="text-sm font-medium truncate text-foreground">{source.title || 'Untitled source'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {sources.length > 1 && (
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); removeSource(source.id); }}><Trash2 className="w-3 h-3 text-muted-foreground" /></Button>
                    )}
                    {source.expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>
                {source.expanded && (
                  <div className="p-3 pt-0 space-y-3 border-t border-border">
                    <div>
                      <Label className="mb-1 block text-xs">Source Type</Label>
                      <Select value={source.type} onValueChange={(v) => updateSource(source.id, 'type', v)}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="book">Book</SelectItem>
                          <SelectItem value="journal">Journal Article</SelectItem>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="newspaper">Newspaper</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="podcast">Podcast</SelectItem>
                          <SelectItem value="report">Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs">Author(s) *</Label>
                      <Input value={source.authors} onChange={(e) => updateSource(source.id, 'authors', e.target.value)} placeholder="e.g. Smith, J. & Doe, A." className="h-9" />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs">Title *</Label>
                      <Input value={source.title} onChange={(e) => updateSource(source.id, 'title', e.target.value)} placeholder="e.g. The Impact of AI on Education" className="h-9" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="mb-1 block text-xs">Year</Label>
                        <Input value={source.year} onChange={(e) => updateSource(source.id, 'year', e.target.value)} placeholder="e.g. 2024" className="h-9" />
                      </div>
                      <div>
                        <Label className="mb-1 block text-xs">Publisher / Journal</Label>
                        <Input value={source.publisher} onChange={(e) => updateSource(source.id, 'publisher', e.target.value)} placeholder="e.g. Oxford Press" className="h-9" />
                      </div>
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs">URL / DOI</Label>
                      <Input value={source.url} onChange={(e) => updateSource(source.id, 'url', e.target.value)} placeholder="https://... or 10.1000/xyz" className="h-9" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button onClick={generateBibliography} disabled={validSources.length === 0} className="w-full gradient-primary text-primary-foreground">
            <BookOpen className="w-4 h-4 mr-2" />Generate Bibliography ({validSources.length} source{validSources.length !== 1 ? 's' : ''})
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
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => downloadAsHTML(bibliography, `Bibliography (${style.toUpperCase()})`, `bibliography-${style}.html`)} className="h-7"><Download className="w-3 h-3" /></Button>
                <Button size="sm" variant="ghost" onClick={() => printMarkdownContent(bibliography, `Bibliography (${style.toUpperCase()})`)} className="h-7"><Printer className="w-3 h-3" /></Button>
                <Button size="sm" variant="ghost" onClick={copyToClipboard} className="h-7">{copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}</Button>
              </div>
            </div>
            <ScrollArea className="h-[50vh]">
              <div className="p-4 overflow-hidden">
                <div className="prose prose-sm dark:prose-invert max-w-none break-words [&_*]:max-w-full">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{formatAIResponse(bibliography)}</ReactMarkdown>
                </div>
              </div>
            </ScrollArea>
          </div>
          <Button onClick={() => setBibliography('')} variant="outline" className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />Edit Sources & Regenerate
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default BibliographyBuilder;
