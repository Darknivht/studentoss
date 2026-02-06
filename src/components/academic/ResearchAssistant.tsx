import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Search, ExternalLink, RotateCcw, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { formatAIResponse } from '@/lib/formatters';

interface ResearchAssistantProps {
  onBack: () => void;
}

const ResearchAssistant = ({ onBack }: ResearchAssistantProps) => {
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [field, setField] = useState('general');
  const [results, setResults] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const searchResearch = async () => {
    if (!topic.trim()) {
      toast({ title: 'Topic required', description: 'Enter a research topic.', variant: 'destructive' });
      return;
    }
    if (topic.trim().length < 5) {
      toast({ title: 'More detail needed', description: 'Please be more specific about your research topic.', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    setResults('');

    const fieldContext = field !== 'general' ? ` in the field of ${field}` : '';

    await streamAIChat({
      messages: [],
      mode: 'chat',
      content: `Act as an expert research assistant. For the topic: "${topic}"${fieldContext}

Provide a comprehensive research guide in markdown:

## Overview
Brief explanation of the topic and its significance.

## Key Research Areas
Main subtopics currently being studied, with brief descriptions.

## Suggested Search Terms
Keywords and Boolean search strings for finding papers on databases like Google Scholar, JSTOR, PubMed.

## Recommended Databases
Specific databases and sources relevant to this field.

## Notable Authors & Researchers
Key figures in the field and their contributions.

## Recent Developments
Current trends, debates, and emerging research directions.

## Research Questions
5-7 potential research questions or angles for papers, from narrow to broad.

## Methodology Suggestions
Appropriate research methods for studying this topic.

Format clearly with headers and bullet points. Be specific and actionable.`,
      onDelta: (chunk) => setResults(r => r + chunk),
      onDone: () => setLoading(false),
      onError: (err) => {
        toast({ title: 'Error', description: err, variant: 'destructive' });
        setLoading(false);
      },
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(results);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const databases = [
    { name: 'Google Scholar', url: 'https://scholar.google.com' },
    { name: 'JSTOR', url: 'https://jstor.org' },
    { name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov' },
    { name: 'arXiv', url: 'https://arxiv.org' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-screen pb-24">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">Research Assistant</h1>
          <p className="text-muted-foreground text-sm">Find relevant papers and sources</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Search className="w-5 h-5 text-primary" />
        </div>
      </motion.header>

      {!results && !loading && (
        <>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Academic Field</label>
            <Select value={field} onValueChange={setField}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="sciences">Natural Sciences</SelectItem>
                <SelectItem value="social_sciences">Social Sciences</SelectItem>
                <SelectItem value="humanities">Humanities</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="medicine">Medicine & Health</SelectItem>
                <SelectItem value="business">Business & Economics</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="computer_science">Computer Science</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter your research topic..."
              onKeyDown={(e) => e.key === 'Enter' && searchResearch()}
              className="flex-1"
            />
            <Button onClick={searchResearch} disabled={loading || !topic.trim() || topic.trim().length < 5} className="gradient-primary text-primary-foreground">
              <Search className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {databases.map((db) => (
              <a
                key={db.name}
                href={db.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all flex items-center justify-between"
              >
                <span className="font-medium text-foreground text-sm">{db.name}</span>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        </>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Researching your topic...</p>
        </div>
      )}

      {results && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="p-3 bg-muted border-b border-border flex items-center justify-between">
              <h3 className="font-medium text-sm">Research Guide</h3>
              <Button size="sm" variant="ghost" onClick={handleCopy} className="h-7">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
            <ScrollArea className="h-[60vh]">
              <div className="p-4 overflow-hidden">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{formatAIResponse(results)}</ReactMarkdown>
                </div>
              </div>
            </ScrollArea>
          </div>

          <Button onClick={() => { setResults(''); setTopic(''); }} variant="outline" className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Research Another Topic
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default ResearchAssistant;
