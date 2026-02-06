import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Quote, Copy, Check, Plus, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { formatAIResponse } from '@/lib/formatters';

interface CitationMachineProps {
  onBack: () => void;
}

const CitationMachine = ({ onBack }: CitationMachineProps) => {
  const { toast } = useToast();
  const [style, setStyle] = useState('apa');
  const [sourceType, setSourceType] = useState('website');
  const [url, setUrl] = useState('');
  const [details, setDetails] = useState('');
  const [citation, setCitation] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateCitation = async () => {
    if (!url.trim() && !details.trim()) {
      toast({ title: 'Input required', description: 'Provide a URL or source details.', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    setCitation('');

    await streamAIChat({
      messages: [],
      mode: 'chat',
      content: `Generate a properly formatted ${style.toUpperCase()} citation for this ${sourceType}.

${url ? `URL: ${url}` : ''}
${details ? `Additional details: ${details}` : ''}

Provide the response in markdown:

## Full Citation
[Properly formatted ${style.toUpperCase()} citation]

## In-text Citation
[In-text format with examples]

## Notes
[Any missing information that would improve the citation, or formatting tips]

Be precise with ${style.toUpperCase()} formatting rules. Use proper italics, punctuation, and ordering.`,
      onDelta: (chunk) => setCitation(c => c + chunk),
      onDone: () => setLoading(false),
      onError: (err) => {
        toast({ title: 'Error', description: err, variant: 'destructive' });
        setLoading(false);
      },
    });
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied!', description: 'Citation copied to clipboard.' });
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-screen pb-24">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">Citation Machine</h1>
          <p className="text-muted-foreground text-sm">Auto APA/MLA/Chicago citations</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Quote className="w-5 h-5 text-primary" />
        </div>
      </motion.header>

      {!citation && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Style</label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="apa">APA 7th</SelectItem>
                  <SelectItem value="mla">MLA 9th</SelectItem>
                  <SelectItem value="chicago">Chicago</SelectItem>
                  <SelectItem value="harvard">Harvard</SelectItem>
                  <SelectItem value="ieee">IEEE</SelectItem>
                  <SelectItem value="vancouver">Vancouver</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Source Type</label>
              <Select value={sourceType} onValueChange={setSourceType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="book">Book</SelectItem>
                  <SelectItem value="journal">Journal Article</SelectItem>
                  <SelectItem value="newspaper">Newspaper</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="podcast">Podcast</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">URL (optional)</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Source Details</label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Author, title, date, publisher, volume, pages, DOI, etc..."
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-1">Provide as much detail as possible for an accurate citation.</p>
          </div>
          <Button onClick={generateCitation} disabled={loading || (!url.trim() && !details.trim())} className="w-full gradient-primary text-primary-foreground">
            <Quote className="w-4 h-4 mr-2" />
            Generate Citation
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Formatting citation...</p>
        </div>
      )}

      {citation && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="p-3 bg-muted border-b border-border flex items-center justify-between">
              <h3 className="font-medium text-sm">Generated Citation ({style.toUpperCase()})</h3>
              <Button size="sm" variant="ghost" onClick={copyToClipboard} className="h-7">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
            <ScrollArea className="max-h-[50vh]">
              <div className="p-4 overflow-hidden">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{formatAIResponse(citation)}</ReactMarkdown>
                </div>
              </div>
            </ScrollArea>
          </div>

          <Button onClick={() => { setCitation(''); setUrl(''); setDetails(''); }} variant="outline" className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Generate Another Citation
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default CitationMachine;
