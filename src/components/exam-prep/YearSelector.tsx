import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface YearSelectorProps {
  examTypeId: string;
  subjectId: string;
  subjectName: string;
  onSelect: (year: string | null) => void;
  onBack: () => void;
}

const YearSelector = ({ examTypeId, subjectId, subjectName, onSelect, onBack }: YearSelectorProps) => {
  const [years, setYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchYears = async () => {
      const { data } = await supabase
        .from('exam_questions')
        .select('year')
        .eq('exam_type_id', examTypeId)
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .not('year', 'is', null);

      const uniqueYears = [...new Set((data || []).map(d => d.year).filter(Boolean))] as string[];
      uniqueYears.sort((a, b) => b.localeCompare(a));
      setYears(uniqueYears);
      setLoading(false);
    };
    fetchYears();
  }, [examTypeId, subjectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-sm text-primary font-medium">← Back</button>
        <span className="text-muted-foreground text-sm">/</span>
        <span className="text-sm font-semibold text-foreground">{subjectName}</span>
      </div>

      <h2 className="text-lg font-display font-semibold text-foreground">Select Year</h2>

      <div className="grid grid-cols-2 gap-3">
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(null)}
          className="p-4 rounded-2xl bg-primary/10 border border-primary/30 hover:border-primary/50 transition-all text-left"
        >
          <Calendar className="w-6 h-6 text-primary mb-2" />
          <h3 className="font-semibold text-foreground text-sm">All Years</h3>
          <p className="text-xs text-muted-foreground">Practice from all available years</p>
        </motion.button>

        {years.map((year, i) => (
          <motion.button
            key={year}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i + 1) * 0.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(year)}
            className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all text-left"
          >
            <span className="text-2xl">📅</span>
            <h3 className="font-semibold text-foreground text-sm mt-2">{year}</h3>
            <p className="text-xs text-muted-foreground">Past questions</p>
          </motion.button>
        ))}
      </div>

      {years.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">No year-tagged questions available yet for this subject.</p>
        </div>
      )}
    </div>
  );
};

export default YearSelector;
