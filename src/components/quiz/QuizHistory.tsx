import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Trophy, Clock, CheckCircle, XCircle, Eye, ChevronRight } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer?: number;
  explanation?: string;
}

interface QuizAttempt {
  id: string;
  score: number;
  total_questions: number;
  completed_at: string;
  quiz_data: {
    questions: QuizQuestion[];
    topic?: string;
  };
  course_id: string | null;
  note_id: string | null;
}

export const QuizHistory = () => {
  const { user } = useAuth();
  const [selectedQuiz, setSelectedQuiz] = useState<QuizAttempt | null>(null);

  const { data: quizAttempts, isLoading } = useQuery({
    queryKey: ['quiz-attempts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        quiz_data: item.quiz_data as unknown as QuizAttempt['quiz_data']
      })) as QuizAttempt[];
    },
    enabled: !!user,
  });

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (percentage >= 60) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!quizAttempts?.length) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Quiz History</h3>
          <p className="text-muted-foreground text-sm">
            Complete quizzes to see your past attempts here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Quiz History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {quizAttempts.map((attempt) => {
                const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
                const topic = attempt.quiz_data?.topic || 'Quiz';
                
                return (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/30 hover:border-primary/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedQuiz(attempt)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${getScoreColor(attempt.score, attempt.total_questions)}`}>
                        <Trophy className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{topic}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(attempt.completed_at), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getScoreColor(attempt.score, attempt.total_questions)}>
                        {attempt.score}/{attempt.total_questions} ({percentage}%)
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!selectedQuiz} onOpenChange={() => setSelectedQuiz(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Quiz Review
              {selectedQuiz && (
                <Badge className={getScoreColor(selectedQuiz.score, selectedQuiz.total_questions)}>
                  {selectedQuiz.score}/{selectedQuiz.total_questions}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6">
              {selectedQuiz?.quiz_data?.questions?.map((question, index) => {
                const isCorrect = question.userAnswer === question.correctAnswer;
                const hasAnswered = question.userAnswer !== undefined;
                
                return (
                  <div key={index} className="p-4 rounded-lg bg-background/50 border border-border/30">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-medium">
                        {index + 1}
                      </span>
                      <p className="font-medium text-foreground flex-1">{question.question}</p>
                      {hasAnswered && (
                        isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                        )
                      )}
                    </div>
                    <div className="space-y-2 ml-9">
                      {question.options.map((option, optIndex) => {
                        const isUserAnswer = question.userAnswer === optIndex;
                        const isCorrectAnswer = question.correctAnswer === optIndex;
                        
                        let optionClass = 'p-2 rounded-md text-sm transition-colors ';
                        if (isCorrectAnswer) {
                          optionClass += 'bg-green-500/20 border border-green-500/30 text-green-400';
                        } else if (isUserAnswer && !isCorrectAnswer) {
                          optionClass += 'bg-red-500/20 border border-red-500/30 text-red-400';
                        } else {
                          optionClass += 'bg-muted/30 text-muted-foreground';
                        }
                        
                        return (
                          <div key={optIndex} className={optionClass}>
                            <span className="font-medium mr-2">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            {option}
                            {isCorrectAnswer && (
                              <span className="ml-2 text-xs">(Correct)</span>
                            )}
                            {isUserAnswer && !isCorrectAnswer && (
                              <span className="ml-2 text-xs">(Your answer)</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {question.explanation && (
                      <div className="mt-3 ml-9 p-3 rounded-md bg-primary/10 border border-primary/20">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-primary">Explanation:</span> {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
