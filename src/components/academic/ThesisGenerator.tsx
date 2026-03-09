import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Lightbulb, Sparkles, Copy, Check, RotateCcw, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import DownloadDropdown from '@/components/export/DownloadDropdown';

interface ThesisGeneratorProps {
  onBack: () => void;
}

const ThesisGenerator = ({ onBack }: ThesisGeneratorProps) => {
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [position, setPosition] = useState('');
  const [essayType, setEssayType] = useState('argumentative');
  const [thesis, setThesis] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateThesis = async () => {
    if (!topic.trim()) { toast({ title: 'Topic required', description: 'Enter a topic for your thesis.', variant: 'destructive' }); return; }
    if (topic.trim().length < 10) { toast({ title: 'More detail needed', description: 'Please provide a more specific topic (at least 10 characters).', variant: 'destructive' }); return; }
    setLoading(true);
    setThesis('');
    await streamAIChat({
      messages: [],
      mode: 'thesis',
      content: `Generate thesis statements for a ${essayType} essay.\nTopic: ${topic}\n${position ? `Position/Angle: ${position}` : ''}`,
      onDelta: (chunk) => setThesis(t => t + chunk),
      onDone: () => setLoading(false),
      onError: (err) => { toast({ title: 'Error', description: err, variant: 'destructive' }); setLoading(false); },
    });
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(thesis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied!', description: 'Thesis statements copied.' });
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-screen pb-24">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">Thesis Generator</h1>
          <p className="text-muted-foreground text-sm">Craft strong thesis statements</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Lightbulb className="w-5 h-5 text-primary" /></div>
      </motion.header>

      {!thesis && !loading && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Essay Type</label>
            <Select value={essayType} onValueChange={setEssayType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="argumentative">Argumentative</SelectItem>
                <SelectItem value="expository">Expository</SelectItem>
                <SelectItem value="analytical">Analytical</SelectItem>
                <SelectItem value="compare_contrast">Compare & Contrast</SelectItem>
                <SelectItem value="research">Research Paper</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Essay/Paper Topic</label>
            <Textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What is your essay about? e.g., 'The impact of social media on teen mental health'" className="min-h-[100px]" />
            {topic.trim().length > 0 && topic.trim().length < 10 && <p className="text-xs text-destructive mt-1">Please be more specific (at least 10 characters)</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Your Position (optional)</label>
            <Textarea value={position} onChange={(e) => setPosition(e.target.value)} placeholder="What angle are you taking? e.g., 'It has more negative effects than positive'" className="min-h-[60px]" />
          </div>
          <Button onClick={generateThesis} disabled={!topic.trim() || topic.trim().length < 10} className="w-full gradient-primary text-primary-foreground">
            <Sparkles className="w-4 h-4 mr-2" />Generate Thesis Statements
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Crafting thesis statements...</p>
        </div>
      )}

      {thesis && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="p-3 bg-muted border-b border-border flex items-center justify-between">
              <h3 className="font-medium text-sm flex items-center gap-2"><Lightbulb className="w-4 h-4 text-primary" />Thesis Options</h3>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => downloadAsHTML(thesis, 'Thesis Statements', 'thesis-statements.html')} className="h-7"><Download className="w-3 h-3" /></Button>
                <Button size="sm" variant="ghost" onClick={() => printMarkdownContent(thesis, 'Thesis Statements')} className="h-7"><Printer className="w-3 h-3" /></Button>
                <Button size="sm" variant="ghost" onClick={copyToClipboard} className="h-7">{copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}</Button>
              </div>
            </div>
            <ScrollArea className="h-[50vh]">
              <div className="p-4 overflow-hidden">
                <div className="prose prose-sm dark:prose-invert max-w-none break-words [&_*]:max-w-full">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{formatAIResponse(thesis)}</ReactMarkdown>
                </div>
              </div>
            </ScrollArea>
          </div>
          <Button onClick={() => { setThesis(''); setTopic(''); setPosition(''); }} variant="outline" className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />Generate for Another Topic
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default ThesisGenerator;
