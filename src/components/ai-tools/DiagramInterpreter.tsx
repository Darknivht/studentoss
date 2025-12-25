import { useState } from 'react';
import { Microscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AIToolLayout from './AIToolLayout';
import ImageUpload from './ImageUpload';
import { streamAIChat } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';

interface DiagramInterpreterProps {
  onBack: () => void;
}

const DiagramInterpreter = ({ onBack }: DiagramInterpreterProps) => {
  const { toast } = useToast();
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!imageBase64) {
      toast({
        title: 'Missing image',
        description: 'Please upload a diagram to analyze.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setResult('');

    await streamAIChat({
      messages: [],
      mode: 'diagram_interpreter',
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
      title="Diagram Interpreter"
      description="Explain biology/physics diagrams"
      icon={<Microscope className="w-5 h-5 text-primary" />}
      onBack={onBack}
      result={result}
      loading={loading}
    >
      <ImageUpload onImageSelect={setImageBase64} disabled={loading} />

      <Button
        onClick={handleAnalyze}
        disabled={loading || !imageBase64}
        className="w-full gradient-primary text-primary-foreground"
      >
        <Microscope className="w-4 h-4 mr-2" />
        Explain Diagram
      </Button>
    </AIToolLayout>
  );
};

export default DiagramInterpreter;
