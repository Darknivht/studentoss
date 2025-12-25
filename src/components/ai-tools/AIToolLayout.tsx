import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AIToolLayoutProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onBack: () => void;
  children: React.ReactNode;
  result?: string;
  loading?: boolean;
}

const AIToolLayout = ({ title, description, icon, onBack, children, result, loading }: AIToolLayoutProps) => {
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
          <h1 className="text-xl font-display font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {children}
      </motion.div>

      {(loading || result) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-border overflow-hidden"
        >
          <div className="p-3 bg-muted border-b border-border">
            <h3 className="font-medium text-sm">
              {loading ? 'Analyzing...' : 'Result'}
            </h3>
          </div>
          <ScrollArea className="max-h-[50vh]">
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">
                    {result}
                  </pre>
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
