import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Brain, FileText, BookOpen, ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import SocraticTutor from '@/components/notes/SocraticTutor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Note {
  id: string;
  title: string;
  content: string | null;
  summary: string | null;
  source_type: string;
  created_at: string;
  course_id: string | null;
}

interface Course {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
}

type TutorMode = 'course' | 'note';

interface LocationState {
  quizContext?: string;
  courseId?: string;
  noteId?: string;
  courseName?: string;
  noteName?: string;
  autoStart?: boolean;
}

const AITutor = () => {
  const { user } = useAuth();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseNotes, setCourseNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<TutorMode>('course');
  const [tutorActive, setTutorActive] = useState(false);
  const [initialContext, setInitialContext] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Handle navigation state from quiz results
  useEffect(() => {
    if (locationState?.autoStart && notes.length > 0 && courses.length > 0) {
      const { quizContext, courseId, noteId, courseName, noteName } = locationState;
      
      if (quizContext) {
        setInitialContext(quizContext);
      }

      // If note-based quiz, open Note Mode tutor
      if (noteId) {
        const targetNote = notes.find(n => n.id === noteId);
        if (targetNote) {
          setMode('note');
          handleNoteSelect(targetNote);
        } else if (courseId) {
          // Fallback to course mode if note not found
          const targetCourse = courses.find(c => c.id === courseId);
          if (targetCourse) {
            setMode('course');
            handleCourseSelect(targetCourse);
          }
        }
      } 
      // If course-based quiz, open Course Mode tutor
      else if (courseId) {
        const targetCourse = courses.find(c => c.id === courseId);
        if (targetCourse) {
          setMode('course');
          handleCourseSelect(targetCourse);
        }
      }

      // Clear the location state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [locationState, notes, courses]);

  const fetchData = async () => {
    try {
      const [notesRes, coursesRes] = await Promise.all([
        supabase
          .from('notes')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('courses')
          .select('*')
          .eq('user_id', user?.id)
          .order('name', { ascending: true })
      ]);

      if (notesRes.error) throw notesRes.error;
      if (coursesRes.error) throw coursesRes.error;

      setNotes(notesRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = async (course: Course) => {
    setSelectedCourse(course);
    // Fetch notes for this course
    const courseNotesData = notes.filter(n => n.course_id === course.id);
    setCourseNotes(courseNotesData);
    setTutorActive(true);
  };

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    setTutorActive(true);
  };

  const handleBack = () => {
    setTutorActive(false);
    setSelectedNote(null);
    setSelectedCourse(null);
    setCourseNotes([]);
    setInitialContext(undefined);
  };

  // Show tutor when active
  if (tutorActive) {
    if (mode === 'course' && selectedCourse) {
      return (
        <SocraticTutor
          courseId={selectedCourse.id}
          courseName={selectedCourse.name}
          allNotes={courseNotes}
          initialContext={initialContext}
          onBack={handleBack}
        />
      );
    }
    if (mode === 'note' && selectedNote) {
      return (
        <SocraticTutor
          note={selectedNote}
          initialContext={initialContext}
          onBack={handleBack}
        />
      );
    }
  }

  // Get notes count per course for display
  const getNotesCountForCourse = (courseId: string) => {
    return notes.filter(n => n.course_id === courseId).length;
  };

  return (
    <div className="p-6 space-y-6">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold text-foreground">AI Tutor</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Socratic learning - discover answers through questions
        </p>
      </motion.header>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl gradient-primary text-primary-foreground"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Learn by Questioning</h3>
            <p className="text-sm opacity-90">
              {mode === 'course' 
                ? 'Select a course to chat about all its notes'
                : 'Select a specific note to focus your learning'
              }
            </p>
          </div>
        </div>
      </motion.div>

      {/* Mode Tabs */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as TutorMode)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="course" className="flex items-center gap-2 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
            <BookOpen className="w-4 h-4" />
            Course Mode
          </TabsTrigger>
          <TabsTrigger value="note" className="flex items-center gap-2 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
            <FileText className="w-4 h-4" />
            Note Mode
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {/* Course Mode */}
          <TabsContent value="course" className="mt-4">
            <motion.section
              key="course-section"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h2 className="text-lg font-display font-semibold mb-4">Select a Course</h2>
              
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No courses yet</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Create courses first to use course-based tutoring
                  </p>
                  <Link to="/">
                    <Button variant="outline">
                      Go to Dashboard
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {courses.map((course, index) => {
                    const notesCount = getNotesCountForCourse(course.id);
                    return (
                      <motion.button
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleCourseSelect(course)}
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
              )}
            </motion.section>
          </TabsContent>

          {/* Note Mode */}
          <TabsContent value="note" className="mt-4">
            <motion.section
              key="note-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-lg font-display font-semibold mb-4">Select a Note</h2>
              
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : notes.length === 0 ? (
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
                    Create notes first to start tutoring sessions
                  </p>
                  <Link to="/notes">
                    <Button variant="outline">
                      Go to Notes
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note, index) => (
                    <motion.button
                      key={note.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleNoteSelect(note)}
                      className="w-full p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">{note.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {new Date(note.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Brain className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.section>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
};

export default AITutor;
