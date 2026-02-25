import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, ChevronRight, Bookmark, BookmarkCheck, Flag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import FeatureGateDialog from '@/components/subscription/FeatureGateDialog';
import MarkdownRenderer from '@/components/ui/markdown-renderer';
import SessionReview from './SessionReview';
import { toast } from '@/hooks/use-toast';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  difficulty: string;
  topic_id: string | null;
}

interface PracticeSessionProps {
  examTypeId: string;
  subjectId: string;
  subjectName: string;
  topicId?: string;
  year?: string;
  source?: string;
  questionCount?: number;
  onBack: () => void;
  onRetryTopic?: (topicId: string) => void;
}

const PracticeSession = ({ examTypeId, subjectId, subjectName, topicId, year, source, questionCount = 10, onBack, onRetryTopic }: PracticeSessionProps) => {
  const { user } = useAuth();
  const { gateFeature, incrementUsage } = useSubscription();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [gateOpen, setGateOpen] = useState(false);
  const [gateInfo, setGateInfo] = useState({ currentUsage: 0, limit: 0 });
  const [answers, setAnswers] = useState<{ selectedAnswer: number; isCorrect: boolean }[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  
  // Adaptive difficulty tracking
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);

  // Load bookmarks
  useEffect(() => {
    if (!user) return;
    supabase.from('exam_bookmarks').select('question_id').eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setBookmarkedIds(new Set(data.map(b => b.question_id)));
      });
  }, [user]);

  useEffect(() => {
    const fetchQuestions = async () => {
      const gate = gateFeature('examQuestion');
      if (!gate.allowed) {
        setGateInfo({ currentUsage: gate.currentUsage, limit: gate.limit });
        setGateOpen(true);
        setLoading(false);
        return;
      }

      try {
        if (year || source) {
          let query = supabase
            .from('exam_questions')
            .select('*')
            .eq('exam_type_id', examTypeId)
            .eq('subject_id', subjectId)
            .eq('is_active', true);
          if (topicId) query = query.eq('topic_id', topicId);
          if (year) query = query.eq('year', year);
          if (source) query = query.eq('source', source);
          const { data } = await query.limit(questionCount);
          const mapped = (data || []).map(q => ({
            id: q.id, question: q.question,
            options: Array.isArray(q.options) ? (q.options as string[]) : [],
            correct_index: q.correct_index, explanation: q.explanation,
            difficulty: q.difficulty, topic_id: q.topic_id,
          }));
          for (let i = mapped.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [mapped[i], mapped[j]] = [mapped[j], mapped[i]];
          }
          setQuestions(mapped);
          setLoading(false);
          return;
        }

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
            topic_id: topicId,
            count: questionCount,
          }),
        });

        const result = await resp.json();
        if (result.questions?.length > 0) {
          setQuestions(result.questions.map((q: any) => ({
            id: q.id || crypto.randomUUID(), question: q.question,
            options: Array.isArray(q.options) ? q.options : [],
            correct_index: q.correct_index, explanation: q.explanation,
            difficulty: q.difficulty || 'medium', topic_id: q.topic_id || null,
          })));
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
        let query = supabase.from('exam_questions').select('*')
          .eq('exam_type_id', examTypeId).eq('subject_id', subjectId).eq('is_active', true);
        if (topicId) query = query.eq('topic_id', topicId);
        const { data } = await query.limit(questionCount);
        const mapped = (data || []).map(q => ({
          id: q.id, question: q.question,
          options: Array.isArray(q.options) ? (q.options as string[]) : [],
          correct_index: q.correct_index, explanation: q.explanation,
          difficulty: q.difficulty, topic_id: q.topic_id,
        }));
        for (let i = mapped.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [mapped[i], mapped[j]] = [mapped[j], mapped[i]];
        }
        setQuestions(mapped);
      }
      setLoading(false);
    };
    fetchQuestions();
  }, [examTypeId, subjectId, topicId, year, source, questionCount]);

  const toggleBookmark = async (questionId: string) => {
    if (!user) return;
    if (bookmarkedIds.has(questionId)) {
      await supabase.from('exam_bookmarks').delete().eq('user_id', user.id).eq('question_id', questionId);
      setBookmarkedIds(prev => { const n = new Set(prev); n.delete(questionId); return n; });
      toast({ title: 'Bookmark removed' });
    } else {
      await supabase.from('exam_bookmarks').insert({ user_id: user.id, question_id: questionId });
      setBookmarkedIds(prev => new Set(prev).add(questionId));
      toast({ title: 'Question bookmarked' });
    }
  };

  const handleSelect = async (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);

    const q = questions[currentIndex];
    const correct = index === q.correct_index;
    if (correct) {
      setScore(s => s + 1);
      setConsecutiveCorrect(c => c + 1);
      setConsecutiveWrong(0);
    } else {
      setConsecutiveWrong(c => c + 1);
      setConsecutiveCorrect(0);
    }

    setAnswers(prev => [...prev, { selectedAnswer: index, isCorrect: correct }]);
    await incrementUsage('examQuestion');

    if (user) {
      await supabase.from('exam_attempts').insert({
        user_id: user.id, exam_type_id: examTypeId, subject_id: subjectId,
        topic_id: q.topic_id, question_id: q.id, selected_index: index,
        is_correct: correct, session_id: sessionId,
      });
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      const gate = gateFeature('examQuestion');
      if (!gate.allowed) {
        setGateInfo({ currentUsage: gate.currentUsage, limit: gate.limit });
        setGateOpen(true);
        setFinished(true);
        return;
      }
      setCurrentIndex(i => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="ml-3 text-sm text-muted-foreground">Generating questions...</p>
      </div>
    );
  }

  if (questions.length === 0 && !gateOpen) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-3">📭</p>
        <h3 className="font-semibold text-foreground">No questions available</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {source ? 'No study material questions found.' : year ? `No questions for year ${year}.` : "Questions haven't been added yet."}
        </p>
        <Button variant="outline" className="mt-4" onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  // Show detailed review
  if (showReview) {
    const reviewQuestions = questions.map((q, i) => ({
      ...q,
      selectedAnswer: answers[i]?.selectedAnswer ?? -1,
      isCorrect: answers[i]?.isCorrect ?? false,
    }));
    return (
      <SessionReview
        questions={reviewQuestions}
        score={score}
        subjectName={subjectName}
        onBack={onBack}
        onRetryWeak={onRetryTopic}
      />
    );
  }

  if (finished || (questions.length === 0 && gateOpen)) {
    const answered = Math.min(questions.length, currentIndex + 1);
    const pct = answered > 0 ? Math.round((score / answered) * 100) : 0;
    return (
      <>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-4">
          <p className="text-5xl">{pct >= 70 ? '🎉' : pct >= 50 ? '👍' : '💪'}</p>
          <h2 className="text-2xl font-display font-bold text-foreground">{pct}% Score</h2>
          <p className="text-muted-foreground">{score} / {answered} correct — {subjectName}</p>
          <Progress value={pct} className="w-48 mx-auto" />
          <div className="flex gap-2 justify-center mt-4">
            <Button variant="outline" onClick={() => setShowReview(true)}>Review Answers</Button>
            <Button onClick={onBack}>Back to Subjects</Button>
          </div>
        </motion.div>
        <FeatureGateDialog open={gateOpen} onOpenChange={setGateOpen} feature="Exam Questions" currentUsage={gateInfo.currentUsage} limit={gateInfo.limit} requiredTier="plus" />
      </>
    );
  }

  const q = questions[currentIndex];
  const isBookmarked = bookmarkedIds.has(q.id);

  // Adaptive difficulty indicator
  const adaptiveHint = consecutiveCorrect >= 3 ? '🔥 On fire!' : consecutiveWrong >= 2 ? '💪 Keep trying!' : null;

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-primary font-medium">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-2">
            {adaptiveHint && <span className="text-xs">{adaptiveHint}</span>}
            <button onClick={() => {
              if (!user) return;
              const reason = prompt('Report reason: incorrect, confusing, or duplicate?', 'incorrect');
              if (!reason) return;
              supabase.from('question_reports').insert({ user_id: user.id, question_id: q.id, reason }).then(() => {
                toast({ title: 'Question reported', description: 'Admin will review it.' });
              });
            }} className="p-1" title="Report question">
              <Flag size={16} className="text-muted-foreground hover:text-destructive" />
            </button>
            <button onClick={() => toggleBookmark(q.id)} className="p-1">
              {isBookmarked ? <BookmarkCheck size={18} className="text-primary" /> : <Bookmark size={18} className="text-muted-foreground" />}
            </button>
            <span className="text-xs text-muted-foreground font-medium">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>
        </div>

        <Progress value={((currentIndex + 1) / questions.length) * 100} />

        <AnimatePresence mode="wait">
          <motion.div key={currentIndex} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
            <div className="p-4 rounded-2xl bg-card border border-border">
              <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground mb-2 capitalize">{q.difficulty}</span>
              <p className="text-foreground font-medium leading-relaxed">{q.question}</p>
            </div>

            <div className="space-y-2">
              {q.options.map((opt, i) => {
                let cls = 'border-border hover:border-primary/50';
                if (showResult) {
                  if (i === q.correct_index) cls = 'border-green-500 bg-green-500/10';
                  else if (i === selectedAnswer) cls = 'border-destructive bg-destructive/10';
                  else cls = 'border-border opacity-50';
                } else if (selectedAnswer === i) {
                  cls = 'border-primary bg-primary/10';
                }

                return (
                  <motion.button
                    key={i}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                    onClick={() => handleSelect(i)}
                    disabled={showResult}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${cls}`}
                  >
                    <span className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm text-foreground flex-1">{opt}</span>
                    {showResult && i === q.correct_index && <CheckCircle2 size={18} className="text-green-500 shrink-0" />}
                    {showResult && i === selectedAnswer && i !== q.correct_index && <XCircle size={18} className="text-destructive shrink-0" />}
                  </motion.button>
                );
              })}
            </div>

            {showResult && q.explanation && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-muted/50 border border-border">
                {gateFeature('examQuestion').allowed || gateInfo.limit > 5 ? (
                  <>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Explanation</p>
                    <MarkdownRenderer content={q.explanation} className="text-sm" />
                  </>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">🔒 Explanation Locked</p>
                    <p className="text-xs text-muted-foreground">Upgrade to see detailed explanations</p>
                  </div>
                )}
              </motion.div>
            )}

            {showResult && (
              <Button onClick={handleNext} className="w-full gap-2">
                {currentIndex + 1 >= questions.length ? 'See Results' : 'Next Question'}
                <ChevronRight size={16} />
              </Button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <FeatureGateDialog open={gateOpen} onOpenChange={setGateOpen} feature="Exam Questions" currentUsage={gateInfo.currentUsage} limit={gateInfo.limit} requiredTier="plus" />
    </>
  );
};

export default PracticeSession;
