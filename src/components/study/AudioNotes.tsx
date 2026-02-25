import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Volume2, Pause, Play, StopCircle, Settings, BookOpen, ListMusic, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { stripMarkdown } from '@/lib/formatters';

interface AudioNotesProps {
  onBack: () => void;
}

type ReadMode = 'summary' | 'full';
const AUDIO_PREFS_KEY = 'audio_notes_prefs';

const AudioNotes = ({ onBack }: AudioNotesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<{ id: string; title: string; summary: string | null; content: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [readMode, setReadMode] = useState<ReadMode>('summary');

  // Playlist
  const [playlistMode, setPlaylistMode] = useState(false);
  const playlistQueueRef = useRef<string[]>([]);

  // Follow-along
  const [sentences, setSentences] = useState<string[]>([]);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(-1);
  const [readProgress, setReadProgress] = useState(0);

  // Voice settings
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
  const [speed, setSpeed] = useState(1.0);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const sentenceIdxRef = useRef(0);
  const totalSentencesRef = useRef(0);

  // Load prefs
  useEffect(() => {
    try {
      const prefs = localStorage.getItem(AUDIO_PREFS_KEY);
      if (prefs) {
        const p = JSON.parse(prefs);
        if (p.speed) setSpeed(p.speed);
        if (p.voiceIndex !== undefined) setSelectedVoiceIndex(p.voiceIndex);
        if (p.readMode) setReadMode(p.readMode);
      }
    } catch {}
  }, []);

  // Save prefs
  useEffect(() => {
    localStorage.setItem(AUDIO_PREFS_KEY, JSON.stringify({ speed, voiceIndex: selectedVoiceIndex, readMode }));
  }, [speed, selectedVoiceIndex, readMode]);

  useEffect(() => {
    if (user) fetchNotes();
    synthRef.current = window.speechSynthesis;
    const loadVoices = () => {
      const v = synthRef.current?.getVoices() || [];
      setVoices(v);
      const preferred = v.findIndex(voice => voice.name.includes('Google') || voice.name.includes('Natural') || voice.lang.startsWith('en'));
      if (preferred >= 0 && selectedVoiceIndex === 0) setSelectedVoiceIndex(preferred);
    };
    if (synthRef.current) { loadVoices(); synthRef.current.onvoiceschanged = loadVoices; }
    return () => { synthRef.current?.cancel(); };
  }, [user]);

  const fetchNotes = async () => {
    try {
      const { data } = await supabase.from('notes').select('id, title, summary, content').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(30);
      setNotes(data || []);
    } catch { toast({ title: 'Error', description: 'Failed to load notes', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const splitToSentences = (text: string): string[] => {
    return text.match(/[^.!?\n]+[.!?\n]*/g)?.map(s => s.trim()).filter(s => s.length > 2) || [text];
  };

  const speakSentences = useCallback((sentenceList: string[], noteId: string) => {
    if (!synthRef.current || sentenceList.length === 0) return;
    synthRef.current.cancel();

    setSentences(sentenceList);
    setCurrentNote(noteId);
    setSpeaking(true);
    setPaused(false);
    sentenceIdxRef.current = 0;
    totalSentencesRef.current = sentenceList.length;

    const speakNext = (idx: number) => {
      if (idx >= sentenceList.length) {
        // Done with this note
        setSpeaking(false);
        setPaused(false);
        setCurrentSentenceIdx(-1);
        setReadProgress(100);

        // Play next in playlist
        if (playlistQueueRef.current.length > 0) {
          const nextId = playlistQueueRef.current.shift()!;
          setTimeout(() => generateAndSpeak(nextId), 500);
        } else {
          setCurrentNote(null);
          setReadProgress(0);
        }
        return;
      }

      setCurrentSentenceIdx(idx);
      setReadProgress(Math.round((idx / sentenceList.length) * 100));
      sentenceIdxRef.current = idx;

      const utterance = new SpeechSynthesisUtterance(sentenceList[idx]);
      utterance.rate = speed;
      utterance.pitch = 1;
      if (voices[selectedVoiceIndex]) utterance.voice = voices[selectedVoiceIndex];
      utterance.onend = () => speakNext(idx + 1);
      utterance.onerror = () => speakNext(idx + 1);
      synthRef.current!.speak(utterance);
    };

    speakNext(0);
  }, [speed, selectedVoiceIndex, voices]);

  const generateAndSpeak = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    setCurrentNote(noteId);

    if (readMode === 'full' && note.content) {
      const cleaned = stripMarkdown(note.content);
      const sents = splitToSentences(cleaned);
      speakSentences(sents, noteId);
      return;
    }

    if (note.summary) {
      const cleaned = stripMarkdown(note.summary);
      speakSentences(splitToSentences(cleaned), noteId);
      return;
    }

    // Generate summary
    setGenerating(true);
    try {
      const { data: fullNote } = await supabase.from('notes').select('content').eq('id', noteId).single();
      if (!fullNote?.content) throw new Error('No content');

      let summary = '';
      await streamAIChat({
        messages: [],
        mode: 'summarize',
        content: fullNote.content,
        onDelta: (chunk) => { summary += chunk; },
        onDone: async () => {
          await supabase.from('notes').update({ summary }).eq('id', noteId);
          setNotes(prev => prev.map(n => n.id === noteId ? { ...n, summary } : n));
          setGenerating(false);
          const cleaned = stripMarkdown(summary);
          speakSentences(splitToSentences(cleaned), noteId);
        },
        onError: (err) => { toast({ title: 'Error', description: err, variant: 'destructive' }); setGenerating(false); },
      });
    } catch { toast({ title: 'Error', description: 'Failed to generate summary', variant: 'destructive' }); setGenerating(false); }
  };

  const playAll = () => {
    if (notes.length === 0) return;
    playlistQueueRef.current = notes.slice(1).map(n => n.id);
    setPlaylistMode(true);
    generateAndSpeak(notes[0].id);
  };

  const togglePause = () => {
    if (!synthRef.current) return;
    if (paused) { synthRef.current.resume(); setPaused(false); }
    else { synthRef.current.pause(); setPaused(true); }
  };

  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setSpeaking(false); setPaused(false); setCurrentNote(null);
    setCurrentSentenceIdx(-1); setReadProgress(0);
    playlistQueueRef.current = [];
    setPlaylistMode(false);
  };

  if (loading) {
    return <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 space-y-5">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">Audio Notes</h1>
          <p className="text-muted-foreground text-sm">Listen to your notes</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)} className={showSettings ? 'bg-primary/10' : ''}>
          <Settings className="w-5 h-5" />
        </Button>
      </motion.header>

      {/* Settings */}
      {showSettings && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 rounded-2xl bg-card border border-border space-y-4">
          <h3 className="font-medium text-foreground text-sm">Settings</h3>
          {/* Read mode */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Read mode</label>
            <div className="flex gap-2">
              <Button size="sm" variant={readMode === 'summary' ? 'default' : 'outline'} onClick={() => setReadMode('summary')} className="flex-1 text-xs">
                <FileText className="w-3 h-3 mr-1" /> Summary
              </Button>
              <Button size="sm" variant={readMode === 'full' ? 'default' : 'outline'} onClick={() => setReadMode('full')} className="flex-1 text-xs">
                <BookOpen className="w-3 h-3 mr-1" /> Full Note
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Voice</label>
            <Select value={selectedVoiceIndex.toString()} onValueChange={v => setSelectedVoiceIndex(parseInt(v))}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{voices.map((v, i) => <SelectItem key={i} value={i.toString()}>{v.name} ({v.lang})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between"><label className="text-xs text-muted-foreground">Speed</label><span className="text-xs font-medium">{speed.toFixed(1)}x</span></div>
            <Slider value={[speed]} onValueChange={v => setSpeed(v[0])} min={0.5} max={2} step={0.1} />
          </div>
        </motion.div>
      )}

      {/* Now playing */}
      {speaking && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl gradient-primary text-primary-foreground space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Volume2 className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="font-medium block text-sm">{notes.find(n => n.id === currentNote)?.title || 'Playing...'}</span>
                <span className="text-xs opacity-80">{readMode === 'full' ? 'Full note' : 'Summary'} · {speed.toFixed(1)}x</span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={togglePause} className="text-white hover:bg-white/20 w-9 h-9">
                {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={stopSpeaking} className="text-white hover:bg-white/20 w-9 h-9">
                <StopCircle className="w-5 h-5" />
              </Button>
            </div>
          </div>
          {/* Progress */}
          <Progress value={readProgress} className="h-1.5 bg-white/20" />
          {/* Follow-along text */}
          {sentences.length > 0 && currentSentenceIdx >= 0 && (
            <p className="text-xs leading-relaxed opacity-90 line-clamp-2">
              {sentences[currentSentenceIdx]}
            </p>
          )}
        </motion.div>
      )}

      {/* Playlist button */}
      {notes.length > 1 && !speaking && (
        <Button onClick={playAll} variant="outline" className="w-full">
          <ListMusic className="w-4 h-4 mr-2" /> Play All Notes
        </Button>
      )}

      {/* Notes list */}
      <div className="space-y-2">
        {notes.map((note) => (
          <motion.button
            key={note.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => generateAndSpeak(note.id)}
            disabled={generating || speaking}
            className={`w-full p-4 rounded-2xl bg-card border text-left transition-all ${currentNote === note.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground text-sm">{note.title}</span>
              {generating && currentNote === note.id ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : currentNote === note.id && speaking ? (
                <Volume2 className="w-4 h-4 text-primary animate-pulse" />
              ) : (
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            {note.summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{note.summary.substring(0, 80)}...</p>}
          </motion.button>
        ))}
        {notes.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-muted-foreground">No notes yet. Create notes first!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioNotes;
