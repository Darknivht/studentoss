import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Quote, Copy, Check, RotateCcw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { formatAIResponse } from '@/lib/formatters';
import { downloadAsHTML, printMarkdownContent } from '@/components/export/ExportUtils';

interface CitationMachineProps {
  onBack: () => void;
}

interface SourceForm {
  authors: string;
  title: string;
  year: string;
  publisher: string;
  url: string;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
  accessDate: string;
}

const emptyForm: SourceForm = {
  authors: '', title: '', year: '', publisher: '', url: '',
  volume: '', issue: '', pages: '', doi: '', accessDate: '',
};

const SOURCE_FIELDS: Record<string, (keyof SourceForm)[]> = {
  website: ['authors', 'title', 'year', 'publisher', 'url', 'accessDate'],
  book: ['authors', 'title', 'year', 'publisher'],
  journal: ['authors', 'title', 'year', 'publisher', 'volume', 'issue', 'pages', 'doi'],
  newspaper: ['authors', 'title', 'year', 'publisher', 'url'],
  video: ['authors', 'title', 'year', 'publisher', 'url'],
  podcast: ['authors', 'title', 'year', 'publisher', 'url'],
  report: ['authors', 'title', 'year', 'publisher', 'doi', 'url'],
};

const FIELD_LABELS: Record<keyof SourceForm, string> = {
  authors: 'Author(s)',
  title: 'Title',
  year: 'Year',
  publisher: 'Publisher / Website / Journal',
  url: 'URL',
  volume: 'Volume',
  issue: 'Issue',
  pages: 'Pages (e.g. 12-25)',
  doi: 'DOI',
  accessDate: 'Date Accessed',
};

const FIELD_PLACEHOLDERS: Record<keyof SourceForm, string> = {
  authors: 'e.g. Smith, J. & Doe, A.',
  title: 'e.g. The Impact of AI on Education',
  year: 'e.g. 2024',
  publisher: 'e.g. Oxford University Press',
  url: 'https://...',
  volume: 'e.g. 12',
  issue: 'e.g. 3',
  pages: 'e.g. 45-67',
  doi: 'e.g. 10.1000/xyz123',
  accessDate: 'e.g. January 15, 2025',
};

const CitationMachine = ({ onBack }: CitationMachineProps) => {
  const { toast } = useToast();
  const [style, setStyle] = useState('apa');
  const [sourceType, setSourceType] = useState('website');
  const [form, setForm] = useState<SourceForm>(emptyForm);
  const [citation, setCitation] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const updateField = (field: keyof SourceForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const visibleFields = SOURCE_FIELDS[sourceType] || SOURCE_FIELDS.website;
  const hasRequiredFields = form.title.trim() && (form.authors.trim() || form.url.trim());

  const generateCitation = async () => {
    if (!hasRequiredFields) {
      toast({ title: 'More info needed', description: 'Please provide at least a title and author or URL.', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    setCitation('');

    const details = visibleFields
      .filter(f => form[f].trim())
      .map(f => `${FIELD_LABELS[f]}: ${form[f]}`)
      .join('\n');

    await streamAIChat({
      messages: [],
      mode: 'citation',
      content: `Generate a ${style.toUpperCase()} citation for this ${sourceType}.\n\n${details}`,
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
              <Label className="mb-2 block">Citation Style</Label>
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
              <Label className="mb-2 block">Source Type</Label>
              <Select value={sourceType} onValueChange={(v) => { setSourceType(v); setForm(emptyForm); }}>
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

          <div className="space-y-3">
            {visibleFields.map((field) => (
              <div key={field}>
                <Label className="mb-1.5 block text-sm">{FIELD_LABELS[field]}</Label>
                <Input
                  value={form[field]}
                  onChange={(e) => updateField(field, e.target.value)}
                  placeholder={FIELD_PLACEHOLDERS[field]}
                />
              </div>
            ))}
          </div>

          <Button onClick={generateCitation} disabled={!hasRequiredFields} className="w-full gradient-primary text-primary-foreground">
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
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => downloadAsHTML(citation, `Citation (${style.toUpperCase()})`, `citation-${style}.html`)} className="h-7">
                  <Download className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={copyToClipboard} className="h-7">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>
            <ScrollArea className="h-[50vh]">
              <div className="p-4 overflow-hidden">
                <div className="prose prose-sm dark:prose-invert max-w-none break-words [&_*]:max-w-full">
                  <ReactMarkdown>{formatAIResponse(citation)}</ReactMarkdown>
                </div>
              </div>
            </ScrollArea>
          </div>

          <Button onClick={() => { setCitation(''); setForm(emptyForm); }} variant="outline" className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Generate Another Citation
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default CitationMachine;
