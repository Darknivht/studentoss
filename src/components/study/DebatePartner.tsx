import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Swords, MessageSquare, History, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { formatAIResponse } from '@/lib/formatters';

interface DebateMessage {
  role: 'user' | 'ai';
  content: string;
}

interface SavedDebate {
  id: string;
  topic: string;
  messages: DebateMessage[];
  createdAt: string;
}

interface DebatePartnerProps {
  onBack: () => void;
}

const DEBATES_STORAGE_KEY = 'studentos_saved_debates';

const DebatePartner = ({ onBack }: DebatePartnerProps) => {
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [userPosition, setUserPosition] = useState('');
  const [debate, setDebate] = useState<DebateMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [savedDebates, setSavedDebates] = useState<SavedDebate[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(DEBATES_STORAGE_KEY);
    if (stored) {
      try { setSavedDebates(JSON.parse(stored)); } catch {}
    }
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [debate]);

  const saveDebate = () => {
    if (debate.length < 2) return;
    const newDebate: SavedDebate = {
      id: Date.now().toString(),
      topic,
      messages: debate,
      createdAt: new Date().toISOString(),
    };
    const updated = [newDebate, ...savedDebates].slice(0, 20);
    setSavedDebates(updated);
    localStorage.setItem(DEBATES_STORAGE_KEY, JSON.stringify(updated));
    toast({ title: 'Debate Saved!', description: 'You can review it later from history.' });
  };

  const loadDebate = (saved: SavedDebate) => {
    setTopic(saved.topic);
    setDebate(saved.messages);
    setStarted(true);
    setShowHistory(false);
  };

  const deleteDebate = (id: string) => {
    const updated = savedDebates.filter(d => d.id !== id);
    setSavedDebates(updated);
    localStorage.setItem(DEBATES_STORAGE_KEY, JSON.stringify(updated));
  };

  const startDebate = async () => {
    if (!topic.trim() || !userPosition.trim()) return;
    
    setLoading(true);
    setStarted(true);
    setDebate([{ role: 'user', content: userPosition }]);

    let response = '';
    await streamAIChat({
      messages: [
        { role: 'user', content: `Topic: ${topic}\n\nMy position: ${userPosition}` }
      ],
      mode: 'debate',
      content: `Topic: ${topic}\n\nOpponent's position: ${userPosition}\n\nArgue the opposite view convincingly.`,
      onDelta: (chunk) => {
        response += chunk;
        setDebate([
          { role: 'user', content: userPosition },
          { role: 'ai', content: response }
        ]);
      },
      onDone: () => setLoading(false),
      onError: (err) => {
        toast({ title: 'Error', description: err, variant: 'destructive' });
        setLoading(false);
      },
    });
  };

  const continueDebate = async () => {
    if (!userInput.trim()) return;
    
    const newDebate = [...debate, { role: 'user' as const, content: userInput }];
    setDebate(newDebate);
    setUserInput('');
    setLoading(true);

    let response = '';
    const messages = newDebate.map(d => ({
      role: d.role === 'ai' ? 'assistant' as const : 'user' as const,
      content: d.content
    }));

    await streamAIChat({
      messages,
      mode: 'debate',
      content: `Topic: ${topic}\n\nContinue arguing the opposite position. Challenge their latest point: "${userInput}"`,
      onDelta: (chunk) => {
        response += chunk;
        setDebate([...newDebate, { role: 'ai', content: response }]);
      },
      onDone: () => setLoading(false),
      onError: (err) => {
        toast({ title: 'Error', description: err, variant: 'destructive' });
        setLoading(false);
      },
    });
  };

  // History view
  if (showHistory) {
    return (
      <div className="p-4 sm:p-6 space-y-4 min-h-screen pb-24">
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex-1">
            <h1 className="text-xl font-display font-bold text-foreground">Debate History</h1>
            <p className="text-muted-foreground text-sm">{savedDebates.length} saved debates</p>
          </div>
        </motion.header>

        {savedDebates.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No saved debates yet</p>
        ) : (
          <div className="space-y-3">
            {savedDebates.map((d) => (
              <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-card border border-border">
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => loadDebate(d)} className="flex-1 text-left">
                    <h3 className="font-medium text-foreground text-sm">{d.topic}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {d.messages.length} messages • {new Date(d.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                  <Button size="icon" variant="ghost" onClick={() => deleteDebate(d.id)} className="shrink-0 h-8 w-8">
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Setup view
  if (!started) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pb-24">
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex-1">
            <h1 className="text-xl font-display font-bold text-foreground">Debate Partner</h1>
            <p className="text-muted-foreground text-sm">AI argues the opposite view</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowHistory(true)} className="relative">
            <History className="w-5 h-5" />
            {savedDebates.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                {savedDebates.length}
              </span>
            )}
          </Button>
        </motion.header>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Debate Topic</label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Should social media be banned for teenagers?"
              className="min-h-[80px]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Your Position</label>
            <Textarea
              value={userPosition}
              onChange={(e) => setUserPosition(e.target.value)}
              placeholder="State your argument and why you believe it..."
              className="min-h-[120px]"
            />
          </div>
          <Button onClick={startDebate} disabled={!topic.trim() || !userPosition.trim()} className="w-full gradient-primary text-primary-foreground">
            <Swords className="w-4 h-4 mr-2" />
            Start Debate
          </Button>
        </div>
      </div>
    );
  }

  // Active debate view
  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-3 sm:p-4 border-b border-border flex items-center gap-2 sm:gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm sm:text-lg font-display font-bold text-foreground truncate">Debate: {topic}</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={saveDebate} title="Save debate">
          <Save className="w-4 h-4" />
        </Button>
      </motion.header>

      <ScrollArea className="flex-1 p-3 sm:p-4">
        <div className="space-y-4">
          {debate.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-3 sm:p-4 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm'
              }`}>
                <div className={`text-sm ${msg.role === 'ai' ? 'prose prose-sm dark:prose-invert max-w-none' : ''}`}>
                  {msg.role === 'ai' ? (
                    <ReactMarkdown>{formatAIResponse(msg.content)}</ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="p-4 rounded-2xl bg-muted">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-3 sm:p-4 border-t border-border space-y-2 sm:space-y-3">
        <Textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Counter their argument..."
          className="min-h-[60px]"
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              continueDebate();
            }
          }}
        />
        <Button onClick={continueDebate} disabled={loading || !userInput.trim()} className="w-full gradient-primary text-primary-foreground">
          <MessageSquare className="w-4 h-4 mr-2" />
          Respond
        </Button>
      </div>
    </div>
  );
};

export default DebatePartner;
