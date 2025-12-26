import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Search, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ResearchAssistantProps {
  onBack: () => void;
}

const ResearchAssistant = ({ onBack }: ResearchAssistantProps) => {
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [results, setResults] = useState('');
  const [loading, setLoading] = useState(false);

  const searchResearch = async () => {
    if (!topic.trim()) return;
    
    setLoading(true);
    setResults('');

    await streamAIChat({
      messages: [],
      mode: 'chat',
      content: `Act as a research assistant. For the topic: "${topic}"

Provide:
1. **Overview** - Brief explanation of the topic
2. **Key Research Areas** - Main subtopics being studied
3. **Suggested Search Terms** - Keywords for finding papers
4. **Recommended Sources** - Types of journals, databases to search
5. **Notable Authors/Researchers** - Key figures in the field
6. **Recent Developments** - Current trends and debates
7. **Research Questions** - Potential angles for papers

Format clearly with headers and bullet points.`,
      onDelta: (chunk) => setResults(r => r + chunk),
      onDone: () => setLoading(false),
      onError: (err) => {
        toast({ title: 'Error', description: err, variant: 'destructive' });
        setLoading(false);
      },
    });
  };

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">Research Assistant</h1>
          <p className="text-muted-foreground text-sm">Find relevant papers and sources</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Search className="w-5 h-5 text-primary" />
        </div>
      </motion.header>

      <div className="flex gap-2">
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter your research topic..."
          onKeyDown={(e) => e.key === 'Enter' && searchResearch()}
          className="flex-1"
        />
        <Button onClick={searchResearch} disabled={loading || !topic.trim()} className="gradient-primary text-primary-foreground">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Researching your topic...</p>
        </div>
      )}

      {results && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="p-3 bg-muted border-b border-border">
            <h3 className="font-medium text-sm">Research Guide</h3>
          </div>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">{results}</pre>
            </div>
          </ScrollArea>
        </motion.div>
      )}

      {!loading && !results && (
        <div className="grid grid-cols-2 gap-3 pt-4">
          {['Google Scholar', 'JSTOR', 'PubMed', 'arXiv'].map((db) => (
            <a
              key={db}
              href={`https://${db.toLowerCase().replace(' ', '')}.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all flex items-center justify-between"
            >
              <span className="font-medium text-foreground text-sm">{db}</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResearchAssistant;