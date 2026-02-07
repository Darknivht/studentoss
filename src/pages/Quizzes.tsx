import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle, Trophy, BookOpen, Sparkles, Loader2, History, Brain, FileText, ArrowRight } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { streamAIChat } from '@/lib/ai';
import { updateCourseProgress } from '@/hooks/useCourseProgress';
import { runAchievementCheck } from '@/hooks/useAchievements';
import { updateStreak } from '@/lib/streak';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import { QuizHistory } from '@/components/quiz/QuizHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { parseQuizResponse, QuizQuestion } from '@/lib/parseAIResponse';
import { useSubscription } from '@/hooks/useSubscription';
import UpgradePrompt from '@/components/subscription/UpgradePrompt';

interface QuizAttempt {
  id: string;
  score: number;
  total_questions: number;
  completed_at: string;
  note_id?: string;
  course_id?: string;
}

// QuizQuestion interface is imported from parseAIResponse

interface Course {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
}

interface Note {
  id: string;
  title: string;
  content: string | null;
  course_id: string | null;
}

type QuizSourceMode = 'course' | 'note';

const Quizzes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkLimit, getRemainingUses, incrementUsage } = useSubscription();
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
  const [currentNoteName, setCurrentNoteName] = useState<string | null>(null);
  const [currentCourseName, setCurrentCourseName] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const { startTracking, stopTracking } = useActivityTracking({ activityType: 'quiz' });
  const quizStartTimeRef = useRef<number | null>(null);

  // Source selection state
  const [courses, setCourses] = useState<Course[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [sourceMode, setSourceMode] = useState<QuizSourceMode>('course');
  const [showSourceSelection, setShowSourceSelection] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAttempts();
      fetchSourceData();

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

  const fetchSourceData = async () => {
    try {
      const [coursesRes, notesRes] = await Promise.all([
        supabase
          .from('courses')
          .select('id, name, color, icon')
          .eq('user_id', user?.id)
          .order('name', { ascending: true }),
        supabase
          .from('notes')
          .select('id, title, content, course_id')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
      ]);

      if (coursesRes.error) throw coursesRes.error;
      if (notesRes.error) throw notesRes.error;

      setCourses(coursesRes.data || []);
      setNotes(notesRes.data || []);
    } catch (error) {
      console.error('Error fetching source data:', error);
    }
  };

  const getNotesCountForCourse = (courseId: string) => {
    return notes.filter(n => n.course_id === courseId).length;
  };

  const generateQuizFromCourse = async (courseId: string, courseName?: string) => {
    if (!checkLimit('quiz')) {
      toast({ title: 'Daily quiz limit reached', description: 'Upgrade for more quizzes.', variant: 'destructive' });
      return;
    }
    await incrementUsage('quiz');
    setGenerating(true);
    setCurrentNoteId(null);
    setCurrentCourseId(courseId);
    setCurrentNoteName(null);
    setCurrentCourseName(courseName || null);
    setShowSourceSelection(false);

    try {
      // Fetch all notes for the course
      const { data: courseNotes, error } = await supabase
        .from('notes')
        .select('content')
        .eq('course_id', courseId)
        .eq('user_id', user?.id);

      if (error || !courseNotes || courseNotes.length === 0) {
        throw new Error('No notes found for this course');
      }

      // Get course name if not provided
      if (!courseName) {
        const course = courses.find(c => c.id === courseId);
        if (course) setCurrentCourseName(course.name);
      }

      // Concatenate content (limit to ~30k chars)
      const allContent = courseNotes.map(n => n.content).join('\n\n---\n\n').slice(0, 30000);

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
            const quizData = parseQuizResponse(fullResponse);
            setActiveQuiz(quizData);
            setUserAnswers([]);
            startTracking();
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
        description: 'Failed to load course notes.',
        variant: 'destructive',
      });
      setGenerating(false);
    }
  };

  const generateQuizFromNote = async (noteId: string, noteName?: string) => {
    if (!checkLimit('quiz')) {
      toast({ title: 'Daily quiz limit reached', description: 'Upgrade for more quizzes.', variant: 'destructive' });
      return;
    }
    await incrementUsage('quiz');
    setGenerating(true);
    setCurrentNoteId(noteId);
    setCurrentCourseId(null);
    setCurrentNoteName(noteName || null);
    setCurrentCourseName(null);
    setShowSourceSelection(false);

    try {
      // Fetch the note content
      const { data: note, error } = await supabase
        .from('notes')
        .select('content, course_id, title')
        .eq('id', noteId)
        .single();

      if (error || !note?.content) {
        throw new Error('Note not found');
      }

      if (note.course_id) {
        setCurrentCourseId(note.course_id);
        const course = courses.find(c => c.id === note.course_id);
        if (course) setCurrentCourseName(course.name);
      }

      if (!noteName) {
        setCurrentNoteName(note.title);
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
            const quizData = parseQuizResponse(fullResponse);
            setActiveQuiz(quizData);
            setUserAnswers([]);
            startTracking();
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

  const buildQuizResultsContext = () => {
    if (!activeQuiz) return '';

    const missedIndices = activeQuiz.map((q, i) => userAnswers[i] !== q.correct ? i : -1).filter(i => i !== -1);
    const correctIndices = activeQuiz.map((q, i) => userAnswers[i] === q.correct ? i : -1).filter(i => i !== -1);

    let context = `Quiz Results: ${score}/${activeQuiz.length} (${Math.round((score / activeQuiz.length) * 100)}%)\n\n`;

    if (missedIndices.length > 0) {
      context += `❌ Questions I got wrong:\n\n`;
      missedIndices.forEach(i => {
        const q = activeQuiz[i];
        context += `Q: ${q.question}\n`;
        context += `My Answer: ${q.options[userAnswers[i]]}\n`;
        context += `Correct Answer: ${q.options[q.correct]}\n`;
        context += `Explanation: ${q.explanation}\n\n`;
      });
    }

    if (correctIndices.length > 0) {
      context += `✅ Questions I got right:\n\n`;
      correctIndices.forEach(i => {
        const q = activeQuiz[i];
        context += `Q: ${q.question}\n`;
        context += `Correct Answer: ${q.options[q.correct]}\n\n`;
      });
    }

    return context;
  };

  const handleReviewWithTutor = () => {
    const quizContext = buildQuizResultsContext();
    
    // Navigate to tutor with quiz context
    navigate('/tutor', {
      state: {
        quizContext,
        courseId: currentCourseId,
        noteId: currentNoteId,
        courseName: currentCourseName,
        noteName: currentNoteName,
        autoStart: true,
      }
    });
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
    setCurrentNoteName(null);
    setCurrentCourseName(null);
    setUserAnswers([]);
    setShowSourceSelection(false);
  };

  if (generating) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <h2 className="text-xl font-display font-semibold text-foreground">
          Generating Quiz...
        </h2>
        <p className="text-muted-foreground text-sm">
          AI is creating questions from your {sourceMode === 'course' ? 'course notes' : 'note'}
        </p>
      </div>
    );
  }

  // Source Selection Screen
  if (showSourceSelection) {
    return (
      <div className="p-6 space-y-6">
        <header className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setShowSourceSelection(false)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Create Quiz</h1>
            <p className="text-sm text-muted-foreground">Choose your quiz source</p>
          </div>
        </header>

        <Tabs value={sourceMode} onValueChange={(v) => setSourceMode(v as QuizSourceMode)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="course" className="flex items-center gap-2 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <BookOpen className="w-4 h-4" />
              Course
            </TabsTrigger>
            <TabsTrigger value="note" className="flex items-center gap-2 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <FileText className="w-4 h-4" />
              Note
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {/* Course Selection */}
            <TabsContent value="course" className="mt-4">
              <motion.div
                key="course-list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 mb-4">
                  <p className="text-sm text-muted-foreground">
                    <Brain className="w-4 h-4 inline mr-1" />
                    Course-based quizzes combine all notes from a course. After the quiz, you'll be able to review with the <strong>Course AI Tutor</strong>.
                  </p>
                </div>

                {courses.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">No courses yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Create courses on the dashboard first
                    </p>
                    <Link to="/">
                      <Button variant="outline">Go to Dashboard</Button>
                    </Link>
                  </div>
                ) : (
                  <ScrollArea className="h-[50vh]">
                    <div className="space-y-3 pr-4">
                      {courses.map((course, index) => {
                        const notesCount = getNotesCountForCourse(course.id);
                        return (
                          <motion.button
                            key={course.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => generateQuizFromCourse(course.id, course.name)}
                            disabled={notesCount === 0}
                            className="w-full p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: course.color ? `${course.color}20` : 'hsl(var(--primary) / 0.1)' }}
                              >
                                <BookOpen
                                  className="w-5 h-5"
                                  style={{ color: course.color || 'hsl(var(--primary))' }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-foreground truncate">{course.name}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {notesCount} {notesCount === 1 ? 'note' : 'notes'}
                                </p>
                              </div>
                              {notesCount > 0 ? (
                                <ArrowRight className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <span className="text-xs text-muted-foreground">No notes</span>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </motion.div>
            </TabsContent>

            {/* Note Selection */}
            <TabsContent value="note" className="mt-4">
              <motion.div
                key="note-list"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="p-4 rounded-2xl bg-secondary/5 border border-secondary/20 mb-4">
                  <p className="text-sm text-muted-foreground">
                    <Brain className="w-4 h-4 inline mr-1" />
                    Note-based quizzes focus on a single note. After the quiz, you'll be able to review with the <strong>Note AI Tutor</strong>.
                  </p>
                </div>

                {notes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">No notes yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Create notes first to generate quizzes
                    </p>
                    <Link to="/notes">
                      <Button variant="outline">Go to Notes</Button>
                    </Link>
                  </div>
                ) : (
                  <ScrollArea className="h-[50vh]">
                    <div className="space-y-3 pr-4">
                      {notes.filter(n => n.content).map((note, index) => (
                        <motion.button
                          key={note.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => generateQuizFromNote(note.id, note.title)}
                          className="w-full p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-foreground truncate">{note.title}</h3>
                              <p className="text-xs text-muted-foreground truncate">
                                {note.content?.slice(0, 50)}...
                              </p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
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
          {(currentCourseName || currentNoteName) && (
            <p className="text-sm text-muted-foreground mt-1">
              {sourceMode === 'course' ? `Course: ${currentCourseName}` : `Note: ${currentNoteName}`}
            </p>
          )}
        </div>

        <div className="text-6xl font-display font-bold gradient-text">
          {percentage}%
        </div>

        <div className="flex gap-3 w-full flex-col sm:flex-row">
          <Button variant="outline" onClick={exitQuiz} className="flex-1">
            Back to Quizzes
          </Button>
          <Button onClick={() => setShowSourceSelection(true)} className="flex-1" variant="secondary">
            <Sparkles className="w-4 h-4 mr-2" />
            Take Another Quiz
          </Button>
        </div>

        {/* Review with Tutor Button - Always show for redirect to AI Tutor */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full"
        >
          <Button
            onClick={handleReviewWithTutor}
            className="w-full gradient-secondary text-secondary-foreground"
          >
            <Brain className="w-4 h-4 mr-2" />
            {score === activeQuiz!.length 
              ? 'Celebrate with AI Tutor' 
              : 'Review Results with AI Tutor'
            }
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            {currentCourseId && !currentNoteId 
              ? 'Opens Course Mode AI Tutor' 
              : currentNoteId 
                ? 'Opens Note Mode AI Tutor' 
                : 'Opens AI Tutor'
            }
          </p>
        </motion.div>
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
              Generate quizzes from your courses or notes and review with AI Tutor
            </p>
            <Button 
              onClick={() => setShowSourceSelection(true)}
              className="bg-white/20 hover:bg-white/30 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create Quiz
            </Button>
          </motion.div>

          {/* Quick Actions */}
          <section>
            <h2 className="text-lg font-display font-semibold mb-4">Quick Start</h2>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => {
                  setSourceMode('course');
                  setShowSourceSelection(true);
                }}
              >
                <BookOpen className="w-6 h-6 text-primary" />
                <span className="text-sm">Course Quiz</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => {
                  setSourceMode('note');
                  setShowSourceSelection(true);
                }}
              >
                <FileText className="w-6 h-6 text-primary" />
                <span className="text-sm">Note Quiz</span>
              </Button>
            </div>
          </section>

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
