import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Loader2, CheckCircle2, XCircle, Eye, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import MarkdownRenderer from '@/components/ui/markdown-renderer';

interface Subject {
  id: string;
  name: string;
  icon: string | null;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  topic_id: string | null;
  subject_id: string;
}

interface MultiSubjectCBTProps {
  examTypeId: string;
  examName: string;
  subjectsRequired: number;
  timeLimitMinutes: number;
  questionsPerSubject: number;
  onBack: () => void;
}

type Phase = 'select' | 'exam' | 'results';

interface DraftState {
  selectedSubjectIds: string[];
  questionsBySubject: Record<string, Question[]>;
  answers: Record<string, Record<number, number>>;
  currentIndexes: Record<string, number>;
  activeSubject: string;
  timeLeft: number;
  sessionId: string;
}

const DRAFT_KEY_PREFIX = 'cbt_draft_';

const MultiSubjectCBT = ({
  examTypeId,
  examName,
  subjectsRequired,
  timeLimitMinutes,
  questionsPerSubject,
  onBack,
}: MultiSubjectCBTProps) => {
  const { user } = useAuth();
  const { incrementUsage } = useSubscription();

  const [phase, setPhase] = useState<Phase>('select');
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResume, setShowResume] = useState(false);

  // Exam state
  const [questionsBySubject, setQuestionsBySubject] = useState<Record<string, Question[]>>({});
  const [answers, setAnswers] = useState<Record<string, Record<number, number>>>({});
  const [activeSubject, setActiveSubject] = useState<string>('');
  const [currentIndexes, setCurrentIndexes] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(timeLimitMinutes * 60);
  const [finished, setFinished] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  const [reviewWrong, setReviewWrong] = useState(false);
  const saveThrottleRef = useRef<NodeJS.Timeout | null>(null);

  const draftKey = `${DRAFT_KEY_PREFIX}${examTypeId}`;

  // Check for draft on mount
  useEffect(() => {
    const checkDraft = async () => {
      try {
        const saved = localStorage.getItem(draftKey);
        if (saved) {
          const draft: DraftState = JSON.parse(saved);
          if (draft.timeLeft > 0 && Object.keys(draft.questionsBySubject).length > 0) {
            // Fetch subjects first so we can show names
            const { data } = await supabase
              .from('exam_subjects')
              .select('id, name, icon')
              .eq('exam_type_id', examTypeId)
              .eq('is_active', true)
              .order('name');
            setAllSubjects(data || []);
            setLoading(false);
            setShowResume(true);
            return;
          } else {
            localStorage.removeItem(draftKey);
          }
        }
      } catch {
        localStorage.removeItem(draftKey);
      }
      // Normal fetch
      const { data } = await supabase
        .from('exam_subjects')
        .select('id, name, icon')
        .eq('exam_type_id', examTypeId)
        .eq('is_active', true)
        .order('name');
      setAllSubjects(data || []);
      setLoading(false);
    };
    checkDraft();
  }, [examTypeId]);

  const resumeDraft = () => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const draft: DraftState = JSON.parse(saved);
        setSelectedSubjectIds(draft.selectedSubjectIds);
        setQuestionsBySubject(draft.questionsBySubject);
        setAnswers(draft.answers);
        setCurrentIndexes(draft.currentIndexes);
        setActiveSubject(draft.activeSubject);
        setTimeLeft(draft.timeLeft);
        setSessionId(draft.sessionId);
        setPhase('exam');
        setShowResume(false);
        sessionStorage.setItem('exam_in_progress', 'true');
      }
    } catch {
      localStorage.removeItem(draftKey);
      setShowResume(false);
    }
  };

  const startFresh = () => {
    localStorage.removeItem(draftKey);
    setShowResume(false);
  };

  // Save draft (throttled)
  const saveDraft = useCallback(() => {
    if (saveThrottleRef.current) clearTimeout(saveThrottleRef.current);
    saveThrottleRef.current = setTimeout(() => {
      if (finished || phase !== 'exam') return;
      const draft: DraftState = { selectedSubjectIds, questionsBySubject, answers, currentIndexes, activeSubject, timeLeft, sessionId };
      try { localStorage.setItem(draftKey, JSON.stringify(draft)); } catch {}
    }, 1000);
  }, [selectedSubjectIds, questionsBySubject, answers, currentIndexes, activeSubject, timeLeft, sessionId, finished, phase, draftKey]);

  useEffect(() => {
    if (phase === 'exam' && !finished && !showResume) saveDraft();
  }, [answers, currentIndexes, activeSubject, timeLeft, saveDraft, phase, finished, showResume]);

  const clearDraft = () => {
    localStorage.removeItem(draftKey);
    sessionStorage.removeItem('exam_in_progress');
  };

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds(prev => {
      if (prev.includes(id)) return prev.filter(s => s !== id);
      if (prev.length >= subjectsRequired) return prev;
      return [...prev, id];
    });
  };

  // Start exam
  const startExam = async () => {
    setLoading(true);
    const qBySubj: Record<string, Question[]> = {};
    const initAnswers: Record<string, Record<number, number>> = {};
    const initIndexes: Record<string, number> = {};

    for (const subjId of selectedSubjectIds) {
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
            subject_id: subjId,
            count: questionsPerSubject,
          }),
        });

        const result = await resp.json();
        if (result.questions?.length > 0) {
          qBySubj[subjId] = result.questions.map((q: any) => ({
            id: q.id || crypto.randomUUID(),
            question: q.question,
            options: Array.isArray(q.options) ? q.options : [],
            correct_index: q.correct_index,
            explanation: q.explanation,
            topic_id: q.topic_id || null,
            subject_id: subjId,
          }));
        } else {
          qBySubj[subjId] = [];
        }
      } catch {
        const { data } = await supabase
          .from('exam_questions')
          .select('*')
          .eq('exam_type_id', examTypeId)
          .eq('subject_id', subjId)
          .eq('is_active', true)
          .limit(questionsPerSubject);

        qBySubj[subjId] = (data || []).map(q => ({
          id: q.id,
          question: q.question,
          options: Array.isArray(q.options) ? (q.options as string[]) : [],
          correct_index: q.correct_index,
          explanation: q.explanation,
          topic_id: q.topic_id,
          subject_id: subjId,
        }));
      }

      initAnswers[subjId] = {};
      initIndexes[subjId] = 0;
    }

    setQuestionsBySubject(qBySubj);
    setAnswers(initAnswers);
    setCurrentIndexes(initIndexes);
    setActiveSubject(selectedSubjectIds[0]);
    setPhase('exam');
    setLoading(false);
    sessionStorage.setItem('exam_in_progress', 'true');
  };

  // Timer
  useEffect(() => {
    if (phase !== 'exam' || finished) return;
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
  }, [phase, finished]);

  const handleSubmit = useCallback(async () => {
    setFinished(true);
    setPhase('results');
    clearDraft();
    if (!user) return;

    const inserts: any[] = [];
    for (const subjId of selectedSubjectIds) {
      const qs = questionsBySubject[subjId] || [];
      const subjAnswers = answers[subjId] || {};
      qs.forEach((q, i) => {
        inserts.push({
          user_id: user.id,
          exam_type_id: examTypeId,
          subject_id: subjId,
          topic_id: q.topic_id,
          question_id: q.id,
          selected_index: subjAnswers[i] ?? -1,
          is_correct: subjAnswers[i] === q.correct_index,
          session_id: sessionId,
        });
      });
    }

    await supabase.from('exam_attempts').insert(inserts);
    for (let i = 0; i < inserts.length; i++) {
      await incrementUsage('examQuestion');
    }
  }, [user, selectedSubjectIds, questionsBySubject, answers, examTypeId, sessionId]);

  const handleExit = () => {
    if (phase === 'exam' && !finished) {
      const leave = window.confirm('Your progress is saved. You can resume this exam later. Leave now?');
      if (!leave) return;
    }
    sessionStorage.removeItem('exam_in_progress');
    onBack();
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const selectedSubjects = allSubjects.filter(s => selectedSubjectIds.includes(s.id));

  // Resume prompt
  if (showResume) {
    return (
      <div className="text-center py-16 space-y-6">
        <p className="text-5xl">📋</p>
        <h2 className="text-xl font-display font-bold text-foreground">Resume Previous CBT?</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          You have an unfinished {examName} CBT exam. Would you like to continue where you left off?
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

  // ─── Subject Selection Phase ───
  if (phase === 'select') {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="text-center space-y-2">
          <p className="text-4xl">📋</p>
          <h2 className="text-xl font-display font-bold text-foreground">Select {subjectsRequired} Subjects</h2>
          <p className="text-sm text-muted-foreground">
            {examName} — {questionsPerSubject} questions per subject · {timeLimitMinutes} minutes total
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {allSubjects.map(subj => {
            const checked = selectedSubjectIds.includes(subj.id);
            const disabled = !checked && selectedSubjectIds.length >= subjectsRequired;
            return (
              <motion.button
                key={subj.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => !disabled && toggleSubject(subj.id)}
                className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                  checked ? 'border-primary bg-primary/10' : disabled ? 'opacity-40 border-border' : 'border-border hover:border-primary/50'
                }`}
              >
                <Checkbox checked={checked} className="pointer-events-none" />
                <span className="text-2xl">{subj.icon || '📘'}</span>
                <span className="font-semibold text-foreground">{subj.name}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
          <Button
            onClick={startExam}
            disabled={selectedSubjectIds.length !== subjectsRequired}
            className="flex-1"
          >
            Start CBT ({selectedSubjectIds.length}/{subjectsRequired})
          </Button>
        </div>
      </div>
    );
  }

  // ─── Loading Questions ───
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="ml-3 text-sm text-muted-foreground">Loading {selectedSubjectIds.length * questionsPerSubject} questions...</p>
      </div>
    );
  }

  // ─── Results Phase ───
  if (phase === 'results') {
    const subjectResults = selectedSubjects.map(subj => {
      const qs = questionsBySubject[subj.id] || [];
      const subjAnswers = answers[subj.id] || {};
      const score = qs.reduce((acc, q, i) => acc + (subjAnswers[i] === q.correct_index ? 1 : 0), 0);
      const wrong = qs.filter((q, i) => subjAnswers[i] !== q.correct_index);
      return { ...subj, questions: qs, answers: subjAnswers, score, total: qs.length, pct: qs.length ? Math.round((score / qs.length) * 100) : 0, wrong };
    });

    const totalScore = subjectResults.reduce((a, r) => a + r.score, 0);
    const totalQs = subjectResults.reduce((a, r) => a + r.total, 0);
    const totalPct = totalQs ? Math.round((totalScore / totalQs) * 100) : 0;

    if (reviewWrong) {
      return (
        <div className="space-y-4">
          <button onClick={() => setReviewWrong(false)} className="flex items-center gap-1 text-sm text-primary font-medium">
            <ArrowLeft size={16} /> Back to Results
          </button>
          {subjectResults.map(sr => sr.wrong.length > 0 && (
            <div key={sr.id} className="space-y-3">
              <h3 className="font-semibold text-foreground">{sr.icon} {sr.name} — {sr.wrong.length} wrong</h3>
              {sr.wrong.map((q, idx) => {
                const origIdx = sr.questions.indexOf(q);
                return (
                  <div key={q.id} className="p-3 rounded-xl border border-destructive/30 bg-destructive/5 space-y-2">
                    <p className="text-sm font-medium text-foreground">{origIdx + 1}. {q.question}</p>
                    <div className="space-y-1">
                      {q.options.map((opt, i) => (
                        <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                          i === q.correct_index ? 'bg-green-500/10 border border-green-500/30' :
                          i === sr.answers[origIdx] ? 'bg-destructive/10 border border-destructive/30' : 'text-muted-foreground'
                        }`}>
                          <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-semibold shrink-0">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {i === q.correct_index && <CheckCircle2 size={14} className="text-green-500 shrink-0" />}
                          {i === sr.answers[origIdx] && i !== q.correct_index && <XCircle size={14} className="text-destructive shrink-0" />}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <div className="p-2 rounded-lg bg-muted/50 border border-border">
                        <p className="text-xs font-semibold text-muted-foreground mb-0.5">Explanation</p>
                        <MarkdownRenderer content={q.explanation} className="text-xs" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          <Button onClick={onBack} className="w-full">Back to Exams</Button>
        </div>
      );
    }

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
        <div className="text-center space-y-3">
          <p className="text-5xl">{totalPct >= 70 ? '🏆' : totalPct >= 50 ? '👍' : '💪'}</p>
          <h2 className="text-2xl font-display font-bold text-foreground">{totalPct}% Overall</h2>
          <p className="text-muted-foreground">{totalScore} / {totalQs} correct — {examName}</p>
          <Progress value={totalPct} className="w-48 mx-auto" />
        </div>

        <div className="space-y-3">
          {subjectResults.map(sr => (
            <div key={sr.id} className={`p-4 rounded-xl border ${sr.pct >= 50 ? 'border-green-500/30 bg-green-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{sr.icon}</span>
                  <span className="font-semibold text-foreground">{sr.name}</span>
                </div>
                <span className="font-bold text-foreground">{sr.pct}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{sr.score} / {sr.total} correct</p>
              <Progress value={sr.pct} className="mt-2 h-2" />
            </div>
          ))}
        </div>

        {subjectResults.some(sr => sr.wrong.length > 0) && (
          <Button variant="outline" onClick={() => setReviewWrong(true)} className="w-full gap-2">
            <Eye size={16} /> Review Wrong Answers
          </Button>
        )}

        <Button onClick={onBack} className="w-full">Back to Exams</Button>
      </motion.div>
    );
  }

  // ─── Exam Phase ───
  const activeQs = questionsBySubject[activeSubject] || [];
  const activeIdx = currentIndexes[activeSubject] || 0;
  const activeQ = activeQs[activeIdx];
  const totalAnswered = Object.values(answers).reduce((acc, subjAnswers) => acc + Object.keys(subjAnswers).length, 0);
  const totalQuestions = Object.values(questionsBySubject).reduce((acc, qs) => acc + qs.length, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={handleExit} className="flex items-center gap-1 text-sm text-primary font-medium">
          <ArrowLeft size={16} /> Exit
        </button>
        <div className="flex items-center gap-2 text-sm font-mono">
          <Clock size={14} className={timeLeft < 300 ? 'text-destructive' : 'text-muted-foreground'} />
          <span className={timeLeft < 300 ? 'text-destructive font-bold' : 'text-foreground'}>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground">{totalAnswered} / {totalQuestions} answered</p>

      {/* Subject Tabs */}
      <Tabs value={activeSubject} onValueChange={setActiveSubject}>
        <TabsList className="w-full flex overflow-x-auto">
          {selectedSubjects.map(subj => {
            const subjQs = questionsBySubject[subj.id] || [];
            const subjAnswered = Object.keys(answers[subj.id] || {}).length;
            return (
              <TabsTrigger key={subj.id} value={subj.id} className="flex-1 text-xs gap-1">
                {subj.icon} {subj.name}
                <span className="text-[10px] opacity-70">({subjAnswered}/{subjQs.length})</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Question */}
      {activeQ ? (
        <AnimatePresence mode="wait">
          <motion.div key={`${activeSubject}-${activeIdx}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Progress value={((activeIdx + 1) / activeQs.length) * 100} className="mb-2" />
            <p className="text-xs text-muted-foreground text-center mb-3">Question {activeIdx + 1} of {activeQs.length}</p>

            <div className="p-4 rounded-2xl bg-card border border-border mb-3">
              <p className="text-foreground font-medium leading-relaxed">{activeQ.question}</p>
            </div>

            <div className="space-y-2 mb-4">
              {activeQ.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setAnswers(a => ({
                    ...a,
                    [activeSubject]: { ...a[activeSubject], [activeIdx]: i }
                  }))}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    answers[activeSubject]?.[activeIdx] === i ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
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
              <Button variant="outline" disabled={activeIdx === 0} onClick={() => setCurrentIndexes(c => ({ ...c, [activeSubject]: c[activeSubject] - 1 }))} className="flex-1">
                Previous
              </Button>
              {activeIdx + 1 < activeQs.length ? (
                <Button onClick={() => setCurrentIndexes(c => ({ ...c, [activeSubject]: c[activeSubject] + 1 }))} className="flex-1">Next</Button>
              ) : (
                <Button onClick={handleSubmit} className="flex-1 bg-green-600 hover:bg-green-700">Submit Exam</Button>
              )}
            </div>

            {/* Question nav dots */}
            <div className="flex flex-wrap gap-1.5 justify-center pt-3">
              {activeQs.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndexes(c => ({ ...c, [activeSubject]: i }))}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                    i === activeIdx
                      ? 'bg-primary text-primary-foreground'
                      : answers[activeSubject]?.[i] !== undefined
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No questions loaded for this subject</p>
        </div>
      )}
    </div>
  );
};

export default MultiSubjectCBT;
