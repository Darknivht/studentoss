import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mic, MicOff, Volume2, Loader2, StopCircle, AlertCircle, Keyboard, Copy, RefreshCw, Settings, BookOpen, FileText, Download, GraduationCap, Share2, FileDown, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import ReactMarkdown from 'react-markdown';
import { formatAIResponse, stripMarkdown } from '@/lib/formatters';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { printMarkdownContent, shareContent } from '@/components/export/ExportUtils';

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface VoiceModeProps {
  onBack: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CONVERSATION_KEY = 'voice_mode_history';
const VOICE_PREFS_KEY = 'voice_mode_prefs';

const STARTERS = [
  { label: '📖 Explain a topic', prompt: 'Explain photosynthesis in simple terms' },
  { label: '🧠 Quiz me', prompt: 'Quiz me on world history with 3 questions' },
  { label: '🔬 Help me understand', prompt: 'Help me understand how DNA replication works' },
  { label: '📐 Solve a problem', prompt: 'Walk me through solving a quadratic equation' },
];

const VoiceMode = ({ onBack }: VoiceModeProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [useTextInput, setUseTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Context - notes and courses
  const [notes, setNotes] = useState<{ id: string; title: string; content: string | null }[]>([]);
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string>('none');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('none');
  const [courseNotes, setCourseNotes] = useState<{ id: string; title: string; content: string | null }[]>([]);

  // Summary
  const [showSummary, setShowSummary] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Voice settings
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
  const [speed, setSpeed] = useState(1.0);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load saved prefs and history
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONVERSATION_KEY);
      if (saved) setMessages(JSON.parse(saved));
      const prefs = localStorage.getItem(VOICE_PREFS_KEY);
      if (prefs) {
        const p = JSON.parse(prefs);
        if (p.speed) setSpeed(p.speed);
        if (p.voiceIndex !== undefined) setSelectedVoiceIndex(p.voiceIndex);
      }
    } catch {}
  }, []);

  // Save messages
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CONVERSATION_KEY, JSON.stringify(messages.slice(-20)));
    }
  }, [messages]);

  // Save prefs
  useEffect(() => {
    localStorage.setItem(VOICE_PREFS_KEY, JSON.stringify({ speed, voiceIndex: selectedVoiceIndex }));
  }, [speed, selectedVoiceIndex]);

  // Fetch notes and courses for context
  useEffect(() => {
    if (user) {
      supabase.from('notes').select('id, title, content').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20).then(({ data }) => {
        setNotes(data || []);
      });
      supabase.from('courses').select('id, name').eq('user_id', user.id).order('name').then(({ data }) => {
        setCourses(data || []);
      });
    }
  }, [user]);

  // When course is selected, fetch its notes
  useEffect(() => {
    if (selectedCourseId !== 'none' && user) {
      supabase.from('notes').select('id, title, content').eq('user_id', user.id).eq('course_id', selectedCourseId).order('created_at', { ascending: false }).then(({ data }) => {
        setCourseNotes(data || []);
      });
      setSelectedNoteId('none'); // reset note selection when course changes
    } else {
      setCourseNotes([]);
    }
  }, [selectedCourseId, user]);

  // Language for speech recognition
  const [speechLang, setSpeechLang] = useState('en-US');

  const SPEECH_LANGUAGES = [
    { value: 'en-US', label: '🇺🇸 English (US)' },
    { value: 'en-GB', label: '🇬🇧 English (UK)' },
    { value: 'en-NG', label: '🇳🇬 English (Nigeria)' },
    { value: 'ha-NG', label: '🇳🇬 Hausa' },
    { value: 'yo-NG', label: '🇳🇬 Yoruba' },
    { value: 'ig-NG', label: '🇳🇬 Igbo' },
    { value: 'fr-FR', label: '🇫🇷 French' },
    { value: 'es-ES', label: '🇪🇸 Spanish' },
    { value: 'pt-BR', label: '🇧🇷 Portuguese' },
    { value: 'ar-SA', label: '🇸🇦 Arabic' },
    { value: 'hi-IN', label: '🇮🇳 Hindi' },
    { value: 'zh-CN', label: '🇨🇳 Chinese' },
    { value: 'de-DE', label: '🇩🇪 German' },
    { value: 'sw-KE', label: '🇰🇪 Swahili' },
  ];

  // Group voices by language for easier selection
  const groupedVoices = voices.reduce<Record<string, { voice: SpeechSynthesisVoice; index: number }[]>>((acc, voice, index) => {
    const lang = voice.lang.split('-')[0];
    const labels: Record<string, string> = {
      en: '🇬🇧 English', fr: '🇫🇷 French', es: '🇪🇸 Spanish', de: '🇩🇪 German',
      pt: '🇧🇷 Portuguese', ar: '🇸🇦 Arabic', hi: '🇮🇳 Hindi', zh: '🇨🇳 Chinese',
      ha: '🇳🇬 Hausa', yo: '🇳🇬 Yoruba', ig: '🇳🇬 Igbo', sw: '🇰🇪 Swahili',
      ja: '🇯🇵 Japanese', ko: '🇰🇷 Korean', ru: '🇷🇺 Russian', it: '🇮🇹 Italian',
    };
    const key = labels[lang] || `🌐 ${lang.toUpperCase()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push({ voice, index });
    return acc;
  }, {});

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    const loadVoices = () => {
      const v = synthRef.current?.getVoices() || [];
      setVoices(v);
      const preferred = v.findIndex(voice => voice.name.includes('Google') || voice.name.includes('Natural') || voice.lang.startsWith('en'));
      if (preferred >= 0 && selectedVoiceIndex === 0) setSelectedVoiceIndex(preferred);
    };
    if (synthRef.current) { loadVoices(); synthRef.current.onvoiceschanged = loadVoices; }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setIsSupported(false); setUseTextInput(true); return; }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = speechLang;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.resultIndex];
      setTranscript(result[0].transcript);
      if (result.isFinal) handleUserInput(result[0].transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast({ title: 'Microphone Access Denied', description: 'Use text input instead.', variant: 'destructive' });
        setUseTextInput(true);
      }
    };
    recognitionRef.current = recognition;
    return () => { recognitionRef.current?.abort(); synthRef.current?.cancel(); };
  }, [speechLang]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleListening = async () => {
    if (!recognitionRef.current) { setUseTextInput(true); return; }
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else {
      synthRef.current?.cancel(); setIsSpeaking(false); setTranscript('');
      try { recognitionRef.current.start(); setIsListening(true); }
      catch { toast({ title: 'Error', description: 'Failed to start listening.', variant: 'destructive' }); }
    }
  };

  const getContextPrompt = () => {
    // If a course is selected, use all course notes as context
    if (selectedCourseId !== 'none' && courseNotes.length > 0) {
      const courseName = courses.find(c => c.id === selectedCourseId)?.name || 'Selected course';
      const notesContext = courseNotes
        .filter(n => n.content)
        .map(n => `[${n.title}]: ${n.content!.substring(0, 800)}`)
        .join('\n\n');
      return `You are tutoring the student on their course "${courseName}". Here are their notes for this course:\n\n${notesContext.substring(0, 4000)}\n\nUse this material to answer their questions. Reference specific notes when relevant.\n\n`;
    }
    // If a specific note is selected
    if (selectedNoteId !== 'none') {
      const note = notes.find(n => n.id === selectedNoteId);
      if (!note?.content) return '';
      return `Context from note "${note.title}": ${note.content.substring(0, 2000)}\n\n`;
    }
    return '';
  };

  const handleUserInput = async (text: string) => {
    if (!text.trim()) return;
    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setTranscript(''); setTextInput(''); setIsProcessing(true);

    const context = getContextPrompt();
    let response = '';
    await streamAIChat({
      messages: [...messages, userMessage],
      mode: 'socratic',
      content: context ? `${context}User question: ${text}` : undefined,
      onDelta: (chunk) => {
        response += chunk;
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'assistant') { last.content = response; }
          else { updated.push({ role: 'assistant', content: response }); }
          return [...updated];
        });
      },
      onDone: () => { setIsProcessing(false); speakText(response); },
      onError: (err) => { toast({ title: 'Error', description: err, variant: 'destructive' }); setIsProcessing(false); },
    });
  };

  const regenerateLastResponse = async () => {
    const lastUserIdx = messages.map((m, i) => ({ m, i })).filter(x => x.m.role === 'user').pop();
    if (!lastUserIdx) return;
    const truncated = messages.slice(0, lastUserIdx.i + 1);
    setMessages(truncated);
    setIsProcessing(true);

    const context = getContextPrompt();
    let response = '';
    await streamAIChat({
      messages: truncated,
      mode: 'socratic',
      content: context || undefined,
      onDelta: (chunk) => {
        response += chunk;
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'assistant') last.content = response;
          else updated.push({ role: 'assistant', content: response });
          return [...updated];
        });
      },
      onDone: () => { setIsProcessing(false); speakText(response); },
      onError: (err) => { toast({ title: 'Error', description: err, variant: 'destructive' }); setIsProcessing(false); },
    });
  };

  const handleTextSubmit = () => { if (textInput.trim()) handleUserInput(textInput.trim()); };

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    const cleanText = stripMarkdown(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speed;
    utterance.pitch = 1;
    if (voices[selectedVoiceIndex]) utterance.voice = voices[selectedVoiceIndex];
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => { synthRef.current?.cancel(); setIsSpeaking(false); };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: 'Copied!' });
  };

  const clearConversation = () => {
    setMessages([]);
    localStorage.removeItem(CONVERSATION_KEY);
  };

  // Summarize entire conversation
  const summarizeConversation = async () => {
    if (messages.length < 2) {
      toast({ title: 'Not enough conversation', description: 'Have a conversation first before summarizing.', variant: 'destructive' });
      return;
    }
    setIsSummarizing(true);
    setSummaryContent('');
    setShowSummary(true);

    const conversationText = messages.map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n\n');

    let summary = '';
    await streamAIChat({
      messages: [{ role: 'user', content: conversationText }],
      mode: 'summarize',
      content: `Summarize this tutoring conversation. Provide:\n\n## 📋 Session Summary\nA brief overview of what was discussed.\n\n## 🔑 Key Points\nBulleted list of the main concepts covered.\n\n## 📝 Main Takeaways\nWhat the student should remember.\n\n## 💡 Suggested Next Steps\nWhat to study or practice next based on the conversation.\n\nConversation:\n${conversationText}`,
      onDelta: (chunk) => {
        summary += chunk;
        setSummaryContent(summary);
      },
      onDone: () => setIsSummarizing(false),
      onError: (err) => {
        toast({ title: 'Error summarizing', description: err, variant: 'destructive' });
        setIsSummarizing(false);
      },
    });
  };

  const copySummary = () => {
    navigator.clipboard.writeText(summaryContent);
    toast({ title: 'Summary copied!' });
  };

  const saveAsNote = async () => {
    if (!user || !summaryContent) return;
    const { error } = await supabase.from('notes').insert({
      user_id: user.id,
      title: `Voice Tutor Summary - ${new Date().toLocaleDateString()}`,
      content: summaryContent,
      source_type: 'ai_generated',
      course_id: selectedCourseId !== 'none' ? selectedCourseId : null,
    });
    if (error) {
      toast({ title: 'Error saving note', variant: 'destructive' });
    } else {
      toast({ title: 'Saved as note!' });
    }
  };

  const saveTranscriptAsNote = async () => {
    if (!user || messages.length === 0) return;
    const transcript = messages.map(m => `**${m.role === 'user' ? 'You' : 'AI Tutor'}:** ${m.content}`).join('\n\n---\n\n');
    const { error } = await supabase.from('notes').insert({
      user_id: user.id,
      title: `Voice Session Transcript - ${new Date().toLocaleDateString()}`,
      content: transcript,
      source_type: 'ai_generated',
      course_id: selectedCourseId !== 'none' ? selectedCourseId : null,
    });
    if (error) {
      toast({ title: 'Error saving', variant: 'destructive' });
    } else {
      toast({ title: 'Transcript saved as note!' });
    }
  };

  const exportSummary = () => {
    if (!summaryContent) return;
    printMarkdownContent(summaryContent, `Voice Tutor Summary - ${new Date().toLocaleDateString()}`);
    toast({ title: 'Exported!' });
  };

  const exportTranscript = () => {
    if (messages.length === 0) return;
    const md = messages.map(m => `**${m.role === 'user' ? 'You' : 'AI Tutor'}:** ${m.content}`).join('\n\n---\n\n');
    printMarkdownContent(md, `Voice Session Transcript - ${new Date().toLocaleDateString()}`);
    toast({ title: 'Transcript exported!' });
  };

  const handleShare = async () => {
    const text = summaryContent || messages.map(m => `${m.role === 'user' ? 'You' : 'AI Tutor'}: ${m.content}`).join('\n\n');
    const ok = await shareContent('Voice Tutor Session', text);
    if (ok) toast({ title: 'Shared!' });
  };

  const contextLabel = selectedCourseId !== 'none'
    ? courses.find(c => c.id === selectedCourseId)?.name
    : selectedNoteId !== 'none'
      ? notes.find(n => n.id === selectedNoteId)?.title
      : null;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-4 flex items-center gap-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-lg font-display font-bold text-foreground">AI Voice Tutor</h1>
          <p className="text-muted-foreground text-xs">Voice & text conversations</p>
        </div>
        <div className="flex gap-1">
          {messages.length >= 2 && (
            <>
              <Button size="icon" variant="ghost" className="w-8 h-8" onClick={summarizeConversation} title="Summarize session" disabled={isSummarizing}>
                <FileText className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="w-8 h-8" onClick={saveTranscriptAsNote} title="Save transcript as note">
                <Save className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="w-8 h-8" onClick={exportTranscript} title="Export transcript">
                <FileDown className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button size="icon" variant={showSettings ? 'default' : 'ghost'} className="w-8 h-8" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="w-4 h-4" />
          </Button>
          {isSupported && (
            <Button size="icon" variant={useTextInput ? 'default' : 'ghost'} className="w-8 h-8" onClick={() => setUseTextInput(!useTextInput)}>
              <Keyboard className="w-4 h-4" />
            </Button>
          )}
          {isSpeaking && (
            <Button size="icon" variant="ghost" className="w-8 h-8" onClick={stopSpeaking}>
              <StopCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      </motion.header>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-border">
            <div className="p-4 space-y-4">
              {/* Course context */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Course context</label>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="No course" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific course</SelectItem>
                    {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* Note context */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1"><BookOpen className="w-3 h-3" /> Note context</label>
                <Select value={selectedNoteId} onValueChange={v => { setSelectedNoteId(v); if (v !== 'none') setSelectedCourseId('none'); }}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="No note" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{selectedCourseId !== 'none' ? 'Using all course notes' : 'No specific note'}</SelectItem>
                    {(selectedCourseId !== 'none' ? courseNotes : notes).map(n => <SelectItem key={n.id} value={n.id}>{n.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* Speech Language */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">🌍 Speech Language</label>
                <Select value={speechLang} onValueChange={setSpeechLang}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SPEECH_LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* Voice */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Voice ({voices.length} available)</label>
                <Select value={selectedVoiceIndex.toString()} onValueChange={v => setSelectedVoiceIndex(parseInt(v))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Object.entries(groupedVoices).map(([group, items]) => (
                      <div key={group}>
                        <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground sticky top-0 bg-popover">{group}</div>
                        {items.map(({ voice, index }) => (
                          <SelectItem key={index} value={index.toString()} className="text-xs">
                            {voice.name.replace(/Microsoft |Google |Apple /, '')}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Speed */}
              <div className="space-y-1">
                <div className="flex justify-between"><label className="text-xs text-muted-foreground">Speed</label><span className="text-xs font-medium">{speed.toFixed(1)}x</span></div>
                <Slider value={[speed]} onValueChange={v => setSpeed(v[0])} min={0.5} max={2} step={0.1} />
              </div>
              <Button size="sm" variant="outline" onClick={clearConversation} className="w-full text-xs">Clear conversation</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isSupported && (
        <div className="p-3 bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
            <p className="text-xs text-amber-600">Voice input not supported. Use text input below.</p>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              {/* Waveform animation */}
              <div className="flex items-center justify-center gap-1 mb-4">
                {[1,2,3,4,5].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 rounded-full bg-primary"
                    animate={{ height: [8, 24, 8] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                  />
                ))}
              </div>
              <h3 className="font-semibold text-lg mb-1">Ready to learn!</h3>
              <p className="text-muted-foreground text-sm mb-6">
                {useTextInput ? 'Type your question below' : 'Tap the mic and ask anything'}
              </p>
              {/* Starters */}
              <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                {STARTERS.map(s => (
                  <button
                    key={s.label}
                    onClick={() => handleUserInput(s.prompt)}
                    className="p-3 rounded-xl bg-card border border-border text-left hover:border-primary/50 transition-colors"
                  >
                    <span className="text-xs text-foreground">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%]`}>
                <div className={`p-3 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
                  <div className={`text-sm ${msg.role === 'assistant' ? 'prose prose-sm dark:prose-invert max-w-none' : ''}`}>
                    {msg.role === 'assistant' ? <ReactMarkdown>{formatAIResponse(msg.content)}</ReactMarkdown> : <p className="whitespace-pre-wrap">{msg.content}</p>}
                  </div>
                </div>
                {/* Message actions */}
                {msg.role === 'assistant' && !isProcessing && (
                  <div className="flex gap-1 mt-1">
                    <button onClick={() => copyMessage(msg.content)} className="p-1 rounded hover:bg-muted transition-colors"><Copy className="w-3 h-3 text-muted-foreground" /></button>
                    {i === messages.length - 1 && (
                      <button onClick={regenerateLastResponse} className="p-1 rounded hover:bg-muted transition-colors"><RefreshCw className="w-3 h-3 text-muted-foreground" /></button>
                    )}
                    <button onClick={() => speakText(msg.content)} className="p-1 rounded hover:bg-muted transition-colors"><Volume2 className="w-3 h-3 text-muted-foreground" /></button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border space-y-3">
        <AnimatePresence>
          {transcript && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-2 rounded-xl bg-muted text-sm text-muted-foreground italic">
              "{transcript}"
            </motion.div>
          )}
        </AnimatePresence>

        {useTextInput ? (
          <div className="flex gap-2">
            <Textarea value={textInput} onChange={e => setTextInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextSubmit(); }}} placeholder="Ask anything..." className="min-h-[44px] max-h-[100px]" disabled={isProcessing} />
            <Button onClick={handleTextSubmit} disabled={isProcessing || !textInput.trim()} className="gradient-primary text-primary-foreground">
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleListening}
              disabled={isProcessing}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all relative ${isListening ? 'bg-red-500 text-white' : 'gradient-primary text-primary-foreground'}`}
            >
              {/* Pulse rings when listening */}
              {isListening && (
                <>
                  <motion.div className="absolute inset-0 rounded-full border-2 border-red-400" animate={{ scale: [1, 1.5], opacity: [0.6, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
                  <motion.div className="absolute inset-0 rounded-full border-2 border-red-400" animate={{ scale: [1, 1.8], opacity: [0.4, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} />
                </>
              )}
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </motion.button>
          </div>
        )}

        <div className="flex justify-center gap-3 text-xs text-muted-foreground">
          {isListening && <span className="flex items-center gap-1"><Mic className="w-3 h-3 animate-pulse" /> Listening...</span>}
          {isSpeaking && <span className="flex items-center gap-1"><Volume2 className="w-3 h-3 animate-pulse" /> Speaking...</span>}
          {isProcessing && <span>Thinking...</span>}
          {contextLabel && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {contextLabel}</span>}
        </div>
      </div>

      {/* Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Session Summary
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-2">
            {isSummarizing && !summaryContent && (
              <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Generating summary...
              </div>
            )}
            {summaryContent && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{formatAIResponse(summaryContent)}</ReactMarkdown>
              </div>
            )}
          </ScrollArea>
          {summaryContent && !isSummarizing && (
            <div className="space-y-2 pt-3 border-t border-border">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copySummary} className="flex-1 gap-1">
                  <Copy className="w-3 h-3" /> Copy
                </Button>
                <Button variant="outline" size="sm" onClick={exportSummary} className="flex-1 gap-1">
                  <FileDown className="w-3 h-3" /> Export
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare} className="flex-1 gap-1">
                  <Share2 className="w-3 h-3" /> Share
                </Button>
              </div>
              <Button size="sm" onClick={saveAsNote} className="w-full gap-1 gradient-primary text-primary-foreground">
                <Save className="w-3 h-3" /> Save as Note
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VoiceMode;
