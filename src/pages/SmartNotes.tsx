import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NoteCard from '@/components/notes/NoteCard';
import SocraticTutor from '@/components/notes/SocraticTutor';
import AISummaryDialog from '@/components/notes/AISummaryDialog';
import FileUpload from '@/components/notes/FileUpload';
import NoteViewerDialog from '@/components/notes/NoteViewerDialog';
import { Plus, FileText, Sparkles, Loader2, WifiOff } from 'lucide-react';
import { streamAIChat } from '@/lib/ai';
import { updateCourseProgress } from '@/hooks/useCourseProgress';
import { runAchievementCheck } from '@/hooks/useAchievements';
import { updateStreak } from '@/lib/streak';
import { useLocation } from 'react-router-dom';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useOfflineData } from '@/hooks/useOfflineData';
import { useSubscription } from '@/hooks/useSubscription';
import UpgradePrompt from '@/components/subscription/UpgradePrompt';

interface Note {
  id: string;
  title: string;
  content: string | null;
  summary: string | null;
  source_type: string;
  created_at: string;
  course_id: string | null;
  file_url?: string | null;
  original_filename?: string | null;
}

interface Course {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const SmartNotes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const offlineData = useOfflineData();
  const { queueAction, isOnline } = useOfflineSync();
  const { checkLimit, getRemainingUses, incrementUsage } = useSubscription();
  const [notes, setNotes] = useState<Note[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('none');
  const [filterCourseId, setFilterCourseId] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showTutor, setShowTutor] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState<string | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [originalFilename, setOriginalFilename] = useState<string | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [tutorContext, setTutorContext] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (user) {
      fetchNotes();
      fetchCourses();
    }
  }, [user]);

  // Check for navigation state to open Tutor
  useEffect(() => {
    if (location.state && (location.state as any).openTutor) {
      const state = location.state as any;

      if (state.tutorContext) {
        setTutorContext(state.tutorContext);
      }

      if (state.courseId) {
        // If we have a noteId in state, use that.
        if (state.noteId) {
          const note = notes.find(n => n.id === state.noteId);
          if (note) setSelectedNote(note);
        }
      }

      setShowTutor(true);
    }
  }, [location.state, notes]);

  const fetchNotes = async () => {
    try {
      // Use offline-aware fetch that falls back to cached data
      const data = await offlineData.fetchNotes();
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      // Use offline-aware fetch that falls back to cached data
      const data = await offlineData.fetchCourses();
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleCreateNote = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast({ title: 'Missing content', description: 'Please add a title and some content.', variant: 'destructive' });
      return;
    }

    if (!checkLimit('note')) {
      toast({ title: 'Daily note limit reached', description: 'Upgrade for more notes.', variant: 'destructive' });
      return;
    }

    await incrementUsage('note');
    setSaving(true);
    try {
      const newNote = {
        id: crypto.randomUUID(), // Generate ID locally
        user_id: user?.id,
        title: newTitle.trim(),
        content: newContent.trim(),
        source_type: uploadedFileUrl ? 'file' : 'text',
        course_id: selectedCourseId === 'none' ? null : selectedCourseId,
        file_url: uploadedFileUrl,
        original_filename: originalFilename,
        created_at: new Date().toISOString(),
        summary: null, // Initialize summary as null
      };

      // Use queueAction which handles both online and offline cases
      const result = await queueAction('notes', 'insert', newNote);

      if (!result.success && !result.offlineQueued) {
        throw new Error('Failed to save note');
      }

      setNotes([newNote, ...notes]);
      setNewTitle('');
      setNewContent('');
      setSelectedCourseId('none');
      setUploadedFileUrl(null);
      setOriginalFilename(null);
      setShowCreate(false);

      // Update course progress if note is associated with a course
      if (newNote.course_id && user?.id) {
        updateCourseProgress(user.id, newNote.course_id);
      }

      // Check for achievements
      if (user?.id) {
        runAchievementCheck(user.id);
      }

      if (isOnline) {
        toast({
          title: 'Note created! 📝',
          description: 'Your note has been saved.',
        });
      }
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to create note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileContent = (content: string, filename: string, fileUrl: string) => {
    setNewContent(content);
    setUploadedFileUrl(fileUrl);
    setOriginalFilename(filename);
    if (!newTitle) {
      setNewTitle(filename.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      setNotes(notes.filter((n) => n.id !== id));
      toast({ title: 'Note deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete note.', variant: 'destructive' });
    }
  };

  const handleUpdateSummary = (noteId: string, summary: string) => {
    setNotes(notes.map((n) => (n.id === noteId ? { ...n, summary } : n)));
  };

  const handleCourseUpdate = async (noteId: string, courseId: string | null) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ course_id: courseId })
        .eq('id', noteId);

      if (error) throw error;

      setNotes(notes.map((n) => (n.id === noteId ? { ...n, course_id: courseId } : n)));

      if (selectedNote?.id === noteId) {
        setSelectedNote({ ...selectedNote, course_id: courseId });
      }

      toast({
        title: 'Course updated',
        description: 'Note has been moved to the selected course.',
      });
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

  const handleGenerateFlashcards = async (note: Note) => {
    if (!note.content) return;

    setGeneratingFlashcards(note.id);
    try {
      let fullResponse = '';
      await streamAIChat({
        messages: [],
        mode: 'flashcards',
        content: note.content,
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
                note_id: note.id,
                course_id: note.course_id,
                front: fc.front,
                back: fc.back,
              }));

            if (flashcardsToInsert.length > 0) {
              await supabase.from('flashcards').insert(flashcardsToInsert);

              // Update course progress if note has a course
              if (note.course_id && user?.id) {
                updateCourseProgress(user.id, note.course_id);
              }
            }

            toast({
              title: `Created ${flashcardsToInsert.length} flashcards! 🎴`,
              description: 'Go to Flashcards to start studying.',
            });
          } catch (e) {
            console.error('Failed to parse/insert flashcards:', e, fullResponse);
            toast({
              title: 'Error',
              description: 'AI response was not valid flashcard JSON. Please try again.',
              variant: 'destructive',
            });
          }
          setGeneratingFlashcards(null);
        },
        onError: (err) => {
          toast({ title: 'Error', description: err, variant: 'destructive' });
          setGeneratingFlashcards(null);
        },
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate flashcards.',
        variant: 'destructive',
      });
      setGeneratingFlashcards(null);
    }
  };

  const handleGenerateQuiz = async (note: Note) => {
    if (!note.content) return;

    setGeneratingQuiz(note.id);
    toast({
      title: 'Generating quiz...',
      description: 'This will take a few seconds.',
    });

    // Navigate to quiz page - quiz generation happens there
    window.location.href = `/quizzes?noteId=${note.id}`;
  };

  const getCourseName = (courseId: string | null) => {
    if (!courseId) return undefined;
    const course = courses.find((c) => c.id === courseId);
    return course ? `${course.icon} ${course.name}` : undefined;
  };

  const filteredNotes = filterCourseId === 'all'
    ? notes
    : filterCourseId === 'none'
      ? notes.filter((n) => !n.course_id)
      : notes.filter((n) => n.course_id === filterCourseId);

  if (showTutor) {
    // Determine props for SocraticTutor
    const activeCourseId = selectedNote?.course_id || (location.state as any)?.courseId;
    const activeNote = selectedNote || (activeCourseId ? undefined : undefined); // If course mode, note might be undefined

    // If we are in "Course Mode" (no specific note selected), we want to pass all notes for that course.
    const courseNotes = activeCourseId ? notes.filter(n => n.course_id === activeCourseId) : (selectedNote ? [selectedNote] : []);

    return (
      <SocraticTutor
        note={activeNote}
        courseId={activeCourseId}
        courseName={courses.find(c => c.id === activeCourseId)?.name}
        allNotes={courseNotes}
        initialContext={tutorContext}
        onBack={() => {
          setShowTutor(false);
          setSelectedNote(null);
          setTutorContext(undefined);
        }}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-foreground">Smart Notes</h1>
            {!offlineData.isOnline && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
                <WifiOff className="w-3 h-3" />
                Offline
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {offlineData.isOnline ? 'AI-powered note taking & learning' : 'Viewing cached notes'}
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="gradient-primary text-primary-foreground"
          size="sm"
          disabled={!offlineData.isOnline}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Note
        </Button>
      </motion.header>

      {/* Create Note Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
              <Input
                placeholder="Note title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="text-lg font-medium"
              />

              {courses.length > 0 && (
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No course</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.icon} {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* File Upload */}
              <FileUpload
                onFileContent={handleFileContent}
                userId={user?.id || ''}
                disabled={saving}
              />

              <div className="text-center text-xs text-muted-foreground">or</div>

              <Textarea
                placeholder="Paste or type your notes here... You can paste lecture notes, textbook content, or any study material."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateNote}
                  disabled={saving}
                  className="gradient-primary text-primary-foreground"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Note'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Features Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl gradient-primary text-primary-foreground"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">AI-Powered Learning</h3>
            <p className="text-sm opacity-90">
              Generate summaries, flashcards, quizzes, or study with the Socratic tutor
            </p>
          </div>
        </div>
      </motion.div>

      {/* Course Filter */}
      {courses.length > 0 && (
        <Select value={filterCourseId} onValueChange={setFilterCourseId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All notes</SelectItem>
            <SelectItem value="none">Uncategorized</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.icon} {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Notes List */}
      <section>
        <h2 className="text-lg font-display font-semibold mb-4">Your Notes</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No notes yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create your first note to start learning with AI
            </p>
            <Button onClick={() => setShowCreate(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create Note
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note, index) => (
              <div key={note.id} className="relative">
                {(generatingFlashcards === note.id || generatingQuiz === note.id) && (
                  <div className="absolute inset-0 bg-background/80 rounded-2xl flex items-center justify-center z-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
                <NoteCard
                  note={note}
                  index={index}
                  onDelete={handleDeleteNote}
                  onSummarize={() => {
                    setSelectedNote(note);
                    setShowSummary(true);
                  }}
                  onTutor={() => {
                    setSelectedNote(note);
                    setShowTutor(true);
                  }}
                  onGenerateFlashcards={() => handleGenerateFlashcards(note)}
                  onGenerateQuiz={() => handleGenerateQuiz(note)}
                  onViewContent={() => {
                    setSelectedNote(note);
                    setShowViewer(true);
                  }}
                  courseName={getCourseName(note.course_id)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AI Summary Dialog */}
      {selectedNote && (
        <AISummaryDialog
          open={showSummary}
          onOpenChange={setShowSummary}
          note={selectedNote}
          onUpdateSummary={handleUpdateSummary}
          onViewNote={() => {
            setShowSummary(false);
            setShowViewer(true);
          }}
        />
      )}

      {/* Note Viewer Dialog */}
      {selectedNote && (
        <NoteViewerDialog
          open={showViewer}
          onOpenChange={setShowViewer}
          note={selectedNote}
          onContentUpdated={(noteId, newContent) => {
            setNotes(notes.map((n) => (n.id === noteId ? { ...n, content: newContent } : n)));
          }}
          onTutor={() => {
            setShowViewer(false);
            setShowTutor(true);
          }}
          onGenerateFlashcards={() => handleGenerateFlashcards(selectedNote)}
          onGenerateQuiz={() => handleGenerateQuiz(selectedNote)}
          onSummarize={() => {
            setShowViewer(false);
            setShowSummary(true);
          }}
          courses={courses}
          onCourseChange={(courseId) => handleCourseUpdate(selectedNote.id, courseId)}
        />
      )}
    </div>
  );
};

export default SmartNotes;