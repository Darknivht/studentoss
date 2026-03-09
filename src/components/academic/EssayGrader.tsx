import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, FileCheck, Copy, Check, RotateCcw, Download, Printer } from 'lucide-react';
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

interface EssayGraderProps {
  onBack: () => void;
}

const EssayGrader = ({ onBack }: EssayGraderProps) => {
  const { toast } = useToast();
  const [essay, setEssay] = useState('');
  const [rubric, setRubric] = useState('');
  const [gradeLevel, setGradeLevel] = useState('college');
  const [essayType, setEssayType] = useState('argumentative');
  const [feedback, setFeedback] = useState('');
  const [scores, setScores] = useState<{ category: string; score: number; max: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const wordCount = essay.trim().split(/\s+/).filter(Boolean).length;

  const gradeEssay = async () => {
    if (!essay.trim()) {
      toast({ title: 'Essay required', description: 'Please paste your essay to grade.', variant: 'destructive' });
      return;
    }
    if (wordCount < 50) {
      toast({ title: 'Too short', description: 'Essay should be at least 50 words for meaningful feedback.', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    setFeedback('');
    setScores([]);

    const rubricText = rubric.trim() || 'Standard academic rubric: Thesis, Evidence, Analysis, Organization, Grammar';

    let fullResponse = '';
    let scoresParsed = false;

    await streamAIChat({
      messages: [],
      mode: 'essay_grade',
      content: `Grade this ${essayType} essay at the ${gradeLevel} level.\nRubric: ${rubricText}\n\nEssay (${wordCount} words):\n${essay}`,
      onDelta: (chunk) => {
        fullResponse += chunk;
        if (!scoresParsed) {
          const jsonMatch = fullResponse.match(/\{[^{}]*"scores"\s*:\s*\[[\s\S]*?\]\s*\}/);
          if (jsonMatch) {
            try {
              const data = JSON.parse(jsonMatch[0]);
              if (data.scores && Array.isArray(data.scores)) {
                setScores(data.scores);
                scoresParsed = true;
              }
            } catch {}
          }
        }
        const jsonEnd = fullResponse.search(/\}\s*\n/);
        if (jsonEnd > -1) {
          const afterJson = fullResponse.substring(jsonEnd + 1).replace(/^\s*\}\s*/, '').trim();
          if (afterJson) setFeedback(afterJson);
        } else if (!scoresParsed) {
          setFeedback(fullResponse);
        }
      },
      onDone: () => {
        setLoading(false);
        if (!scoresParsed && fullResponse) setFeedback(fullResponse);
      },
      onError: (err) => {
        toast({ title: 'Error', description: err, variant: 'destructive' });
        setLoading(false);
      },
    });
  };

  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const maxScore = scores.reduce((sum, s) => sum + s.max, 0);

  const copyFeedback = async () => {
    const text = scores.length > 0 ? `Score: ${totalScore}/${maxScore}\n\n${feedback}` : feedback;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasResults = feedback || scores.length > 0;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-screen pb-24">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">Essay Grader</h1>
          <p className="text-muted-foreground text-sm">AI rubric feedback on drafts</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <FileCheck className="w-5 h-5 text-primary" />
        </div>
      </motion.header>

      {!hasResults && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Grade Level</label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="middle_school">Middle School</SelectItem>
                  <SelectItem value="high_school">High School</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                  <SelectItem value="graduate">Graduate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Essay Type</label>
              <Select value={essayType} onValueChange={setEssayType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="argumentative">Argumentative</SelectItem>
                  <SelectItem value="expository">Expository</SelectItem>
                  <SelectItem value="narrative">Narrative</SelectItem>
                  <SelectItem value="descriptive">Descriptive</SelectItem>
                  <SelectItem value="research">Research Paper</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Paste your essay</label>
            <Textarea value={essay} onChange={(e) => setEssay(e.target.value)} placeholder="Paste your essay here..." className="min-h-[200px]" />
            <p className="text-xs text-muted-foreground mt-1">{wordCount} words {wordCount < 50 && wordCount > 0 ? '(minimum 50 words)' : ''}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Custom rubric (optional)</label>
            <Textarea value={rubric} onChange={(e) => setRubric(e.target.value)} placeholder="Enter custom grading criteria, or leave blank for standard academic rubric..." className="min-h-[60px]" />
          </div>
          <Button onClick={gradeEssay} disabled={!essay.trim() || wordCount < 50} className="w-full gradient-primary text-primary-foreground">
            <FileCheck className="w-4 h-4 mr-2" />Grade Essay
          </Button>
        </div>
      )}

      {loading && !hasResults && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Analyzing your essay...</p>
        </div>
      )}

      {(hasResults || loading) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {scores.length > 0 && (
            <div className="p-4 rounded-2xl gradient-primary text-primary-foreground">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold">Overall Score</span>
                <span className="text-3xl font-bold">{totalScore}/{maxScore}</span>
              </div>
              <div className="space-y-3">
                {scores.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1"><span>{s.category}</span><span>{s.score}/{s.max}</span></div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-white" initial={{ width: 0 }} animate={{ width: `${(s.score / s.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(feedback || loading) && (
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="p-3 bg-muted border-b border-border flex items-center justify-between">
                <h3 className="font-medium text-sm">Detailed Feedback</h3>
                <div className="flex items-center gap-1">
                  {feedback && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => downloadAsHTML(feedback, 'Essay Feedback', 'essay-feedback.html')} className="h-7"><Download className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => printMarkdownContent(feedback, 'Essay Feedback')} className="h-7"><Printer className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" onClick={copyFeedback} className="h-7">{copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}</Button>
                    </>
                  )}
                </div>
              </div>
              <ScrollArea className="h-[40vh]">
                <div className="p-4 overflow-hidden">
                  {feedback ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none break-words [&_*]:max-w-full [&_table]:table-fixed [&_pre]:overflow-x-auto [&_pre]:max-w-full">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{formatAIResponse(feedback)}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Generating feedback...</span></div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {!loading && (
            <Button onClick={() => { setFeedback(''); setScores([]); setEssay(''); }} variant="outline" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />Grade Another Essay
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default EssayGrader;
