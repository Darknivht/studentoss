import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, differenceInDays, addDays } from 'date-fns';
import { 
  CalendarDays, Plus, Trash2, Clock, AlertTriangle, 
  CheckCircle, BookOpen, Target
} from 'lucide-react';

interface StudyGoal {
  id: string;
  title: string;
  description: string | null;
  goal_type: string;
  due_date: string;
  priority: string;
  completed: boolean;
  course_id: string | null;
}

interface Course {
  id: string;
  name: string;
  color: string;
}

const SmartScheduler = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [goalType, setGoalType] = useState('exam');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>(addDays(new Date(), 7));
  const [courseId, setCourseId] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchGoalsAndCourses();
    }
  }, [user]);

  const fetchGoalsAndCourses = async () => {
    if (!user) return;

    try {
      const [goalsResult, coursesResult] = await Promise.all([
        supabase
          .from('study_goals')
          .select('*')
          .eq('user_id', user.id)
          .order('due_date', { ascending: true }),
        supabase
          .from('courses')
          .select('id, name, color')
          .eq('user_id', user.id),
      ]);

      setGoals(goalsResult.data || []);
      setCourses(coursesResult.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async () => {
    if (!user || !title || !dueDate) return;

    try {
      const { data, error } = await supabase
        .from('study_goals')
        .insert({
          user_id: user.id,
          title,
          goal_type: goalType,
          priority,
          due_date: dueDate.toISOString(),
          course_id: courseId || null,
        })
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => [...prev, data].sort((a, b) => 
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      ));

      toast({
        title: 'Goal added!',
        description: `Scheduled for ${format(dueDate, 'MMM d, yyyy')}`,
      });

      // Reset form
      setTitle('');
      setGoalType('exam');
      setPriority('medium');
      setDueDate(addDays(new Date(), 7));
      setCourseId('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add goal:', error);
      toast({
        title: 'Failed to add goal',
        variant: 'destructive',
      });
    }
  };

  const toggleComplete = async (goal: StudyGoal) => {
    try {
      await supabase
        .from('study_goals')
        .update({ completed: !goal.completed })
        .eq('id', goal.id);

      setGoals(prev => prev.map(g => 
        g.id === goal.id ? { ...g, completed: !g.completed } : g
      ));

      if (!goal.completed) {
        toast({
          title: 'Goal completed! 🎉',
          description: '+50 XP earned!',
        });

        // Add XP
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_xp')
          .eq('user_id', user!.id)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ total_xp: (profile.total_xp || 0) + 50 })
            .eq('user_id', user!.id);
        }
      }
    } catch (error) {
      console.error('Failed to update goal:', error);
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      await supabase
        .from('study_goals')
        .delete()
        .eq('id', goalId);

      setGoals(prev => prev.filter(g => g.id !== goalId));
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  };

  const getDaysUntil = (dateStr: string) => {
    return differenceInDays(new Date(dateStr), new Date());
  };

  const getUrgencyColor = (days: number, priority: string) => {
    if (days < 0) return 'text-red-500';
    if (days <= 1 || priority === 'urgent') return 'text-red-500';
    if (days <= 3 || priority === 'high') return 'text-orange-500';
    if (days <= 7) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'exam':
        return BookOpen;
      case 'assignment':
        return Target;
      case 'quiz':
        return Clock;
      default:
        return CalendarDays;
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const upcomingGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  return (
    <div className="space-y-6">
      {/* Add Goal Button/Form */}
      {!showAddForm ? (
        <Button onClick={() => setShowAddForm(true)} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Exam or Deadline
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-card border border-border space-y-4"
        >
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              placeholder="e.g., Math Final Exam"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={goalType} onValueChange={setGoalType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {courses.length > 0 && (
            <div className="space-y-2">
              <Label>Course (optional)</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={addGoal} className="flex-1">Add Goal</Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Upcoming Goals */}
      <div className="space-y-3">
        <h3 className="font-medium flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          Upcoming ({upcomingGoals.length})
        </h3>
        {upcomingGoals.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No upcoming exams or deadlines</p>
          </div>
        ) : (
          upcomingGoals.map((goal, idx) => {
            const days = getDaysUntil(goal.due_date);
            const Icon = getTypeIcon(goal.goal_type);
            const course = courses.find(c => c.id === goal.course_id);

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 rounded-xl bg-card border border-border"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleComplete(goal)}
                    className="mt-1 w-5 h-5 rounded-full border-2 border-muted-foreground/30 
                             hover:border-primary transition-colors"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{goal.title}</span>
                      {goal.priority === 'urgent' && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      {course && (
                        <span 
                          className="px-2 py-0.5 rounded-full text-xs"
                          style={{ backgroundColor: `${course.color}20`, color: course.color }}
                        >
                          {course.name}
                        </span>
                      )}
                      <span className={getUrgencyColor(days, goal.priority)}>
                        {days < 0 
                          ? 'Overdue!' 
                          : days === 0 
                          ? 'Today!' 
                          : days === 1 
                          ? 'Tomorrow' 
                          : `${days} days left`}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteGoal(goal.id)}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2 text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Completed ({completedGoals.length})
          </h3>
          {completedGoals.slice(0, 5).map((goal) => (
            <div
              key={goal.id}
              className="p-3 rounded-xl bg-muted/50 border border-border/50 opacity-60"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="line-through">{goal.title}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartScheduler;
