import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import AIToolLayout from './AIToolLayout';
import ImageUpload from './ImageUpload';
import { streamAIChat } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import FeatureGateDialog from '@/components/subscription/FeatureGateDialog';

interface MathSolverProps {
  onBack: () => void;
}

const MathSolver = ({ onBack }: MathSolverProps) => {
  const { toast } = useToast();
  const { gateFeature, incrementUsage } = useSubscription();
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateData, setGateData] = useState<any>(null);

  const handleSolve = async () => {
    if (!imageBase64 && !textInput.trim()) {
      toast({ title: 'Missing input', description: 'Please upload a photo or type the math problem.', variant: 'destructive' });
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
      mode: 'math_solver',
      content: textInput,
      imageBase64: imageBase64 || undefined,
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
      title="Math Scanner & Solver"
      description="Photo → step-by-step solution"
      icon={<Calculator className="w-5 h-5 text-primary" />}
      onBack={onBack}
      result={result}
      loading={loading}
    >
      <ImageUpload onImageSelect={setImageBase64} disabled={loading} />
      <div className="text-center text-sm text-muted-foreground">or type the problem</div>
      <Textarea
        placeholder="Type your math problem here... e.g., 'Solve 2x + 5 = 15'"
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        rows={3}
        disabled={loading}
      />
      <Button
        onClick={handleSolve}
        disabled={loading || (!imageBase64 && !textInput.trim())}
        className="w-full gradient-primary text-primary-foreground"
      >
        <Calculator className="w-4 h-4 mr-2" />
        Solve Step-by-Step
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

export default MathSolver;
