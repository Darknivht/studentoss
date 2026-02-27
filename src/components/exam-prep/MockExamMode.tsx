import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Loader2, CheckCircle2, XCircle, Eye, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import MarkdownRenderer from '@/components/ui/markdown-renderer';

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
  questionCount?: number;
  timeLimitMinutes?: number;
  onBack: () => void;
}

interface DraftState {
  questions: Question[];
  answers: Record<number, number>;
  currentIndex: number;
  timeLeft: number;
  sessionId: string;
}

const DRAFT_KEY_PREFIX = 'mock_exam_draft_';

const MockExamMode = ({ examTypeId, subjectId, subjectName, questionCount = 40, timeLimitMinutes = 60, onBack }: MockExamModeProps) => {
  const { user } = useAuth();
  const { incrementUsage } = useSubscription();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimitMinutes * 60);
  const [finished, setFinished] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  const [reviewWrong, setReviewWrong] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const saveThrottleRef = useRef<NodeJS.Timeout | null>(null);

  const draftKey = `${DRAFT_KEY_PREFIX}${examTypeId}_${subjectId}`;

  // Check for existing draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const draft: DraftState = JSON.parse(saved);
        if (draft.questions?.length > 0 && draft.timeLeft > 0) {
          setShowResume(true);
          return;
        } else {
          localStorage.removeItem(draftKey);
        }
      }
    } catch {
      localStorage.removeItem(draftKey);
    }
    fetchQuestions();
  }, []);

  const resumeDraft = () => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const draft: DraftState = JSON.parse(saved);
        setQuestions(draft.questions);
        setAnswers(draft.answers);
        setCurrentIndex(draft.currentIndex);
        setTimeLeft(draft.timeLeft);
        setSessionId(draft.sessionId);
        setShowResume(false);
        setLoading(false);
        sessionStorage.setItem('exam_in_progress', 'true');
      }
    } catch {
      localStorage.removeItem(draftKey);
      setShowResume(false);
      fetchQuestions();
    }
  };

  const startFresh = () => {
    localStorage.removeItem(draftKey);
    setShowResume(false);
    fetchQuestions();
  };

  // Save draft (throttled)
  const saveDraft = useCallback(() => {
    if (saveThrottleRef.current) clearTimeout(saveThrottleRef.current);
    saveThrottleRef.current = setTimeout(() => {
      if (finished || questions.length === 0) return;
      const draft: DraftState = { questions, answers, currentIndex, timeLeft, sessionId };
      try { localStorage.setItem(draftKey, JSON.stringify(draft)); } catch {}
    }, 1000);
  }, [questions, answers, currentIndex, timeLeft, sessionId, finished, draftKey]);

  // Autosave on state changes
  useEffect(() => {
    if (!finished && questions.length > 0 && !showResume) saveDraft();
  }, [answers, currentIndex, timeLeft, saveDraft, finished, showResume]);

  const clearDraft = () => {
    localStorage.removeItem(draftKey);
    sessionStorage.removeItem('exam_in_progress');
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/exam-practice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: 'generate-questions',
          exam_type_id: examTypeId,
          subject_id: subjectId,
          count: questionCount,
        }),
      });

      const result = await resp.json();
      
      if (result.questions && result.questions.length > 0) {
        const mapped = result.questions.map((q: any) => ({
          id: q.id || crypto.randomUUID(),
          question: q.question,
          options: Array.isArray(q.options) ? q.options : [],
          correct_index: q.correct_index,
          explanation: q.explanation,
          topic_id: q.topic_id || null,
        }));
        setQuestions(mapped);
        sessionStorage.setItem('exam_in_progress', 'true');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      const { data } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_type_id', examTypeId)
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .limit(questionCount);

      const mapped = (data || []).map(q => ({
        id: q.id,
        question: q.question,
        options: Array.isArray(q.options) ? (q.options as string[]) : [],
        correct_index: q.correct_index,
        explanation: q.explanation,
        topic_id: q.topic_id,
      }));

      for (let i = mapped.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mapped[i], mapped[j]] = [mapped[j], mapped[i]];
      }

      setQuestions(mapped);
      if (mapped.length > 0) sessionStorage.setItem('exam_in_progress', 'true');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (finished || loading || showResume) return;
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
  }, [finished, loading, showResume]);

  const handleSubmit = useCallback(async () => {
    setFinished(true);
    clearDraft();
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

    for (let i = 0; i < questions.length; i++) {
      await incrementUsage('examQuestion');
    }
  }, [user, questions, answers, examTypeId, subjectId, sessionId]);

  const handleExit = () => {
    if (!finished && questions.length > 0) {
      const leave = window.confirm('Your progress is saved. You can resume this exam later. Leave now?');
      if (!leave) return;
    }
    sessionStorage.removeItem('exam_in_progress');
    onBack();
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // Resume prompt
  if (showResume) {
    return (
      <div className="text-center py-16 space-y-6">
        <p className="text-5xl">📝</p>
        <h2 className="text-xl font-display font-bold text-foreground">Resume Previous Exam?</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          You have an unfinished mock exam for {subjectName}. Would you like to continue where you left off?
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={startFresh} className="gap-2">
            <RotateCcw size={16} /> Start Fresh
          </Button>
          <Button onClick={resumeDraft} className="gap-2">
            <Clock size={16} /> Resume Exam
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="ml-3 text-sm text-muted-foreground">Generating {questionCount} questions...</p>
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
    const wrongQuestions = questions.filter((q, i) => answers[i] !== q.correct_index);

    if (reviewWrong && wrongQuestions.length > 0) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setReviewWrong(false)} className="flex items-center gap-1 text-sm text-primary font-medium">
              <ArrowLeft size={16} /> Back to Results
            </button>
            <span className="text-xs text-muted-foreground font-medium">
              {wrongQuestions.length} wrong answer{wrongQuestions.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-4">
            {wrongQuestions.map((q, idx) => {
              const originalIdx = questions.indexOf(q);
              return (
                <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="p-4 rounded-2xl border border-destructive/30 bg-destructive/5 space-y-3">
                  <p className="text-sm font-medium text-foreground">{originalIdx + 1}. {q.question}</p>
                  <div className="space-y-1.5">
                    {q.options.map((opt, i) => (
                      <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                        i === q.correct_index ? 'bg-green-500/10 border border-green-500/30' :
                        i === answers[originalIdx] ? 'bg-destructive/10 border border-destructive/30' :
                        'text-muted-foreground'
                      }`}>
                        <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-semibold shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {i === q.correct_index && <CheckCircle2 size={14} className="text-green-500 shrink-0" />}
                        {i === answers[originalIdx] && i !== q.correct_index && <XCircle size={14} className="text-destructive shrink-0" />}
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <div className="p-2 rounded-lg bg-muted/50 border border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-0.5">Explanation</p>
                      <MarkdownRenderer content={q.explanation} className="text-xs" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          <Button onClick={onBack} className="w-full mt-4">Back to Subjects</Button>
        </motion.div>
      );
    }

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 space-y-4">
        <p className="text-5xl">{pct >= 70 ? '🏆' : pct >= 50 ? '👍' : '💪'}</p>
        <h2 className="text-2xl font-display font-bold text-foreground">{pct}% — Mock Exam</h2>
        <p className="text-muted-foreground">{score} / {questions.length} correct — {subjectName}</p>
        <Progress value={pct} className="w-48 mx-auto" />

        {wrongQuestions.length > 0 && (
          <Button variant="outline" onClick={() => setReviewWrong(true)} className="gap-2">
            <Eye size={16} /> Review Wrong Answers ({wrongQuestions.length})
          </Button>
        )}

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
        <button onClick={handleExit} className="flex items-center gap-1 text-sm text-primary font-medium">
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
