import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface Topic {
  id: string;
  name: string;
  description: string | null;
  difficulty: string;
}

interface TopicSelectorProps {
  subjectId: string;
  subjectName: string;
  onSelect: (topicId: string) => void;
  onBack: () => void;
}

const TopicSelector = ({ subjectId, subjectName, onSelect, onBack }: TopicSelectorProps) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('exam_topics')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .order('name');
      setTopics(data || []);
      setLoading(false);
    };
    fetch();
  }, [subjectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const diffColor: Record<string, string> = { easy: 'text-green-500', medium: 'text-yellow-500', hard: 'text-destructive' };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-primary font-medium">
        <ArrowLeft size={16} /> Back
      </button>
      <h2 className="text-lg font-display font-semibold text-foreground">Topics — {subjectName}</h2>

      {topics.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📁</p>
          <h3 className="font-semibold text-foreground">No topics yet</h3>
          <Button variant="outline" onClick={onBack} className="mt-4">Go Back</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {topics.map((t, i) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(t.id)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border hover:border-primary/50 transition-all text-left"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm">{t.name}</h3>
                {t.description && <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>}
              </div>
              <span className={`text-[10px] font-semibold capitalize ${diffColor[t.difficulty] || 'text-muted-foreground'}`}>
                {t.difficulty}
              </span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopicSelector;
