import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { streamAIChat } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Brain, Loader2, Sparkles } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SocraticTutorProps {
  note: Note;
  onBack: () => void;
}

const SocraticTutor = ({ note, onBack }: SocraticTutorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, [note.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('note_id', note.id)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: true });

    if (data && data.length > 0) {
      setMessages(data.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })));
    } else {
      // Initial greeting
      const greeting = `Hello! 🎓 I'm your Socratic tutor. I've reviewed your notes on "${note.title}". Instead of giving you direct answers, I'll guide you with questions to help you truly understand the material.\n\nWhat would you like to explore or what questions do you have about this topic?`;
      setMessages([{ role: 'assistant', content: greeting }]);
    }
  };

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    await supabase.from('chat_messages').insert({
      user_id: user?.id,
      note_id: note.id,
      role,
      content,
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    await saveMessage('user', userMessage);
    
    setIsLoading(true);
    let assistantContent = '';

    const contextMessages: Message[] = [
      { 
        role: 'user', 
        content: `Here are my study notes for context:\n\n${note.content}\n\nNow, here's my question: ${userMessage}` 
      },
    ];

    // Add previous conversation for context (last 6 messages)
    const recentMessages = messages.slice(-6);
    const fullMessages = [...recentMessages, ...contextMessages];

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    await streamAIChat({
      messages: fullMessages,
      mode: 'socratic',
      onDelta: (chunk) => {
        assistantContent += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
          return updated;
        });
      },
      onDone: async () => {
        setIsLoading(false);
        await saveMessage('assistant', assistantContent);
      },
      onError: (error) => {
        setIsLoading(false);
        toast({
          title: 'AI Error',
          description: error,
          variant: 'destructive',
        });
        // Remove empty assistant message
        setMessages((prev) => prev.slice(0, -1));
      },
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 border-b border-border bg-card/80 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-secondary flex items-center justify-center">
                <Brain className="w-4 h-4 text-secondary-foreground" />
              </div>
              <div>
                <h1 className="font-display font-semibold text-foreground">Socratic Tutor</h1>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{note.title}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-2xl ${
                message.role === 'user'
                  ? 'gradient-primary text-primary-foreground rounded-br-md'
                  : 'bg-card border border-border rounded-bl-md'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-secondary" />
                  <span className="text-xs font-medium text-secondary">AI Tutor</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </motion.div>
        ))}
        
        {isLoading && messages[messages.length - 1]?.content === '' && (
          <div className="flex justify-start">
            <div className="bg-card border border-border p-4 rounded-2xl rounded-bl-md">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card/80 backdrop-blur-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or share your thinking..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="gradient-primary text-primary-foreground"
          >
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SocraticTutor;