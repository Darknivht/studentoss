import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Shield, AlertTriangle, CheckCircle, RotateCcw, Copy, Check, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { formatAIResponse } from '@/lib/formatters';
import { downloadAsHTML, printMarkdownContent } from '@/components/export/ExportUtils';
import DownloadDropdown from '@/components/export/DownloadDropdown';

interface PlagiarismCheckerProps {
  onBack: () => void;
}

const PlagiarismChecker = ({ onBack }: PlagiarismCheckerProps) => {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  const checkPlagiarism = async () => {
    if (!text.trim()) {
      toast({ title: 'Text required', description: 'Please paste text to check.', variant: 'destructive' });
      return;
    }
    if (wordCount < 30) {
      toast({ title: 'Too short', description: 'Please enter at least 30 words for a meaningful check.', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    setScore(null);
    setAnalysis('');

    let fullResponse = '';
    let scoreParsed = false;

    await streamAIChat({
      messages: [],
      mode: 'plagiarism',
      content: `Analyze this text for originality (${wordCount} words):\n\n${text}`,
      onDelta: (chunk) => {
        fullResponse += chunk;
        if (!scoreParsed) {
          const jsonMatch = fullResponse.match(/\{"originality_score"\s*:\s*(\d+)\}/);
          if (jsonMatch) {
            setScore(parseInt(jsonMatch[1]));
            scoreParsed = true;
          }
        }
        const jsonEnd = fullResponse.search(/\}\s*\n/);
        if (jsonEnd > -1) {
          const afterJson = fullResponse.substring(jsonEnd + 1).replace(/^\s*\}\s*/, '').trim();
          if (afterJson) setAnalysis(afterJson);
        } else if (!scoreParsed) {
          setAnalysis(fullResponse);
        }
      },
      onDone: () => {
        setLoading(false);
        if (!scoreParsed && fullResponse) {
          setAnalysis(fullResponse);
          setScore(75);
        }
      },
      onError: (err) => {
        toast({ title: 'Error', description: err, variant: 'destructive' });
        setLoading(false);
      },
    });
  };

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-emerald-500';
    if (s >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'High Originality';
    if (s >= 60) return 'Moderate Originality';
    return 'Low Originality — Review Needed';
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`Originality: ${score}%\n\n${analysis}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasResults = score !== null || analysis;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-screen pb-24">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">Plagiarism Checker</h1>
          <p className="text-muted-foreground text-sm">AI originality analysis</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-primary" />
        </div>
      </motion.header>

      {!hasResults && !loading && (
        <div className="space-y-4">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your text to check for originality..." className="min-h-[250px]" />
          <p className="text-xs text-muted-foreground">
            {wordCount} words {wordCount > 0 && wordCount < 30 ? '(minimum 30 words)' : ''}{' • '}Note: AI-based analysis. For academic submissions, also use official plagiarism tools.
          </p>
          <Button onClick={checkPlagiarism} disabled={!text.trim() || wordCount < 30} className="w-full gradient-primary text-primary-foreground">
            <Shield className="w-4 h-4 mr-2" />Check Originality
          </Button>
        </div>
      )}

      {loading && !hasResults && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Analyzing text...</p>
        </div>
      )}

      {(hasResults || loading) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {score !== null && (
            <div className="p-6 rounded-2xl bg-card border border-border text-center">
              <div className={`text-5xl font-bold mb-2 ${getScoreColor(score)}`}>{score}%</div>
              <p className={`font-medium ${getScoreColor(score)}`}>{getScoreLabel(score)}</p>
              <Progress value={score} className="mt-4 h-3" />
            </div>
          )}

          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="p-3 bg-muted border-b border-border flex items-center justify-between">
              <h3 className="font-medium text-sm flex items-center gap-2">
                {score !== null && score >= 80 ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                Analysis
              </h3>
              <div className="flex items-center gap-1">
                {analysis && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => downloadAsHTML(analysis, 'Plagiarism Analysis', 'plagiarism-analysis.html')} className="h-7"><Download className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => printMarkdownContent(analysis, 'Plagiarism Analysis')} className="h-7"><Printer className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={handleCopy} className="h-7">{copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}</Button>
                  </>
                )}
              </div>
            </div>
            <ScrollArea className="h-[40vh]">
              <div className="p-4 overflow-hidden">
                {analysis ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none break-words [&_*]:max-w-full">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{formatAIResponse(analysis)}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Generating analysis...</span></div>
                )}
              </div>
            </ScrollArea>
          </div>

          {!loading && (
            <Button onClick={() => { setScore(null); setAnalysis(''); setText(''); }} variant="outline" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />Check Another Text
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default PlagiarismChecker;
