import { useState } from 'react';
import { Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AIToolLayout from './AIToolLayout';
import { streamAIChat } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';

interface YouTubeSummarizerProps {
  onBack: () => void;
}

const YouTubeSummarizer = ({ onBack }: YouTubeSummarizerProps) => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    const content = transcript.trim() || url.trim();
    
    if (!content) {
      toast({
        title: 'Missing input',
        description: 'Please enter a YouTube URL or paste the video transcript.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setResult('');

    await streamAIChat({
      messages: [],
      mode: 'youtube_summary',
      content: transcript.trim() 
        ? `Video Transcript:\n${transcript}` 
        : `Please summarize the key points from this YouTube video: ${url}`,
      onDelta: (chunk) => setResult((prev) => prev + chunk),
      onDone: () => setLoading(false),
      onError: (err) => {
        toast({ title: 'Error', description: err, variant: 'destructive' });
        setLoading(false);
      },
    });
  };

  return (
    <AIToolLayout
      title="YouTube Summarizer"
      description="Video link → key points"
      icon={<Youtube className="w-5 h-5 text-primary" />}
      onBack={onBack}
      result={result}
      loading={loading}
    >
      <Input
        placeholder="Paste YouTube URL..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={loading}
      />

      <div className="text-center text-sm text-muted-foreground">
        or paste the transcript directly
      </div>

      <Textarea
        placeholder="Paste video transcript here for better results..."
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        rows={6}
        disabled={loading}
      />

      <p className="text-xs text-muted-foreground">
        💡 Tip: For best results, paste the video transcript. You can get it from YouTube's "..." menu → "Show transcript"
      </p>

      <Button
        onClick={handleSummarize}
        disabled={loading || (!url.trim() && !transcript.trim())}
        className="w-full gradient-primary text-primary-foreground"
      >
        <Youtube className="w-4 h-4 mr-2" />
        Summarize Video
      </Button>
    </AIToolLayout>
  );
};

export default YouTubeSummarizer;
