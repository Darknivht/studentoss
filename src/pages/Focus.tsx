import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import PomodoroTimer from '@/components/study/PomodoroTimer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Clock, Target, Shield, Zap, ChevronRight } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface SessionStats {
  today: number;
  week: number;
  total: number;
}

const Focus = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | undefined>();
  const [stats, setStats] = useState<SessionStats>({ today: 0, week: 0, total: 0 });

  useEffect(() => {
    if (user) {
      fetchCourses();
      fetchStats();
    }
  }, [user]);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, name, icon, color')
      .eq('user_id', user?.id);
    setCourses(data || []);
  };

  const fetchStats = async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: allSessions } = await supabase
      .from('pomodoro_sessions')
      .select('completed_at')
      .eq('user_id', user?.id)
      .eq('session_type', 'focus');

    if (allSessions) {
      const today = allSessions.filter((s) => s.completed_at >= todayStart).length;
      const week = allSessions.filter((s) => s.completed_at >= weekStart).length;
      setStats({ today, week, total: allSessions.length });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold text-foreground">Focus Timer</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pomodoro technique for deep work
        </p>
      </motion.header>

      {/* Focus Session Quick Access */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate('/focus-session')}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
              <h3 className="font-semibold text-foreground">Focus Session</h3>
                <p className="text-sm text-muted-foreground">Set a timer & stay focused</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {courses.length > 0 && (
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a course (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No course</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.icon} {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Timer */}
      <PomodoroTimer
        courseId={selectedCourse === 'none' ? undefined : selectedCourse}
        onSessionComplete={fetchStats}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-card border border-border text-center"
        >
          <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
          <p className="text-2xl font-bold text-foreground">{stats.today}</p>
          <p className="text-xs text-muted-foreground">Today</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-2xl bg-card border border-border text-center"
        >
          <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
          <p className="text-2xl font-bold text-foreground">{stats.week}</p>
          <p className="text-xs text-muted-foreground">This Week</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-2xl bg-card border border-border text-center"
        >
          <Target className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </motion.div>
      </div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-4 rounded-2xl bg-muted"
      >
        <h3 className="font-semibold text-sm mb-2">💡 Pomodoro Tips</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Work for 25 minutes, then take a 5-minute break</li>
          <li>• After 4 pomodoros, take a longer 15-minute break</li>
          <li>• Avoid distractions during focus sessions</li>
          <li>• Track your progress to build consistency</li>
        </ul>
      </motion.div>
    </div>
  );
};

export default Focus;
