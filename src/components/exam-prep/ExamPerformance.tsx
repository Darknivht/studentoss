import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Minus, Clock, Target, Zap, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface TopicPerf {
  topicId: string | null;
  topicName: string;
  total: number;
  correct: number;
  pct: number;
  avgTime: number;
}

interface SessionInfo {
  sessionId: string;
  date: string;
  total: number;
  correct: number;
  pct: number;
  totalTime: number;
}

interface DifficultyBreakdown {
  difficulty: string;
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
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [diffBreakdown, setDiffBreakdown] = useState<DifficultyBreakdown[]>([]);
  const [improvementTrend, setImprovementTrend] = useState<number>(0);
  const [bestScore, setBestScore] = useState(0);
  const [avgTimePerQ, setAvgTimePerQ] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      // Fetch attempts with time data
      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select('is_correct, topic_id, created_at, session_id, time_spent_seconds, question_id')
        .eq('user_id', user.id)
        .eq('exam_type_id', examTypeId)
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: true });

      const { data: topics } = await supabase
        .from('exam_topics')
        .select('id, name')
        .eq('subject_id', subjectId);

      // Fetch question difficulties for the attempted questions
      const questionIds = [...new Set((attempts || []).map(a => a.question_id).filter(Boolean))];
      let difficultyMap = new Map<string, string>();
      if (questionIds.length > 0) {
        const { data: questions } = await supabase
          .from('exam_questions')
          .select('id, difficulty')
          .in('id', questionIds.slice(0, 500));
        (questions || []).forEach(q => difficultyMap.set(q.id, q.difficulty));
      }

      const topicMap = new Map<string, string>();
      (topics || []).forEach(t => topicMap.set(t.id, t.name));

      const atts = attempts || [];
      const totalCorrect = atts.filter(a => a.is_correct).length;
      setOverall({ total: atts.length, correct: totalCorrect });

      // Avg time per question
      const timesArr = atts.filter(a => a.time_spent_seconds && a.time_spent_seconds > 0).map(a => a.time_spent_seconds!);
      setAvgTimePerQ(timesArr.length > 0 ? Math.round(timesArr.reduce((a, b) => a + b, 0) / timesArr.length) : 0);

      // Per-topic breakdown with avg time
      const byTopic = new Map<string, { total: number; correct: number; totalTime: number; timeCount: number }>();
      atts.forEach(a => {
        const key = a.topic_id || '_general';
        const prev = byTopic.get(key) || { total: 0, correct: 0, totalTime: 0, timeCount: 0 };
        byTopic.set(key, {
          total: prev.total + 1,
          correct: prev.correct + (a.is_correct ? 1 : 0),
          totalTime: prev.totalTime + (a.time_spent_seconds || 0),
          timeCount: prev.timeCount + (a.time_spent_seconds ? 1 : 0),
        });
      });

      const perfs: TopicPerf[] = [];
      byTopic.forEach((v, k) => {
        perfs.push({
          topicId: k === '_general' ? null : k,
          topicName: k === '_general' ? 'General' : (topicMap.get(k) || 'Unknown Topic'),
          total: v.total,
          correct: v.correct,
          pct: Math.round((v.correct / v.total) * 100),
          avgTime: v.timeCount > 0 ? Math.round(v.totalTime / v.timeCount) : 0,
        });
      });
      perfs.sort((a, b) => a.pct - b.pct);
      setTopicPerfs(perfs);

      // Difficulty breakdown
      const byDiff = new Map<string, { total: number; correct: number }>();
      atts.forEach(a => {
        const diff = (a.question_id && difficultyMap.get(a.question_id)) || 'medium';
        const prev = byDiff.get(diff) || { total: 0, correct: 0 };
        byDiff.set(diff, { total: prev.total + 1, correct: prev.correct + (a.is_correct ? 1 : 0) });
      });
      const diffArr: DifficultyBreakdown[] = [];
      ['easy', 'medium', 'hard'].forEach(d => {
        const v = byDiff.get(d);
        if (v) diffArr.push({ difficulty: d, total: v.total, correct: v.correct, pct: Math.round((v.correct / v.total) * 100) });
      });
      setDiffBreakdown(diffArr);

      // Session history
      const bySession = new Map<string, { date: string; total: number; correct: number; totalTime: number }>();
      atts.forEach(a => {
        const prev = bySession.get(a.session_id) || { date: a.created_at, total: 0, correct: 0, totalTime: 0 };
        bySession.set(a.session_id, {
          date: prev.date < a.created_at ? prev.date : a.created_at,
          total: prev.total + 1,
          correct: prev.correct + (a.is_correct ? 1 : 0),
          totalTime: prev.totalTime + (a.time_spent_seconds || 0),
        });
      });
      const sessionArr: SessionInfo[] = [];
      bySession.forEach((v, k) => {
        sessionArr.push({
          sessionId: k,
          date: v.date,
          total: v.total,
          correct: v.correct,
          pct: Math.round((v.correct / v.total) * 100),
          totalTime: v.totalTime,
        });
      });
      sessionArr.sort((a, b) => b.date.localeCompare(a.date));
      setSessions(sessionArr.slice(0, 10));

      // Best score & improvement trend
      if (sessionArr.length > 0) {
        setBestScore(Math.max(...sessionArr.map(s => s.pct)));
        if (sessionArr.length >= 4) {
          const recent = sessionArr.slice(0, Math.min(5, Math.floor(sessionArr.length / 2)));
          const early = sessionArr.slice(-Math.min(5, Math.floor(sessionArr.length / 2)));
          const recentAvg = recent.reduce((a, b) => a + b.pct, 0) / recent.length;
          const earlyAvg = early.reduce((a, b) => a + b.pct, 0) / early.length;
          setImprovementTrend(Math.round(recentAvg - earlyAvg));
        }
      }

      // Trend data grouped by session date
      const sessionMap = new Map<string, Map<string, { total: number; correct: number }>>();
      atts.forEach(a => {
        const date = a.created_at.split('T')[0];
        if (!sessionMap.has(date)) sessionMap.set(date, new Map());
        const dateMap = sessionMap.get(date)!;
        const ov = dateMap.get('Overall') || { total: 0, correct: 0 };
        dateMap.set('Overall', { total: ov.total + 1, correct: ov.correct + (a.is_correct ? 1 : 0) });
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

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
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
          {/* Overall Score */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-card border border-border text-center">
            <p className="text-4xl font-display font-bold text-foreground">{overallPct}%</p>
            <p className="text-sm text-muted-foreground mt-1">{overall.correct} / {overall.total} questions correct</p>
            <Progress value={overallPct} className="mt-3" />
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4 text-center">
                <Target className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold text-foreground">{sessions.length}</p>
                <p className="text-xs text-muted-foreground">Sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                <p className="text-xl font-bold text-foreground">{bestScore}%</p>
                <p className="text-xs text-muted-foreground">Best Score</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                <p className="text-xl font-bold text-foreground">{avgTimePerQ}s</p>
                <p className="text-xs text-muted-foreground">Avg/Question</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                {improvementTrend >= 0 ? <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-500" /> : <TrendingDown className="w-5 h-5 mx-auto mb-1 text-destructive" />}
                <p className={`text-xl font-bold ${improvementTrend >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                  {improvementTrend > 0 ? '+' : ''}{improvementTrend}%
                </p>
                <p className="text-xs text-muted-foreground">Improvement</p>
              </CardContent>
            </Card>
          </div>

          {/* Radar Chart - Topic Scores */}
          {topicPerfs.length >= 3 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-4 rounded-2xl bg-card border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" />Topic Strengths</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={topicPerfs.map(t => ({ topic: t.topicName.length > 12 ? t.topicName.slice(0, 12) + '…' : t.topicName, score: t.pct, fullMark: 100 }))}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="topic" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar name="Accuracy" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Difficulty Breakdown */}
          {diffBreakdown.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-4 rounded-2xl bg-card border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">By Difficulty</h3>
              <div className="space-y-3">
                {diffBreakdown.map(d => (
                  <div key={d.difficulty} className="flex items-center gap-3">
                    <span className={`text-xs font-medium capitalize w-14 ${d.difficulty === 'easy' ? 'text-green-500' : d.difficulty === 'hard' ? 'text-destructive' : 'text-yellow-500'}`}>{d.difficulty}</span>
                    <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${d.difficulty === 'easy' ? 'bg-green-500' : d.difficulty === 'hard' ? 'bg-destructive' : 'bg-yellow-500'}`} style={{ width: `${d.pct}%` }} />
                    </div>
                    <span className="text-xs font-bold w-12 text-right text-foreground">{d.pct}%</span>
                    <span className="text-xs text-muted-foreground w-14 text-right">({d.correct}/{d.total})</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Trend Chart */}
          {trendData.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="p-4 rounded-2xl bg-card border border-border">
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

          {/* Session History Table */}
          {sessions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="p-4 pb-2">
                <h3 className="text-sm font-semibold text-foreground">Recent Sessions</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs text-center">Questions</TableHead>
                      <TableHead className="text-xs text-center">Score</TableHead>
                      <TableHead className="text-xs text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map(s => (
                      <TableRow key={s.sessionId}>
                        <TableCell className="text-xs">{new Date(s.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs text-center">{s.correct}/{s.total}</TableCell>
                        <TableCell className="text-center">
                          <span className={`text-xs font-bold ${s.pct >= 70 ? 'text-green-500' : s.pct >= 50 ? 'text-yellow-500' : 'text-destructive'}`}>{s.pct}%</span>
                        </TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">{s.totalTime > 0 ? formatTime(s.totalTime) : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          )}

          {/* By Topic */}
          <h3 className="text-sm font-semibold text-foreground pt-2">By Topic</h3>
          <div className="space-y-2">
            {topicPerfs.map((tp, i) => (
              <motion.div key={tp.topicId || i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                <TrendIcon pct={tp.pct} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tp.topicName}</p>
                  <p className="text-xs text-muted-foreground">{tp.correct}/{tp.total} correct {tp.avgTime > 0 ? `• ${tp.avgTime}s avg` : ''}</p>
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
