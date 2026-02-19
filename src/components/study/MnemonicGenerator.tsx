import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Lightbulb, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { streamAIChat } from '@/lib/ai';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { formatAIResponse } from '@/lib/formatters';
import { useSubscription } from '@/hooks/useSubscription';
import FeatureGateDialog from '@/components/subscription/FeatureGateDialog';
import type { GateResult } from '@/hooks/useSubscription';

interface MnemonicGeneratorProps {
  onBack: () => void;
}

const MnemonicGenerator = ({ onBack }: MnemonicGeneratorProps) => {
  const { toast } = useToast();
  const { gateFeature, incrementUsage } = useSubscription();
  const [gateData, setGateData] = useState<GateResult | null>(null);
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateMnemonic = async () => {
    if (!input.trim()) return;
    const gate = gateFeature('ai');
    if (!gate.allowed) { setGateData(gate); return; }
    await incrementUsage('ai');
    
    setLoading(true);
    setResult('');

    await streamAIChat({
      messages: [],
      mode: 'mnemonic',
      content: input,
      onDelta: (chunk) => setResult(r => r + chunk),
      onDone: () => setLoading(false),
      onError: (err) => {
        toast({ title: 'Error', description: err, variant: 'destructive' });
        setLoading(false);
      },
    });
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied!', description: 'Mnemonics copied to clipboard' });
  };

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">Mnemonic Generator</h1>
          <p className="text-muted-foreground text-sm">Funny rhymes & acronyms to remember</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-primary" />
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            What do you need to memorize?
          </label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter terms, lists, or concepts...

Example:
- Planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune
- Biological classification: Kingdom, Phylum, Class, Order, Family, Genus, Species"
            className="min-h-[150px]"
          />
        </div>

        <Button 
          onClick={generateMnemonic} 
          disabled={loading || !input.trim()}
          className="w-full gradient-primary text-primary-foreground"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Generate Mnemonics
        </Button>
      </motion.div>

      {(loading || result) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-border overflow-hidden"
        >
          <div className="p-3 bg-muted border-b border-border flex items-center justify-between">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              {loading ? 'Creating memory aids...' : 'Your Mnemonics'}
            </h3>
            {result && !loading && (
              <Button
                size="sm"
                variant="ghost"
                onClick={copyToClipboard}
                className="h-7 text-xs"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            )}
          </div>
          <ScrollArea className="h-[50vh]">
            <div className="p-4 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{formatAIResponse(result)}</ReactMarkdown>
                </div>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      )}
      <FeatureGateDialog
        open={!!gateData}
        onOpenChange={() => setGateData(null)}
        feature="AI calls"
        currentUsage={gateData?.currentUsage || 0}
        limit={gateData?.limit || 0}
        isLifetime={gateData?.isLifetime}
        requiredTier={gateData?.requiredTier}
      />
    </div>
  );
};

export default MnemonicGenerator;
