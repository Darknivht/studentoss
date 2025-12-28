import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle, Trophy, BookOpen, Sparkles, Loader2, History, Brain } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { streamAIChat } from '@/lib/ai';
import { updateCourseProgress } from '@/hooks/useCourseProgress';
import { runAchievementCheck } from '@/hooks/useAchievements';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import { QuizHistory } from '@/components/quiz/QuizHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface QuizAttempt {
  id: string;
  score: number;
  total_questions: number;
  completed_at: string;
  note_id?: string;
  course_id?: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const Quizzes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion[] | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const { startTracking, stopTracking } = useActivityTracking({ activityType: 'quiz' });
  const quizStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchAttempts();

      // Check for noteId or courseId in URL params
      const noteId = searchParams.get('noteId');
      const courseId = searchParams.get('courseId');

      if (noteId) {
        generateQuizFromNote(noteId);
        searchParams.delete('noteId');
        setSearchParams(searchParams);
      } else if (courseId) {
        generateQuizFromCourse(courseId);
        searchParams.delete('courseId');
        setSearchParams(searchParams);
      }
    }
  }, [user]);

  const fetchAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('id, score, total_questions, completed_at, note_id, course_id')
        .eq('user_id', user?.id)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAttempts(data || []);
    } catch (error) {
      console.error('Error fetching attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQuizFromCourse = async (courseId: string) => {
    setGenerating(true);
    setCurrentNoteId(null);
    setCurrentCourseId(courseId);

    try {
      // Fetch all notes for the course
      const { data: notes, error } = await supabase
        .from('notes')
        .select('content')
        .eq('course_id', courseId)
        .eq('user_id', user?.id);

      if (error || !notes || notes.length === 0) {
        throw new Error('No notes found for this course');
      }

      // Concatenate content (limit to ~30k chars)
      const allContent = notes.map(n => n.content).join('\n\n---\n\n').slice(0, 30000);

      let fullResponse = '';
      await streamAIChat({
        messages: [],
        mode: 'quiz',
        content: `Create a quiz from this course content:\n\n${allContent}`,
        onDelta: (chunk) => {
          fullResponse += chunk;
        },
        onDone: () => {
          try {
            const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/);
            let quizData: QuizQuestion[];

            if (jsonMatch) {
              quizData = JSON.parse(jsonMatch[1]);
            } else {
              quizData = JSON.parse(fullResponse);
            }

            if (Array.isArray(quizData) && quizData.length > 0) {
              setActiveQuiz(quizData);
              setUserAnswers([]);
              startTracking();
            } else {
              throw new Error('Invalid quiz format');
            }
          } catch (e) {
            console.error('Failed to parse quiz:', e, fullResponse);
            toast({
              title: 'Error',
              description: 'Failed to generate quiz.',
              variant: 'destructive',
            });
          }
          setGenerating(false);
        },
        onError: (err) => {
          toast({ title: 'Error', description: err, variant: 'destructive' });
          setGenerating(false);
        },
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load course notes.',
        variant: 'destructive',
      });
      setGenerating(false);
    }
  };

  const generateQuizFromNote = async (noteId: string) => {
    setGenerating(true);
    setCurrentNoteId(noteId);
    setCurrentCourseId(null);

    try {
      // Fetch the note content
      const { data: note, error } = await supabase
        .from('notes')
        .select('content, course_id')
        .eq('id', noteId)
        .single();

      if (error || !note?.content) {
        throw new Error('Note not found');
      }

      if (note.course_id) {
        setCurrentCourseId(note.course_id);
      }

      let fullResponse = '';
      await streamAIChat({
        messages: [],
        mode: 'quiz',
        content: note.content,
        onDelta: (chunk) => {
          fullResponse += chunk;
        },
        onDone: () => {
          try {
            // Parse the quiz JSON from the response
            const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/);
            let quizData: QuizQuestion[];

            if (jsonMatch) {
              quizData = JSON.parse(jsonMatch[1]);
            } else {
              // Try parsing the whole response as JSON
              quizData = JSON.parse(fullResponse);
            }

            if (Array.isArray(quizData) && quizData.length > 0) {
              setActiveQuiz(quizData);
              setUserAnswers([]);
              startTracking(); // Start activity tracking when quiz begins
            } else {
              throw new Error('Invalid quiz format');
            }
          } catch (e) {
            console.error('Failed to parse quiz:', e, fullResponse);
            toast({
              title: 'Error',
              description: 'Failed to generate quiz. Please try again.',
              variant: 'destructive',
            });
          }
          setGenerating(false);
        },
        onError: (err) => {
          toast({ title: 'Error', description: err, variant: 'destructive' });
          setGenerating(false);
        },
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load note for quiz.',
        variant: 'destructive',
      });
      setGenerating(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelected(index);
    setShowResult(true);
    setUserAnswers(prev => [...prev, index]);

    if (index === activeQuiz![currentQ].correct) {
      setScore((s) => s + 1);
    }
  };

  const nextQuestion = async () => {
    if (currentQ < activeQuiz!.length - 1) {
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setQuizComplete(true);
      stopTracking(); // Stop activity tracking when quiz ends

      try {
        // Build quiz data with user answers for review
        const quizDataWithAnswers = activeQuiz!.map((q, idx) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correct,
          userAnswer: userAnswers[idx],
          explanation: q.explanation,
        }));

        await supabase.from('quiz_attempts').insert([{
          user_id: user!.id,
          score,
          total_questions: activeQuiz!.length,
          quiz_data: { questions: quizDataWithAnswers },
          note_id: currentNoteId,
          course_id: currentCourseId,
        }]);

        // Update course progress if there's a course
        if (currentCourseId && user?.id) {
          updateCourseProgress(user.id, currentCourseId);
        }

        // Check for achievements
        if (user?.id) {
          runAchievementCheck(user.id);
        }

        fetchAttempts();
      } catch (error) {
        console.error('Failed to save quiz:', error);
      }
    }
  };

  const exitQuiz = () => {
    stopTracking(); // Stop tracking if user exits early
    setActiveQuiz(null);
    setCurrentQ(0);
    setSelected(null);
    setShowResult(false);
    setScore(0);
    setQuizComplete(false);
    setCurrentNoteId(null);
    setCurrentCourseId(null);
    setUserAnswers([]);
  };

  if (generating) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <h2 className="text-xl font-display font-semibold text-foreground">
          Generating Quiz...
        </h2>
        <p className="text-muted-foreground text-sm">
          AI is creating questions from your notes
        </p>
      </div>
    );
  }

  if (activeQuiz && !quizComplete) {
    const q = activeQuiz[currentQ];

    return (
      <div className="p-6 space-y-6">
        <header className="flex items-center justify-between">
          <Button variant="ghost" onClick={exitQuiz}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentQ + 1} / {activeQuiz.length}
          </span>
        </header>

        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQ + 1) / activeQuiz.length) * 100}%` }}
          />
        </div>

        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <h2 className="text-xl font-display font-semibold text-foreground">
            {q.question}
          </h2>

          <div className="space-y-3">
            {q.options.map((option, i) => {
              const isCorrect = i === q.correct;
              const isSelected = i === selected;

              return (
                <motion.button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={showResult}
                  whileTap={{ scale: showResult ? 1 : 0.98 }}
                  className={`w-full p-4 rounded-2xl border text-left transition-all ${showResult
                    ? isCorrect
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700'
                      : isSelected
                        ? 'border-red-500 bg-red-500/10 text-red-700'
                        : 'border-border bg-card text-muted-foreground'
                    : 'border-border bg-card hover:border-primary/50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${showResult && isCorrect
                      ? 'bg-emerald-500 text-white'
                      : showResult && isSelected
                        ? 'bg-red-500 text-white'
                        : 'bg-muted text-foreground'
                      }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                    {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                  </div>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 rounded-2xl bg-muted"
              >
                <p className="text-sm text-muted-foreground">{q.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {showResult && (
            <Button onClick={nextQuestion} className="w-full gradient-primary text-primary-foreground">
              {currentQ < activeQuiz.length - 1 ? 'Next Question' : 'See Results'}
            </Button>
          )}
        </motion.div>
      </div>
    );
  }

  if (quizComplete) {
    const percentage = Math.round((score / activeQuiz!.length) * 100);

    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[70vh] space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center"
        >
          <Trophy className="w-12 h-12 text-primary-foreground" />
        </motion.div>

        <div className="text-center">
          <h2 className="text-3xl font-display font-bold text-foreground mb-2">
            {percentage >= 80 ? 'Amazing!' : percentage >= 60 ? 'Good job!' : 'Keep practicing!'}
          </h2>
          <p className="text-muted-foreground">
            You scored {score} out of {activeQuiz!.length}
          </p>
        </div>

        <div className="text-6xl font-display font-bold gradient-text">
          {percentage}%
        </div>

        <div className="flex gap-3 w-full flex-col sm:flex-row">
          <Button variant="outline" onClick={exitQuiz} className="flex-1">
            Back to Quizzes
          </Button>
          <Link to="/notes" className="flex-1">
            <Button className="w-full gradient-primary text-primary-foreground">
              Study More
            </Button>
          </Link>
        </div>

        {/* Review with Tutor Button */}
        {score < activeQuiz!.length && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full"
          >
            <Button
              onClick={() => {
                const missedIndices = activeQuiz!.map((q, i) => userAnswers[i] !== q.correct ? i : -1).filter(i => i !== -1);
                const context = `I just finished a quiz and got these questions wrong:\n\n` +
                  missedIndices.map(i => {
                    const q = activeQuiz![i];
                    return `- Q: ${q.question}\n  Correct Answer: ${q.options[q.correct]}\n  My Answer: ${q.options[userAnswers[i]]}`;
                  }).join('\n\n');

                navigate('/notes', {
                  state: {
                    openTutor: true,
                    courseId: currentCourseId,
                    noteId: currentNoteId,
                    tutorContext: context
                  }
                });
              }}
              className="w-full gradient-secondary text-secondary-foreground"
            >
              <Brain className="w-4 h-4 mr-2" />
              Review Missed Questions with Tutor
            </Button>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold text-foreground">Quizzes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Test your knowledge with AI-generated quizzes
        </p>
      </motion.header>

      <Tabs defaultValue="start" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="start" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Start Quiz
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="start" className="mt-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl gradient-primary text-primary-foreground"
          >
            <h3 className="text-lg font-semibold mb-2">Ready to test yourself?</h3>
            <p className="text-sm opacity-90 mb-4">
              Generate quizzes from your notes to reinforce learning
            </p>
            <Link to="/notes">
              <Button className="bg-white/20 hover:bg-white/30 text-white">
                <Sparkles className="w-4 h-4 mr-2" />
                Go to Notes
              </Button>
            </Link>
          </motion.div>

          <section>
            <h2 className="text-lg font-display font-semibold mb-4">Recent Attempts</h2>

            {attempts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No quizzes yet</h3>
                <p className="text-muted-foreground text-sm">
                  Take your first quiz from your notes
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {attempts.map((attempt, i) => (
                  <motion.div
                    key={attempt.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        Score: {attempt.score}/{attempt.total_questions}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(attempt.completed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-2xl font-bold gradient-text">
                      {Math.round((attempt.score / attempt.total_questions) * 100)}%
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <QuizHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Quizzes;