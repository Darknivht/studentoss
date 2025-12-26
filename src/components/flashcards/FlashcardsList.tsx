import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BookOpen, 
  Trash2, 
  ChevronRight, 
  FolderOpen,
  Layers,
  Clock
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  course_id: string | null;
  note_id: string | null;
  next_review: string;
  repetitions: number;
}

interface Course {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface FlashcardGroup {
  course: Course | null;
  cards: Flashcard[];
}

interface FlashcardsListProps {
  onSelectCard?: (card: Flashcard) => void;
}

const FlashcardsList = ({ onSelectCard }: FlashcardsListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [flashcardsRes, coursesRes] = await Promise.all([
        supabase
          .from('flashcards')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('courses')
          .select('*')
          .eq('user_id', user?.id),
      ]);

      if (flashcardsRes.error) throw flashcardsRes.error;
      if (coursesRes.error) throw coursesRes.error;

      setFlashcards(flashcardsRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!cardToDelete) return;

    try {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', cardToDelete);

      if (error) throw error;

      setFlashcards(prev => prev.filter(c => c.id !== cardToDelete));
      toast({
        title: 'Card deleted',
        description: 'Flashcard has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete flashcard.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setCardToDelete(null);
    }
  };

  const groupedFlashcards = (): FlashcardGroup[] => {
    const groups: FlashcardGroup[] = [];

    // Group by course
    const courseMap = new Map<string | null, Flashcard[]>();
    flashcards.forEach(card => {
      const key = card.course_id || 'uncategorized';
      if (!courseMap.has(key)) {
        courseMap.set(key, []);
      }
      courseMap.get(key)!.push(card);
    });

    // Add course groups
    courses.forEach(course => {
      const cards = courseMap.get(course.id) || [];
      if (cards.length > 0) {
        groups.push({ course, cards });
      }
    });

    // Add uncategorized group
    const uncategorized = courseMap.get('uncategorized') || [];
    if (uncategorized.length > 0) {
      groups.push({ course: null, cards: uncategorized });
    }

    return groups;
  };

  const getDueStatus = (nextReview: string) => {
    const now = new Date();
    const reviewDate = new Date(nextReview);
    if (reviewDate <= now) return 'due';
    const diff = reviewDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 1) return 'soon';
    return 'later';
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Layers className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-semibold text-lg mb-2">No flashcards yet</h3>
        <p className="text-muted-foreground text-sm">
          Generate flashcards from your notes to get started
        </p>
      </div>
    );
  }

  const groups = groupedFlashcards();

  return (
    <>
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-4 pr-4">
          {groups.map((group, groupIndex) => (
            <motion.div
              key={group.course?.id || 'uncategorized'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
              className="rounded-2xl border border-border overflow-hidden"
            >
              {/* Course Header */}
              <button
                onClick={() => setExpandedCourse(
                  expandedCourse === (group.course?.id || 'uncategorized')
                    ? null
                    : (group.course?.id || 'uncategorized')
                )}
                className="w-full p-4 flex items-center justify-between bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{
                      backgroundColor: group.course?.color
                        ? `${group.course.color}20`
                        : 'hsl(var(--muted))',
                    }}
                  >
                    {group.course?.icon || <FolderOpen className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">
                      {group.course?.name || 'Uncategorized'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {group.cards.length} card{group.cards.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-muted-foreground transition-transform ${
                    expandedCourse === (group.course?.id || 'uncategorized')
                      ? 'rotate-90'
                      : ''
                  }`}
                />
              </button>

              {/* Flashcards List */}
              <AnimatePresence>
                {expandedCourse === (group.course?.id || 'uncategorized') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-border"
                  >
                    {group.cards.map((card, cardIndex) => {
                      const status = getDueStatus(card.next_review);
                      return (
                        <motion.div
                          key={card.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: cardIndex * 0.05 }}
                          className="p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => onSelectCard?.(card)}
                            >
                              <p className="font-medium text-foreground text-sm line-clamp-2">
                                {card.front}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {card.back}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    status === 'due'
                                      ? 'bg-red-500/10 text-red-500'
                                      : status === 'soon'
                                      ? 'bg-amber-500/10 text-amber-500'
                                      : 'bg-emerald-500/10 text-emerald-500'
                                  }`}
                                >
                                  {status === 'due'
                                    ? 'Due now'
                                    : status === 'soon'
                                    ? 'Due soon'
                                    : 'Scheduled'}
                                </span>
                                {card.repetitions > 0 && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {card.repetitions} reviews
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCardToDelete(card.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flashcard</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this flashcard? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FlashcardsList;
