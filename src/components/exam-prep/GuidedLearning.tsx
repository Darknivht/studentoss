import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import MarkdownRenderer from '@/components/ui/markdown-renderer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface GuidedLearningProps {
  examTypeId: string;
  subjectId: string;
  subjectName: string;
  topicId?: string;
  onBack: () => void;
}

interface LessonQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

interface LessonData {
  topic: string;
  lesson: string;
  questions: LessonQuestion[];
}

const GuidedLearning = ({ examTypeId, subjectId, subjectName, topicId, onBack }: GuidedLearningProps) => {
  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [phase, setPhase] = useState<'idle' | 'learning' | 'practice' | 'done'>('idle');
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const generateLesson = async () => {
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
          action: 'guided-learning',
          exam_type_id: examTypeId,
          subject_id: subjectId,
          topic_id: topicId,
        }),
      });

      const result = await resp.json();
      if (result.error) throw new Error(result.error);

      setLesson(result as LessonData);
      setPhase('learning');
    } catch (err: any) {
      toast({ title: 'Failed to generate lesson', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (showResult || !lesson) return;
    setSelectedAnswer(index);
    setShowResult(true);
    if (index === lesson.questions[currentQ].correct_index) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (!lesson) return;
    if (currentQ + 1 >= lesson.questions.length) {
      setPhase('done');
    } else {
      setCurrentQ(i => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  if (phase === 'idle') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-sm text-primary font-medium flex items-center gap-1">
            <ArrowLeft size={16} /> Back
          </button>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground">Guided Learning</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Your AI teacher will explain a topic in {subjectName}, then test your understanding with practice questions.
          </p>
          <Button onClick={generateLesson} disabled={loading} size="lg">
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Start Learning Session
          </Button>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="ml-3 text-sm text-muted-foreground">Your teacher is preparing the lesson...</p>
      </div>
    );
  }

  if (!lesson) return null;

  if (phase === 'learning') {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-sm text-primary font-medium flex items-center gap-1">
            <ArrowLeft size={16} /> Back
          </button>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="text-sm font-semibold text-foreground">📖 {lesson.topic}</span>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Card className="p-5">
            <h2 className="text-lg font-display font-bold text-foreground mb-3">📖 Lesson: {lesson.topic}</h2>
            <MarkdownRenderer content={lesson.lesson} />
          </Card>

          <Button onClick={() => setPhase('practice')} className="w-full gap-2" size="lg">
            I'm Ready — Start Practice Questions
            <ChevronRight size={16} />
          </Button>
        </motion.div>
      </div>
    );
  }

  if (phase === 'done') {
    const pct = lesson.questions.length > 0 ? Math.round((score / lesson.questions.length) * 100) : 0;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-4">
        <p className="text-5xl">{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪'}</p>
        <h2 className="text-2xl font-display font-bold text-foreground">{pct}% Score</h2>
        <p className="text-muted-foreground">{score} / {lesson.questions.length} correct — {lesson.topic}</p>
        <Progress value={pct} className="w-48 mx-auto" />
        <p className="text-sm text-muted-foreground">
          {pct >= 80 ? 'Excellent! You understood the lesson well.' : pct >= 60 ? 'Good effort! Review the lesson to strengthen weak areas.' : 'Consider re-reading the lesson and trying again.'}
        </p>
        <div className="flex gap-2 justify-center mt-4">
          <Button variant="outline" onClick={() => { setPhase('learning'); setCurrentQ(0); setScore(0); setSelectedAnswer(null); setShowResult(false); }}>
            Review Lesson
          </Button>
          <Button onClick={generateLesson}>New Topic</Button>
          <Button variant="outline" onClick={onBack}>Back</Button>
        </div>
      </motion.div>
    );
  }

  // Practice phase
  const q = lesson.questions[currentQ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => setPhase('learning')} className="flex items-center gap-1 text-sm text-primary font-medium">
          <ArrowLeft size={16} /> Lesson
        </button>
        <span className="text-xs text-muted-foreground font-medium">
          Q{currentQ + 1} / {lesson.questions.length}
        </span>
      </div>

      <Progress value={((currentQ + 1) / lesson.questions.length) * 100} />

      <AnimatePresence mode="wait">
        <motion.div key={currentQ} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
          <div className="p-4 rounded-2xl bg-card border border-border">
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
                  onClick={() => handleAnswer(i)}
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
              <p className="text-xs font-semibold text-muted-foreground mb-1">Explanation</p>
              <p className="text-sm text-foreground">{q.explanation}</p>
            </motion.div>
          )}

          {showResult && (
            <Button onClick={handleNext} className="w-full gap-2">
              {currentQ + 1 >= lesson.questions.length ? 'See Results' : 'Next Question'}
              <ChevronRight size={16} />
            </Button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Simple Card component used inline
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl bg-card border border-border ${className}`}>{children}</div>
);

export default GuidedLearning;
