import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Clock, Trophy, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';

interface ExamQuestion {
  question: string;
  options: string[];
  correct: number;
}

interface MockExamProps {
  onBack: () => void;
}

const MockExam = ({ onBack }: MockExamProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<{ id: string; title: string }[]>([]);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (user) fetchNotes();
  }, [user]);

  useEffect(() => {
    if (examStarted && timeLeft > 0 && !examFinished) {
      const timer = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            finishExam();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [examStarted, timeLeft, examFinished]);

  const fetchNotes = async () => {
    const { data } = await supabase
      .from('notes')
      .select('id, title')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotes(data || []);
  };

  const generateExam = async (noteId: string) => {
    setLoading(true);

    try {
      const { data: note } = await supabase.from('notes').select('content').eq('id', noteId).single();
      if (!note?.content) throw new Error('No content');

      let fullResponse = '';
      await streamAIChat({
        messages: [],
        mode: 'chat',
        content: `Create a 10-question multiple choice exam from this content. Make it challenging.
Return ONLY valid JSON:
[
  { "question": "Question?", "options": ["A", "B", "C", "D"], "correct": 0 }
]

Content:
${note.content}`,
        onDelta: (chunk) => { fullResponse += chunk; },
        onDone: () => {
          try {
            const jsonMatch = fullResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              setQuestions(parsed);
              setAnswers(new Array(parsed.length).fill(null));
              setTimeLeft(parsed.length * 60); // 1 min per question
              setExamStarted(true);
            }
          } catch (e) {
            toast({ title: 'Error', description: 'Failed to generate exam', variant: 'destructive' });
          }
          setLoading(false);
        },
        onError: (err) => {
          toast({ title: 'Error', description: err, variant: 'destructive' });
          setLoading(false);
        },
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load note', variant: 'destructive' });
      setLoading(false);
    }
  };

  const selectAnswer = (qIndex: number, aIndex: number) => {
    if (examFinished) return;
    const newAnswers = [...answers];
    newAnswers[qIndex] = aIndex;
    setAnswers(newAnswers);
  };

  const finishExam = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct) correct++;
    });
    setScore(correct);
    setExamFinished(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Generating mock exam...</p>
      </div>
    );
  }

  if (examFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center">
          <Trophy className="w-12 h-12 text-primary-foreground" />
        </motion.div>
        <h2 className="text-2xl font-bold">Exam Complete!</h2>
        <p className="text-muted-foreground">You scored {score} out of {questions.length}</p>
        <div className="text-5xl font-bold gradient-text">{percentage}%</div>
        <div className={`text-lg font-medium ${percentage >= 70 ? 'text-emerald-500' : percentage >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
          {percentage >= 90 ? 'Outstanding!' : percentage >= 70 ? 'Passed!' : percentage >= 50 ? 'Almost there!' : 'Keep studying!'}
        </div>
        <Button onClick={onBack} variant="outline">Back to Study Tools</Button>
      </div>
    );
  }

  if (examStarted) {
    return (
      <div className="p-6 space-y-6">
        <header className="flex items-center justify-between sticky top-0 bg-background py-2 z-10">
          <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" />Exit</Button>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${timeLeft < 60 ? 'bg-red-500/10 text-red-500' : 'bg-muted'}`}>
            <Clock className="w-4 h-4" />
            <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>
        </header>

        <div className="space-y-8 pb-20">
          {questions.map((q, qIndex) => (
            <motion.div key={qIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qIndex * 0.05 }} className="space-y-3">
              <p className="font-medium text-foreground">{qIndex + 1}. {q.question}</p>
              <div className="grid grid-cols-1 gap-2">
                {q.options.map((opt, oIndex) => (
                  <button
                    key={oIndex}
                    onClick={() => selectAnswer(qIndex, oIndex)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      answers[qIndex] === oIndex
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <span className="font-medium mr-2">{String.fromCharCode(65 + oIndex)}.</span>
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t border-border">
          <Button onClick={finishExam} className="w-full gradient-primary text-primary-foreground">
            Submit Exam ({answers.filter(a => a !== null).length}/{questions.length} answered)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-xl font-display font-bold">Mock Exam</h1>
          <p className="text-muted-foreground text-sm">Timed full-length practice tests</p>
        </div>
      </header>

      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
        <div>
          <p className="font-medium text-amber-700">Exam Mode</p>
          <p className="text-sm text-amber-600">Timer starts immediately. No going back!</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Select a note for your exam:</h3>
        {notes.map((note) => (
          <motion.button
            key={note.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => generateExam(note.id)}
            className="w-full p-4 rounded-2xl bg-card border border-border text-left hover:border-primary/50 transition-all"
          >
            <span className="font-medium text-foreground">{note.title}</span>
          </motion.button>
        ))}
        {notes.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No notes yet. Create notes first!</p>
        )}
      </div>
    </div>
  );
};

export default MockExam;