import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface TopicPerf {
  topicId: string | null;
  topicName: string;
  total: number;
  correct: number;
  pct: number;
}

interface ExamPerformanceProps {
  examTypeId: string;
  subjectId: string;
  subjectName: string;
  onBack: () => void;
}

const ExamPerformance = ({ examTypeId, subjectId, subjectName, onBack }: ExamPerformanceProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overall, setOverall] = useState({ total: 0, correct: 0 });
  const [topicPerfs, setTopicPerfs] = useState<TopicPerf[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select('is_correct, topic_id')
        .eq('user_id', user.id)
        .eq('exam_type_id', examTypeId)
        .eq('subject_id', subjectId);

      const { data: topics } = await supabase
        .from('exam_topics')
        .select('id, name')
        .eq('subject_id', subjectId);

      const topicMap = new Map<string, string>();
      (topics || []).forEach(t => topicMap.set(t.id, t.name));

      const atts = attempts || [];
      const totalCorrect = atts.filter(a => a.is_correct).length;
      setOverall({ total: atts.length, correct: totalCorrect });

      const byTopic = new Map<string, { total: number; correct: number }>();
      atts.forEach(a => {
        const key = a.topic_id || '_general';
        const prev = byTopic.get(key) || { total: 0, correct: 0 };
        byTopic.set(key, { total: prev.total + 1, correct: prev.correct + (a.is_correct ? 1 : 0) });
      });

      const perfs: TopicPerf[] = [];
      byTopic.forEach((v, k) => {
        perfs.push({
          topicId: k === '_general' ? null : k,
          topicName: k === '_general' ? 'General' : (topicMap.get(k) || 'Unknown Topic'),
          total: v.total,
          correct: v.correct,
          pct: Math.round((v.correct / v.total) * 100),
        });
      });
      perfs.sort((a, b) => a.pct - b.pct);
      setTopicPerfs(perfs);
      setLoading(false);
    };
    fetch();
  }, [user, examTypeId, subjectId]);

  const TrendIcon = ({ pct }: { pct: number }) => {
    if (pct >= 70) return <TrendingUp size={14} className="text-green-500" />;
    if (pct >= 50) return <Minus size={14} className="text-yellow-500" />;
    return <TrendingDown size={14} className="text-destructive" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const overallPct = overall.total > 0 ? Math.round((overall.correct / overall.total) * 100) : 0;

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-primary font-medium">
        <ArrowLeft size={16} /> Back
      </button>

      <h2 className="text-lg font-display font-semibold text-foreground">Performance — {subjectName}</h2>

      {overall.total === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📊</p>
          <h3 className="font-semibold text-foreground">No attempts yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Practice some questions to see your performance!</p>
          <Button variant="outline" onClick={onBack} className="mt-4">Start Practicing</Button>
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-card border border-border text-center">
            <p className="text-4xl font-display font-bold text-foreground">{overallPct}%</p>
            <p className="text-sm text-muted-foreground mt-1">{overall.correct} / {overall.total} questions correct</p>
            <Progress value={overallPct} className="mt-3" />
          </motion.div>

          <h3 className="text-sm font-semibold text-foreground pt-2">By Topic</h3>
          <div className="space-y-2">
            {topicPerfs.map((tp, i) => (
              <motion.div key={tp.topicId || i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                <TrendIcon pct={tp.pct} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tp.topicName}</p>
                  <p className="text-xs text-muted-foreground">{tp.correct}/{tp.total} correct</p>
                </div>
                <span className={`text-sm font-bold ${tp.pct >= 70 ? 'text-green-500' : tp.pct >= 50 ? 'text-yellow-500' : 'text-destructive'}`}>
                  {tp.pct}%
                </span>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ExamPerformance;
