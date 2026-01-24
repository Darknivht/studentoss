import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, RotateCcw, Check, X, Sparkles, BookOpen, List, BarChart3, Brain, WifiOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { updateCourseProgress } from '@/hooks/useCourseProgress';
import { runAchievementCheck } from '@/hooks/useAchievements';
import { updateStreak } from '@/lib/streak';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import FlashcardsList from '@/components/flashcards/FlashcardsList';
import StudyStatistics from '@/components/study/StudyStatistics';
import { useOfflineData } from '@/hooks/useOfflineData';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review: string;
  note_id: string | null;
  course_id: string | null;
}

const Flashcards = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const offlineData = useOfflineData();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studyMode, setStudyMode] = useState(false);
  const { startTracking, stopTracking } = useActivityTracking({ activityType: 'flashcard' });

  useEffect(() => {
    if (user) fetchFlashcards();
  }, [user]);

  const fetchFlashcards = async () => {
    try {
      // Use offline-aware fetch that falls back to cached data
      const cards = await offlineData.fetchFlashcards();
      setFlashcards(cards);

      // Filter due cards
      const now = new Date();
      const due = cards.filter((c: any) => new Date(c.next_review) <= now);
      setDueCards(due);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNextReview = (card: Flashcard, quality: number) => {
    // SM-2 Algorithm
    let { ease_factor, interval_days, repetitions } = card;

    if (quality < 3) {
      // Wrong answer - reset
      repetitions = 0;
      interval_days = 0;
    } else {
      // Correct answer
      if (repetitions === 0) {
        interval_days = 1;
      } else if (repetitions === 1) {
        interval_days = 6;
      } else {
        interval_days = Math.round(interval_days * ease_factor);
      }
      repetitions += 1;
    }

    // Update ease factor
    ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    const next_review = new Date();
    next_review.setDate(next_review.getDate() + interval_days);

    return { ease_factor, interval_days, repetitions, next_review: next_review.toISOString() };
  };

  const navigate = useNavigate();
  const [missedCards, setMissedCards] = useState<Flashcard[]>([]);

  // ... (keep other state)

  // ... (keep useEffect and fetchFlashcards)

  // ... (keep calculateNextReview)

  const handleAnswer = async (quality: number) => {
    const card = dueCards[currentIndex];
    if (!card) return;

    // Track missed cards
    if (quality < 3) {
      setMissedCards(prev => {
        // Avoid duplicates if user sees card multiple times in session (though standard SM-2 here doesn't repeat immediately in same session logic implemented simply)
        if (prev.some(c => c.id === card.id)) return prev;
        return [...prev, card];
      });
    }

    const updates = calculateNextReview(card, quality);

    try {
      await supabase
        .from('flashcards')
        .update(updates)
        .eq('id', card.id);

      // Move to next card
      setIsFlipped(false);

      if (currentIndex < dueCards.length - 1) {
        setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
      } else {
        setStudyMode(false);
        stopTracking(); // Stop activity tracking when session ends
        toast({
          title: 'Session complete! 🎉',
          description: `You reviewed ${dueCards.length} cards.`,
        });

        // Update course progress for all unique courses in reviewed cards
        if (user?.id) {
          const courseIds = new Set(dueCards.map(c => c.course_id).filter(Boolean));
          for (const courseId of courseIds) {
            if (courseId) {
              updateCourseProgress(user.id, courseId);
            }
          }

          // Check for achievements
          await updateStreak(user.id);
          runAchievementCheck(user.id);
        }

        fetchFlashcards();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save progress.',
        variant: 'destructive',
      });
    }
  };

  const startStudy = () => {
    setStudyMode(true);
    setCurrentIndex(0);
    setIsFlipped(false);
    setMissedCards([]); // Reset missed cards
    startTracking(); // Start activity tracking
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (studyMode && dueCards.length > 0) {
    const card = dueCards[currentIndex];

    return (
      <div className="p-6 space-y-6">
        <header className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => { stopTracking(); setStudyMode(false); }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {dueCards.length}
          </span>
        </header>

        <div className="perspective-1000">
          <motion.div
            className="relative w-full aspect-[4/3] cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border flex items-center justify-center backface-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <p className="text-xl font-medium text-foreground text-center">
                {card.front}
              </p>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 p-8 rounded-3xl bg-gradient-to-br from-accent/10 to-primary/10 border border-border flex items-center justify-center"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <p className="text-xl font-medium text-foreground text-center">
                {card.back}
              </p>
            </div>
          </motion.div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {isFlipped ? 'How well did you know this?' : 'Tap to reveal answer'}
        </p>

        <AnimatePresence>
          {isFlipped && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex justify-center gap-3"
            >
              <Button
                variant="outline"
                className="flex-1 py-6 border-red-500/50 text-red-500 hover:bg-red-500/10"
                onClick={() => handleAnswer(1)}
              >
                <X className="w-5 h-5 mr-2" />
                Again
              </Button>
              <Button
                variant="outline"
                className="flex-1 py-6 border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                onClick={() => handleAnswer(3)}
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Hard
              </Button>
              <Button
                variant="outline"
                className="flex-1 py-6 border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10"
                onClick={() => handleAnswer(5)}
              >
                <Check className="w-5 h-5 mr-2" />
                Easy
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-display font-bold text-foreground">Flashcards</h1>
          {!offlineData.isOnline && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
              <WifiOff className="w-3 h-3" />
              Offline
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          {offlineData.isOnline ? 'Spaced repetition for better retention' : 'Viewing cached flashcards'}
        </p>
      </motion.header>

      {/* Study Now Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl gradient-primary text-primary-foreground"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">{dueCards.length}</h3>
            <p className="text-sm opacity-90">Cards due for review</p>
          </div>
          <Button
            onClick={startStudy}
            disabled={dueCards.length === 0}
            className="bg-white/20 hover:bg-white/30 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Study Now
          </Button>
        </div>
      </motion.div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="cards" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            My Cards
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-card border border-border">
              <p className="text-2xl font-bold text-foreground">{flashcards.length}</p>
              <p className="text-xs text-muted-foreground">Total Cards</p>
            </div>
            <div className="p-4 rounded-2xl bg-card border border-border">
              <p className="text-2xl font-bold text-foreground">
                {flashcards.filter((c) => c.repetitions > 0).length}
              </p>
              <p className="text-xs text-muted-foreground">Learned</p>
            </div>
          </div>

          {/* Empty State or Generate CTA */}
          {flashcards.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No flashcards yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Generate flashcards from your notes
              </p>
              <Link to="/notes">
                <Button variant="outline">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Go to Notes
                </Button>
              </Link>
            </motion.div>
          )}

          {/* Session Complete / Missed Cards Review */}
          {!studyMode && missedCards.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-3xl bg-card border border-border mt-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Need help with missed cards?</h3>
                  <p className="text-sm text-muted-foreground">
                    You struggled with {missedCards.length} cards. The AI Tutor can help you understand them.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    const context = `I just finished a flashcard session and struggled with these concepts:\n\n` +
                      missedCards.map(c => `- Q: ${c.front}\n  A: ${c.back}`).join('\n');

                    // Find a course ID from the cards if possible
                    const courseId = missedCards[0]?.course_id || dueCards[0]?.course_id;

                    navigate('/notes', {
                      state: {
                        openTutor: true,
                        courseId: courseId,
                        tutorContext: context
                      }
                    });
                  }}
                  className="gradient-secondary text-secondary-foreground"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Review with Tutor
                </Button>
              </div>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="cards" className="mt-4">
          <FlashcardsList />
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <StudyStatistics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Flashcards;
