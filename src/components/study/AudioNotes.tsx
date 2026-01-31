import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Volume2, Pause, Play, StopCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { stripMarkdown } from '@/lib/formatters';

interface AudioNotesProps {
  onBack: () => void;
}

const AudioNotes = ({ onBack }: AudioNotesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<{ id: string; title: string; summary: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Voice settings
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState<number>(0);
  const [speed, setSpeed] = useState(1.0);
  
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (user) fetchNotes();
    synthRef.current = window.speechSynthesis;
    
    // Load voices
    const loadVoices = () => {
      const availableVoices = synthRef.current?.getVoices() || [];
      setVoices(availableVoices);
      
      // Find a good default voice
      const preferredIndex = availableVoices.findIndex(v => 
        v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.lang.startsWith('en')
      );
      setSelectedVoiceIndex(preferredIndex >= 0 ? preferredIndex : 0);
    };
    
    // Voices may load asynchronously
    if (synthRef.current) {
      loadVoices();
      synthRef.current.onvoiceschanged = loadVoices;
    }
    
    return () => {
      synthRef.current?.cancel();
    };
  }, [user]);

  const fetchNotes = async () => {
    try {
      const { data } = await supabase
        .from('notes')
        .select('id, title, summary, content')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setNotes(data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load notes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateAndSpeak = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    setCurrentNote(noteId);
    
    // If summary exists, speak it directly
    if (note.summary) {
      speakText(note.summary);
      return;
    }

    // Generate summary first
    setGenerating(true);
    
    try {
      const { data: fullNote } = await supabase
        .from('notes')
        .select('content')
        .eq('id', noteId)
        .single();

      if (!fullNote?.content) throw new Error('No content');

      let summary = '';
      await streamAIChat({
        messages: [],
        mode: 'summarize',
        content: fullNote.content,
        onDelta: (chunk) => { summary += chunk; },
        onDone: async () => {
          // Save summary
          await supabase.from('notes').update({ summary }).eq('id', noteId);
          setGenerating(false);
          speakText(summary);
        },
        onError: (err) => {
          toast({ title: 'Error', description: err, variant: 'destructive' });
          setGenerating(false);
        },
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate summary', variant: 'destructive' });
      setGenerating(false);
    }
  };

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    
    // Strip markdown for cleaner speech
    const cleanText = stripMarkdown(text);
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speed;
    utterance.pitch = 1;
    
    // Use selected voice
    if (voices[selectedVoiceIndex]) {
      utterance.voice = voices[selectedVoiceIndex];
    }
    
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
      setCurrentNote(null);
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setPaused(false);
    };
    
    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const togglePause = () => {
    if (!synthRef.current) return;
    
    if (paused) {
      synthRef.current.resume();
      setPaused(false);
    } else {
      synthRef.current.pause();
      setPaused(true);
    }
  };

  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setSpeaking(false);
    setPaused(false);
    setCurrentNote(null);
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">Audio Notes</h1>
          <p className="text-muted-foreground text-sm">AI reads your summaries aloud</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowSettings(!showSettings)}
          className={showSettings ? 'bg-primary/10' : ''}
        >
          <Settings className="w-5 h-5" />
        </Button>
      </motion.header>

      {/* Voice Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 rounded-2xl bg-card border border-border space-y-4"
        >
          <h3 className="font-medium text-foreground">Voice Settings</h3>
          
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Voice</label>
            <Select 
              value={selectedVoiceIndex.toString()} 
              onValueChange={(val) => setSelectedVoiceIndex(parseInt(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {voice.name} ({voice.lang})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">Speed</label>
              <span className="text-sm font-medium">{speed.toFixed(1)}x</span>
            </div>
            <Slider
              value={[speed]}
              onValueChange={(val) => setSpeed(val[0])}
              min={0.5}
              max={2}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.5x</span>
              <span>1x</span>
              <span>1.5x</span>
              <span>2x</span>
            </div>
          </div>
        </motion.div>
      )}

      {speaking && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl gradient-primary text-primary-foreground flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-medium block">Playing audio...</span>
              <span className="text-sm opacity-80">{speed.toFixed(1)}x speed</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={togglePause}
              className="text-white hover:bg-white/20"
            >
              {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={stopSpeaking}
              className="text-white hover:bg-white/20"
            >
              <StopCircle className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        {notes.map((note) => (
          <motion.button
            key={note.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => generateAndSpeak(note.id)}
            disabled={generating || speaking}
            className={`w-full p-4 rounded-2xl bg-card border text-left transition-all ${
              currentNote === note.id ? 'border-primary' : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">{note.title}</span>
              {generating && currentNote === note.id ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : (
                <Volume2 className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            {note.summary && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {note.summary.substring(0, 80)}...
              </p>
            )}
          </motion.button>
        ))}
        
        {notes.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No notes yet. Create notes first!</p>
        )}
      </div>
    </div>
  );
};

export default AudioNotes;
