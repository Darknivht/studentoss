import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Save, Check, Lock, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { formatAIResponse } from '@/lib/formatters';
import { downloadAsHTML, printMarkdownContent } from '@/components/export/ExportUtils';
import DownloadDropdown from '@/components/export/DownloadDropdown';

/** Extract a meaningful title from AI content for file naming */
function extractContentTitle(content: string, fallback: string): string {
  if (!content) return fallback;
  // Try first heading
  const h1 = content.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].replace(/[*_`#]/g, '').trim().slice(0, 80);
  const h2 = content.match(/^##\s+(.+)$/m);
  if (h2) return h2[1].replace(/[*_`#]/g, '').trim().slice(0, 80);
  // Try first bold text
  const bold = content.match(/\*\*(.{5,60}?)\*\*/);
  if (bold) return bold[1].trim();
  // Use first meaningful line
  const firstLine = content.split('\n').find(l => l.trim().length > 10 && !l.startsWith('```'));
  if (firstLine) return firstLine.replace(/[#*_`>]/g, '').trim().slice(0, 80);
  return fallback;
}

interface AIToolLayoutProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onBack: () => void;
  children: React.ReactNode;
  result?: string;
  loading?: boolean;
  requiresPro?: boolean;
  featureType?: 'ai' | 'quiz' | 'flashcard' | 'note';
}

const AIToolLayout = ({ 
  title, 
  description, 
  icon, 
  onBack, 
  children, 
  result, 
  loading,
  requiresPro = false,
  featureType = 'ai'
}: AIToolLayoutProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { subscription, checkLimit, getRemainingUses, incrementUsage } = useSubscription();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingUses, setRemainingUses] = useState<number | null>(null);

  useEffect(() => {
    if (subscription) {
      const canUse = checkLimit(featureType);
      const remaining = getRemainingUses(featureType);
      setIsBlocked(!canUse);
      setRemainingUses(remaining);
    }
  }, [subscription, featureType]);

  const saveAsNote = async () => {
    if (!user || !result) return;
    
    setSaving(true);
    try {
      const { error } = await supabase.from('notes').insert({
        user_id: user.id,
        title: `${title} - ${new Date().toLocaleDateString()}`,
        content: result,
        source_type: 'ai_tool',
      });

      if (error) throw error;
      
      setSaved(true);
      toast({ title: 'Saved!', description: 'Result saved to your notes.' });
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save note.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (isBlocked || (requiresPro && subscription?.tier === 'free')) {
    return (
      <div className="p-6 space-y-6 min-h-screen pb-24">
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex-1">
            <h1 className="text-xl font-display font-bold text-foreground">{title}</h1>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">{icon}</div>
        </motion.header>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {requiresPro ? 'Pro Feature' : 'Daily Limit Reached'}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            {requiresPro 
              ? 'This feature is only available on the Pro plan. Upgrade to unlock unlimited access to all AI tools.'
              : `You've used all your free ${featureType} uses for today. Upgrade to Pro for unlimited access.`}
          </p>
          <Button size="lg" className="gradient-primary text-primary-foreground" onClick={() => navigate('/upgrade')}>
            Upgrade to Pro
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-screen pb-24">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">{icon}</div>
      </motion.header>

      {subscription?.tier === 'free' && remainingUses !== null && remainingUses < 999 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
          <span className="text-sm text-foreground">{remainingUses} {featureType} uses remaining today</span>
          <Button variant="link" size="sm" onClick={() => navigate('/upgrade')}>Get unlimited</Button>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        {children}
      </motion.div>

      {(loading || result) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card border border-border overflow-hidden w-full min-w-0">
          <div className="p-3 bg-muted border-b border-border flex items-center justify-between gap-2">
            <h3 className="font-medium text-sm truncate">{loading ? 'Analyzing...' : 'Result'}</h3>
            {result && !loading && (
              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => downloadAsHTML(result, extractContentTitle(result, title), `${extractContentTitle(result, title).toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`)} className="h-7">
                  <Download className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => printMarkdownContent(result, extractContentTitle(result, title))} className="h-7">
                  <Printer className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant={saved ? "default" : "outline"}
                  onClick={saveAsNote}
                  disabled={saving || saved}
                  className="h-7 text-xs"
                >
                  {saved ? <><Check className="w-3 h-3 mr-1" />Saved</> : saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Save className="w-3 h-3 mr-1" />Save as Note</>}
                </Button>
              </div>
            )}
          </div>
          <ScrollArea className="h-[50vh]">
            <div className="p-4 w-full min-w-0 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none break-words overflow-wrap-anywhere [&_*]:max-w-full [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_table]:table-fixed [&_table]:w-full [&_td]:break-words [&_th]:break-words [&_.katex-display]:overflow-x-auto [&_.katex-display]:max-w-full [&_p]:break-words [&_li]:break-words [&_.katex]:overflow-x-auto">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {formatAIResponse(result || '')}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </div>
  );
};

export default AIToolLayout;
