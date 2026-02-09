import { useState } from 'react';
import { Sigma } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AIToolLayout from './AIToolLayout';
import ImageUpload from './ImageUpload';
import { streamAIChat } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import FeatureGateDialog from '@/components/subscription/FeatureGateDialog';

interface OCRToLatexProps {
  onBack: () => void;
}

const OCRToLatex = ({ onBack }: OCRToLatexProps) => {
  const { toast } = useToast();
  const { gateFeature, incrementUsage } = useSubscription();
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateData, setGateData] = useState<any>(null);

  const handleConvert = async () => {
    if (!imageBase64) {
      toast({ title: 'Missing image', description: 'Please upload a photo of handwritten math.', variant: 'destructive' });
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
      mode: 'ocr_latex',
      imageBase64,
      onDelta: (chunk) => setResult((prev) => prev + chunk),
      onDone: () => setLoading(false),
      onError: (err) => {
        toast({ title: 'Error', description: err, variant: 'destructive' });
        setLoading(false);
      },
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast({ title: 'Copied!', description: 'LaTeX copied to clipboard.' });
  };

  return (
    <AIToolLayout
      title="OCR to LaTeX"
      description="Handwritten math → clean formulas"
      icon={<Sigma className="w-5 h-5 text-primary" />}
      onBack={onBack}
      result={result}
      loading={loading}
    >
      <ImageUpload onImageSelect={setImageBase64} disabled={loading} />
      <Button
        onClick={handleConvert}
        disabled={loading || !imageBase64}
        className="w-full gradient-primary text-primary-foreground"
      >
        <Sigma className="w-4 h-4 mr-2" />
        Convert to LaTeX
      </Button>
      {result && !loading && (
        <Button variant="outline" onClick={copyToClipboard} className="w-full">
          Copy LaTeX
        </Button>
      )}

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

export default OCRToLatex;
