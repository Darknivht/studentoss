import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Zap, ChevronRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CramModeProps {
  onBack: () => void;
}

const CramMode = ({ onBack }: CramModeProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [flashcards, setFlashcards] = useState<{ front: string; back: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cardsReviewed, setCardsReviewed] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (user) fetchFlashcards();
  }, [user]);

  const fetchFlashcards = async () => {
    try {
      const { data } = await supabase
        .from('flashcards')
        .select('front, back')
        .eq('user_id', user?.id)
        .limit(50);
      
      if (data && data.length > 0) {
        // Shuffle for variety
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setFlashcards(shuffled);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load flashcards', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const nextCard = useCallback(() => {
    setIsFlipped(false);
    setCardsReviewed(c => c + 1);
    setTimeout(() => {
      setCurrentIndex(i => (i + 1) % flashcards.length);
    }, 200);
  }, [flashcards.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (isFlipped) {
          nextCard();
        } else {
          setIsFlipped(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, nextCard]);

  const getElapsedTime = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading flashcards...</p>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Zap className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-bold">No Flashcards Yet</h2>
        <p className="text-muted-foreground text-center">Generate flashcards from your notes first!</p>
        <Button onClick={onBack} variant="outline">Back to Study Tools</Button>
      </div>
    );
  }

  const card = flashcards[currentIndex];

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <header className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Exit
        </Button>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{cardsReviewed} reviewed</span>
          <span className="font-mono">{getElapsedTime()}</span>
        </div>
      </header>

      <div className="flex items-center justify-center gap-2 text-primary">
        <Zap className="w-5 h-5" />
        <span className="font-bold">CRAM MODE</span>
        <Zap className="w-5 h-5" />
      </div>

      <div className="perspective-1000 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -100 }}
            className="relative w-full aspect-[4/3] cursor-pointer"
            onClick={() => isFlipped ? nextCard() : setIsFlipped(true)}
          >
            <motion.div
              className="w-full h-full"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.4 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border flex items-center justify-center"
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
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          {isFlipped ? 'Tap or press Space to continue' : 'Tap or press Space to reveal'}
        </p>
        
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button onClick={nextCard} className="gradient-primary text-primary-foreground">
              Next Card <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}
      </div>

      <div className="text-center text-xs text-muted-foreground">
        Card {currentIndex + 1} of {flashcards.length}
      </div>
    </div>
  );
};

export default CramMode;