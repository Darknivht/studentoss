import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ExamType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  country: string | null;
  exam_mode: string;
  subjects_required: number;
  time_limit_minutes: number;
  questions_per_subject: number;
  logo_url?: string | null;
}

interface ExamSelectorProps {
  onSelect: (exam: ExamType) => void;
}

const ExamSelector = ({ onSelect }: ExamSelectorProps) => {
  const [exams, setExams] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      const { data } = await supabase
        .from('exam_types')
        .select('*')
        .eq('is_active', true)
        .order('name');
      setExams((data || []).map((d: any) => ({
        ...d,
        exam_mode: d.exam_mode || 'per_subject',
        subjects_required: d.subjects_required || 1,
        time_limit_minutes: d.time_limit_minutes || 60,
        questions_per_subject: d.questions_per_subject || 40,
        logo_url: d.logo_url || null,
      })));
      setLoading(false);
    };
    fetchExams();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-3">📝</p>
        <h3 className="font-semibold text-foreground">No exams available yet</h3>
        <p className="text-sm text-muted-foreground mt-1">Check back soon — exams are being added!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-display font-semibold text-foreground">Choose an Exam</h2>
      <div className="grid grid-cols-1 gap-3">
        {exams.map((exam, i) => (
          <motion.button
            key={exam.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(exam)}
            className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all text-left"
          >
            {exam.logo_url ? (
              <img src={exam.logo_url} alt={exam.name} className="w-10 h-10 rounded-xl object-contain" />
            ) : (
              <span className="text-3xl">{exam.icon || '📝'}</span>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">{exam.name}</h3>
              {exam.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{exam.description}</p>
              )}
              <div className="flex gap-2 mt-1">
                {exam.country && (
                  <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {exam.country}
                  </span>
                )}
                {exam.exam_mode === 'multi_subject' && (
                  <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    Full CBT
                  </span>
                )}
              </div>
            </div>
            <ArrowRight size={18} className="text-muted-foreground" />
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ExamSelector;
