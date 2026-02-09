import { useState } from 'react';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AIToolLayout from './AIToolLayout';
import { streamAIChat } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import FeatureGateDialog from '@/components/subscription/FeatureGateDialog';

interface LanguageTranslatorProps {
  onBack: () => void;
}

const languages = [
  { value: 'english', label: 'English' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'french', label: 'French' },
  { value: 'german', label: 'German' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'korean', label: 'Korean' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'portuguese', label: 'Portuguese' },
];

const LanguageTranslator = ({ onBack }: LanguageTranslatorProps) => {
  const { toast } = useToast();
  const { gateFeature, incrementUsage } = useSubscription();
  const [text, setText] = useState('');
  const [targetLang, setTargetLang] = useState('english');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateData, setGateData] = useState<any>(null);

  const handleTranslate = async () => {
    if (!text.trim()) {
      toast({ title: 'Missing text', description: 'Please enter text to translate.', variant: 'destructive' });
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

    const targetLabel = languages.find(l => l.value === targetLang)?.label || 'English';

    await streamAIChat({
      messages: [],
      mode: 'translator',
      content: `Translate the following text to ${targetLabel}. Also explain any idioms or important vocabulary:\n\n${text}`,
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
      title="Language Translator"
      description="Notes in any language"
      icon={<Languages className="w-5 h-5 text-primary" />}
      onBack={onBack}
      result={result}
      loading={loading}
    >
      <Textarea
        placeholder="Enter text to translate..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        disabled={loading}
      />
      <Select value={targetLang} onValueChange={setTargetLang}>
        <SelectTrigger>
          <SelectValue placeholder="Translate to..." />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.value} value={lang.value}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={handleTranslate}
        disabled={loading || !text.trim()}
        className="w-full gradient-primary text-primary-foreground"
      >
        <Languages className="w-4 h-4 mr-2" />
        Translate & Explain
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

export default LanguageTranslator;
