import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Swords, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DebatePartnerProps {
  onBack: () => void;
}

const DebatePartner = ({ onBack }: DebatePartnerProps) => {
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [userPosition, setUserPosition] = useState('');
  const [debate, setDebate] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [userInput, setUserInput] = useState('');

  const startDebate = async () => {
    if (!topic.trim() || !userPosition.trim()) return;
    
    setLoading(true);
    setStarted(true);
    setDebate([{ role: 'user', content: userPosition }]);

    let response = '';
    await streamAIChat({
      messages: [],
      mode: 'chat',
      content: `You are a skilled debate partner. The topic is: "${topic}"

The user's position is: "${userPosition}"

Your job is to argue the OPPOSITE view. Be persuasive, use logic, evidence, and rhetorical techniques. Challenge their assumptions. Keep responses concise (2-3 paragraphs max).

Start your counter-argument now:`,
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
      mode: 'chat',
      content: `Continue arguing the opposite position. Be persuasive and challenge their points. Keep it concise.`,
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

  if (!started) {
    return (
      <div className="p-6 space-y-6">
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex-1">
            <h1 className="text-xl font-display font-bold text-foreground">Debate Partner</h1>
            <p className="text-muted-foreground text-sm">AI argues the opposite view</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Swords className="w-5 h-5 text-primary" />
          </div>
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

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-4 border-b border-border flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-lg font-display font-bold text-foreground">Debate: {topic.substring(0, 30)}...</h1>
        </div>
      </motion.header>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {debate.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-4 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
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
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border space-y-3">
        <Textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Counter their argument..."
          className="min-h-[60px]"
          disabled={loading}
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