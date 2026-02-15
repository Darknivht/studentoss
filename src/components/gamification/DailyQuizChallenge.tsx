import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle, XCircle, Zap, Trophy, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { updateStreak } from '@/lib/streak';
import { awardXP, updateWeeklyActivity } from '@/hooks/useWeeklyXP';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { callAI } from '@/lib/ai';
import { getEducationContext } from '@/lib/educationConfig';

interface Question {
  question: string;
  options: string[];
  correct: number;
  category: string;
}

const questionPool: Question[] = [
  { question: "What is the powerhouse of the cell?", options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi body"], correct: 1, category: "Biology" },
  { question: "What is 15% of 200?", options: ["25", "30", "35", "20"], correct: 1, category: "Math" },
  { question: "Who wrote 'Romeo and Juliet'?", options: ["Dickens", "Shakespeare", "Austen", "Hemingway"], correct: 1, category: "Literature" },
  { question: "What planet is known as the Red Planet?", options: ["Venus", "Jupiter", "Mars", "Saturn"], correct: 2, category: "Science" },
  { question: "What is the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], correct: 2, category: "Chemistry" },
  { question: "What is the square root of 144?", options: ["10", "11", "12", "14"], correct: 2, category: "Math" },
  { question: "Which ocean is the largest?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3, category: "Geography" },
  { question: "What year did World War II end?", options: ["1943", "1944", "1945", "1946"], correct: 2, category: "History" },
  { question: "What gas do plants absorb?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correct: 2, category: "Biology" },
  { question: "What is 7 × 8?", options: ["54", "56", "58", "48"], correct: 1, category: "Math" },
  { question: "What is H₂O commonly known as?", options: ["Hydrogen peroxide", "Water", "Heavy water", "Salt water"], correct: 1, category: "Chemistry" },
  { question: "Who painted the Mona Lisa?", options: ["Michelangelo", "Da Vinci", "Raphael", "Van Gogh"], correct: 1, category: "Art" },
  { question: "What does DNA stand for?", options: ["Deoxyribose Nucleic Acid", "Deoxyribonucleic Acid", "Dinitrogen Acid", "Dynamic Nucleic Acid"], correct: 1, category: "Biology" },
  { question: "What is the derivative of x²?", options: ["x", "2x", "x²", "2"], correct: 1, category: "Math" },
  { question: "Which element has the symbol 'Fe'?", options: ["Fluorine", "Iron", "Francium", "Fermium"], correct: 1, category: "Chemistry" },
  { question: "What is the capital of Japan?", options: ["Osaka", "Kyoto", "Tokyo", "Hiroshima"], correct: 2, category: "Geography" },
  { question: "Who discovered gravity?", options: ["Einstein", "Newton", "Galileo", "Hawking"], correct: 1, category: "Physics" },
  { question: "What is 3⁴?", options: ["12", "27", "81", "64"], correct: 2, category: "Math" },
  { question: "What is the smallest prime number?", options: ["0", "1", "2", "3"], correct: 2, category: "Math" },
  { question: "What is the boiling point of water in °C?", options: ["90", "100", "110", "120"], correct: 1, category: "Science" },
  { question: "What continent is Egypt in?", options: ["Asia", "Europe", "Africa", "Middle East"], correct: 2, category: "Geography" },
  { question: "What is the formula for area of a circle?", options: ["2πr", "πr²", "πd", "2πr²"], correct: 1, category: "Math" },
  { question: "What is the SI unit of force?", options: ["Joule", "Watt", "Newton", "Pascal"], correct: 2, category: "Physics" },
  { question: "How many chromosomes do humans have?", options: ["23", "44", "46", "48"], correct: 2, category: "Biology" },
  { question: "What is the Pythagorean theorem?", options: ["a+b=c", "a²+b²=c²", "a×b=c", "a/b=c"], correct: 1, category: "Math" },
];

function getRandomQuestions(count: number): Question[] {
  const shuffled = [...questionPool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

interface DailyQuizChallengeProps {
  onComplete?: () => void;
}

const DailyQuizChallenge = ({ onComplete }: DailyQuizChallengeProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { subscription } = useSubscription();
  const [quizState, setQuizState] = useState<'idle' | 'loading' | 'playing' | 'result'>('idle');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [answered, setAnswered] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [quizSource, setQuizSource] = useState<'notes' | 'general'>('general');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastQuiz = localStorage.getItem('daily_quiz_date');
    if (lastQuiz === today) setAlreadyDone(true);
  }, []);

  const generateNoteBasedQuiz = async (): Promise<Question[] | null> => {
    if (!user) return null;

    try {
      // Fetch user's notes
      const { data: notes } = await supabase
        .from('notes')
        .select('content, title')
        .eq('user_id', user.id)
        .not('content', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!notes || notes.length === 0) return null;

      // Pick 1-3 random notes
      const shuffled = [...notes].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(3, shuffled.length));
      const noteContent = selected
        .map(n => `## ${n.title}\n${(n.content || '').slice(0, 1500)}`)
        .join('\n\n');

      if (noteContent.trim().length < 50) return null;

      // Get education context
      const { data: profile } = await supabase
        .from('profiles')
        .select('grade_level')
        .eq('user_id', user.id)
        .single();

      const educationContext = getEducationContext(profile?.grade_level);

      const prompt = `Based on the following study notes, generate exactly 5 multiple-choice quiz questions. Each question must have exactly 4 options with one correct answer.

${educationContext ? `\n${educationContext}\n` : ''}

NOTES:
${noteContent}

Return ONLY valid JSON in this exact format, no other text:
[{"question":"...","options":["A","B","C","D"],"correct":0,"category":"Subject"},...]

The "correct" field is the 0-based index of the correct option.`;

      const response = await callAI('quiz', prompt);

      // Parse JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed) || parsed.length < 3) return null;

      // Validate structure
      const valid = parsed
        .filter((q: any) =>
          q.question && Array.isArray(q.options) && q.options.length === 4 &&
          typeof q.correct === 'number' && q.correct >= 0 && q.correct <= 3
        )
        .slice(0, 5);

      return valid.length >= 3 ? valid : null;
    } catch (error) {
      console.error('Failed to generate note-based quiz:', error);
      return null;
    }
  };

  const startQuiz = async () => {
    setScore(0);
    scoreRef.current = 0;
    setCurrentQ(0);
    setSelected(null);
    setAnswered(false);

    // Try AI-based quiz for Plus/Pro users
    const canUseAI = subscription.isPlus || subscription.isPro;

    if (canUseAI) {
      setQuizState('loading');
      const aiQuestions = await generateNoteBasedQuiz();
      if (aiQuestions) {
        setQuestions(aiQuestions);
        setQuizSource('notes');
        setQuizState('playing');
        return;
      }
    }

    // Fallback to general knowledge
    setQuestions(getRandomQuestions(5));
    setQuizSource('general');
    setQuizState('playing');
  };

  const handleAnswer = useCallback((idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === questions[currentQ].correct) {
      scoreRef.current += 1;
      setScore(s => s + 1);
    }
  }, [answered, questions, currentQ]);

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const finalScore = scoreRef.current;
    setQuizState('result');
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('daily_quiz_date', today);
    setAlreadyDone(true);

    if (!user) return;

    const xpEarned = finalScore * 10;

    try {
      if (xpEarned > 0) await awardXP(user.id, xpEarned);
      await updateStreak(user.id);
      await updateWeeklyActivity(user.id, 'quizzes_completed', 1);

      await supabase.from('quiz_attempts').insert({
        user_id: user.id,
        score: finalScore,
        total_questions: questions.length,
        quiz_data: questions.map((q) => ({ question: q.question, correct: q.correct, category: q.category })) as any,
      });

      toast({
        title: `🧠 Daily Quiz Complete!`,
        description: `You scored ${finalScore}/${questions.length} and earned ${xpEarned} XP!`,
      });

      onComplete?.();
    } catch (err) {
      console.error('Error saving quiz results:', err);
    }
  };

  if (alreadyDone && quizState === 'idle') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl border border-border bg-emerald-500/5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Daily Brain Boost</p>
            <p className="text-xs text-muted-foreground">Completed today! Come back tomorrow 🎉</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (quizState === 'idle') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-accent/5"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">Daily Brain Boost</p>
            <p className="text-xs text-muted-foreground">5 questions • 10 XP each • Updates streak</p>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-primary">
            <Zap className="w-3.5 h-3.5" />
            50 XP
          </div>
        </div>
        <Button onClick={startQuiz} className="w-full h-9 text-sm gradient-primary text-primary-foreground rounded-xl">
          <Sparkles className="w-4 h-4 mr-1.5" /> Start Quiz
        </Button>
      </motion.div>
    );
  }

  if (quizState === 'loading') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl border border-border bg-card text-center"
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">Generating quiz from your notes...</p>
        <p className="text-xs text-muted-foreground mt-1">AI is creating personalized questions</p>
      </motion.div>
    );
  }

  if (quizState === 'result') {
    const finalScore = scoreRef.current;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-5 rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-accent/10 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-3"
        >
          <Trophy className="w-8 h-8 text-primary" />
        </motion.div>
        <h3 className="text-lg font-bold text-foreground">Quiz Complete!</h3>
        <p className="text-3xl font-bold text-primary mt-1">{finalScore}/{questions.length}</p>
        <p className="text-sm text-muted-foreground mt-1">
          You earned <span className="font-semibold text-primary">{finalScore * 10} XP</span>
        </p>
        {quizSource === 'notes' && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <BookOpen className="w-3 h-3" /> Based on your notes
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">🔥 Streak updated! Come back tomorrow.</p>
      </motion.div>
    );
  }

  // Playing state
  const q = questions[currentQ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 rounded-2xl border border-border bg-card"
    >
      {/* Source badge + Progress */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{q.category}</span>
          {quizSource === 'notes' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-0.5">
              <BookOpen className="w-2.5 h-2.5" /> Notes
            </span>
          )}
        </div>
        <span className="text-xs font-medium text-primary">{currentQ + 1}/{questions.length}</span>
      </div>
      <div className="h-1 bg-muted rounded-full mb-4 overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -30, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <p className="font-semibold text-foreground text-sm mb-3">{q.question}</p>
          <div className="space-y-2">
            {q.options.map((opt, i) => {
              let optClass = 'border-border hover:border-primary/50 bg-background';
              if (answered) {
                if (i === q.correct) optClass = 'border-emerald-500 bg-emerald-500/10';
                else if (i === selected && i !== q.correct) optClass = 'border-red-500 bg-red-500/10';
                else optClass = 'border-border opacity-50';
              } else if (i === selected) {
                optClass = 'border-primary bg-primary/5';
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={answered}
                  className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${optClass}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-foreground">{opt}</span>
                    {answered && i === q.correct && <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />}
                    {answered && i === selected && i !== q.correct && <XCircle className="w-4 h-4 text-red-500 ml-auto" />}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {answered && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
          <Button onClick={nextQuestion} className="w-full h-9 text-sm rounded-xl">
            {currentQ < questions.length - 1 ? 'Next Question' : 'See Results'}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DailyQuizChallenge;
