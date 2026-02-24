import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Loader2, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface WeakTopic {
  topicId: string;
  topicName: string;
  accuracy: number;
  attempts: number;
}

interface WeaknessReportProps {
  examTypeId: string;
  subjectId: string;
  subjectName: string;
  onBack: () => void;
  onPracticeTopic?: (topicId: string) => void;
}

const WeaknessReport = ({ examTypeId, subjectId, subjectName, onBack, onPracticeTopic }: WeaknessReportProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select('is_correct, topic_id')
        .eq('user_id', user.id)
        .eq('exam_type_id', examTypeId)
        .eq('subject_id', subjectId)
        .not('topic_id', 'is', null);

      const { data: topics } = await supabase
        .from('exam_topics')
        .select('id, name')
        .eq('subject_id', subjectId);

      const topicMap = new Map<string, string>();
      (topics || []).forEach(t => topicMap.set(t.id, t.name));

      const byTopic = new Map<string, { total: number; correct: number }>();
      (attempts || []).forEach(a => {
        if (!a.topic_id) return;
        const prev = byTopic.get(a.topic_id) || { total: 0, correct: 0 };
        byTopic.set(a.topic_id, { total: prev.total + 1, correct: prev.correct + (a.is_correct ? 1 : 0) });
      });

      const weak: WeakTopic[] = [];
      byTopic.forEach((v, k) => {
        const acc = Math.round((v.correct / v.total) * 100);
        if (acc < 60 && v.total >= 3) {
          weak.push({ topicId: k, topicName: topicMap.get(k) || 'Unknown', accuracy: acc, attempts: v.total });
        }
      });
      weak.sort((a, b) => a.accuracy - b.accuracy);
      setWeakTopics(weak);
      setLoading(false);
    };
    fetch();
  }, [user, examTypeId, subjectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-primary font-medium">
        <ArrowLeft size={16} /> Back
      </button>

      <h2 className="text-lg font-display font-semibold text-foreground">
        <AlertTriangle size={18} className="inline mr-1 text-yellow-500" />
        Weak Topics — {subjectName}
      </h2>

      {weakTopics.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🎯</p>
          <h3 className="font-semibold text-foreground">No weak topics found!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {weakTopics.length === 0 ? 'Keep practicing to build enough data, or you\'re doing great!' : ''}
          </p>
          <Button variant="outline" onClick={onBack} className="mt-4">Go Back</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {weakTopics.map((wt, i) => (
            <motion.div
              key={wt.topicId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl bg-card border border-destructive/20"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground text-sm">{wt.topicName}</h3>
                <span className="text-sm font-bold text-destructive">{wt.accuracy}%</span>
              </div>
              <Progress value={wt.accuracy} className="h-2 mb-2" />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{wt.attempts} attempts</p>
                {onPracticeTopic && (
                  <button
                    onClick={() => onPracticeTopic(wt.topicId)}
                    className="flex items-center gap-1 text-xs font-medium text-primary"
                  >
                    <Target size={12} /> Practice This
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeaknessReport;
