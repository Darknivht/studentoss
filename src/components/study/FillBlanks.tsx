import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';

interface FillBlank {
  sentence: string;
  blank: string;
  hint: string;
}

interface FillBlanksProps {
  onBack: () => void;
}

const FillBlanks = ({ onBack }: FillBlanksProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<{ id: string; title: string }[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [blanks, setBlanks] = useState<FillBlank[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (user) fetchNotes();
  }, [user]);

  const fetchNotes = async () => {
    const { data } = await supabase
      .from('notes')
      .select('id, title')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotes(data || []);
  };

  const generateBlanks = async (noteId: string) => {
    setSelectedNote(noteId);
    setLoading(true);

    try {
      const { data: note } = await supabase
        .from('notes')
        .select('content')
        .eq('id', noteId)
        .single();

      if (!note?.content) throw new Error('No content');

      let fullResponse = '';
      await streamAIChat({
        messages: [],
        mode: 'chat',
        content: `Create 5 fill-in-the-blank exercises from this content. Remove key terms and ask students to fill them in.
Return ONLY valid JSON:
[
  { "sentence": "The ___ is the powerhouse of the cell.", "blank": "mitochondria", "hint": "Organelle" }
]

Content:
${note.content}`,
        onDelta: (chunk) => { fullResponse += chunk; },
        onDone: () => {
          try {
            const jsonMatch = fullResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              setBlanks(parsed);
            }
          } catch (e) {
            toast({ title: 'Error', description: 'Failed to parse exercises', variant: 'destructive' });
          }
          setLoading(false);
        },
        onError: (err) => {
          toast({ title: 'Error', description: err, variant: 'destructive' });
          setLoading(false);
        },
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load note', variant: 'destructive' });
      setLoading(false);
    }
  };

  const checkAnswer = () => {
    const correct = answer.toLowerCase().trim() === blanks[currentIndex].blank.toLowerCase().trim();
    setIsCorrect(correct);
    setShowResult(true);
    if (correct) setScore(s => s + 1);
  };

  const nextQuestion = () => {
    if (currentIndex < blanks.length - 1) {
      setCurrentIndex(i => i + 1);
      setAnswer('');
      setShowResult(false);
    } else {
      setComplete(true);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Generating fill-in-the-blanks...</p>
      </div>
    );
  }

  if (complete) {
    const percentage = Math.round((score / blanks.length) * 100);
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center">
          <Sparkles className="w-12 h-12 text-primary-foreground" />
        </motion.div>
        <h2 className="text-2xl font-bold">{percentage >= 80 ? 'Excellent!' : percentage >= 60 ? 'Good job!' : 'Keep practicing!'}</h2>
        <p className="text-muted-foreground">You got {score} out of {blanks.length} correct</p>
        <div className="text-5xl font-bold gradient-text">{percentage}%</div>
        <Button onClick={onBack} variant="outline">Back to Study Tools</Button>
      </div>
    );
  }

  if (blanks.length > 0) {
    const current = blanks[currentIndex];
    return (
      <div className="p-6 space-y-6">
        <header className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" />Exit</Button>
          <span className="text-sm text-muted-foreground">{currentIndex + 1} / {blanks.length}</span>
        </header>

        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full gradient-primary" animate={{ width: `${((currentIndex + 1) / blanks.length) * 100}%` }} />
        </div>

        <motion.div key={currentIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <p className="text-lg text-foreground">{current.sentence}</p>
          <p className="text-sm text-muted-foreground">Hint: {current.hint}</p>

          <Input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer..."
            disabled={showResult}
            onKeyDown={(e) => e.key === 'Enter' && !showResult && checkAnswer()}
          />

          <AnimatePresence>
            {showResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-2xl flex items-center gap-3 ${isCorrect ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                {isCorrect ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                <span className={isCorrect ? 'text-emerald-700' : 'text-red-700'}>
                  {isCorrect ? 'Correct!' : `The answer was: ${current.blank}`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {!showResult ? (
            <Button onClick={checkAnswer} className="w-full gradient-primary text-primary-foreground" disabled={!answer.trim()}>Check Answer</Button>
          ) : (
            <Button onClick={nextQuestion} className="w-full gradient-primary text-primary-foreground">
              {currentIndex < blanks.length - 1 ? 'Next' : 'See Results'}
            </Button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-xl font-display font-bold">Fill in the Blanks</h1>
          <p className="text-muted-foreground text-sm">AI removes key terms for you to fill</p>
        </div>
      </header>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Select a note:</h3>
        {notes.map((note) => (
          <motion.button
            key={note.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => generateBlanks(note.id)}
            className="w-full p-4 rounded-2xl bg-card border border-border text-left hover:border-primary/50 transition-all"
          >
            <span className="font-medium text-foreground">{note.title}</span>
          </motion.button>
        ))}
        {notes.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No notes yet. Create notes first!</p>
        )}
      </div>
    </div>
  );
};

export default FillBlanks;