import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Brain, ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import SocraticTutor from '@/components/notes/SocraticTutor';

interface Note {
  id: string;
  title: string;
  content: string | null;
  summary: string | null;
  source_type: string;
  created_at: string;
}

const AITutor = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchNotes();
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

  if (selectedNote) {
    return (
      <SocraticTutor
        note={selectedNote}
        onBack={() => setSelectedNote(null)}
      />
    );
  }

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
              Select a note to start your Socratic learning session
            </p>
          </div>
        </div>
      </motion.div>

      {/* Note Selection */}
      <section>
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
                onClick={() => setSelectedNote(note)}
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
      </section>
    </div>
  );
};

export default AITutor;
