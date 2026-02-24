import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  topic_id: string | null;
}

interface MockExamModeProps {
  examTypeId: string;
  subjectId: string;
  subjectName: string;
  onBack: () => void;
}

const QUESTION_COUNT = 40;
const TIME_LIMIT_SECONDS = 60 * 60; // 1 hour

const MockExamMode = ({ examTypeId, subjectId, subjectName, onBack }: MockExamModeProps) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS);
  const [finished, setFinished] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_type_id', examTypeId)
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .limit(QUESTION_COUNT);

      const mapped = (data || []).map(q => ({
        id: q.id,
        question: q.question,
        options: Array.isArray(q.options) ? (q.options as string[]) : [],
        correct_index: q.correct_index,
        explanation: q.explanation,
        topic_id: q.topic_id,
      }));

      // Shuffle
      for (let i = mapped.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mapped[i], mapped[j]] = [mapped[j], mapped[i]];
      }

      setQuestions(mapped);
      setLoading(false);
    };
    fetch();
  }, [examTypeId, subjectId]);

  useEffect(() => {
    if (finished || loading) return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [finished, loading]);

  const handleSubmit = useCallback(async () => {
    setFinished(true);
    if (!user) return;

    const inserts = questions.map((q, i) => ({
      user_id: user.id,
      exam_type_id: examTypeId,
      subject_id: subjectId,
      topic_id: q.topic_id,
      question_id: q.id,
      selected_index: answers[i] ?? -1,
      is_correct: answers[i] === q.correct_index,
      session_id: sessionId,
    }));

    await supabase.from('exam_attempts').insert(inserts);
  }, [user, questions, answers, examTypeId, subjectId, sessionId]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-3">📭</p>
        <h3 className="font-semibold text-foreground">Not enough questions for a mock exam</h3>
        <Button variant="outline" className="mt-4" onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  if (finished) {
    const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct_index ? 1 : 0), 0);
    const pct = Math.round((score / questions.length) * 100);

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 space-y-4">
        <p className="text-5xl">{pct >= 70 ? '🏆' : pct >= 50 ? '👍' : '💪'}</p>
        <h2 className="text-2xl font-display font-bold text-foreground">{pct}% — Mock Exam</h2>
        <p className="text-muted-foreground">{score} / {questions.length} correct — {subjectName}</p>
        <Progress value={pct} className="w-48 mx-auto" />

        <div className="mt-6 max-h-[300px] overflow-y-auto space-y-2 text-left px-2">
          {questions.map((q, i) => {
            const correct = answers[i] === q.correct_index;
            return (
              <div key={q.id} className={`p-3 rounded-xl border text-sm ${correct ? 'border-green-500/30 bg-green-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
                <p className="font-medium text-foreground">{i + 1}. {q.question}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your answer: {answers[i] !== undefined ? q.options[answers[i]] : 'Not answered'} — Correct: {q.options[q.correct_index]}
                </p>
              </div>
            );
          })}
        </div>

        <Button onClick={onBack} className="mt-4">Back to Subjects</Button>
      </motion.div>
    );
  }

  const q = questions[currentIndex];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-primary font-medium">
          <ArrowLeft size={16} /> Exit
        </button>
        <div className="flex items-center gap-2 text-sm font-mono">
          <Clock size={14} className={timeLeft < 300 ? 'text-destructive' : 'text-muted-foreground'} />
          <span className={timeLeft < 300 ? 'text-destructive font-bold' : 'text-foreground'}>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <Progress value={((currentIndex + 1) / questions.length) * 100} />
      <p className="text-xs text-muted-foreground text-center">Question {currentIndex + 1} of {questions.length}</p>

      <div className="p-4 rounded-2xl bg-card border border-border">
        <p className="text-foreground font-medium leading-relaxed">{q.question}</p>
      </div>

      <div className="space-y-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => setAnswers(a => ({ ...a, [currentIndex]: i }))}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
              answers[currentIndex] === i ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
            }`}
          >
            <span className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="text-sm text-foreground">{opt}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentIndex(i => i - 1)} className="flex-1">
          Previous
        </Button>
        {currentIndex + 1 < questions.length ? (
          <Button onClick={() => setCurrentIndex(i => i + 1)} className="flex-1">Next</Button>
        ) : (
          <Button onClick={handleSubmit} className="flex-1 bg-green-600 hover:bg-green-700">Submit Exam</Button>
        )}
      </div>

      {/* Question nav dots */}
      <div className="flex flex-wrap gap-1.5 justify-center pt-2">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
              i === currentIndex
                ? 'bg-primary text-primary-foreground'
                : answers[i] !== undefined
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MockExamMode;
