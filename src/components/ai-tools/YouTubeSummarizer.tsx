import { useState } from 'react';
import { Youtube, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AIToolLayout from './AIToolLayout';
import { streamAIChat } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import FeatureGateDialog from '@/components/subscription/FeatureGateDialog';

interface YouTubeSummarizerProps {
  onBack: () => void;
}

const YouTubeSummarizer = ({ onBack }: YouTubeSummarizerProps) => {
  const { toast } = useToast();
  const { gateFeature, incrementUsage } = useSubscription();
  const [url, setUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateData, setGateData] = useState<any>(null);

  const handleSummarize = async () => {
    const gate = gateFeature('ai');
    if (!gate.allowed) {
      setGateData(gate);
      setGateOpen(true);
      return;
    }

    const content = transcript.trim() || url.trim();
    if (!content) {
      toast({ title: 'Missing input', description: 'Please paste the video transcript.', variant: 'destructive' });
      return;
    }

    if (!transcript.trim() && url.trim()) {
      toast({
        title: '⚠️ URL-only mode',
        description: 'For accurate results, paste the transcript instead. URL summaries are topic-based estimates only.',
      });
    }

    await incrementUsage('ai');
    setLoading(true);
    setResult('');

    await streamAIChat({
      messages: [],
      mode: 'youtube_summary',
      content: transcript.trim()
        ? `Video Transcript:\n${transcript}`
        : `YouTube URL (no transcript provided): ${url}\n\nIMPORTANT: The user only provided a URL, NOT a transcript. You CANNOT watch this video. Clearly state that this is a topic-based inference, not a real summary. Extract any keywords from the URL to guess the topic.`,
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
      description="Paste transcript → key points"
      icon={<Youtube className="w-5 h-5 text-primary" />}
      onBack={onBack}
      result={result}
      loading={loading}
    >
      {/* Transcript-first approach */}
      <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">How to get a transcript:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Open the YouTube video</li>
              <li>Click the <strong>"..."</strong> button below the video</li>
              <li>Select <strong>"Show transcript"</strong></li>
              <li>Copy all the text and paste below</li>
            </ol>
          </div>
        </div>
      </div>

      <Textarea
        placeholder="Paste video transcript here (recommended for accurate results)..."
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        rows={6}
        disabled={loading}
      />

      <div className="text-center text-sm text-muted-foreground flex items-center gap-2 justify-center">
        <div className="h-px flex-1 bg-border" />
        <span>or provide URL (less accurate)</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-1">
        <Input
          placeholder="Paste YouTube URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
        />
        {url.trim() && !transcript.trim() && (
          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            <span>URL-only summaries are topic estimates. Paste transcript for accuracy.</span>
          </div>
        )}
      </div>

      <Button
        onClick={handleSummarize}
        disabled={loading || (!url.trim() && !transcript.trim())}
        className="w-full gradient-primary text-primary-foreground"
      >
        <Youtube className="w-4 h-4 mr-2" />
        {transcript.trim() ? 'Summarize Transcript' : 'Estimate from URL'}
      </Button>

      {gateData && (
        <FeatureGateDialog
          open={gateOpen}
          onOpenChange={setGateOpen}
          feature="AI tool uses"
          currentUsage={gateData.currentUsage}
          limit={gateData.limit}
          isLifetime={gateData.isLifetime}
          requiredTier={gateData.requiredTier}
        />
      )}
    </AIToolLayout>
  );
};

export default YouTubeSummarizer;
