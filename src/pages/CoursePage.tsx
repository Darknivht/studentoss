import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Brain, GraduationCap, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import NoteCard from '@/components/notes/NoteCard';
import NoteViewerDialog from '@/components/notes/NoteViewerDialog';
import { streamAIChat } from '@/lib/ai';
import { updateCourseProgress } from '@/hooks/useCourseProgress';
import { runAchievementCheck } from '@/hooks/useAchievements';

interface Note {
  id: string;
  title: string;
  content: string | null;
  summary: string | null;
  source_type: string | null;
  file_url: string | null;
  original_filename: string | null;
  created_at: string | null;
  course_id: string | null;
}

interface Course {
  id: string;
  name: string;
  icon: string;
  color: string;
  progress: number;
}

const CoursePage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [allCourses, setAllCourses] = useState<{ id: string; name: string; icon: string }[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [flashcardCount, setFlashcardCount] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);

  useEffect(() => {
    if (user && courseId) {
      fetchCourseData();
      fetchAllCourses();
    }
  }, [user, courseId]);

  const fetchAllCourses = async () => {
    try {
      const { data } = await supabase
        .from('courses')
        .select('id, name, icon')
        .eq('user_id', user?.id)
        .order('name');

      if (data) {
        setAllCourses(data as any);
      }
    } catch (error) {
      console.error('Error fetching all courses:', error);
    }
  };

  const fetchCourseData = async () => {
    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('user_id', user?.id)
        .single();

      if (courseError || !courseData) {
        toast({ title: 'Error', description: 'Course not found', variant: 'destructive' });
        navigate('/');
        return;
      }

      setCourse(courseData);

      // Fetch notes for this course
      const { data: notesData } = await supabase
        .from('notes')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      setNotes(notesData || []);

      // Fetch flashcard count
      const { count: flashCards } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId)
        .eq('user_id', user?.id);

      setFlashcardCount(flashCards || 0);

      // Fetch quiz count
      const { count: quizzes } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId)
        .eq('user_id', user?.id);

      setQuizCount(quizzes || 0);
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(notes.filter(n => n.id !== noteId));
      toast({ title: 'Note deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete note', variant: 'destructive' });
    }
  };

  const handleCourseUpdate = async (noteId: string, newCourseId: string | null) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ course_id: newCourseId })
        .eq('id', noteId);

      if (error) throw error;

      // If the note is moved to a different course (or no course), remove it from the current list
      if (newCourseId !== courseId) {
        setNotes(notes.filter(n => n.id !== noteId));
        if (selectedNote?.id === noteId) {
          setSelectedNote(null);
        }
        toast({
          title: 'Note moved',
          description: 'Note has been moved to another course.',
        });
      } else {
        // If for some reason it's the same course, just update local state (unlikely but safe)
        setNotes(notes.map(n => n.id === noteId ? { ...n, course_id: newCourseId } : n));
      }

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update course.',
        variant: 'destructive',
      });
    }
  };

  const extractJsonFromAI = (raw: string) => {
    // Try fenced JSON first
    const fence = raw.match(/```json\s*([\s\S]*?)\s*```/i);
    if (fence?.[1]) return fence[1].trim();

    // Otherwise try to slice the first JSON object/array out of the stream
    const trimmed = raw.trim();
    const objStart = trimmed.indexOf('{');
    const objEnd = trimmed.lastIndexOf('}');
    if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
      return trimmed.slice(objStart, objEnd + 1);
    }

    const arrStart = trimmed.indexOf('[');
    const arrEnd = trimmed.lastIndexOf(']');
    if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
      return trimmed.slice(arrStart, arrEnd + 1);
    }

    return trimmed;
  };

  const handleGenerateCourseFlashcards = async () => {
    if (notes.length === 0) {
      toast({ title: 'No notes', description: 'Add some notes first!', variant: 'destructive' });
      return;
    }

    setGeneratingFlashcards(true);
    try {
      // Concatenate all note content (limit to ~20k chars to avoid token limits if needed, but for now send all)
      const allContent = notes.map(n => n.content).join('\n\n---\n\n').slice(0, 30000);

      let fullResponse = '';
      await streamAIChat({
        messages: [],
        mode: 'flashcards',
        content: `Create flashcards for this entire course content:\n\n${allContent}`,
        onDelta: (chunk) => {
          fullResponse += chunk;
        },
        onDone: async () => {
          try {
            const jsonStr = extractJsonFromAI(fullResponse);
            const parsed = JSON.parse(jsonStr);
            const flashcardsData = Array.isArray(parsed)
              ? parsed
              : (parsed.flashcards || []);

            const flashcardsToInsert = flashcardsData
              .filter((fc: any) => fc?.front && fc?.back)
              .map((fc: { front: string; back: string }) => ({
                user_id: user!.id,
                course_id: courseId,
                front: fc.front,
                back: fc.back,
              }));

            if (flashcardsToInsert.length > 0) {
              await supabase.from('flashcards').insert(flashcardsToInsert);

              if (user?.id && courseId) {
                updateCourseProgress(user.id, courseId);
              }

              // Refresh count
              const { count } = await supabase
                .from('flashcards')
                .select('*', { count: 'exact', head: true })
                .eq('course_id', courseId)
                .eq('user_id', user?.id);
              setFlashcardCount(count || 0);
            }

            toast({
              title: `Created ${flashcardsToInsert.length} flashcards! 🎴`,
              description: 'Go to Flashcards to start studying.',
            });
          } catch (e) {
            console.error('Failed to parse/insert flashcards:', e, fullResponse);
            toast({
              title: 'Error',
              description: 'AI response was not valid flashcard JSON.',
              variant: 'destructive',
            });
          }
          setGeneratingFlashcards(false);
        },
        onError: (err) => {
          toast({ title: 'Error', description: err, variant: 'destructive' });
          setGeneratingFlashcards(false);
        },
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate flashcards.', variant: 'destructive' });
      setGeneratingFlashcards(false);
    }
  };

  const handleGenerateCourseQuiz = () => {
    if (notes.length === 0) {
      toast({ title: 'No notes', description: 'Add some notes first!', variant: 'destructive' });
      return;
    }
    // Navigate to quiz page with courseId param
    navigate(`/quizzes?courseId=${courseId}`);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ backgroundColor: `${course.color}20` }}
          >
            {course.icon}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold text-foreground">{course.name}</h1>
          <div className="flex items-center gap-2 mt-1">
              <Progress value={course.progress} className="flex-1 h-2" />
              <span className="text-sm font-medium" style={{ color: course.color }}>
                {course.progress}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Notes (30%) + Quizzes (30%) + Flashcards (40%)
            </p>
          </div>
        </div>
      </motion.header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-card border border-border text-center"
        >
          <FileText className="w-6 h-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold text-foreground">{notes.length}</p>
          <p className="text-xs text-muted-foreground">Notes</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-card border border-border text-center"
        >
          <Brain className="w-6 h-6 mx-auto mb-2 text-accent" />
          <p className="text-2xl font-bold text-foreground">{flashcardCount}</p>
          <p className="text-xs text-muted-foreground">Flashcards</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-2xl bg-card border border-border text-center"
        >
          <GraduationCap className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
          <p className="text-2xl font-bold text-foreground">{quizCount}</p>
          <p className="text-xs text-muted-foreground">Quizzes</p>
        </motion.div>
      </div>

      {/* Course Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleGenerateCourseFlashcards}
          disabled={generatingFlashcards || notes.length === 0}
          className="flex-1 gradient-secondary text-secondary-foreground"
        >
          {generatingFlashcards ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Brain className="w-4 h-4 mr-2" />
          )}
          Generate Flashcards
        </Button>
        <Button
          onClick={handleGenerateCourseQuiz}
          disabled={notes.length === 0}
          className="flex-1 gradient-primary text-primary-foreground"
        >
          <GraduationCap className="w-4 h-4 mr-2" />
          Take Course Quiz
        </Button>
      </div>

      {/* Notes Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-foreground">Course Notes</h2>
          <Link to={`/notes?courseId=${courseId}`}>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </Link>
        </div>

        {notes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-muted/30 rounded-2xl"
          >
            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-medium text-foreground mb-1">No notes yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first note to this course
            </p>
            <Link to={`/notes?courseId=${courseId}`}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Note
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {notes.map((note, index) => (
              <NoteCard
                key={note.id}
                note={{
                  ...note,
                  source_type: note.source_type || 'text',
                  created_at: note.created_at || new Date().toISOString(),
                }}
                index={index}
                onDelete={handleDeleteNote}
                onSummarize={() => setSelectedNote(note)}
                onTutor={() => setSelectedNote(note)}
                onViewContent={() => setSelectedNote(note)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Note Viewer Dialog */}
      {selectedNote && (
        <NoteViewerDialog
          note={{
            ...selectedNote,
            source_type: selectedNote.source_type || 'text',
          }}
          open={!!selectedNote}
          onOpenChange={(open) => !open && setSelectedNote(null)}
          courses={allCourses}
          onCourseChange={(newCourseId) => selectedNote && handleCourseUpdate(selectedNote.id, newCourseId)}
        />
      )}
    </div>
  );
};

export default CoursePage;