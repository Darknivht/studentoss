import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Zap, Target, GraduationCap, BarChart3, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ExamSubject {
  id: string;
  name: string;
  icon: string | null;
  topics_count: number;
}

type Mode = 'quick' | 'topic' | 'mock' | 'performance' | 'weakness';

interface SubjectSelectorProps {
  examTypeId: string;
  examName: string;
  onSelectMode: (subject: ExamSubject, mode: Mode) => void;
}

const SubjectSelector = ({ examTypeId, examName, onSelectMode }: SubjectSelectorProps) => {
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ExamSubject | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase
        .from('exam_subjects')
        .select('*')
        .eq('exam_type_id', examTypeId)
        .eq('is_active', true)
        .order('name');
      setSubjects(data || []);
      setLoading(false);
    };
    fetchSubjects();
  }, [examTypeId]);

  const modes: { id: Mode; icon: typeof Zap; label: string; desc: string; color: string }[] = [
    { id: 'quick', icon: Zap, label: 'Quick Practice', desc: '10 questions, untimed', color: '#f59e0b' },
    { id: 'topic', icon: Target, label: 'Topic Practice', desc: 'Pick a topic, 10-20 Qs', color: '#10b981' },
    { id: 'mock', icon: GraduationCap, label: 'Mock Exam', desc: 'Full timed simulation', color: '#ef4444' },
    { id: 'performance', icon: BarChart3, label: 'My Performance', desc: 'Analytics & progress', color: '#3b82f6' },
    { id: 'weakness', icon: AlertTriangle, label: 'Weak Topics', desc: 'AI-identified gaps', color: '#8b5cf6' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-3">📘</p>
        <h3 className="font-semibold text-foreground">No subjects yet for {examName}</h3>
        <p className="text-sm text-muted-foreground mt-1">Subjects are being added by the admin.</p>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setSelected(null)} className="text-sm text-primary font-medium">← Subjects</button>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="text-sm font-semibold text-foreground">{selected.icon} {selected.name}</span>
        </div>
        <h2 className="text-lg font-display font-semibold text-foreground">Choose a Mode</h2>
        <div className="grid grid-cols-1 gap-3">
          {modes.map((mode, i) => (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectMode(selected, mode.id)}
              className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${mode.color}20` }}>
                <mode.icon size={20} style={{ color: mode.color }} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-sm">{mode.label}</h3>
                <p className="text-xs text-muted-foreground">{mode.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-display font-semibold text-foreground">Subjects — {examName}</h2>
      <div className="grid grid-cols-2 gap-3">
        {subjects.map((subj, i) => (
          <motion.button
            key={subj.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelected(subj)}
            className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all text-left"
          >
            <span className="text-2xl">{subj.icon || '📘'}</span>
            <h3 className="font-semibold text-foreground text-sm mt-2">{subj.name}</h3>
            <p className="text-xs text-muted-foreground">{subj.topics_count} topics</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default SubjectSelector;
