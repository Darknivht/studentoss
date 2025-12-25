import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import NoteCard from '@/components/notes/NoteCard';
import SocraticTutor from '@/components/notes/SocraticTutor';
import AISummaryDialog from '@/components/notes/AISummaryDialog';
import { Plus, FileText, Brain, Sparkles, ArrowLeft } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string | null;
  summary: string | null;
  source_type: string;
  created_at: string;
}

const SmartNotes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showTutor, setShowTutor] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast({
        title: 'Missing content',
        description: 'Please add a title and some content.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user?.id,
          title: newTitle.trim(),
          content: newContent.trim(),
          source_type: 'text',
        })
        .select()
        .single();

      if (error) throw error;

      setNotes([data, ...notes]);
      setNewTitle('');
      setNewContent('');
      setShowCreate(false);
      toast({
        title: 'Note created! 📝',
        description: 'Your note has been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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

  if (showTutor && selectedNote) {
    return (
      <SocraticTutor
        note={selectedNote}
        onBack={() => {
          setShowTutor(false);
          setSelectedNote(null);
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
          <h1 className="text-2xl font-display font-bold text-foreground">Smart Notes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI-powered note taking & learning
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="gradient-primary text-primary-foreground"
          size="sm"
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
              Click any note to get summaries, explanations, or study with the Socratic tutor
            </p>
          </div>
        </div>
      </motion.div>

      {/* Notes List */}
      <section>
        <h2 className="text-lg font-display font-semibold mb-4">Your Notes</h2>
        
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
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
              Create your first note to start learning with AI
            </p>
            <Button onClick={() => setShowCreate(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create Note
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {notes.map((note, index) => (
              <NoteCard
                key={note.id}
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
              />
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
        />
      )}
    </div>
  );
};

export default SmartNotes;