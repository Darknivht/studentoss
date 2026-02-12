import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle, XCircle, Zap, Trophy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { updateStreak } from '@/lib/streak';
import { awardXP, updateWeeklyActivity } from '@/hooks/useWeeklyXP';
import { useToast } from '@/hooks/use-toast';

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
  { question: "What is the speed of light (approx)?", options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "100,000 km/s"], correct: 0, category: "Physics" },
  { question: "What gas do plants absorb?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correct: 2, category: "Biology" },
  { question: "What is 7 × 8?", options: ["54", "56", "58", "48"], correct: 1, category: "Math" },
  { question: "Which country has the most population?", options: ["USA", "India", "China", "Indonesia"], correct: 1, category: "Geography" },
  { question: "What is H₂O commonly known as?", options: ["Hydrogen peroxide", "Water", "Heavy water", "Salt water"], correct: 1, category: "Chemistry" },
  { question: "Who painted the Mona Lisa?", options: ["Michelangelo", "Da Vinci", "Raphael", "Van Gogh"], correct: 1, category: "Art" },
  { question: "What is the longest river in the world?", options: ["Amazon", "Nile", "Mississippi", "Yangtze"], correct: 1, category: "Geography" },
  { question: "What does DNA stand for?", options: ["Deoxyribose Nucleic Acid", "Deoxyribonucleic Acid", "Dinitrogen Acid", "Dynamic Nucleic Acid"], correct: 1, category: "Biology" },
  { question: "What is the derivative of x²?", options: ["x", "2x", "x²", "2"], correct: 1, category: "Math" },
  { question: "Which element has the symbol 'Fe'?", options: ["Fluorine", "Iron", "Francium", "Fermium"], correct: 1, category: "Chemistry" },
  { question: "What is the capital of Japan?", options: ["Osaka", "Kyoto", "Tokyo", "Hiroshima"], correct: 2, category: "Geography" },
  { question: "Who discovered gravity?", options: ["Einstein", "Newton", "Galileo", "Hawking"], correct: 1, category: "Physics" },
  { question: "What is photosynthesis?", options: ["Energy from food", "Light to chemical energy", "Cell division", "Water absorption"], correct: 1, category: "Biology" },
  { question: "What is 3⁴?", options: ["12", "27", "81", "64"], correct: 2, category: "Math" },
  { question: "What is the smallest prime number?", options: ["0", "1", "2", "3"], correct: 2, category: "Math" },
  { question: "Which planet has the most moons?", options: ["Jupiter", "Saturn", "Uranus", "Neptune"], correct: 1, category: "Science" },
  { question: "What is the boiling point of water in °C?", options: ["90", "100", "110", "120"], correct: 1, category: "Science" },
  { question: "What continent is Egypt in?", options: ["Asia", "Europe", "Africa", "Middle East"], correct: 2, category: "Geography" },
  { question: "What is the formula for area of a circle?", options: ["2πr", "πr²", "πd", "2πr²"], correct: 1, category: "Math" },
  { question: "Who wrote '1984'?", options: ["Huxley", "Orwell", "Bradbury", "Tolkien"], correct: 1, category: "Literature" },
  { question: "What is the SI unit of force?", options: ["Joule", "Watt", "Newton", "Pascal"], correct: 2, category: "Physics" },
  { question: "How many chromosomes do humans have?", options: ["23", "44", "46", "48"], correct: 2, category: "Biology" },
  { question: "What is the value of π (approx)?", options: ["3.14", "2.72", "1.62", "3.41"], correct: 0, category: "Math" },
  { question: "What language has the most native speakers?", options: ["English", "Spanish", "Mandarin", "Hindi"], correct: 2, category: "General" },
  { question: "What is Newton's 2nd law?", options: ["F = ma", "E = mc²", "V = IR", "P = IV"], correct: 0, category: "Physics" },
  { question: "What is the capital of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Brisbane"], correct: 2, category: "Geography" },
  { question: "Which vitamin is produced by sunlight?", options: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"], correct: 3, category: "Biology" },
  { question: "What is 25% of 80?", options: ["15", "20", "25", "30"], correct: 1, category: "Math" },
  { question: "What is the hardest natural substance?", options: ["Gold", "Iron", "Diamond", "Platinum"], correct: 2, category: "Science" },
  { question: "Who developed the theory of relativity?", options: ["Newton", "Einstein", "Bohr", "Planck"], correct: 1, category: "Physics" },
  { question: "What is the main gas in Earth's atmosphere?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"], correct: 2, category: "Science" },
  { question: "What does CPU stand for?", options: ["Central Process Unit", "Central Processing Unit", "Computer Personal Unit", "Central Program Unit"], correct: 1, category: "Technology" },
  { question: "What is the freezing point of water in °F?", options: ["0", "32", "100", "212"], correct: 1, category: "Science" },
  { question: "How many sides does a hexagon have?", options: ["5", "6", "7", "8"], correct: 1, category: "Math" },
  { question: "What is the largest organ in the human body?", options: ["Heart", "Liver", "Skin", "Lungs"], correct: 2, category: "Biology" },
  { question: "What is the chemical formula for table salt?", options: ["NaCl", "KCl", "CaCl₂", "NaOH"], correct: 0, category: "Chemistry" },
  { question: "What year was the internet invented?", options: ["1969", "1983", "1990", "1995"], correct: 0, category: "Technology" },
  { question: "What is the Pythagorean theorem?", options: ["a+b=c", "a²+b²=c²", "a×b=c", "a/b=c"], correct: 1, category: "Math" },
  { question: "Which blood type is the universal donor?", options: ["A", "B", "AB", "O"], correct: 3, category: "Biology" },
  { question: "What is the currency of Japan?", options: ["Yuan", "Won", "Yen", "Ringgit"], correct: 2, category: "General" },
  { question: "How many bones are in the adult human body?", options: ["196", "206", "216", "226"], correct: 1, category: "Biology" },
  { question: "What is the tallest mountain in the world?", options: ["K2", "Kangchenjunga", "Everest", "Lhotse"], correct: 2, category: "Geography" },
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
  const [quizState, setQuizState] = useState<'idle' | 'playing' | 'result'>('idle');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [answered, setAnswered] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastQuiz = localStorage.getItem('daily_quiz_date');
    if (lastQuiz === today) setAlreadyDone(true);
  }, []);

  const startQuiz = () => {
    setQuestions(getRandomQuestions(5));
    setCurrentQ(0);
    setScore(0);
    scoreRef.current = 0;
    setSelected(null);
    setAnswered(false);
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
      if (xpEarned > 0) {
        await awardXP(user.id, xpEarned);
      }
      await updateStreak(user.id);
      await updateWeeklyActivity(user.id, 'quizzes_completed', 1);

      await supabase.from('quiz_attempts').insert({
        user_id: user.id,
        score: finalScore,
        total_questions: 5,
        quiz_data: questions.map((q) => ({ question: q.question, correct: q.correct, category: q.category })) as any,
      });

      toast({
        title: `🧠 Daily Quiz Complete!`,
        description: `You scored ${finalScore}/5 and earned ${xpEarned} XP!`,
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
        <p className="text-3xl font-bold text-primary mt-1">{finalScore}/5</p>
        <p className="text-sm text-muted-foreground mt-1">
          You earned <span className="font-semibold text-primary">{finalScore * 10} XP</span>
        </p>
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
      {/* Progress */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground">{q.category}</span>
        <span className="text-xs font-medium text-primary">{currentQ + 1}/5</span>
      </div>
      <div className="h-1 bg-muted rounded-full mb-4 overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${((currentQ + 1) / 5) * 100}%` }}
        />
      </div>

      {/* Question */}
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
            {currentQ < 4 ? 'Next Question' : 'See Results'}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DailyQuizChallenge;
