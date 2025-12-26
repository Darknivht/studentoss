import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Lightbulb, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';

interface ThesisGeneratorProps {
  onBack: () => void;
}

const ThesisGenerator = ({ onBack }: ThesisGeneratorProps) => {
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [position, setPosition] = useState('');
  const [thesis, setThesis] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateThesis = async () => {
    if (!topic.trim()) return;
    
    setLoading(true);
    setThesis('');

    await streamAIChat({
      messages: [],
      mode: 'chat',
      content: `Generate strong thesis statements for this topic.

Topic: ${topic}
${position ? `Position/Angle: ${position}` : ''}

Provide:
1. **Strong Thesis Statement** - Clear, arguable, specific
2. **Alternative Versions** - 2-3 variations with different angles
3. **Weak vs Strong Comparison** - Show what makes a thesis effective
4. **Supporting Points Preview** - Main arguments that could support each thesis
5. **Tips for Refinement** - How to make it even stronger

Make theses specific, arguable (not obvious facts), and appropriately scoped.`,
      onDelta: (chunk) => setThesis(t => t + chunk),
      onDone: () => setLoading(false),
      onError: (err) => {
        toast({ title: 'Error', description: err, variant: 'destructive' });
        setLoading(false);
      },
    });
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(thesis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">Thesis Generator</h1>
          <p className="text-muted-foreground text-sm">Refine your arguments</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-primary" />
        </div>
      </motion.header>

      {!thesis && !loading && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Essay/Paper Topic</label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What is your essay about? e.g., 'The impact of social media on teen mental health'"
              className="min-h-[100px]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Your Position (optional)</label>
            <Textarea
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="What angle are you taking? e.g., 'It has more negative effects than positive'"
              className="min-h-[60px]"
            />
          </div>
          <Button onClick={generateThesis} disabled={!topic.trim()} className="w-full gradient-primary text-primary-foreground">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Thesis Statements
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Crafting thesis statements...</p>
        </div>
      )}

      {thesis && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="p-3 bg-muted border-b border-border flex items-center justify-between">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                Thesis Options
              </h3>
              <Button size="sm" variant="ghost" onClick={copyToClipboard} className="h-7">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
            <div className="p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">{thesis}</pre>
            </div>
          </div>

          <Button onClick={() => { setThesis(''); setTopic(''); setPosition(''); }} variant="outline" className="w-full">
            Generate for Another Topic
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default ThesisGenerator;