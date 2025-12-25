import { useState } from 'react';
import { Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import AIToolLayout from './AIToolLayout';
import { streamAIChat } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';

interface CodeDebuggerProps {
  onBack: () => void;
}

const CodeDebugger = ({ onBack }: CodeDebuggerProps) => {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDebug = async () => {
    if (!code.trim()) {
      toast({
        title: 'Missing code',
        description: 'Please paste your code to debug.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setResult('');

    await streamAIChat({
      messages: [],
      mode: 'code_debugger',
      content: code,
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
      title="Code Debugger"
      description="Paste code, AI explains fixes"
      icon={<Bug className="w-5 h-5 text-primary" />}
      onBack={onBack}
      result={result}
      loading={loading}
    >
      <Textarea
        placeholder="Paste your code here..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={10}
        className="font-mono text-sm"
        disabled={loading}
      />

      <Button
        onClick={handleDebug}
        disabled={loading || !code.trim()}
        className="w-full gradient-primary text-primary-foreground"
      >
        <Bug className="w-4 h-4 mr-2" />
        Debug & Explain
      </Button>
    </AIToolLayout>
  );
};

export default CodeDebugger;
