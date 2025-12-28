import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { streamAIChat } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';
import { useOfflineAI } from '@/hooks/useOfflineAI';
import { useOfflineSync } from '@/hooks/useOfflineSync';
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
  note?: Note;
  courseId?: string | null;
  courseName?: string;
  allNotes?: Note[];
  initialContext?: string;
  onBack: () => void;
}

const SocraticTutor = ({ note, courseId, courseName, allNotes = [], initialContext, onBack }: SocraticTutorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const offlineAI = useOfflineAI();
  const { isOnline } = useOfflineSync();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, [note?.id, courseId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    // If we have a courseId, we load chat for the course. 
    // Otherwise we fall back to note.id (legacy or single note mode)
    let query = supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: true });

    if (courseId) {
      if (note?.id) {
        query = query.eq('note_id', note.id);
      }
    } else if (note?.id) {
      query = query.eq('note_id', note.id);
    }

    const { data } = await query;

    if (data && data.length > 0) {
      setMessages(data.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })));

      if (initialContext) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `I see you've been studying! 🧠\n\n${initialContext}\n\nHow can I help you clarify these topics?`
        }]);
      }
    } else {
      // Initial greeting
      const contextTitle = courseName || note?.title || "your studies";
      let greeting = `Hello! 🎓 I'm your Socratic tutor for **${contextTitle}**. 
      
I've reviewed your notes. Instead of giving you direct answers, I'll guide you with questions to help you truly understand the material.

What would you like to explore today?`;

      if (initialContext) {
        greeting = `Hello! 🎓 I see you've just completed a study session.\n\n${initialContext}\n\nI'm here to help you master these concepts. Let's go through them step-by-step. What was most confusing?`;
      }

      setMessages([{ role: 'assistant', content: greeting }]);
    }
  };

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!note?.id) return; // Only save if we have a note context for now

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

    // Construct context from all notes if available, or just the single note
    let contextContent = "";
    if (allNotes.length > 0) {
      contextContent = `Course: ${courseName}\n\nAll Notes:\n` +
        allNotes.map(n => `--- Note: ${n.title} ---\n${n.content?.slice(0, 1000)}...`).join('\n\n');
    } else if (note?.content) {
      contextContent = `Note: ${note.title}\n\n${note.content}`;
    }

    if (note) {
      contextContent += `\n\nFocus Note: ${note.title}`;
    }

    // Add initial context to the prompt if available, even if not shown in history
    if (initialContext) {
      contextContent += `\n\nRecent Activity Context: ${initialContext}`;
    }

    const contextMessages: Message[] = [
      {
        role: 'user',
        content: `Here is the study material context:\n\n${contextContent}\n\nMy question: ${userMessage}`
      },
    ];

    // Add previous conversation for context (last 6 messages)
    const recentMessages = messages.slice(-6);
    const fullMessages = [...recentMessages, ...contextMessages];

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    // Check if we should use offline AI
    const shouldUseOffline = !isOnline || (offlineAI.isModelLoaded && offlineAI.isMobile);

    if (shouldUseOffline) {
      if (!offlineAI.isModelLoaded) {
        setIsLoading(false);
        toast({
          title: "Offline",
          description: "Please download the AI model in Settings to use the tutor offline.",
          variant: "destructive"
        });
        // Remove user message since we failed
        setMessages(prev => prev.slice(0, -1));
        return;
      }

      try {
        // Construct prompt for offline model
        const prompt = `Context:\n${contextContent}\n\nUser: ${userMessage}\n\nAct as a Socratic Tutor. Do not give the answer directly. Guide the user with questions.`;

        const response = await offlineAI.generateText(prompt);

        assistantContent = response;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
          return updated;
        });

        setIsLoading(false);
        // We don't save to DB when offline/using local model for now, or we could queue it
        // For now, let's just keep it in local state
      } catch (error) {
        setIsLoading(false);
        toast({
          title: 'Offline AI Error',
          description: 'Failed to generate response locally.',
          variant: 'destructive',
        });
        setMessages((prev) => prev.slice(0, -1));
      }
    } else {
      // Online mode - use existing streamAIChat
      await streamAIChat({
        messages: fullMessages,
        mode: 'socratic',
        onDelta: (chunk) => {
          assistantContent += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            // Check if the last message is already the assistant's (from onDelta)
            if (updated[updated.length - 1].role === 'assistant') {
              updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
            } else {
              updated.push({ role: 'assistant', content: assistantContent });
            }
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
          // Remove empty assistant message if it was added
          setMessages((prev) => {
            if (prev[prev.length - 1].role === 'assistant' && !prev[prev.length - 1].content) {
              return prev.slice(0, -1);
            }
            return prev;
          });
        },
      });
    }
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
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {courseName ? `${courseName} • ` : ''}{note?.title || 'General'}
                </p>
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
              className={`max-w-[85%] p-4 rounded-2xl ${message.role === 'user'
                ? 'gradient-primary text-primary-foreground rounded-br-md'
                : 'bg-card border border-border rounded-bl-md'
                }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-secondary" />
                  <span className="text-xs font-medium text-secondary">
                    {(!isOnline || (offlineAI.isModelLoaded && offlineAI.isMobile)) ? 'Offline AI Tutor' : 'AI Tutor'}
                  </span>
                </div>
              )}
              <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
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