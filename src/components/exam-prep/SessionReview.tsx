import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import MarkdownRenderer from '@/components/ui/markdown-renderer';

interface ReviewQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  difficulty: string;
  topic_id: string | null;
  selectedAnswer: number;
  isCorrect: boolean;
}

interface SessionReviewProps {
  questions: ReviewQuestion[];
  score: number;
  subjectName: string;
  onBack: () => void;
  onRetryWeak?: (topicId: string) => void;
}

const SessionReview = ({ questions, score, subjectName, onBack, onRetryWeak }: SessionReviewProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const wrongTopics = new Set<string>();
  questions.forEach(q => {
    if (!q.isCorrect && q.topic_id) wrongTopics.add(q.topic_id);
  });

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-5 rounded-2xl bg-card border border-border text-center">
        <p className="text-5xl mb-2">{pct >= 70 ? '🎉' : pct >= 50 ? '👍' : '💪'}</p>
        <h2 className="text-2xl font-display font-bold text-foreground">{pct}% Score</h2>
        <p className="text-muted-foreground text-sm">{score} / {questions.length} correct — {subjectName}</p>
        <Progress value={pct} className="mt-3 w-48 mx-auto" />
      </motion.div>

      <h3 className="text-sm font-semibold text-foreground">Question Review</h3>

      <div className="space-y-2">
        {questions.map((q, i) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-xl border border-border overflow-hidden"
          >
            <button
              onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
            >
              {q.isCorrect ? (
                <CheckCircle2 size={18} className="text-green-500 shrink-0" />
              ) : (
                <XCircle size={18} className="text-destructive shrink-0" />
              )}
              <span className="text-sm text-foreground flex-1 line-clamp-1">
                <span className="text-muted-foreground mr-1">Q{i + 1}.</span>
                {q.question}
              </span>
              {expandedIndex === i ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
            </button>

            {expandedIndex === i && (
              <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                <p className="text-sm text-foreground font-medium">{q.question}</p>
                <div className="space-y-1">
                  {q.options.map((opt, oi) => {
                    let cls = 'text-muted-foreground';
                    if (oi === q.correct_index) cls = 'text-green-600 font-medium';
                    else if (oi === q.selectedAnswer && !q.isCorrect) cls = 'text-destructive line-through';
                    return (
                      <p key={oi} className={`text-xs ${cls}`}>
                        {String.fromCharCode(65 + oi)}. {opt}
                        {oi === q.correct_index && ' ✓'}
                        {oi === q.selectedAnswer && oi !== q.correct_index && ' ✗'}
                      </p>
                    );
                  })}
                </div>
                {q.explanation && (
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Explanation</p>
                    <MarkdownRenderer content={q.explanation} className="text-xs" />
                  </div>
                )}
                {!q.isCorrect && q.topic_id && onRetryWeak && (
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => onRetryWeak(q.topic_id!)}>
                    <RotateCcw size={12} /> Practice Similar
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <Button onClick={onBack} className="w-full">Back to Subjects</Button>
    </div>
  );
};

export default SessionReview;
