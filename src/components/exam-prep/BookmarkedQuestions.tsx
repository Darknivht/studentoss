import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Bookmark, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import MarkdownRenderer from '@/components/ui/markdown-renderer';

interface BookmarkedQuestionsProps {
  examTypeId: string;
  subjectId: string;
  subjectName: string;
  onBack: () => void;
}

const BookmarkedQuestions = ({ examTypeId, subjectId, subjectName, onBack }: BookmarkedQuestionsProps) => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      // Get bookmarked question IDs
      const { data: bks } = await supabase
        .from('exam_bookmarks')
        .select('question_id')
        .eq('user_id', user.id);

      if (!bks || bks.length === 0) {
        setLoading(false);
        return;
      }

      const ids = bks.map(b => b.question_id);
      const { data: questions } = await supabase
        .from('exam_questions')
        .select('*')
        .in('id', ids)
        .eq('exam_type_id', examTypeId)
        .eq('subject_id', subjectId)
        .eq('is_active', true);

      setBookmarks(questions || []);
      setLoading(false);
    };
    fetch();
  }, [user, examTypeId, subjectId]);

  const removeBookmark = async (questionId: string) => {
    if (!user) return;
    await supabase.from('exam_bookmarks').delete().eq('user_id', user.id).eq('question_id', questionId);
    setBookmarks(prev => prev.filter(q => q.id !== questionId));
    toast({ title: 'Bookmark removed' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-sm text-primary font-medium">← Back</button>
      <h2 className="text-lg font-display font-semibold text-foreground">
        <Bookmark size={18} className="inline mr-2" />
        Bookmarked — {subjectName}
      </h2>

      {bookmarks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔖</p>
          <h3 className="font-semibold text-foreground">No bookmarks yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Bookmark questions during practice to review them here.</p>
          <Button variant="outline" className="mt-4" onClick={onBack}>Go Back</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map((q, i) => {
            const opts = Array.isArray(q.options) ? q.options : [];
            const revealed = showAnswer[q.id];
            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="p-4 rounded-xl border border-border bg-card space-y-3"
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-foreground flex-1">{q.question}</p>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-destructive" onClick={() => removeBookmark(q.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
                <div className="space-y-1">
                  {opts.map((opt: string, oi: number) => (
                    <p key={oi} className={`text-xs p-1.5 rounded ${revealed && oi === q.correct_index ? 'bg-green-500/10 text-green-600 font-medium' : 'text-muted-foreground'}`}>
                      {String.fromCharCode(65 + oi)}. {opt}
                    </p>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowAnswer(prev => ({ ...prev, [q.id]: !prev[q.id] }))}>
                    {revealed ? 'Hide Answer' : 'Show Answer'}
                  </Button>
                </div>
                {revealed && q.explanation && (
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Explanation</p>
                    <MarkdownRenderer content={q.explanation} className="text-xs" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookmarkedQuestions;
