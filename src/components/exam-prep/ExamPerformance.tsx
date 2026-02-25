import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

const CHART_COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

const ExamPerformance = ({ examTypeId, subjectId, subjectName, onBack }: ExamPerformanceProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overall, setOverall] = useState({ total: 0, correct: 0 });
  const [topicPerfs, setTopicPerfs] = useState<TopicPerf[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [trendTopics, setTrendTopics] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select('is_correct, topic_id, created_at, session_id')
        .eq('user_id', user.id)
        .eq('exam_type_id', examTypeId)
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: true });

      const { data: topics } = await supabase
        .from('exam_topics')
        .select('id, name')
        .eq('subject_id', subjectId);

      const topicMap = new Map<string, string>();
      (topics || []).forEach(t => topicMap.set(t.id, t.name));

      const atts = attempts || [];
      const totalCorrect = atts.filter(a => a.is_correct).length;
      setOverall({ total: atts.length, correct: totalCorrect });

      // Per-topic breakdown
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

      // Build trend data grouped by session date
      const sessionMap = new Map<string, Map<string, { total: number; correct: number }>>();
      atts.forEach(a => {
        const date = a.created_at.split('T')[0];
        if (!sessionMap.has(date)) sessionMap.set(date, new Map());
        const dateMap = sessionMap.get(date)!;

        // Overall
        const ov = dateMap.get('Overall') || { total: 0, correct: 0 };
        dateMap.set('Overall', { total: ov.total + 1, correct: ov.correct + (a.is_correct ? 1 : 0) });

        // Per topic
        const topicName = a.topic_id ? (topicMap.get(a.topic_id) || 'Unknown') : 'General';
        const tv = dateMap.get(topicName) || { total: 0, correct: 0 };
        dateMap.set(topicName, { total: tv.total + 1, correct: tv.correct + (a.is_correct ? 1 : 0) });
      });

      const allTopicNames = new Set<string>();
      const chartData: any[] = [];
      sessionMap.forEach((dateMap, date) => {
        const entry: any = { date };
        dateMap.forEach((v, name) => {
          entry[name] = Math.round((v.correct / v.total) * 100);
          allTopicNames.add(name);
        });
        chartData.push(entry);
      });

      setTrendData(chartData);
      setTrendTopics(Array.from(allTopicNames));
      setLoading(false);
    };
    fetchData();
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

          {/* Trend Chart */}
          {trendData.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-4 rounded-2xl bg-card border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">Accuracy Over Time</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    {trendTopics.map((name, i) => (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        stroke={CHART_COLORS[i % CHART_COLORS.length]}
                        strokeWidth={name === 'Overall' ? 2.5 : 1.5}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

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
