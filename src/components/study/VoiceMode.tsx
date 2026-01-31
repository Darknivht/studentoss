import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mic, MicOff, Volume2, Loader2, StopCircle, AlertCircle, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { formatAIResponse, stripMarkdown } from '@/lib/formatters';

// Type declarations for Web Speech API
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

const VoiceMode = ({ onBack }: VoiceModeProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [useTextInput, setUseTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    
    // Check for speech recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setUseTextInput(true);
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const current = event.resultIndex;
      const result = event.results[current];
      setTranscript(result[0].transcript);
      
      if (result.isFinal) {
        handleUserInput(result[0].transcript);
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast({ 
          title: 'Microphone Access Denied', 
          description: 'Please allow microphone access to use voice mode, or use text input instead.',
          variant: 'destructive' 
        });
        setUseTextInput(true);
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast({ title: 'Error', description: `Speech recognition failed: ${event.error}`, variant: 'destructive' });
      }
    };
    
    recognitionRef.current = recognition;
    
    return () => {
      recognitionRef.current?.abort();
      synthRef.current?.cancel();
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      toast({ title: 'Error', description: 'Speech recognition not supported. Use text input instead.', variant: 'destructive' });
      setUseTextInput(true);
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Stop any ongoing speech
      synthRef.current?.cancel();
      setIsSpeaking(false);
      setTranscript('');
      
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start recognition:', error);
        toast({ title: 'Error', description: 'Failed to start listening. Try refreshing the page.', variant: 'destructive' });
      }
    }
  };

  const handleUserInput = async (text: string) => {
    if (!text.trim()) return;
    
    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setTranscript('');
    setTextInput('');
    setIsProcessing(true);
    
    let response = '';
    await streamAIChat({
      messages: [...messages, userMessage],
      mode: 'socratic',
      onDelta: (chunk) => {
        response += chunk;
        setMessages(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg?.role === 'assistant') {
            lastMsg.content = response;
          } else {
            updated.push({ role: 'assistant', content: response });
          }
          return updated;
        });
      },
      onDone: () => {
        setIsProcessing(false);
        speakText(response);
      },
      onError: (err) => {
        toast({ title: 'Error', description: err, variant: 'destructive' });
        setIsProcessing(false);
      },
    });
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      handleUserInput(textInput.trim());
    }
  };

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    
    // Clean text for speech
    const cleanText = stripMarkdown(text);
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')
    );
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 flex items-center gap-3 border-b border-border"
      >
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-display font-bold text-foreground">Voice Mode</h1>
          <p className="text-muted-foreground text-xs">Talk to AI like a real tutor</p>
        </div>
        <div className="flex gap-2">
          {isSupported && (
            <Button 
              size="icon" 
              variant={useTextInput ? 'default' : 'outline'} 
              onClick={() => setUseTextInput(!useTextInput)}
            >
              <Keyboard className="w-4 h-4" />
            </Button>
          )}
          {isSpeaking && (
            <Button size="icon" variant="outline" onClick={stopSpeaking}>
              <StopCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      </motion.header>

      {/* Browser Not Supported Warning */}
      {!isSupported && (
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-700 text-sm">Speech Recognition Not Supported</p>
              <p className="text-xs text-amber-600">Your browser doesn't support voice input. Use text input below to chat.</p>
            </div>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                {useTextInput ? (
                  <Keyboard className="w-8 h-8 text-primary" />
                ) : (
                  <Mic className="w-8 h-8 text-primary" />
                )}
              </div>
              <h3 className="font-semibold text-lg mb-2">Ready to chat!</h3>
              <p className="text-muted-foreground text-sm">
                {useTextInput 
                  ? 'Type your message and press Enter'
                  : 'Tap the microphone and start talking'}
              </p>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm'
              }`}>
                <div className={`text-sm ${msg.role === 'assistant' ? 'prose prose-sm dark:prose-invert max-w-none' : ''}`}>
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown>{formatAIResponse(msg.content)}</ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border space-y-4">
        <AnimatePresence>
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 rounded-xl bg-muted text-sm text-muted-foreground italic"
            >
              "{transcript}"
            </motion.div>
          )}
        </AnimatePresence>

        {useTextInput ? (
          <div className="flex gap-2">
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleTextSubmit();
                }
              }}
              placeholder="Type your message..."
              className="min-h-[50px] max-h-[100px]"
              disabled={isProcessing}
            />
            <Button
              onClick={handleTextSubmit}
              disabled={isProcessing || !textInput.trim()}
              className="gradient-primary text-primary-foreground"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
            </Button>
          </div>
        ) : (
          <div className="flex justify-center gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleListening}
              disabled={isProcessing}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'gradient-primary text-primary-foreground'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : isListening ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </motion.button>
          </div>
        )}

        <div className="flex justify-center gap-2 text-xs text-muted-foreground">
          {isListening && <span className="flex items-center gap-1"><Mic className="w-3 h-3" /> Listening...</span>}
          {isSpeaking && <span className="flex items-center gap-1"><Volume2 className="w-3 h-3" /> Speaking...</span>}
          {isProcessing && <span>Thinking...</span>}
        </div>
      </div>
    </div>
  );
};

export default VoiceMode;
