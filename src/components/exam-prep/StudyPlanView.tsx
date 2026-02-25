import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, BookOpen, Target, Clock, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import MarkdownRenderer from '@/components/ui/markdown-renderer';

interface StudyPlanViewProps {
  examTypeId: string;
  subjectId: string;
  subjectName: string;
  onBack: () => void;
  onPracticeTopic?: (topicId: string) => void;
}

const StudyPlanView = ({ examTypeId, subjectId, subjectName, onBack }: StudyPlanViewProps) => {
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/exam-practice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: 'generate-study-plan',
          exam_type_id: examTypeId,
          subject_id: subjectId,
        }),
      });

      const result = await resp.json();
      if (result.plan) {
        setPlan(typeof result.plan === 'string' ? result.plan : JSON.stringify(result.plan, null, 2));
      } else if (result.error) {
        setPlan(`⚠️ Could not generate plan: ${result.error}`);
      }
      setGenerated(true);
    } catch (err: any) {
      setPlan(`⚠️ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-sm text-primary font-medium">← Back</button>
      <h2 className="text-lg font-display font-semibold text-foreground">
        <Lightbulb size={18} className="inline mr-2" />
        AI Study Plan — {subjectName}
      </h2>

      {!generated && !loading && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <BookOpen size={28} className="text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Personalized Study Plan</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            AI will analyze your performance, identify weak areas, and create a tailored study plan with priorities and recommendations.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Target size={12} /> Weak topic focus</span>
            <span className="flex items-center gap-1"><Clock size={12} /> Time allocation</span>
            <span className="flex items-center gap-1"><BookOpen size={12} /> Mode suggestions</span>
          </div>
          <Button onClick={generatePlan} className="mt-2">Generate My Plan</Button>
        </motion.div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20 flex-col gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing your performance...</p>
        </div>
      )}

      {plan && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-card border border-border">
          <MarkdownRenderer content={plan} className="text-sm" />
        </motion.div>
      )}

      {generated && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={generatePlan} disabled={loading}>Regenerate</Button>
          <Button variant="outline" onClick={onBack}>Back to Modes</Button>
        </div>
      )}
    </div>
  );
};

export default StudyPlanView;
