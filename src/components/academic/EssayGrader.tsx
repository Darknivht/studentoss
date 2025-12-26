import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, FileCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

interface EssayGraderProps {
  onBack: () => void;
}

const EssayGrader = ({ onBack }: EssayGraderProps) => {
  const { toast } = useToast();
  const [essay, setEssay] = useState('');
  const [rubric, setRubric] = useState('');
  const [feedback, setFeedback] = useState('');
  const [scores, setScores] = useState<{ category: string; score: number; max: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const gradeEssay = async () => {
    if (!essay.trim()) return;
    
    setLoading(true);
    setFeedback('');
    setScores([]);

    const rubricText = rubric.trim() || 'Standard academic rubric: Thesis, Evidence, Analysis, Organization, Grammar';

    let fullResponse = '';
    await streamAIChat({
      messages: [],
      mode: 'chat',
      content: `Grade this essay using the following rubric: ${rubricText}

Provide:
1. Overall score (out of 100)
2. Scores for each rubric category (out of 25 each for: Thesis/Argument, Evidence/Support, Analysis/Critical Thinking, Organization/Clarity)
3. Specific feedback on strengths
4. Areas for improvement with concrete suggestions
5. Grammar/style notes

Start with JSON scores, then provide detailed feedback:
{"scores": [{"category": "Thesis", "score": X, "max": 25}, ...], "overall": X}

Then provide detailed feedback.

Essay to grade:
${essay}`,
      onDelta: (chunk) => {
        fullResponse += chunk;
        // Try to extract scores from JSON at the start
        try {
          const jsonMatch = fullResponse.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            if (data.scores) setScores(data.scores);
          }
        } catch {}
        // Show feedback after JSON
        const feedbackStart = fullResponse.indexOf('}');
        if (feedbackStart > -1) {
          setFeedback(fullResponse.substring(feedbackStart + 1).trim());
        }
      },
      onDone: () => setLoading(false),
      onError: (err) => {
        toast({ title: 'Error', description: err, variant: 'destructive' });
        setLoading(false);
      },
    });
  };

  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const maxScore = scores.reduce((sum, s) => sum + s.max, 0);

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">Essay Grader</h1>
          <p className="text-muted-foreground text-sm">AI rubric feedback on drafts</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileCheck className="w-5 h-5 text-primary" />
        </div>
      </motion.header>

      {!feedback && !loading && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Paste your essay</label>
            <Textarea
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              placeholder="Paste your essay here..."
              className="min-h-[200px]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Custom rubric (optional)</label>
            <Textarea
              value={rubric}
              onChange={(e) => setRubric(e.target.value)}
              placeholder="Enter custom grading criteria, or leave blank for standard academic rubric..."
              className="min-h-[60px]"
            />
          </div>
          <Button onClick={gradeEssay} disabled={!essay.trim()} className="w-full gradient-primary text-primary-foreground">
            <FileCheck className="w-4 h-4 mr-2" />
            Grade Essay
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Analyzing your essay...</p>
        </div>
      )}

      {(scores.length > 0 || feedback) && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Score Summary */}
          {scores.length > 0 && (
            <div className="p-4 rounded-2xl gradient-primary text-primary-foreground">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold">Overall Score</span>
                <span className="text-3xl font-bold">{totalScore}/{maxScore}</span>
              </div>
              <div className="space-y-3">
                {scores.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{s.category}</span>
                      <span>{s.score}/{s.max}</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-white"
                        initial={{ width: 0 }}
                        animate={{ width: `${(s.score / s.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Feedback */}
          {feedback && (
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="p-3 bg-muted border-b border-border">
                <h3 className="font-medium text-sm">Detailed Feedback</h3>
              </div>
              <ScrollArea className="max-h-[40vh]">
                <div className="p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">{feedback}</pre>
                </div>
              </ScrollArea>
            </div>
          )}

          <Button onClick={() => { setFeedback(''); setScores([]); setEssay(''); }} variant="outline" className="w-full">
            Grade Another Essay
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default EssayGrader;