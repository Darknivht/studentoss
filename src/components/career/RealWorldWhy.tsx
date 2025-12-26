import { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { streamAIChat } from '@/lib/ai';
import { Lightbulb, Sparkles, BookOpen, Briefcase, Heart, Globe } from 'lucide-react';

const RealWorldWhy = () => {
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  const generateExplanation = async () => {
    if (!topic.trim()) {
      toast({ title: 'Enter a topic', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setExplanation('');

    try {
      const prompt = `As an inspiring educator, explain why "${topic}" matters in the real world. Structure your response as:

**Why This Matters:**
[Brief engaging intro about real-world relevance]

**Career Applications:**
- [3-4 specific careers/industries that use this]

**Everyday Impact:**
- [2-3 ways this affects daily life]

**Famous Examples:**
- [1-2 notable people or innovations related to this topic]

**Your Future:**
[Motivational closing about how mastering this opens doors]

Keep it engaging and relatable for students!`;

      await streamAIChat({
        messages: [{ role: 'user', content: prompt }],
        onDelta: (chunk) => setExplanation((prev) => prev + chunk),
        onDone: () => setLoading(false),
        onError: (error) => {
          toast({ title: error, variant: 'destructive' });
          setLoading(false);
        },
      });
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Failed to generate explanation', variant: 'destructive' });
      setLoading(false);
    }
  };

  const exampleTopics = [
    { name: 'Calculus', icon: '📐' },
    { name: 'Shakespeare', icon: '📚' },
    { name: 'Chemistry', icon: '⚗️' },
    { name: 'History', icon: '🏛️' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
            <Lightbulb className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Real-World "Why"</h3>
            <p className="text-sm text-muted-foreground">
              Discover why what you're learning actually matters
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Input
              placeholder="Enter a topic you're studying..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mb-2"
            />
            <div className="flex flex-wrap gap-2">
              {exampleTopics.map((ex) => (
                <button
                  key={ex.name}
                  onClick={() => setTopic(ex.name)}
                  className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-full transition-colors"
                >
                  {ex.icon} {ex.name}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={generateExplanation}
            disabled={loading}
            className="w-full gradient-primary text-primary-foreground"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Show Me Why It Matters
              </>
            )}
          </Button>
        </div>
      </Card>

      {explanation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 bg-card border-border">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-foreground">{explanation}</div>
            </div>
          </Card>
        </motion.div>
      )}

      {!explanation && (
        <Card className="p-6 bg-muted/30 border-border">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">Career paths</span>
            </div>
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">Life impact</span>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">Global relevance</span>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">Famous examples</span>
            </div>
          </div>
        </Card>
      )}
    </motion.div>
  );
};

export default RealWorldWhy;
