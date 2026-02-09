import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AIToolLayout from './AIToolLayout';
import ImageUpload from './ImageUpload';
import { streamAIChat } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import FeatureGateDialog from '@/components/subscription/FeatureGateDialog';

interface BookScannerProps {
  onBack: () => void;
}

const BookScanner = ({ onBack }: BookScannerProps) => {
  const { toast } = useToast();
  const { gateFeature, incrementUsage } = useSubscription();
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateData, setGateData] = useState<any>(null);

  const handleScan = async () => {
    if (!imageBase64) {
      toast({ title: 'Missing image', description: 'Please upload a photo of a textbook page.', variant: 'destructive' });
      return;
    }

    const gate = gateFeature('ai');
    if (!gate.allowed) {
      setGateData(gate);
      setGateOpen(true);
      return;
    }

    await incrementUsage('ai');
    setLoading(true);
    setResult('');

    await streamAIChat({
      messages: [],
      mode: 'book_scanner',
      imageBase64,
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
      title="Book Scanner"
      description="Extract definitions from textbook pages"
      icon={<BookOpen className="w-5 h-5 text-primary" />}
      onBack={onBack}
      result={result}
      loading={loading}
    >
      <ImageUpload onImageSelect={setImageBase64} disabled={loading} />
      <Button
        onClick={handleScan}
        disabled={loading || !imageBase64}
        className="w-full gradient-primary text-primary-foreground"
      >
        <BookOpen className="w-4 h-4 mr-2" />
        Extract & Organize
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

export default BookScanner;
