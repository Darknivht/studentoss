import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';
import { Progress } from '@/components/ui/progress';

interface PlagiarismCheckerProps {
  onBack: () => void;
}

const PlagiarismChecker = ({ onBack }: PlagiarismCheckerProps) => {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [result, setResult] = useState<{ score: number; analysis: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const checkPlagiarism = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    setResult(null);

    let fullResponse = '';
    await streamAIChat({
      messages: [],
      mode: 'chat',
      content: `Analyze this text for originality. Check for:
1. Common phrases that might be copied
2. Inconsistent writing style (suggesting multiple sources)
3. Overly formal or Wikipedia-like passages
4. Technical terms used without proper context

Return JSON first, then analysis:
{"originality_score": X} (0-100, where 100 is fully original)

Then explain your findings, flag suspicious passages, and suggest improvements.

Text to check:
${text}`,
      onDelta: (chunk) => {
        fullResponse += chunk;
        try {
          const jsonMatch = fullResponse.match(/\{"originality_score":\s*(\d+)\}/);
          if (jsonMatch) {
            const score = parseInt(jsonMatch[1]);
            const analysis = fullResponse.substring(fullResponse.indexOf('}') + 1).trim();
            setResult({ score, analysis });
          }
        } catch {}
      },
      onDone: () => setLoading(false),
      onError: (err) => {
        toast({ title: 'Error', description: err, variant: 'destructive' });
        setLoading(false);
      },
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'High Originality';
    if (score >= 60) return 'Moderate Originality';
    return 'Low Originality';
  };

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">Plagiarism Checker</h1>
          <p className="text-muted-foreground text-sm">Basic originality analysis</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
      </motion.header>

      {!result && !loading && (
        <div className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text to check for originality..."
            className="min-h-[250px]"
          />
          <p className="text-xs text-muted-foreground">
            Note: This is an AI-based analysis, not a database check. For academic submissions, use official plagiarism detection tools.
          </p>
          <Button onClick={checkPlagiarism} disabled={!text.trim()} className="w-full gradient-primary text-primary-foreground">
            <Shield className="w-4 h-4 mr-2" />
            Check Originality
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Analyzing text...</p>
        </div>
      )}

      {result && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="p-6 rounded-2xl bg-card border border-border text-center">
            <div className={`text-5xl font-bold mb-2 ${getScoreColor(result.score)}`}>
              {result.score}%
            </div>
            <p className={`font-medium ${getScoreColor(result.score)}`}>{getScoreLabel(result.score)}</p>
            <Progress value={result.score} className="mt-4 h-3" />
          </div>

          <div className="rounded-2xl bg-card border border-border p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              {result.score >= 80 ? (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
              Analysis
            </h3>
            <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">{result.analysis}</pre>
          </div>

          <Button onClick={() => { setResult(null); setText(''); }} variant="outline" className="w-full">
            Check Another Text
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default PlagiarismChecker;